# GitHub Actions Workflows - Quick Reference

> **Last Updated**: 2026-02-12  
> **Status**: ✅ All workflows properly configured for Node.js/Express project

## Overview

BSM is a **Node.js/Express** project deployed to **Render.com**. All GitHub Actions workflows have been updated to match this technology stack.

## Changes Made (2026-02-12)

### ❌ Removed (Incorrect for Node.js project)
- `python-package-conda.yml` - Python/Conda workflow
- `docker-image.yml` - Basic Docker build
- `docker-publish.yml` - GitHub Container Registry publishing

### ✅ Added/Updated
- `nodejs.yml` - **NEW** Standard Node.js CI
- `codeql-analysis.yml` - **UPDATED** JavaScript security scanning

---

## Current Workflows

### 🔧 Core CI/CD

#### 1. Node.js CI (`nodejs.yml`)
**Purpose**: Standard Node.js continuous integration testing  
**Triggers**: Push to main/develop, PRs to main  
**Node Versions**: 18.x, 20.x, 22.x (matrix)

**Steps**:
```bash
npm ci                           # Install dependencies
npm run lint --if-present        # Lint code (if configured)
npm test                         # Run tests
npm run build --if-present       # Build project (if configured)
npm run validate                 # Validate agents data
```

**When to use**: Every code change should pass this workflow

---

#### 2. Validate (`validate.yml`)
**Purpose**: Quick validation of agent configurations  
**Triggers**: Push to main, PRs  
**Node Version**: 22

**Steps**:
```bash
npm ci
npm run validate
```

**When to use**: Automatically runs on all PRs

---

#### 3. CI/Deploy to Render (`ci-deploy-render.yml`)
**Purpose**: Test AI agents and deploy to Render.com  
**Triggers**: Push to main, PRs, manual  
**Phases**: Test → Build → Deploy → Notify

**When to use**: Production deployments to Render.com

---

#### 4. Unified CI/Deploy (`unified-ci-deploy.yml`)
**Purpose**: Comprehensive multi-phase CI/CD  
**Triggers**: Push to main, PRs, manual  
**Phases**: Preflight → Test Agents → Build → Deploy → Smoke Test → Notify

**When to use**: Full end-to-end validation and deployment

---

### 🔒 Security

#### 5. CodeQL Analysis (`codeql-analysis.yml`)
**Purpose**: JavaScript/TypeScript security scanning  
**Triggers**: Push to main, PRs, weekly (Sundays)  
**Language**: JavaScript  
**Version**: CodeQL v3

**Steps**:
- Initialize CodeQL for JavaScript
- Autobuild the project
- Perform security analysis

**When to use**: Automatically runs on PRs and weekly

---

#### 6. Secret Scanning (`secret-scanning.yml`)
**Purpose**: Detect exposed secrets in code  
**Triggers**: Various

**When to use**: Automatic

---

### 📄 Deployment

#### 7. GitHub Pages (`pages.yml`, `static.yml`)
**Purpose**: Deploy documentation to GitHub Pages  
**Source**: `docs/` directory  
**URL**: https://lexdo.uk or GitHub Pages URL

---

### 🤖 AI Agents

#### 8. Run BSU Agents (`run-bsu-agents.yml`)
**Purpose**: Execute orchestrator agents  
**Agents**: Architect, Runner, Security

---

### 🛠️ Utilities
- `agent-guardian.yml` - Agent health monitoring
- `ai-agent-guardian.yml` - AI agent checks
- `auto-merge.yml` - Automated PR merging
- `cleanup.yml` - Repository cleanup
- `preflight-check.yml` - Pre-deployment checks
- And more...

---

## Deployment Targets

### Primary: Render.com
- **Service Type**: Web Service
- **Trigger**: Push to `main` branch
- **Config**: `render.yaml`
- **URL**: https://corehub.nexus

### Secondary: GitHub Pages
- **Content**: Documentation (`docs/`)
- **Trigger**: Push to `main` branch
- **URL**: https://lexdo.uk

### Optional: Docker
- **Configs**:
  - `docker-compose.mysql.yml` - MySQL setup
  - `docker-compose.yml.example` - PostgreSQL setup
  - `docker-compose.hybrid.yml` - Multi-service setup
- **Note**: No CI/CD workflows for Docker (manual deployment)

---

## Common Tasks

### Run Tests Locally
```bash
npm ci
npm test
```

### Run Full Validation
```bash
npm run validate
npm run health
npm run pr-check
```

### Check Workflow Status
1. Go to repository on GitHub
2. Click "Actions" tab
3. View workflow runs

### Trigger Manual Workflow
1. Go to "Actions" tab
2. Select workflow (e.g., "Unified CI/Deploy")
3. Click "Run workflow"
4. Choose branch
5. Click "Run workflow" button

---

## Troubleshooting

### Workflow Fails on `npm ci`
- Check `package.json` and `package-lock.json` are committed
- Ensure Node.js version is supported (18.x, 20.x, 22.x)

### Workflow Fails on `npm test`
- Run locally: `npm test`
- Check agent YAML files in `data/agents/`
- Verify `agents/registry.yaml` is valid

### CodeQL Fails
- Usually auto-fixes on next run
- Check JavaScript syntax errors
- Review CodeQL logs in workflow run

### Render Deployment Fails
- Check Render dashboard for logs
- Verify environment variables in Render settings
- Check `render.yaml` configuration

---

## Security Best Practices

✅ **GITHUB_TOKEN Permissions**: All workflows use minimal permissions (`contents: read`)  
✅ **Secret Management**: Use GitHub Secrets, never hardcode  
✅ **CodeQL**: Runs weekly + on all PRs  
✅ **Secret Scanning**: Automatically enabled  
✅ **Dependency Auditing**: `npm audit` in CI

---

## Next Steps

- [ ] Add performance testing workflow
- [ ] Add load testing workflow
- [ ] Implement staging environment
- [ ] Add rollback automation
- [ ] Add deployment previews for PRs

---

## Questions?

- **CI/CD Issues**: Check `.github/workflows/` files
- **Deployment Issues**: Check Render dashboard
- **Security Issues**: Check CodeQL results
- **Documentation**: See `docs/CICD-RECOMMENDATIONS.md`
