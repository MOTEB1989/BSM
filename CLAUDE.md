# CLAUDE.md

## Project Overview

BSU (Business Service Management) is a Node.js/Express.js multi-agent AI platform for legal services and knowledge management. It integrates with OpenAI GPT-4o-mini, serves a Vue 3 chat frontend, and provides agent orchestration via YAML-configured agents.

- **Language:** JavaScript (ES Modules)
- **Runtime:** Node.js 22+
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

# Run validation/tests (validates agent YAML configs in data/agents/)
npm test
# or equivalently:
npm run validate
```

## Architecture

```
src/
  server.js          # Server entry point (listens on PORT, default 3000)
  app.js             # Express app setup (CORS, Helmet, rate limiting, middleware)
  routes/            # API route definitions
  controllers/       # Request handlers
  services/          # Business logic (agents, knowledge, GPT, orchestrator)
  middleware/        # Express middleware (auth, logging, correlation, errors)
  runners/           # Agent execution logic
  config/            # Environment and model configuration
  database/          # Optional database connection helpers (MySQL)
  chat/              # Vue 3 + Tailwind chat UI
  admin/             # Admin dashboard UI
data/
  agents/            # YAML agent definitions + index.json
  knowledge/         # Knowledge base documents
scripts/             # Build and automation scripts
  mysql/             # MySQL initialization scripts
docs/                # Documentation and GitHub Pages frontend (lexdo.uk)
```

## Key API Endpoints

- `GET /api/health` - Health check
- `GET /api/agents` - List agents
- `POST /api/agents/run` - Execute an agent
- `POST /api/chat` - Agent-based chat
- `POST /api/chat/direct` - Direct GPT chat with history
- `GET /api/knowledge` - Knowledge documents
- Admin routes require `x-admin-token` header

## Environment Variables

See `.env.example` for the full list. Key variables:
- `PORT` - Server port (default: 3000)
- `OPENAI_BSU_KEY` - OpenAI API key
- `ADMIN_TOKEN` - Admin authentication token (16+ chars in production)
- `CORS_ORIGINS` - Allowed CORS origins
- `NODE_ENV` - Environment (development/production)

## Code Conventions

- ES Modules (`import`/`export`, `"type": "module"` in package.json)
- Pino for structured JSON logging
- Express middleware pattern: correlation IDs, request logging, auth, error handling
- Agent definitions are YAML files in `data/agents/` referenced by `data/agents/index.json`
- Allowed agent actions are restricted to a whitelist (currently: `create_file`)

## Testing

The project uses validation-based testing. `npm test` runs `scripts/validate.js` which checks:
- `data/agents/index.json` exists and contains an `agents` array
- Each referenced agent YAML file exists and has an `id` field
- Agent actions are from the allowed set

CI runs this validation on every PR and push to main (`.github/workflows/validate.yml`).

## Security

- Helmet for HTTP security headers
- CORS with configurable origins
- Rate limiting on `/api` routes (100 req / 15 min default)
- Timing-safe token comparison for admin auth
- 1MB request body limit
- Gitleaks secret scanning (`.gitleaks.toml`)
- CodeQL analysis via GitHub Actions

## Deployment

- **Render.com** - Default deployment target (`render.yaml`)
- **Docker** - Multi-stage build available (`Dockerfile.example`)
- **Docker Compose** - Multi-container setups:
  - `docker-compose.mysql.yml` - MySQL 8.0 + Redis + Node.js
  - `docker-compose.yml.example` - PostgreSQL 16 + Redis + Node.js
  - `docker-compose.hybrid.yml` - Full stack with Go services
- **GitHub Pages** - Frontend hosted at lexdo.uk (`docs/` directory)

## Database Support (Optional)

BSM includes optional database integration:
- MySQL connection helper in `src/database/mysql.js`
- Database initialization scripts in `scripts/mysql/`
- See `docs/MYSQL-MULTI-CONTAINER.md` for setup guide
- Requires `mysql2` package: `npm install mysql2`
