#!/usr/bin/env bash
set -u

BASE="${1:-https://eixo.at}"
LOAD="${2:-}"
PASS=0
FAIL=0

green(){ printf "\033[32mPASS\033[0m %s\n" "$1"; PASS=$((PASS+1)); }
red(){ printf "\033[31mFAIL\033[0m %s\n" "$1"; FAIL=$((FAIL+1)); }

check_code(){
  local expected="$1"
  local url="$2"
  shift 2
  local code
  code="$(curl -k -sS -o /dev/null -w "%{http_code}" --max-time 10 "$@" "$url" 2>/dev/null || true)"
  if [ "$code" = "$expected" ]; then
    green "$url -> $code"
  else
    red "$url -> $code (expected $expected)"
  fi
}

echo "EIXO security audit against: $BASE"
echo

# 1) Public HTTP surface
check_code 200 "$BASE/"
for p in server.js auth-server.js server-start.js package.json README.md .git/HEAD .env ops/nginx/eixo-security.conf.example; do
  check_code 404 "$BASE/$p"
done

# 2) Redirects and security headers
H="$(curl -k -sSI --max-time 10 "$BASE/" 2>/dev/null || true)"
HTTP_CODE="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 "http://eixo.at/" 2>/dev/null || true)"
case "$HTTP_CODE" in
  301|302|307|308) green "HTTP redirects to HTTPS ($HTTP_CODE)" ;;
  *) red "HTTP returned $HTTP_CODE instead of redirect" ;;
esac

for h in   "strict-transport-security:"   "content-security-policy:"   "x-content-type-options: nosniff"   "x-frame-options: DENY"   "referrer-policy:"
do
  if printf "%s" "$H" | tr "[:upper:]" "[:lower:]" | grep -q "$(printf "%s" "$h" | tr "[:upper:]" "[:lower:]")"; then
    green "header $h"
  else
    red "missing/weak header $h"
  fi
done

# 3) TLS checks at the public edge
if timeout 8 openssl s_client -connect eixo.at:443 -servername eixo.at -tls1_2 </dev/null >/dev/null 2>&1; then
  green "TLS 1.2 accepted"
else
  red "TLS 1.2 connection failed"
fi
if timeout 8 openssl s_client -connect eixo.at:443 -servername eixo.at -tls1_3 </dev/null >/dev/null 2>&1; then
  green "TLS 1.3 accepted"
else
  red "TLS 1.3 connection failed"
fi
if timeout 8 openssl s_client -connect eixo.at:443 -servername eixo.at -tls1_1 </dev/null >/dev/null 2>&1; then
  red "obsolete TLS 1.1 is still accepted"
else
  green "TLS 1.1 rejected"
fi
CERT="$(timeout 8 openssl s_client -connect eixo.at:443 -servername eixo.at </dev/null 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null || true)"
if [ -n "$CERT" ]; then green "TLS certificate readable: $CERT"; else red "TLS certificate check failed"; fi

# 4) Request-method, Host and CSRF protections
TRACE="$(curl -k -sS -o /dev/null -w "%{http_code}" -X TRACE --max-time 10 "$BASE/" 2>/dev/null || true)"
case "$TRACE" in
  405|403|404) green "TRACE blocked ($TRACE)" ;;
  *) red "TRACE returned $TRACE" ;;
esac

HOSTCODE="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 -H "Host: evil.example" http://127.0.0.1:3000/ 2>/dev/null || true)"
if [ "$HOSTCODE" = "421" ]; then green "invalid Host blocked by Node"; else red "invalid Host -> $HOSTCODE (expected 421)"; fi

CSRFCODE="$(curl -k -sS -o /dev/null -w "%{http_code}" --max-time 10 -X POST -H "Origin: https://evil.example" -H "Content-Type: application/json" --data "{}" "$BASE/api/auth/login" 2>/dev/null || true)"
if [ "$CSRFCODE" = "403" ]; then green "cross-site POST blocked"; else red "cross-site POST -> $CSRFCODE (expected 403)"; fi

# 5) Local service exposure
if ss -ltn | grep -qE "127\.0\.0\.1:3000|\[::1\]:3000"; then green "Node bound to loopback"; else red "Node is not loopback-only"; fi
if ss -ltn | grep -qE "127\.0\.0\.1:5432|\[::1\]:5432"; then green "PostgreSQL bound to loopback"; else red "PostgreSQL is not loopback-only"; fi
if ! ss -ltn | grep -qE "0\.0\.0\.0:3000|\[::\]:3000"; then green "Node not publicly listening"; else red "Node port 3000 publicly listening"; fi
if ! ss -ltn | grep -qE "0\.0\.0\.0:5432|\[::\]:5432"; then green "PostgreSQL not publicly listening"; else red "PostgreSQL port 5432 publicly listening"; fi

# 6) Nginx, firewall and Fail2ban
if nginx -t >/tmp/eixo-nginx-test 2>&1; then
  green "nginx -t"
else
  red "nginx -t"
  cat /tmp/eixo-nginx-test
fi

NGX="$(nginx -T 2>/dev/null || true)"
if printf "%s" "$NGX" | grep -qE 'proxy_pass[[:space:]]+http://127\.0\.0\.1:3000'; then green "Nginx proxies only to local Node"; else red "Nginx local proxy target not confirmed"; fi
if printf "%s" "$NGX" | grep -q 'real_ip_header CF-Connecting-IP'; then green "Cloudflare real visitor IP configured"; else red "Cloudflare real_ip_header missing"; fi
if printf "%s" "$NGX" | grep -q 'limit_req_zone.*eixo_auth'; then green "Nginx auth rate-limit zone loaded"; else red "Nginx auth rate-limit zone missing"; fi

if ufw status | grep -q "Status: active"; then green "UFW active"; else red "UFW inactive"; fi
if ufw status | grep -Eq '^(80|443)/tcp[[:space:]]+ALLOW IN[[:space:]]+Anywhere'; then
  red "Origin HTTP/HTTPS is still allowed from Anywhere (Cloudflare can be bypassed)"
else
  green "Origin HTTP/HTTPS has no broad Anywhere rule"
fi

if fail2ban-client status sshd >/dev/null 2>&1; then green "Fail2ban sshd jail active"; else red "Fail2ban sshd jail missing"; fi

# 7) SSH hardening
SSHD="$(sshd -T 2>/dev/null || true)"
if printf "%s\n" "$SSHD" | grep -q '^permitrootlogin no$'; then green "SSH root login disabled"; else red "SSH PermitRootLogin is not no"; fi
if printf "%s\n" "$SSHD" | grep -q '^passwordauthentication no$'; then green "SSH password authentication disabled"; else red "SSH password authentication is still enabled"; fi
if printf "%s\n" "$SSHD" | grep -q '^pubkeyauthentication yes$'; then green "SSH public-key authentication enabled"; else red "SSH public-key authentication not confirmed"; fi

# 8) EIXO secret file
if [ -f /etc/eixo/security.env ]; then
  MODE="$(stat -c "%a" /etc/eixo/security.env 2>/dev/null || true)"
  if [ "$MODE" = "600" ]; then green "/etc/eixo/security.env mode 600"; else red "/etc/eixo/security.env mode $MODE (expected 600)"; fi
else
  red "/etc/eixo/security.env missing"
fi

# 9) PostgreSQL hardening
LA="$(sudo -u postgres psql -Atqc "SHOW listen_addresses;" 2>/dev/null || true)"
if [ "$LA" = "localhost" ]; then green "PostgreSQL listen_addresses=localhost"; else red "PostgreSQL listen_addresses=$LA"; fi
PE="$(sudo -u postgres psql -Atqc "SHOW password_encryption;" 2>/dev/null || true)"
if [ "$PE" = "scram-sha-256" ]; then green "PostgreSQL SCRAM-SHA-256"; else red "PostgreSQL password_encryption=$PE"; fi

# 10) Optional bounded local resilience test.
# This is deliberately not an Internet-facing DDoS flood.
if [ "$LOAD" = "--load" ]; then
  echo
  echo "Running bounded local load check: 600 requests, max concurrency 20..."
  START="$(date +%s)"
  if seq 1 600 | xargs -P20 -I{} sh -c 'curl -fsS --max-time 3 -o /dev/null http://127.0.0.1:3000/health'; then
    END="$(date +%s)"
    green "bounded local load completed in $((END-START))s"
  else
    red "bounded local load produced request failures"
  fi
fi

echo
echo "PASS=$PASS FAIL=$FAIL"
if [ "$FAIL" -eq 0 ]; then
  exit 0
fi
exit 1
