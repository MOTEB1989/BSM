# Pull Request

## Summary

<!-- Provide a brief description of the changes in this PR -->


## Related Issue

<!-- Link to the issue this PR addresses -->
Closes #

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Configuration change
- [ ] Security fix
- [ ] Performance improvement

## Risk Assessment

**Risk Level**: <!-- low / medium / high / critical -->

**Justification**:
<!-- Explain why this risk level is appropriate -->


## Ownership

**Team**: <!-- Platform Engineering / Security / Data / DevOps -->  
**Owner**: @<!-- GitHub username -->  
**Review By**: <!-- YYYY-MM-DD (within 90 days) -->

---

## ✅ BSM PR Review Checklist — Governance-Grade

### 🧭 Scope & Process (Hard Gate)

- [ ] PR links to exactly **one** Issue
- [ ] Issue belongs to an approved Milestone
- [ ] All Acceptance Criteria from the Issue are satisfied (verified, not assumed)
- [ ] No unrelated changes or refactors included
- [ ] One Issue = One PR (confirmed)
- [ ] Feature flags used where required (for new features, breaking changes, or high-risk functionality)

### 🏛️ Governance & Ownership

- [ ] `risk.level` explicitly defined and justified (if registry change)
- [ ] Approval rules respected (human / policy / dual)
- [ ] `ownership.team` and `owner` present
- [ ] `lifecycle.review_by` present and reasonable
- [ ] No implicit privilege escalation introduced

### 🔐 Security (Fail = Block)

- [ ] No filesystem wildcards (`**`) in production code
- [ ] Network egress is deny-by-default
- [ ] Any outbound access is explicitly justified and documented
- [ ] Secrets are environment-scoped (dev / prod)
- [ ] No secrets committed or logged (even partially)
- [ ] Admin/system endpoints require `ADMIN_TOKEN`
- [ ] LAN-only restrictions respected (if enabled)
- [ ] Input validation implemented for all user inputs
- [ ] No SQL injection or XSS vulnerabilities

### 📱 Mobile & Local-Only Constraints

- [ ] Mobile Mode restrictions enforced (if applicable)
- [ ] No destructive or irreversible actions allowed from mobile
- [ ] `/api/status` behavior unchanged or explicitly documented
- [ ] No new exposure of internal/system endpoints

### ⚙️ Runtime & Operational Safety

- [ ] Agents do not auto-start unintentionally
- [ ] Startup behavior respects `PROFILE` environment variable
- [ ] Safe Mode blocks all external calls (if applicable)
- [ ] Emergency kill-switch works and is logged (if involved)
- [ ] No performance regression or resource abuse

### 🧾 Audit & Logging (Governance Critical)

- [ ] Admin/system actions logged (append-only)
- [ ] Logs include: timestamp, IP, action, result
- [ ] Logs contain no sensitive data (passwords, tokens, PII)
- [ ] Audit behavior documented if changed

### 🧪 Quality & Validation

- [ ] `npm run validate` passes
- [ ] Tests pass (if applicable)
- [ ] Linting passes (if applicable)
- [ ] Code is readable, minimal, and documented
- [ ] No breaking changes (or explicitly documented and versioned)
- [ ] Test coverage maintained or improved

### 📄 Documentation & Traceability

- [ ] Documentation updated as required:
  - [ ] `SECURITY.md` (if security-related)
  - [ ] `ARCHITECTURE.md` (if architecture changed)
  - [ ] `MOBILE_MODE.md` (if mobile restrictions changed)
  - [ ] `GOVERNANCE.md` (if governance changed)
  - [ ] `README.md` (if public API changed)
- [ ] Changes are traceable back to Issue intent
- [ ] No undocumented behavioral changes

### ⚠️ Red-Flag Check (Immediate Block if Yes)

- [ ] **NO** - Expands agent permissions without justification
- [ ] **NO** - Introduces hidden behavior behind existing flags
- [ ] **NO** - Bypasses governance or validation gates
- [ ] **NO** - "Works locally" but not verifiable by reviewer

---

## 🧪 Testing

### Test Coverage

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

**Test Results**:
```
# Paste test output here
```

### Manual Testing Steps

1. 
2. 
3. 

---

## 📸 Screenshots / Demo

<!-- If UI changes, include before/after screenshots or a demo video -->


---

## 🔍 Reviewer Notes

<!-- Any specific areas you'd like reviewers to focus on -->


---

## 📋 Deployment Notes

<!-- Any special deployment considerations, environment variables, or migration steps -->


---

## 🚀 Post-Merge Actions

<!-- Actions to be taken after merging (e.g., update documentation, notify users, monitor metrics) -->


---

## Checklist before requesting review

- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published in downstream modules
- [ ] I have run `npm run pr-check` and addressed all errors

---

## 🏁 Reviewer Decision (Mandatory)

**Decision**: <!-- Approve / Request Changes / Block -->

**Reason**: 
<!-- Required: Document specific reason for your decision -->


---

## Additional Context

<!-- Add any other context about the PR here -->
