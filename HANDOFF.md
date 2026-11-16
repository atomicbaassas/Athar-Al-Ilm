# HANDOFF — Athar Al 'Ilm (Tadabbur)

**Date:** 2026-11-16  
**Branch:** `main`  
**Workspace:** `~/AIO Devs/.worktrees/Athar-Al-Ilm/feat-tadabbur`

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

## 2026-11-16 — Resend + audit harden (deployed `e7a08d6e`)

- Resend SMTP on Contabo `.env` + Mongo `EmailSettings` (`smtp.resend.com:465`, from `ops@atharulilm.or.tz`)
- Receiving MX at Cloudflare apex → `receive-euw1.forge.rmta.net` (inbox `ops@`)
- Gateway: `ISLAMHOUSE_API_KEY` + CORS on host; admin passwords in `/root/.athar-secrets/admin-credentials` only

## Still open

- Migrate `/quran` translations to QuranEnc when product wants stricter Salafi-only editions
- Wire more Salafi learner pages to `/athar/` gateway; strip AI-as-source of truth
- Ingest library PDFs into MinIO instead of hotlinking IslamHouse CDN
- Optionally archive or delete duplicate checkout `~/AIO Devs/Athar Alilm` (canonical worktree is feat-tadabbur)
- Dorar token still unset (`dorar_token_required`); Athar-owned IslamHouse key when issued (host research key for now)
