#!/bin/bash

# BSM - Close Draft PRs Script
# This script closes all draft/experimental PRs created by Copilot
# Generated: 2026-02-08

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

echo -e "${YELLOW}This script will close the following DRAFT PRs:${NC}"
echo ""

# List of draft PRs to close (all Copilot drafts except #88)
# Generated from GitHub API - 34 draft PRs by Copilot
DRAFT_PRS=(
    20 25 26 33 34 35 36 37 40 41 42 43 44 47 48 55 56 57 58 63 65 66 69 70 71 72 73 74 75 76 78 80 83 84
)

echo "Total PRs to close: ${#DRAFT_PRS[@]}"
echo ""

# Display each PR
for pr in "${DRAFT_PRS[@]}"; do
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

for pr in "${DRAFT_PRS[@]}"; do
    echo -ne "Closing PR #${pr}... "
    
    if gh pr close $pr --comment "$CLOSURE_MESSAGE" 2>/dev/null; then
        echo -e "${GREEN}✓ Closed${NC}"
        ((CLOSED_COUNT++))
    else
        echo -e "${RED}✗ Failed (may already be closed or not found)${NC}"
        ((FAILED_COUNT++))
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
