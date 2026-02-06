#!/usr/bin/env bash
set -euo pipefail

# Cloudflare zone and GitHub Pages challenge details for LexBANK/BSM.
# Note: Zone ID is not highly sensitive and is also present in dns/lexdo-uk-zone.txt
# For additional security, you can set this via CLOUDFLARE_ZONE_ID environment variable
ZONE_ID="${CLOUDFLARE_ZONE_ID:-1c32bc5010d8b0c4a501e8458fd2cc14}"
RECORD_TYPE="TXT"
RECORD_NAME="_github-pages-challenge-LexBANK.lexdo.uk"
RECORD_CONTENT=""  # To be filled with actual challenge value from GitHub
TTL=1

# DNS propagation polling configuration
MAX_PROPAGATION_ATTEMPTS=20
PROPAGATION_SLEEP_SECONDS=15

API_BASE="https://api.cloudflare.com/client/v4"
VERIFY_URL="https://github.com/LexBANK/BSM/settings/pages"

usage() {
  cat <<'USAGE'
Usage:
  bash setup_github_pages_verification.sh <CLOUDFLARE_API_TOKEN> [RECORD_CONTENT]

Arguments:
  CLOUDFLARE_API_TOKEN  Your Cloudflare API token with DNS edit permissions
  RECORD_CONTENT        (Optional) The GitHub Pages challenge value
                        If not provided, it must be set in the script or via
                        GITHUB_PAGES_CHALLENGE environment variable

Tip:
  You can also pass values via environment variables:
  CLOUDFLARE_API_TOKEN=... GITHUB_PAGES_CHALLENGE=... bash setup_github_pages_verification.sh

Example:
  bash setup_github_pages_verification.sh your_api_token abc123def456
USAGE
}

TOKEN="${1:-${CLOUDFLARE_API_TOKEN:-}}"
RECORD_CONTENT="${2:-${GITHUB_PAGES_CHALLENGE:-${RECORD_CONTENT}}}"

if [[ -z "$TOKEN" ]]; then
  echo "Error: CLOUDFLARE_API_TOKEN is required."
  echo
  usage
  exit 1
fi

if [[ -z "$RECORD_CONTENT" ]]; then
  echo "Error: RECORD_CONTENT (GitHub Pages challenge value) is required."
  echo "Get this from: $VERIFY_URL"
  echo
  usage
  exit 1
fi

AUTH_HEADER="Authorization: Bearer ${TOKEN}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: missing required command '$1'."
    exit 1
  fi
}

json_success() {
  python3 -c 'import json,sys; data=json.load(sys.stdin); print("true" if data.get("success") else "false")'
}

# Performs a Cloudflare API call and returns only the response body to stdout.
# On HTTP errors, prints a helpful message (including response body when possible) and exits.
cf_api() {
  local method="$1"
  local path="$2"
  local data="${3:-}"

  local response
  if [[ -n "$data" ]]; then
    response=$(curl -sS -X "$method" "${API_BASE}${path}" \
      -H "${AUTH_HEADER}" \
      -H "Content-Type: application/json" \
      --data "$data" \
      -w $'\n%{http_code}')
  else
    response=$(curl -sS -X "$method" "${API_BASE}${path}" \
      -H "${AUTH_HEADER}" \
      -H "Content-Type: application/json" \
      -w $'\n%{http_code}')
  fi

  local http_code body
  http_code="${response##*$'\n'}"
  body="${response%$'\n'*}"

  if [[ ! "$http_code" =~ ^2 ]]; then
    echo "Cloudflare API request failed (${method} ${path}) with HTTP ${http_code}."
    if [[ -n "$body" ]]; then
      echo "Response body:"
      printf '%s\n' "$body"
    fi
    exit 1
  fi

  printf '%s' "$body"
}

check_token() {
  echo "1) Verifying API token..."

  local response ok
  response=$(cf_api "GET" "/user/tokens/verify")
  ok=$(printf '%s' "$response" | json_success)

  if [[ "$ok" != "true" ]]; then
    echo "Token verification failed. Cloudflare response:"
    printf '%s\n' "$response"
    exit 1
  fi

  echo "✓ Token is valid."
}

get_existing_record_id() {
  local response
  response=$(cf_api "GET" "/zones/${ZONE_ID}/dns_records?type=${RECORD_TYPE}&name=${RECORD_NAME}")

  python3 - <<'PY' "$RECORD_CONTENT" "$response"
import json,sys
expected = sys.argv[1]
data = json.loads(sys.argv[2])
for record in data.get("result", []):
    if record.get("content") == expected:
        print(record.get("id", ""))
        break
PY
}

create_record() {
  echo "2) Creating TXT record in Cloudflare..."

  local payload response ok
  payload=$(cat <<JSON
{"type":"${RECORD_TYPE}","name":"${RECORD_NAME}","content":"${RECORD_CONTENT}","ttl":${TTL}}
JSON
)

  response=$(cf_api "POST" "/zones/${ZONE_ID}/dns_records" "$payload")
  ok=$(printf '%s' "$response" | json_success)

  if [[ "$ok" != "true" ]]; then
    echo "Failed to create TXT record. Cloudflare response:"
    printf '%s\n' "$response"
    exit 1
  fi

  echo "✓ TXT record created."
}

wait_for_dns_propagation() {
  echo "3) Waiting for DNS propagation..."

  for ((attempt=1; attempt<=MAX_PROPAGATION_ATTEMPTS; attempt++)); do
    echo "   Attempt ${attempt}/${MAX_PROPAGATION_ATTEMPTS}..."

    for resolver in "@1.1.1.1" "@8.8.8.8"; do
      local output
      output=$(dig +short "$resolver" TXT "$RECORD_NAME" || true)
      if printf '%s' "$output" | tr -d '"' | grep -Fq "$RECORD_CONTENT"; then
        echo "✓ DNS propagated successfully via ${resolver}."
        return 0
      fi
    done

    sleep "$PROPAGATION_SLEEP_SECONDS"
  done

  echo "⚠ DNS record was created but did not propagate within expected time."
  echo "You can still proceed and verify manually after a few minutes."
}

main() {
  require_cmd curl
  require_cmd dig
  require_cmd python3

  echo "GitHub Pages Verification Setup for LexBANK/BSM"
  echo "==============================================="
  echo "Domain: lexdo.uk"
  echo "Record Name: ${RECORD_NAME}"
  echo "Challenge Value: ${RECORD_CONTENT}"
  echo

  check_token

  local record_id
  record_id=$(get_existing_record_id)

  if [[ -n "$record_id" ]]; then
    echo "2) TXT record already exists with expected value (ID: $record_id)."
  else
    create_record
  fi

  wait_for_dns_propagation

  echo
  echo "Done! Next steps:"
  echo "1. Open GitHub Pages settings: $VERIFY_URL"
  echo "2. Click 'Verify' next to your domain"
  echo "3. GitHub should now detect the TXT record and verify your domain"
}

main
