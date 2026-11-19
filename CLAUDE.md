# Athar Al 'Ilm — Claude / agent file map (Athar Al 'Ilm base)

Project rules: **`AGENTS.md`**. Workspace parent: `~/AIO Devs/CLAUDE.md`.

## Own this product

Athar Al 'Ilm is a **Tadabbur MIT fork** + Salafi content gateway. Canonical remote: GitHub `atomicbaassas/Athar-Al-Ilm`. Upstream Tadabbur: `mohhomadfarman/Tadabbur`. Live Contabo runs the Tadabbur stack — see **`HANDOFF.md`**.

## High-value paths

| Path | Role |
|---|---|
| `AGENTS.md` | Agent entry |
| `HANDOFF.md` | Cutover / what not to delete |
| `docs/ENGINEERING_CONTRACTS.md` | Binding C-* |
| `docs/SOURCES_SALAFI.md` | Allowed APIs |
| `apps/athar-gateway/` | Salafi JSON proxy |
| `frontend/` | Vue learner + admin |
| `backend/` | Django API / curriculum |
| `docker-compose.dev.yml` | Local stack |

## Do not

- Point AI clients at Yuxor/GPU directly — use `http://127.0.0.1:3456`.
- Commit `.env` or Contabo secrets.
- Reintroduce LearnHouse images/compose on Contabo.
- Force-push rewritten `main` without explicit user ask.
- Treat LLM output as religious source of truth (**C-SRC**).

## UI/UX skills

Taste, a11y, bans, voice, and icon library for this project live in `.ux-profile.md`.
Run `setup-ui-ux-skills` again only to change those defaults.
Before UI or microcopy work, read `.ux-profile.md`, then the matching domain skill (page-patterns, viewports, forms, surfaces, loaders, empty-states, copy, motion).
Before creating a new page, read `page-patterns` and name the pattern. Do not write page markup until the pattern is named.
Layouts must pass `viewports` at 375px and 1280px.
Before finishing UI, run `ux-audit`.
