#!/usr/bin/env bash
set -euo pipefail
APP="/opt/eixo"

if [ "$(id -u)" -ne 0 ]; then echo "Run with sudo." >&2; exit 1; fi
sudo -u eixo git -C "$APP" config core.fileMode false
PREV="$(sudo -u eixo git -C "$APP" rev-parse HEAD)"
echo "Current: $PREV"

if [ -n "$(sudo -u eixo git -C "$APP" status --porcelain --untracked-files=no)" ]; then
  echo "Tracked local changes exist; refusing deploy." >&2
  sudo -u eixo git -C "$APP" status --short
  exit 1
fi

echo "[1/5] Pull main"
sudo -u eixo git -C "$APP" pull --ff-only origin main
NEW="$(sudo -u eixo git -C "$APP" rev-parse HEAD)"
echo "New: $NEW"

echo "[2/5] Dependencies"
cd "$APP"
sudo -u eixo npm install --omit=dev --ignore-scripts --package-lock=false

echo "[3/5] Syntax"
for f in server.js auth-server.js server-start.js paypal-server.js paypal-checkout.js ui.js vip-fix.js jump-server.js jump-physics.js jump.js; do node --check "$APP/$f"; done
node --test "$APP/tests/jump.test.js"

echo "[4/5] Restart"
systemctl restart eixo
sleep 3

echo "[5/5] Health and exposure checks"
if ! curl -fsS -H "Host: eixo.at" http://127.0.0.1:3000/health >/tmp/eixo-health; then
  echo "Health failed. Rolling back to $PREV" >&2
  systemctl stop eixo || true
  sudo -u eixo git -C "$APP" reset --hard "$PREV"
  cd "$APP"; sudo -u eixo npm install --omit=dev --ignore-scripts --package-lock=false
  systemctl start eixo
  exit 1
fi
cat /tmp/eixo-health; echo

for p in server.js auth-server.js server-start.js paypal-server.js jump-server.js package.json .git/HEAD .env; do
  code="$(curl -sS -o /dev/null -w "%{http_code}" -H "Host: eixo.at" "http://127.0.0.1:3000/$p")"
  if [ "$code" != "404" ]; then
    echo "SECURITY CHECK FAILED: /$p returned $code" >&2
    exit 1
  fi
done

systemctl is-active --quiet eixo
echo "Deploy OK: $NEW"