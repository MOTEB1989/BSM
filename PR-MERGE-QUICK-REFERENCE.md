# BSU PR Merge Agent - Quick Reference

**Version:** 2.0  
**Last Updated:** 2026-02-19  
**Status:** ✅ Active & Operational

---

## What is the PR Merge Agent?

The **BSU PR Merge Agent** is an AI-powered automation system that evaluates pull requests against quality gates and automatically merges them when all requirements are met.

### Core Functions
- 🔍 **Analyze** PRs for code quality, security, and compliance
- ⚖️ **Evaluate** changes against 37 governance checks
- ✅ **Approve** PRs that meet all quality thresholds
- 🚀 **Merge** approved PRs automatically
- 🚫 **Block** PRs with critical issues

---

## Quick Start

### For PR Authors

#### 1. Create a PR
```bash
git checkout -b feature/my-feature
git commit -m "Add new feature"
git push origin feature/my-feature
```

#### 2. Wait for Agent Review
The agent automatically runs when you:
- Open a PR
- Push new commits
- Mark PR as ready for review

#### 3. Check Agent Report
Look for the **BSU Agent Pipeline Report** comment on your PR:

```
✅ BSU Agent Pipeline Report

| Agent           | Result      |
|-----------------|-------------|
| Code Review     | 8/10        |
| Security Scan   | ✅ Passed   |
| Integrity Check | 100/100     |

Decision: approve_and_merge
```

#### 4. Auto-Merge Happens
If approved, your PR will be automatically:
- ✅ Approved
- 🏷️ Labeled (agent-approved, auto-merge)
- 🔀 Merged (squash method)

---

## Quality Gate Requirements

### Minimum Requirements for Auto-Merge

| Gate | Threshold | Description |
|------|-----------|-------------|
| **Code Review Score** | >= 7/10 | SOLID, DRY, KISS principles |
| **Security Scan** | 0 critical | No critical vulnerabilities |
| **Integrity Check** | >= 70/100 | Repository health |
| **Approvals** | >= 2 | Independent human approvals |
| **CI Tests** | All pass | npm test, validation, linting |
| **Governance** | All pass | 37 governance checks |

### Risk-Based Approval Requirements

| Risk Level | Required Approvals | Auto-Merge Allowed |
|------------|-------------------|-------------------|
| Low | 1 | ✅ Yes |
| Medium | 1 | ✅ Yes |
| High | 2 | ⚠️ With review |
| Critical | 3 | ❌ Manual only |

---

## Agent Decisions

### ✅ approve_and_merge
**Condition:** All quality gates passed  
**Action:** Auto-approve and merge  
**Labels:** `agent-approved`, `auto-merge`

### ⚠️ request_changes
**Condition:** Code review score < 7  
**Action:** Request improvements  
**Labels:** `changes-requested`

### 🚫 block_pr
**Condition:** Security vulnerabilities detected  
**Action:** Block merge  
**Labels:** `blocked`, `security-issue`

---

## Common Scenarios

### Scenario 1: PR Approved Immediately
```
Your code: ✅ Score 9/10
Security: ✅ No issues
Tests: ✅ All passing
→ Result: Auto-merged within 2 minutes
```

### Scenario 2: Code Quality Issues
```
Your code: ⚠️ Score 6/10
Security: ✅ No issues
Tests: ✅ All passing
→ Result: Changes requested
→ Action: Review feedback, improve code, push updates
```

### Scenario 3: Security Issues
```
Your code: ✅ Score 8/10
Security: 🚫 1 critical vulnerability
Tests: ✅ All passing
→ Result: PR blocked
→ Action: Fix vulnerability immediately
```

### Scenario 4: Test Failures
```
Your code: ✅ Score 8/10
Security: ✅ No issues
Tests: ❌ 3 tests failing
→ Result: Waiting for fixes
→ Action: Fix tests, push updates
```

---

## How to Pass Quality Gates

### 1. Code Review (>= 7/10)

**Good Practices:**
```javascript
✅ Follow SOLID principles
✅ Use meaningful variable names
✅ Add comments for complex logic
✅ Keep functions small and focused
✅ Handle errors properly
✅ Use async/await correctly
```

**Bad Practices:**
```javascript
❌ Huge functions (>100 lines)
❌ Deep nesting (>3 levels)
❌ Magic numbers without constants
❌ Unhandled promise rejections
❌ console.log() for debugging
❌ Commented-out code
```

### 2. Security Scan (0 Critical)

**Common Issues:**
```javascript
❌ Secrets in code
❌ SQL injection vulnerabilities
❌ XSS vulnerabilities
❌ Insecure dependencies
❌ Hardcoded passwords
```

**Solutions:**
```javascript
✅ Use environment variables for secrets
✅ Use parameterized queries
✅ Sanitize user input
✅ Update dependencies regularly
✅ Use strong password policies
```

### 3. Governance Checks (37/37)

**Key Requirements:**
- ✅ PR links to an issue
- ✅ Issue has a milestone
- ✅ Risk level defined
- ✅ No unrelated changes
- ✅ Documentation updated
- ✅ No secrets committed
- ✅ Tests pass locally

---

## Troubleshooting

### Agent Not Responding
**Symptoms:** No agent comment after 5 minutes  
**Causes:**
- PR is a draft (mark as ready for review)
- Workflow is disabled (check `.github/workflows/auto-merge.yml`)
- Secrets not configured (check repository settings)

**Solutions:**
```bash
# Check workflow status
gh workflow list
gh workflow run auto-merge.yml

# Verify secrets
gh secret list
```

### Agent Blocked My PR
**Symptoms:** PR labeled `blocked` or `security-issue`  
**Causes:**
- Security vulnerability detected
- Critical governance violation
- Malicious code pattern

**Solutions:**
1. Read the agent report carefully
2. Fix the identified issues
3. Push updates
4. Wait for re-evaluation

### Agent Score Too Low
**Symptoms:** Code review score < 7  
**Causes:**
- Code complexity too high
- Poor naming conventions
- Missing error handling
- Lack of documentation

**Solutions:**
1. Refactor complex functions
2. Improve variable names
3. Add error handling
4. Add comments and documentation

---

## Manual Override

### When to Override
- Agent decision is incorrect (rare)
- Urgent hotfix required
- False positive detection

### How to Override
```bash
# Requires admin privileges
# Disable auto-merge workflow temporarily
gh workflow disable auto-merge

# Merge manually
gh pr merge <pr-number> --squash

# Re-enable workflow
gh workflow enable auto-merge
```

### Post-Override Actions
1. 📝 Document reason in PR comment
2. 🔍 Review agent decision for improvements
3. 🐛 File issue if agent had a bug
4. 📊 Update quality thresholds if needed

---

## Advanced Configuration

### Customizing Quality Gates

**File:** `data/agents/pr-merge-agent.yaml`

```yaml
conditions:
  min_approvals: 2              # Change to 1 for faster merges
  max_complexity: 8             # Lower for stricter quality
  min_compliance_score: 90      # Governance threshold
  required_checks:
    - code-review-agent: approved
    - security-agent: passed
    - ci_tests: passed
```

### Adjusting Risk Thresholds

**File:** `.github/workflows/auto-merge.yml`

```yaml
# Adjust code review threshold
if [ "$code_score" -lt 7 ]; then  # Change 7 to 8 for stricter
  echo "action=request_changes"
fi
```

---

## Metrics & Monitoring

### Success Metrics
- **Auto-Merge Rate:** Target 80%+ of PRs
- **Code Review Score:** Average 8+/10
- **Security Issues:** 0 critical per week
- **Merge Time:** < 30 minutes for approved PRs

### Dashboard Access
```bash
# View recent merges
gh pr list --state merged --limit 10

# Check agent decisions
gh pr view <pr-number> --comments

# Review workflow runs
gh run list --workflow=auto-merge.yml
```

---

## FAQ

### Q: Can I test the agent locally?
**A:** Yes! Run the validation checks:
```bash
npm run ci:check      # Full CI pipeline
npm run pr-check      # Governance checks
npm test              # Unit tests
```

### Q: How long does agent review take?
**A:** Typically 1-3 minutes for standard PRs. Complex PRs may take up to 5 minutes.

### Q: What if the agent makes a mistake?
**A:** Use manual override (requires admin), then file an issue to improve the agent.

### Q: Can I disable auto-merge for my PR?
**A:** Yes, mark your PR as a draft. The agent skips draft PRs.

### Q: How do I improve my code review score?
**A:** Focus on SOLID principles, reduce complexity, improve naming, add error handling, and write tests.

---

## Support & Feedback

### Get Help
- 📖 Read: `PR-MERGE-READINESS-REPORT.md`
- 🐛 Issues: GitHub Issues with label `agent:pr-merge`
- 💬 Discuss: GitHub Discussions

### Report Agent Bugs
```bash
# Create issue with agent feedback
gh issue create \
  --title "PR Merge Agent: [Brief Description]" \
  --body "PR: #123\nExpected: X\nActual: Y" \
  --label "agent:pr-merge,bug"
```

### Suggest Improvements
- Quality gate thresholds
- New validation checks
- Performance optimizations
- Documentation improvements

---

## Related Documentation

- 📘 **Full Report:** `PR-MERGE-READINESS-REPORT.md`
- 📙 **Agent Config:** `data/agents/pr-merge-agent.yaml`
- 📕 **Workflows:** `.github/workflows/auto-merge.yml`
- 📗 **Governance:** `.github/workflows/pr-governance-check.yml`
- 📓 **Architecture:** `CLAUDE.md`

---

*Last Updated: 2026-02-19 by BSU PR Merge Agent v2*
