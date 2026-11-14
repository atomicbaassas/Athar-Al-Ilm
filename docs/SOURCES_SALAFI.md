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

## 5. fawazahmed0/quran-api (learner Quran reader)

- CDN: `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1`
- Fallback: `https://raw.githubusercontent.com/fawazahmed0/quran-api/1`
- Gateway: `GET /athar/v1/quranapi/{path}` (auto `.min.json`)
- Examples:
  - `/athar/v1/quranapi/info`
  - `/athar/v1/quranapi/editions/ara-quranuthmanihaf/1`
  - `/athar/v1/quranapi/editions/eng-muhammadtaqiudd/1`
  - `/athar/v1/quranapi/editions/swa-alimuhsinalbarw/1`
- First languages in UI: Arabic mushaf + English + Swahili translations.
- **C-SRC note:** QuranEnc remains the preferred Salafi translation API and still
  has EN/SW keys (`english_*`, `swahili_*`). The `/quran` reader ships on
  fawazahmed0 first for Uthmani mushaf + EN/SW in one edition shape; migrate
  translations to QuranEnc when product wants stricter Salafi-only editions.

## Not wired yet

| Source | Status |
|---|---|
| Tanzil / KFGQPC mushaf as primary | Optional; currently via fawazahmed0 Uthmani Hafs |

## Policy

See **C-SRC** in `ENGINEERING_CONTRACTS.md`.
