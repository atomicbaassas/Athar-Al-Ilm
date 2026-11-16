#!/usr/bin/env bash
# Deploy Tadabbur Athar stack to Contabo (compose on :8080; host nginx owns 80/443).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HOST="${ATHAR_SSH_HOST:-contabo}"
REMOTE_DIR=/opt/athar-tadabbur
BRANCH="${ATHAR_DEPLOY_BRANCH:-main}"

echo "==> ensure remote dir + clone/pull on $HOST:$REMOTE_DIR"
ssh -o BatchMode=yes "$HOST" "bash -s" <<REMOTE
set -euo pipefail
mkdir -p '$REMOTE_DIR'
if [[ ! -d '$REMOTE_DIR/.git' ]]; then
  git clone --branch '$BRANCH' --no-single-branch https://github.com/atomicbaassas/Athar-Al-Ilm.git '$REMOTE_DIR'
else
  cd '$REMOTE_DIR'
  # An older clone pinned origin.fetch to feat/tadabbur-athar. That ref is
  # gone, so a plain fetch fails before checkout. Track every branch, then
  # fast-forward the deploy branch only.
  git config --unset-all remote.origin.fetch || true
  git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'
  git fetch origin
  git checkout '$BRANCH'
  git branch --set-upstream-to=origin/'$BRANCH' '$BRANCH'
  git pull --ff-only origin '$BRANCH'
fi
if [[ ! -f '$REMOTE_DIR/.env' ]]; then
  echo "MISSING $REMOTE_DIR/.env — copy from .env.example and set Mongo/secret keys before compose."
  exit 2
fi
cd '$REMOTE_DIR'
docker compose -f docker-compose.prod.yml up -d --build
echo "==> Tadabbur listening on host :8080 (container nginx)"
REMOTE
