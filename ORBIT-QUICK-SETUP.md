# ORBIT Quick Setup Guide

> **⚠️ Admin Tool**: This guide is for setting up the **ORBIT admin bot** (private).  
> **For public community channels**, see [COMMUNITY.md](./COMMUNITY.md).

**⚡ Get ORBIT running in 10 minutes**

## What You'll Get

- ✅ Automated secret management
- ✅ GitHub Actions integration  
- ✅ Telegram bot command interface
- ✅ Cloudflare Workers deployment
- ✅ Self-healing monitoring

## Prerequisites (5 min)

1. **Install tools**:
   ```bash
   # macOS
   brew install gh jq
   npm install -g wrangler
   
   # Ubuntu/Debian
   sudo apt-get install gh jq
   npm install -g wrangler
   ```

2. **Get tokens**:
   - GitHub PAT: https://github.com/settings/tokens/new (scopes: `repo`, `workflow`)
   - Telegram Bot: Message [@BotFather](https://t.me/BotFather) → `/newbot`
   - Cloudflare Account: https://dash.cloudflare.com/sign-up (free tier OK)

## Quick Start (5 min)

### Step 1: Get Telegram Chat ID
```bash
# Send a message to your bot first, then run:
./scripts/get-telegram-chat-id.sh
# Copy the chat ID shown
```

### Step 2: Run Bootstrap
```bash
./scripts/bootstrap-orbit.sh
```

Follow prompts to enter:
- Cloudflare Account ID & Zone ID
- GitHub PAT
- Telegram Bot Token  
- Your chat ID from Step 1

**That's it!** All secrets are now configured.

### Step 3: Deploy Worker
```bash
# Edit wrangler.toml - replace YOUR_CF_ACCOUNT_ID and YOUR_CF_ZONE_ID

# Deploy
wrangler publish --env production
# Note the Worker URL shown
```

### Step 4: Set Webhook
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "<WORKER_URL>"}'
```

Replace `<BOT_TOKEN>` and `<WORKER_URL>` with your values.

## Test It

1. Open Telegram
2. Search for your bot
3. Send: `/status`
4. Should get response from ORBIT

## Next Steps

- 📖 Read full guide: [docs/ORBIT-BOOTSTRAP-GUIDE.md](./ORBIT-BOOTSTRAP-GUIDE.md)
- 🔐 Security practices: [docs/ORBIT-SECRETS-MANAGEMENT.md](./ORBIT-SECRETS-MANAGEMENT.md)
- ⚙️ Configure workflows: `.github/workflows/orbit-*.yml`

## Troubleshooting

**Bot not responding?**
```bash
# Check webhook status
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo | jq

# Check Worker logs
wrangler tail --env production
```

**Secrets not working?**
```bash
# Verify GitHub secrets are set
gh secret list --repo LexBANK/BSM

# Verify Wrangler secrets
wrangler secret list --env production
```

## Files Created

- `scripts/bootstrap-orbit.sh` - Main setup script
- `scripts/get-telegram-chat-id.sh` - Extract chat ID
- `wrangler.toml` - Cloudflare Workers config
- `docs/ORBIT-BOOTSTRAP-GUIDE.md` - Detailed guide
- `docs/ORBIT-SECRETS-MANAGEMENT.md` - Security guide

## Security Notes

- ✅ Run bootstrap once on a secure machine
- ✅ Never commit tokens to git
- ✅ Rotate tokens every 90 days
- ✅ Start in report-only mode (no auto-fix)
- ✅ Review actions before enabling auto-heal

---

**Questions?** Open an issue or check the full documentation.
