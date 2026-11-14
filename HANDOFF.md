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

## What was NOT done (on purpose)

- Contabo / live `https://atharulilm.or.tz` still LearnHouse image — **not torn down**
- GitHub `main` / `feat/athar-foundation` LearnHouse history **not force-rewritten**
- Old checkout at `~/AIO Devs/Athar Alilm` **not deleted**
- No commit/push yet
- No Athar brand skin on Tadabbur UI yet
- No Contabo deploy scripts for Django/Vue stack yet

## Next cutover steps

1. Brand Tadabbur UI as Athar Al 'Ilm (EN/AR)
2. Wire learner routes to `/athar/` gateway (kill AI-as-source paths)
3. `docker compose -f docker-compose.dev.yml up --build` smoke
4. Push `feat/tadabbur-athar` when ready; cut Contabo only after green local
5. Only then retire LearnHouse container + optional delete old checkout
