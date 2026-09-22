#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-https://eixo.at}"
LOAD="${2:-}"
PASS=0; FAIL=0

green(){ printf "\033[32mPASS\033[0m %s\n" "$1"; PASS=$((PASS+1)); }
red(){ printf "\033[31mFAIL\033[0m %s\n" "$1"; FAIL=$((FAIL+1)); }
check_code(){ local expected="$1" url="$2"; shift 2; local code; code="$(curl -k -sS -o /dev/null -w "%{http_code}" --max-time 10 "$@" "$url" || true)"; [ "$code" = "$expected" ] && green "$url -> $code" || red "$url -> $code (expected $expected)"; }

echo "EIXO security audit against: $BASE"
echo

# 1) Public surface
check_code 200 "$BASE/"
for p in server.js auth-server.js server-start.js package.json README.md .git/HEAD .env ops/nginx/eixo-security.conf.example; do
  check_code 404 "$BASE/$p"
done

# 2) Security headers
H="$(curl -k -sSI --max-time 10 "$BASE/" || true)"
HTTP_CODE="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 "http://eixo.at/" || true)"
case "$HTTP_CODE" in 301|302|307|308) green "HTTP redirects to HTTPS ($HTTP_CODE)";; *) red "HTTP returned $HTTP_CODE instead of redirect";; esac
for h in "strict-transport-security:" "content-security-policy:" "x-content-type-options: nosniff" "x-frame-options: DENY" "referrer-policy:"; do
  if printf "%s" "$H" | tr "[:upper:]" "[:lower:]" | grep -q "$(printf "%s" "$h" | tr "[:upper:]" "[:lower:]")"; then green "header $h"; else red "missing/weak header $h"; fi
done

# TLS edge checks
if timeout 8 openssl s_client -connect eixo.at:443 -servername eixo.at -tls1_2 </dev/null >/dev/null 2>&1; then green "TLS 1.2 accepted"; else red "TLS 1.2 connection failed"; fi
if timeout 8 openssl s_client -connect eixo.at:443 -servername eixo.at -tls1_3 </dev/null >/dev/null 2>&1; then green "TLS 1.3 accepted"; else red "TLS 1.3 connection failed"; fi
if timeout 8 openssl s_client -connect eixo.at:443 -servername eixo.at -tls1_1 </dev/null >/dev/null 2>&1; then red "obsolete TLS 1.1 is still accepted"; else green "TLS 1.1 rejected"; fi
CERT="$(timeout 8 openssl s_client -connect eixo.at:443 -servername eixo.at </dev/null 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null || true)"
[ -n "$CERT" ] && green "TLS certificate readable: $CERT" || red "TLS certificate check failed"

# 3) Unsafe HTTP methods / host / CSRF
TRACE="$(curl -k -sS -o /dev/null -w "%{http_code}" -X TRACE --max-time 10 "$BASE/" || true)"
case "$TRACE" in 405|403|404) green "TRACE blocked ($TRACE)";; *) red "TRACE returned $TRACE";; esac
HOSTCODE="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 -H "Host: evil.example" http://127.0.0.1:3000/ || true)"
[ "$HOSTCODE" = "421" ] && green "invalid Host blocked by Node" || red "invalid Host -> $HOSTCODE (expected 421)"
CSRFCODE="$(curl -k -sS -o /dev/null -w "%{http_code}" --max-time 10 -X POST -H "Origin: https://evil.example" -H "Content-Type: application/json" --data "{}" "$BASE/api/auth/login" || true)"
[ "$CSRFCODE" = "403" ] && green "cross-site POST blocked" || red "cross-site POST -> $CSRFCODE (expected 403)"

# 4) Local services
if ss -ltn | grep -qE "127\.0\.0\.1:3000|\[::1\]:3000"; then green "Node bound to loopback"; else red "Node is not loopback-only"; fi
if ss -ltn | grep -qE "127\.0\.0\.1:5432|\[::1\]:5432"; then green "PostgreSQL bound to loopback"; else red "PostgreSQL is not loopback-only"; fi
if ! ss -ltn | grep -qE "0\.0\.0\.0:3000|\[::\]:3000"; then green "Node not publicly listening"; else red "Node port 3000 publicly listening"; fi
if ! ss -ltn | grep -qE "0\.0\.0\.0:5432|\[::\]:5432"; then green "PostgreSQL not publicly listening"; else red "PostgreSQL port 5432 publicly listening"; fi

# 5) Service/security config
nginx -t >/tmp/eixo-nginx-test 2>&1 && green "nginx -t" || { red "nginx -t"; cat /tmp/eixo-nginx-test; }
NGX="$(nginx -T 2>/dev/null || true)"
printf "%s" "$NGX" | grep -qE 'proxy_pass[[:space:]]+http://127\.0\.0\.1:3000' && green "Nginx proxies only to local Node" || red "Nginx local proxy target not confirmed"
printf "%s" "$NGX" | grep -q 'real_ip_header CF-Connecting-IP' && green "Cloudflare real visitor IP configured" || red "Cloudflare real_ip_header missing"
printf "%s" "$NGX" | grep -q 'limit_req_zone.*eixo_auth' && green "Nginx auth rate-limit zone loaded" || red "Nginx auth rate-limit zone missing"
ufw status | grep -q "Status: active" && green "UFW active" || red "UFW inactive"
if ufw status | grep -Eq '^80/tcp[[:space:]]+ALLOW IN[[:space:]]+Anywhere$|^443/tcp[[:space:]]+ALLOW IN[[:space:]]+Anywhere
if [ -f /etc/eixo/security.env ]; then
  MODE="$(stat -c "%a" /etc/eixo/security.env)"
  [ "$MODE" = "600" ] && green "/etc/eixo/security.env mode 600" || red "/etc/eixo/security.env mode $MODE (expected 600)"
else red "/etc/eixo/security.env missing"; fi

# 6) PostgreSQL hardening
LA="$(sudo -u postgres psql -Atqc "SHOW listen_addresses;" 2>/dev/null || true)"
[ "$LA" = "localhost" ] && green "PostgreSQL listen_addresses=localhost" || red "PostgreSQL listen_addresses=$LA"
PE="$(sudo -u postgres psql -Atqc "SHOW password_encryption;" 2>/dev/null || true)"
[ "$PE" = "scram-sha-256" ] && green "PostgreSQL SCRAM-SHA-256" || red "PostgreSQL password_encryption=$PE"

# 7) Optional bounded resilience test — intentionally not a DDoS flood
if [ "$LOAD" = "--load" ]; then
  echo
  echo "Running bounded local load check: 300 requests, max concurrency 15..."
  START="$(date +%s)"
  seq 1 300 | xargs -P15 -I{} sh -c 'curl -sS --max-time 3 -o /dev/null http://127.0.0.1:3000/health || exit 1'
  END="$(date +%s)"
  green "bounded local load completed in $((END-START))s"
fi

echo
echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ]; then
  red "Origin HTTP/HTTPS is still allowed from Anywhere (Cloudflare can be bypassed)"
else
  green "No broad IPv4 origin allow for HTTP/HTTPS"
fi
fail2ban-client status sshd >/dev/null 2>&1 && green "Fail2ban sshd jail active" || red "Fail2ban sshd jail missing"
SSHD="$(sshd -T 2>/dev/null || true)"
printf "%s\n" "$SSHD" | grep -q '^permitrootlogin no
  MODE="$(stat -c "%a" /etc/eixo/security.env)"
  [ "$MODE" = "600" ] && green "/etc/eixo/security.env mode 600" || red "/etc/eixo/security.env mode $MODE (expected 600)"
else red "/etc/eixo/security.env missing"; fi

# 6) PostgreSQL hardening
LA="$(sudo -u postgres psql -Atqc "SHOW listen_addresses;" 2>/dev/null || true)"
[ "$LA" = "localhost" ] && green "PostgreSQL listen_addresses=localhost" || red "PostgreSQL listen_addresses=$LA"
PE="$(sudo -u postgres psql -Atqc "SHOW password_encryption;" 2>/dev/null || true)"
[ "$PE" = "scram-sha-256" ] && green "PostgreSQL SCRAM-SHA-256" || red "PostgreSQL password_encryption=$PE"

# 7) Optional bounded resilience test — intentionally not a DDoS flood
if [ "$LOAD" = "--load" ]; then
  echo
  echo "Running bounded local load check: 300 requests, max concurrency 15..."
  START="$(date +%s)"
  seq 1 300 | xargs -P15 -I{} sh -c 'curl -sS --max-time 3 -o /dev/null http://127.0.0.1:3000/health || exit 1'
  END="$(date +%s)"
  green "bounded local load completed in $((END-START))s"
fi

echo
echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ] && green "SSH root login disabled" || red "SSH PermitRootLogin is not no"
printf "%s\n" "$SSHD" | grep -q '^passwordauthentication no
  MODE="$(stat -c "%a" /etc/eixo/security.env)"
  [ "$MODE" = "600" ] && green "/etc/eixo/security.env mode 600" || red "/etc/eixo/security.env mode $MODE (expected 600)"
else red "/etc/eixo/security.env missing"; fi

# 6) PostgreSQL hardening
LA="$(sudo -u postgres psql -Atqc "SHOW listen_addresses;" 2>/dev/null || true)"
[ "$LA" = "localhost" ] && green "PostgreSQL listen_addresses=localhost" || red "PostgreSQL listen_addresses=$LA"
PE="$(sudo -u postgres psql -Atqc "SHOW password_encryption;" 2>/dev/null || true)"
[ "$PE" = "scram-sha-256" ] && green "PostgreSQL SCRAM-SHA-256" || red "PostgreSQL password_encryption=$PE"

# 7) Optional bounded resilience test — intentionally not a DDoS flood
if [ "$LOAD" = "--load" ]; then
  echo
  echo "Running bounded local load check: 300 requests, max concurrency 15..."
  START="$(date +%s)"
  seq 1 300 | xargs -P15 -I{} sh -c 'curl -sS --max-time 3 -o /dev/null http://127.0.0.1:3000/health || exit 1'
  END="$(date +%s)"
  green "bounded local load completed in $((END-START))s"
fi

echo
echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ] && green "SSH password authentication disabled" || red "SSH password authentication is still enabled"
printf "%s\n" "$SSHD" | grep -q '^pubkeyauthentication yes
  MODE="$(stat -c "%a" /etc/eixo/security.env)"
  [ "$MODE" = "600" ] && green "/etc/eixo/security.env mode 600" || red "/etc/eixo/security.env mode $MODE (expected 600)"
else red "/etc/eixo/security.env missing"; fi

# 6) PostgreSQL hardening
LA="$(sudo -u postgres psql -Atqc "SHOW listen_addresses;" 2>/dev/null || true)"
[ "$LA" = "localhost" ] && green "PostgreSQL listen_addresses=localhost" || red "PostgreSQL listen_addresses=$LA"
PE="$(sudo -u postgres psql -Atqc "SHOW password_encryption;" 2>/dev/null || true)"
[ "$PE" = "scram-sha-256" ] && green "PostgreSQL SCRAM-SHA-256" || red "PostgreSQL password_encryption=$PE"

# 7) Optional bounded resilience test — intentionally not a DDoS flood
if [ "$LOAD" = "--load" ]; then
  echo
  echo "Running bounded local load check: 300 requests, max concurrency 15..."
  START="$(date +%s)"
  seq 1 300 | xargs -P15 -I{} sh -c 'curl -sS --max-time 3 -o /dev/null http://127.0.0.1:3000/health || exit 1'
  END="$(date +%s)"
  green "bounded local load completed in $((END-START))s"
fi

echo
echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ] && green "SSH public-key authentication enabled" || red "SSH public-key authentication not confirmed"
if [ -f /etc/eixo/security.env ]; then
  MODE="$(stat -c "%a" /etc/eixo/security.env)"
  [ "$MODE" = "600" ] && green "/etc/eixo/security.env mode 600" || red "/etc/eixo/security.env mode $MODE (expected 600)"
else red "/etc/eixo/security.env missing"; fi

# 6) PostgreSQL hardening
LA="$(sudo -u postgres psql -Atqc "SHOW listen_addresses;" 2>/dev/null || true)"
[ "$LA" = "localhost" ] && green "PostgreSQL listen_addresses=localhost" || red "PostgreSQL listen_addresses=$LA"
PE="$(sudo -u postgres psql -Atqc "SHOW password_encryption;" 2>/dev/null || true)"
[ "$PE" = "scram-sha-256" ] && green "PostgreSQL SCRAM-SHA-256" || red "PostgreSQL password_encryption=$PE"

# 7) Optional bounded resilience test — intentionally not a DDoS flood
if [ "$LOAD" = "--load" ]; then
  echo
  echo "Running bounded local load check: 300 requests, max concurrency 15..."
  START="$(date +%s)"
  seq 1 300 | xargs -P15 -I{} sh -c 'curl -sS --max-time 3 -o /dev/null http://127.0.0.1:3000/health || exit 1'
  END="$(date +%s)"
  green "bounded local load completed in $((END-START))s"
fi

echo
echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ]