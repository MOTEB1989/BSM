# 🏛️ BSM Supreme Orchestrator

## Overview

The BSM Supreme Orchestrator is a comprehensive GitHub Actions workflow that provides governance and automation across 4 stages. It ensures code quality, security, and compliance before allowing changes to be merged into the main branch.

## Workflow Triggers

The orchestrator runs on:
- **Push to main branch** - Validates changes after merge
- **Pull Requests** - Opened, synchronized, or reopened
- **Manual trigger** - Via workflow_dispatch

## Workflow Stages

### Stage 1: ⚖️ Governance & Integrity Check

**Purpose:** Validate the health and compliance of the repository

**Steps:**
1. **Integrity Agent** - Runs `IntegrityAgent.js` to check repository health
   - Scans for stale PRs (> 30 days old)
   - Identifies old issues (> 90 days old)
   - Generates a health score (0-100)

2. **Registry Validation** - Validates `agents/registry.yaml`
   - Checks for required governance fields
   - Ensures compliance with agent registry schema
   - Runs the test suite (`npm test`)

3. **Security Audit** - Runs npm security audit
   - Scans dependencies for vulnerabilities
   - Reports high-severity issues
   - Sets security status output

**Outputs:**
- `integrity_score` - Repository health score (0-100)
- `governance_passed` - Boolean indicating if governance checks passed
- `security_status` - Security audit status (passed/warning)

### Stage 2: ✨ Code Polisher

**Purpose:** Automatically format and clean code

**Conditions:**
- Only runs on pull requests
- Requires governance check to pass
- Uses governance approval as gate

**Steps:**
1. **Install Prettier** - Installs code formatter
2. **Auto-Format** - Formats all code files
   - JavaScript (.js)
   - JSON (.json)
   - Markdown (.md)
   - YAML (.yaml, .yml)

3. **Auto-Commit** - Commits formatting changes
   - Uses bot identity
   - Pushes to PR branch
   - Includes descriptive commit message

### Stage 3: 🚀 Strategic Merge Decision

**Purpose:** Make intelligent merge decisions based on agent analysis

**Conditions:**
- Only runs on pull requests
- Requires governance check to pass
- Requires code polisher to complete (success or skip)
- Uses `always()` to run even if previous job was skipped

**Steps:**
1. **Consult PR Merge Agent** - Runs `PRMergeAgent.js`
   - Evaluates code quality scores
   - Checks security vulnerability status
   - Reviews governance compliance
   - Makes merge/block decision

2. **Auto Merge** - If approved
   - Attempts direct merge using GitHub API
   - Falls back to enabling auto-merge for pending checks
   - Uses squash merge method
   - Includes governance approval in commit message

**Outputs:**
- `decision` - Merge decision (approve/block/request_changes)
- `reason` - Explanation for the decision

### Stage 4: 📢 Final Report

**Purpose:** Document and communicate workflow results

**Conditions:**
- Always runs (even if previous stages fail)
- Only on pull requests
- Uses `always()` condition

**Steps:**
1. **Post Status Comment** - Creates detailed PR comment
   - Bilingual (Arabic/English) reporting
   - Tabular format with emojis
   - Shows all agent results
   - Includes timestamp and system signature

**Report Format:**
```
### 🏛️ تقرير الحوكمة (Governance Report)

| الوكيل / Agent | المهمة / Task | الحالة / Status |
|---|---|---|
| 👮‍♂️ Integrity | فحص القوانين / Check Laws | ✅ Passed (Score: 95/100) |
| 🛡️ Security | فحص الأمان / Security Audit | ✅ PASSED |
| 🧹 Cleaner | تنظيف الكود / Code Cleanup | ✅ SUCCESS |
| 🧠 Strategist | قرار الدمج / Merge Decision | ✅ APPROVE |

**Merge Decision Reason:** All quality gates passed

---
> **🏛️ BSM System:** All agents operated in unison.
> **التاريخ / Timestamp:** 2024-01-01T12:00:00.000Z
```

## Concurrency Control

The workflow uses concurrency groups to prevent multiple runs:
- Group ID: `orchestrator-${PR_NUMBER}` or `orchestrator-${RUN_ID}`
- Cancels in-progress runs when new changes are pushed

## Permissions Required

The workflow requires the following GitHub permissions:
- `contents: write` - For committing code changes
- `pull-requests: write` - For commenting and merging PRs
- `issues: write` - For creating comments
- `checks: write` - For updating check statuses
- `statuses: write` - For setting commit statuses

## Environment Variables

- `NODE_VERSION`: '22' - Node.js version to use

## Integration with Existing Agents

### IntegrityAgent.js
- Located at: `src/agents/IntegrityAgent.js`
- Purpose: Repository health checks
- Returns: Health score, stale PR count, old issue count, recommendations

### PRMergeAgent.js
- Located at: `src/agents/PRMergeAgent.js`
- Purpose: Merge decision making
- Evaluates: Code quality, security, governance compliance
- Returns: Decision (approve/block/request_changes) and reason

## Error Handling

The workflow includes comprehensive error handling:

1. **Missing Agents** - Falls back to safe defaults if agents are not found
2. **Validation Failures** - Blocks merge and reports issues
3. **Merge Failures** - Enables auto-merge if direct merge fails
4. **Comment Failures** - Logs error but doesn't fail workflow

## Known Limitations

1. **Registry Validation** - Currently, the agent registry in `agents/registry.yaml` is missing required governance fields:
   - `risk` - Risk assessment
   - `approval` - Approval requirements
   - `startup` - Startup configuration
   - `healthcheck` - Health check configuration
   - `contexts.allowed` - Allowed execution contexts

   The workflow will fail the governance check until these fields are added.

2. **Code Formatting** - Auto-formatting only works on pull requests, not on direct pushes to main

3. **Merge Timing** - Auto-merge may be delayed if other required checks are pending

## Maintenance

### Testing the Workflow

1. **Manual Trigger:**
   ```bash
   gh workflow run bsu-orchestrator.yml
   ```

2. **On Pull Request:**
   - Create a PR against main branch
   - The workflow will run automatically

### Monitoring

Check workflow runs:
```bash
gh run list --workflow=bsu-orchestrator.yml
```

View specific run:
```bash
gh run view <run-id>
```

### Debugging

To debug workflow issues:
1. Check the workflow logs in GitHub Actions
2. Verify agent implementations are working:
   ```bash
   node --input-type=module -e "import { integrityAgent } from './src/agents/IntegrityAgent.js'; console.log(integrityAgent.check({prs:[], issues:[]}));"
   ```
3. Test validation:
   ```bash
   npm test
   ```

## Future Enhancements

Potential improvements:
1. Add Python code formatting with Black
2. Implement custom code review rules
3. Add integration with external compliance systems
4. Support for custom governance policies
5. Webhook notifications for merge decisions
6. Metrics dashboard for governance compliance

## Related Documentation

- [GOVERNANCE.md](../GOVERNANCE.md) - Repository governance policies
- [agents/registry.yaml](../agents/registry.yaml) - Agent registry
- [src/agents/](../src/agents/) - Agent implementations
