#!/usr/bin/env bash
# Deploy athar-gateway to Contabo and ensure nginx /athar/ location exists.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HOST="${ATHAR_SSH_HOST:-contabo}"
REMOTE_DIR=/opt/athar-gateway

echo "==> sync gateway files to $HOST:$REMOTE_DIR"
ssh -o BatchMode=yes "$HOST" "mkdir -p '$REMOTE_DIR'"
scp -o BatchMode=yes \
  "$ROOT/apps/athar-gateway/server.js" \
  "$ROOT/apps/athar-gateway/package.json" \
  "$HOST:$REMOTE_DIR/"

echo "==> install systemd unit"
scp -o BatchMode=yes \
  "$ROOT/deploy/contabo/athar-gateway.service" \
  "$HOST:/etc/systemd/system/athar-gateway.service"

ssh -o BatchMode=yes "$HOST" 'bash -s' <<'REMOTE'
set -euo pipefail
mkdir -p /root/.athar-secrets
chmod 700 /root/.athar-secrets
ENV=/root/.athar-secrets/athar-gateway.env
if [[ ! -f "$ENV" ]]; then
  cat > "$ENV" <<'EOF'
ATHAR_GATEWAY_HOST=127.0.0.1
ATHAR_GATEWAY_PORT=9091
ISLAMHOUSE_API_KEY=
ATHAR_CORS_ORIGINS=https://atharulilm.or.tz,https://www.atharulilm.or.tz
EOF
fi
chmod 600 "$ENV"
# Upsert missing keys on older hosts without wiping ISLAMHOUSE_API_KEY.
grep -q '^ATHAR_GATEWAY_HOST=' "$ENV" || echo 'ATHAR_GATEWAY_HOST=127.0.0.1' >> "$ENV"
grep -q '^ATHAR_GATEWAY_PORT=' "$ENV" || echo 'ATHAR_GATEWAY_PORT=9091' >> "$ENV"
grep -q '^ISLAMHOUSE_API_KEY=' "$ENV" || echo 'ISLAMHOUSE_API_KEY=' >> "$ENV"
grep -q '^ATHAR_CORS_ORIGINS=' "$ENV" || echo 'ATHAR_CORS_ORIGINS=https://atharulilm.or.tz,https://www.atharulilm.or.tz' >> "$ENV"
# Prefer Admin → Integrations keys via Django internal endpoint (token must match backend .env).
grep -q '^ATHAR_KEYS_URL=' "$ENV" || echo 'ATHAR_KEYS_URL=http://127.0.0.1:8080/api/v1/integrations/internal/keys/' >> "$ENV"
grep -q '^ATHAR_INTERNAL_TOKEN=' "$ENV" || echo 'ATHAR_INTERNAL_TOKEN=' >> "$ENV"

SITE=/etc/nginx/sites-available/atharulilm
if [[ -f "$SITE" ]] && ! grep -q 'location /athar/' "$SITE"; then
  python3 - <<'PY'
from pathlib import Path
path = Path("/etc/nginx/sites-available/atharulilm")
orig = path.read_text()
snippet = """    location /athar/ {
        proxy_pass http://127.0.0.1:9091/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

"""
out = []
i = 0
inserted = 0
while True:
    j = orig.find("location / {", i)
    if j < 0:
        out.append(orig[i:])
        break
    window_start = max(0, j - 120)
    window = orig[window_start:j]
    out.append(orig[i:j])
    if "location /athar/" not in window:
        out.append(snippet)
        inserted += 1
    out.append("location / {")
    i = j + len("location / {")
path.write_text("".join(out))
print(f"inserted /athar/ before {inserted} location / blocks")
PY
  nginx -t
  systemctl reload nginx
fi

systemctl daemon-reload
systemctl enable athar-gateway
systemctl restart athar-gateway
systemctl --no-pager --full status athar-gateway | head -20
curl -sS http://127.0.0.1:9091/health
echo
REMOTE

echo "==> public check"
curl -sS "https://atharulilm.or.tz/athar/health" || true
echo
echo "done"
