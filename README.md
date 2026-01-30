# LexBANK / BSM Platform

## Overview

The **LexBANK and BSM Platform** represent the next generation of intelligent infrastructure for knowledge management and legal services, powered by advanced AI technologies. Our platform combines cutting-edge artificial intelligence with robust legal and business service management capabilities to deliver unparalleled efficiency and accuracy.

## Project Structure

```
BSM/
├── data/                    # Data storage
│   ├── agents/             # Agent configurations (YAML)
│   └── knowledge/          # Knowledge documents
├── scripts/                # Build and validation scripts
├── src/
│   ├── admin/              # Admin UI (HTML/CSS/JS)
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

### Admin Endpoints (requires x-admin-token header)
- `GET /api/admin/agents` - Get agents configuration
- `GET /api/admin/knowledge` - Get knowledge documents
- `/admin` - Admin UI dashboard

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
- **Timing Attack Prevention**: Constant-time token comparison
- **Request Timeout**: 30-second timeout for external API calls
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