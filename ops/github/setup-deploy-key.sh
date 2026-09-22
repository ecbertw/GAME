#!/usr/bin/env bash
set -euo pipefail

# Prepare a read-only SSH deploy key for /opt/eixo.
# After running, add the printed public key in:
# GitHub repository -> Settings -> Deploy keys -> Add deploy key
# Leave 'Allow write access' OFF.

APP="/opt/eixo"
KEYDIR="$APP/.deploy"
KEY="$KEYDIR/github_ed25519"

if [ "$(id -u)" -ne 0 ]; then echo "Run with sudo." >&2; exit 1; fi
id eixo >/dev/null 2>&1 || { echo "User eixo not found." >&2; exit 1; }

install -d -o eixo -g eixo -m 700 "$KEYDIR"
if [ ! -f "$KEY" ]; then
  sudo -u eixo ssh-keygen -q -t ed25519 -N "" -C "eixo-vps-readonly-deploy" -f "$KEY"
fi
chown eixo:eixo "$KEY" "$KEY.pub"
chmod 600 "$KEY"
chmod 644 "$KEY.pub"

echo "=== ADD THIS AS A READ-ONLY GITHUB DEPLOY KEY ==="
cat "$KEY.pub"
echo "=================================================="
echo
echo "After adding it in GitHub, run:"
echo "  sudo -u eixo git -C /opt/eixo remote set-url origin git@github.com:ecbertw/GAME.git"
echo "  sudo -u eixo git -C /opt/eixo config core.sshCommand \"ssh -i /opt/eixo/.deploy/github_ed25519 -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new\""
echo "  sudo -u eixo git -C /opt/eixo ls-remote origin HEAD"
