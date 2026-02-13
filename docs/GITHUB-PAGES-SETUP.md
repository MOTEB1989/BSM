# GitHub Pages Deployment Setup

## Required Configuration

### 1. GitHub Secret
Add a repository secret named `API_BASE_URL` with value `https://sr-bsm.onrender.com`:
1. Go to: **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `API_BASE_URL`
4. Value: `https://sr-bsm.onrender.com`
5. Click **Add secret**

### 2. GitHub Pages Settings
After the first deployment:
1. Go to: **Settings → Pages**
2. Verify **Source** is set to `gh-pages` branch
3. Verify **Custom domain** shows `www.lexdo.uk` (or your configured domain from docs/CNAME)
4. Enable **Enforce HTTPS**

### 3. DNS Configuration
Point your domain to GitHub Pages (configured in docs/CNAME):

**Current domain: www.lexdo.uk**

- Add A records for apex domain pointing to GitHub Pages IPs:
  - 185.199.108.153
  - 185.199.109.153
  - 185.199.110.153
  - 185.199.111.153
- Add CNAME record for `www` subdomain pointing to `lexbank.github.io`

See the complete DNS setup in [dns/lexdo-uk-zone.txt](../dns/lexdo-uk-zone.txt) and [LEXDO-UK-SETUP-GUIDE.md](./LEXDO-UK-SETUP-GUIDE.md)

### 4. Backend CORS Configuration
Update your backend (sr-bsm.onrender.com) to accept requests from all configured domains.

Update the `CORS_ORIGINS` environment variable in Render.com:
```
CORS_ORIGINS=https://www.lexdo.uk,https://lexdo.uk,https://lexprim.com,https://www.lexprim.com,https://corehub.nexus,https://www.corehub.nexus
```

> **Note**: This configuration allows multiple domains to access the API. Ensure all domains are properly secured and monitored.

## How It Works

1. **Workflow triggers** on push to `main` branch or manual dispatch
2. **Workflow generates** `docs/config.js` with API_BASE from the secret
3. **Frontend loads** config.js and reads `window.__ENV__.API_BASE`
4. **Workflow deploys** to GitHub Pages using `gh-pages` branch
5. **Custom domain** (from docs/CNAME, currently www.lexdo.uk) serves the content

## Local Testing

For local testing, `docs/config.js` is included with default values:
```js
window.__ENV__ = {
  API_BASE: "https://sr-bsm.onrender.com"
};
```

You can modify this file locally to test with different API endpoints.

## Files

- `.github/workflows/deploy-pages.yml` - Deployment workflow
- `docs/CNAME` - Custom domain configuration
- `docs/config.js` - API configuration (auto-generated on deploy)
- `docs/index.html` - Main interface (updated to use config.js)
- `docs/app.js` - Vue app (updated to use config.js)
