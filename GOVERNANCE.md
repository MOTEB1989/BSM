# BSM Governance Policy

> **Last Updated**: 2026-02-10  
> **Version**: 1.0.0  
> **Status**: Active

## Overview

This document defines the governance structure, policies, and procedures for the BSM (Business Service Management) platform. All changes to the codebase, infrastructure, and operations must comply with these governance requirements.

## Governance Principles

### 1. Transparency
- All decisions are documented
- Change rationale is clearly stated
- Process is visible to all stakeholders

### 2. Accountability
- Clear ownership for all components
- Defined approval authorities
- Audit trail for all decisions

### 3. Traceability
- Changes link to requirements (Issues)
- Requirements link to milestones
- Milestones link to business objectives

## Change Management

### Pull Request Requirements

#### 🎯 Scope & Process (Hard Gate)

Every PR must satisfy these requirements:

1. **Issue Linking** (REQUIRED)
   - PR must link to exactly **one** Issue
   - Use GitHub linking syntax: `Closes #123`, `Fixes #456`
   - Issue must exist and be open before PR creation

2. **Milestone Assignment** (REQUIRED)
   - Issue must belong to an approved milestone
   - Milestone must have:
     - Clear objective
     - Target date
     - Designated owner

3. **Acceptance Criteria** (REQUIRED)
   - All acceptance criteria from the Issue must be met
   - Criteria must be **verified**, not assumed
   - Evidence of verification documented in PR

4. **Scope Discipline** (REQUIRED)
   - No unrelated changes or refactors
   - One Issue = One PR (strict enforcement)
   - Additional issues require separate PRs

5. **Feature Flags** (CONDITIONAL)
   - Required for:
     - New features affecting >10% of users
     - Breaking changes
     - High-risk functionality
   - Configuration in environment variables

### Ownership & Approval

#### Risk Levels

All changes must declare a risk level:

**Registry Changes** (modifying agents, configs, workflows):

```yaml
risk:
  level: low | medium | high | critical
  justification: "Clear explanation of why this risk level is appropriate"
```

**Risk Level Definitions**:

- **Low**: Configuration tweaks, documentation, logging
- **Medium**: New features with tests, non-breaking API changes
- **High**: Breaking changes, security-related, database schema
- **Critical**: Authentication, authorization, payment, data deletion

#### Approval Rules

**By Risk Level**:

| Risk Level | Approvals Required | Type |
|------------|-------------------|------|
| Low | 1 | Human or Policy |
| Medium | 1 | Human |
| High | 2 | Human (includes security) |
| Critical | 3 | Human (includes security + governance) |

**By Type**:

- **Human Approval**: Manual code review by authorized person
- **Policy Approval**: Automated checks pass (tests, linting, security scans)
- **Dual Approval**: Two independent reviewers required

#### Ownership

All components must have defined ownership:

```yaml
ownership:
  team: "Platform Engineering" | "Security" | "Data" | "DevOps"
  owner: "GitHub username of primary maintainer"
  
lifecycle:
  review_by: "YYYY-MM-DD"  # Must be within 90 days
  reviewed_last: "YYYY-MM-DD"
```

**Ownership Responsibilities**:
1. Review PRs affecting owned components
2. Maintain documentation
3. Monitor production issues
4. Conduct regular lifecycle reviews

#### Privilege Escalation Prevention

❌ **BLOCKED** - Changes that introduce implicit privilege escalation:

- Expanding agent permissions without explicit justification
- Bypassing authentication checks
- Adding admin access to non-admin endpoints
- Modifying role definitions to grant more access
- Weakening authorization logic

✅ **REQUIRED** - For any privilege changes:
1. Document current vs. new privileges
2. Justify the need with business requirement
3. Security team review
4. Explicit acknowledgment of risk

## Quality Gates

### Automated Checks (Policy Approval)

All PRs must pass:

1. **Validation**
   ```bash
   npm run validate
   ```
   - Agent YAML structure validation
   - Action whitelist compliance
   - Index file integrity

2. **Linting** (if applicable)
   ```bash
   npm run lint
   ```
   - Code style compliance
   - Best practices enforcement

3. **Tests** (if applicable)
   ```bash
   npm test
   ```
   - Unit tests pass
   - Integration tests pass
   - Coverage thresholds met (if defined)

4. **Security Scans**
   - CodeQL analysis (JavaScript)
   - Gitleaks secret scanning
   - Dependency vulnerability check (`npm audit`)

### Human Review Checklist

Reviewers must verify:

#### Code Quality
- [ ] Code is readable and well-documented
- [ ] Functions have clear, single responsibilities
- [ ] Error handling is comprehensive
- [ ] No code duplication without justification
- [ ] Performance considerations addressed

#### Security
- [ ] See [SECURITY.md](./SECURITY.md) for full checklist
- [ ] No secrets in code
- [ ] Input validation present
- [ ] Authorization checks in place
- [ ] Audit logging implemented

#### Architecture
- [ ] Follows existing patterns
- [ ] No unnecessary dependencies
- [ ] Proper separation of concerns
- [ ] Database schema changes approved (if applicable)

#### Testing
- [ ] Tests cover new functionality
- [ ] Edge cases tested
- [ ] Error scenarios tested
- [ ] Integration with existing features verified

#### Documentation
- [ ] README updated (if public API changed)
- [ ] ARCHITECTURE.md updated (if architecture changed)
- [ ] API documentation updated
- [ ] Inline comments for complex logic

## Documentation Requirements

### Required Documentation Updates

| Change Type | Required Documentation |
|-------------|----------------------|
| New API endpoint | README.md, API docs, ARCHITECTURE.md |
| Security change | SECURITY.md, PR description |
| Mobile restriction | MOBILE_MODE.md, UI documentation |
| Agent change | Agent YAML, README.md |
| Governance change | GOVERNANCE.md, PR approval process |
| Architecture change | ARCHITECTURE.md, diagrams |

### Documentation Standards

**Completeness**:
- What changed (technical)
- Why it changed (business reason)
- How to use it (examples)
- Migration guide (for breaking changes)

**Accuracy**:
- Documentation matches implementation
- Code examples are tested
- Screenshots are current
- Links are valid

**Traceability**:
- Link to Issue
- Link to requirements
- Link to related PRs
- Reference to design docs

## Audit & Compliance

### Audit Logging Requirements

**Admin/System Actions** (MUST be logged):

```javascript
logger.info({
  event: 'admin_action',
  timestamp: new Date().toISOString(),
  ip: req.ip,
  action: 'update_agent',
  resource: 'legal-agent',
  result: 'success',
  correlationId: req.correlationId
});
```

**Log Contents**:
- ✅ Timestamp (ISO 8601 format)
- ✅ IP address
- ✅ Action performed
- ✅ Resource affected
- ✅ Result (success/failure)
- ✅ Correlation ID
- ❌ No sensitive data (passwords, tokens, PII)

**Append-Only Logs**:
- Audit logs must be append-only
- No deletion or modification of audit entries
- Retention: Minimum 90 days, recommended 1 year
- Backup: Daily, stored securely

### Compliance Checkpoints

**Pre-Merge**:
1. PR checklist completed
2. All approvals obtained
3. All quality gates passed
4. Documentation updated
5. Audit logging verified

**Post-Merge**:
1. Deployment logs captured
2. Monitoring alerts configured
3. Rollback plan documented
4. Stakeholders notified

**Periodic**:
1. Quarterly access reviews
2. Monthly security scans
3. Weekly dependency updates
4. Daily backup verification

## Red Flags 🚨

**Immediate Block** if PR:

1. **Expands agent permissions without justification**
   - Adding actions to allowlist without clear need
   - Removing permission checks
   - Bypassing validation

2. **Introduces hidden behavior behind existing flags**
   - Changing behavior of existing features without version bump
   - Adding side effects to safe operations
   - Stealth features without documentation

3. **Bypasses governance or validation gates**
   - Skipping required approvals
   - Disabling security checks
   - Removing validation logic

4. **"Works locally" but not verifiable**
   - No tests for new functionality
   - Cannot reproduce claimed functionality
   - Environment-specific code without documentation

## Reviewer Decision Framework

### Approve ✅

**Criteria**:
- All gates satisfied
- Code quality high
- Documentation complete
- Security validated
- Tests comprehensive

**Action**: Approve PR, ready to merge

### Request Changes 🔄

**Criteria**:
- Non-blocking issues found
- Improvements recommended
- Minor documentation gaps
- Style inconsistencies

**Action**: Request changes, allow re-review

### Block 🛑

**Criteria**:
- Governance violation
- Security vulnerability
- Scope creep
- Missing critical documentation
- Red flag triggered

**Action**: Block PR, require major revision

**Required**: Document specific reason for block

## Milestone Management

### Milestone Requirements

Each milestone must have:

1. **Clear Objective**
   - Business goal statement
   - Success criteria
   - Target completion date

2. **Designated Owner**
   - Responsible for milestone delivery
   - Authority to prioritize issues
   - Accountability for outcomes

3. **Approved Status**
   - Reviewed by governance team
   - Aligned with roadmap
   - Resources allocated

### Milestone Lifecycle

```
Draft → Review → Approved → Active → Completed → Archived
```

**Draft**: Initial creation, gathering requirements  
**Review**: Governance review pending  
**Approved**: Ready to accept issues  
**Active**: Work in progress  
**Completed**: All issues closed  
**Archived**: Historical record  

## Emergency Changes

### Fast-Track Process

**Criteria for Fast-Track**:
- Production incident (P0/P1)
- Security vulnerability actively exploited
- Data loss risk
- Service completely down

**Fast-Track Requirements**:
1. Incident ticket created
2. On-call engineer approval
3. Post-merge review within 24 hours
4. Incident retrospective within 7 days

**Still Required**:
- Link to incident ticket
- Clear description of fix
- Risk assessment
- Rollback plan

## Roles & Responsibilities

### Governance Team
- Define and update governance policies
- Review high-risk changes
- Resolve approval disputes
- Conduct periodic audits

### Security Team
- Security reviews for high/critical risk changes
- Vulnerability assessment
- Secret management oversight
- Incident response

### Platform Engineering
- Technical architecture decisions
- Code review for platform changes
- Performance optimization
- Infrastructure management

### DevOps Team
- CI/CD pipeline maintenance
- Deployment automation
- Monitoring and alerting
- Incident management

### Contributors
- Follow governance process
- Write quality code
- Document changes
- Respond to review feedback

## Enforcement

### Policy Violations

**Severity Levels**:

**Minor**: First offense, unintentional
- Action: Educational feedback, request correction

**Moderate**: Repeated minor or careless violation
- Action: PR blocked, mandatory review by senior team member

**Major**: Intentional bypass or security risk
- Action: PR rejected, contributor privileges reviewed

**Critical**: Malicious or severely negligent
- Action: Access revoked, incident investigation

### Appeals Process

If you disagree with a governance decision:

1. Document your concerns clearly
2. Escalate to governance team
3. Provide supporting evidence
4. Await governance team review (48 hours)
5. Accept final decision

## Continuous Improvement

### Feedback Mechanisms

- Monthly governance retrospectives
- PR review time tracking
- Bottleneck identification
- Process improvement proposals

### Policy Updates

This document is reviewed:
- After any major incident
- Quarterly (scheduled review)
- When new risks identified
- When process proves inefficient

**Update Process**:
1. Propose changes via PR
2. Governance team review
3. Stakeholder feedback (7 days)
4. Approval and merge
5. Communication to all contributors

---

**Document Owner**: Governance Team  
**Approval**: Required for any changes  
**Next Review**: 2026-05-10  
**Version History**: See git log
