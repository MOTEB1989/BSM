# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the BSM project. Each workflow serves a specific purpose in the CI/CD pipeline.

## Core Workflows

### Required Secrets

The following repository secrets must be configured in **Settings → Secrets and variables → Actions**:

#### Required (Core Functionality)
- `OPENAI_API_KEY` or `OPENAI_BSM_KEY` - OpenAI API key for AI services
- `ADMIN_TOKEN` - Admin authentication token (min 16 characters)

#### Optional (Enhanced Features)
- `ANTHROPIC_API_KEY` - For Claude Assistant workflow (auto-skips if not configured)
- `OPENAI_BRINDER_KEY` - Optional Brinder service integration
- `OPENAI_LEXNEXUS_KEY` - Optional LexNexus service integration
- `PERPLEXITY_KEY` - For Perplexity AI integration
- `GOOGLE_AI_KEY` - For Google AI services
- `RENDER_API_KEY` - For Render.com deployment
- `RENDER_SERVICE_ID` - Render service identifier
- `CF_API_TOKEN` - Cloudflare API token
- `CF_ACCOUNT_ID` - Cloudflare account ID
- `CF_PROJECT_NAME` - Cloudflare project name
- `CF_ZONE_ID` - Cloudflare zone ID
- `SNYK_TOKEN` - For security scanning

## Workflow Descriptions

### CI/CD Workflows

#### `nodejs.yml` - Node.js CI
Tests the application across multiple Node.js versions (18, 20, 22).
- **Triggers:** Push to main/develop, pull requests to main
- **Actions:** Install dependencies, lint, test, build, validate

#### `validate.yml` - Agent Validation
Validates agent configurations in `data/agents/`.
- **Triggers:** Push, pull requests
- **Actions:** Validates YAML syntax and agent definitions

#### `ci-deploy-render.yml` - Render Deployment
Deploys to Render.com on successful builds.
- **Triggers:** Push to main
- **Secrets:** `OPENAI_BSM_KEY`

### AI Assistance Workflows

#### `claude-assistant.yml` - Claude Assistant
Provides AI-powered assistance for issues and PRs using Anthropic's Claude.
- **Triggers:** Issue comments, PR comments, PR reviews
- **Secrets:** `ANTHROPIC_API_KEY` (optional - workflow skips if not configured)
- **Usage:** Comment `@claude` on any issue or PR
- **Setup:** See [Claude Assistant Setup](#claude-assistant-setup)

#### `ai-agent-guardian.yml` - AI Agent Guardian
Validates and enhances agent configurations with AI analysis.
- **Triggers:** Pull requests modifying `agents/**.agent.md` or `bsm-config/**`
- **Secrets:** `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`

### Security Workflows

#### `codeql-analysis.yml` - CodeQL Analysis
Performs security analysis on the codebase.
- **Triggers:** Push to main, pull requests, weekly schedule
- **Actions:** Scans for security vulnerabilities

### Automation Workflows

#### `auto-merge.yml` - Auto Merge
Automatically merges PRs that meet criteria.
- **Triggers:** Various PR events
- **Secrets:** `OPENAI_BSM_KEY`, `PERPLEXITY_KEY`

#### `auto-keys.yml` - Key Management
Manages and validates API keys.
- **Triggers:** Manual, scheduled
- **Secrets:** Various API keys

### Deployment Workflows

#### `deploy-pages.yml` - GitHub Pages Deployment
Deploys frontend to GitHub Pages.
- **Triggers:** Push to main
- **Actions:** Builds and deploys documentation

#### `cf-deploy.yml` - Cloudflare Deployment
Deploys to Cloudflare Pages.
- **Triggers:** Push to main
- **Secrets:** `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_PROJECT_NAME`

### Guard Workflows

#### `agent-guardian.yml` - Agent Guardian
Validates and prepares PRs with agent changes.
- **Triggers:** Pull requests
- **Actions:** Validation, linting, governance checks

#### `guard-critical-files.yml` - Critical Files Guard
Prevents unauthorized changes to critical files.
- **Triggers:** Pull requests
- **Actions:** Checks for changes to protected files

## Claude Assistant Setup

The Claude Assistant workflow provides AI-powered assistance but requires setup:

### Step 1: Get Anthropic API Key
1. Visit [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Create a new API key
3. Copy the key (starts with `sk-ant-`)

### Step 2: Add Repository Secret
1. Go to **Repository Settings**
2. Navigate to **Secrets and variables → Actions**
3. Click **New repository secret**
4. Name: `ANTHROPIC_API_KEY`
5. Value: Paste your API key
6. Click **Add secret**

### Step 3: Usage
Once configured, you can:
- Comment `@claude` on any issue or PR
- Claude will analyze the context and provide assistance
- Works with issue comments, PR review comments, and PR reviews

**Note:** If the secret is not configured, the workflow will automatically skip without causing failures.

## Conditional Workflows

Some workflows use conditional execution to gracefully handle missing optional secrets:

```yaml
jobs:
  my-job:
    if: ${{ secrets.OPTIONAL_SECRET != '' }}
    steps:
      # Job only runs if secret is configured
```

This pattern is used in:
- `claude-assistant.yml` - Requires `ANTHROPIC_API_KEY`
- Other workflows with optional features

## Troubleshooting

### Workflow Failures

#### "Missing API key" Errors
- Check that required secrets are configured
- Verify secret names match exactly
- Ensure secrets have valid values

#### "ANTHROPIC_API_KEY not configured"
This is expected if you haven't set up the Claude Assistant. The workflow will skip automatically.

#### Claude Assistant 404 Errors
If you see a 404 error in the Claude Assistant workflow:
- This is a known limitation when comparing non-existent branches
- **Solution:** Simply re-comment `@claude` to trigger a new run
- See [Claude Assistant Known Issues](../../docs/CLAUDE-ASSISTANT-KNOWN-ISSUES.md) for details

#### CodeQL Failures
- Usually indicates security issues in the code
- Review the CodeQL alerts in the Security tab
- Fix the issues and push again

### Testing Workflows Locally

For validation workflows:
```bash
npm ci
npm test
npm run validate
```

For linting:
```bash
npm run lint
```

## Adding New Workflows

When adding new workflows:

1. **Use explicit permissions** - Principle of least privilege
   ```yaml
   permissions:
     contents: read
     issues: write
   ```

2. **Make optional secrets conditional** - Prevent failures
   ```yaml
   if: ${{ secrets.OPTIONAL_SECRET != '' }}
   ```

3. **Document secret requirements** - Update this README
4. **Test thoroughly** - Test with and without optional secrets
5. **Add descriptive names** - Use emojis for better visibility
6. **Include comments** - Explain workflow purpose

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use GitHub Secrets** for sensitive data
3. **Rotate secrets regularly** (every 90 days recommended)
4. **Use timing-safe comparison** for token validation
5. **Limit workflow permissions** to minimum required
6. **Enable branch protection** for main branches

## Related Documentation

- [CLAUDE-ASSISTANT-KNOWN-ISSUES.md](../../docs/CLAUDE-ASSISTANT-KNOWN-ISSUES.md) - Known issues and limitations
- [SECRETS-MANAGEMENT.md](../../docs/SECRETS-MANAGEMENT.md) - Comprehensive secrets guide
- [WORKFLOW-COMPARISON.md](../../docs/WORKFLOW-COMPARISON.md) - Before/after comparison
- [CICD-RECOMMENDATIONS.md](../../docs/CICD-RECOMMENDATIONS.md) - CI/CD best practices

## Support

If you encounter issues with workflows:
1. Check the Actions tab for detailed logs
2. Review this documentation
3. Check related documentation in `docs/`
4. Open an issue on GitHub

---

**Last Updated:** 2026-02-13  
**Maintainer:** BSM Team
