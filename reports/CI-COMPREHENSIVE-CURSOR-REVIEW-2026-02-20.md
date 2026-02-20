# BSM Comprehensive Repository Review (Cursor)  
**Date:** 2026-02-20  
**Repository:** `MOTEB1989/BSM`  
**Reviewer:** Cursor Cloud Agent

## 1) Execution Notes

The requested `crusosr` CLI is not installed in this environment, so equivalent native project checks were executed:

- `npm test` (core validation)
- `npm run test:unit` (backend/unit/integration checks)
- `npm run validate:registry`
- `npm run validate:agent-sync`
- `npm run health:detailed`
- `npm run pr-check`
- `npm audit --omit=dev`

## 2) Review Coverage

- **Front-end:** `src/chat`, `lexprim-chat`
- **Back-end:** routes, middleware, services, controllers
- **AI models & fallback:** `gptService`, `modelRouter`
- **Agents:** `data/agents/*`, `agents/registry.yaml`, sync validation
- **Integrations:** GitHub Actions API, Telegram agent, Go microservice client, webhook paths
- **iPhone integration:** verified project iOS app structure via unit test suite

## 3) Findings (Observed During Review)

### High
1. **Auth import breakage in notifications routes**
   - `src/routes/notifications.js` imported `{ auth }` but `src/middleware/auth.js` did not export it.
   - Impact: importing route index could fail, breaking API boot path.

2. **Agent sync drift**
   - `npm run validate:agent-sync` failed:
     - `agent-auto` missing in `agents/registry.yaml`
     - `gemini-agent` governance `risk.rationale` mismatch between data and registry
   - Impact: governance inconsistency and CI drift.

3. **Go service retry timeout bug**
   - `src/services/goServiceClient.js` reused one timeout/controller across retries.
   - Impact: later retry attempts could run without timeout protection.

### Medium
4. **Notification history endpoint route order**
   - `/coordination/:sessionId` was registered before `/coordination/history`.
   - Impact: history endpoint could be shadowed.

5. **External integrations missing resilience controls**
   - GitHub API and Telegram agent lacked circuit breaker + request timeout handling.
   - Impact: increased risk of hangs/cascading failures under provider/network instability.

6. **Front-end markdown rendering risk**
   - `src/chat/index.html` uses `v-html`, and renderer previously returned unsanitized markdown HTML.
   - Impact: potential XSS vector from model output.

## 4) Fixes Implemented

### Backend & Integrations
- Exported backward-compatible `auth` alias in `src/middleware/auth.js`.
- Added `req.adminToken` propagation for authenticated requests.
- Fixed notifications route precedence (`/coordination/history` before `/:sessionId`).
- Added radix-safe `parseInt(..., 10)` in notification query parsing.
- Fixed per-attempt timeout/controller lifecycle in `GoServiceClient` retries.
- Fixed autocomplete endpoint to include encoded `prefix` query param.
- Hardened GitHub webhook integration handlers to tolerate partial payloads without throwing.

### AI/External Resilience
- Added **circuit breaker + timeout** to:
  - `src/actions/githubActions.js` (GitHub API)
  - `src/config/modelRouter.js` (OpenAI/Perplexity/Kimi calls)
  - `src/orbit/agents/TelegramAgent.js` (Telegram API)

### Agents Governance Sync
- Added missing governance fields to `data/agents/agent-auto.yaml`.
- Added `agent-auto` entry in `agents/registry.yaml`.
- Aligned `gemini-agent` `risk.rationale` with data source.

### Front-end Security Hardening
- Added HTML sanitization pipeline in `src/chat/app.js` before returning markdown for `v-html`.
- Added safe fallback escaping when markdown parsing fails.

## 5) Validation Results (Post-Fix)

- ✅ `npm test`
- ✅ `npm run test:unit`
- ✅ `npm run validate:registry`
- ✅ `npm run validate:agent-sync`
- ✅ `npm run pr-check`
- ✅ `npm audit --omit=dev` (0 vulnerabilities)
- ✅ Route import smoke check:
  - `node -e "import('./src/routes/index.js')..."` => `routes:ok`
- ℹ️ `npm run health:detailed`: server endpoint check remains offline unless server is actively running (expected in CI-style review runs).

## 6) iPhone + MCP Integration Notes

- iOS app structure tests passed in unit suite (`tests/ios-app.test.js`).
- MCP/iPhone setup commands from request require runtime secrets and device-side configuration not available in this isolated review environment.
- Recommended operational flow:
  1. Configure secrets via GitHub environment/Actions secrets (not committed files).
  2. Use `.env` locally only; never commit.
  3. Validate webhook + mobile mode with staged credentials and test chats.

## 7) Residual Risks / Next Actions

1. Add dedicated tests for:
   - notification route precedence (`/coordination/history`)
   - Go service retry timeout behavior
   - markdown sanitization safety cases
   - webhook payload edge-cases (missing repository/sender arrays)
2. Consider schema-based API contracts (OpenAPI/JSON Schema) for `/api/*` endpoints.
