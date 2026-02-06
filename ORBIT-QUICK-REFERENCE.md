# ORBIT Quick Reference Card

## 🚀 Setup (One-Time, 10 minutes)

```bash
# 1. Get your Telegram chat ID
./scripts/get-telegram-chat-id.sh

# 2. Run bootstrap
./scripts/bootstrap-orbit.sh

# 3. Configure Cloudflare
# Edit wrangler.toml - replace YOUR_CF_ACCOUNT_ID and YOUR_CF_ZONE_ID

# 4. Deploy Worker
wrangler publish --env production

# 5. Set Telegram webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "<WORKER_URL>"}'
```

## 📋 Required Secrets

| Secret | Get From | Format |
|--------|----------|--------|
| GitHub PAT | https://github.com/settings/tokens/new | `ghp_...` |
| Bot Token | @BotFather on Telegram | `123:ABC...` |
| Chat ID | `./scripts/get-telegram-chat-id.sh` | `123456789` |
| CF Account | dash.cloudflare.com → Workers | 32 hex chars |
| CF Zone | dash.cloudflare.com → Domain → API | 32 hex chars |

## 🔧 Common Commands

```bash
# Check secrets
gh secret list --repo LexBANK/BSM
wrangler secret list --env production

# View Worker logs
wrangler tail --env production

# Check webhook
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo | jq

# Update secret
echo "value" | gh secret set SECRET_NAME --repo LexBANK/BSM
echo "value" | wrangler secret put SECRET_NAME --env production

# Test bot
# Send /status to your bot on Telegram
```

## 📖 Documentation

- **Quick Setup**: `docs/ORBIT-QUICK-SETUP.md` (2 min read)
- **Full Guide**: `docs/ORBIT-BOOTSTRAP-GUIDE.md` (15 min read)
- **Security**: `docs/ORBIT-SECRETS-MANAGEMENT.md` (enterprise)

## 🆘 Troubleshooting

**Bot not responding?**
```bash
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo | jq
wrangler tail --env production
```

**Secrets not working?**
```bash
gh secret list --repo LexBANK/BSM
wrangler secret list --env production
```

**Worker deployment fails?**
```bash
wrangler login
# Check account_id and zone_id in wrangler.toml
```

## 🔒 Security Checklist

- [ ] Run bootstrap on secure machine
- [ ] Clear terminal history after setup
- [ ] Never commit tokens to git
- [ ] Rotate tokens every 90 days
- [ ] Start in report-only mode
- [ ] Review ORBIT actions before auto-heal

## 📞 Support

- Issues: https://github.com/LexBANK/BSM/issues
- Docs: `docs/ORBIT-*.md`

---

**Quick Start**: `./scripts/bootstrap-orbit.sh` ← Start here!
