# Action Checklist - Code Review Fixes for Commit dd45dbc

## Priority: CRITICAL (Before Production Deployment)

---

## 🔴 Critical Fix #1: Secure Admin Token Default
**Severity:** CRITICAL  
**Impact:** Authentication bypass vulnerability  
**Estimated Time:** 5 minutes

### Files to Modify
- [ ] `.env.example` line 29

### Changes Required
```diff
- ADMIN_TOKEN=change-me
+ ADMIN_TOKEN=  # REQUIRED: minimum 16 characters, generate with: openssl rand -hex 16
+ # Production: NEVER use this file - set via environment or secrets manager
```

### Additional Changes (Recommended)
- [ ] `src/server.js` - Add startup validation:
```javascript
// Validate admin token on startup
if (process.env.NODE_ENV === 'production') {
  if (!process.env.ADMIN_TOKEN) {
    console.error('❌ ADMIN_TOKEN is required in production');
    process.exit(1);
  }
  if (process.env.ADMIN_TOKEN === 'change-me') {
    console.error('❌ ADMIN_TOKEN cannot be "change-me" in production');
    process.exit(1);
  }
  if (process.env.ADMIN_TOKEN.length < 16) {
    console.error('❌ ADMIN_TOKEN must be at least 16 characters');
    process.exit(1);
  }
}
```

### Testing
- [ ] Server refuses to start with `ADMIN_TOKEN=change-me` in production
- [ ] Server refuses to start with token < 16 chars in production
- [ ] Development mode still works without token

---

## 🔴 Critical Fix #2: Add npm audit to CI/CD
**Severity:** HIGH  
**Impact:** Vulnerable dependencies could be deployed  
**Estimated Time:** 15 minutes

### Files to Modify
- [ ] `.github/workflows/validate.yml`
- [ ] `.github/workflows/nodejs.yml`
- [ ] `.github/workflows/unified-ci-deploy.yml`
- [ ] `.github/workflows/pr-governance-check.yml`
- [ ] Any other workflow with `npm ci`

### Changes Required
Add after every `npm ci` step:
```yaml
- name: Security audit dependencies
  run: npm audit --production --audit-level=high
  continue-on-error: false  # Block on high/critical vulnerabilities
```

### Alternative: Add to package.json
```json
{
  "scripts": {
    "validate": "node scripts/validate.js && npm run policy:force-push && npm audit --production --audit-level=high"
  }
}
```

### Testing
- [ ] CI fails when vulnerable dependency is introduced
- [ ] `npm run validate` includes dependency audit
- [ ] No false positives from dev dependencies

---

## 🔴 Critical Fix #3: Mask Secrets in Workflow Logs
**Severity:** HIGH  
**Impact:** Secrets could leak to logs  
**Estimated Time:** 20 minutes

### Files to Modify
- [ ] `.github/workflows/auto-merge.yml`
- [ ] `.github/workflows/agent-executor.yml`
- [ ] `.github/workflows/bsu-audit.yml`
- [ ] `.github/workflows/run-bsu-agents.yml`
- [ ] Any workflow using `${{ secrets.* }}`

### Pattern to Apply
Before any script that uses secrets:
```yaml
- name: Run agent with secrets
  env:
    OPENAI_BSM_KEY: ${{ secrets.OPENAI_BSM_KEY }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_BSU_TOKEN }}
  run: |
    # Mask secrets from logs
    echo "::add-mask::$OPENAI_BSM_KEY"
    echo "::add-mask::$GITHUB_TOKEN"
    
    # Now run agent safely
    node src/agents/my-agent.js
```

### Testing
- [ ] Secrets do not appear in workflow logs
- [ ] Agents still function correctly
- [ ] Error messages don't expose partial secrets

---

## 🟡 High Priority Fix #4: Expand Force-Push Policy Scope
**Severity:** MEDIUM  
**Impact:** Force-push could be used in workflows  
**Estimated Time:** 10 minutes

### Files to Modify
- [ ] `scripts/validate-force-push-policy.sh`

### Changes Required
```diff
- matches="$(rg -n -P '^\s*(?!#)(?:sudo\s+)?git\s+push\b[^\n]*--force(?!-with-lease)' scripts -g '*.sh' || true)"
+ matches="$(rg -n -P '^\s*(?!#)(?:sudo\s+)?git\s+push\b[^\n]*--force(?!-with-lease)' scripts .github/workflows -g '*.sh' -g '*.yml' -g '*.yaml' || true)"
```

### Testing
- [ ] Detects force-push in `scripts/*.sh`
- [ ] Detects force-push in `.github/workflows/*.yml`
- [ ] Allows `--force-with-lease` (safe force-push)
- [ ] Ignores commented-out commands

---

## 🟡 High Priority Fix #5: Environment Variable Validation
**Severity:** MEDIUM  
**Impact:** Server could start with missing config  
**Estimated Time:** 15 minutes

### Files to Create/Modify
- [ ] `src/config/env-validator.js` (new file)
- [ ] `src/server.js` (import and call validator)

### Implementation
```javascript
// src/config/env-validator.js
export function validateEnvironment() {
  const errors = [];
  
  // Required in production
  if (process.env.NODE_ENV === 'production') {
    const required = ['ADMIN_TOKEN', 'OPENAI_BSM_KEY'];
    required.forEach(key => {
      if (!process.env[key]) {
        errors.push(`Missing required environment variable: ${key}`);
      }
    });
    
    // Admin token strength
    if (process.env.ADMIN_TOKEN === 'change-me') {
      errors.push('ADMIN_TOKEN cannot be "change-me" in production');
    }
    if (process.env.ADMIN_TOKEN?.length < 16) {
      errors.push('ADMIN_TOKEN must be at least 16 characters');
    }
  }
  
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
}

// src/server.js (add at top)
import { validateEnvironment } from './config/env-validator.js';
validateEnvironment();
```

### Testing
- [ ] Production deployment fails with weak ADMIN_TOKEN
- [ ] Production deployment fails with missing required vars
- [ ] Development mode is not affected

---

## 🟢 Medium Priority Fix #6: Agent File Existence Validation
**Severity:** LOW  
**Impact:** Validation could pass with missing files  
**Estimated Time:** 10 minutes

### Files to Modify
- [ ] `scripts/validate.js`

### Changes Required
```javascript
// Before line 53, add:
const missingFiles = idx.agents.filter(f => !fs.existsSync(path.join(agentsDir, f)));
if (missingFiles.length > 0) {
  throw new Error(`Missing agent files: ${missingFiles.join(', ')}`);
}
console.log(`✅ All ${idx.agents.length} agent files exist`);
```

### Testing
- [ ] Validation fails if agent file is missing
- [ ] Validation passes when all files exist
- [ ] Clear error message shows which files are missing

---

## 🟢 Medium Priority Fix #7: Remove Production CORS from .env.example
**Severity:** LOW  
**Impact:** Information disclosure  
**Estimated Time:** 2 minutes

### Files to Modify
- [ ] `.env.example` line 62

### Changes Required
```diff
- CORS_ORIGINS=https://www.lexdo.uk,https://lexdo.uk,https://lexprim.com,https://www.lexprim.com,https://corehub.nexus,https://www.corehub.nexus,https://sr-bsm.onrender.com
+ CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000
+ # Production: Set actual allowed origins via environment variable
```

---

## 🟢 Medium Priority Fix #8: Enforce Agent Governance Fields
**Severity:** LOW  
**Impact:** Agent files might lack governance metadata  
**Estimated Time:** 15 minutes

### Files to Modify
- [ ] `scripts/validate.js`

### Changes Required
```javascript
// After line 57, add:
if (file.endsWith('-agent.yaml') || file.endsWith('agent.yaml')) {
  must(parsed.governance?.risk, `Agent missing governance.risk in: ${file}`);
  must(parsed.governance?.approval, `Agent missing governance.approval in: ${file}`);
  must(parsed.governance?.contexts, `Agent missing governance.contexts in: ${file}`);
}
```

---

## 🟢 Medium Priority Fix #9: Branch Protection Permission Check
**Severity:** LOW  
**Impact:** Silent failure of branch protection enforcement  
**Estimated Time:** 10 minutes

### Files to Modify
- [ ] `.github/workflows/enforce-main-branch-protection.yml`

### Changes Required
Add after line 26:
```javascript
// Validate token has admin permissions
const { data: authUser } = await github.rest.users.getAuthenticated();
const { data: permissions } = await github.rest.repos.getCollaboratorPermissionLevel({
  owner, repo, username: authUser.login
});
if (permissions.permission !== 'admin') {
  core.setFailed('BRANCH_PROTECTION_TOKEN requires admin permissions, has: ' + permissions.permission);
  return;
}
core.info('✅ Token has admin permissions');
```

---

## Progress Tracking

### Critical Fixes (Must Complete)
- [ ] Fix #1: Secure admin token
- [ ] Fix #2: Add npm audit
- [ ] Fix #3: Mask secrets

### High Priority (Should Complete)
- [ ] Fix #4: Expand force-push policy
- [ ] Fix #5: Environment validation

### Medium Priority (Nice to Have)
- [ ] Fix #6: Agent file validation
- [ ] Fix #7: Remove production CORS
- [ ] Fix #8: Agent governance fields
- [ ] Fix #9: Branch protection permissions

---

## Verification Checklist

After implementing fixes:
- [ ] All CI/CD workflows pass
- [ ] `npm run validate` succeeds
- [ ] `npm run pr-check` succeeds
- [ ] No secrets in git log: `git log -p | grep -i "sk-proj-"`
- [ ] Gitleaks scan passes: `gitleaks detect --no-git`
- [ ] Server starts successfully in production mode (with proper env)
- [ ] Server refuses to start with weak admin token

---

## Estimated Total Time
- Critical fixes: **40 minutes**
- High priority: **25 minutes**
- Medium priority: **37 minutes**
- **Total: ~1.5 hours**

---

**Priority Order:**
1. Fix admin token (5 min) ← START HERE
2. Add npm audit (15 min)
3. Mask secrets (20 min)
4. Test everything (20 min)
5. Then proceed with high/medium priority items

---

**Reviewed by:** BSU Code Review Agent (KARIM)  
**Document:** Action checklist for implementing code review recommendations  
**Target:** Production-ready security and governance
