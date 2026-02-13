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

## Related Workflows

See `.github/workflows/pr-management.yml` for the automated workflow that uses similar logic.

## Documentation

- **Complete Guide:** `docs/PR-MANAGEMENT-GUIDE.md` - Full guide on PR management processes
- **Action Plan:** `docs/PR-ACTION-PLAN.md` - Step-by-step implementation plan
