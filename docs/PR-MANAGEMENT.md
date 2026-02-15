# PR Management Guide

This guide explains how to use the BSU PR Merge Agent for automated pull request review, approval, merge, and close operations.

## Overview

The BSU PR Merge Agent provides automated PR management capabilities through:
- **CLI Tool** (`scripts/pr-operations.js`) - Command-line PR operations
- **REST API** (`/api/pr/*`) - Programmatic PR evaluation
- **GitHub Actions** (`.github/workflows/pr-operations.yml`) - Manual workflow triggers

## Agent Capabilities

The PR Merge Agent evaluates PRs based on quality gates:
- **Code Review Score** - Minimum 7/10
- **Security Scan** - Zero critical vulnerabilities
- **CI Status** - All checks must pass
- **Approvals** - Minimum 1 approval required
- **Merge Conflicts** - Must be resolved
- **Staleness** - PRs inactive >14 days flagged

## CLI Tool Usage

### Installation

The CLI tool is already included in the repository. Ensure dependencies are installed:

```bash
npm ci
```

### Commands

#### List All Open PRs
Lists all open PRs with their merge readiness status:

```bash
node scripts/pr-operations.js list
```

Output shows:
- PR number and title
- Author and last update date
- Agent decision (approve, request_changes, block, etc.)
- Approval count, CI status, and mergeability

#### Review a PR
Evaluates a PR and provides detailed merge decision:

```bash
node scripts/pr-operations.js review <pr-number>
```

Example:
```bash
node scripts/pr-operations.js review 123
```

Output includes:
- PR details (title, author, state, draft status, mergeable)
- Approval count and CI status
- Agent decision and reason
- Recommendation for next steps
- Detailed conditions checklist

#### Approve a PR
Approves a PR if it meets all quality gates:

```bash
node scripts/pr-operations.js approve <pr-number> [comment]
```

Examples:
```bash
node scripts/pr-operations.js approve 123
node scripts/pr-operations.js approve 123 "LGTM! Great work on the security fixes."
```

The agent will:
1. Evaluate the PR using quality gates
2. Create an approval review if conditions are met
3. Add "agent-approved" and "ready" labels
4. Provide detailed reason if approval is not possible

#### Merge a PR
Merges an approved PR:

```bash
node scripts/pr-operations.js merge <pr-number> [method] [comment]
```

Examples:
```bash
node scripts/pr-operations.js merge 123
node scripts/pr-operations.js merge 123 squash
node scripts/pr-operations.js merge 123 squash "Merging critical security fix"
```

Merge methods:
- `squash` (default) - Squash and merge
- `merge` - Create merge commit
- `rebase` - Rebase and merge

The agent will:
1. Check if PR is draft or has conflicts
2. Verify approval count
3. Attempt to merge
4. Provide merge confirmation with SHA

#### Close a PR
Closes a PR with optional reason:

```bash
node scripts/pr-operations.js close <pr-number> [reason]
```

Examples:
```bash
node scripts/pr-operations.js close 123
node scripts/pr-operations.js close 123 "Superseded by #124"
```

The agent will:
1. Post a comment with the reason (if provided)
2. Close the PR
3. Confirm closure

#### Auto-Merge Ready PRs
Automatically merges all PRs that pass quality gates:

```bash
node scripts/pr-operations.js auto
```

The agent will:
1. List all open PRs
2. Evaluate each PR using quality gates
3. Approve PRs that are ready (if not already approved)
4. Merge approved PRs
5. Generate summary report

This is useful for batch processing ready PRs.

### Environment Variables

The CLI tool requires:

```bash
export GITHUB_TOKEN=<your-github-token>
# OR
export GITHUB_BSU_TOKEN=<your-github-token>

# Optional: Override repository
export GITHUB_REPO=LexBANK/BSM
```

## REST API

### Endpoints

#### Evaluate PR
**POST** `/api/pr/evaluate`

Evaluates a single PR and returns merge decision.

Request body:
```json
{
  "prNumber": 123,
  "mergeable": true,
  "draft": false,
  "approvals": 2,
  "updatedAt": "2026-02-15T10:00:00Z",
  "ciStatus": "success",
  "otherResults": []
}
```

Response:
```json
{
  "decision": {
    "agentId": "pr-merge-agent",
    "prNumber": 123,
    "action": "approve",
    "reason": "All quality gates passed",
    "conditions": {
      "meetsCodeScore": true,
      "noCriticalVulns": true,
      "governancePassed": true,
      "mergeable": true,
      "hasApprovals": true,
      "ciPassed": true
    },
    "recommendation": "Safe to merge",
    "timestamp": "2026-02-15T11:00:00Z"
  },
  "prNumber": 123,
  "canMerge": true,
  "timestamp": "2026-02-15T11:00:00Z"
}
```

#### Batch Evaluate PRs
**POST** `/api/pr/batch-evaluate`

Evaluates multiple PRs at once.

Request body:
```json
{
  "prs": [
    {
      "prNumber": 123,
      "mergeable": true,
      "draft": false,
      "approvals": 2,
      "ciStatus": "success"
    },
    {
      "prNumber": 124,
      "mergeable": false,
      "draft": false,
      "approvals": 1,
      "ciStatus": "pending"
    }
  ]
}
```

Response:
```json
{
  "results": [
    {
      "prNumber": 123,
      "decision": { "action": "approve", ... },
      "canMerge": true
    },
    {
      "prNumber": 124,
      "decision": { "action": "block", ... },
      "canMerge": false
    }
  ],
  "summary": {
    "total": 2,
    "readyToMerge": 1,
    "needsChanges": 0,
    "blocked": 1
  },
  "timestamp": "2026-02-15T11:00:00Z"
}
```

#### Get Agent Configuration
**GET** `/api/pr/config`

Returns PR Merge Agent configuration.

Response:
```json
{
  "agentId": "pr-merge-agent",
  "agentName": "Merge Decision Maker",
  "conditions": {
    "minCodeScore": 7,
    "maxCriticalVulns": 0,
    "minApprovals": 1,
    "maxInactiveDays": 14
  },
  "description": "Automated PR merge decision maker based on quality gates",
  "actions": [
    "approve",
    "block",
    "hold",
    "request_changes",
    "request_review",
    "request_update"
  ]
}
```

#### Health Check
**GET** `/api/pr/health`

Returns PR operations health status.

Response:
```json
{
  "status": "healthy",
  "agent": "pr-merge-agent",
  "timestamp": "2026-02-15T11:00:00Z"
}
```

## GitHub Actions Workflow

### Manual Trigger

The PR Operations workflow can be triggered manually from GitHub Actions:

1. Go to **Actions** tab in GitHub
2. Select **PR Operations** workflow
3. Click **Run workflow**
4. Choose operation:
   - `list` - List all open PRs with status
   - `review` - Review a specific PR
   - `approve` - Approve a specific PR
   - `merge` - Merge a specific PR
   - `close` - Close a specific PR
   - `auto` - Auto-merge all ready PRs
5. Enter PR number (for review/approve/merge/close)
6. Enter reason (optional, for close)
7. Click **Run workflow**

### Workflow Permissions

The workflow requires:
- `contents: write` - For merging PRs
- `pull-requests: write` - For approving/closing PRs
- `checks: read` - For reading CI status
- `issues: write` - For adding labels/comments

## Integration with Existing Workflows

### Auto-Merge Workflow

The existing `.github/workflows/auto-merge.yml` workflow runs automatically on PR events and includes:
1. **Agent Review** - Code Review, Security, and Integrity checks
2. **Auto-Merge** - Automatically merges if all gates pass
3. **Handle Rejection** - Requests changes or blocks PRs that don't meet criteria

### PR Management Workflow

The existing `.github/workflows/pr-management.yml` workflow runs daily and includes:
- PR triage and labeling
- Auto-merge ready PRs
- Close stale PRs (30+ days)

## Decision Logic

The PR Merge Agent evaluates PRs using this logic:

### 1. Blocking Conditions (Highest Priority)
- **Has Conflicts** → `block` - Must resolve conflicts
- **Is Draft** → `hold` - Must mark as ready for review
- **Governance Blocked** → `block` - Compliance violations

### 2. Quality Gates
- **CI Checks** → If not passing → `request_changes`
- **Approvals** → If less than minimum → `request_review`
- **Code Score** → If below 7/10 → `request_changes`
- **Critical Vulnerabilities** → If any found → `block`

### 3. Staleness Check
- **Inactive >14 days** → `request_update`

### 4. Approval
If all gates pass → `approve` - Safe to merge

## Action Types

- `approve` - All quality gates passed, safe to merge
- `block` - Critical issues prevent merge (conflicts, security, governance)
- `hold` - PR is in draft state
- `request_changes` - CI failing or code quality below threshold
- `request_review` - Needs more approvals
- `request_update` - PR is stale and needs update

## Examples

### Example 1: Review and Approve a PR

```bash
# Review PR to check status
node scripts/pr-operations.js review 123

# If ready, approve it
node scripts/pr-operations.js approve 123

# Merge the approved PR
node scripts/pr-operations.js merge 123
```

### Example 2: Batch Process Ready PRs

```bash
# List all PRs to see which are ready
node scripts/pr-operations.js list

# Auto-merge all ready PRs
node scripts/pr-operations.js auto
```

### Example 3: Close Stale PR

```bash
# Review an old PR
node scripts/pr-operations.js review 456

# Close it with reason
node scripts/pr-operations.js close 456 "No activity for 30 days. Please reopen if still needed."
```

### Example 4: API Integration

```javascript
// Evaluate PR via API
const response = await fetch('https://api.bsu.example.com/api/pr/evaluate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-token': process.env.ADMIN_TOKEN
  },
  body: JSON.stringify({
    prNumber: 123,
    mergeable: true,
    draft: false,
    approvals: 2,
    ciStatus: 'success'
  })
});

const result = await response.json();
console.log('Can merge:', result.canMerge);
console.log('Reason:', result.decision.reason);
```

## Best Practices

1. **Always review before merging** - Use `review` command to understand PR status
2. **Check CI status** - Ensure all checks pass before approval
3. **Use auto-merge for batches** - Process multiple ready PRs efficiently
4. **Provide reasons when closing** - Help contributors understand why
5. **Monitor stale PRs** - Use `list` command regularly to identify inactive PRs
6. **Respect quality gates** - Don't override agent decisions without good reason

## Troubleshooting

### Issue: PR won't merge
**Solution**: Check the agent's decision reason:
```bash
node scripts/pr-operations.js review <pr-number>
```
Address the specific issues mentioned (conflicts, failing CI, missing approvals).

### Issue: Approval count mismatch
**Solution**: GitHub API may be cached. Wait a few seconds and try again.

### Issue: Permission denied
**Solution**: Ensure your GitHub token has required permissions:
- `repo` scope for private repositories
- `public_repo` scope for public repositories

### Issue: Auto-merge fails
**Solution**: Check that:
1. Repository allows auto-merge
2. Branch protection rules are met
3. All required status checks pass

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project overview and architecture
- [README.md](../README.md) - General project documentation
- [Auto-Merge Workflow](../.github/workflows/auto-merge.yml) - Automated PR merging
- [PR Management Workflow](../.github/workflows/pr-management.yml) - Daily PR triage
