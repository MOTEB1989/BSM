#!/usr/bin/env bash
set -euo pipefail

# Disable (ignore) all GitHub repository notifications for the authenticated user.
# This script affects only the current account's subscriptions.

API_BASE="https://api.github.com"
PER_PAGE=100
DRY_RUN="${DRY_RUN:-false}"
TOKEN="${GITHUB_TOKEN:-${GH_TOKEN:-}}"
RESP_TMP_FILE="$(mktemp /tmp/gh-subscription-response.XXXXXX)"

trap 'rm -f "$RESP_TMP_FILE"' EXIT INT TERM

if [[ -z "$TOKEN" ]]; then
  echo "[ERROR] Missing token. Set GITHUB_TOKEN or GH_TOKEN from a secure source (never hardcode secrets)." >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "[ERROR] curl is required." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "[ERROR] jq is required." >&2
  exit 1
fi

api_get() {
  local url="$1"
  curl -fsS \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "$url"
}

api_put_ignore() {
  local repo_full_name="$1"
  local url="${API_BASE}/repos/${repo_full_name}/subscription"

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[DRY RUN] Would mute: ${repo_full_name}"
    return 0
  fi

  local http_code
  http_code=$(curl -sS -o "${RESP_TMP_FILE}" -w "%{http_code}" -X PUT \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "${url}" \
    -d '{"subscribed":false,"ignored":true}')

  if [[ "$http_code" =~ ^20[0-9]$ ]]; then
    echo "[OK] Muted ${repo_full_name}"
    return 0
  fi

  local message
  message=$(jq -r '.message // "Unknown API error"' "${RESP_TMP_FILE}" 2>/dev/null || echo "Unknown API error")
  echo "[WARN] Failed ${repo_full_name} (HTTP ${http_code}): ${message}" >&2
  return 1
}

fetch_all_repos() {
  local page=1
  while true; do
    local response
    response=$(api_get "${API_BASE}/user/repos?affiliation=owner,collaborator,organization_member&per_page=${PER_PAGE}&page=${page}")

    local count
    count=$(jq 'length' <<<"$response")
    if [[ "$count" -eq 0 ]]; then
      break
    fi

    jq -r '.[].full_name' <<<"$response"
    page=$((page + 1))
  done
}

main() {
  echo "Fetching repositories for the authenticated account..."
  mapfile -t repos < <(fetch_all_repos)

  if [[ "${#repos[@]}" -eq 0 ]]; then
    echo "No repositories found for this account scope."
    exit 0
  fi

  echo "Found ${#repos[@]} repositories. Applying mute (ignored=true, subscribed=false)..."

  local ok_count=0
  local fail_count=0
  for repo in "${repos[@]}"; do
    if api_put_ignore "$repo"; then
      ok_count=$((ok_count + 1))
    else
      fail_count=$((fail_count + 1))
    fi
  done

  echo "Done. Success: ${ok_count}, Failed: ${fail_count}"
  [[ "$fail_count" -eq 0 ]]
}

main "$@"
