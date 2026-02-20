# Render Deployment - Quick Reference

## 🚀 Quick Deploy Commands

```bash
# Push to main (automatic deployment)
git push origin main

# Manual workflow trigger
# Go to: Actions → Render CLI - Validate & Deploy → Run workflow → deploy
```

## 🔑 Required Secrets

Add these in GitHub Settings → Secrets and variables → Actions:

| Secret | Description | How to Get |
|--------|-------------|------------|
| `RENDER_API_KEY` | Render API authentication | [Dashboard Settings](https://dashboard.render.com/account/settings) → API Keys |
| `RENDER_SERVICE_ID` | Service identifier (e.g., `srv-xxxxx`) | Dashboard → Service URL → Copy `srv-xxxxx` |

## 🎯 Workflow Actions

From GitHub Actions → "Render CLI - Validate & Deploy" → Run workflow:

- **validate** - Check render.yaml configuration
- **deploy** - Trigger manual deployment
- **status** - View service and deployment status
- **logs** - Fetch recent service logs

## ⚙️ Render Environment Variables

Set in [Render Dashboard](https://dashboard.render.com) → Your Service → Environment:

### Required
```bash
NODE_ENV=production
ADMIN_TOKEN=your-secure-token-min-16-chars
OPENAI_API_KEY=sk-... # or OPENAI_BSM_KEY or OPENAI_BSU_KEY
```

### For Frontend Integration
```bash
CORS_ORIGINS=https://moteb1989.github.io,https://corehub.nexus,https://www.corehub.nexus
```

### Optional
```bash
GITHUB_BSU_TOKEN=ghp_...           # GitHub integration
GITHUB_WEBHOOK_SECRET=...          # Webhook verification
PERPLEXITY_KEY=pplx-...           # Perplexity AI
TELEGRAM_BOT_TOKEN=...            # Telegram bot
# Add other API keys as needed
```

## 📋 render.yaml Structure

```yaml
services:
  - type: web
    name: bsu-api
    env: node
    plan: free
    buildCommand: "npm ci"
    startCommand: "npm start"
```

## 🔍 Troubleshooting

| Problem | Solution |
|---------|----------|
| Deployment fails immediately | Check `RENDER_SERVICE_ID` and `RENDER_API_KEY` secrets |
| Build fails | Check build logs in Render dashboard; verify `package.json` |
| Service won't start | Verify environment variables are set; check service logs |
| Status times out | Normal for long builds; check dashboard for actual status |

## 📖 Full Documentation

For complete information, see [RENDER-CLI-DEPLOYMENT.md](./RENDER-CLI-DEPLOYMENT.md)

## 🔗 Quick Links

- [Render Dashboard](https://dashboard.render.com)
- [Render API Keys](https://dashboard.render.com/account/settings)
- [GitHub Actions](https://github.com/MOTEB1989/BSM/actions)
- [Workflow File](./../.github/workflows/render-cli.yml)

## ✅ Deployment Checklist

Before deploying:
- [ ] All secrets configured in GitHub
- [ ] Environment variables set in Render dashboard
- [ ] `ADMIN_TOKEN` is 16+ characters
- [ ] `CORS_ORIGINS` includes your frontend domains
- [ ] `render.yaml` validated locally
- [ ] Tests passing locally (`npm test`)
- [ ] Changes committed to `main` branch

## 🎓 Learning Path

1. **First Time**: Read [full documentation](./RENDER-CLI-DEPLOYMENT.md)
2. **Regular Use**: Use this quick reference
3. **Issues**: Check troubleshooting section or workflow logs
4. **Advanced**: Customize workflow file for your needs

---

**Last Updated**: 2026-02-20  
**Render CLI Version**: 2.7.1  
**Related Files**: 
- `.github/workflows/render-cli.yml`
- `render.yaml`
- `docs/RENDER-CLI-DEPLOYMENT.md`
