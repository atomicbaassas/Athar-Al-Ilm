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
- **Audio / listen:** quran-api itself has no recitation JSON. Author recommends
  [EveryAyah](https://everyayah.com/) MP3s
  ([issue #64](https://github.com/fawazahmed0/quran-api/issues/64)); companion
  YouTube chapter maps are in [quran-videos](https://github.com/fawazahmed0/quran-videos)
  (`uploaded/{edition}.txt`). Learner `/quran` uses HTML5 audio from
  `https://everyayah.com/data/{ReciterFolder}/{SSS}{AAA}.mp3` (CORS `*`).
  Default reciter `Alafasy_128kbps`; learner UI offers a verified EveryAyah
  picker (persisted in `localStorage`). `/quran/dua` uses Quran ayat via this
  gateway plus the seeded Hisn Al-Muslim library book (IslamHouse PDF) — no
  invented dua text. Binary audio is **not** proxied through the JSON gateway —
  direct CDN keeps Range streaming intact; text/editions still go through
  `/athar/v1/quranapi/*`.
- **C-SRC note:** QuranEnc remains the preferred Salafi translation API and still
  has EN/SW keys (`english_*`, `swahili_*`). The `/quran` reader ships on
  fawazahmed0 first for Uthmani mushaf + EN/SW in one edition shape; migrate
  translations to QuranEnc when product wants stricter Salafi-only editions.

## 6. Quran.com Content API (timing + Al-Sa'di tafsir delivery)

- Base: `https://api.quran.com/api/v4`
- Gateway: `GET /athar/v1/qurancom/{path}` (**allowlisted** paths only)
- Allowed:
  - `/chapter_recitations/{reciterId}/{chapter}?segments=true` — chapter MP3 URL +
    verse/word timestamps (technical timing metadata; not a mushaf source)
  - `/tafsirs/91/by_ayah/{sura}:{aya}` — **Al-Sa'di** Arabic tafsir text
  - `/resources/tafsirs`, `/resources/chapter_reciters` — discovery
- Word-by-word highlight on `/quran` uses reciter **7** (Al-Afasy murattal)
  segments. EveryAyah has **no** word timestamps; when word-sync is off the
  learner falls back to EveryAyah per-ayah MP3s.
- **C-SRC:** mushaf/translation text still comes from quran-api / QuranEnc.
  Quran.com is used here for verified audio clocks + Salafi tafsir payload only.

## Not wired yet

| Source | Status |
|---|---|
| Tanzil / KFGQPC mushaf as primary | Optional; currently via fawazahmed0 Uthmani Hafs |

## Policy

See **C-SRC** in `ENGINEERING_CONTRACTS.md`.
