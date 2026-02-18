# 🏛️ BSM Supreme Orchestrator (Auto-Pilot)

## Overview

The BSM Supreme Orchestrator is a fully automated 3-stage GitHub Actions workflow that provides hands-free continuous integration, auto-merging, and system execution for the BSM platform.

**Workflow File:** `.github/workflows/bsm-supreme-orchestrator.yml`

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   BSM Supreme Orchestrator                   │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   ┌─────────┐         ┌─────────┐        ┌─────────┐
   │ Stage 1 │         │ Stage 2 │        │ Stage 3 │
   │ 👮‍♂️      │────────▶│ ⚡️      │────────▶│ 🎬      │
   └─────────┘         └─────────┘        └─────────┘
   Governance          Strategic           Auto-Run
   Check               Merge               System
```

## Stages

### Stage 1: Governance Check (The Gatekeeper) 👮‍♂️

**Purpose:** Validate repository health and enforce quality gates before any merge.

**Job:** `governance-check`

**Actions:**
1. Checkout code
2. Setup Node.js environment
3. Install dependencies
4. Run IntegrityAgent audit
   - Checks for stale PRs (>30 days)
   - Checks for old issues (>90 days)
   - Calculates health score (0-100)
   - **Threshold:** Health score must be ≥70 to pass

**Outputs:**
- ✅ Pass: Health score ≥70, workflow continues
- ❌ Fail: Health score <70, workflow stops

**Example Output:**
```
✅ Integrity Score: 100
📊 Recommendations: ["Repository health is good"]
```

---

### Stage 2: Strategic Merge (Auto-Merge) ⚡️

**Purpose:** Automatically merge pull requests that pass governance checks without human intervention.

**Job:** `strategic-merge`

**Conditions:**
- Only runs on `pull_request` events
- Requires `governance-check` to succeed
- Only runs on PRs (not on direct pushes)

**Actions:**
1. Uses GitHub Script API to merge PR
2. Merge method: `squash` (combines all commits)
3. Auto-generates commit title: `✅ Auto-Merged: PR #<number> (Orchestrator Action)`
4. Adds success/failure comment to PR
5. Handles merge conflicts gracefully

**Success Comment:**
```markdown
🎉 **Auto-Merged by BSM Supreme Orchestrator**

✅ Governance check passed
⚡️ Merged automatically
🚀 System execution initiated
```

**Failure Comment:**
```markdown
⚠️ **Auto-Merge Failed**

Error: <error message>

Please merge manually.
```

---

### Stage 3: Auto-Execution (The Executor) 🎬

**Purpose:** Automatically run the BSM system after successful merge to main branch.

**Job:** `auto-execution`

**Conditions:**
- Only runs when code is merged to `main` branch
- Runs `always()` (even if previous stages had issues)
- Requires `governance-check` to complete

**Actions:**
1. Checkout the latest code from main
2. Setup Node.js environment
3. Install production dependencies
4. **IGNITION:** Run BSM System
   - Attempts to start `src/server.js` (health check)
   - Falls back to `index.js` if server.js not found
   - Runs IntegrityAgent status report
5. Log execution to `EXECUTION_LOG.md`
6. Auto-commit logs back to repository

**Execution Log Format:**
```markdown
✅ System executed successfully at <timestamp>
📍 Git Ref: refs/heads/main
📋 SHA: <commit-sha>
---
```

**System Health Report:**
```
📊 System Health Report:
  Health Score: 100
  Timestamp: 2026-02-18T20:00:00.000Z
  Recommendations: Repository health is good
```

---

## Triggers

### Push to Main
```yaml
on:
  push:
    branches: [ "main" ]
```
- Runs Stage 1 (Governance Check)
- Skips Stage 2 (no PR to merge)
- Runs Stage 3 (Auto-Execution)

### Pull Request Events
```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
```
- Runs Stage 1 (Governance Check)
- Runs Stage 2 (Strategic Merge) if Stage 1 passes
- Skips Stage 3 (not on main yet)

---

## Permissions

```yaml
permissions:
  contents: write      # Required for committing logs
  pull-requests: write # Required for merging PRs and adding comments
  issues: write        # Required for PR comments
  checks: write        # Required for workflow status
```

---

## Configuration

### Health Score Threshold

The governance check requires a health score of **≥70** to pass. This is calculated by:

```javascript
healthScore = 100 - (stalePRs * 5) - (oldIssues * 2)
```

**To adjust the threshold:**
Edit `.github/workflows/bsm-supreme-orchestrator.yml` line 44:
```bash
if (result.healthScore < 70) {  # Change 70 to desired threshold
```

### Merge Method

The workflow uses **squash merge** by default. 

**To change merge method:**
Edit `.github/workflows/bsm-supreme-orchestrator.yml` line 78:
```javascript
merge_method: 'squash',  // Options: 'merge', 'squash', 'rebase'
```

### Auto-Execution Script

The workflow attempts to run the main system scripts in this order:
1. `src/server.js` (with 5-second timeout)
2. `index.js` (if server.js not found)
3. IntegrityAgent status report

**To customize execution:**
Edit the `IGNITION` step in Stage 3 to run your desired commands.

---

## Monitoring

### Workflow Status

Check workflow runs at:
```
https://github.com/MOTEB1989/BSM/actions/workflows/bsm-supreme-orchestrator.yml
```

### Execution History

All executions are logged in:
```
EXECUTION_LOG.md
```

### PR Comments

Auto-merge status is posted as comments on each PR.

---

## Safety Features

### 1. Governance Gate
- Blocks merges if health score is too low
- Provides actionable recommendations
- Prevents degradation of repository health

### 2. Error Handling
- Gracefully handles merge conflicts
- Posts failure notifications on PRs
- Continues logging even if execution fails

### 3. Audit Trail
- All merges include orchestrator attribution
- Execution logs are committed to repository
- GitHub Actions provides full audit history

### 4. Conditional Execution
- Stage 2 only runs on PRs (prevents accidental merges)
- Stage 3 only runs on main (prevents duplicate executions)
- Each stage has proper dependency chains

---

## Troubleshooting

### Issue: Governance Check Fails

**Symptom:** Stage 1 fails with health score <70

**Solution:**
1. Check `EXECUTION_LOG.md` for recommendations
2. Close stale PRs (>30 days old)
3. Archive old issues (>90 days old)
4. Re-run the workflow

### Issue: Auto-Merge Fails

**Symptom:** Stage 2 fails with merge error

**Common Causes:**
- Merge conflicts (manual resolution required)
- Branch protection rules blocking auto-merge
- Insufficient permissions

**Solution:**
1. Check PR comments for error details
2. Resolve conflicts manually if needed
3. Verify workflow has `pull-requests: write` permission
4. Check branch protection settings

### Issue: Auto-Execution Times Out

**Symptom:** Stage 3 fails or hangs

**Solution:**
1. Check if server startup requires environment variables
2. Adjust timeout in workflow (currently 5 seconds)
3. Review logs in workflow run details

---

## Comparison with Other Workflows

### BSM Supreme Orchestrator vs Auto-Merge Workflow

| Feature | BSM Supreme Orchestrator | Auto-Merge Workflow |
|---------|-------------------------|---------------------|
| **Governance** | IntegrityAgent health check | CodeReview, Security, Integrity |
| **Merge Strategy** | Immediate squash merge | Quality gate decision |
| **Auto-Execution** | ✅ Yes (Stage 3) | ❌ No |
| **Use Case** | Fast auto-pilot mode | Thorough review process |

### When to Use

**Use BSM Supreme Orchestrator when:**
- You want fully automated merges
- Speed is priority over thorough review
- You trust the governance check
- You need auto-execution after merge

**Use Auto-Merge Workflow when:**
- You need multiple quality gates
- Security scanning is required
- Code review scores are important
- Manual approval may be needed

---

## Best Practices

### 1. Keep Repository Healthy
- Regularly close or update stale PRs
- Archive resolved issues
- Monitor health score trends

### 2. Monitor Auto-Merges
- Review auto-merged commits periodically
- Check execution logs for anomalies
- Set up notifications for failures

### 3. Test Before Enabling
- Test workflow on non-critical branches first
- Verify permissions are correctly set
- Ensure agents are properly configured

### 4. Customize Responsibly
- Don't disable governance checks
- Keep error handling intact
- Maintain audit trail

---

## Integration with BSM Agents

The orchestrator integrates with:

1. **IntegrityAgent** (`src/agents/IntegrityAgent.js`)
   - Provides health scoring
   - Detects stale PRs and issues
   - Generates recommendations

2. **Other Agents** (future integration)
   - CodeReviewAgent for quality scoring
   - SecurityScanner for vulnerability checks
   - GovernanceAgent for policy enforcement

---

## Security Considerations

### Secrets Management
- Uses `GITHUB_TOKEN` (auto-provided by GitHub Actions)
- No custom secrets required
- Follows least-privilege principle

### Auto-Merge Safety
- Only merges after governance check passes
- Requires explicit PR event trigger
- Prevents accidental merges to protected branches

### Audit Trail
- All actions logged to workflow runs
- Execution history in EXECUTION_LOG.md
- PR comments provide transparency

---

## Future Enhancements

Planned improvements:

1. **Multi-Stage Health Checks**
   - Add security scanning to Stage 1
   - Include code quality metrics
   - Add performance benchmarks

2. **Conditional Auto-Execution**
   - Only run on specific file changes
   - Support multiple execution profiles
   - Add rollback capability

3. **Enhanced Notifications**
   - Slack/Discord integration
   - Email notifications for failures
   - Dashboard for orchestrator metrics

4. **A/B Testing Support**
   - Deploy to staging first
   - Run integration tests before production
   - Automatic rollback on failure

---

## Contributing

To modify the orchestrator:

1. Edit `.github/workflows/bsm-supreme-orchestrator.yml`
2. Test changes on a feature branch
3. Submit PR with clear description of changes
4. Monitor first few runs after merge

---

## License

Part of the BSM (Business Service Management) platform.

---

## Support

For issues or questions:
- Open an issue: https://github.com/MOTEB1989/BSM/issues
- Check workflow runs: https://github.com/MOTEB1989/BSM/actions
- Review documentation: `/docs/`

---

**Last Updated:** 2026-02-18
**Version:** 1.0.0
**Status:** 🟢 Active
