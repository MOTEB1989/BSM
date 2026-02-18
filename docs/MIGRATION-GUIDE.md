# دليل الانتقال من LexBANK/BSM إلى MOTEB1989/BSM
# Migration Guide: LexBANK/BSM → MOTEB1989/BSM

## نظرة عامة (Overview)

هذا الدليل يساعدك في الانتقال من المستودع القديم `LexBANK/BSM` إلى المستودع الموحد الجديد `MOTEB1989/BSM`.

This guide helps you transition from the legacy `LexBANK/BSM` repository to the new unified `MOTEB1989/BSM` repository.

---

## Why Migrate?

### Benefits of Unified Repository

✅ **Single Source of Truth**: All components in one place
✅ **Simplified Maintenance**: One repository to manage
✅ **Better Integration**: Components work seamlessly together
✅ **Unified Configuration**: Shared config across all components
✅ **MCP Support**: GitHub Copilot integration built-in
✅ **Modern Frontend**: New Vue 3 interface with multi-agent support
✅ **Better Documentation**: Comprehensive guides and READMEs

---

## Migration Overview

```
LexBANK/BSM (Legacy)              MOTEB1989/BSM (Unified)
├── frontend (scattered)    →     ├── frontend/ (organized)
├── backend (in src/)       →     ├── src/ (enhanced)
├── no MCP support          →     ├── mcp-servers/ (new!)
└── separate configs        →     └── shared/config.js (unified)
```

---

## Pre-Migration Checklist

Before you start, ensure you have:

- [ ] GitHub account with access to both repositories
- [ ] Node.js 22+ installed (check: `node --version`)
- [ ] Git installed and configured
- [ ] List of all API keys and environment variables
- [ ] Backup of any custom modifications
- [ ] List of active deployments to update

---

## Step-by-Step Migration

### Step 1: Clone New Repository

```bash
# Clone the new unified repository
git clone https://github.com/MOTEB1989/BSM.git
cd BSM

# Check structure
ls -la
# You should see: frontend/, mcp-servers/, shared/, src/, etc.
```

### Step 2: Backup Old Configuration

If you have a clone of the old repository:

```bash
# Backup your .env file
cp /path/to/LexBANK-BSM/.env ./backup.env

# Backup any custom agent definitions
cp -r /path/to/LexBANK-BSM/data/agents ./backup-agents

# Backup any custom frontend modifications
cp -r /path/to/LexBANK-BSM/src/chat ./backup-chat
```

### Step 3: Install Dependencies

```bash
# Install root dependencies (includes MCP postinstall)
npm install

# Verify MCP server is installed
ls mcp-servers/node_modules/
```

### Step 4: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your API keys
nano .env  # or use your favorite editor
```

**Required Environment Variables**:
```bash
# At minimum, set these:
NODE_ENV=production
OPENAI_API_KEY=sk-...
ADMIN_TOKEN=your-secure-token-min-16-chars
CORS_ORIGINS=https://moteb1989.github.io
```

**Transfer from old .env**:
- Compare `backup.env` with `.env.example`
- Copy relevant API keys
- Update any changed variable names
- Add new required variables

### Step 5: Migrate Custom Code

#### If you modified agent definitions:

```bash
# Compare old and new agent files
diff backup-agents/my-agent.yaml data/agents/my-agent.yaml

# Merge your changes carefully
# The new structure may have additional fields
```

#### If you customized the frontend:

```bash
# The new frontend is in frontend/ (not src/chat)
# Review your old changes:
cat backup-chat/app.js

# Apply changes to new frontend:
nano frontend/app.js
```

#### If you customized routes or services:

```bash
# The backend structure is mostly the same
# But check for improvements:
diff -r /path/to/LexBANK-BSM/src ./src
```

### Step 6: Update URLs in Configuration

Edit `shared/config.js`:

```javascript
const config = {
  urls: {
    // Update these to match your deployment
    frontend: 'https://moteb1989.github.io/BSM/frontend',
    backend: 'https://your-new-backend-url.onrender.com',
    repo: 'https://github.com/MOTEB1989/BSM'
  },
  // ...
};
```

### Step 7: Test Locally

```bash
# Run validation
npm test

# Check health
npm run health:detailed

# Start development server
npm run dev

# Test frontend locally
cd frontend
python3 -m http.server 8000
# Visit http://localhost:8000
```

### Step 8: Update Deployments

#### Frontend (GitHub Pages)

```bash
# Option 1: Copy to docs/ for GitHub Pages
cp -r frontend/* docs/

# Option 2: Configure GitHub Pages to serve from frontend/
# (Do this in repository Settings → Pages)

# Commit and push
git add docs/  # or frontend/
git commit -m "Deploy unified frontend"
git push origin main
```

#### Backend (Render.com)

1. Go to Render Dashboard
2. If updating existing service:
   - Update repository URL to `MOTEB1989/BSM`
   - Verify environment variables
   - Re-deploy
3. If creating new service:
   - Follow [Deployment Guide](./UNIFIED-DEPLOYMENT-GUIDE.md)

#### Update DNS/Custom Domain

If you use a custom domain:

```bash
# Update CNAME file
echo "yourdomain.com" > frontend/CNAME
# or
echo "yourdomain.com" > docs/CNAME

# Commit
git add frontend/CNAME  # or docs/CNAME
git commit -m "Update custom domain"
git push
```

### Step 9: Configure MCP for Copilot

```bash
# MCP configuration is already in place
cat .github/copilot/mcp.json

# Update backend URL if needed
nano .github/copilot/mcp.json

# Commit changes
git add .github/copilot/mcp.json
git commit -m "Configure MCP for production"
git push
```

### Step 10: Verify Everything Works

#### Test Frontend
- Visit: `https://moteb1989.github.io/BSM/frontend/`
- Select each AI agent
- Send test messages
- Verify responses

#### Test Backend
```bash
# Health check
curl https://your-backend.onrender.com/health

# Key status
curl https://your-backend.onrender.com/api/chat/key-status

# Test chat
curl -X POST https://your-backend.onrender.com/api/chat/direct \
  -H "Content-Type: application/json" \
  -d '{"message":"مرحبا","language":"ar"}'
```

#### Test MCP (in VS Code with Copilot)
```
@workspace /list_agents
@workspace /get_key_status
@workspace /chat_gpt message="test"
```

---

## Updating References

### Update Links in External Documentation

Replace all references from:
- `https://github.com/LexBANK/BSM` → `https://github.com/MOTEB1989/BSM`

### Update CI/CD Workflows

If you have external CI/CD:
- Update repository URLs
- Update deployment targets
- Re-configure webhooks

### Update Local Clones

For team members:
```bash
# Update remote URL
cd /path/to/old/clone
git remote set-url origin https://github.com/MOTEB1989/BSM.git
git fetch origin
git checkout main
git pull
```

---

## Handling the Legacy Repository

### Option 1: Archive

```bash
# Add redirect notice to README
# In LexBANK/BSM repository:
```

```markdown
# 🔄 MOVED TO NEW REPOSITORY

This repository has been merged into the unified repository:
👉 **https://github.com/MOTEB1989/BSM**

Please update your bookmarks and local clones.

## What changed?
- All components unified in single repository
- New frontend interface
- MCP/Copilot integration
- Improved documentation

## How to migrate?
See [Migration Guide](https://github.com/MOTEB1989/BSM/blob/main/docs/MIGRATION-GUIDE.md)
```

Then archive the repository:
- Go to Settings → Danger Zone → Archive this repository

### Option 2: Create GitHub Redirect

Unfortunately, GitHub doesn't support automatic redirects for repositories.
But you can:
1. Make LexBANK/BSM a fork of MOTEB1989/BSM
2. Or keep it archived with a clear notice

---

## Common Issues & Solutions

### Issue: Frontend Shows Old Backend URL

**Solution**:
```bash
# Update shared/config.js
nano shared/config.js
# Change backend URL to new deployment
git commit -am "Update backend URL"
git push
```

### Issue: API Keys Not Working

**Solution**:
```bash
# Verify environment variables in Render
# Check the exact variable names match
# Redeploy if needed
```

### Issue: CORS Errors

**Solution**:
```bash
# Update CORS_ORIGINS in backend env
CORS_ORIGINS=https://moteb1989.github.io,https://yourdomain.com

# Redeploy backend
```

### Issue: MCP Server Not Found

**Solution**:
```bash
# Ensure dependencies are installed
cd mcp-servers
npm install

# Verify config file
cat ../.github/copilot/mcp.json

# Restart VS Code
```

### Issue: Old Deployment Still Active

**Solution**:
- Disable/delete old Render service
- Update DNS to point to new deployment
- Clear CDN cache if applicable

---

## Rollback Plan

If something goes wrong:

```bash
# 1. Keep old deployment active during migration
# 2. Test new deployment on different URL
# 3. Switch traffic only when verified
# 4. Keep old deployment for 24-48 hours as backup

# To rollback:
# - Switch DNS back to old deployment
# - Restore old GitHub Pages deployment
# - Keep investigating issues with new deployment
```

---

## Post-Migration Tasks

### Update Documentation

- [ ] Update README with new repository URL
- [ ] Update API documentation
- [ ] Update team wiki/internal docs
- [ ] Update deployment runbooks

### Notify Users/Team

```markdown
📢 Migration Complete!

We've successfully migrated to our unified repository:
https://github.com/MOTEB1989/BSM

New Features:
✅ Unified frontend with 5 AI agents
✅ GitHub Copilot integration
✅ Improved performance and security
✅ Better documentation

Action Required:
- Update your local clones
- Update bookmarks
- Review new documentation
```

### Monitor Performance

- Check error rates for first 48 hours
- Monitor response times
- Watch for any regression issues
- Keep old deployment ready for quick rollback

### Clean Up

After 1-2 weeks of stable operation:
- [ ] Archive old repository
- [ ] Delete old deployment
- [ ] Remove old DNS records
- [ ] Clean up old CI/CD pipelines
- [ ] Update cost tracking

---

## Getting Help

### Resources
- [Unified Repository Strategy](./UNIFIED-REPOSITORY-STRATEGY.md)
- [Deployment Guide](./UNIFIED-DEPLOYMENT-GUIDE.md)
- [Frontend README](../frontend/README.md)
- [MCP Server README](../mcp-servers/README.md)

### Support
- **Issues**: https://github.com/MOTEB1989/BSM/issues
- **Discussions**: https://github.com/MOTEB1989/BSM/discussions

### Emergency Rollback
If critical issues occur:
1. Switch traffic back to old deployment
2. Document the issue
3. Open GitHub issue for investigation
4. Plan fixes before re-attempting

---

## Success Checklist

Migration is complete when:

- [ ] New repository cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Custom code migrated and tested
- [ ] Frontend deployed to GitHub Pages
- [ ] Backend deployed to Render/hosting
- [ ] MCP configured for Copilot
- [ ] All API endpoints tested
- [ ] All AI agents working
- [ ] Documentation updated
- [ ] Team notified
- [ ] Old repository archived
- [ ] No errors in production for 48+ hours

---

**Congratulations on completing the migration! 🎉**

Your unified BSU/LexBANK platform is now ready for the future.

---

**Last Updated**: February 2026
