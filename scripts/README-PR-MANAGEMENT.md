# PR Management Scripts

This directory contains scripts for managing pull requests in the BSM repository.

## Scripts

### pr-manager.js

Comprehensive PR management and analysis tool.

**Usage:**
```bash
GITHUB_TOKEN=your_token node scripts/pr-manager.js
```

**Features:**
- Analyzes all open pull requests
- Classifies PRs by status (ready, needs-changes, conflicting, stale, etc.)
- Generates detailed reports
- Provides actionable recommendations

**Requirements:**
- Node.js 22+
- GitHub Personal Access Token with `repo` scope
- `@octokit/rest` package (install separately: `npm install @octokit/rest`)

**Output:**
- Summary of all open PRs
- PRs grouped by status
- Days since last update
- Recommendations for each category

## Related Workflows

See `.github/workflows/pr-management.yml` for the automated workflow that uses similar logic.

## Documentation

See `docs/PR-MANAGEMENT-GUIDE.md` for complete guide on PR management processes.
