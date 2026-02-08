# 🎯 QUICK START: Close All PRs and Issues

**Status:** ✅ Ready to Execute  
**Date:** 2026-02-08

---

## TL;DR - Execute This

```bash
cd /home/runner/work/BSM/BSM
./scripts/close-all.sh
```

This will close:
- ✅ 34 draft PRs (experimental work)
- ✅ 1 issue (automated notification)

---

## Prerequisites

### 1. Install GitHub CLI

```bash
# macOS
brew install gh

# Linux (Debian/Ubuntu)
sudo apt install gh

# Linux (Fedora/RHEL)
sudo dnf install gh

# Windows
winget install GitHub.cli
```

### 2. Authenticate

```bash
gh auth login
```

Follow the prompts to authenticate with your GitHub account.

---

## Execution Options

### Option 1: One-Command (Recommended)

```bash
./scripts/close-all.sh
```

**What it does:**
- Closes all 34 draft PRs by Copilot
- Closes issue #87
- Generates final report

**Time:** ~2-3 minutes

---

### Option 2: Step-by-Step

```bash
# Step 1: Close draft PRs
./scripts/close-draft-prs.sh

# Step 2: Close issues
./scripts/close-issues.sh
```

**Time:** ~3-4 minutes

---

### Option 3: Manual Review

```bash
# Review all PRs first
gh pr list --limit 100

# Close individually
gh pr close <PR_NUMBER> --comment "Your message"

# Close issue
gh issue close 87 --comment "Acknowledged"
```

**Time:** ~15-30 minutes

---

## What Gets Closed

### Draft PRs by Copilot (34 PRs)
```
20, 25, 26, 33, 34, 35, 36, 37, 40, 41, 42, 43, 44, 47, 48, 
55, 56, 57, 58, 63, 65, 66, 69, 70, 71, 72, 73, 74, 75, 76, 
78, 80, 83, 84
```

### Issues (1 Issue)
```
87 - New Agents Report Published
```

### What Stays Open (26 PRs)
- Feature PRs by MOTEB1989
- PRs requiring individual review
- Active development work

---

## Safety Features

- ✅ **Confirmation Required** - Scripts ask before executing
- ✅ **Rate Limiting** - 1-second pause between API calls
- ✅ **Error Handling** - Continues even if individual operations fail
- ✅ **Rollback Available** - PRs can be reopened: `gh pr reopen <PR#>`
- ✅ **Explanatory Comments** - Each closed PR gets a detailed comment

---

## Expected Output

```
========================================
BSM Repository Cleanup
========================================

Current Repository Status:
  - Total Open PRs: 60
  - Draft PRs to Close: 34
  - Open Issues to Close: 1
  - PRs to Keep for Review: 26

This master script will:
  1. Close 34 draft/experimental PRs by Copilot
  2. Close 1 informational issue (#87)
  3. Generate final cleanup report

Do you want to continue? (yes/no): yes

========================================
Phase 1: Closing Draft PRs
========================================

Closing PR #20... ✓ Closed
Closing PR #25... ✓ Closed
...
Successfully closed: 34 PRs

========================================
Phase 2: Closing Issues
========================================

Closing Issue #87... ✓ Closed

========================================
Phase 3: Generating Final Report
========================================

Final report generated: reports/CLOSURE-COMPLETE-2026-02-08_XX-XX-XX.md

========================================
Cleanup Complete! 🎉
========================================

Summary:
  ✅ Draft PRs closed: 34
  ✅ Issues closed: 1
  ✅ Final report: reports/CLOSURE-COMPLETE-...md

Repository cleanup successful!
```

---

## Troubleshooting

### Error: `gh: command not found`
**Solution:** Install GitHub CLI (see Prerequisites above)

### Error: `Not authenticated`
**Solution:** Run `gh auth login`

### Error: `Resource not accessible`
**Solution:** Ensure you have write access to LexBANK/BSM

### Script fails partway through
**Solution:** Re-run the script - it will skip already-closed items

---

## After Closure

### Check Results

```bash
# Count remaining PRs
gh pr list --limit 100 | wc -l

# Should show ~26 PRs remaining

# Check issues
gh issue list

# Should show 0 issues
```

### Next Steps

1. Review remaining 26 PRs
2. Merge ready PRs: #67, #60, #61
3. Request updates for PRs needing work
4. Establish regular PR review cadence

---

## Documentation

- **[Closure Plan](reports/PR-CLOSURE-PLAN.md)** - Complete strategy
- **[Task Summary](reports/TASK-COMPLETION-SUMMARY.md)** - All tasks status
- **[PR Analysis](reports/all-prs-analysis.csv)** - CSV of all PRs
- **[Usage Guide](scripts/README-CLOSURE.md)** - Detailed instructions

---

## Need Help?

```bash
# Read the detailed guide
cat scripts/README-CLOSURE.md

# Read the closure plan
cat reports/PR-CLOSURE-PLAN.md

# List all scripts
ls -lh scripts/*.sh
```

---

**Ready to execute!** Run `./scripts/close-all.sh` to begin. 🚀
