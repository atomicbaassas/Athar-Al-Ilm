# HANDOFF — Athar → Athar Al 'Ilm reset

**Date:** 2026-11-14  
**Branch:** `feat/tadabbur-athar`  
**Workspace:** `~/AIO Devs/.worktrees/Athar-Al-Ilm/feat-tadabbur`

## Decision

Product base switched from LearnHouse AGPL fork to **Athar Al 'Ilm** (Vue 3 + Django 5 + Mongo). Salafi gateway kept.

## What changed locally

- Fresh clone of `atomicbaassas/Athar-Al-Ilm` as Athar working tree
- Remotes: `origin` → `atomicbaassas/Athar-Al-Ilm`, `upstream` → Athar Al 'Ilm
- Carried `apps/athar-gateway` + `docs/SOURCES_SALAFI.md` + contracts (rewritten)
- Agent root moved to this worktree

## Live (2026-11-14)

- Branch pushed: `feat/tadabbur-athar` → origin
- Contabo: `/opt/athar-tadabbur` compose on `127.0.0.1:8080`
- Host nginx `atharulilm` proxies `/` → `:8080` (was LearnHouse `:9080`)
- Gateway still `/athar/` → `:9091` (healthy)
- Celery redis-py bumped; SSG first build used `SSG_ALLOW_FALLBACK=1`
- UI title still **Athar Al 'Ilm** branding — Athar skin pending
- LearnHouse containers still running on `:9080` but **not** public

## 2026-11-14 — Quran + logo + library seed

- UI chrome uses `/logo-mark.svg` (Quiet Mihrab mark). OG/Twitter still `/logo-rounded.png` (1200×630 card).
- Library empty on live because Mongo `books` collection had no published rows (API `[]`, not a routing bug). Fix: `python manage.py seed_library` + absolute IslamHouse CDN URLs in `cover_key`/`pdf_key`.
- Quran tab → `/quran`; gateway `/athar/v1/quranapi/*` → fawazahmed0 CDN (AR/EN/SW). Listen uses EveryAyah HTML5 MP3 (Alafasy) per quran-api guidance — not gateway JSON. See **C-SRC delta** in `docs/ENGINEERING_CONTRACTS.md`.
- Header/footer/launch show locale lockup: EN `Athar Al 'Ilm` / AR `أثر العلم` beside `/logo-mark.svg` via `vue-i18n` (`athar-locale`).

## Still open

- Migrate `/quran` translations to QuranEnc when product wants stricter Salafi-only editions
- Wire more Salafi learner pages to `/athar/` gateway; strip AI-as-source of truth
- Ingest library PDFs into MinIO instead of hotlinking IslamHouse CDN
- Retire LearnHouse containers when stable
- Do **not** force-rewrite GitHub `main` without explicit ask
- Old checkout `~/AIO Devs/Athar Alilm` still on disk
