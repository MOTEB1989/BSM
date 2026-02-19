#!/bin/bash

# BSM - Close Draft PRs Script
# This script closes all draft/experimental PRs created by Copilot
# Updated: 2026-02-19

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}BSM Draft PR Closure Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub CLI.${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Dynamic PR detection mode
MODE="${1:-interactive}"

echo -e "${BLUE}Mode: ${MODE}${NC}"
echo ""

# Fetch draft PRs dynamically from GitHub API
echo -e "${YELLOW}Fetching open draft PRs from GitHub...${NC}"
DRAFT_PRS=($(gh pr list --state open --draft --json number -q '.[].number' 2>/dev/null || echo ""))

# Also fetch stale PRs (older than 30 days with conflicts)
CUTOFF_DATE=$(python3 -c "from datetime import datetime, timedelta, timezone; print((datetime.now(timezone.utc) - timedelta(days=30)).isoformat())")
STALE_PRS=($(gh pr list --state open --json number,updatedAt,mergeable -q ".[] | select(.updatedAt < \"${CUTOFF_DATE}\" and .mergeable == \"CONFLICTING\") | .number" 2>/dev/null || echo ""))

# Combine and deduplicate
ALL_PRS=($(echo "${DRAFT_PRS[@]}" "${STALE_PRS[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '))

echo ""
echo -e "${YELLOW}This script will close the following PRs:${NC}"
echo ""

# Filter out current working PR (84)
CURRENT_PR="${CURRENT_PR:-84}"
FILTERED_PRS=()
for pr in "${ALL_PRS[@]}"; do
    if [ "$pr" != "$CURRENT_PR" ] && [ -n "$pr" ]; then
        FILTERED_PRS+=("$pr")
    fi
done

if [ ${#FILTERED_PRS[@]} -eq 0 ]; then
    echo -e "${GREEN}No draft or stale PRs found to close!${NC}"
    exit 0
fi

echo "Total PRs to close: ${#FILTERED_PRS[@]}"
echo ""

# Display each PR
for pr in "${FILTERED_PRS[@]}"; do
    TITLE=$(gh pr view $pr --json title -q '.title' 2>/dev/null || echo "PR not found")
    echo -e "  - PR #${pr}: ${TITLE}"
done

echo ""
echo -e "${YELLOW}WARNING: This will permanently close these PRs.${NC}"
read -p "Do you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}Operation cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}Closing draft PRs...${NC}"
echo ""

# Closure message
CLOSURE_MESSAGE="Closing this draft/experimental PR as part of repository cleanup.

**Rationale:**
- This was an experimental or analysis PR created by AI assistant
- The work has been completed and documented elsewhere
- Results are preserved in the \`reports/\` directory where applicable
- Not intended for merging into main branch

**References:**
- See [PR Closure Plan](../reports/PR-CLOSURE-PLAN.md) for full details
- See [Execution Complete Summary](../EXECUTION-COMPLETE.md) for project status

Thank you for your contribution to the BSM project! 🚀"

CLOSED_COUNT=0
FAILED_COUNT=0

for pr in "${FILTERED_PRS[@]}"; do
    echo -ne "Closing PR #${pr}... "
    
    if gh pr close $pr --comment "$CLOSURE_MESSAGE" 2>/dev/null; then
        echo -e "${GREEN}✓ Closed${NC}"
        CLOSED_COUNT=$((CLOSED_COUNT + 1))
    else
        echo -e "${RED}✗ Failed (may already be closed or not found)${NC}"
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
    
    # Rate limiting: pause briefly between API calls
    sleep 1
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo "Successfully closed: $CLOSED_COUNT PRs"
echo "Failed or skipped: $FAILED_COUNT PRs"
echo ""

if [ $FAILED_COUNT -gt 0 ]; then
    echo -e "${YELLOW}Note: Some PRs may have already been closed or deleted.${NC}"
fi

echo -e "${GREEN}Draft PR closure complete!${NC}"
