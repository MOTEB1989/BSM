# PR #20 Action Checklist - SSRF Fix Required

**Status:** 🔴 REQUEST CHANGES  
**Critical Issues:** 2 SSRF vulnerabilities  
**Priority:** URGENT  
**Estimated Fix Time:** 4-8 hours  

---

## 🔴 CRITICAL - Must Fix Before Merge

### Issue #1: SSRF in getScanStatus()
**File:** `src/agents/PentestAgent.js:77`  
**Severity:** CRITICAL (CVSS 9.1)  
**Time:** 2 hours  

**Fix:**
```javascript
// Add validation before line 77
import { validate as validateUUID } from 'uuid';

function validateScanId(scanId) {
  // If UUIDs are used
  if (!validateUUID(scanId)) {
    throw new Error('Invalid scan ID format');
  }
  // OR if alphanumeric IDs
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(scanId)) {
    throw new Error('Invalid scan ID format');
  }
}

static async getScanStatus(scanId) {
  try {
    validateScanId(scanId); // ADD THIS LINE
    const response = await fetch(`${PENTEST_SERVICE_URL}/api/scan/${scanId}`);
    // ... rest of code
```

### Issue #2: SSRF in getScanReport()
**File:** `src/agents/PentestAgent.js:100`  
**Severity:** CRITICAL (CVSS 9.1)  
**Time:** 2 hours  

**Fix:**
```javascript
// Add format validation
function validateFormat(format) {
  const allowedFormats = ['json', 'html', 'markdown'];
  if (!allowedFormats.includes(format)) {
    throw new Error('Invalid format parameter');
  }
}

static async getScanReport(scanId, format = 'json') {
  try {
    validateScanId(scanId);    // ADD THIS LINE
    validateFormat(format);     // ADD THIS LINE
    const response = await fetch(
      `${PENTEST_SERVICE_URL}/api/scan/${scanId}/report?format=${format}`
    );
    // ... rest of code
```

### Issue #3: Add Unit Tests for SSRF Protection
**Files:** `tests/agents/PentestAgent.test.js` (CREATE)  
**Severity:** HIGH  
**Time:** 4 hours  

**Create Test File:**
```javascript
// tests/agents/PentestAgent.test.js
import { describe, it, expect } from '@jest/globals';
import { PentestAgent } from '../../src/agents/PentestAgent.js';

describe('PentestAgent - SSRF Protection', () => {
  describe('getScanStatus', () => {
    it('should reject path traversal attacks', async () => {
      await expect(
        PentestAgent.getScanStatus('../../../etc/passwd')
      ).rejects.toThrow('Invalid scan ID');
    });
    
    it('should reject URL encoded attacks', async () => {
      await expect(
        PentestAgent.getScanStatus('%2e%2e%2f%2e%2e%2f')
      ).rejects.toThrow('Invalid scan ID');
    });
    
    it('should accept valid scan IDs', async () => {
      // Mock fetch and test valid UUID
      const validId = '123e4567-e89b-12d3-a456-426614174000';
      // ... test implementation
    });
  });
  
  describe('getScanReport', () => {
    it('should reject invalid format parameters', async () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000';
      await expect(
        PentestAgent.getScanReport(validId, '../../../etc/passwd')
      ).rejects.toThrow('Invalid format');
    });
    
    it('should only accept json, html, markdown formats', async () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000';
      // Test each allowed format
      // Test rejected formats
    });
  });
});
```

---

## 🟠 HIGH PRIORITY - Fix After Merge

### Issue #4: Target URL Validation
**File:** `src/agents/PentestAgent.js:28-30`  
**Severity:** MEDIUM  
**Time:** 3 hours  

**Add to startScan():**
```javascript
function validateTargetUrl(url) {
  try {
    const parsed = new URL(url);
    
    // Block internal networks
    const internalHosts = ['localhost', '127.0.0.1', '0.0.0.0'];
    if (internalHosts.includes(parsed.hostname)) {
      throw new Error('Cannot scan internal hosts');
    }
    
    // Block private IP ranges
    if (parsed.hostname.startsWith('192.168.') ||
        parsed.hostname.startsWith('10.') ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(parsed.hostname)) {
      throw new Error('Cannot scan private networks');
    }
    
    // Require HTTPS in production
    if (process.env.NODE_ENV === 'production' && 
        parsed.protocol !== 'https:') {
      throw new Error('HTTPS required in production');
    }
    
    return true;
  } catch (error) {
    throw new Error(`Invalid target URL: ${error.message}`);
  }
}

static async startScan(options = {}) {
  try {
    const { targetUrl, ... } = options;
    
    if (!targetUrl) {
      throw new Error('Target URL is required');
    }
    
    validateTargetUrl(targetUrl); // ADD THIS LINE
    
    // ... rest of method
```

### Issue #5: npm Audit Vulnerabilities
**Command:** `npm audit fix`  
**Severity:** MEDIUM  
**Time:** 1 hour  

```bash
cd /home/runner/work/BSM/BSM
npm audit fix
npm audit  # Verify 0 vulnerabilities
```

### Issue #6: Add Retry Logic
**File:** `src/agents/PentestAgent.js`  
**Severity:** MEDIUM  
**Time:** 4 hours  

**Add retry helper:**
```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      // Don't retry client errors
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.statusText}`);
      }
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      }
    }
  }
  
  throw lastError;
}
```

---

## 🟡 MEDIUM PRIORITY - Future Improvements

### Issue #7: Python Unit Tests
**Location:** `services/pentest/tests/` (CREATE)  
**Time:** 16 hours  

**Create test structure:**
```bash
services/pentest/tests/
├── __init__.py
├── test_sql_injection.py
├── test_xss_scanner.py
├── test_csrf_scanner.py
├── test_api_tester.py
└── test_zap_scanner.py
```

### Issue #8: Rate Limiting
**File:** `src/routes/pentest.js`  
**Time:** 4 hours  

**Add rate limiting:**
```javascript
import rateLimit from 'express-rate-limit';

const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 scans per window
  message: 'Too many scan requests, please try again later'
});

router.post('/scan', scanLimiter, pentestController.startScan);
```

### Issue #9: Architecture Diagrams
**Location:** `docs/architecture/`  
**Time:** 2 hours  

Create diagrams for:
- System architecture
- Scan lifecycle sequence
- Component interactions
- Deployment topology

### Issue #10: Configuration Constants
**File:** `src/agents/PentestAgent.js`  
**Time:** 1 hour  

**Extract magic numbers:**
```javascript
// Add at top of file
const CONFIG = {
  HEALTH_CHECK_TIMEOUT_MS: 5000,
  DEFAULT_MAX_DEPTH: 3,
  DEFAULT_LIMIT: 50,
  DEFAULT_SKIP: 0,
  RETRY_MAX_ATTEMPTS: 3,
  RETRY_BASE_DELAY_MS: 1000
};
```

---

## Verification Steps

### After Applying Fixes

1. **Run Validation:**
   ```bash
   npm test
   npm run validate
   ```

2. **Re-run CodeQL:**
   ```bash
   # Trigger CodeQL workflow
   git commit -m "fix: Add SSRF protection validation"
   git push
   ```

3. **Manual Security Testing:**
   ```bash
   # Test SSRF protection
   curl -X GET http://localhost:3000/api/pentest/scan/../../../etc/passwd
   # Should return 400 Bad Request with "Invalid scan ID"
   
   curl -X GET http://localhost:3000/api/pentest/scan/123/report?format=../../etc/passwd
   # Should return 400 Bad Request with "Invalid format"
   ```

4. **Run Unit Tests:**
   ```bash
   npm test -- tests/agents/PentestAgent.test.js
   # All SSRF protection tests should pass
   ```

5. **Verify npm audit:**
   ```bash
   npm audit
   # Should show 0 vulnerabilities
   ```

---

## Timeline

### Phase 1: Critical Fixes (REQUIRED - 8 hours)
- [ ] Day 1 Morning: Fix SSRF Issue #1 (2h)
- [ ] Day 1 Morning: Fix SSRF Issue #2 (2h)
- [ ] Day 1 Afternoon: Add Unit Tests (4h)
- [ ] Day 1 EOD: Run verification steps
- [ ] Day 1 EOD: Request re-review

### Phase 2: High Priority (RECOMMENDED - 8 hours)
- [ ] Day 2: Add target URL validation (3h)
- [ ] Day 2: Run npm audit fix (1h)
- [ ] Day 2: Add retry logic (4h)

### Phase 3: Medium Priority (OPTIONAL - 20+ hours)
- [ ] Week 2: Add Python unit tests (16h)
- [ ] Week 2: Add rate limiting (4h)
- [ ] Week 2: Create architecture diagrams (2h)
- [ ] Week 2: Extract configuration constants (1h)

---

## Acceptance Criteria

### For Merge Approval ✅

- [x] ~~All 37 governance checks passed~~ (Already done)
- [ ] **SSRF Issue #1 fixed and tested**
- [ ] **SSRF Issue #2 fixed and tested**
- [ ] **Unit tests for SSRF protection passing**
- [ ] CodeQL analysis shows 0 SSRF vulnerabilities
- [ ] npm audit shows 0 vulnerabilities
- [ ] All existing tests passing
- [ ] Documentation updated with security fixes

### For Production Deployment ✅

All above PLUS:
- [ ] Target URL validation implemented
- [ ] Retry logic added
- [ ] Rate limiting configured
- [ ] Python unit tests added (80% coverage)
- [ ] Performance testing completed
- [ ] Security team sign-off

---

## Risk Assessment

### Current Risk: 🔴 HIGH

**SSRF vulnerabilities allow:**
- Access to internal services (AWS metadata, Redis, MongoDB)
- Port scanning of internal network
- Bypass of firewall restrictions
- Information disclosure

**Exploitation Example:**
```bash
# Attacker request
GET /api/pentest/scan/..%2F..%2F169.254.169.254%2Flatest%2Fmeta-data%2Fiam%2Fsecurity-credentials

# Response could leak AWS credentials
```

### Post-Fix Risk: 🟢 LOW

With SSRF fixes applied:
- Input validation blocks path traversal
- Format parameter restricted to allowlist
- Unit tests prevent regression
- CodeQL provides continuous monitoring

---

## Support

**Questions?** Contact:
- Security Team: @MOTEB1989
- Review Agent: BSU Code Review Agent
- PR: https://github.com/MOTEB1989/BSM/pull/20

**Resources:**
- [Full Code Review](./CODE-REVIEW-PR20.md)
- [OWASP SSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [GitHub Security Scanning](https://github.com/MOTEB1989/BSM/security/code-scanning)

---

**Last Updated:** 2026-02-19  
**Next Review:** After SSRF fixes applied  
**Status:** 🔴 BLOCKING - Fix required before merge
