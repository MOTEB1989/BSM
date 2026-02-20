# Render CLI Deployment Guide

## Overview

BSM uses the official [Render CLI](https://github.com/render-oss/cli) for automated deployments to Render.com. The deployment workflow is configured in `.github/workflows/render-cli.yml`.

## Workflow Features

The Render CLI workflow (`render-cli.yml`) provides comprehensive deployment automation with the following capabilities:

### 1. Blueprint Validation
- Validates `render.yaml` configuration before deployment
- Ensures service configuration is correct
- Runs on all pushes to main that modify render.yaml or source code
- Runs on pull requests that modify render.yaml

### 2. Automatic Deployment
- Triggers deployment to Render automatically on push to `main` branch
- Monitors deployment status with automatic retries
- Provides detailed logging and error handling
- Uses Render CLI v2.7.1 (latest stable version)

### 3. Manual Operations
The workflow supports manual dispatch with various actions:
- **validate**: Validate render.yaml blueprint only
- **deploy**: Trigger manual deployment
- **status**: Check service and deployment status
- **logs**: Fetch recent service logs

### 4. Status Monitoring
- Automatically checks deployment status after triggering
- Waits up to 3 minutes for deployment completion
- Detects failed deployments and exits with error
- Supports statuses: live, build_failed, update_failed, canceled

## Required Secrets

Configure the following secrets in your GitHub repository:

### RENDER_API_KEY (Required)
Your Render API key for authenticating with Render's API.

**To get your API key:**
1. Go to https://dashboard.render.com/account/settings
2. Navigate to "API Keys" section
3. Create a new API key or copy existing one
4. Add to GitHub: Settings → Secrets and variables → Actions → New repository secret

### RENDER_SERVICE_ID (Required)
The ID of your Render service to deploy.

**To find your service ID:**
1. Go to https://dashboard.render.com
2. Select your service (e.g., "bsu-api")
3. Service ID is in the URL: `https://dashboard.render.com/web/srv-XXXXX`
4. Copy the `srv-XXXXX` part
5. Add to GitHub: Settings → Secrets and variables → Actions → New repository secret

## Usage

### Automatic Deployment

The workflow automatically runs when:
- Code is pushed to `main` branch
- Changes are made to `src/**`, `package.json`, or `render.yaml`

```bash
git push origin main  # Triggers automatic deployment
```

### Manual Deployment

You can trigger manual deployment from GitHub Actions:

1. Go to your repository on GitHub
2. Click "Actions" tab
3. Select "Render CLI - Validate & Deploy" workflow
4. Click "Run workflow"
5. Select action: **deploy**
6. Click "Run workflow" button

### Validate Configuration

To validate `render.yaml` without deploying:

1. Go to Actions tab
2. Select "Render CLI - Validate & Deploy"
3. Click "Run workflow"
4. Select action: **validate**
5. Click "Run workflow"

### Check Service Status

To view current service status:

1. Go to Actions tab
2. Select "Render CLI - Validate & Deploy"
3. Click "Run workflow"
4. Select action: **status**
5. Click "Run workflow"

### View Service Logs

To fetch recent service logs:

1. Go to Actions tab
2. Select "Render CLI - Validate & Deploy"
3. Click "Run workflow"
4. Select action: **logs**
5. Click "Run workflow"

## render.yaml Configuration

The `render.yaml` file defines your Render service configuration:

```yaml
services:
  - type: web
    name: bsu-api
    env: node
    plan: free
    buildCommand: "npm ci"
    startCommand: "npm start"
```

### Required Environment Variables

Set these in the Render dashboard (not in `render.yaml` for security):

**Required:**
- `OPENAI_API_KEY` or `OPENAI_BSM_KEY` or `OPENAI_BSU_KEY`: OpenAI API key
- `ADMIN_TOKEN`: Admin authentication token (minimum 16 characters)
- `NODE_ENV`: Set to `production`

**Required for GitHub Pages + CoreHub Nexus frontend:**
- `CORS_ORIGINS`: `https://moteb1989.github.io,https://corehub.nexus,https://www.corehub.nexus`

**Optional:**
- `GITHUB_WEBHOOK_SECRET`: Required only if using GitHub webhooks
- `GITHUB_BSU_TOKEN`: For GitHub integration features
- Other API keys as needed (Perplexity, Telegram, etc.)

## Deployment Process

When deployment is triggered, the workflow:

1. **Validation Phase** (validate-blueprint job)
   - Checks out repository
   - Installs Render CLI v2.7.1
   - Validates render.yaml blueprint
   - Fails fast if configuration is invalid

2. **Deployment Phase** (deploy job)
   - Runs only if validation passes
   - Triggers deployment via `render deploys create`
   - Passes `--confirm` flag for non-interactive deployment
   - Uses JSON output for parsing

3. **Monitoring Phase**
   - Polls deployment status every 15 seconds
   - Retries up to 12 times (3 minutes total)
   - Reports final status: live, failed, or in-progress

## Troubleshooting

### Deployment Fails Immediately

**Problem**: Deployment fails without starting build

**Solutions**:
- Check that `RENDER_SERVICE_ID` secret is correct
- Verify `RENDER_API_KEY` is valid and not expired
- Ensure service exists in Render dashboard
- Check render.yaml syntax is valid

### Blueprint Validation Fails

**Problem**: render.yaml validation fails

**Solutions**:
- Run `render blueprint validate render.yaml` locally (requires Render CLI)
- Check for syntax errors in render.yaml
- Ensure all required fields are present
- Verify service type is supported (web, worker, cron, etc.)

### Build Fails on Render

**Problem**: Deployment starts but build fails

**Solutions**:
- Check build logs in Render dashboard
- Verify `buildCommand` is correct in render.yaml
- Ensure all dependencies are in package.json
- Check Node.js version compatibility

### Service Fails to Start

**Problem**: Build succeeds but service won't start

**Solutions**:
- Check service logs in Render dashboard
- Verify `startCommand` is correct
- Ensure required environment variables are set
- Check PORT environment variable (Render provides this)
- Verify health check endpoint responds correctly

### Status Check Times Out

**Problem**: Workflow reports "still in progress after 3 minutes"

**Solutions**:
- This is not necessarily an error - build may complete later
- Check Render dashboard for actual deployment status
- For large builds, consider increasing timeout in workflow
- Build may take longer on free tier due to resource limitations

## Comparison with Other Deployment Methods

### vs. Render Deploy Hook (ci-deploy-render.yml)

**Render CLI Advantages:**
- Blueprint validation before deployment
- Structured JSON output for parsing
- Status monitoring built-in
- Service management capabilities
- Official Render tool

**Deploy Hook Advantages:**
- Simpler setup (single webhook URL)
- No CLI installation required
- Faster execution (no status polling)

**Recommendation**: Use Render CLI for production deployments with validation. Use Deploy Hook for simple staging deployments.

### vs. Manual Deployment

**Automated Advantages:**
- Consistent deployment process
- No human error
- Automatic validation
- Status monitoring
- Audit trail in GitHub Actions

**When to Deploy Manually:**
- Emergency hotfixes
- Testing configuration changes
- Debugging build issues

## Advanced Usage

### Custom Deployment Script

For complex deployments, create a custom script:

```bash
#!/bin/bash
# scripts/deploy-render.sh

set -e

echo "🔍 Validating configuration..."
render blueprint validate render.yaml

echo "🚀 Triggering deployment..."
DEPLOY_ID=$(render deploys create "$RENDER_SERVICE_ID" --output json --confirm | jq -r '.id')

echo "⏳ Waiting for deployment $DEPLOY_ID..."
while true; do
  STATUS=$(render deploys list "$RENDER_SERVICE_ID" --output json | jq -r ".[0].status")
  echo "Status: $STATUS"
  
  if [ "$STATUS" = "live" ]; then
    echo "✅ Deployment successful!"
    break
  elif [ "$STATUS" = "build_failed" ] || [ "$STATUS" = "update_failed" ]; then
    echo "❌ Deployment failed!"
    exit 1
  fi
  
  sleep 10
done
```

### Local Testing

Test the deployment locally:

```bash
# Install Render CLI
curl -fsSL https://github.com/render-oss/cli/releases/download/v2.7.1/render_Linux_x86_64.tar.gz -o render-cli.tar.gz
tar -xzf render-cli.tar.gz
sudo mv render /usr/local/bin/

# Validate configuration
export RENDER_API_KEY="your-api-key"
render blueprint validate render.yaml

# Check service status
export RENDER_SERVICE_ID="srv-xxxxx"
render deploys list "$RENDER_SERVICE_ID"
```

## Security Best Practices

1. **Never commit secrets**: Keep API keys in GitHub Secrets, not in code
2. **Use environment protection**: Configure GitHub environments for production
3. **Review deploy logs**: Check deployment logs for sensitive data before making public
4. **Rotate API keys**: Periodically rotate your Render API key
5. **Limit scope**: Use separate API keys for different environments
6. **Monitor deployments**: Set up alerts for failed deployments

## Resources

- [Render CLI Documentation](https://github.com/render-oss/cli)
- [Render API Documentation](https://render.com/docs/api)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [render.yaml Specification](https://render.com/docs/infrastructure-as-code)

## Support

For issues or questions:
- Check workflow logs in GitHub Actions
- Review Render dashboard for service status
- Check this documentation
- Open an issue in the repository

---

**Last Updated**: 2026-02-20  
**Render CLI Version**: 2.7.1  
**Workflow File**: `.github/workflows/render-cli.yml`
