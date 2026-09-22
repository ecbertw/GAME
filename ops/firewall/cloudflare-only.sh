#!/usr/bin/env bash
set -euo pipefail

# Restrict public HTTP(S) access to Cloudflare proxy networks only.
# Run ONLY after confirming eixo.at is proxied (orange cloud) in Cloudflare.

if [ "$(id -u)" -ne 0 ]; then echo "Run with sudo." >&2; exit 1; fi

CF4=(
  173.245.48.0/20
  103.21.244.0/22
  103.22.200.0/22
  103.31.4.0/22
  141.101.64.0/18
  108.162.192.0/18
  190.93.240.0/20
  188.114.96.0/20
  197.234.240.0/22
  198.41.128.0/17
  162.158.0.0/15
  104.16.0.0/13
  104.24.0.0/14
  172.64.0.0/13
  131.0.72.0/22
)
CF6=(
  2400:cb00::/32
  2606:4700::/32
  2803:f800::/32
  2405:b500::/32
  2405:8100::/32
  2a06:98c0::/29
  2c0f:f248::/32
)

echo "Current UFW rules:"
ufw status verbose
echo
read -r -p "Confirm eixo.at is proxied through Cloudflare and continue? [yes/NO] " ans
[ "$ans" = "yes" ] || { echo "Cancelled."; exit 1; }

for net in "${CF4[@]}" "${CF6[@]}"; do
  ufw allow proto tcp from "$net" to any port 80 comment "Cloudflare HTTP"
  ufw allow proto tcp from "$net" to any port 443 comment "Cloudflare HTTPS"
done

# Remove broad HTTP/HTTPS allows after the Cloudflare-specific rules exist.
ufw --force delete allow 80/tcp || true
ufw --force delete allow 443/tcp || true

ufw reload
ufw status verbose
echo
echo "HTTP/HTTPS origin access is now limited to Cloudflare networks."
echo "SSH rule is untouched."