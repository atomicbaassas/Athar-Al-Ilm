# Engineering contracts — Athar Al 'Ilm (Athar Al 'Ilm base)

Amend this file when a rule must change. Code that violates an active contract is a bug.

## C-SRC — Salafi sources

1. Quran translation/tafsir JSON: **QuranEnc** (`quranenc.com/api/v1`) via gateway only for catalog/tafsir-style product surfaces.
2. **C-SRC delta (2026-11-14):** Learner `/quran` reader may use **fawazahmed0/quran-api** via gateway `/athar/v1/quranapi/*` for Arabic mushaf + English/Swahili editions (`ara-quranuthmanihaf`, `eng-muhammadtaqiudd`, `swa-alimuhsinalbarw`). QuranEnc still preferred long-term for Salafi-curated translations (it also exposes EN/SW). Do not call the CDN from the browser for edition JSON. Recitation listen uses EveryAyah HTML5 MP3 (author-recommended companion to quran-api; CORS `*`) — binary audio is not JSON-gateway traffic.
3. Hadith encyclopedia JSON: **HadeethEnc** (`hadeethenc.com/api/v1`) via gateway only.
4. Books / multimedia catalog: **IslamHouse** via gateway only — live base `api.islamhouse.com/v1/{KEY}` (path key). Do not use dead `api3.islamhouse.com`. Published Mongo library rows may store IslamHouse CDN absolute URLs for PDF/cover until MinIO ingest exists.
5. Dorar.net only when `DORAR_API_KEY` is set on the gateway host; never scrape HTML for content. Without a token, gateway returns **501** `dorar_token_required`.
6. Do **not** treat LLM/AI output, Quran.com, or random scrapers as religious source of truth.
7. Browser never holds IslamHouse or Dorar keys; server/gateway only.

## C-GATE — Athar gateway

1. Public path prefix: `/athar/` → gateway; health at `/athar/health`.
2. Gateway binds loopback only on Contabo (`127.0.0.1:9091`).
3. Responses are JSON envelopes `{ source, upstream_status, data }` (except health / Dorar status errors).
4. No write/mutate proxies to upstream; GET only.

## C-DEP — Deploy

1. `git push` ≠ production. Contabo scripts or explicit ssh deploy required.
2. Nginx owns :80/:443. Apps bind loopback. Cloudflare Full (Strict) + Origin CA.
3. LearnHouse GHCR image is **legacy** until Athar Al 'Ilm Athar cutover; do not assume `ghcr.io/atomicbaassas/athar-al-ilm:latest` is the new stack.
4. Gateway deploy path remains `apps/athar-gateway` (scripts to be re-added under `deploy/contabo/` for this tree).

## C-SEC — Secrets

1. No secrets in git. Host env / unit files only.
2. Do not paste admin passwords into committed docs or chat logs that get committed.

## C-I18N — Language

1. Learner-facing chrome must plan for EN + AR (RTL). Do not hard-delete RTL hooks.
2. Source API language params (`ar` / `en`) must remain selectable.

## C-FORK — Upstream

1. `upstream` = `atomicbaassas/Athar-Al-Ilm` (MIT). `origin` = Athar GitHub (`atomicbaassas/Athar-Al-Ilm`).
2. Prefer Athar modules (`apps/athar-gateway`, brand, Salafi pages) over wide Athar Al 'Ilm rewrites.
3. Keep MIT LICENSE and Athar Al 'Ilm attribution. LearnHouse AGPL tree is retired for this product line.
