#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo: sudo bash $0" >&2
  exit 1
fi

install -d -m 700 /etc/eixo
if [ ! -f /etc/eixo/security.env ]; then
  touch /etc/eixo/security.env
fi
chmod 600 /etc/eixo/security.env
chown root:root /etc/eixo/security.env

if ! grep -q '^MFA_ENCRYPTION_KEY=' /etc/eixo/security.env; then
  printf '\nMFA_ENCRYPTION_KEY=%s\n' "$(openssl rand -hex 32)" >> /etc/eixo/security.env
fi

if ! grep -q '^PUBLIC_HOSTS=' /etc/eixo/security.env; then
  printf 'PUBLIC_HOSTS=eixo.at,www.eixo.at,127.0.0.1,localhost\n' >> /etc/eixo/security.env
fi

install -d -m 755 /etc/systemd/system/eixo.service.d
cat >/etc/systemd/system/eixo.service.d/environment.conf <<'EOF'
[Service]
EnvironmentFile=-/etc/eixo/security.env
EOF

systemctl daemon-reload
systemctl restart eixo
sleep 2

PID="$(systemctl show eixo -p MainPID --value)"
if [ -z "$PID" ] || [ "$PID" = "0" ]; then
  echo "EIXO service is not running." >&2
  systemctl status eixo --no-pager -l || true
  exit 1
fi

if tr '\0' '\n' <"/proc/$PID/environ" | grep -q '^MFA_ENCRYPTION_KEY='; then
  echo "MFA_ENCRYPTION_KEY loaded by EIXO: OK"
else
  echo "MFA_ENCRYPTION_KEY is NOT visible to the EIXO process." >&2
  exit 1
fi

curl -fsS -H 'Host: eixo.at' http://127.0.0.1:3000/health
echo
echo "MFA server configuration is ready."
echo "Open EIXO -> ADMIN and complete TOTP enrollment there."
