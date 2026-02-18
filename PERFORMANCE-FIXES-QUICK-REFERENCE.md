# BSM Performance Fixes - Quick Reference

**TL;DR:** 11 actionable improvements, 25-35 hours total effort, 30-50% performance gain

---

## Critical Fixes (Do First) 🔴

### 1. Fix Blocking File I/O (2 hours)
**File:** `src/services/orchestratorService.js:119`

```javascript
// BEFORE (BLOCKS EVENT LOOP)
export const saveReport = (reportFile, content) => {
  fs.writeFileSync(reportFile, content, "utf8");
};

// AFTER (NON-BLOCKING)
import { writeFile } from "fs/promises";
export const saveReport = async (reportFile, content) => {
  await writeFile(reportFile, content, "utf8");
};
```

**Impact:** 30-50% reduction in p99 latency

---

### 2. Fix Blocking Cache Reads (1 hour)
**File:** `src/utils/registryCache.js:39`

```javascript
// BEFORE
const content = fs.readFileSync(registryPath, "utf8");

// AFTER
import { readFile } from "fs/promises";
const content = await readFile(registryPath, "utf8");
```

**Impact:** Non-blocking cache loads

---

## High Priority Fixes 🟠

### 3. Add Circuit Breaker (4-6 hours)
Prevents cascading failures when external APIs are down.

**Create:** `src/utils/circuitBreaker.js`  
**Modify:** `src/services/gptService.js`, `src/config/modelRouter.js`

**Impact:** 
- 80% reduction in MTTR during outages
- Fail-fast (50ms vs 30s timeout)

---

### 4. Optimize Vector Search (2-8 hours)

**File:** `src/services/vectorService.js`

**Quick Win (2 hours):** Add early termination  
**Proper Fix (8 hours):** Implement inverted index

**Current:** O(n²) - becomes slow at 10k+ items  
**After:** O(k log n) - fast at 100k+ items

**Impact:** 20-50× faster for large datasets

---

## Medium Priority Fixes 🟡

### 5. Cache Stampede Prevention (3-4 hours)
**Problem:** 100 concurrent requests = 100× cache reloads

**Create:** `src/utils/cacheManager.js`  
**Impact:** 40-60% reduction in peak CPU

---

### 6. Hoist Knowledge Loading (30 minutes)
**File:** `src/runners/orchestrator.js:93`

```javascript
// BEFORE (loads N times)
async function runSingleAgent(agent, payload, context) {
  const knowledge = await loadKnowledgeIndex();
  // ...
}

// AFTER (loads once)
async function executeAgentsParallel(agents, payload, context, jobId) {
  const knowledge = await loadKnowledgeIndex(); // Once!
  const enrichedContext = { ...context, knowledge };
  
  const work = agents.map(async agent => {
    await runSingleAgent(agent, payload, enrichedContext);
  });
}
```

**Impact:** 5-10% faster orchestration

---

### 7. Add Cache Control API (2-3 hours)
Manual cache invalidation endpoint

**Create:** `src/api/cacheControl.js`

```bash
# Clear cache
curl -X POST http://localhost:3000/api/cache/clear \
  -d '{"cache": "agents"}'

# Get stats
curl http://localhost:3000/api/cache/stats
```

---

### 8. Add Bulkhead Pattern (3-4 hours)
Resource isolation per service

**Create:** `src/utils/bulkhead.js`  
**Impact:** Prevents resource exhaustion

---

## Low Priority Fixes 🟢

### 9. Optimize Body Parser (15 minutes)
Don't parse body for static files

```javascript
// BEFORE (parses for all routes)
app.use(express.json({ limit: '1mb' }));

// AFTER (only for API routes)
app.get("/health", getHealth);
app.use("/api", express.json({ limit: '1mb' }));
app.use("/api", routes);
```

**Impact:** 2-3% faster health checks

---

### 10. Adjust Cache TTLs (10 minutes)

```javascript
// Current: 60s for everything
// Recommended:
const AGENT_CACHE_TTL = 300000;     // 5 minutes
const KNOWLEDGE_CACHE_TTL = 600000;  // 10 minutes
const REGISTRY_CACHE_TTL = 900000;   // 15 minutes
```

**Impact:** Better cache hit rate

---

### 11. Consolidate Security Middleware (30 minutes)
Combine `lanOnly` + `mobileMode` into single middleware

**Impact:** Cleaner code, 1 less function call per request

---

## Performance Testing

```bash
# Install
npm install -g autocannon

# Test health endpoint
autocannon -c 100 -d 30 http://localhost:3000/health

# Test agent list (cache test)
autocannon -c 50 -d 60 http://localhost:3000/api/agents

# Test orchestration
autocannon -c 10 -d 60 \
  -m POST \
  -H "Content-Type: application/json" \
  -b '{"agentId":"governance-agent","input":"test"}' \
  http://localhost:3000/api/agents/execute
```

---

## Rollout Plan

### Week 1: Critical Fixes
- Fix blocking I/O
- Add load testing
- Deploy with feature flags

### Week 2: Resilience
- Implement circuit breaker
- Add bulkhead pattern
- Add monitoring

### Week 3: Cache Optimization
- Implement cache stampede prevention
- Add cache control API
- Adjust TTLs

### Week 4: Algorithm Optimization
- Optimize vector search
- Performance validation

### Week 5: Polish
- Remaining optimizations
- Documentation

---

## Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| p50 latency | 150ms | 100ms | 33% faster |
| p99 latency | 500ms | 300ms | 40% faster |
| Throughput | 80 req/s | 100 req/s | 25% more |
| Peak CPU | 80% | 50% | 37% less |

---

## Monitoring Endpoints (to add)

```bash
# Circuit breaker status
GET /api/health/circuit-breakers

# Cache statistics
GET /api/cache/stats

# Performance metrics
GET /api/metrics
```

---

## Quick Command Reference

```bash
# Run tests
npm test

# Performance test
npm run test:performance

# Health check
npm run health:detailed

# Clear cache (after implementing)
curl -X POST http://localhost:3000/api/cache/clear \
  -H "Content-Type: application/json" \
  -d '{"cache": "all"}'
```

---

## Files to Create

- `src/utils/circuitBreaker.js` (Circuit breaker class)
- `src/utils/bulkhead.js` (Bulkhead pattern)
- `src/utils/cacheManager.js` (Cache stampede prevention)
- `src/utils/retryPolicy.js` (Retry with exponential backoff)
- `src/api/cacheControl.js` (Cache management API)
- `src/routes/metrics.js` (Performance metrics endpoint)

## Files to Modify

- `src/services/orchestratorService.js` (Fix blocking I/O)
- `src/utils/registryCache.js` (Fix blocking read)
- `src/services/gptService.js` (Add circuit breaker)
- `src/config/modelRouter.js` (Add circuit breaker)
- `src/services/vectorService.js` (Optimize algorithm)
- `src/runners/orchestrator.js` (Hoist knowledge loading)
- `src/services/agentsService.js` (Use CacheManager, adjust TTL)
- `src/services/knowledgeService.js` (Use CacheManager, adjust TTL)
- `src/app.js` (Optimize body parser placement)

---

## Risk Mitigation

✅ **Feature Flags:** Enable/disable new features at runtime  
✅ **Canary Deployment:** 10% → 50% → 100%  
✅ **Monitoring:** Alert on anomalies  
✅ **Rollback Plan:** Quick revert if issues arise

---

## Support

For detailed implementation, see:
- Full analysis: `ARCHITECTURAL-PERFORMANCE-ANALYSIS.md`
- Code examples: Sections 7-8
- Testing guide: Section 9
- Migration paths: Section 10

---

**Priority Order:** Fix #1 → #2 → #3 → #4 → Rest  
**Total Effort:** 25-35 hours  
**Expected ROI:** 5-10× over 1 year
