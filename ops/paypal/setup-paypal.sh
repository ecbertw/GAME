#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo: sudo bash $0" >&2
  exit 1
fi

install -d -m 700 /etc/eixo
touch /etc/eixo/security.env
chmod 600 /etc/eixo/security.env
chown root:root /etc/eixo/security.env

read -r -p "PayPal mode [sandbox/live] (default sandbox): " MODE
MODE="${MODE:-sandbox}"
case "$MODE" in sandbox|live) ;; *) echo "Invalid mode." >&2; exit 1;; esac
read -r -p "PayPal Client ID: " CLIENT_ID
read -r -s -p "PayPal Client Secret: " CLIENT_SECRET
echo
read -r -p "PayPal Webhook ID (leave blank until created): " WEBHOOK_ID

[ -n "$CLIENT_ID" ] || { echo "Client ID is required." >&2; exit 1; }
[ -n "$CLIENT_SECRET" ] || { echo "Client Secret is required." >&2; exit 1; }

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
grep -Ev '^(PAYPAL_MODE|PAYPAL_CLIENT_ID|PAYPAL_CLIENT_SECRET|PAYPAL_WEBHOOK_ID)=' /etc/eixo/security.env >"$TMP" || true
{
  cat "$TMP"
  printf 'PAYPAL_MODE=%s\n' "$MODE"
  printf 'PAYPAL_CLIENT_ID=%s\n' "$CLIENT_ID"
  printf 'PAYPAL_CLIENT_SECRET=%s\n' "$CLIENT_SECRET"
  [ -n "$WEBHOOK_ID" ] && printf 'PAYPAL_WEBHOOK_ID=%s\n' "$WEBHOOK_ID"
} >/etc/eixo/security.env
chmod 600 /etc/eixo/security.env
chown root:root /etc/eixo/security.env

install -d -m 755 /etc/systemd/system/eixo.service.d
cat >/etc/systemd/system/eixo.service.d/environment.conf <<'EOF'
[Service]
EnvironmentFile=-/etc/eixo/security.env
EOF

systemctl daemon-reload
systemctl restart eixo
sleep 2

PID="$(systemctl show eixo -p MainPID --value)"
for key in PAYPAL_MODE PAYPAL_CLIENT_ID PAYPAL_CLIENT_SECRET; do
  if tr '\0' '\n' <"/proc/$PID/environ" | grep -q "^$key="; then
    echo "$key loaded: OK"
  else
    echo "$key NOT loaded." >&2
    exit 1
  fi
done

curl -fsS -H 'Host: eixo.at' http://127.0.0.1:3000/health
echo
echo "PayPal environment loaded. Keep PAYPAL_MODE=sandbox until all test payments pass."
