#!/bin/bash

# BSM - Close Issues Script
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

# Cross-platform date calculation using Python3
# Works on both Linux (GNU date) and macOS (BSD date)
calculate_cutoff_date() {
  local days_ago="$1"
  python3 - <<'PY' "$days_ago"
import sys
from datetime import datetime, timedelta, timezone
days = int(sys.argv[1])
cutoff = datetime.now(timezone.utc) - timedelta(days=days)
print(cutoff.strftime('%Y-%m-%d'))
PY
}

build_issue_search_query() {
  local query_parts=()

  [[ -n "${ISSUE_AUTHOR:-}" ]] && query_parts+=("author:${ISSUE_AUTHOR}")

  if [[ -n "${ISSUE_STALE_DAYS:-}" ]]; then
    if [[ "${ISSUE_STALE_DAYS}" =~ ^[0-9]+$ ]]; then
      local cutoff_date
      if cutoff_date="$(calculate_cutoff_date "${ISSUE_STALE_DAYS}")"; then
        query_parts+=("updated:<${cutoff_date}")
      else
        echo -e "${YELLOW}Warning: Failed to calculate cutoff date for ISSUE_STALE_DAYS=${ISSUE_STALE_DAYS}. Skipping date filter.${NC}" >&2
      fi
    else
      echo -e "${YELLOW}Warning: ISSUE_STALE_DAYS is invalid. Ignoring.${NC}"
    fi
  fi

  [[ -n "${ISSUE_LABEL:-}" ]] && query_parts+=("label:${ISSUE_LABEL}")
  [[ -n "${ISSUE_SEARCH_EXTRA:-}" ]] && query_parts+=("${ISSUE_SEARCH_EXTRA}")

  echo "${query_parts[*]}"
}

fetch_issues_json() {
  local search_query="$1"
  gh issue list \
    --state open \
    --limit "${ISSUE_LIMIT:-200}" \
    --search "$search_query" \
    --json number,title,author,updatedAt
}

print_preview() {
  local issues_json="$1"
  python3 - <<'PY' "$issues_json"
import json, sys
items = json.loads(sys.argv[1])
print(f"Total issues to close (preview): {len(items)}")
if not items:
    print("No issues matched the current filters.")
else:
    for issue in items:
        author = (issue.get("author") or {}).get("login", "unknown")
        print(f"  - Issue #{issue['number']}: {issue['title']} | author={author} | updated={issue.get('updatedAt')}")
PY
}

extract_issue_numbers() {
  local issues_json="$1"
  python3 - <<'PY' "$issues_json"
import json, sys
for issue in json.loads(sys.argv[1]):
    print(issue["number"])
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
  echo -e "${GREEN}BSM Issue Closure Script${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""

  require_gh

  local search_query issues_json total
  search_query="$(build_issue_search_query)"

  echo -e "${BLUE}Filters:${NC}"
  echo "  - state: open"
  echo "  - search: ${search_query:-<none>}"
  echo ""

  issues_json="$(fetch_issues_json "$search_query")"
  total="$(count_items "$issues_json")"

  echo -e "${BLUE}Preview (dry-run):${NC}"
  print_preview "$issues_json"
  echo ""

  if [[ "$total" -eq 0 ]]; then
    echo -e "${YELLOW}No matching issues. Nothing to do.${NC}"
    exit 0
  fi

  if [[ "${AUTO_CONFIRM:-no}" != "yes" ]]; then
    echo -e "${YELLOW}Dry-run complete. This will now close ${total} issue(s).${NC}"
    read -r -p "Do you want to continue? (yes/no): " CONFIRM
    [[ "$CONFIRM" == "yes" ]] || { echo -e "${RED}Operation cancelled.${NC}"; exit 0; }
  fi

  local closure_message="${ISSUE_CLOSURE_MESSAGE:-Closing this issue as part of automated repository cleanup based on configured filters.}"
  local closed_count=0 failed_count=0

  echo ""
  echo -e "${GREEN}Executing close operation...${NC}"
  while read -r issue_number; do
    [[ -z "$issue_number" ]] && continue
    echo -ne "Closing Issue #${issue_number}... "
    if gh issue close "$issue_number" --comment "$closure_message" 2>/dev/null; then
      echo -e "${GREEN}✓ Closed${NC}"
      ((closed_count+=1))
    else
      echo -e "${RED}✗ Failed${NC}"
      ((failed_count+=1))
    fi
    sleep 1
  done < <(extract_issue_numbers "$issues_json")

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
