# CLAUDE.md

## Project Overview

BSM (Business Service Management) is a Node.js/Express.js multi-agent AI platform for legal services and knowledge management. It integrates with multiple AI providers (OpenAI, Perplexity, Anthropic, Gemini, Groq, Cohere, Mistral, Azure OpenAI), serves a Vue 3 chat frontend, and provides agent orchestration via YAML-configured agents.

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

# Additional validation scripts
npm run validate:registry       # Registry-specific validation
npm run validate:agent-sync     # Agent synchronization validation

# Health checks
npm run health                  # Basic health check
npm run health:detailed         # Comprehensive health check

# PR review
npm run pr-check                # Local PR review checklist
npm run pr-check:verbose        # Verbose PR review checklist
```

## Architecture

```
src/
  server.js          # Server entry point (registry validation gate, listens on PORT)
  app.js             # Express app setup (CORS, Helmet, rate limiting, CSP, middleware)
  routes/            # API route definitions (11 route modules)
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
  controllers/       # Request handlers
    healthController.js    # Comprehensive health checks (filesystem, registry, env, circuit breakers)
    agentsController.js    # Agent listing and execution
    agentControl.js        # Agent lifecycle management (start/stop/status)
    knowledgeController.js # Knowledge document retrieval
    orchestratorController.js # Orchestration control
    webhookController.js   # GitHub webhook handling
  services/          # Business logic
    gptService.js          # OpenAI API integration with circuit breaker, timeouts
    agentsService.js       # Agent loading with 1-min TTL cache, stampede prevention
    knowledgeService.js    # Knowledge base loading with caching
    orchestratorService.js # Agent orchestration logic
    agentStateService.js   # State management for agents
    goServiceClient.js     # Go microservice integration client
    telegramStatusService.js # Telegram bot integration
    vectorService.js       # Vector database operations
    audit.js               # Audit logging
  middleware/        # Express middleware
    auth.js          #   Timing-safe admin token auth + HTTP Basic Auth for admin UI
    correlation.js   #   Request correlation ID injection
    requestLogger.js #   HTTP request logging
    errorHandler.js  #   Global error handling with structured responses
    lanOnly.js       #   LAN-only access enforcement
    mobileMode.js    #   Mobile-specific restrictions
    notFound.js      #   404 handling
  runners/           # Agent execution logic
    agentRunner.js   #   Agent execution engine (template rendering, intent extraction, action validation)
    orchestrator.js  #   Orchestrator runner for pipelines
  config/            # Environment and model configuration
    env.js           #   Environment variable parsing with validation
    models.js        #   Model provider configuration (OpenAI, Perplexity)
    modelRouter.js   #   Multi-model routing based on task complexity
    orchestratorEvents.js # Event configuration for orchestration
  utils/             # Shared utilities
    logger.js        #   Pino-based structured logging (colorized dev, JSON prod)
    circuitBreaker.js #  Circuit breaker pattern (CLOSED/OPEN/HALF_OPEN states)
    errors.js        #   Custom error classes
    intent.js        #   Intent extraction and mapping
    httpResponses.js #   Standard HTTP response builders
    auditLogger.js   #   Audit trail logging
    registryValidator.js # Registry validation (called at server startup)
    registryCache.js #   Registry caching
    telegramUtils.js #   Telegram utilities
    fsSafe.js        #   Safe filesystem operations
    githubDispatch.ts #  GitHub Actions dispatch (TypeScript)
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
    client-factory.ts #  Client factory pattern
    openai-client.ts #   OpenAI integration
    anthropic-client.ts # Claude/Anthropic integration
    perplexity-client.ts # Perplexity API (with citations)
    gemini-client.ts #   Google Gemini
    groq-client.ts   #   Groq
    cohere-client.ts #   Cohere
    mistral-client.ts #  Mistral
    azure-openai-client.ts # Azure OpenAI
    types.ts         #   TypeScript type definitions
    control.ts       #   Control plane
    index.ts         #   Module exports
  orchestrator/      # TypeScript orchestrator
    index.ts         #   Pipeline execution, guards, approvals, audit
  audit/             # Audit logging
    logger.ts        #   Audit logging implementation
  orbit/             # ORBIT self-healing agent
    agents/TelegramAgent.js # Telegram bot agent
    router.js        #   ORBIT routing
    webhooks/telegram.js #  Telegram webhook handler
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
    index.json       #   Registry of 12 agent YAML files
    my-agent.yaml    #   BSU Smart Agent (system management)
    agent-auto.yaml  #   Auto agent
    legal-agent.yaml #   Legal analysis
    governance-agent.yaml # Governance enforcement
    code-review-agent.yaml # Code review
    security-agent.yaml    # Security scanning
    pr-merge-agent.yaml    # PR merge automation
    integrity-agent.yaml   # Integrity checking
    bsu-audit-agent.yaml   # Audit logging
    repository-review.yaml # Repository analysis
    ios-chat-integration-agent.yaml # iOS integration
    governance-review-agent.yaml    # Governance review
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
  health-check.js    #   Comprehensive health check (supports --detailed)
  pr-review-checklist.js # PR review automation
  pr-status-check.js #   PR status checking
  pr-manager.js      #   PR management automation
  run_agents.sh      #   Agent execution script
  run-integrity-check.js # Integrity agent runner
  audit-runner.js    #   Audit runner
  bootstrap.sh       #   Bootstrap script (Linux/macOS)
  bootstrap.ps1      #   Bootstrap script (Windows)
  bootstrap-orbit.sh #   ORBIT bootstrap with GitHub Secrets
  build_reports_index.js # Report generation
  json_to_md.js      #   JSON to Markdown conversion
  security-check.sh  #   Security validation
  mysql/             # MySQL initialization scripts
    init.sql         #   Database initialization

lexprim-chat/        # Nuxt 3 chat frontend (separate app)
  nuxt.config.ts     #   Nuxt configuration
  package.json       #   Nuxt dependencies
  app.vue            #   Root application component
  pages/index.vue    #   Index page
  components/        #   Vue components (ChatHeader, ChatInput, ChatMessage, etc.)
  composables/useApi.js # API integration composable
  stores/chat.js     #   Pinia chat state management

docs/                # Documentation and GitHub Pages frontend (lexdo.uk)

.github/
  workflows/         # 53 CI/CD workflow files
  agents/            # Agent definitions for GitHub Actions
    orchestrator.config.json # Orchestrator configuration (validated by npm test)
  CODEOWNERS         # Code ownership
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
- `PERPLEXITY_MODEL` - Perplexity model name
- `PERPLEXITY_CITATIONS` - Enable citations (default: `true`)
- `PERPLEXITY_RECENCY_DAYS` - Recency filter in days (default: `7`)

### Authentication
- `ADMIN_TOKEN` - Admin authentication token (must be 16+ chars in production, cannot be `change-me`)

### Network & Security
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: `900000` / 15 min)
- `RATE_LIMIT_MAX` - Max requests per window (default: `100`)
- `MAX_AGENT_INPUT_LENGTH` - Agent input character limit (default: `4000`)
- `EGRESS_POLICY` - Outbound network policy: `allow_all`, `deny_by_default`, `deny_all`
- `EGRESS_ALLOWED_HOSTS` - Allowed outbound hosts (default: `api.openai.com,github.com`)

### Feature Flags
- `MOBILE_MODE` - Restrict operations for mobile clients (default: `false`)
- `LAN_ONLY` - Restrict access to local network (default: `false`)
- `SAFE_MODE` - Disable all external API calls (default: `false`)

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
- **Allowed agent actions** are restricted to a whitelist of ~30 actions in `scripts/validate.js`
- **Circuit breaker pattern** for external API calls (`src/utils/circuitBreaker.js`): 5-failure threshold, 30s reset timeout, CLOSED/OPEN/HALF_OPEN states
- **Cache stampede prevention**: agent and knowledge services use in-flight promise tracking with 1-minute TTL
- **Multi-model routing**: `src/config/modelRouter.js` selects AI models based on task complexity
- **Registry validation gate**: server refuses to start if `agents/registry.yaml` validation fails (`src/server.js`)
- **Standard HTTP responses**: use `src/utils/httpResponses.js` for consistent response formatting

## Testing

The project uses validation-based testing. `npm test` runs `scripts/validate.js` which checks:

1. **Agent YAML validation**: `data/agents/index.json` exists and contains an `agents` array; each referenced YAML file exists and has an `id` field; agent actions are from the allowed set
2. **Registry validation** (if `agents/registry.yaml` exists): all agents have required governance fields (`id`, `risk`, `approval`, `startup`, `healthcheck`, `contexts.allowed`); `auto_start` must be `false`
3. **Orchestrator config validation** (if `.github/agents/orchestrator.config.json` exists): validates name, version, non-empty agents array; ensures `secrets.logging.logSecrets` is never `true`

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

## Deployment

- **Render.com** - Default deployment target (`render.yaml`)
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

### Active Agents (12)
Defined in `data/agents/index.json`: `my-agent`, `agent-auto`, `legal-agent`, `governance-agent`, `code-review-agent`, `security-agent`, `pr-merge-agent`, `integrity-agent`, `bsu-audit-agent`, `repository-review`, `ios-chat-integration-agent`, `governance-review-agent`

### Agent YAML Structure
Each agent YAML file requires:
- `id` - Unique agent identifier
- `name`, `role`, `version` - Agent metadata
- `modelProvider`, `modelKey`, `modelName` - AI model configuration
- `actions` - Array of allowed actions (from whitelist)
- `contexts.allowed` - Allowed execution modes
- `safety`, `risk`, `approval` - Governance fields

## GitHub Workflows

The project has 53 GitHub Actions workflows in `.github/workflows/` covering:
- **CI/CD**: `nodejs.yml`, `validate.yml`, `deploy.yml`, `unified-ci-deploy.yml`
- **Security**: `codeql-analysis.yml`, `secret-scanning.yml`
- **Agent operations**: `run-bsu-agents.yml`, `bsu-audit.yml`, `weekly-agents.yml`, `agent-guardian.yml`
- **PR management**: `pr-management.yml`, `pr-governance-check.yml`, `auto-merge.yml`, `close-stale-prs.yml`
- **Infrastructure**: `cf-deploy.yml`, `cf-purge-cache.yml`, `deploy-pages.yml`
- **ORBIT**: `orbit-actions.yml`, `orbit-telegram.yml`

## Lexprim Chat (Nuxt 3 Frontend)

A separate Nuxt 3 application in `lexprim-chat/` provides an alternative chat frontend:
- Vue 3 components: `ChatHeader`, `ChatInput`, `ChatMessage`, `ChatError`, `ChatLoading`, `ChatWelcome`
- Pinia state management (`stores/chat.js`)
- API composable (`composables/useApi.js`)
- Tailwind CSS styling
- See `lexprim-chat/DEPLOYMENT.md` for deployment instructions
