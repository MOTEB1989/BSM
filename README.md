# LexBANK / BSU Platform

> 📱 **Looking for Telegram community?** See [Community & Support](#community--support) section below or [docs/COMMUNITY.md](docs/COMMUNITY.md)

## Overview

The **LexBANK and BSU Platform** represent the next generation of intelligent infrastructure for knowledge management and legal services, powered by advanced AI technologies. Our platform combines cutting-edge artificial intelligence with robust legal and business service management capabilities to deliver unparalleled efficiency and accuracy.

### 🆕 Hybrid Node.js/Go Architecture

The platform now features a **hybrid microservices architecture** combining:
- **Node.js** for API gateway, AI integration, and rapid development
- **Go** for high-performance document processing, search, and analytics

**Benefits**: 10-100x performance improvement, 60% cost reduction, better scalability

📖 See [Go Integration Architecture](docs/GO-INTEGRATION-ARCHITECTURE.md) for details.

## Project Structure

```
BSU/
├── data/                    # Data storage
│   ├── agents/             # Agent configurations (YAML)
│   └── knowledge/          # Knowledge documents
├── dns/                    # DNS configuration and documentation
│   ├── lexdo-uk-zone.txt   # Cloudflare DNS zone file
│   ├── DNS-RECORD-TYPES.md # DNS record types reference
│   └── GITHUB-PAGES-VERIFICATION.md # GitHub Pages verification guide
├── docs/                   # Documentation and GitHub Pages frontend
│   ├── index.html          # Standalone chat interface
│   ├── app.js              # Vue 3 chat application
│   ├── styles.css          # Custom styles
│   ├── CNAME               # Domain configuration
│   ├── ARCHITECTURE.md     # System architecture documentation
│   ├── CICD-RECOMMENDATIONS.md # CI/CD enhancement guide
│   ├── SECURITY-DEPLOYMENT.md  # Security and deployment guide
│   └── AGENT-ORCHESTRATION.md  # Agent patterns and workflows
├── scripts/                # Build and validation scripts
│   ├── validate.js         # Data structure validation
│   └── setup_github_pages_verification.sh # GitHub Pages DNS setup
├── src/
│   ├── admin/              # Admin UI (HTML/CSS/JS)
│   ├── chat/               # Chat UI (Vue 3 + Tailwind)
│   ├── config/             # Configuration modules
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── routes/             # API route definitions
│   ├── runners/            # Agent execution logic
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   ├── app.js              # Express app setup
│   └── server.js           # Server entry point
└── .github/workflows/      # CI/CD workflows
```

## API Endpoints

### Health & Status Endpoints
- `GET /health` - Basic health check
- `GET /api/health` - API health check
- `GET /api/health/detailed` - Comprehensive health check with system validation
- `GET /api/status` - System status with features and capabilities

### Public Endpoints
- `GET /api/agents` - List all available agents
- `GET /api/knowledge` - List all knowledge documents
- `POST /api/agents/run` - Execute an agent with input
- `POST /api/chat` - Agent-based chat (requires `agentId` and `input`)
- `POST /api/chat/direct` - Direct GPT chat with conversation history

### Webhook Endpoints
- `POST /webhook/github` - GitHub webhook endpoint (primary)
- `POST /api/webhooks/github` - GitHub webhook endpoint (alternative)
- `POST /api/webhooks/telegram` - Telegram bot webhook

📖 See [GitHub Webhook Setup Guide](docs/GITHUB-WEBHOOK-SETUP.md) for configuration details.

### Chat Interface
- `/chat` - Professional Arabic/English GPT chat interface (Vue 3 + Tailwind)

### Admin Endpoints (requires x-admin-token header)
- `GET /api/admin/agents` - Get agents configuration
- `GET /api/admin/knowledge` - Get knowledge documents
- `/admin` - Admin UI dashboard (requires admin token via Basic Auth, `x-admin-token`, or `?token=...`)

### Standalone Frontend (GitHub Pages)
- Hosted at `https://www.lexdo.uk` or `https://lexprim.com` via GitHub Pages
- Connects to the API backend (configurable URL)
- Same chat interface with API URL configuration
- Automated DNS verification setup available (see `dns/GITHUB-PAGES-VERIFICATION.md`)
- **New:** Full deployment guide for lexprim.com available at [docs/LEXPRIM-DEPLOYMENT.md](docs/LEXPRIM-DEPLOYMENT.md)

## DNS Management

The platform includes automated DNS management tools for Cloudflare:

### GitHub Pages Domain Verification

Automate GitHub Pages custom domain verification:

```bash
# Automated setup with Cloudflare API
./scripts/setup_github_pages_verification.sh <CLOUDFLARE_API_TOKEN> <GITHUB_CHALLENGE_VALUE>
```

See [DNS Documentation](dns/GITHUB-PAGES-VERIFICATION.md) for detailed instructions.

## Getting Started

### Prerequisites
- Node.js 22+
- npm or equivalent package manager

## Governance & Quality Process

BSM enforces **governance-grade quality standards** for all code changes. Our comprehensive governance framework ensures security, compliance, and quality.

### 📋 PR Review Checklist

All pull requests must pass the BSM Governance Checklist covering:

1. **🧭 Scope & Process** - Issue linking, milestone, acceptance criteria
2. **🏛️ Governance & Ownership** - Risk assessment, approval rules, ownership
3. **🔐 Security** - No wildcards, deny-by-default network, secrets management
4. **📱 Mobile Constraints** - Mobile mode restrictions, no destructive actions
5. **⚙️ Runtime Safety** - Agent behavior, startup safety, emergency controls
6. **🧾 Audit & Logging** - Comprehensive audit trails, no sensitive data
7. **🧪 Quality** - Tests, linting, code quality, breaking changes
8. **📄 Documentation** - Traceability, required docs updated
9. **⚠️ Red Flags** - Bypass detection, verifiability checks

### Running Governance Checks

```bash
# Run comprehensive PR governance validation
npm run pr-check

# Verbose output
npm run pr-check:verbose

# Run agent validation
npm run validate
```

### Key Documentation

- **[GOVERNANCE.md](./GOVERNANCE.md)** - Governance policies and approval rules
- **[SECURITY.md](./SECURITY.md)** - Security policies and requirements
- **[MOBILE_MODE.md](./MOBILE_MODE.md)** - Mobile mode restrictions
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System architecture

### Automated Governance

The platform includes automated governance checks via GitHub Actions:

- ✅ **PR Governance Check** - Validates all checklist items automatically
- 🔐 **Security Scans** - Gitleaks, wildcard detection, admin auth checks
- 📄 **Documentation Compliance** - Ensures docs are updated
- 🏷️ **Risk Labeling** - Automatic PR labeling based on risk level

See `.github/workflows/pr-governance-check.yml` for implementation.

### Installation

#### Quick Start (Automated)

**Recommended**: Use our automated bootstrap scripts for easy setup:

**Linux/macOS:**
```bash
git clone https://github.com/LexBANK/BSM.git
cd BSM
./scripts/bootstrap.sh
```

**Windows:**
```powershell
git clone https://github.com/LexBANK/BSM.git
cd BSM
.\scripts\bootstrap.ps1
```

The bootstrap script automatically:
- Installs Node.js 18+ (if needed)
- Creates `.env` from template
- Installs dependencies
- Validates configuration
- Optionally starts dev server

📖 See [BOOTSTRAP.md](./BOOTSTRAP.md) for detailed instructions and troubleshooting.

#### Manual Installation

```bash
# Clone the repository
git clone https://github.com/LexBANK/BSM.git

# Navigate to the project directory
cd BSM

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
```

### ORBIT Self-Healing Agent Setup

Set up automated monitoring, health checks, and self-healing capabilities:

```bash
# Quick setup (10 minutes)
./scripts/bootstrap-orbit.sh
```

**Features:**
- 🤖 Automated GitHub Actions integration
- 📱 Telegram bot command interface  
- 🔧 Self-healing workflow monitoring
- 🔐 Secure secrets management
- ☁️ Cloudflare Workers deployment

**Documentation:**
- [Quick Setup Guide](docs/ORBIT-QUICK-SETUP.md) - Get started in 10 minutes
- [Full Bootstrap Guide](docs/ORBIT-BOOTSTRAP-GUIDE.md) - Detailed setup instructions
- [Secrets Management](docs/ORBIT-SECRETS-MANAGEMENT.md) - Security best practices

### Configuration

Create a `.env` file with the following variables:

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# OpenAI / model providers
# Provide ONE of: OPENAI_BSM_KEY, OPENAI_BSU_KEY, or OPENAI_API_KEY
# Priority: OPENAI_BSM_KEY > OPENAI_BSU_KEY > OPENAI_API_KEY
OPENAI_BSU_KEY=your_key_here
OPENAI_BSM_KEY=your_key_here
OPENAI_API_KEY=your_key_here
OPENAI_BRINDER_KEY=your_key_here
OPENAI_LEXNEXUS_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini

# Admin (use strong token in production)
ADMIN_TOKEN=change-me-to-strong-token

# CORS (comma-separated origins, optional)
CORS_ORIGINS=https://example.com,https://admin.example.com

# Rate limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Agent input limits (optional)
MAX_AGENT_INPUT_LENGTH=4000
```

### Running the Application

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Validate data structure
npm run validate

# Health checks
npm run health              # Quick health check
npm run health:detailed     # Comprehensive health check with integrity report
```

For detailed health check documentation, see [docs/HEALTH-CHECK.md](docs/HEALTH-CHECK.md).

### Docker Deployment

The platform supports multiple Docker deployment configurations:

#### MySQL Multi-Container Setup
Following [Microsoft's Docker Multi-Container Tutorial](https://learn.microsoft.com/en-us/visualstudio/docker/tutorials/tutorial-multi-container-app-mysql):

```bash
# Start with MySQL database
docker-compose -f docker-compose.mysql.yml up -d

# View logs
docker-compose -f docker-compose.mysql.yml logs -f

# Stop services
docker-compose -f docker-compose.mysql.yml down
```

📖 See [docs/MYSQL-MULTI-CONTAINER.md](docs/MYSQL-MULTI-CONTAINER.md) for complete setup guide.

#### PostgreSQL Setup
```bash
# Start with PostgreSQL database
docker-compose -f docker-compose.yml.example up -d
```

#### Hybrid Node.js/Go Architecture
```bash
# Start with PostgreSQL, Redis, and Go services
docker-compose -f docker-compose.hybrid.yml up -d
```

**Available Configurations:**
- `docker-compose.mysql.yml` - MySQL 8.0 + Redis + Node.js app
- `docker-compose.yml.example` - PostgreSQL 16 + Redis + Node.js app
- `docker-compose.hybrid.yml` - Full hybrid stack with Go services
- `Dockerfile.example` - Multi-stage production build

## GitHub Copilot Pro Integration

After upgrading our subscription to **GitHub Copilot Pro**, the platform now leverages advanced AI-powered development capabilities:

- **Automated Code Generation**: GitHub Copilot Pro assists in generating high-quality code, reducing development time and human errors
- **Intelligent Request Analysis**: Automatic analysis and processing of requests using AI-driven insights
- **Enhanced Productivity**: Accelerated development cycles through intelligent code suggestions and completions
- **Error Reduction**: AI-assisted code review and validation to minimize bugs and security vulnerabilities
- **Context-Aware Assistance**: Smart code completions that understand the entire codebase context

## Platform Features

### Knowledge Management
- Intelligent document processing and categorization
- Advanced search and retrieval capabilities
- AI-powered content recommendations
- Version control and audit trails

### Legal Services
- Automated legal document analysis
- Contract review and risk assessment
- Compliance monitoring and reporting
- Case management and tracking

### AI-Powered Capabilities
- Natural language processing for document understanding
- Machine learning models for predictive analytics
- Automated workflow optimization
- Intelligent decision support systems

## Security Features

- **Input Validation**: All API endpoints validate input parameters
- **Request Size Limiting**: Body parser limited to 1MB to prevent memory exhaustion
- **Authentication**: Admin endpoints protected with token-based authentication
- **Admin UI Protection**: Admin UI requires a valid admin token
- **Timing Attack Prevention**: Constant-time token comparison
- **Request Timeout**: 30-second timeout for external API calls
- **Rate Limiting**: API endpoints throttled to prevent abuse
- **Security Headers**: Helmet-enabled defaults for common protections
- **Environment Validation**: Production mode requires secure admin token (16+ characters)
- **CORS Protection**: Configurable cross-origin resource sharing
- **CodeQL Analysis**: Automated security scanning via GitHub Actions

## Development Workflow

With GitHub Copilot Pro integration, our development workflow includes:

1. **AI-Assisted Coding**: Use Copilot suggestions for rapid development
2. **Automated Testing**: AI-generated test cases and scenarios
3. **Code Review**: Intelligent code analysis and recommendations
4. **Documentation**: Automated documentation generation
5. **Continuous Integration**: Automated build and deployment pipelines

## CI/CD

The project includes GitHub Actions workflows:

- **Validate**: Runs on every PR and push to main, validates data structure
- **CodeQL**: Security analysis for JavaScript code
- **Pages**: Deploys `docs/` to GitHub Pages on push to main

## Benefits

✅ **Accelerated Development**: Faster feature delivery with AI-assisted coding  
✅ **Reduced Errors**: Fewer bugs and issues through intelligent code analysis  
✅ **Improved Quality**: Higher code quality with consistent patterns and best practices  
✅ **Enhanced Collaboration**: Better team productivity with shared AI insights  
✅ **Cost Efficiency**: Reduced development and maintenance costs  

## Technology Stack

- **Backend**: Node.js, Express.js
- **AI/ML**: OpenAI GPT models, advanced NLP
- **Development**: GitHub Copilot Pro for intelligent code generation
- **Infrastructure**: Scalable cloud-based architecture (Render.com ready)
- **Security**: Enterprise-grade security and compliance measures
- **Logging**: Pino logger with pretty printing in development

## Documentation

### Community & Support
- [Community Channels](docs/COMMUNITY.md) - Telegram, GitHub, and support resources
- [GOVERNANCE.md](./GOVERNANCE.md) - Governance policies and approval rules
- [SECURITY.md](./SECURITY.md) - Security policies and requirements
- [MOBILE_MODE.md](./MOBILE_MODE.md) - Mobile mode restrictions

### Architecture and Design
- [System Architecture](docs/ARCHITECTURE.md) - Comprehensive architectural overview
- [Agent Orchestration Patterns](docs/AGENT-ORCHESTRATION.md) - Multi-agent design patterns and workflows
- [CI/CD Recommendations](docs/CICD-RECOMMENDATIONS.md) - Pipeline enhancements and automation strategies
- [Security & Deployment Guide](docs/SECURITY-DEPLOYMENT.md) - Security best practices and deployment procedures
- [Documentation Deployment Policy](docs/DOCS-DEPLOYMENT.md) - Official docs CI/CD, build source, and versioning policy

### API Documentation
- API endpoints documented above
- OpenAPI/Swagger specification (coming soon)

### DNS and Infrastructure
- [DNS Record Types](dns/DNS-RECORD-TYPES.md) - Cloudflare DNS configuration
- [GitHub Pages Verification](dns/GITHUB-PAGES-VERIFICATION.md) - Custom domain setup
- [Cloudflare API Names (Arabic)](docs/CLOUDFLARE-API-NAMES.md) - Complete Cloudflare API reference
- [Cloudflare Quick Reference (Arabic)](docs/CLOUDFLARE-QUICK-REFERENCE-AR.md) - Quick guide to Cloudflare API variables

## Contributing

Contributions are welcome! Please ensure that:
- Code follows the project's style guidelines
- All tests pass successfully (`npm run validate`)
- Documentation is updated accordingly
- GitHub Copilot suggestions are reviewed for quality
- Security best practices are followed

## License

Copyright © 2026 LexBANK. All rights reserved.

## Community & Support

### 📱 Join Our Telegram Community

We maintain active Telegram channels for community support and announcements:

- **🤖 LexFix Support Bot** - Get instant help and support
  - **Link**: https://t.me/LexFixBot
  - Ask questions, get troubleshooting help, and community support
  - Available 24/7 for assistance

- **📢 Official Announcements Channel** - For project updates, releases, and official announcements
  - *Coming soon - Will be announced when available*
  
- **💬 Community Support Group** - For questions, discussions, and community help
  - *Coming soon - Will be announced when available*

- **🤖 ORBIT Admin Bot** - Private bot for repository management (admins only)
  - For administrators: See [ORBIT Quick Setup Guide](docs/ORBIT-QUICK-SETUP.md)
  - Not for general community support

### 🐛 Report Issues

For bug reports and feature requests, please use:
- **GitHub Issues**: https://github.com/LexBANK/BSM/issues

### 📚 Documentation

- **Main Documentation**: [docs/](./docs/)
- **Architecture Guide**: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **Security Guide**: [SECURITY.md](./SECURITY.md)
- **Governance**: [GOVERNANCE.md](./GOVERNANCE.md)

### 📧 Contact

For business inquiries or partnership opportunities, please contact the LexBANK team through our official channels.

---

*Powered by GitHub Copilot Pro - Accelerating innovation through AI-driven development*
