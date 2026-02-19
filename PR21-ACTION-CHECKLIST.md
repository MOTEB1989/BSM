# PR #21 Action Checklist - Required Changes Before Merge

**PR:** #21 - AI Agent Observatory  
**Review Score:** 8.4/10  
**Status:** ✅ CONDITIONAL APPROVE  
**Review Document:** [CODE-REVIEW-PR21.md](CODE-REVIEW-PR21.md)

---

## 🚨 BLOCKER: Must Fix Before Merge

### 1. Add Comprehensive Test Suite ❌ CRITICAL
**Issue:** Zero unit tests for 12,888 lines of new code  
**Required Coverage:** 50% minimum, 70% for security-critical code  
**Current Coverage:** 0%  
**Effort:** 2-3 days  

**Required Test Files:**

#### tests/services/observatoryDbService.test.js
```javascript
describe('recordMetric', () => {
  it('should insert valid metric into database');
  it('should handle database connection failure gracefully');
  it('should sanitize metric data before insertion');
  it('should reject metrics with invalid timestamps');
  it('should handle duplicate metric insertion');
});

describe('getAggregatedMetrics', () => {
  it('should return metrics for valid agent');
  it('should return empty array for non-existent agent');
  it('should respect time range filters');
  it('should prevent SQL injection in agentId parameter');
});
```

#### tests/services/observatoryService.test.js
```javascript
describe('getRealTimeMetrics', () => {
  it('should return metrics for all agents');
  it('should handle invalid time range');
  it('should calculate success rate correctly');
  it('should format decimal values properly');
});

describe('getTokenUsageByAgent', () => {
  it('should aggregate tokens by agent');
  it('should handle zero token usage');
  it('should validate time range allowlist');
});
```

#### tests/services/alertService.test.js
```javascript
describe('evaluateAlert', () => {
  it('should trigger alert when threshold exceeded');
  it('should not trigger alert below threshold');
  it('should handle missing agent metrics');
  it('should evaluate all alert types correctly');
});

describe('checkAlerts', () => {
  it('should check all active alerts');
  it('should skip inactive alerts');
  it('should handle database errors gracefully');
});
```

#### tests/routes/observatory.test.js
```javascript
describe('GET /api/observatory/metrics', () => {
  it('should return 200 with valid metrics');
  it('should return 400 for invalid time range');
  it('should handle database connection failure');
});

describe('GET /api/observatory/metrics/:agentId', () => {
  it('should validate agentId format');
  it('should return 404 for non-existent agent');
  it('should prevent SQL injection in agentId');
});
```

#### tests/middleware/metricsCollector.test.js
```javascript
describe('metricsCollectorMiddleware', () => {
  it('should record metrics for successful requests');
  it('should record metrics for failed requests');
  it('should calculate cost correctly');
  it('should handle missing usage data');
  it('should not block response on recording failure');
});
```

**Testing Framework Setup:**
```bash
npm install --save-dev mocha chai supertest
```

**Add to package.json:**
```json
{
  "scripts": {
    "test": "npm run validate && mocha tests/**/*.test.js",
    "test:unit": "mocha tests/**/*.test.js",
    "test:coverage": "c8 mocha tests/**/*.test.js"
  }
}
```

---

## ⚠️ HIGH PRIORITY: Should Fix Before Merge

### 2. Add Input Validation for All Route Parameters
**Issue:** Missing validation for agentId, testId, alertId, timeRange  
**Risk:** Data integrity issues, potential security vulnerabilities  
**Effort:** 4 hours  

**Implementation:**

Create `src/middleware/inputValidation.js`:
```javascript
import { AppError } from '../utils/errors.js';

export function validateAgentId(req, res, next) {
  const { agentId } = req.params;
  
  if (!agentId || !/^[a-zA-Z0-9_-]{1,100}$/.test(agentId)) {
    return next(new AppError('Invalid agent ID format', 400));
  }
  
  next();
}

export function validateTimeRange(req, res, next) {
  const { timeRange = '24h' } = req.query;
  
  const validRanges = ['1h', '6h', '24h', '7d', '30d'];
  if (!validRanges.includes(timeRange)) {
    return next(new AppError(
      `Invalid time range. Must be one of: ${validRanges.join(', ')}`, 
      400
    ));
  }
  
  next();
}

export function validateTestId(req, res, next) {
  const { testId } = req.params;
  const id = parseInt(testId, 10);
  
  if (isNaN(id) || id < 1) {
    return next(new AppError('Invalid test ID', 400));
  }
  
  req.params.testId = id; // Normalize to integer
  next();
}

export function validateAlertId(req, res, next) {
  const { alertId } = req.params;
  const id = parseInt(alertId, 10);
  
  if (isNaN(id) || id < 1) {
    return next(new AppError('Invalid alert ID', 400));
  }
  
  req.params.alertId = id; // Normalize to integer
  next();
}

export function validateReportTimeRange(req, res, next) {
  const { from, to } = req.query;
  
  if (from && isNaN(Date.parse(from))) {
    return next(new AppError('Invalid from date format', 400));
  }
  
  if (to && isNaN(Date.parse(to))) {
    return next(new AppError('Invalid to date format', 400));
  }
  
  next();
}
```

**Update routes in `src/routes/observatory.js`:**
```javascript
import {
  validateAgentId,
  validateTimeRange,
  validateTestId,
  validateAlertId
} from '../middleware/inputValidation.js';

// Apply validation middleware
router.get('/metrics/:agentId', 
  validateAgentId, 
  validateTimeRange, 
  async (req, res, next) => {
    // ... handler
  }
);

router.get('/ab-tests/:testId', 
  validateTestId, 
  async (req, res, next) => {
    // ... handler
  }
);

router.get('/alerts/:alertId', 
  validateAlertId, 
  async (req, res, next) => {
    // ... handler
  }
);
```

**Files to Update:**
- [ ] Create `src/middleware/inputValidation.js`
- [ ] Update `src/routes/observatory.js` (15 route handlers)
- [ ] Add validation tests in `tests/middleware/inputValidation.test.js`

---

### 3. Add WebSocket Authentication
**Issue:** No authentication for Socket.io connections  
**Risk:** Unauthorized access to sensitive metrics data  
**Effort:** 2 hours  

**Implementation:**

Update `src/services/socketService.js`:
```javascript
import { Server } from 'socket.io';
import { verifyAuthToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';

export function initializeSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST']
    }
  });
  
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                    socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        logger.warn({ socketId: socket.id }, 'Observatory connection rejected: no token');
        return next(new Error('Authentication required'));
      }
      
      // Verify token (implement based on your auth system)
      const user = await verifyAuthToken(token);
      socket.user = user;
      
      logger.debug({ socketId: socket.id, userId: user.id }, 'Socket authenticated');
      next();
    } catch (err) {
      logger.error({ err, socketId: socket.id }, 'Socket authentication failed');
      next(new Error('Authentication failed'));
    }
  });
  
  io.on('connection', (socket) => {
    logger.info({ 
      socketId: socket.id, 
      userId: socket.user.id 
    }, 'Observatory client connected');
    
    // ... rest of connection logic
  });
}
```

**Update frontend `src/observatory/app.js`:**
```javascript
function initializeSocket() {
  // Get auth token from localStorage or session
  const token = localStorage.getItem('authToken') || 
                sessionStorage.getItem('authToken');
  
  socket = io({
    auth: {
      token: token
    }
  });
  
  socket.on('connect_error', (err) => {
    console.error('Connection failed:', err.message);
    if (err.message === 'Authentication required' || 
        err.message === 'Authentication failed') {
      showAuthError();
    }
  });
  
  // ... rest of socket setup
}

function showAuthError() {
  alert('Authentication required. Please log in to access Observatory.');
  window.location.href = '/login';
}
```

**Files to Update:**
- [ ] Update `src/services/socketService.js` (add auth middleware)
- [ ] Update `src/observatory/app.js` (pass token in connection)
- [ ] Add `verifyAuthToken` function to `src/middleware/auth.js`
- [ ] Add Socket.io auth tests

---

### 4. Validate Database Credentials in Production
**Issue:** Accepts default weak credentials in production  
**Risk:** Security vulnerability if deployed without changing defaults  
**Effort:** 1 hour  

**Implementation:**

Update `src/config/database.js`:
```javascript
import pg from 'pg';
import { env } from './env.js';
import logger from '../utils/logger.js';

const { Pool } = pg;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'bsm_observatory',
  user: process.env.DB_USER || 'bsm_user',
  password: process.env.DB_PASSWORD || 'bsm_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Validate credentials in production
if (process.env.NODE_ENV === 'production') {
  const defaultPassword = 'bsm_password';
  const defaultUser = 'bsm_user';
  
  if (!dbConfig.password || dbConfig.password === defaultPassword) {
    throw new Error(
      'SECURITY ERROR: Default database password detected in production.\n' +
      'Set DB_PASSWORD environment variable with a secure password.\n' +
      'Password requirements:\n' +
      '  - Minimum 12 characters\n' +
      '  - Mix of uppercase, lowercase, numbers, and symbols'
    );
  }
  
  if (dbConfig.user === defaultUser) {
    logger.warn(
      'SECURITY WARNING: Using default database user "bsm_user" in production.\n' +
      'Consider setting DB_USER to a unique username.'
    );
  }
  
  if (dbConfig.password.length < 12) {
    logger.warn(
      `Database password is only ${dbConfig.password.length} characters.\n` +
      'Recommendation: Use 16+ character passwords with mixed case, numbers, and symbols.'
    );
  }
  
  // Check if password meets complexity requirements
  const hasUpperCase = /[A-Z]/.test(dbConfig.password);
  const hasLowerCase = /[a-z]/.test(dbConfig.password);
  const hasNumber = /[0-9]/.test(dbConfig.password);
  const hasSymbol = /[^A-Za-z0-9]/.test(dbConfig.password);
  
  if (!(hasUpperCase && hasLowerCase && hasNumber && hasSymbol)) {
    logger.warn(
      'Database password does not meet complexity requirements.\n' +
      'Consider using uppercase, lowercase, numbers, and symbols.'
    );
  }
}

// ... rest of database.js
```

**Update `.env.example`:**
```bash
# ====================================
# OBSERVATORY DATABASE (Optional)
# ====================================
# PostgreSQL connection for Observatory metrics
# If not configured, Observatory features will be disabled

# IMPORTANT: Change these values in production!
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bsm_observatory
DB_USER=bsm_user  # Change in production
DB_PASSWORD=bsm_password  # MUST change in production (12+ chars, mixed case, numbers, symbols)
```

**Add to `docs/OBSERVATORY.md`:**
```markdown
## Security Considerations

### Production Deployment

⚠️ **CRITICAL**: Change default database credentials before deploying to production.

The default credentials are:
- Username: `bsm_user`
- Password: `bsm_password`

These MUST be changed in production. Set secure values via environment variables:

```bash
export DB_USER="observatory_prod_user"
export DB_PASSWORD="your-secure-password-here-16-chars-min"
```

**Password Requirements:**
- Minimum 12 characters (16+ recommended)
- Mix of uppercase and lowercase letters
- Include numbers
- Include symbols (!@#$%^&*)

The application will reject default credentials in production mode.
```

**Files to Update:**
- [ ] Update `src/config/database.js` (add validation)
- [ ] Update `.env.example` (add warnings)
- [ ] Update `docs/OBSERVATORY.md` (add security section)
- [ ] Add credential validation tests

---

## 📋 RECOMMENDED: Fix Post-Merge

### 5. Add Rate Limiting for Observatory Endpoints
**Issue:** No rate limiting on expensive operations (reports, aggregations)  
**Risk:** DoS via expensive database queries  
**Effort:** 2 hours  

**Implementation:**
```javascript
import rateLimit from 'express-rate-limit';

const observatoryRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many Observatory requests, please try again later'
});

const reportRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 2, // 2 reports per 5 minutes
  message: 'Report generation rate limit exceeded'
});

// Apply to expensive routes
router.get('/reports/pdf', reportRateLimit, async (req, res) => { /*...*/ });
router.get('/reports/excel', reportRateLimit, async (req, res) => { /*...*/ });
```

---

### 6. Add Redis Caching for Metrics
**Issue:** Repeated expensive database queries for same data  
**Risk:** Performance degradation under load  
**Effort:** 1 day  

**Implementation:**
```javascript
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

export async function getRealTimeMetrics(timeRange = '24h') {
  const cacheKey = `metrics:${timeRange}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Query database
  const metrics = await getAggregatedMetrics(null, timeRange);
  
  // Cache for 5 seconds
  await redis.setEx(cacheKey, 5, JSON.stringify(metrics));
  
  return metrics;
}
```

---

### 7. Implement Circuit Breaker for Database
**Issue:** No protection against repeated database failures  
**Risk:** Cascading failures, wasted resources  
**Effort:** 4 hours  

**Implementation:**
```javascript
import CircuitBreaker from '../utils/circuitBreaker.js';

const dbCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000
});

export async function getAggregatedMetrics(agentId, timeRange) {
  return dbCircuitBreaker.execute(async () => {
    const pool = getPool();
    // ... existing query logic
  });
}
```

---

### 8. Move Cost Calculation to Configuration
**Issue:** Model pricing hardcoded in middleware  
**Risk:** Stale costs, difficult updates  
**Effort:** 1 hour  

**Implementation:**
```javascript
// config/modelCosts.js
export const MODEL_COSTS = {
  'gpt-4': { prompt: 0.03, completion: 0.06 },
  'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
  // ...
};

// Update costs: just edit this file or load from database
```

---

### 9. Remove chart.js from Dependencies
**Issue:** Frontend library in backend package.json  
**Risk:** Unnecessary bundle size  
**Effort:** 5 minutes  

```bash
npm uninstall chart.js
```

---

### 10. Add Interval Cleanup on Shutdown
**Issue:** setInterval not cleared on process exit  
**Risk:** Memory leaks, errors during hot reload  
**Effort:** 30 minutes  

**Implementation:**
```javascript
let metricsInterval = null;
let alertsInterval = null;

export function initializeSocketIO(httpServer) {
  // ...
  
  metricsInterval = setInterval(async () => {
    // broadcast metrics
  }, 5000);
  
  alertsInterval = setInterval(async () => {
    // check alerts
  }, 30000);
  
  // Cleanup on exit
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
}

function cleanup() {
  if (metricsInterval) clearInterval(metricsInterval);
  if (alertsInterval) clearInterval(alertsInterval);
  logger.info('Observatory intervals cleared');
}
```

---

## Testing Checklist

After implementing the required changes, verify:

### Manual Testing
- [ ] Start server with Observatory disabled (no DB_* env vars)
- [ ] Verify server starts and /api/health returns 200
- [ ] Start PostgreSQL database
- [ ] Set DB_* environment variables
- [ ] Restart server
- [ ] Verify database schema is created
- [ ] Visit http://localhost:3000/observatory
- [ ] Verify dashboard loads and shows "No metrics" message
- [ ] Make API calls to trigger metric collection
- [ ] Refresh dashboard, verify metrics appear
- [ ] Test WebSocket authentication (should reject without token)
- [ ] Test input validation (send invalid agentId, timeRange)
- [ ] Generate PDF report, verify no errors
- [ ] Generate Excel report, verify no errors
- [ ] Create A/B test, verify stored correctly
- [ ] Create alert, verify triggers when threshold met

### Automated Testing
- [ ] Run unit tests: `npm run test:unit`
- [ ] Check coverage: `npm run test:coverage`
- [ ] Verify coverage ≥ 50% overall
- [ ] Verify coverage ≥ 70% for security-critical files:
  - [ ] `src/middleware/inputValidation.js`
  - [ ] `src/services/observatoryDbService.js`
  - [ ] `src/services/socketService.js`
- [ ] Run validation: `npm run validate`
- [ ] Run security scan: `npm audit`
- [ ] Test in Docker: `docker-compose -f docker-compose.observatory.yml up`

### Security Testing
- [ ] Test SQL injection attempts in agentId parameter
- [ ] Test path traversal attempts in timeRange parameter
- [ ] Test authentication bypass for Socket.io
- [ ] Test rate limiting on report endpoints
- [ ] Test default credentials rejection in production mode
- [ ] Verify no secrets in logs

---

## Estimated Total Effort

| Priority | Task | Effort | Status |
|----------|------|--------|--------|
| 🚨 BLOCKER | Add test suite | 2-3 days | ❌ Not started |
| ⚠️ HIGH | Input validation | 4 hours | ❌ Not started |
| ⚠️ HIGH | WebSocket auth | 2 hours | ❌ Not started |
| ⚠️ HIGH | DB credential validation | 1 hour | ❌ Not started |
| 📋 RECOMMENDED | Rate limiting | 2 hours | ⏸️ Can defer |
| 📋 RECOMMENDED | Redis caching | 1 day | ⏸️ Can defer |
| 📋 RECOMMENDED | Circuit breaker | 4 hours | ⏸️ Can defer |
| 📋 RECOMMENDED | Cost config | 1 hour | ⏸️ Can defer |
| 📋 RECOMMENDED | Remove chart.js | 5 min | ⏸️ Can defer |
| 📋 RECOMMENDED | Interval cleanup | 30 min | ⏸️ Can defer |

**Total for BLOCKER + HIGH priority:** ~3-4 days  
**Total including RECOMMENDED:** ~5-6 days

---

## Approval Criteria

This PR can be merged when:

1. ✅ Test coverage ≥ 50% overall (70% for security code)
2. ✅ Input validation middleware implemented and tested
3. ✅ WebSocket authentication implemented and tested
4. ✅ Database credential validation implemented
5. ✅ All tests passing
6. ✅ No npm audit vulnerabilities
7. ✅ Documentation updated with security warnings

---

## Questions or Need Help?

Refer to:
- Full review: [CODE-REVIEW-PR21.md](CODE-REVIEW-PR21.md)
- Code examples: See sections "Code Examples for Fixes" in the review
- Testing examples: See "Required Tests" section above
- BSU Docs: `docs/OBSERVATORY.md`, `docs/OBSERVATORY-QUICKSTART.md`

**Reviewed by:** BSU Code Review Agent  
**Date:** 2026-02-19  
**Review Score:** 8.4/10 ⭐
