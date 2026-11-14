# Salafi content sources

Wired via `apps/athar-gateway`. Public base: `https://atharulilm.or.tz/athar`.

## 1. QuranEnc

- Base: `https://quranenc.com/api/v1`
- Gateway: `GET /athar/v1/quran/{path}`
- Examples:
  - `/athar/v1/quran/translations/list`
  - `/athar/v1/quran/translation/sura/{translation_key}/{sura}`
  - `/athar/v1/quran/translation/aya/{translation_key}/{sura}/{aya}`

Prefer Salafi-aligned translation keys from the list endpoint (verify labels before featuring in UI).

## 2. HadeethEnc

- Base: `https://hadeethenc.com/api/v1`
- Gateway: `GET /athar/v1/hadeeth/{path}`
- Examples:
  - `/athar/v1/hadeeth/languages`
  - `/athar/v1/hadeeth/categories/list/?language=ar`
  - `/athar/v1/hadeeth/hadeeths/list/?language=ar&category_id=…`

## 3. IslamHouse

- Base: `https://api.islamhouse.com/v1/{KEY}` (path includes key)
- Gateway: `GET /athar/v1/islamhouse/{path}`
- Env: `ISLAMHOUSE_API_KEY` (host). Fallback public research key only if unset.
- Examples:
  - `/athar/v1/islamhouse/main/sitecontent/ar/ar/json`
  - `/athar/v1/islamhouse/main/books/ar/ar/1/25/json/`
  - `/athar/v1/islamhouse/main/get-item/{id}/ar/json/`
- Alternate catalog (not proxied yet): `https://cnt.islamhouse.com/api/v1/books/list-books?locale=ar`

Filter featured books to known Salafi publishers/authors in product UI — API is broad.

## 4. Dorar

- Gateway: `GET /athar/v1/dorar/status`
- Requires host env `DORAR_API_KEY`. Without it the gateway returns **501** `dorar_token_required` (no HTML scrape).
- Upstream adapter ships after an Athar token is issued.

## Not wired yet

| Source | Status |
|---|---|
| Tanzil / KFGQPC mushaf | Optional Arabic text layer |

## Policy

See **C-SRC** in `ENGINEERING_CONTRACTS.md`.
