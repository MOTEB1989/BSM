# LexBANK / BSM Platform

## Overview

The **LexBANK and BSM Platform** represent the next generation of intelligent infrastructure for knowledge management and legal services, powered by advanced AI technologies. Our platform combines cutting-edge artificial intelligence with robust legal and business service management capabilities to deliver unparalleled efficiency and accuracy.

## Project Structure

```
BSM/
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

### Public Endpoints
- `GET /api/health` - Health check endpoint
- `GET /api/agents` - List all available agents
- `GET /api/knowledge` - List all knowledge documents
- `POST /api/agents/run` - Execute an agent with input
- `POST /api/chat` - Agent-based chat (requires `agentId` and `input`)
- `POST /api/chat/direct` - Direct GPT chat with conversation history

### Chat Interface
- `/chat` - Professional Arabic/English GPT chat interface (Vue 3 + Tailwind)

### Admin Endpoints (requires x-admin-token header)
- `GET /api/admin/agents` - Get agents configuration
- `GET /api/admin/knowledge` - Get knowledge documents
- `/admin` - Admin UI dashboard (requires admin token via Basic Auth, `x-admin-token`, or `?token=...`)

### Standalone Frontend (GitHub Pages)
- Hosted at `https://www.lexdo.uk` via GitHub Pages
- Connects to the API backend (configurable URL)
- Same chat interface with API URL configuration
- Automated DNS verification setup available (see `dns/GITHUB-PAGES-VERIFICATION.md`)

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

### Installation

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

### Configuration

Create a `.env` file with the following variables:

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# OpenAI / model providers
OPENAI_BSM_KEY=your_key_here
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
```

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

### Architecture and Design
- [System Architecture](docs/ARCHITECTURE.md) - Comprehensive architectural overview
- [Agent Orchestration Patterns](docs/AGENT-ORCHESTRATION.md) - Multi-agent design patterns and workflows
- [CI/CD Recommendations](docs/CICD-RECOMMENDATIONS.md) - Pipeline enhancements and automation strategies
- [Security & Deployment Guide](docs/SECURITY-DEPLOYMENT.md) - Security best practices and deployment procedures

### API Documentation
- API endpoints documented above
- OpenAPI/Swagger specification (coming soon)

### DNS and Infrastructure
- [DNS Record Types](dns/DNS-RECORD-TYPES.md) - Cloudflare DNS configuration
- [GitHub Pages Verification](dns/GITHUB-PAGES-VERIFICATION.md) - Custom domain setup

## Contributing

Contributions are welcome! Please ensure that:
- Code follows the project's style guidelines
- All tests pass successfully (`npm run validate`)
- Documentation is updated accordingly
- GitHub Copilot suggestions are reviewed for quality
- Security best practices are followed

## License

Copyright © 2026 LexBANK. All rights reserved.

## Support

For questions, issues, or support requests, please contact the LexBANK development team.

---

*Powered by GitHub Copilot Pro - Accelerating innovation through AI-driven development*
