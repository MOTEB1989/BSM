# BSM Refactor Plan

## Executive Summary

This document outlines a concrete refactoring plan for the BSM (Business Service Management) codebase based on architecture analysis, dependency review, and performance hotspot identification.

---

## 1. Architecture & Dependencies Analysis

### Current Structure
- **Entry**: `src/server.js` → `src/app.js` → Express routes
- **Layers**: Routes → Controllers → Services → Utils
- **Key Dependencies**: express, cors, helmet, pino, yaml, node-fetch

### Dependency Observations
- Minimal production deps (7) – lean
- No ESLint; validation scripts serve as "lint"
- Test runner: Node built-in `--test` for unit tests
- `npm test` runs validation (agent YAML, registry), not unit tests

---

## 2. Performance Hotspots

| Location | Issue | Impact |
|----------|-------|--------|
| `knowledgeService.js` | Custom cache logic duplicating `cachedFileLoader` | Stampede risk, maintenance burden |
| `gptService.js` + `modelRouter.js` | Duplicated HTTP fetch + timeout logic | ~150 lines duplicated, inconsistent error handling |
| `agentRunner.js` | Sequential `loadAgents()` then `loadKnowledgeIndex()` | Could parallelize with `Promise.all` |
| `chat.js` routes | Provider list built twice (nearly identical) | Code duplication, inconsistency risk |

---

## 3. Code Smells & Design Issues

### 3.1 Duplication
- **Provider building**: `buildAgentProviders` (agentRunner) vs manual provider arrays (chat.js) – same logic
- **HTTP calls**: `callChatAPI`, `callAnthropicAPI` (gptService), `postChat` (modelRouter) – shared pattern
- **Knowledge loading**: Custom cache in `knowledgeService` vs `createCachedFileLoader` factory

### 3.2 Error Handling
- **agentRunner.js**: Swallows errors, returns generic Arabic message – loses stack trace and error codes
- **agent-executor.js**, **agentControl.js**: Manual try/catch instead of `asyncHandler`

### 3.3 Complexity
- **modelRouter.js**: No circuit breaker – direct fetch; gptService has breakers for OpenAI/Kimi/Anthropic
- **env.js**: Uses `console.warn` – inconsistent with Pino-based logging

---

## 4. Refactor Actions (Concrete)

### Step 1: Shared HTTP Client
**File**: `src/utils/httpClient.js` (new)
- Extract fetch + timeout + error mapping
- Used by `gptService.js` and `modelRouter.js`
- Single source of truth for 401/403/429/502 handling

### Step 2: Provider Builder Utility
**File**: `src/utils/providerUtils.js` (new)
- Export `buildChatProviders(models)` – used by chat routes
- Reuse `buildAgentProviders` logic; agentRunner imports from here
- Deduplicate chat route provider arrays

### Step 3: Refactor knowledgeService
**File**: `src/services/knowledgeService.js`
- Use `createCachedFileLoader` with `indexKey: "documents"`, `skipMissingFiles: true`
- Remove custom cache/stampede logic
- Keep `getKnowledgeString` and `clearKnowledgeCache` API

### Step 4: Apply asyncHandler
**Files**: `src/routes/agent-executor.js`, `src/controllers/agentControl.js`
- Wrap async route handlers with `asyncHandler`
- Remove manual try/catch; let errors propagate to error middleware

### Step 5: Improve agentRunner Error Handling
**File**: `src/runners/agentRunner.js`
- Re-throw `AppError` instead of swallowing
- Callers (agentsController, agent-executor) handle via error middleware
- Add `Promise.all` for parallel agents + knowledge load

### Step 6: Add Unit Tests
**Files**: New tests in `tests/`
- `cachedFileLoader.test.js`
- `circuitBreaker.test.js`
- `httpClient.test.js`
- `providerUtils.test.js`
- `knowledgeService.test.js`

### Step 7: CLI Commands & Report
**File**: `docs/REFACTOR_SUMMARY.md`
- Document `npm test`, `npm run test:unit`, `npm run validate`, `node test-performance.js`
- Add `npm run perf` script for performance profiling

---

## 5. Design Patterns Applied

| Pattern | Where |
|---------|-------|
| Factory | `createCachedFileLoader`, `createYAMLLoader` |
| Circuit Breaker | `circuitBreaker.js` (existing) |
| Async Handler | `asyncHandler.js` (existing), extend usage |
| Strategy | `providerUtils` – provider selection logic |
| Single Responsibility | `httpClient` – HTTP concerns only |

---

## 6. Expected Improvements

- **Lines reduced**: ~200+ (HTTP + provider + knowledge dedup)
- **Test coverage**: +5 test files for critical paths
- **Performance**: Parallel load in agentRunner; consistent caching
- **Maintainability**: Single HTTP client, single provider builder, clearer error flow
