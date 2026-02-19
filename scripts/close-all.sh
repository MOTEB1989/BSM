#!/bin/bash

# BSM - Master Closure Script
# Orchestrates dynamic preview + one confirmation + execution for PRs and issues

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

build_pr_search_query() {
  local q=()
  [[ -n "${PR_AUTHOR:-}" ]] && q+=("author:${PR_AUTHOR}")
  [[ "${PR_DRAFT_ONLY:-true}" == "true" ]] && q+=("draft:true")
  if [[ -n "${PR_STALE_DAYS:-}" ]] && [[ "${PR_STALE_DAYS}" =~ ^[0-9]+$ ]]; then
    local cutoff
    if cutoff="$(calculate_cutoff_date "${PR_STALE_DAYS}")"; then
      q+=("updated:<${cutoff}")
    else
      echo -e "${YELLOW}Warning: Failed to calculate cutoff date for PR_STALE_DAYS=${PR_STALE_DAYS}. Skipping date filter.${NC}" >&2
    fi
  fi
  [[ -n "${PR_LABEL:-}" ]] && q+=("label:${PR_LABEL}")
  [[ -n "${PR_SEARCH_EXTRA:-}" ]] && q+=("${PR_SEARCH_EXTRA}")
  echo "${q[*]}"
}

build_issue_search_query() {
  local q=()
  [[ -n "${ISSUE_AUTHOR:-}" ]] && q+=("author:${ISSUE_AUTHOR}")
  if [[ -n "${ISSUE_STALE_DAYS:-}" ]] && [[ "${ISSUE_STALE_DAYS}" =~ ^[0-9]+$ ]]; then
    local cutoff
    if cutoff="$(calculate_cutoff_date "${ISSUE_STALE_DAYS}")"; then
      q+=("updated:<${cutoff}")
    else
      echo -e "${YELLOW}Warning: Failed to calculate cutoff date for ISSUE_STALE_DAYS=${ISSUE_STALE_DAYS}. Skipping date filter.${NC}" >&2
    fi
  fi
  [[ -n "${ISSUE_LABEL:-}" ]] && q+=("label:${ISSUE_LABEL}")
  [[ -n "${ISSUE_SEARCH_EXTRA:-}" ]] && q+=("${ISSUE_SEARCH_EXTRA}")
  echo "${q[*]}"
}

count_json_items() {
  local json="$1"
  python3 - <<'PY' "$json"
import json, sys
print(len(json.loads(sys.argv[1])))
PY
}

main() {
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}BSM Repository Cleanup${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""

  require_gh

  local pr_query issue_query
  pr_query="$(build_pr_search_query)"
  issue_query="$(build_issue_search_query)"

  local pr_preview_json issue_preview_json pr_preview_count issue_preview_count
  pr_preview_json="$(gh pr list --state open --limit "${PR_LIMIT:-200}" --search "$pr_query" --json number)"
  issue_preview_json="$(gh issue list --state open --limit "${ISSUE_LIMIT:-200}" --search "$issue_query" --json number)"
  pr_preview_count="$(count_json_items "$pr_preview_json")"
  issue_preview_count="$(count_json_items "$issue_preview_json")"

  echo -e "${BLUE}Current Dynamic Preview (dry-run):${NC}"
  echo "  - PR query: ${pr_query:-<none>}"
  echo "  - Issue query: ${issue_query:-<none>}"
  echo "  - Draft/filtered PRs to close: ${pr_preview_count}"
  echo "  - Filtered issues to close: ${issue_preview_count}"
  echo ""

  echo -e "${YELLOW}This script will now run:${NC}"
  echo "  1. scripts/close-draft-prs.sh (with same PR filters)"
  echo "  2. scripts/close-issues.sh (with same issue filters)"
  echo ""

  if [[ "${AUTO_CONFIRM:-no}" != "yes" ]]; then
    read -r -p "Dry-run complete. Proceed with execution? (yes/no): " CONFIRM
    [[ "$CONFIRM" == "yes" ]] || { echo -e "${RED}Operation cancelled.${NC}"; exit 0; }
  fi

  [[ -f "./scripts/close-draft-prs.sh" ]] || { echo -e "${RED}Error: close-draft-prs.sh not found${NC}"; exit 1; }
  [[ -f "./scripts/close-issues.sh" ]] || { echo -e "${RED}Error: close-issues.sh not found${NC}"; exit 1; }

  echo ""
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}Phase 1: Closing Draft PRs${NC}"
  echo -e "${GREEN}========================================${NC}"

  local pr_output
  pr_output="$(AUTO_CONFIRM=yes OUTPUT_COUNTS_ONLY=yes ./scripts/close-draft-prs.sh)"
  echo "$pr_output"

  local pr_closed pr_failed pr_matched
  pr_closed="$(echo "$pr_output" | awk -F= '/^CLOSED_COUNT=/{print $2}' | tail -1)"
  pr_failed="$(echo "$pr_output" | awk -F= '/^FAILED_COUNT=/{print $2}' | tail -1)"
  pr_matched="$(echo "$pr_output" | awk -F= '/^MATCHED_COUNT=/{print $2}' | tail -1)"

  echo ""
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}Phase 2: Closing Issues${NC}"
  echo -e "${GREEN}========================================${NC}"

  local issue_output
  issue_output="$(AUTO_CONFIRM=yes OUTPUT_COUNTS_ONLY=yes ./scripts/close-issues.sh)"
  echo "$issue_output"

  local issue_closed issue_failed issue_matched
  issue_closed="$(echo "$issue_output" | awk -F= '/^CLOSED_COUNT=/{print $2}' | tail -1)"
  issue_failed="$(echo "$issue_output" | awk -F= '/^FAILED_COUNT=/{print $2}' | tail -1)"
  issue_matched="$(echo "$issue_output" | awk -F= '/^MATCHED_COUNT=/{print $2}' | tail -1)"

  pr_closed="${pr_closed:-0}"; pr_failed="${pr_failed:-0}"; pr_matched="${pr_matched:-0}"
  issue_closed="${issue_closed:-0}"; issue_failed="${issue_failed:-0}"; issue_matched="${issue_matched:-0}"

  local report_file
  report_file="reports/CLOSURE-COMPLETE-$(date +%Y-%m-%d_%H-%M-%S).md"

  cat > "$report_file" <<REPORT
# BSM Repository Closure - Complete

**Date:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")  
**Status:** ✅ SUCCESS

---

## Applied Filters

- PRs: state=open, search=\`${pr_query:-<none>}\`
- Issues: state=open, search=\`${issue_query:-<none>}\`

## Execution Results

### Pull Requests
- Matched in preview: **${pr_matched}**
- Successfully closed: **${pr_closed}**
- Failed or skipped: **${pr_failed}**

### Issues
- Matched in preview: **${issue_matched}**
- Successfully closed: **${issue_closed}**
- Failed or skipped: **${issue_failed}**

---

**Generated by:** BSM Master Closure Script  
**Mode:** Dynamic filter-based cleanup
REPORT

  echo ""
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}Cleanup Complete! 🎉${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo -e "${BLUE}Summary:${NC}"
  echo "  ✅ PRs matched/closed/failed: ${pr_matched}/${pr_closed}/${pr_failed}"
  echo "  ✅ Issues matched/closed/failed: ${issue_matched}/${issue_closed}/${issue_failed}"
  echo "  ✅ Final report: ${report_file}"
}

main "$@"
