#!/usr/bin/env bash
set -euo pipefail

WEB_BASE="${1:-http://localhost:3001}"
API_BASE="${2:-http://localhost:5000}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

pass=0
fail=0

check_http() {
  local name="$1"
  local url="$2"
  local expected="${3:-200}"
  local use_auth="${4:-0}"
  local code
  if [[ "$use_auth" == "1" ]]; then
    code="$(curl -s -o /dev/null -w '%{http_code}' -b "$COOKIE_JAR" "$url")"
  else
    code="$(curl -s -o /dev/null -w '%{http_code}' "$url")"
  fi
  if [[ "$code" == "$expected" ]]; then
    echo "PASS $name ($code) $url"
    pass=$((pass + 1))
  else
    echo "FAIL $name ($code, expected $expected) $url"
    fail=$((fail + 1))
  fi
}

check_json_field() {
  local name="$1"
  local url="$2"
  local pattern="$3"
  local body
  body="$(curl -s "$url")"
  if echo "$body" | rg -q "$pattern"; then
    echo "PASS $name $url"
    pass=$((pass + 1))
  else
    echo "FAIL $name $url"
    echo "  expected pattern: $pattern"
    echo "  body: ${body:0:200}"
    fail=$((fail + 1))
  fi
}

echo "=== Login (admin) ==="
login_code="$(curl -s -c "$COOKIE_JAR" -o /dev/null -w '%{http_code}' \
  -X POST "$API_BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"admin123"}')"
if [[ "$login_code" == "201" || "$login_code" == "200" ]]; then
  echo "PASS admin login ($login_code)"
  pass=$((pass + 1))
else
  echo "FAIL admin login ($login_code)"
  fail=$((fail + 1))
fi

echo
echo "=== CMS API (authenticated) ==="
for path in \
  /cms/pages \
  /cms/global \
  /cms/pages/home \
  /cms/pages/rooms \
  /cms/pages/about \
  /cms/pages/contact \
  /cms/pages/gallery \
  /cms/pages/amenities \
  /cms/pages/attractions \
  /cms/pages/faq \
  /cms/gallery \
  /cms/amenities \
  /cms/faqs \
  /cms/attractions; do
  check_http "cms$path" "$API_BASE$path" "200" "1"
done

echo
echo "=== CMS web routes (redirect to login without cookie) ==="
check_http "web /cms" "$WEB_BASE/cms" "307"
check_http "web /cms/global" "$WEB_BASE/cms/global" "307"

echo
echo "=== Seeded public site content ==="
check_json_field "site tagline" "$WEB_BASE/api/public/site-content" '"tagline":"Quiet comfort above the city"'
check_json_field "gallery items" "$WEB_BASE/api/public/site-content" '"gallery":\['
check_json_field "amenities items" "$WEB_BASE/api/public/site-content" '"amenities":\['
check_json_field "faq items" "$WEB_BASE/api/public/site-content" '"faqs":\['
check_json_field "cancellation policy" "$WEB_BASE/api/public/site-content" 'Free cancellation until 48 hours'
check_json_field "contact phone" "$WEB_BASE/api/public/site-content" '\+221 77 000 9988'

echo
echo "=== CMS page completion flags ==="
pages_body="$(curl -s -b "$COOKIE_JAR" "$API_BASE/cms/pages")"
for slug in home rooms about contact gallery amenities attractions faq; do
  if echo "$pages_body" | rg -q "\"slug\":\"$slug\".*\"isComplete\":true"; then
    echo "PASS cms page complete: $slug"
    pass=$((pass + 1))
  else
    echo "FAIL cms page complete: $slug"
    fail=$((fail + 1))
  fi
done

echo
echo "=== Summary ==="
echo "Passed: $pass"
echo "Failed: $fail"

if [[ "$fail" -gt 0 ]]; then
  exit 1
fi
