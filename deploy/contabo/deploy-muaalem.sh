#!/usr/bin/env bash
# Install/run quran-muaalem on Contabo (CPU) for Athar Practice.
# Engine :8000 → App :8001 ← gateway MUAALEM_URL.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HOST="${ATHAR_SSH_HOST:-contabo}"
REMOTE_DIR=/opt/quran-muaalem
REPO_URL="${MUAALEM_REPO_URL:-https://github.com/obadx/quran-muaalem.git}"

echo "==> sync muaalem units + install on $HOST:$REMOTE_DIR"
scp -o BatchMode=yes \
  "$ROOT/deploy/contabo/muaalem-engine.service" \
  "$ROOT/deploy/contabo/muaalem-app.service" \
  "$ROOT/deploy/contabo/patch-muaalem-serve.py" \
  "$HOST:/tmp/"

ssh -o BatchMode=yes "$HOST" "bash -s" <<REMOTE
set -euo pipefail
REMOTE_DIR='$REMOTE_DIR'
REPO_URL='$REPO_URL'

if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="\$HOME/.local/bin:\$PATH"
fi
export PATH="\$HOME/.local/bin:\$PATH"

if [[ ! -d "\$REMOTE_DIR/.git" ]]; then
  git clone --depth 1 "\$REPO_URL" "\$REMOTE_DIR"
else
  cd "\$REMOTE_DIR"
  git fetch --depth 1 origin
  git reset --hard origin/main
fi
cd "\$REMOTE_DIR"

# shortcut: FastAPI Form(enum=) removed upstream of our local pin; patch for Contabo.
python3 - <<'PY'
from pathlib import Path
p = Path("src/quran_muaalem/app/types.py")
t = p.read_text()
old = """            # Use Form with enum, and set annotation to str so FastAPI shows string enum
            form_param = Form(
                str(default), description=field.description, enum=str_enum
            )"""
new = """            # shortcut: FastAPI Form(enum=) unavailable; validate via convert_form_value
            _ = str_enum
            form_param = Form(str(default), description=field.description)"""
if old in t:
    p.write_text(t.replace(old, new))
    print("patched types.py Form(enum)")
elif "Form(str(default), description=field.description)" in t and "enum=str_enum" not in t:
    print("types.py already patched")
else:
    raise SystemExit("types.py Form(enum) patch site not found")
PY

uv venv --python 3.12 .venv
# CPU torch + engine + librosa for audio decode
uv pip install -e ".[engine]" "librosa>=0.11.0" "soundfile>=0.12.1" "numba>=0.61.2"

python3 /tmp/patch-muaalem-serve.py || true

install -m 644 /tmp/muaalem-engine.service /etc/systemd/system/muaalem-engine.service
install -m 644 /tmp/muaalem-app.service /etc/systemd/system/muaalem-app.service
systemctl daemon-reload
systemctl enable muaalem-engine.service muaalem-app.service
systemctl restart muaalem-engine.service
# Wait for engine /docs before app (model download/load)
for i in \$(seq 1 90); do
  if curl -sf -o /dev/null http://127.0.0.1:8000/docs; then
    echo "engine up after \${i}0s-ish"
    break
  fi
  sleep 10
  if [[ \$i -eq 90 ]]; then
    journalctl -u muaalem-engine -n 80 --no-pager || true
    exit 1
  fi
done
systemctl restart muaalem-app.service
# App startup can take a few seconds after uvicorn bind
for i in \$(seq 1 60); do
  if curl -sf -o /dev/null http://127.0.0.1:8001/docs; then
    echo "app up"
    break
  fi
  sleep 2
done
if ! grep -q '^MUAALEM_TIMEOUT_MS=' /root/.athar-secrets/athar-gateway.env 2>/dev/null; then
  echo 'MUAALEM_TIMEOUT_MS=300000' >> /root/.athar-secrets/athar-gateway.env
fi
systemctl restart athar-gateway.service || true
systemctl --no-pager --full status muaalem-engine.service muaalem-app.service || true
curl -sf -o /dev/null -w "engine_docs:%{http_code}\\n" http://127.0.0.1:8000/docs
curl -sf -o /dev/null -w "app_docs:%{http_code}\\n" http://127.0.0.1:8001/docs
curl -sf http://127.0.0.1:9091/health | head -c 400; echo
REMOTE

echo "==> public gateway health"
curl -sf https://atharulilm.or.tz/athar/health | head -c 400; echo
echo "done"
