#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-http://localhost:3001}"
API="${BASE}/api"

pass=0
fail=0

check_http() {
  local name="$1"
  local url="$2"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' "$url")"
  if [[ "$code" == "200" ]]; then
    echo "PASS $name ($code) $url"
    pass=$((pass + 1))
  else
    echo "FAIL $name ($code) $url"
    fail=$((fail + 1))
  fi
}

check_json() {
  local name="$1"
  local url="$2"
  local body
  body="$(curl -s "$url")"
  if echo "$body" | rg -q '^\{|^\['; then
    echo "PASS $name (json) $url"
    pass=$((pass + 1))
  else
    echo "FAIL $name (non-json) $url"
    echo "  body: ${body:0:120}"
    fail=$((fail + 1))
  fi
}

echo "=== Phase 3 public page routes ==="
for path in / /rooms /gallery /about /amenities /attractions /contact /faq /terms /privacy /booking/track /booking/confirmation/TEST; do
  check_http "page$path" "${BASE}${path}"
done

echo
echo "=== Public API endpoints ==="
check_json "pension" "${API}/public/pension"
check_json "site-content" "${API}/public/site-content"
check_json "rooms" "${API}/public/rooms"

echo
echo "=== Booking lookup (seed sample) ==="
lookup_code="$(curl -s -o /dev/null -w '%{http_code}' "${API}/public/bookings/lookup?code=BG-2026-0318&contact=%2B221%2077%20231%208844")"
if [[ "$lookup_code" == "200" ]]; then
  echo "PASS lookup seeded booking ($lookup_code)"
  pass=$((pass + 1))
else
  echo "FAIL lookup seeded booking ($lookup_code)"
  fail=$((fail + 1))
fi

echo
echo "=== Summary ==="
echo "Passed: $pass"
echo "Failed: $fail"
exit "$([[ $fail -eq 0 ]] && echo 0 || echo 1)"
