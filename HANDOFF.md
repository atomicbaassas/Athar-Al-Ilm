# HANDOFF — Athar Al 'Ilm (Tadabbur)

**Date:** 2026-11-17  
**Branch:** `main` only (no feature branches / no git worktrees)  
**Workspace:** `~/AIO Devs/Athar Alilm`

## Decision

Product base is **Athar Al 'Ilm / Tadabbur** (Vue 3 + Django 5 + Mongo) + Salafi gateway. LearnHouse AGPL stack is **retired**.

## Live

- Contabo: `/opt/athar-tadabbur` compose on `127.0.0.1:8080`
- Host nginx `atharulilm` proxies `/` → `:8080` (upstream `atharulilm_app`)
- Gateway `/athar/` → `:9091`; secrets in `/root/.athar-secrets/`
- Public site: Cloudflare `atharulilm.or.tz`

## 2026-11-16 — LearnHouse removed

- GitHub `main` force-updated to Tadabbur tip `37570599` (old LearnHouse tip discarded).
- Contabo: `docker compose down --volumes` for project `learnhouse-6def1056`; removed `/root/.learnhouse`, LearnHouse volumes, and `ghcr.io/atomicbaassas/athar-al-ilm` + `ghcr.io/learnhouse/app` images.
- Secrets moved `/root/.learnhouse-secrets` → `/root/.athar-secrets`; systemd unit updated.
- Local: wiped untracked LearnHouse leftovers under `~/AIO Devs/Athar Alilm`; that checkout’s `upstream` now points at Tadabbur (not LearnHouse).

## 2026-11-17 — UI/UX responsive + a11y (merged `#1` → `e3cb7295` / tip `e5c95b7`)

- Squash-merged `fix/ui-ux-responsive-a11y` (contrast, admin tables, RTL, touch targets, modal a11y).
- Single local clone: `~/AIO Devs/Athar Alilm` on `origin/main` (`.worktrees/Athar-Al-Ilm` removed).
- Contabo app: `deploy/contabo/deploy-tadabbur.sh` → `/opt/athar-tadabbur`.
- Contabo gateway: `deploy/contabo/deploy-gateway.sh`; public `/athar/health` ok (`islamhouse=configured`, `dorar=token_required`).
- GitHub Actions Deploy secrets set; Deploy green on Contabo tip.
- Live spot-check @375/320: home hero contrast ~20:1, no horizontal overflow on `/`, `/login`, `/learn`, `/library`.

## 2026-11-16 — Resend + audit harden (deployed `e7a08d6e`)

- Resend SMTP on Contabo `.env` + Mongo `EmailSettings` (`smtp.resend.com:465`, from `ops@atharulilm.or.tz`)
- Receiving MX at Cloudflare apex → `receive-euw1.forge.rmta.net` (inbox `ops@`)
- Gateway: `ISLAMHOUSE_API_KEY` + CORS on host; admin passwords in `/root/.athar-secrets/admin-credentials` only
- Superadmin **Admin → Integrations** stores IslamHouse / Dorar / Resend / YouTube keys (masked); gateway pulls via `ATHAR_KEYS_URL` + `ATHAR_INTERNAL_TOKEN`

## 2026-11-17 — Quran Practice (muaalem) + dock UI

- Practice mode: listen → read-back via gateway `POST /v1/muaalem/correct-recitation` (assistive only; C-SRC advisory).
- Browser mic → 16 kHz WAV (`practiceAudio.js`) before muaalem (webm caused 500).
- Unified player dock (play↔mic), quieter Quran chrome, EN/SW/AR cycle, overlay surah drawer on mobile.
- `apps/athar-cli` practice helpers; gateway muaalem proxy + Vite `/athar` rewrite.
- Deploy: Contabo app (`deploy-tadabbur.sh` / Actions on `main`) + `deploy-gateway.sh` for muaalem routes.

## 2026-11-17 — Contabo muaalem running

- Host path: `/opt/quran-muaalem` (obadx/quran-muaalem), CPU (`ACCELERATOR=cpu`, `DTYPE=float32`).
- systemd: `muaalem-engine` (:8000) + `muaalem-app` (127.0.0.1:8001). Install/update: `deploy/contabo/deploy-muaalem.sh`.
- Patch: `deploy/contabo/patch-muaalem-serve.py` (Form enum + engine timeout 180s + PhoneticSearch startup warmup).
- Gateway: `MUAALEM_TIMEOUT_MS=300000` in `/root/.athar-secrets/athar-gateway.env`.
- Verified: public `POST https://atharulilm.or.tz/athar/v1/muaalem/correct-recitation` with Al-Fatiha WAV → **200** (~8s). UFW does not expose :8000/:8001.

## Still open

- Migrate `/quran` translations to QuranEnc when product wants stricter Salafi-only editions
- Wire more Salafi learner pages to `/athar/` gateway; strip AI-as-source of truth
- Ingest library PDFs into MinIO instead of hotlinking IslamHouse CDN
- Dorar token still unset (`dorar_token_required`); Athar-owned IslamHouse key when issued (host research key for now)
