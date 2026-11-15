/**
 * Athar Al 'Ilm sources gateway.
 * Proxies QuranEnc, HadeethEnc, IslamHouse, fawazahmed0/quran-api (CDN),
 * and Quran.com Content API (timing metadata + Salafi tafsir text only).
 * No HTML scrape; JSON only.
 * shortcut: no cache layer yet — add Redis when traffic warrants it.
 */
import http from "node:http";
import { URL } from "node:url";

const PORT = Number(process.env.ATHAR_GATEWAY_PORT || 9091);
const HOST = process.env.ATHAR_GATEWAY_HOST || "127.0.0.1";
const ISLAMHOUSE_KEY = process.env.ISLAMHOUSE_API_KEY || "";
const TIMEOUT_MS = Number(process.env.ATHAR_FETCH_TIMEOUT_MS || 20000);

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

function json(res, status, body) {
  const raw = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=300",
    "access-control-allow-origin": "*",
  });
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

function buildUpstream(kind, path, searchParams) {
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
    // Prefer env key; fall back to public research key.
    // Live host is api.islamhouse.com (v1 path-key). api3.islamhouse.com is dead.
    const key = ISLAMHOUSE_KEY || "paV29H2gm56kvLP";
    const base = `https://api.islamhouse.com/v1/${key}`;
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

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "content-type",
    });
    return res.end();
  }

  if (req.method !== "GET") {
    return json(res, 405, { error: "method_not_allowed" });
  }

  const url = new URL(req.url || "/", `http://${HOST}`);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  if (pathname === "/" || pathname === "/health") {
    return json(res, 200, {
      service: "athar-gateway",
      ok: true,
      sources: ["quranenc", "hadeethenc", "islamhouse", "dorar", "quranapi", "qurancom"],
      dorar: process.env.DORAR_API_KEY ? "configured" : "token_required",
    });
  }

  // Dorar requires an approved API token — do not scrape dorar.net HTML.
  if (pathname === "/v1/dorar/status" || pathname.startsWith("/v1/dorar/")) {
    const key = process.env.DORAR_API_KEY || "";
    if (!key) {
      return json(res, 501, {
        error: "dorar_token_required",
        source: "dorar",
        message:
          "Set DORAR_API_KEY on the gateway host when Dorar issues an Athar token. No HTML scrape.",
      });
    }
    // shortcut: no Dorar upstream adapter yet — wire when token + docs arrive
    return json(res, 501, {
      error: "dorar_not_wired",
      source: "dorar",
      message: "Token present but upstream adapter not implemented yet.",
    });
  }

  // /v1/quran/...  /v1/hadeeth/...  /v1/islamhouse/...  /v1/quranapi/...  /v1/qurancom/...
  const m = pathname.match(/^\/v1\/(quran|hadeeth|islamhouse|quranapi|qurancom)(\/.*)?$/);
  if (!m) {
    return json(res, 404, {
      error: "not_found",
      hint: "GET /v1/quran/*, /v1/hadeeth/*, /v1/islamhouse/*, /v1/quranapi/*, /v1/qurancom/*, /v1/dorar/status, /health",
    });
  }

  const kind = m[1];
  const path = m[2] || "/";
  const upstream = buildUpstream(kind, path, url.searchParams);
  if (!upstream) {
    return json(res, kind === "qurancom" ? 403 : 400, {
      error: kind === "qurancom" ? "path_not_allowed" : "bad_source",
    });
  }

  try {
    if (kind === "quranapi") {
      let out = await fetchUpstream(upstream.primary);
      if (!out.ok) {
        out = await fetchUpstream(upstream.fallback);
      }
      return json(res, out.ok ? 200 : out.status, {
        source: "quranapi",
        upstream_status: out.status,
        data: out.data,
      });
    }

    const out = await fetchUpstream(upstream);
    return json(res, out.ok ? 200 : out.status, {
      source: kind,
      upstream_status: out.status,
      data: out.data,
    });
  } catch (err) {
    return json(res, 502, {
      error: "upstream_failed",
      source: kind,
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`athar-gateway listening on http://${HOST}:${PORT}`);
});
