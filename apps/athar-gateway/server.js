/**
 * Athar Al 'Ilm sources gateway.
 * Proxies QuranEnc, HadeethEnc, IslamHouse, fawazahmed0/quran-api (CDN),
 * and Quran.com Content API (timing metadata + Salafi tafsir text only).
 * No HTML scrape; JSON only.
 * Keys: Admin → Integrations (via ATHAR_KEYS_URL) preferred; env fallback.
 * shortcut: no cache layer yet — add Redis when traffic warrants it.
 */
import http from "node:http";
import { URL } from "node:url";

const PORT = Number(process.env.ATHAR_GATEWAY_PORT || 9091);
const HOST = process.env.ATHAR_GATEWAY_HOST || "127.0.0.1";
const TIMEOUT_MS = Number(process.env.ATHAR_FETCH_TIMEOUT_MS || 20000);
const KEYS_URL = (process.env.ATHAR_KEYS_URL || "").trim();
const INTERNAL_TOKEN = (process.env.ATHAR_INTERNAL_TOKEN || "").trim();
const KEYS_TTL_MS = Number(process.env.ATHAR_KEYS_TTL_MS || 60000);
/** Local quran-muaalem app (assistive only — not a religious source of truth). */
const MUAALEM_URL = (process.env.MUAALEM_URL || "http://127.0.0.1:8001").replace(
  /\/+$/,
  "",
);
const MUAALEM_TIMEOUT_MS = Number(process.env.MUAALEM_TIMEOUT_MS || 60000);
const CORS_ORIGINS = (
  process.env.ATHAR_CORS_ORIGINS ||
  "https://atharulilm.or.tz,https://www.atharulilm.or.tz,http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const UPSTREAM = {
  quran: "https://quranenc.com/api/v1",
  hadeeth: "https://hadeethenc.com/api/v1",
  // C-SRC delta: learner Quran reader uses fawazahmed0 for AR mushaf + EN/SW
  // (QuranEnc also has EN/SW; Swahili + Uthmani mushaf shipped via this CDN first).
  quranapi: "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1",
  quranapiFallback: "https://raw.githubusercontent.com/fawazahmed0/quran-api/1",
  // Technical audio timestamps + Al-Sa'di tafsir delivery (not a mushaf source).
  qurancom: "https://api.quran.com/api/v4",
};

let keysCache = { islamhouse: "", dorar: "", fetchedAt: 0 };

function envKeys() {
  return {
    islamhouse: (process.env.ISLAMHOUSE_API_KEY || "").trim(),
    dorar: (process.env.DORAR_API_KEY || "").trim(),
  };
}

async function resolveKeys() {
  const fallback = envKeys();
  if (!KEYS_URL || !INTERNAL_TOKEN) {
    return fallback;
  }
  if (Date.now() - keysCache.fetchedAt < KEYS_TTL_MS) {
    return {
      islamhouse: keysCache.islamhouse || fallback.islamhouse,
      dorar: keysCache.dorar || fallback.dorar,
    };
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), Math.min(TIMEOUT_MS, 5000));
    const res = await fetch(KEYS_URL, {
      signal: ctrl.signal,
      headers: {
        accept: "application/json",
        "x-athar-internal-token": INTERNAL_TOKEN,
      },
    });
    clearTimeout(timer);
    if (!res.ok) return fallback;
    const data = await res.json();
    keysCache = {
      islamhouse: String(data.islamhouse_api_key || "").trim(),
      dorar: String(data.dorar_api_key || "").trim(),
      fetchedAt: Date.now(),
    };
    return {
      islamhouse: keysCache.islamhouse || fallback.islamhouse,
      dorar: keysCache.dorar || fallback.dorar,
    };
  } catch {
    return fallback;
  }
}

function allowOrigin(req) {
  const origin = req.headers.origin || "";
  if (origin && CORS_ORIGINS.includes(origin)) return origin;
  return "";
}

function json(res, status, body, req) {
  const raw = JSON.stringify(body);
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=300",
  };
  const origin = allowOrigin(req);
  if (origin) headers["access-control-allow-origin"] = origin;
  res.writeHead(status, headers);
  res.end(raw);
}

async function fetchUpstream(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { accept: "application/json" },
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.slice(0, 500) };
    }
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

function buildUpstream(kind, path, searchParams, keys) {
  if (kind === "quran") {
    const u = new URL(`${UPSTREAM.quran}${path.startsWith("/") ? path : `/${path}`}`);
    searchParams.forEach((v, k) => u.searchParams.set(k, v));
    return u.toString();
  }
  if (kind === "hadeeth") {
    const u = new URL(`${UPSTREAM.hadeeth}${path.startsWith("/") ? path : `/${path}`}`);
    searchParams.forEach((v, k) => u.searchParams.set(k, v));
    return u.toString();
  }
  if (kind === "islamhouse") {
    // Live host is api.islamhouse.com (v1 path-key). api3.islamhouse.com is dead.
    // Key from Admin Integrations (via keys URL) or host env — never commit a fallback.
    if (!keys.islamhouse) return { error: "islamhouse_key_required" };
    const base = `https://api.islamhouse.com/v1/${keys.islamhouse}`;
    const u = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
    searchParams.forEach((v, k) => u.searchParams.set(k, v));
    return u.toString();
  }
  if (kind === "quranapi") {
    // Normalize to .min.json endpoints (CDN prefers min; fallback uses same path).
    let p = path.startsWith("/") ? path : `/${path}`;
    if (!p.endsWith(".json")) {
      p = `${p.replace(/\/+$/, "")}.min.json`;
    } else if (!p.endsWith(".min.json") && p.endsWith(".json")) {
      p = p.replace(/\.json$/, ".min.json");
    }
    return {
      primary: `${UPSTREAM.quranapi}${p}`,
      fallback: `${UPSTREAM.quranapiFallback}${p.replace(/\.min\.json$/, ".json")}`,
    };
  }
  if (kind === "qurancom") {
    // Allowlist: chapter audio + segments, tafsir resources / by_ayah only.
    const p = path.startsWith("/") ? path : `/${path}`;
    const allowed =
      /^\/chapter_recitations\/\d+\/\d+$/.test(p) ||
      /^\/tafsirs\/\d+\/by_ayah\/\d+:\d+$/.test(p) ||
      p === "/resources/tafsirs" ||
      p === "/resources/chapter_reciters";
    if (!allowed) return null;
    const u = new URL(`${UPSTREAM.qurancom}${p}`);
    searchParams.forEach((v, k) => u.searchParams.set(k, v));
    return u.toString();
  }
  return null;
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function proxyMuaalemCorrect(req, res) {
  const contentType = String(req.headers["content-type"] || "");
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return json(
      res,
      415,
      {
        error: "multipart_required",
        source: "muaalem",
        message: "POST multipart/form-data with audio file field `file`.",
      },
      req,
    );
  }
  let body;
  try {
    body = await readRequestBody(req);
  } catch (err) {
    return json(
      res,
      400,
      {
        error: "bad_body",
        source: "muaalem",
        message: err instanceof Error ? err.message : String(err),
      },
      req,
    );
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), MUAALEM_TIMEOUT_MS);
  try {
    const upstream = await fetch(`${MUAALEM_URL}/correct-recitation`, {
      method: "POST",
      headers: { "content-type": contentType },
      body,
      signal: ctrl.signal,
    });
    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.slice(0, 500) };
    }
    return json(
      res,
      upstream.status,
      {
        source: "muaalem",
        upstream_status: upstream.status,
        data,
        advisory:
          "Assistive only. Not a substitute for mushafahah with an authorized teacher. Not a religious source of truth (C-SRC).",
      },
      req,
    );
  } catch (err) {
    return json(
      res,
      502,
      {
        error: "muaalem_unreachable",
        source: "muaalem",
        message: err instanceof Error ? err.message : String(err),
        hint: `Start quran-muaalem app and set MUAALEM_URL (now ${MUAALEM_URL}).`,
      },
      req,
    );
  } finally {
    clearTimeout(timer);
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${HOST}`);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  if (req.method === "OPTIONS") {
    const origin = allowOrigin(req);
    if (!origin) {
      res.writeHead(403, { "content-type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ error: "origin_not_allowed" }));
    }
    const allowPost = pathname === "/v1/muaalem/correct-recitation";
    res.writeHead(204, {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": allowPost
        ? "GET, POST, OPTIONS"
        : "GET, OPTIONS",
      "access-control-allow-headers": "content-type",
    });
    return res.end();
  }

  // C-GATE delta: sole POST exception — loopback muaalem assistive correction.
  if (
    req.method === "POST" &&
    pathname === "/v1/muaalem/correct-recitation"
  ) {
    return proxyMuaalemCorrect(req, res);
  }

  if (req.method !== "GET") {
    return json(res, 405, { error: "method_not_allowed" }, req);
  }

  const keys = await resolveKeys();

  if (pathname === "/" || pathname === "/health") {
    return json(
      res,
      200,
      {
        service: "athar-gateway",
        ok: true,
        sources: [
          "quranenc",
          "hadeethenc",
          "islamhouse",
          "dorar",
          "quranapi",
          "qurancom",
          "muaalem",
        ],
        dorar: keys.dorar ? "configured" : "token_required",
        islamhouse: keys.islamhouse ? "configured" : "key_required",
        muaalem: MUAALEM_URL,
      },
      req,
    );
  }

  // Dorar requires an approved API token — do not scrape dorar.net HTML.
  if (pathname === "/v1/dorar/status" || pathname.startsWith("/v1/dorar/")) {
    if (!keys.dorar) {
      return json(
        res,
        501,
        {
          error: "dorar_token_required",
          source: "dorar",
          message:
            "Set Dorar token in Admin → Integrations (or DORAR_API_KEY on the gateway host). No HTML scrape.",
        },
        req,
      );
    }
    // shortcut: no Dorar upstream adapter yet — wire when token + docs arrive
    return json(
      res,
      501,
      {
        error: "dorar_not_wired",
        source: "dorar",
        message: "Token present but upstream adapter not implemented yet.",
      },
      req,
    );
  }

  // /v1/quran/...  /v1/hadeeth/...  /v1/islamhouse/...  /v1/quranapi/...  /v1/qurancom/...
  const m = pathname.match(/^\/v1\/(quran|hadeeth|islamhouse|quranapi|qurancom)(\/.*)?$/);
  if (!m) {
    return json(
      res,
      404,
      {
        error: "not_found",
        hint: "GET /v1/quran/*, /v1/hadeeth/*, /v1/islamhouse/*, /v1/quranapi/*, /v1/qurancom/*, POST /v1/muaalem/correct-recitation, /v1/dorar/status, /health",
      },
      req,
    );
  }

  const kind = m[1];
  const path = m[2] || "/";
  const upstream = buildUpstream(kind, path, url.searchParams, keys);
  if (upstream && typeof upstream === "object" && upstream.error === "islamhouse_key_required") {
    return json(
      res,
      501,
      {
        error: "islamhouse_key_required",
        source: "islamhouse",
        message:
          "Set IslamHouse key in Admin → Integrations (or ISLAMHOUSE_API_KEY on the gateway host). No committed fallback key.",
      },
      req,
    );
  }
  if (!upstream) {
    return json(
      res,
      kind === "qurancom" ? 403 : 400,
      {
        error: kind === "qurancom" ? "path_not_allowed" : "bad_source",
      },
      req,
    );
  }

  try {
    if (kind === "quranapi") {
      let out = await fetchUpstream(upstream.primary);
      if (!out.ok) {
        out = await fetchUpstream(upstream.fallback);
      }
      return json(
        res,
        out.ok ? 200 : out.status,
        {
          source: "quranapi",
          upstream_status: out.status,
          data: out.data,
        },
        req,
      );
    }

    const out = await fetchUpstream(upstream);
    return json(
      res,
      out.ok ? 200 : out.status,
      {
        source: kind,
        upstream_status: out.status,
        data: out.data,
      },
      req,
    );
  } catch (err) {
    return json(
      res,
      502,
      {
        error: "upstream_failed",
        source: kind,
        message: err instanceof Error ? err.message : String(err),
      },
      req,
    );
  }
});

server.listen(PORT, HOST, () => {
  console.log(`athar-gateway listening on http://${HOST}:${PORT}`);
});
