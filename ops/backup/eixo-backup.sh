#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DEST="/var/backups/eixo/${STAMP}"
APP="/opt/eixo"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo $0" >&2
  exit 1
fi

install -d -m 700 "$DEST"

echo "[1/5] Git repository bundle..."
git -C "$APP" bundle create "$DEST/eixo-repository.bundle" --all
git -C "$APP" rev-parse HEAD > "$DEST/git-head.txt"
git -C "$APP" status --porcelain=v1 > "$DEST/git-status.txt"

echo "[2/5] PostgreSQL cluster..."
sudo -u postgres pg_dumpall --clean --if-exists > "$DEST/postgresql-all.sql"
chmod 600 "$DEST/postgresql-all.sql"

echo "[3/5] EIXO/server configuration..."
CONFIG_PATHS=()
for p in \
  /etc/eixo \
  /etc/nginx/nginx.conf \
  /etc/nginx/conf.d \
  /etc/nginx/sites-available \
  /etc/nginx/sites-enabled \
  /etc/systemd/system/eixo.service \
  /etc/systemd/system/eixo.service.d \
  /etc/fail2ban \
  /etc/ufw \
  /etc/ssh/sshd_config \
  /etc/ssh/sshd_config.d \
  /etc/sysctl.d/99-eixo-hardening.conf \
  /etc/systemd/resolved.conf.d/99-eixo-hardening.conf
do
  [ -e "$p" ] && CONFIG_PATHS+=("$p")
done

if [ "${#CONFIG_PATHS[@]}" -gt 0 ]; then
  tar -czf "$DEST/system-config.tar.gz" --absolute-names "${CONFIG_PATHS[@]}"
  chmod 600 "$DEST/system-config.tar.gz"
fi

echo "[4/5] Security/service snapshot..."
{
  echo "UTC=$(date -u +%FT%TZ)"
  echo "HOST=$(hostname)"
  echo "KERNEL=$(uname -srmo)"
  echo
  echo "=== EIXO ==="
  systemctl status eixo --no-pager -l || true
  echo
  echo "=== NGINX ==="
  nginx -t 2>&1 || true
  echo
  echo "=== UFW ==="
  ufw status verbose || true
  echo
  echo "=== LISTENERS ==="
  ss -ltnp || true
  echo
  echo "=== FAIL2BAN ==="
  fail2ban-client status || true
} > "$DEST/system-state.txt" 2>&1
chmod 600 "$DEST/system-state.txt"

echo "[5/5] Checksums..."
(
  cd "$DEST"
  sha256sum * > SHA256SUMS
)
chmod -R go-rwx "$DEST"

echo
echo "Backup complete:"
echo "$DEST"
echo "Git HEAD: $(cat "$DEST/git-head.txt")"
echo "Verify with: cd '$DEST' && sha256sum -c SHA256SUMS"
