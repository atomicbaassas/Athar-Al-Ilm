# HANDOFF — Athar → Tadabbur reset

**Date:** 2026-11-14  
**Branch:** `feat/tadabbur-athar`  
**Workspace:** `~/AIO Devs/.worktrees/Athar-Al-Ilm/feat-tadabbur`

## Decision

Product base switched from LearnHouse AGPL fork to **Tadabbur** (Vue 3 + Django 5 + Mongo). Salafi gateway kept.

## What changed locally

- Fresh clone of `mohhomadfarman/Tadabbur` as Athar working tree
- Remotes: `origin` → `atomicbaassas/Athar-Al-Ilm`, `upstream` → Tadabbur
- Carried `apps/athar-gateway` + `docs/SOURCES_SALAFI.md` + contracts (rewritten)
- Agent root moved to this worktree

## Live (2026-11-14)

- Branch pushed: `feat/tadabbur-athar` → origin
- Contabo: `/opt/athar-tadabbur` compose on `127.0.0.1:8080`
- Host nginx `atharulilm` proxies `/` → `:8080` (was LearnHouse `:9080`)
- Gateway still `/athar/` → `:9091` (healthy)
- Celery redis-py bumped; SSG first build used `SSG_ALLOW_FALLBACK=1`
- UI title still **Tadabbur** branding — Athar skin pending
- LearnHouse containers still running on `:9080` but **not** public

## Still open

- Athar brand / EN-AR chrome on Vue
- Wire Salafi pages to gateway; strip AI-as-source of truth
- Retire LearnHouse containers when stable
- Do **not** force-rewrite GitHub `main` without explicit ask
- Old checkout `~/AIO Devs/Athar Alilm` still on disk
