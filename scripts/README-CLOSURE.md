# PR and Issue Closure Scripts

This directory contains automation scripts for closing open PRs and issues in the BSM repository as part of the repository cleanup initiative.

---

## Overview

**Total Items to Process:**
- 34 draft PRs (to close)
- 1 issue (to close)
- 26 PRs (to review individually)

**Generated:** 2026-02-08

---

## Scripts

### 1. `close-all.sh` (Master Script)
**Purpose:** Orchestrates the complete closure process

**Usage:**
```bash
./scripts/close-all.sh
```

**Actions:**
1. Closes all draft PRs via `close-draft-prs.sh`
2. Closes informational issues via `close-issues.sh`
3. Generates final completion report

**Requirements:**
- GitHub CLI (`gh`) installed and authenticated
- Write access to LexBANK/BSM repository

---

### 2. `close-draft-prs.sh`
**Purpose:** Closes 34 draft PRs created by Copilot

**Usage:**
```bash
./scripts/close-draft-prs.sh
```

**What it does:**
- Closes draft/experimental PRs: #20, #25, #26, #33, #34, #35, #36, #37, #40, #41, #42, #43, #44, #47, #48, #55, #56, #57, #58, #63, #65, #66, #69, #70, #71, #72, #73, #74, #75, #76, #78, #80, #83, #84
- Adds explanatory comment to each PR
- Provides summary of successes/failures

**Rationale:**
These PRs are:
- Experimental/draft work by AI assistant
- Analysis PRs with results already documented
- Not intended for merging

---

### 3. `close-issues.sh`
**Purpose:** Closes informational issues

**Usage:**
```bash
./scripts/close-issues.sh
```

**What it does:**
- Closes Issue #87 (automated report notification)
- Adds acknowledgment comment

---

## Prerequisites

### Install GitHub CLI

**macOS:**
```bash
brew install gh
```

**Linux:**
```bash
# Debian/Ubuntu
sudo apt install gh

# Fedora/RHEL
sudo dnf install gh
```

**Windows:**
```bash
winget install GitHub.cli
```

### Authenticate

```bash
gh auth login
```

Follow the prompts to authenticate with your GitHub account.

---

## Execution Workflow

### Option 1: Automated (Recommended)

Run the master script to close everything:

```bash
cd /home/runner/work/BSM/BSM
./scripts/close-all.sh
```

This will:
1. Show summary of changes
2. Ask for confirmation
3. Close all draft PRs
4. Close all issues
5. Generate final report

### Option 2: Step-by-Step

Execute each phase individually:

```bash
# Phase 1: Close draft PRs
./scripts/close-draft-prs.sh

# Phase 2: Close issues
./scripts/close-issues.sh

# Phase 3: Review remaining PRs manually
gh pr list --limit 100
```

### Option 3: Manual Review

Review each item before closing:

```bash
# List all draft PRs
gh pr list --author Copilot --state open --draft

# Close individually with custom message
gh pr close <PR_NUMBER> --comment "Your custom message here"

# Close issue
gh issue close 87 --comment "Acknowledged"
```

---

## Safety Features

1. **Confirmation Required:** All scripts ask for confirmation before making changes
2. **Rate Limiting:** 1-second pause between API calls to avoid rate limits
3. **Error Handling:** Scripts continue if individual operations fail
4. **Detailed Logging:** Shows success/failure for each operation
5. **Rollback Available:** PRs/issues can be reopened if closed incorrectly

---

## Rollback

If a PR or issue was closed by mistake:

```bash
# Reopen a PR
gh pr reopen <PR_NUMBER>

# Reopen an issue
gh issue reopen <ISSUE_NUMBER>
```

---

## Documentation

- **[PR Closure Plan](../reports/PR-CLOSURE-PLAN.md)** - Complete strategy and rationale
- **[Execution Complete](../EXECUTION-COMPLETE.md)** - Project completion status
- **[Orchestrator Summary](../ORCHESTRATOR-SUMMARY.md)** - Platform analysis

---

## Support

### Common Issues

**Problem:** `gh: command not found`
- **Solution:** Install GitHub CLI (see Prerequisites)

**Problem:** `Error: Not authenticated`
- **Solution:** Run `gh auth login`

**Problem:** `Error: Resource not accessible by integration`
- **Solution:** Ensure you have write access to the repository

**Problem:** Script fails partway through
- **Solution:** Scripts are idempotent; re-run to continue

---

## Success Criteria

After running the scripts:

- [ ] 34 draft PRs closed
- [ ] Issue #87 closed
- [ ] Final report generated in `reports/`
- [ ] Only legitimate feature PRs remain open
- [ ] Repository is clean and organized

---

## Next Steps

After closure:

1. **Review Remaining PRs** - See [PR Closure Plan](../reports/PR-CLOSURE-PLAN.md)
2. **Merge Ready PRs** - PRs #67, #60, #61 previously identified
3. **Triage Others** - Request updates or close with explanation
4. **Regular Maintenance** - Establish PR review cadence

---

## Contact

For questions or issues:
- Review the [PR Closure Plan](../reports/PR-CLOSURE-PLAN.md)
- Check repository documentation
- Open a new issue if needed

---

**Generated:** 2026-02-08  
**Status:** Ready for Execution  
**Version:** 1.0.0
