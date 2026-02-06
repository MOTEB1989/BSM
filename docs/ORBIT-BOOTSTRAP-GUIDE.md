# ORBIT Bootstrap Guide

Complete guide for setting up ORBIT (Self-Healing Agent) with GitHub Actions, Cloudflare Workers, and Telegram integration.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Telegram Bot Configuration](#telegram-bot-configuration)
6. [Cloudflare Workers Deployment](#cloudflare-workers-deployment)
7. [Telegram Webhook Setup](#telegram-webhook-setup)
8. [Security Best Practices](#security-best-practices)
9. [Troubleshooting](#troubleshooting)

## Overview

The ORBIT system consists of three main components:

1. **GitHub Actions Workflows**: Automated health monitoring and repair
2. **Cloudflare Workers**: Telegram bot gateway and webhook handler
3. **Telegram Bot**: Command interface for administrators

This bootstrap process sets up all required secrets and configurations in one go.

## Prerequisites

### Required Tools

- [GitHub CLI (gh)](https://cli.github.com/) - For managing GitHub secrets
- [curl](https://curl.se/) - For API calls (usually pre-installed)
- [jq](https://stedolan.github.io/jq/) - For JSON parsing
- [wrangler](https://developers.cloudflare.com/workers/wrangler/) - For Cloudflare Workers deployment (optional but recommended)

### Installation Commands

```bash
# macOS (using Homebrew)
brew install gh jq
npm install -g wrangler

# Ubuntu/Debian
sudo apt-get install gh jq
npm install -g wrangler

# Windows (using Chocolatey)
choco install gh jq
npm install -g wrangler
```

### Required Accounts and Tokens

1. **GitHub Personal Access Token (PAT)**
   - Scopes required: `repo`, `workflow`
   - Create at: https://github.com/settings/tokens/new

2. **Telegram Bot Token**
   - Get from [@BotFather](https://t.me/BotFather) on Telegram
   - Commands: `/newbot` → follow prompts

3. **Cloudflare Account**
   - Sign up at: https://dash.cloudflare.com/sign-up
   - Free tier is sufficient for ORBIT

## Quick Start

**Run the bootstrap script once on a secure machine:**

```bash
# Make scripts executable
chmod +x scripts/bootstrap-orbit.sh scripts/get-telegram-chat-id.sh

# Run bootstrap (interactive)
./scripts/bootstrap-orbit.sh
```

The script will:
- Authenticate with GitHub CLI
- Collect all required secrets interactively
- Validate secret formats
- Set GitHub repository secrets
- Set Cloudflare Workers secrets (if wrangler is available)

**Estimated time: 5-10 minutes**

## Step-by-Step Setup

### Step 1: Get Telegram Chat ID

First, send a message to your bot on Telegram, then extract your chat ID:

```bash
./scripts/get-telegram-chat-id.sh
```

**Example output:**
```
[SUCCESS] Found the following chat IDs:

  • Chat ID: 123456789
    User: John Doe (@johndoe)

[INFO] For ORBIT_ADMIN_CHAT_IDS, use this value:
  123456789
```

Save this chat ID for the bootstrap script.

### Step 2: Prepare Required Information

Gather the following before running the bootstrap script:

| Secret | Where to Find | Format |
|--------|---------------|--------|
| `CF_ACCOUNT_ID` | Cloudflare Dashboard → Workers & Pages → Overview | 32 hex chars |
| `CF_ZONE_ID` | Cloudflare Dashboard → Your Domain → Overview → API section | 32 hex chars |
| `CF_PROJECT_NAME` | Choose a name (e.g., `orbit-workers`) | alphanumeric |
| `ORBIT_GITHUB_TOKEN` | GitHub Settings → Developer settings → Personal access tokens | `ghp_...` |
| `TELEGRAM_BOT_TOKEN` | @BotFather on Telegram | `123456789:ABC...` |
| `ORBIT_ADMIN_CHAT_IDS` | From `get-telegram-chat-id.sh` | `123,456,789` |

### Step 3: Run Bootstrap Script

```bash
./scripts/bootstrap-orbit.sh
```

Follow the interactive prompts:

1. **GitHub Authentication**: Browser will open for OAuth flow
2. **Cloudflare Configuration**: Enter Account ID, Zone ID, Project Name
3. **GitHub Token**: Paste your PAT (hidden input)
4. **Telegram Configuration**: Paste bot token and admin chat IDs

The script will validate formats and set all secrets automatically.

### Step 4: Configure wrangler.toml

Edit `wrangler.toml` and replace placeholders:

```toml
[env.production]
account_id = "abc123..."  # Your CF_ACCOUNT_ID
zone_id = "xyz789..."     # Your CF_ZONE_ID
```

### Step 5: Deploy Cloudflare Worker

```bash
# Login to Cloudflare (if not already logged in)
wrangler login

# Deploy to production
wrangler publish --env production
```

**Note the Worker URL** from the output (e.g., `https://orbit-workers.your-subdomain.workers.dev`)

### Step 6: Set Telegram Webhook

Replace `<BOT_TOKEN>` and `<WORKER_URL>` with your values:

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"<WORKER_URL>\"}"
```

**Example:**
```bash
curl -X POST "https://api.telegram.org/bot123456789:ABCdefGHI.../setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://orbit-workers.mysubdomain.workers.dev\"}"
```

**Expected response:**
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

## Telegram Bot Configuration

### Creating a Bot with @BotFather

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Choose a display name (e.g., "ORBIT BSM Bot")
4. Choose a username (must end in `bot`, e.g., "orbit_bsm_bot")
5. Save the token provided by BotFather

### Configuring Bot Settings

Optional but recommended:

```
# Set bot description
/setdescription
→ Select your bot
→ Enter: "ORBIT Self-Healing Agent for LexBANK/BSM repository"

# Set bot commands
/setcommands
→ Select your bot
→ Enter:
status - Check ORBIT system status
health - Run health check
logs - View recent logs
help - Show available commands

# Set bot profile picture
/setuserpic
→ Select your bot
→ Upload image
```

## Cloudflare Workers Deployment

### Environment-Specific Deployments

```bash
# Production
wrangler publish --env production

# Staging
wrangler publish --env staging

# Development (local)
wrangler dev
```

### Viewing Logs

```bash
# Tail production logs
wrangler tail --env production

# Tail with filters
wrangler tail --env production --status error
```

### Updating Secrets

If you need to update a secret later:

```bash
# Update via GitHub CLI
echo "new-value" | gh secret set SECRET_NAME --repo LexBANK/BSM

# Update via Wrangler
echo "new-value" | wrangler secret put SECRET_NAME --env production
```

## Telegram Webhook Setup

### Verify Webhook Status

```bash
curl -s "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo" | jq
```

**Healthy response:**
```json
{
  "ok": true,
  "result": {
    "url": "https://orbit-workers.mysubdomain.workers.dev",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40
  }
}
```

### Delete Webhook (if needed)

```bash
curl -s "https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook"
```

### Test Bot

1. Open Telegram and search for your bot
2. Send `/start` or `/help`
3. Bot should respond with available commands

## Security Best Practices

### 1. Run Bootstrap Once on Secure Machine

- Use a trusted computer with no malware
- Ensure no screen recording or keyloggers
- Clear terminal history after running: `history -c`

### 2. Token Rotation Schedule

Rotate tokens every 90 days:

```bash
# Update GitHub token
echo "new-token" | gh secret set ORBIT_GITHUB_TOKEN --repo LexBANK/BSM
echo "new-token" | wrangler secret put ORBIT_GITHUB_TOKEN --env production

# Repeat for other secrets
```

### 3. Start in Report-Only Mode

Configure ORBIT to report issues without auto-fixing initially:

```yaml
# .github/workflows/orbit-monitor.yml
env:
  ORBIT_MODE: "report-only"  # Change to "auto-heal" after verification
```

### 4. Restrict Admin Access

Only add trusted chat IDs to `ORBIT_ADMIN_CHAT_IDS`:

```bash
# Multiple admins (comma-separated)
ORBIT_ADMIN_CHAT_IDS="123456789,987654321"
```

### 5. Enable GitHub Security Features

- Enable branch protection on `main`
- Require PR reviews before merging
- Enable secret scanning alerts
- Use Dependabot for dependency updates

### 6. Monitor Worker Logs

Regularly check Cloudflare Workers logs:

```bash
wrangler tail --env production
```

## Troubleshooting

### GitHub CLI Authentication Fails

**Problem:** `gh auth status` returns error

**Solution:**
```bash
gh auth logout
gh auth login --web --scopes "repo,workflow"
```

### Telegram Bot Not Responding

**Problem:** Bot doesn't reply to messages

**Checklist:**
1. Verify webhook is set: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
2. Check Worker logs: `wrangler tail --env production`
3. Verify secrets are set: `gh secret list --repo LexBANK/BSM`
4. Test Worker endpoint manually: `curl <WORKER_URL>`

### Cloudflare Worker Deployment Fails

**Problem:** `wrangler publish` returns error

**Common causes:**
- Not logged in: Run `wrangler login`
- Invalid `account_id` or `zone_id` in `wrangler.toml`
- Incorrect file path in `main` field
- Missing dependencies: Run `npm install`

### Invalid Secret Format

**Problem:** Bootstrap script warns about format

**Solutions:**
- **GitHub Token**: Must start with `ghp_` and be 36+ characters
- **Telegram Token**: Format `12345:ABC...` (numbers:letters)
- **Cloudflare IDs**: Must be 32 hexadecimal characters
- **Chat IDs**: Must be comma-separated numbers with no spaces

### Chat ID Not Found

**Problem:** `get-telegram-chat-id.sh` returns no results

**Solution:**
1. Send a message to your bot on Telegram
2. Wait 10 seconds
3. Run the script again
4. If still failing, verify bot token is correct

### Worker URL Returns 404

**Problem:** Webhook URL not accessible

**Checklist:**
1. Verify deployment succeeded: `wrangler publish --env production`
2. Check route configuration in `wrangler.toml`
3. Verify Worker name matches
4. Check Cloudflare Dashboard → Workers & Pages → Your Worker

## Next Steps

After successful bootstrap:

1. **Test ORBIT Commands**
   - Send `/status` to bot
   - Verify response

2. **Configure GitHub Actions**
   - Review `.github/workflows/orbit-*.yml`
   - Adjust scheduling as needed

3. **Monitor First Week**
   - Keep `ORBIT_MODE: "report-only"`
   - Review reported issues
   - Adjust thresholds if needed

4. **Enable Auto-Healing**
   - Change to `ORBIT_MODE: "auto-heal"`
   - Monitor closely for first 48 hours

5. **Set Up Alerts**
   - Configure Telegram notifications
   - Add email alerts (optional)

## Support

- **Documentation**: See `docs/ORBIT-SECRETS-MANAGEMENT.md`
- **Issues**: Report at https://github.com/LexBANK/BSM/issues
- **Discussions**: Use GitHub Discussions for questions

---

**Last Updated**: 2026-02-06
**Version**: 1.0.0
