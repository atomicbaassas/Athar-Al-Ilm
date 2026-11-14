# Athar Al 'Ilm (أثر العلم) — Agent Instructions

Islamic educational platform on a **Tadabbur MIT fork** (Vue + Django), branded for Ahlul Athar / Athar Al 'Ilm. Live Contabo site may still run the old LearnHouse image until cutover. Binding contracts: **`docs/ENGINEERING_CONTRACTS.md`**. Sources: **`docs/SOURCES_SALAFI.md`**.

## Non-negotiables

- **Salafi sources only** for Quran/Hadith/books: QuranEnc, HadeethEnc, IslamHouse (Dorar when `DORAR_API_KEY` exists). No Quran.com scrapers, no AI-invented religious content as source of truth. See **C-SRC**.
- Content APIs go through **`apps/athar-gateway`** (`/athar/` on prod). Browser never holds IslamHouse/Dorar keys.
- Secrets never committed. Branch first (`feat/`, `fix/`, `chore/`). Push to **origin** only.
- `upstream` = `mohhomadfarman/Tadabbur`. `origin` = `atomicbaassas/Athar-Al-Ilm`.
- Bilingual EN/AR + RTL (**C-I18N**). Keep MIT LICENSE + Tadabbur attribution.

## Stack

| Piece | Where |
|---|---|
| Learner + admin UI | `frontend/` (Vue 3 + Vite) |
| API / curriculum | `backend/` (Django 5 + DRF + MongoDB) |
| Salafi JSON proxy | `apps/athar-gateway` (Node 20+, no deps) |
| Local compose | `docker-compose.dev.yml` |
| Prod host (planned) | Contabo `contabo` + Cloudflare `atharulilm.or.tz` |

## Commands

```bash
# Dev stack
docker compose -f docker-compose.dev.yml up --build

# Athar gateway
cd apps/athar-gateway && node server.js
cd apps/athar-gateway && npm run check
```

## Read next

| Doc | Why |
|---|---|
| `docs/ENGINEERING_CONTRACTS.md` | Binding C-* rules |
| `docs/SOURCES_SALAFI.md` | Allowed APIs |
| `HANDOFF.md` | Cutover state |
| `README.md` | Upstream Tadabbur setup |
