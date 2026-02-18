# دليل النشر الموحد (Unified Deployment Guide)

## نظرة عامة (Overview)

This guide covers the deployment of all components of the unified BSU/LexBANK platform.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    UNIFIED REPOSITORY                        │
│                   MOTEB1989/BSM (GitHub)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌───────────┐  ┌───────────┐  ┌───────────┐
        │ Frontend  │  │  Backend  │  │    MCP    │
        │  (Pages)  │  │ (Render)  │  │ (Copilot) │
        └───────────┘  └───────────┘  └───────────┘
              │              │              │
              ▼              ▼              ▼
        GitHub Pages   Render.com    GitHub Copilot
```

---

## Component 1: Frontend Deployment

### GitHub Pages Setup

**Location**: `frontend/` directory

**Steps**:

1. **Copy frontend to docs** (for GitHub Pages):
```bash
# Option 1: Copy to docs directory
cp -r frontend/* docs/

# Option 2: Configure GitHub Pages to serve from frontend/ directly
# (Requires GitHub Pages settings change)
```

2. **Configure GitHub Pages**:
   - Go to repository **Settings** → **Pages**
   - Source: Deploy from a branch
   - Branch: `main` or your default branch
   - Folder: `/docs` or `/frontend` (depending on your choice)
   - Save

3. **Custom Domain** (Optional):
   - Add CNAME file with your domain
   - Configure DNS settings

4. **Verify Deployment**:
```bash
# Check deployment status
curl -I https://moteb1989.github.io/BSM/frontend/
```

**Expected URL**: `https://moteb1989.github.io/BSM/frontend/`

### Alternative: Netlify Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy frontend
cd frontend
netlify deploy --prod --dir .
```

### Alternative: Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

---

## Component 2: Backend Deployment

### Render.com Setup

**Location**: Root directory (serves `src/`)

**Steps**:

1. **Connect Repository**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect GitHub account
   - Select `MOTEB1989/BSM` repository

2. **Configure Service**:
   - **Name**: `bsu-backend` (or your choice)
   - **Environment**: Node
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free or paid tier

3. **Environment Variables**:

Add these in Render dashboard (Settings → Environment):

```bash
# Core Settings
NODE_ENV=production
PORT=10000
LOG_LEVEL=info

# OpenAI (Required)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Anthropic Claude (Optional)
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini (Optional)
GOOGLE_API_KEY=...

# Perplexity (Optional)
PERPLEXITY_API_KEY=pplx-...

# Moonshot Kimi (Optional)
KIMI_API_KEY=...

# Security
ADMIN_TOKEN=your-secure-admin-token-min-16-chars
CORS_ORIGINS=https://moteb1989.github.io,https://yourdomain.com

# GitHub Integration (Optional)
GITHUB_BSU_TOKEN=ghp_...
GITHUB_REPO=MOTEB1989/BSM

# Features
MOBILE_MODE=false
LAN_ONLY=false
SAFE_MODE=false
```

4. **Deploy**:
   - Click "Create Web Service"
   - Wait for initial deployment
   - Check logs for any errors

5. **Verify Deployment**:
```bash
# Test health endpoint
curl https://your-service.onrender.com/health

# Test API
curl https://your-service.onrender.com/api/status
```

**Expected URL**: `https://sr-bsm.onrender.com` (or your chosen name)

### Alternative: Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

### Alternative: Heroku Deployment

```bash
# Login to Heroku
heroku login

# Create app
heroku create bsu-backend

# Add environment variables
heroku config:set NODE_ENV=production
heroku config:set OPENAI_API_KEY=sk-...
# ... add other variables

# Deploy
git push heroku main
```

---

## Component 3: MCP Server Setup

### GitHub Copilot Integration

**Location**: `mcp-servers/` directory

**Steps**:

1. **Install Dependencies**:
```bash
cd mcp-servers
npm install
```

2. **Configuration File**:

The MCP server is configured via `.github/copilot/mcp.json`:

```json
{
  "mcpServers": {
    "lexbank-unified": {
      "command": "node",
      "args": ["mcp-servers/bsu-agent-server.js"],
      "env": {
        "BSM_API_URL": "https://sr-bsm.onrender.com/api",
        "NODE_ENV": "production"
      }
    }
  }
}
```

3. **Test Locally**:
```bash
# Run MCP server
npm run mcp:start

# Server will listen on stdio
# Use an MCP client to test
```

4. **GitHub Copilot Usage**:

Once the repository is cloned and configured, Copilot will automatically detect the MCP server.

**Available Commands**:
```
@workspace /list_agents
@workspace /chat_gpt message="مرحبا" language="ar"
@workspace /chat_gemini message="Hello" language="en"
@workspace /get_key_status
```

5. **Troubleshooting**:
```bash
# Check MCP server logs
# They appear in GitHub Copilot console

# Verify configuration
cat .github/copilot/mcp.json

# Test dependencies
cd mcp-servers && npm test
```

---

## Component 4: Shared Configuration

### Update Configuration

**File**: `shared/config.js`

Update these values after deployment:

```javascript
const config = {
  urls: {
    // Update with your actual deployed URLs
    frontend: 'https://moteb1989.github.io/BSM/frontend',
    backend: 'https://your-service.onrender.com',
    repo: 'https://github.com/MOTEB1989/BSM'
  },
  // ... rest of config
};
```

**Important**: Commit and push changes after updating URLs.

---

## Post-Deployment Checklist

### Frontend Verification

- [ ] Frontend loads at `https://moteb1989.github.io/BSM/frontend/`
- [ ] Language toggle works (Arabic ↔ English)
- [ ] All 5 agent buttons are visible
- [ ] Selecting an agent opens chat interface
- [ ] PWA manifest loads correctly
- [ ] No console errors

### Backend Verification

- [ ] Health endpoint responds: `GET /health`
- [ ] Status endpoint shows capabilities: `GET /api/status`
- [ ] Key status endpoint works: `GET /api/chat/key-status`
- [ ] Direct chat works: `POST /api/chat/direct`
- [ ] Agent endpoints work: `POST /api/chat/gemini`, etc.
- [ ] CORS allows frontend origin
- [ ] Rate limiting is active
- [ ] Logs are structured and readable

### MCP Verification

- [ ] MCP server starts without errors
- [ ] Configuration file is valid JSON
- [ ] Dependencies are installed
- [ ] GitHub Copilot detects the server
- [ ] Tools are listed in Copilot
- [ ] Resources are accessible
- [ ] API calls work through MCP

### Integration Testing

```bash
# Test frontend → backend communication
# From browser console on frontend:
fetch('https://sr-bsm.onrender.com/api/chat/key-status')
  .then(r => r.json())
  .then(console.log)

# Test MCP → backend communication
# From GitHub Copilot:
@workspace /get_key_status
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Automated health check
npm run health:detailed

# Response should include:
# - uptime
# - memory usage
# - filesystem access
# - registry validation
# - environment variables
# - circuit breaker status
```

### Logging

**Backend Logs (Render)**:
- Go to your service dashboard
- Click "Logs" tab
- Filter by severity: info, warn, error

**Frontend Logs**:
- Open browser console
- Check for errors or warnings

**MCP Logs**:
- Available in GitHub Copilot console
- Check stderr output

### Performance Monitoring

```bash
# Check response times
time curl https://sr-bsm.onrender.com/api/status

# Check memory usage
npm run health:detailed | grep memory
```

---

## Scaling & Optimization

### Frontend Optimization

1. **Enable Caching**:
   - Add cache headers in GitHub Pages
   - Use CDN for static assets

2. **Minimize Bundle Size**:
   - Already using CDN for dependencies
   - Optimize images in `assets/`

3. **Progressive Web App**:
   - Service worker for offline support
   - Cache API responses

### Backend Optimization

1. **Horizontal Scaling** (Render):
   - Upgrade to paid plan
   - Enable auto-scaling

2. **Database** (if needed):
   - Add PostgreSQL or MySQL
   - Enable connection pooling

3. **Caching**:
   - Add Redis for response caching
   - Cache agent definitions

4. **Load Balancing**:
   - Multiple instances behind load balancer
   - Session persistence

### MCP Optimization

1. **Response Caching**:
   - Cache frequent requests
   - Use in-memory cache

2. **Connection Pooling**:
   - Reuse HTTP connections
   - Reduce API call overhead

---

## Troubleshooting

### Frontend Issues

**Problem**: Frontend doesn't load
```bash
# Check GitHub Pages status
gh api repos/MOTEB1989/BSM/pages

# Verify files are committed
git ls-files frontend/
```

**Problem**: API calls fail (CORS errors)
- Verify `CORS_ORIGINS` includes frontend URL
- Check backend logs for CORS rejections
- Update `shared/config.js` with correct URLs

### Backend Issues

**Problem**: Server won't start
```bash
# Check logs in Render dashboard
# Common issues:
# - Missing environment variables
# - Port binding issues
# - Dependency installation failures

# Verify locally first
npm install
npm start
```

**Problem**: API returns 503
- Check circuit breaker status
- Verify AI provider API keys
- Check rate limits

### MCP Issues

**Problem**: Copilot doesn't detect server
- Verify `.github/copilot/mcp.json` is valid
- Check file is committed to repository
- Restart VS Code or IDE

**Problem**: Tools don't work
- Check MCP server logs
- Verify backend URL in config
- Test backend API directly

---

## Backup & Recovery

### Backup Strategy

1. **Code**: Always backed up in GitHub
2. **Configuration**: In `shared/config.js` (versioned)
3. **Data**: Agent definitions in `data/agents/` (versioned)
4. **Environment Variables**: Document in `.env.example`

### Recovery Procedure

```bash
# 1. Clone repository
git clone https://github.com/MOTEB1989/BSM.git
cd BSM

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Test locally
npm run dev

# 5. Re-deploy
# Follow deployment steps for each component
```

---

## Security Checklist

- [ ] All environment variables set correctly
- [ ] `ADMIN_TOKEN` is strong (16+ chars)
- [ ] HTTPS enabled for all endpoints
- [ ] CORS configured with specific origins
- [ ] Rate limiting active
- [ ] No API keys in frontend code
- [ ] CSP headers configured
- [ ] Helmet.js enabled
- [ ] Regular dependency updates
- [ ] Security scanning enabled (CodeQL, Dependabot)

---

## Support & Resources

### Documentation
- [Unified Repository Strategy](./UNIFIED-REPOSITORY-STRATEGY.md)
- [Frontend README](../frontend/README.md)
- [MCP Server README](../mcp-servers/README.md)
- [Main README](../README.md)

### Community
- [GitHub Issues](https://github.com/MOTEB1989/BSM/issues)
- [GitHub Discussions](https://github.com/MOTEB1989/BSM/discussions)

### External Resources
- [Render Documentation](https://render.com/docs)
- [GitHub Pages Guide](https://docs.github.com/pages)
- [MCP Protocol Spec](https://modelcontextprotocol.io)

---

## Version History

- **2.0.0** (Feb 2026): Unified repository strategy
- **1.0.0**: Initial release

---

**Last Updated**: February 2026
