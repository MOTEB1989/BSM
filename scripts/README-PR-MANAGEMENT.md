# PR Management Scripts

This directory contains scripts for managing pull requests in the BSM repository.

## Scripts

### pr-status-check.js (Quick Check)

Lightweight PR status checker using only Node.js built-ins.

**Usage:**
```bash
GITHUB_TOKEN=your_token node scripts/pr-status-check.js
```

**Features:**
- Quick analysis of all open PRs
- No external dependencies required (uses Node.js https module)
- Shows basic status: draft, conflicts, stale, needs review
- Days since last update
- Quick recommendations

**Requirements:**
- Node.js 22+
- GitHub Personal Access Token with `repo` scope

**Best for:**
- Quick status checks
- CI/CD pipelines
- Minimal dependency environments

---

### pr-manager.js (Comprehensive Analysis)

Comprehensive PR management and analysis tool.

**Usage:**
```bash
# Install dependency first
npm install @octokit/rest

# Run analysis
GITHUB_TOKEN=your_token node scripts/pr-manager.js
```

**Features:**
- Deep analysis of all open pull requests
- Checks reviews, CI status, and check runs
- Classifies PRs by status (ready, needs-changes, conflicting, stale, blocked)
- Generates detailed reports with statistics
- Provides actionable recommendations

**Requirements:**
- Node.js 22+
- GitHub Personal Access Token with `repo` scope
- `@octokit/rest` package (install separately: `npm install @octokit/rest`)

**Output:**
- Summary of all open PRs
- PRs grouped by detailed status
- Days since last update
- Comprehensive recommendations for each category

**Best for:**
- Detailed PR audits
- Weekly/monthly reviews
- Management reporting


---

### close-conflicting-prs.sh (Bulk Closure)

Bulk close known conflicting PRs to reduce noise from non-mergeable items.

**Usage:**
```bash
# First authenticate gh
gh auth login

# Then close a list of PRs
scripts/close-conflicting-prs.sh 282 274 251 250
```

**Optional environment variables:**
```bash
REPO=LexBANK/BSM \
COMMENT="🔒 تم الإغلاق: PR يحتوي على تعارضات ولا يمكن دمجه" \
scripts/close-conflicting-prs.sh 282 274
```

**Requirements:**
- GitHub CLI (`gh`)
- Authenticated session (`gh auth login`)

## Related Workflows

See `.github/workflows/pr-management.yml` for the automated workflow that uses similar logic.

## Documentation

- **Complete Guide:** `docs/PR-MANAGEMENT-GUIDE.md` - Full guide on PR management processes
- **Action Plan:** `docs/PR-ACTION-PLAN.md` - Step-by-step implementation plan

---

### sync-pr-branch.sh (Conflict Prevention)

Keeps your PR branch synchronized with the base branch before review/merge.

**Why this helps:**
- Most merge conflicts happen when a PR branch stays stale for too long.
- Running this script before opening (or updating) a PR drastically reduces conflict risk.

**Usage:**
```bash
# Default: git fetch origin + git rebase origin/main (or remote default branch)
scripts/sync-pr-branch.sh

# Optional merge mode (without forced strategy options)
scripts/sync-pr-branch.sh --base main --mode merge

# After manual conflict resolution: run checks then continue
scripts/sync-pr-branch.sh --continue
```

**Recommended flow:**
1. `git fetch origin`
2. `scripts/sync-pr-branch.sh --base main --mode rebase` (or `--mode merge`)
3. If conflicts happen, resolve file-by-file manually, then run `scripts/sync-pr-branch.sh --continue` after each resolved step.
4. Push updates (`git push --force-with-lease` only if you used rebase).
5. Open/update the PR.
