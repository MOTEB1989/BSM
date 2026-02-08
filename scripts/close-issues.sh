#!/bin/bash

# BSM - Close Issues Script
# This script closes open issues that are informational or completed
# Generated: 2026-02-08

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}BSM Issue Closure Script${NC}"
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

echo -e "${YELLOW}This script will close the following issues:${NC}"
echo ""

# Issue #87 - Automated report notification
echo "  - Issue #87: New Agents Report Published — 2026-02-08"
echo ""

echo -e "${YELLOW}WARNING: This will permanently close these issues.${NC}"
read -p "Do you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}Operation cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}Closing issues...${NC}"
echo ""

# Close Issue #87
echo -ne "Closing Issue #87... "

CLOSURE_MESSAGE="Automated report acknowledged and reviewed.

This was an informational notification from the weekly agents audit workflow. The report has been reviewed and documented.

**Status:** Report reviewed  
**Action:** Closing as completed  
**References:** See \`reports/\` directory for detailed agent reports

Thank you! 🚀"

if gh issue close 87 --comment "$CLOSURE_MESSAGE" 2>/dev/null; then
    echo -e "${GREEN}✓ Closed${NC}"
else
    echo -e "${RED}✗ Failed (may already be closed or not found)${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Issue closure complete!${NC}"
echo -e "${GREEN}========================================${NC}"
