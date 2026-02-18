# BSU Supreme Orchestrator - Quick Reference

## 🚀 Quick Start

The BSU Supreme Orchestrator automatically validates and merges PRs through three quality-gated stages.

---

## 📋 Three Stages

### 1️⃣ Governance Check (فحص الحوكمة)
- Validates agent configs
- Runs governance checklist
- Security scan with Gitleaks
- **Pass:** Compliance score ≥ 50

### 2️⃣ Code Polisher (تحسين الكود)
- Code review (min 7/10)
- Security scan (no critical CVEs)
- Integrity check (min 80/100)
- **Pass:** All gates green

### 3️⃣ Strategic Merge (الدمج الفوري)
- Auto-approval
- Squash merge
- Success labels
- **Result:** PR merged ✅

---

## ⚡ Triggers

**Automatic:**
- PR opened/updated to `main` or `develop`
- PR marked ready for review

**Manual:**
```bash
# Via GitHub UI: Actions → BSU Supreme Orchestrator → Run workflow
# Specify PR number
```

---

## 🎯 Quality Thresholds

| Metric | Minimum | Check |
|--------|---------|-------|
| Code Score | 7/10 | Code Review Agent |
| Integrity | 80/100 | Integrity Agent |
| Security | 0 critical | Security Scanner |
| Governance | Pass | Compliance check |

---

## 🏷️ Labels Added

**Success:**
- `auto-merged`
- `bsu-approved`
- `quality-verified`

**Failure:**
- `blocked`
- `needs-attention`

---

## 🔍 Checking Status

1. Go to PR → Checks tab
2. Find "BSU Supreme Orchestrator"
3. Expand to see all three stages
4. Click stage for detailed logs
5. Read bot comments on PR

---

## ⚠️ Common Issues

### PR Not Merging?
**Check:**
- [ ] All stages green?
- [ ] Conflicts resolved?
- [ ] Required checks passing?
- [ ] Branch protection rules?

### Stage 2 Fails?
**Possible causes:**
- Code score < 7
- Security vulnerabilities
- Integrity score < 80
**Action:** Review detailed report in PR comments

### Stage 3 Fails?
**Possible causes:**
- Protected branch rules
- Merge conflicts
- Required reviews missing
**Action:** Check error message in logs

---

## 🛠️ Configuration

### Adjust Code Score Threshold
`.github/workflows/bsu-supreme-orchestrator.yml` line ~215:
```yaml
elif [ "$code_score" -lt 7 ]  # Change this number
```

### Adjust Integrity Threshold
`.github/workflows/bsu-supreme-orchestrator.yml` line ~219:
```yaml
elif [ "$integrity_score" -lt 80 ]  # Change this number
```

### Disable Auto-Merge
`.github/workflows/bsu-supreme-orchestrator.yml` line ~267:
```yaml
if: false  # Add this to strategic-merge job
```

---

## 📊 Reading Reports

Each stage posts a comment:

**Stage 1 Report:**
```
✅ Governance Check: PASSED
Compliance Score: 100/100
Decision: approve
```

**Stage 2 Report:**
```
✅ Code Quality Check: READY TO MERGE
Code Review: 8/10
Security Scan: ✅ Passed
Integrity Check: 95/100
```

**Stage 3 Report:**
```
✅ MERGE SUCCESSFUL
PR #123 has been merged
Method: Squash merge
Approved by: BSM Orchestrator
```

---

## 🔐 Security

**Permissions:**
- Stages 1 & 2: Read only
- Stage 3: Write (merge only)

**Safety:**
- Multiple validation layers
- Audit trail in comments
- Graceful failure handling
- No secret exposure

---

## 📚 Full Documentation

See `docs/BSU-SUPREME-ORCHESTRATOR.md` for:
- Architecture details
- Decision tree diagrams
- Troubleshooting guide
- Advanced configuration
- Integration patterns

---

## 🆘 Support

**Logs:** Actions tab → Workflow run → Job → Step
**Issues:** Check PR comments for detailed reports
**Docs:** `docs/BSU-SUPREME-ORCHESTRATOR.md`
**Code:** `.github/workflows/bsu-supreme-orchestrator.yml`

---

## ✅ Checklist for PRs

Before opening PR:
- [ ] Code follows project conventions
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No merge conflicts
- [ ] Lint/build passes locally

After opening PR:
- [ ] Watch Stage 1 (governance)
- [ ] Review Stage 2 feedback
- [ ] Wait for Stage 3 (auto-merge)
- [ ] Or address issues and repush

---

*BSM Supreme Orchestrator v1.0 | نظام BSU للإشراف التلقائي*
