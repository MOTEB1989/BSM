# CLAUDE.md

## Project Overview

BSM (Business Service Management) is a Node.js/Express.js multi-agent AI platform for legal services and knowledge management. It integrates with multiple AI providers (OpenAI, Perplexity, Anthropic, Gemini, Groq, Cohere, Mistral, Azure OpenAI, Kimi/Moonshot), serves a Vue 3 chat frontend, and provides agent orchestration via YAML-configured agents.

The package name is `bsu` and the server logs identify as "BSU API". The repository is `LexBANK/BSM`.

- **Language:** JavaScript (ES Modules) with some TypeScript
- **Runtime:** Node.js 22+ (see `.nvmrc`)
- **Framework:** Express.js
- **Entry point:** `src/server.js`

## Commands

```bash
# Install dependencies
npm ci

# Run development server (auto-reload via nodemon)
npm run dev

# Run production server
npm start

# Run validation/tests (validates agent YAML configs, registry, orchestrator config)
npm test
# or equivalently:
npm run validate

# Run unit tests (Node.js built-in test runner)
npm run test:unit

# Additional validation scripts
npm run validate:registry       # Registry-specific validation
npm run validate:agent-sync     # Agent synchronization validation
npm run validate:render         # Render deployment config validation

# Agent deduplication and management
npm run check:duplicates        # Check for duplicate agents (also runs as precommit hook)
npm run merge:agents            # Merge agent definitions
npm run check:tools             # Verify required tools are installed

# Health checks
npm run health                  # Basic health check
npm run health:detailed         # Comprehensive health check

# Agent operations
npm run agents:integrity        # Run integrity agent
npm run agents:audit            # Run audit agent
npm run agents:orchestrate      # Run orchestration pipeline

# PR operations
npm run fix-pr                  # Auto-fix PR: merge main, resolve conflicts, run tests, push
npm run pr-check                # Local PR review checklist
npm run pr-check:verbose        # Verbose PR review checklist

# Performance testing
npm run perf                    # Run performance test suite

# Git hooks
npm run install:hooks           # Install .githooks into .git/hooks

# MCP Servers
npm run mcp:install             # Install MCP server dependencies
npm run mcp:start               # Start BSU unified MCP server
npm run mcp:banking             # Start banking hub MCP server
npm run mcp:github              # Start GitHub MCP server (Node.js wrapper)
npm run mcp:github:docker       # Start GitHub MCP server (Docker)
npm run mcp:github:test         # Test GitHub MCP server connection
```

## Architecture

```
src/
  server.js          # Server entry point (registry validation gate, listens on PORT)
  app.js             # Express app setup (CORS, Helmet, rate limiting, CSP, middleware)
  routes/            # API route definitions (17 route modules)
    index.js         #   Route aggregator, mounts all under /api
    health.js        #   Health check endpoints
    status.js        #   System status with features and capabilities
    agents.js        #   Agent listing, execution, start/stop/status
    chat.js          #   Agent-based chat and direct GPT chat with history
    knowledge.js     #   Knowledge base management
    admin.js         #   Admin panel endpoints (requires x-admin-token)
    ai-proxy.js      #   AI model proxy to multiple providers
    orchestrator.js  #   Agent orchestration pipeline endpoints
    webhooks.js      #   GitHub and Telegram webhook routing
    emergency.js     #   Emergency control endpoints
    control.js       #   Control plane endpoints
    pr.js            #   PR evaluation and batch operations
    agent-executor.js #  Safe agent command execution (whitelisted commands)
    joke.js          #   Random joke endpoint (/api/random-joke)
    notifications.js #   Team notifications hub (multi-channel)
    mobile.js        #   Lightweight mobile/PWA remote control endpoints
  controllers/       # Request handlers
    healthController.js      # Comprehensive health checks (filesystem, registry, env, circuit breakers)
    agentsController.js      # Agent listing and execution
    agentControl.js          # Agent lifecycle management (start/stop/status)
    knowledgeController.js   # Knowledge document retrieval
    orchestratorController.js # Orchestration control
    webhookController.js     # GitHub webhook handling
    prOperationsController.js # PR evaluation and batch operations
    jokeController.js        # Random joke fetching
  services/          # Business logic
    gptService.js                # OpenAI API integration with circuit breaker, timeouts
    agentsService.js             # Agent loading with 1-min TTL cache, stampede prevention
    knowledgeService.js          # Knowledge base loading with caching
    orchestratorService.js       # Agent orchestration logic
    agentStateService.js         # State management for agents
    agentCoordinationService.js  # Agent coordination and inter-agent messaging
    notificationService.js       # Team notifications (in-memory, Telegram, webhooks)
    securityShieldService.js     # Security threat detection and coordinated response
    jokeService.js               # External joke API integration
    goServiceClient.js           # Go microservice integration client
    telegramStatusService.js     # Telegram bot integration
    vectorService.js             # Vector database operations
    audit.js                     # Audit logging
    githubWebhookIntegration.js  # GitHub webhook event processing
  middleware/        # Express middleware
    auth.js               #   Timing-safe admin token auth + HTTP Basic Auth for admin UI
    correlation.js        #   Request correlation ID injection
    requestLogger.js      #   HTTP request logging
    errorHandler.js       #   Global error handling with structured responses
    lanOnly.js            #   LAN-only access enforcement
    mobileMode.js         #   Mobile-specific restrictions
    notFound.js           #   404 handling
    validateChatInput.js  #   Chat input validation (message, history, language)
    samaCompliance.js     #   SAMA (Saudi Central Bank) cybersecurity compliance
    webhookRateLimit.js   #   Shared rate limiter for GitHub webhook endpoints
  runners/           # Agent execution logic
    agentRunner.js   #   Agent execution engine (template rendering, intent extraction, action validation)
    orchestrator.js  #   Orchestrator runner for pipelines
  config/            # Environment and model configuration
    env.js              #   Environment variable parsing with validation
    models.js           #   Model provider configuration (OpenAI, Perplexity, Kimi, etc.)
    modelRouter.js      #   Multi-model routing based on task complexity
    orchestratorEvents.js # Event configuration for orchestration
    smartKeyManager.js  #   Smart API key manager with auto-rotation and failover
  utils/             # Shared utilities
    logger.js           #   Pino-based structured logging (colorized dev, JSON prod)
    circuitBreaker.js   #   Circuit breaker pattern (CLOSED/OPEN/HALF_OPEN states)
    errors.js           #   Custom error classes
    intent.js           #   Intent extraction and mapping
    asyncHandler.js     #   Async handler wrapper to eliminate try-catch boilerplate
    messageFormatter.js #   Chat message formatting (buildChatMessages, getSystemPrompt, formatOutput)
    cachedFileLoader.js #   Generic file loader factory with TTL caching and stampede prevention
    httpResponses.js    #   Standard HTTP response builders
    httpClient.js       #   Shared fetch wrapper with timeout, error mapping, API key sanitization
    providerUtils.js    #   Centralized AI provider selection and priority ordering
    commandExecutor.js  #   Safe command executor (allowlisted base commands only)
    bilingual.js        #   Arabic/English bilingual support (prompts, errors, RTL detection)
    apiKey.js           #   API key utilities and usability checks
    auditLogger.js      #   Audit trail logging
    registryValidator.js #  Registry validation (called at server startup)
    registryCache.js    #   Registry caching
    telegramUtils.js    #   Telegram utilities
    fsSafe.js           #   Safe filesystem operations
    githubDispatch.ts   #   GitHub Actions dispatch (TypeScript)
  agents/            # Agent implementation classes
    CodeReviewAgent.js     # Code review automation
    GovernanceAgent.js     # Governance enforcement
    IntegrityAgent.js      # Integrity checking
    PRMergeAgent.js        # PR merge automation
    securityScanner.js     # Security scanning
    governanceResearch.js  # Governance research
    legalResearch.js       # Legal research
    orbit/                 # ORBIT self-healing agent integration
  guards/            # Permission and mode guards (TypeScript)
    permissions.ts   #   Permission checking
    modes.ts         #   Mode enforcement (mobile, LAN, etc.)
    approvals.ts     #   Approval workflow enforcement
    telegramGuard.js #   Telegram-specific guards
  api/               # Multi-provider AI API clients (TypeScript)
    base-client.ts   #   Base client class
    client-factory.ts #  Client factory pattern (add providers here, not new files)
    control.ts       #   Control plane
    types.ts         #   TypeScript type definitions
    index.ts         #   Module exports
  orchestrator/      # TypeScript orchestrator
    index.ts         #   Pipeline execution, guards, approvals, audit
  audit/             # Audit logging
    index.ts         #   Audit logging exports
    logger.ts        #   Audit logging implementation
  orbit/             # ORBIT self-healing agent
    agents/TelegramAgent.js # Telegram bot agent
    orbit.worker.ts          # ORBIT worker (TypeScript)
    telegram.gateway.worker.ts # Telegram gateway worker (TypeScript)
    router.js                # ORBIT routing
    webhooks/                # ORBIT webhook handlers
  database/          # Optional database connection helpers
    mysql.js         #   MySQL connection helper
  chat/              # Vue 3 + Tailwind chat UI (served at /chat)
    index.html       #   Bilingual (Arabic/English) chat interface, PWA-ready
    app.js           #   Chat application logic
    styles.css       #   Custom Tailwind styling
    manifest.json    #   PWA manifest
    sw.js            #   Service Worker for offline support
    tailwind.config.js # Tailwind configuration
    key-status-display.js # AI provider status display
  admin/             # Admin dashboard UI (served at /admin, requires auth)
    index.html       #   Admin panel HTML
    app.js           #   Admin dashboard logic
    styles.css       #   Admin styling
  actions/           # GitHub integration
    githubActions.js #   GitHub API integration
  webhooks/          # Webhook handlers
    telegram.js      #   Telegram webhook handling
  views/             # Vue components
    LandingPage.vue  #   Landing page component

data/
  agents/            # YAML agent definitions
    index.json       #   Registry of 18 active agent YAML files
    my-agent.yaml    #   BSU Smart Agent (system management)
    agent-auto.yaml  #   Auto agent
    legal-agent.yaml #   Legal analysis
    governance-agent.yaml       # Governance enforcement
    governance-review-agent.yaml # Governance review
    code-review-agent.yaml      # Code review
    security-agent.yaml         # Security scanning
    pr-merge-agent.yaml         # PR merge automation
    integrity-agent.yaml        # Integrity checking
    bsu-audit-agent.yaml        # Audit logging
    repository-review.yaml      # Repository analysis
    ios-chat-integration-agent.yaml # iOS integration
    kimi-agent.yaml             # Kimi/Moonshot AI agent
    gemini-agent.yaml           # Google Gemini agent
    claude-agent.yaml           # Anthropic Claude agent
    perplexity-agent.yaml       # Perplexity search agent
    groq-agent.yaml             # Groq ultra-fast inference agent
    raptor-agent.yaml           # Raptor agent
  knowledge/         # Knowledge base documents
    index.json       #   Knowledge document registry
    example.md       #   Example knowledge document

agents/
  registry.yaml      # Agent registry with governance fields (validated at startup)

scripts/             # Build, validation, and automation scripts
  validate.js        #   Main validation (agent YAML, registry, orchestrator config)
  validate-registry.js # Registry-specific validation
  validate-agent-sync.js # Agent synchronization validation
  validate-orchestrator.js # Orchestrator config validation
  validate-docker-compose.cjs # Docker Compose validation
  validate-env.sh    #   Environment variable validation
  validate-render.js #   Render.com deployment config validation
  health-check.js    #   Comprehensive health check (supports --detailed)
  pr-review-checklist.js # PR review automation
  pr-status-check.js #   PR status checking
  pr-manager.js      #   PR management automation
  pr-operations.js   #   PR operations automation
  check-required-tools.js # Verify required tools are installed
  prevent-duplicate-agents.js # Agent deduplication (runs as precommit hook)
  merge-agents.js    #   Merge agent definitions
  install-git-hooks.js # Install git hooks (runs as npm prepare)
  verify-copilot-agents.js # Verify GitHub Copilot agents configuration
  run_agents.sh      #   Agent execution script
  run-integrity-check.js # Integrity agent runner
  audit-runner.js    #   Audit runner
  bootstrap.sh       #   Bootstrap script (Linux/macOS)
  bootstrap.ps1      #   Bootstrap script (Windows)
  bootstrap-orbit.sh #   ORBIT bootstrap with GitHub Secrets
  build_reports_index.js # Report generation
  json_to_md.js      #   JSON to Markdown conversion
  security-check.sh  #   Security validation
  fix-pr.sh         #   Auto-fix PR: merge main, resolve conflicts, run tests, push
  safe-rebase.sh    #   Safe git rebase helper
  schema.yaml        #   YAML schema definitions
  test-validation-performance.js # Validation performance benchmarks
  mysql/             # MySQL initialization scripts
    init.sql         #   Database initialization

mcp-servers/         # MCP (Model Context Protocol) server implementations
  bsu-agent-server.js  # BSU unified MCP server for GitHub Copilot
  banking-hub.js       # Banking hub MCP server
  github-mcp-server.js # GitHub MCP server (Node.js wrapper)
  supreme-unrestricted-agent.js # ⚠️ DANGER: Unrestricted agent (test environments ONLY)
  agents/            # MCP agent definitions
  package.json       # MCP server dependencies (@modelcontextprotocol/sdk, browser-devtools-mcp)

lexprim-chat/        # Nuxt 3 chat frontend (separate app)
  nuxt.config.ts     #   Nuxt configuration
  package.json       #   Nuxt dependencies
  app.vue            #   Root application component
  pages/index.vue    #   Index page
  components/        #   Vue components (ChatHeader, ChatInput, ChatMessage, etc.)
  composables/useApi.js # API integration composable
  stores/chat.js     #   Pinia chat state management

tests/               # Test suite
  *.test.js          #   Unit tests (Node.js built-in test runner via `npm run test:unit`)
  integration/       #   Integration tests (ai-providers.test.js)

docs/                # 93 documentation files and GitHub Pages frontend (lexdo.uk)

.github/
  workflows/         # 42 CI/CD workflow files
  agents/            # Agent definitions for GitHub Actions
    orchestrator.config.json # Orchestrator configuration (validated by npm test)
  CODEOWNERS         # Code ownership

.githooks/           # Local git hooks (install via `npm run install:hooks`)
  pre-commit         # Runs duplicate agent check before each commit
  install.sh         # Hook installer script
```

## Key API Endpoints

### Health & Status
- `GET /health` - Top-level health check (compatibility)
- `GET /api/health` - API health check
- `GET /api/health/detailed` - Comprehensive health (filesystem, registry, env, circuit breakers)
- `GET /api/status` - System capabilities and feature flags

### Agents
- `GET /api/agents` - List available agents
- `POST /api/agents/run` - Execute an agent
- `POST /api/agents/start/:agentId` - Start an agent
- `POST /api/agents/stop/:agentId` - Stop an agent
- `GET /api/agents/status` - All agents status
- `GET /api/agents/:agentId/status` - Individual agent status

### Agent Executor (Command Execution)
- `POST /api/agent/execute` - Execute a whitelisted command via agent runner

### Chat
- `POST /api/chat` - Agent-based chat
- `POST /api/chat/direct` - Direct GPT chat with message history
- `GET /api/chat/key-status` - AI provider key status

### Knowledge
- `GET /api/knowledge` - List knowledge documents

### Admin (requires `x-admin-token` header)
- `GET /api/admin/agents` - Agent configuration
- `GET /api/admin/knowledge` - Knowledge management

### AI Proxy
- `POST /api/ai-proxy/*` - Proxy to multiple AI providers

### Orchestrator
- `POST /api/orchestrator/run` - Run orchestration pipeline
- `GET /api/orchestrator/status` - Pipeline status

### PR Operations
- `POST /api/pr/evaluate` - Evaluate a single PR
- `POST /api/pr/batch-evaluate` - Batch evaluate multiple PRs
- `GET /api/pr/config` - PR operations configuration
- `GET /api/pr/health` - PR operations health

### Notifications
- `GET /api/notifications` - Get recent notifications (filter by type, priority, since)
- `POST /api/notifications` - Broadcast a notification to all subscribed agents

### Mobile / Remote Control
- `GET /api/mobile/status` - Minimal status for iPhone PWA and remote clients

### Misc
- `GET /api/random-joke` - Fetch a random joke (external API)

### Webhooks
- `POST /webhook/github` - GitHub webhooks (top-level, before security middleware)
- `POST /api/webhooks/github` - GitHub webhooks (API-level)
- `POST /api/webhooks/telegram` - Telegram bot webhooks

### Control & Emergency
- `POST /api/control/*` - Control plane operations
- `POST /api/emergency/*` - Emergency procedures

### Static UIs
- `/chat` - Vue 3 chat interface (with CSP headers)
- `/admin` - Admin dashboard (HTTP Basic Auth)
- `/` - Redirects to `/chat`

## Environment Variables

See `.env.example` for the full list. Key variables:

### Core
- `NODE_ENV` - Environment (`development`/`production`)
- `PORT` - Server port (default: `3000`)
- `LOG_LEVEL` - Pino log level (default: `info`)

### AI Providers
- `OPENAI_BSM_KEY` / `OPENAI_BSU_KEY` / `OPENAI_API_KEY` - OpenAI API key (priority: BSM > BSU > generic)
- `OPENAI_MODEL` - OpenAI model (default: `gpt-4o-mini`)
- `DEFAULT_MODEL` - Default model for routing (default: `gpt-4o-mini`)
- `MODEL_ROUTER_STRATEGY` - Multi-model routing strategy (default: `balanced`)
- `FALLBACK_ENABLED` - Enable model fallback (default: `true`)
- `ANTHROPIC_API_KEY` - Anthropic/Claude API key
- `PERPLEXITY_KEY` - Perplexity AI API key
- `PERPLEXITY_MODEL` - Perplexity model name
- `PERPLEXITY_CITATIONS` - Enable citations (default: `true`)
- `PERPLEXITY_RECENCY_DAYS` - Recency filter in days (default: `7`)
- `GEMINI_API_KEY` - Google Gemini API key
- `KIMI_API_KEY` - Moonshot AI (Kimi) API key
- `GROQ_API_KEY` - Groq API key
- `COHERE_API_KEY` - Cohere API key (optional)
- `MISTRAL_API_KEY` - Mistral AI API key (optional)
- `AZURE_OPENAI_ENDPOINT` / `AZURE_OPENAI_KEY` / `AZURE_OPENAI_DEPLOYMENT` - Azure OpenAI (optional)

### Authentication
- `ADMIN_TOKEN` - Admin authentication token (must be 16+ chars in production, cannot be `change-me`)

### Network & Security
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: `900000` / 15 min)
- `RATE_LIMIT_MAX` - Max requests per window (default: `100`)
- `MAX_AGENT_INPUT_LENGTH` - Agent input character limit (default: `4000`)
- `EGRESS_POLICY` - Outbound network policy: `allow_all`, `deny_by_default`, `deny_all`
- `EGRESS_ALLOWED_HOSTS` - Allowed outbound hosts (default: `api.openai.com,github.com`)
- `SAMA_DATA_RESIDENCY` - Set to `strict` to enforce SAMA cross-border data transfer restrictions

### Feature Flags
- `MOBILE_MODE` - Restrict operations for mobile clients (default: `false`)
- `LAN_ONLY` - Restrict access to local network (default: `false`)
- `SAFE_MODE` - Disable all external API calls (default: `false`)
- `SUPREME_AGENT_ENABLED` - Enable unrestricted agent (default: `false`, **never enable in production**)
- `SUPREME_AGENT_DRY_RUN` - Dry-run mode for supreme agent (default: `true`)

### GitHub Integration
- `GITHUB_BSU_TOKEN` - GitHub personal access token
- `GITHUB_WEBHOOK_SECRET` - Webhook signature verification
- `GITHUB_REPO` - Repository name (e.g., `LexBANK/BSM`)

### ORBIT & Telegram (optional)
- `ORBIT_GITHUB_TOKEN` - ORBIT GitHub token
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `TELEGRAM_WEBHOOK_SECRET` - Telegram webhook secret
- `ORBIT_ADMIN_CHAT_IDS` - Allowed Telegram chat IDs

### Database (optional, for Docker Compose setups)
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `REDIS_URL` - Redis connection URL

## Code Conventions

- **ES Modules** throughout (`import`/`export`, `"type": "module"` in package.json)
- **TypeScript** used in `src/guards/`, `src/api/`, `src/orchestrator/`, `src/audit/`, and select utility files
- **Pino** for structured JSON logging (colorized in dev via `pino-pretty`, JSON in production)
- **Express middleware pattern**: correlation IDs, request logging, auth, LAN/mobile guards, error handling
- **Agent definitions** are YAML files in `data/agents/` referenced by `data/agents/index.json`
- **Agent registry** at `agents/registry.yaml` requires governance fields (`risk`, `approval`, `startup`, `healthcheck`, `contexts.allowed`)
- **Allowed agent actions** are restricted to a whitelist in `scripts/validate.js`
- **Circuit breaker pattern** for external API calls (`src/utils/circuitBreaker.js`): 5-failure threshold, 30s reset timeout, CLOSED/OPEN/HALF_OPEN states
- **Cache stampede prevention**: agent and knowledge services use in-flight promise tracking with 1-minute TTL
- **Multi-model routing**: `src/config/modelRouter.js` selects AI models based on task complexity
- **Registry validation gate**: server refuses to start if `agents/registry.yaml` validation fails (`src/server.js`)
- **Standard HTTP responses**: use `src/utils/httpResponses.js` for consistent response formatting
- **Bilingual support**: use `src/utils/bilingual.js` for Arabic/English system prompts; the chat UI supports RTL (Arabic) and LTR (English)
- **Precommit hook**: `npm run check:duplicates` runs automatically before each commit to prevent duplicate agent IDs
- **Provider ordering**: `src/utils/providerUtils.js` defines canonical provider priority: openai → kimi → perplexity → anthropic → gemini → groq

### Refactoring Patterns (Established 2026-02)

To reduce code duplication and improve maintainability, the following patterns should be used:

1. **Async Handler Pattern** (`src/utils/asyncHandler.js`)
   - Wrap all async route handlers and controllers with `asyncHandler()` to eliminate try-catch boilerplate
   - Automatically delegates errors to Express error middleware
   - Example: `router.get('/path', asyncHandler(async (req, res) => { ... }))`

2. **Chat Input Validation** (`src/middleware/validateChatInput.js`)
   - Use `validateChatInput` middleware for consistent validation of message, history, and language parameters
   - Example: `router.post('/chat', validateChatInput, asyncHandler(async (req, res) => { ... }))`

3. **Message Formatting Utilities** (`src/utils/messageFormatter.js`)
   - Use `buildChatMessages()` for constructing message arrays with history
   - Use `getSystemPrompt(language, platform)` for localized system prompts
   - Use `formatOutput(result, language)` for consistent output formatting with fallback messages

4. **Cached File Loader Factory** (`src/utils/cachedFileLoader.js`)
   - Use `createCachedFileLoader()` or `createYAMLLoader()` for loading files with TTL caching and stampede prevention
   - Example: `const { load, clear } = createYAMLLoader({ name, dirPath, indexFile, indexKey, validator, cacheTTL })`

5. **API Client Factory Pattern** (`src/api/client-factory.ts`)
   - API clients are created dynamically via factory, not individual class files
   - To add new AI providers, update the `SUPPORTED_PROVIDERS` array in `client-factory.ts`
   - Do not create separate client class files

6. **Shared HTTP Client** (`src/utils/httpClient.js`)
   - Use for external API calls with consistent timeout, error mapping, and API key sanitization
   - Handles 401/403/429/502 consistently; eliminates duplication across service files

7. **Provider Utilities** (`src/utils/providerUtils.js`)
   - Use `buildChatProviders(models)` to get an ordered list of available AI providers
   - Centralizes provider priority and API key resolution logic

8. **Smart Key Manager** (`src/config/smartKeyManager.js`)
   - Handles automatic API key rotation and failover across providers
   - Tracks usage statistics and failure counts per provider

## Testing

The project uses two testing approaches:

### Validation Tests (`npm test`)
Runs `scripts/validate.js` which checks:
1. **Agent YAML validation**: `data/agents/index.json` exists and contains an `agents` array; each referenced YAML file exists and has an `id` field; agent actions are from the allowed set
2. **Registry validation** (if `agents/registry.yaml` exists): all agents have required governance fields (`id`, `risk`, `approval`, `startup`, `healthcheck`, `contexts.allowed`); `auto_start` must be `false`
3. **Orchestrator config validation** (if `.github/agents/orchestrator.config.json` exists): validates name, version, non-empty agents array; ensures `secrets.logging.logSecrets` is never `true`

### Unit Tests (`npm run test:unit`)
Uses Node.js built-in test runner (`node --test`). Test files in `tests/*.test.js` cover:
- `adminUiAuth.test.js` - Admin UI authentication
- `agent-executor.test.js` - Agent executor command safety
- `agentRunner.providers.test.js` - Agent runner provider handling
- `apiKey.test.js` - API key utilities
- `auditLogger.test.js` - Audit logging
- `cachedFileLoader.test.js` - File loader caching
- `circuitBreaker.test.js` - Circuit breaker states
- `httpClient.test.js` - HTTP client error handling
- `integrity-agent.test.js` - Integrity agent
- `ios-app.test.js` - iOS app integration
- `joke-api.test.js` - Joke API
- `knowledgeService.test.js` - Knowledge service caching
- `providerUtils.test.js` - Provider utilities
- `saffio-system.test.js` - Saffio unified system
- `webhookController.test.js` - Webhook handling
- `integration/ai-providers.test.js` - Integration tests for AI providers

Additional validation commands:
- `npm run validate:registry` - Registry-specific validation
- `npm run validate:agent-sync` - Agent synchronization validation
- `npm run pr-check` - Local PR review checklist

CI runs validation on every PR and push to main (`.github/workflows/validate.yml`).

## Security

### Authentication & Authorization
- Timing-safe token comparison for admin auth (constant-time to prevent timing attacks)
- HTTP Basic Auth for admin UI
- `x-admin-token` header validation for admin API routes
- Admin token minimum 16 chars in production, cannot be `change-me`

### Network Security
- Helmet.js for HTTP security headers
- Content Security Policy (CSP) with specific directives on `/chat` route
- CORS with configurable origins
- Rate limiting: 100 req/15 min on `/api`, 30 req/min on `/webhook/github`
- 1MB request body limit
- Egress policy control (`deny_by_default` recommended in production)

### SAMA Compliance (`src/middleware/samaCompliance.js`)
- Implements Saudi Central Bank (SAMA) cybersecurity standards
- Data residency controls (restrict cross-border transfer with `SAMA_DATA_RESIDENCY=strict`)
- AES-256-GCM encryption standards
- Audit logging for all regulated transactions

### Secret Scanning
- Gitleaks configuration (`.gitleaks.toml`) with 25+ custom rules
- CodeQL analysis via GitHub Actions
- Orchestrator config validation prevents `logSecrets: true`

### Feature Flags for Security
- `LAN_ONLY` - Restrict to local network access
- `MOBILE_MODE` - Restrict mobile client operations
- `SAFE_MODE` - Disable all external API calls
- Production warnings for insecure combinations

### Infrastructure Security
- Non-root Docker user in production images
- `dumb-init` for proper signal handling in containers
- Health checks for all Docker services
- Circuit breaker pattern prevents cascade failures on external API outages

### Security Shield (`src/services/securityShieldService.js`)
- Detects threats and coordinates a response across all agents
- Tracks threat level: `normal` → `elevated` → `high` → `critical`
- Activates security shield mode and notifies via `notificationService`

## Deployment

- **Render.com** - Default deployment target (`render.yaml`, validated by `npm run validate:render`)
- **Docker** - Multi-stage build available (`Dockerfile.example`): base, deps, dev, builder, production stages
- **Docker Compose** - Multi-container setups:
  - `docker-compose.mysql.yml` - MySQL 8.0 + Redis 7 + Node.js
  - `docker-compose.yml.example` - PostgreSQL 16 + Redis + Node.js
  - `docker-compose.hybrid.yml` - Full stack with Go services
- **GitHub Pages** - Frontend hosted at lexdo.uk (`docs/` directory)
- **Cloudflare** - DNS and cache management (workflows for deployment and cache purging)

## Database Support (Optional)

BSM includes optional database integration:
- MySQL connection helper in `src/database/mysql.js`
- Database initialization scripts in `scripts/mysql/init.sql`
- See `docs/MYSQL-MULTI-CONTAINER.md` for setup guide
- Requires `mysql2` package: `npm install mysql2`
- PostgreSQL and Redis support via Docker Compose configurations

## Agent System

### Agent Execution Pipeline
1. Load agent definition from YAML in `data/agents/`
2. Render system/user prompts with template variables
3. Call GPT service with circuit breaker protection
4. Extract intent from response
5. Validate actions against the allowed whitelist
6. Execute action if authorized

### Active Agents (18)
Defined in `data/agents/index.json`:
- `my-agent` - BSU Smart Agent (system management)
- `agent-auto` - Auto agent (repository health, maintenance)
- `legal-agent` - Legal analysis
- `governance-agent` - Governance enforcement
- `governance-review-agent` - Governance review
- `code-review-agent` - Code review and PR quality checks
- `security-agent` - Security scanning and alert monitoring
- `pr-merge-agent` - Automated PR merging and branch cleanup
- `integrity-agent` - Integrity checking
- `bsu-audit-agent` - Audit logging
- `repository-review` - Repository analysis
- `ios-chat-integration-agent` - iOS integration
- `kimi-agent` - Kimi/Moonshot AI (Chinese language model)
- `gemini-agent` - Google Gemini (multimodal)
- `claude-agent` - Anthropic Claude
- `perplexity-agent` - Perplexity (real-time web search with citations)
- `groq-agent` - Groq (ultra-fast inference)
- `raptor-agent` - Raptor agent (restricted contexts for security)

### Agent Registry (18 entries)
All agents are also registered in `agents/registry.yaml` with governance fields. The registry version is `2.0` (Saffio Unified System), validated at server startup.

### Agent YAML Structure
Each agent YAML file requires:
- `id` - Unique agent identifier
- `name`, `role`, `version` - Agent metadata
- `modelProvider`, `modelKey`, `modelName` - AI model configuration
- `actions` - Array of allowed actions (from whitelist)
- `contexts.allowed` - Allowed execution modes
- `safety`, `risk`, `approval` - Governance fields

### Duplicate Prevention
- `scripts/prevent-duplicate-agents.js` enforces unique agent IDs across `data/agents/index.json` and `agents/registry.yaml`
- Runs automatically as a precommit hook (installed via `npm run install:hooks`)
- Also available as `npm run check:duplicates`

## GitHub Workflows

The project has 42 GitHub Actions workflows in `.github/workflows/` covering:
- **CI/CD**: `nodejs.yml`, `validate.yml`, `deploy.yml`, `unified-ci-deploy.yml`, `ci-deploy-render.yml`
- **Security**: `codeql-analysis.yml`, `secret-scanning.yml`
- **Agent operations**: `run-bsu-agents.yml`, `bsu-audit.yml`, `weekly-agents.yml`, `agent-guardian.yml`, `ai-agent-guardian.yml`, `agent-executor.yml`
- **PR management**: `pr-management.yml`, `pr-governance-check.yml`, `pr-operations.yml`, `pr-triage.yml`, `auto-merge.yml`, `close-stale-prs.yml`, `pr-checklist-gate.yml`, `pr-ci-failure-governance.yml`
- **Infrastructure**: `cf-deploy.yml`, `cf-purge-cache.yml`, `deploy-pages.yml`, `render-cli.yml`
- **ORBIT**: `orbit-actions.yml`, `orbit-telegram.yml`
- **Maintenance**: `cleanup.yml`, `dedupe.yml`, `keep-alive.yml`, `sync-repos.yml`, `nexus-sync.yml`
- **Reporting**: `publish-reports.yml`, `repo-review.yml`, `registry-validation.yml`
- **Deployment**: `deploy-ios-app.yml`, `static.yml`, `preflight-check.yml`
- **Automation**: `claude-assistant.yml`, `auto-keys.yml`

## GitHub MCP Server Integration

BSM includes integration with GitHub's official MCP (Model Context Protocol) server, providing comprehensive GitHub and Git repository management capabilities.

### Features
- **29+ Git Operations**: add, commit, push, pull, branch, merge, rebase, tag, stash, etc.
- **GitHub API Integration**: repositories, PRs, issues, workflows, security alerts
- **Workflow Automation**: automated release workflows, PR reviews, issue triage
- **CI/CD Visibility**: workflow status, run history, logs
- **Security Monitoring**: Dependabot alerts, code scanning, secret scanning
- **Browser DevTools**: via `browser-devtools-mcp` package (v0.2.23)

### Configuration

GitHub MCP server is configured in `.github/copilot/mcp.json` with two options:

1. **Docker Method** (recommended):
   ```bash
   npm run mcp:github:docker
   ```

2. **Go Method** (if Docker unavailable):
   ```bash
   go run github.com/github/github-mcp-server/cmd/github-mcp-server@latest stdio --dynamic-toolsets
   ```

### Required Environment Variables
```bash
GITHUB_BSU_TOKEN=ghp_...              # GitHub Personal Access Token
GITHUB_MCP_METHOD=docker              # 'docker' or 'go'
GITHUB_MCP_DOCKER_IMAGE=ghcr.io/github/github-mcp-server
GO_PATH=/usr/local/go/bin/go          # For 'go' method
```

### Integration with BSU Agents
GitHub MCP tools are available to all BSU agents:
- **agent-auto**: Repository health checks, maintenance
- **code-review-agent**: PR reviews, code quality checks
- **security-agent**: Security alert monitoring
- **pr-merge-agent**: Automated PR merging, branch cleanup

### Documentation
See `docs/GITHUB-MCP-INTEGRATION.md` for comprehensive setup guide, examples, and troubleshooting.

## Lexprim Chat (Nuxt 3 Frontend)

A separate Nuxt 3 application in `lexprim-chat/` provides an alternative chat frontend:
- Vue 3 components: `ChatHeader`, `ChatInput`, `ChatMessage`, `ChatError`, `ChatLoading`, `ChatWelcome`
- Pinia state management (`stores/chat.js`)
- API composable (`composables/useApi.js`)
- Tailwind CSS styling
- See `lexprim-chat/DEPLOYMENT.md` for deployment instructions

## Notification System

The `notificationService` (`src/services/notificationService.js`) provides a multi-channel broadcast hub:
- **Channels**: `internal` (in-memory EventEmitter), `audit`, `telegram`
- **Agent subscriptions**: agents can subscribe with type/priority filters
- **API**: `GET /api/notifications` with `limit`, `type`, `priority`, `since` query params
- **Broadcast**: `POST /api/notifications` requires admin token

## Team Coordination

`agentCoordinationService` (`src/services/agentCoordinationService.js`) enables inter-agent communication and task delegation. Agents can coordinate on complex multi-step workflows by messaging each other through this service.
