# BSM Governance Checklist - Usage Guide

> **Version**: 1.0.0  
> **Last Updated**: 2026-02-10

## Overview

This guide explains how to use the BSM Governance-Grade PR Review Checklist system to ensure all code changes meet our quality, security, and compliance standards.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Creating a Compliant PR](#creating-a-compliant-pr)
3. [Using the PR Template](#using-the-pr-template)
4. [Running Local Checks](#running-local-checks)
5. [Understanding Check Results](#understanding-check-results)
6. [Addressing Violations](#addressing-violations)
7. [Risk Level Guidelines](#risk-level-guidelines)
8. [Approval Process](#approval-process)
9. [Common Issues](#common-issues)
10. [Best Practices](#best-practices)

---

## Quick Start

### Before Creating a PR

1. **Create an Issue first** (if one doesn't exist)
2. **Assign the Issue to a milestone**
3. **Define acceptance criteria** in the Issue
4. **Work on a feature branch**
5. **Run local checks before pushing**:

```bash
# Run agent validation
npm run validate

# Run PR governance checks
npm run pr-check

# Verbose output for debugging
npm run pr-check:verbose
```

### Creating the PR

1. Use the provided PR template (auto-populated)
2. Fill in all required sections
3. Link to exactly ONE issue: `Closes #123`
4. Define risk level and justification
5. Check all applicable boxes in the checklist
6. Request reviews from appropriate team members

---

## Creating a Compliant PR

### Step 1: Issue and Milestone

**✅ DO:**
- Link to exactly one Issue: `Closes #123`, `Fixes #456`
- Ensure Issue has acceptance criteria
- Verify Issue is in an approved milestone
- Include milestone name in PR description

**❌ DON'T:**
- Link to multiple issues (create separate PRs)
- Start PR without an Issue
- Use untracked or ad-hoc milestones

**Example:**
```markdown
## Related Issue

Closes #123

This PR addresses all acceptance criteria defined in Issue #123:
- [x] Implement user authentication
- [x] Add login form
- [x] Write unit tests
```

### Step 2: Risk Assessment

**Define the risk level** based on the change impact:

| Risk Level | Examples | Approval Required |
|------------|----------|-------------------|
| **Low** | Documentation, logging, config tweaks | 1 reviewer |
| **Medium** | New features with tests, non-breaking API changes | 1 reviewer |
| **High** | Breaking changes, security-related, database schema | 2 reviewers (+ security) |
| **Critical** | Auth/authz, payment processing, data deletion | 3 reviewers (+ security + governance) |

**Example:**
```markdown
## Risk Assessment

**Risk Level**: medium

**Justification**:
This PR adds a new API endpoint for user profile retrieval. 
It includes comprehensive tests and does not modify existing 
authentication logic. Impact is limited to new functionality.
```

### Step 3: Ownership

**Specify clear ownership:**

```markdown
## Ownership

**Team**: Platform Engineering
**Owner**: @yourusername
**Review By**: 2026-03-15
```

### Step 4: Complete the Checklist

Go through each section of the governance checklist:

#### 🧭 Scope & Process
- [ ] PR links to exactly one Issue ✓
- [ ] Issue in approved milestone ✓
- [ ] All acceptance criteria met ✓
- [ ] No unrelated changes ✓
- [ ] Feature flags used (if needed) ✓

#### 🔐 Security
- [ ] No filesystem wildcards (`**`) ✓
- [ ] Network egress justified ✓
- [ ] Secrets environment-scoped ✓
- [ ] No secrets committed ✓
- [ ] Admin endpoints require auth ✓

*(Continue through all sections...)*

### Step 5: Documentation

Update all relevant documentation:

**Security changes** → Update `SECURITY.md`
```markdown
### New Security Feature

Added rate limiting to login endpoint:
- 5 attempts per 15 minutes
- IP-based throttling
- Exponential backoff
```

**API changes** → Update `README.md`
```markdown
### New Endpoint

`POST /api/users/profile` - Get user profile

**Authentication**: Required
**Rate Limit**: 100 req/15min
```

**Architecture changes** → Update `docs/ARCHITECTURE.md`
```markdown
### New Component: Profile Service

Handles user profile operations with caching layer...
```

---

## Using the PR Template

The PR template (`.github/pull_request_template.md`) is automatically loaded when you create a PR.

### Template Sections

1. **Summary** - Brief description
2. **Related Issue** - Link with `Closes #N`
3. **Type of Change** - Check applicable boxes
4. **Risk Assessment** - Level and justification
5. **Ownership** - Team, owner, review date
6. **Governance Checklist** - All 9 categories
7. **Testing** - Test coverage and manual testing
8. **Screenshots** - For UI changes
9. **Deployment Notes** - Special considerations
10. **Reviewer Notes** - Focus areas

### Filling Out the Template

**Good Example:**
```markdown
## Summary

Implements JWT-based authentication for API endpoints as described in #123.
Adds middleware for token validation and refresh token mechanism.

## Related Issue

Closes #123

## Type of Change

- [x] New feature (non-breaking change which adds functionality)
- [x] Security fix

## Risk Assessment

**Risk Level**: high

**Justification**:
Changes authentication mechanism for all API endpoints. 
While thoroughly tested, impacts all authenticated routes.
Includes migration path for existing tokens.

## Ownership

**Team**: Security
**Owner**: @security-lead
**Review By**: 2026-03-15
```

---

## Running Local Checks

### Basic Validation

```bash
# Validate agent configurations
npm run validate
```

**What it checks:**
- Agent YAML structure
- Action whitelist compliance
- Index file integrity

### PR Governance Check

```bash
# Run all governance checks
npm run pr-check
```

**Output:**
```
🏛️ BSM PR Governance Validator
============================================================

📋 Validating Scope & Process...
  ✅ PR links to exactly one Issue
  ⚠️ Feature flags used where required

🔐 Validating Security...
  ✅ No filesystem wildcards (**)
  ❌ Network call without allowlist check in src/api/client.js

...

📊 Validation Summary

Total Checks: 37
✅ Passed: 34
⚠️ Warnings: 2
❌ Errors: 1

🛑 BLOCKED: Critical governance violations found.
```

### Verbose Mode

```bash
# Get detailed output
npm run pr-check:verbose
```

Use verbose mode to:
- Debug specific check failures
- Understand why a check failed
- Get suggestions for fixes

---

## Understanding Check Results

### ✅ Passed (Green)

**Meaning**: Check passed, no action needed

**Example:**
```
✅ No filesystem wildcards (**)
```

### ⚠️ Warning (Yellow)

**Meaning**: Non-blocking issue, should be addressed

**Example:**
```
⚠️ Warning: Significant code changes without documentation updates
```

**Action**: Update documentation before final review

### ❌ Error (Red)

**Meaning**: Blocking issue, MUST be fixed

**Example:**
```
❌ Found ** wildcard in src/utils/files.js
```

**Action**: Fix immediately, PR will be blocked

### 🛑 Blocked

**Meaning**: PR cannot be merged

**Common Causes:**
- Critical security violations
- Missing required documentation
- No issue link
- Secrets committed
- Governance bypass attempted

---

## Addressing Violations

### Common Violations and Fixes

#### 1. No Issue Link

**Error:**
```
❌ PR must link to exactly one Issue
```

**Fix:**
Add to PR description:
```markdown
Closes #123
```

#### 2. Filesystem Wildcards

**Error:**
```
❌ Found ** wildcard in src/utils/files.js
```

**Fix:**
Replace wildcards with explicit paths:
```javascript
// ❌ WRONG
const files = await glob('**/*.yaml');

// ✅ RIGHT
const agentsDir = path.join(process.cwd(), 'data', 'agents');
const files = await fs.readdir(agentsDir);
```

#### 3. Missing Risk Level

**Error:**
```
❌ Registry changes must declare risk.level
```

**Fix:**
Add to PR description:
```markdown
## Risk Assessment

**Risk Level**: medium

**Justification**: 
Changes agent configuration structure but does not affect runtime behavior.
```

#### 4. Documentation Gap

**Error:**
```
❌ Security-related changes should update SECURITY.md
```

**Fix:**
Update `SECURITY.md`:
```markdown
### Admin Token Security

- **Minimum Length**: 16 characters in production (changed from 12)
- **Validation**: Must be set before server starts
...
```

#### 5. Hardcoded Secret

**Error:**
```
❌ Possible hardcoded secret in src/config/api.js
```

**Fix:**
Use environment variables:
```javascript
// ❌ WRONG
const apiKey = "sk-1234567890abcdef";

// ✅ RIGHT
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('API key not configured');
}
```

---

## Risk Level Guidelines

### Determining Risk Level

Use this decision tree:

```
Does it affect authentication or authorization?
├─ YES → CRITICAL
└─ NO
    │
    Does it modify security controls or handle sensitive data?
    ├─ YES → HIGH
    └─ NO
        │
        Does it change API contracts or database schema?
        ├─ YES → MEDIUM
        └─ NO
            │
            Is it documentation, logging, or minor config?
            ├─ YES → LOW
            └─ NO → MEDIUM (default)
```

### Risk Level Examples

**CRITICAL:**
- Changing authentication logic
- Modifying authorization checks
- Payment processing changes
- Data deletion operations
- Secret rotation mechanisms

**HIGH:**
- Breaking API changes
- Database schema migrations
- Security vulnerability fixes
- Network security modifications
- Admin endpoint changes

**MEDIUM:**
- New API endpoints
- Non-breaking feature additions
- Performance optimizations
- Dependency updates (major versions)
- Configuration structure changes

**LOW:**
- Documentation updates
- Log message changes
- Code comments
- Test improvements
- Minor UI tweaks

---

## Approval Process

### Required Approvals by Risk Level

| Risk Level | Reviewers Required | Who |
|------------|-------------------|-----|
| Low | 1 | Any team member |
| Medium | 1 | Team lead or senior |
| High | 2 | Team lead + Security |
| Critical | 3 | Team lead + Security + Governance |

### Approval Workflow

1. **PR Created** → Automated checks run
2. **Governance Check Passes** → Reviewers assigned
3. **Code Review** → Reviewers provide feedback
4. **Changes Requested** → Author addresses feedback
5. **Re-review** → Reviewers approve
6. **All Approvals Met** → PR ready to merge
7. **Final CI Check** → Automated tests run
8. **Merge** → Changes deployed

### Fast-Track (Emergencies Only)

For **P0/P1 incidents** only:

1. Create incident ticket
2. Get on-call engineer approval
3. Create PR with `[EMERGENCY]` prefix
4. Merge with single approval
5. **Post-merge review within 24 hours**
6. Incident retrospective within 7 days

---

## Common Issues

### Issue: "Works locally but validation fails in CI"

**Cause**: Environment differences, uncommitted files

**Solution:**
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm ci

# Run checks in clean environment
npm run validate
npm run pr-check
```

### Issue: "Multiple issues linked"

**Cause**: PR tries to solve multiple problems

**Solution**: Create separate PRs
```markdown
# Instead of:
Closes #123
Closes #456

# Do:
PR #1: Closes #123
PR #2: Closes #456
```

### Issue: "Approval count not updating"

**Cause**: GitHub review state not finalized

**Solution:**
- Ensure reviewers click "Approve" (not just comment)
- Re-request review if needed
- Check that review is not dismissed

### Issue: "Documentation check fails but I updated docs"

**Cause**: Wrong documentation file or insufficient changes

**Solution:**
- Check which files should be updated (see error message)
- Ensure changes are substantial (not just typos)
- Verify file is in commit

---

## Best Practices

### 1. Small, Focused PRs

✅ **DO:**
- One PR per Issue
- Single logical change
- 100-400 lines of code

❌ **DON'T:**
- Mix multiple features
- Include unrelated refactoring
- Create "mega PRs" (>500 lines)

### 2. Clear Commit Messages

```bash
# Good
git commit -m "Add JWT authentication middleware

- Implement token validation
- Add refresh token mechanism
- Update security documentation
- Add comprehensive tests

Closes #123"

# Bad
git commit -m "fix stuff"
```

### 3. Comprehensive Testing

```javascript
// ✅ Include edge cases
describe('Authentication', () => {
  it('accepts valid token', async () => { ... });
  it('rejects expired token', async () => { ... });
  it('rejects invalid signature', async () => { ... });
  it('handles missing token', async () => { ... });
});
```

### 4. Documentation First

1. Update documentation BEFORE code review
2. Include examples and use cases
3. Document breaking changes prominently
4. Add migration guides if needed

### 5. Security Mindset

- **Never** commit secrets
- **Always** validate inputs
- **Use** environment variables for configuration
- **Log** security events (without sensitive data)
- **Check** for injection vulnerabilities

### 6. Reviewer-Friendly PRs

- Write clear PR description
- Add context and motivation
- Highlight tricky parts
- Include screenshots for UI changes
- Respond promptly to feedback

---

## Getting Help

### Resources

- **Governance Policy**: [GOVERNANCE.md](./GOVERNANCE.md)
- **Security Policy**: [SECURITY.md](./SECURITY.md)
- **Architecture Docs**: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **Mobile Mode**: [MOBILE_MODE.md](./MOBILE_MODE.md)

### Contact

- **Governance Team**: Open an issue with `governance` label
- **Security Team**: security@lexdo.uk or private security advisory
- **General Questions**: Team Slack or repository discussions

---

## Changelog

### Version 1.0.0 (2026-02-10)

- Initial release of governance checklist system
- Comprehensive documentation added
- Automated checks implemented
- PR template created

---

**Document Owner**: Governance Team  
**Next Review**: 2026-05-10
