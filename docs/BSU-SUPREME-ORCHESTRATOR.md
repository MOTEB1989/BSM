# BSU Supreme Orchestrator

## نظام الإشراف والدمج التلقائي

The BSU Supreme Orchestrator is a three-stage automated workflow that manages PR review and merging with comprehensive quality gates.

## Architecture

### Stage 1: 🔍 Governance Check (المرحلة 1: فحص الحوكمة)

**Purpose:** Validates governance compliance and security requirements

**Checks Performed:**
- ✅ Agent configuration validation (`npm test`)
- ✅ PR governance checklist (`npm run pr-check:verbose`)
- ✅ Security scanning with Gitleaks
- ✅ Compliance scoring

**Outputs:**
- `passed`: true/false - Overall governance status
- `compliance_score`: 0-100 - Compliance score
- `decision`: approve/block - Final governance decision

**Success Criteria:**
- All validation tests pass
- No blocking governance issues
- Security scan completes without critical findings

---

### Stage 2: ✨ Code Polisher (المرحلة 2: تحسين الكود)

**Purpose:** Evaluates code quality, security, and repository health

**Agents Executed:**
1. **Code Review Agent** - Analyzes code quality (minimum score: 7/10)
2. **Security Scanner** - Checks for CVEs and vulnerabilities
3. **Integrity Agent** - Assesses repository health (minimum: 80/100)

**Outputs:**
- `code_score`: 0-10 - Code review score
- `integrity_score`: 0-100 - Repository health score
- `security_passed`: true/false - Security check status
- `ready_to_merge`: true/false - Final merge decision

**Success Criteria:**
- Code score ≥ 7/10
- No critical security vulnerabilities
- Integrity score ≥ 80/100

---

### Stage 3: 🚀 Strategic Merge (المرحلة 3: الدمج الفوري)

**Purpose:** Immediate execution of merge when all quality gates pass

**Actions:**
1. **Auto-Approval** - Programmatic PR approval by BSM Orchestrator
2. **Squash Merge** - Immediate merge with custom commit message
3. **Labeling** - Adds `auto-merged`, `bsu-approved`, `quality-verified` labels
4. **Reporting** - Posts comprehensive merge confirmation

**Merge Strategy:**
- **Primary:** Direct squash merge via `pulls.merge` API
- **Fallback:** Enable auto-merge via GraphQL mutation
- **Method:** Squash merge (consolidates all commits)

**Commit Format:**
```
✅ Auto-Merged: PR #123 (Direct Execution)

Merged by BSU Supreme Orchestrator after passing all quality gates.
```

**Error Handling:**
- Gracefully handles self-approval limitations (PR owner scenario)
- Falls back to auto-merge if direct merge fails (pending checks)
- Logs detailed error messages for debugging

---

## Trigger Events

### Automatic Triggers
```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
    branches: [main, develop]
```

### Manual Trigger
```yaml
workflow_dispatch:
  inputs:
    pr_number:
      description: 'PR number to process'
      required: true
```

---

## Permissions

### Read Permissions (Default)
- `contents: read`
- `pull-requests: read`

### Write Permissions (Stage 3 Only)
- `contents: write` - For merging
- `pull-requests: write` - For approval and labeling

---

## Concurrency Control

```yaml
concurrency:
  group: bsu-orchestrator-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```

Ensures only one orchestrator run per PR at a time. New pushes cancel in-progress runs.

---

## Quality Gates Decision Tree

```
┌─────────────────────────┐
│   Governance Check      │
│   (Stage 1)             │
└───────────┬─────────────┘
            │
    ┌───────▼──────────┐
    │  Passed?         │
    └───────┬──────────┘
            │
            ├─── NO ──► ❌ BLOCKED
            │
            └─── YES ──┐
                       │
            ┌──────────▼──────────┐
            │  Code Polisher       │
            │  (Stage 2)           │
            └──────────┬───────────┘
                       │
            ┌──────────▼──────────┐
            │  Code Score ≥ 7?    │
            │  Security OK?        │
            │  Integrity ≥ 80?     │
            └──────────┬───────────┘
                       │
                ┌──────▼──────┐
                │  All Pass?  │
                └──────┬──────┘
                       │
                ├─── NO ──► ⚠️ CHANGES NEEDED
                │
                └─── YES ──┐
                           │
                ┌──────────▼──────────┐
                │  Strategic Merge    │
                │  (Stage 3)          │
                └──────────┬──────────┘
                           │
                           ▼
                    ✅ AUTO-MERGED
```

---

## Failure Handling

### Dedicated Failure Stage
Runs when:
- Governance check fails
- Code quality issues detected
- Any stage encounters an error

**Actions:**
- Posts detailed failure report
- Adds `blocked` and `needs-attention` labels
- Provides clear remediation steps

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_BSM_KEY` | No | Code Review Agent AI capability |
| `PERPLEXITY_KEY` | No | Security Scanner AI enhancement |
| `GITHUB_TOKEN` | Yes | Auto-provided by GitHub Actions |

---

## Usage Examples

### Example 1: Normal PR Flow
```
1. Developer opens PR → Triggers orchestrator
2. Stage 1 validates governance → ✅ Pass
3. Stage 2 checks code quality → ✅ Score: 8/10
4. Stage 3 auto-merges → ✅ Merged successfully
```

### Example 2: Quality Gate Failure
```
1. Developer opens PR → Triggers orchestrator
2. Stage 1 validates governance → ✅ Pass
3. Stage 2 checks code quality → ❌ Score: 5/10
4. Failure handler posts report → ⚠️ Changes needed
5. Developer improves code → Re-triggers orchestrator
```

### Example 3: Governance Block
```
1. Developer opens PR → Triggers orchestrator
2. Stage 1 validates governance → ❌ Blocked
3. Failure handler posts report → 🚫 PR blocked
4. Stage 2 & 3 skipped
```

---

## Integration with Existing Workflows

### Relationship with `auto-merge.yml`
- BSU Supreme Orchestrator is a more comprehensive version
- Includes additional governance validation stage
- More detailed reporting and error handling
- Both can coexist (use different trigger conditions)

### Relationship with `pr-governance-check.yml`
- BSU Orchestrator includes governance checks
- Can complement each other for redundancy
- pr-governance-check focuses on documentation/compliance
- BSU Orchestrator adds automated merge capability

---

## Monitoring and Debugging

### Success Indicators
- ✅ Green checkmarks in PR checks
- `auto-merged` label applied
- Comprehensive report comments posted
- PR merged and closed

### Failure Indicators
- ❌ Red X marks in PR checks
- `blocked` or `needs-attention` labels
- Detailed failure reports in comments
- PR remains open

### Logs Location
Each stage produces detailed logs accessible via:
```
Actions → Select workflow run → Select job → View step logs
```

---

## Security Considerations

### Safe Design Principles
1. **Least Privilege**: Only Stage 3 has write permissions
2. **Validation First**: Multiple quality gates before merge
3. **Audit Trail**: Comprehensive logging and reporting
4. **Graceful Degradation**: Fallback mechanisms for failures
5. **Transparency**: All actions visible in PR comments

### Secret Handling
- No secrets stored in workflow file
- API keys accessed via GitHub Secrets
- Secrets never logged or exposed

---

## Maintenance

### Updating Quality Thresholds
Edit the workflow file:
```yaml
# In code-polisher job, decision step:
elif [ "$code_score" -lt 7 ]  # Change minimum code score
elif [ "$integrity_score" -lt 80 ]  # Change minimum integrity score
```

### Disabling Auto-Merge
To prevent automatic merging while keeping validation:
```yaml
# In strategic-merge job:
if: false  # Temporarily disable stage 3
```

### Adding New Quality Gates
Add new steps in Stage 2 (code-polisher job):
```yaml
- name: 🔍 New Quality Check
  id: new-check
  run: |
    # Your check logic here
    echo "result=pass" >> $GITHUB_OUTPUT
```

Then update the decision step to include the new check.

---

## Troubleshooting

### "Could not create formal review (User is owner)"
**Cause:** PR author cannot approve their own PR
**Impact:** None - This is expected and logged but doesn't prevent merge
**Solution:** No action needed - merge proceeds anyway

### "Merge failed: ... is not mergeable"
**Cause:** PR has conflicts or failing required checks
**Impact:** Direct merge fails, auto-merge fallback enabled
**Solution:** Resolve conflicts or wait for checks to pass

### "Auto-merge fallback failed"
**Cause:** Repository doesn't have auto-merge enabled
**Impact:** PR not merged automatically
**Solution:** Enable auto-merge in repository settings or merge manually

---

## Version History

### v1.0.0 (Current)
- Initial implementation
- Three-stage pipeline
- Immediate merge capability
- Comprehensive quality gates
- Bilingual documentation

---

## Contributing

To improve the orchestrator:
1. Test changes on a fork first
2. Update this documentation
3. Follow the PR process (will be validated by the orchestrator!)
4. Monitor first production run carefully

---

## Support

For issues or questions:
- Check logs in GitHub Actions tab
- Review PR comments for detailed reports
- See `CLAUDE.md` for project architecture
- Consult `GOVERNANCE.md` for compliance rules

---

*Maintained by BSM Team | نظام إدارة الأعمال*
