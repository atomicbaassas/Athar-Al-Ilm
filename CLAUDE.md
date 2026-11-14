# Athar Al 'Ilm — Claude / agent file map (Athar Al 'Ilm base)

Project rules: **`AGENTS.md`**. Workspace parent: `~/AIO Devs/CLAUDE.md`.

## Own this product

Athar Al 'Ilm is now a **Athar Al 'Ilm MIT fork** + Salafi content gateway. Canonical remote: GitHub `atomicbaassas/Athar-Al-Ilm`. Upstream: `atomicbaassas/Athar-Al-Ilm`. Live Contabo may still serve the old LearnHouse image until cutover — see **`HANDOFF.md`**.

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
- Tear down Contabo LearnHouse until Athar Al 'Ilm Athar is verified.
- Force-push rewritten `main` without explicit user ask.
- Treat LLM output as religious source of truth (**C-SRC**).
