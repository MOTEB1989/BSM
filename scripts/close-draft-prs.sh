#!/bin/bash

# BSM - Close Draft PRs Script
# Dynamic selection using gh filters + preview/dry-run before one confirmation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

require_gh() {
  if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
  fi

  if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub CLI.${NC}"
    echo "Run: gh auth login"
    exit 1
  fi
}

build_pr_search_query() {
  local query_parts=()

  # Optional: author filter
  [[ -n "${PR_AUTHOR:-}" ]] && query_parts+=("author:${PR_AUTHOR}")

  # Optional: draft-only filter (default true)
  if [[ "${PR_DRAFT_ONLY:-true}" == "true" ]]; then
    query_parts+=("draft:true")
  fi

  # Optional: stale threshold in days
  if [[ -n "${PR_STALE_DAYS:-}" ]]; then
    if [[ "${PR_STALE_DAYS}" =~ ^[0-9]+$ ]]; then
      local cutoff_date
      cutoff_date="$(date -u -d "${PR_STALE_DAYS} days ago" +%Y-%m-%d 2>/dev/null || true)"
      [[ -n "${cutoff_date}" ]] && query_parts+=("updated:<${cutoff_date}")
    else
      echo -e "${YELLOW}Warning: PR_STALE_DAYS is invalid. Ignoring.${NC}"
    fi
  fi

  # Optional: label filter
  [[ -n "${PR_LABEL:-}" ]] && query_parts+=("label:${PR_LABEL}")

  # Optional: arbitrary extra query
  [[ -n "${PR_SEARCH_EXTRA:-}" ]] && query_parts+=("${PR_SEARCH_EXTRA}")

  echo "${query_parts[*]}"
}

fetch_prs_json() {
  local search_query="$1"
  gh pr list \
    --state open \
    --limit "${PR_LIMIT:-200}" \
    --search "$search_query" \
    --json number,title,author,isDraft,updatedAt
}

print_preview() {
  local prs_json="$1"
  python3 - <<'PY' "$prs_json"
import json, sys
items = json.loads(sys.argv[1])
print(f"Total PRs to close (preview): {len(items)}")
if not items:
    print("No PRs matched the current filters.")
else:
    for pr in items:
        author = (pr.get("author") or {}).get("login", "unknown")
        print(f"  - PR #{pr['number']}: {pr['title']} | author={author} | draft={pr.get('isDraft')} | updated={pr.get('updatedAt')}")
PY
}

extract_pr_numbers() {
  local prs_json="$1"
  python3 - <<'PY' "$prs_json"
import json, sys
for pr in json.loads(sys.argv[1]):
    print(pr["number"])
PY
}

count_items() {
  local items_json="$1"
  python3 - <<'PY' "$items_json"
import json, sys
print(len(json.loads(sys.argv[1])))
PY
}

main() {
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}BSM Draft PR Closure Script${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""

  require_gh

  local search_query prs_json total
  search_query="$(build_pr_search_query)"

  echo -e "${BLUE}Filters:${NC}"
  echo "  - state: open"
  echo "  - search: ${search_query:-<none>}"
  echo ""

  prs_json="$(fetch_prs_json "$search_query")"
  total="$(count_items "$prs_json")"

  echo -e "${BLUE}Preview (dry-run):${NC}"
  print_preview "$prs_json"
  echo ""

  if [[ "$total" -eq 0 ]]; then
    echo -e "${YELLOW}No matching PRs. Nothing to do.${NC}"
    exit 0
  fi

  if [[ "${AUTO_CONFIRM:-no}" != "yes" ]]; then
    echo -e "${YELLOW}Dry-run complete. This will now close ${total} PR(s).${NC}"
    read -r -p "Do you want to continue? (yes/no): " CONFIRM
    [[ "$CONFIRM" == "yes" ]] || { echo -e "${RED}Operation cancelled.${NC}"; exit 0; }
  fi

  local closure_message="${PR_CLOSURE_MESSAGE:-Closing this PR as part of automated repository cleanup based on configured filters.}"
  local closed_count=0 failed_count=0

  echo ""
  echo -e "${GREEN}Executing close operation...${NC}"
  while read -r pr_number; do
    [[ -z "$pr_number" ]] && continue
    echo -ne "Closing PR #${pr_number}... "
    if gh pr close "$pr_number" --comment "$closure_message" 2>/dev/null; then
      echo -e "${GREEN}✓ Closed${NC}"
      ((closed_count+=1))
    else
      echo -e "${RED}✗ Failed${NC}"
      ((failed_count+=1))
    fi
    sleep 1
  done < <(extract_pr_numbers "$prs_json")

  echo ""
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}Summary${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo "Matched in preview: $total"
  echo "Successfully closed: $closed_count"
  echo "Failed or skipped: $failed_count"

  if [[ "${OUTPUT_COUNTS_ONLY:-no}" == "yes" ]]; then
    echo "CLOSED_COUNT=${closed_count}"
    echo "FAILED_COUNT=${failed_count}"
    echo "MATCHED_COUNT=${total}"
  fi
}

main "$@"
