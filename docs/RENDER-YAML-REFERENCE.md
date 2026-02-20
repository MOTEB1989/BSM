# Render.yaml Configuration Reference

This document provides a comprehensive reference for the `render.yaml` configuration file used for deploying BSM on Render.com.

## File Location

`/render.yaml` (repository root)

## Format

The file uses YAML format following Render's Infrastructure as Code (IaC) specification.

## Current Configuration

### Version

```yaml
version: "1"
```

The version field specifies the Render.yaml format version. Currently using version 1.

### Service Configuration

```yaml
services:
  - type: web
    name: SR.BSM
    runtime: node
    repo: https://github.com/LexBANK/BSM
    region: virginia
```

#### Fields

- **type**: `web` - Defines this as a web service
- **name**: `SR.BSM` - Service name in Render dashboard
- **runtime**: `node` - Node.js runtime environment
- **repo**: Repository URL for deployment source
- **region**: `virginia` - AWS region for deployment

### Build & Deploy Commands

```yaml
    buildCommand: npm ci
    startCommand: npm start
    preDeployCommand: npm install
```

#### Commands

- **buildCommand**: `npm ci` - Clean install dependencies from package-lock.json
- **startCommand**: `npm start` - Start the Node.js server (runs `node src/server.js`)
- **preDeployCommand**: `npm install` - Ensures dependencies are installed before deployment

### Environment Variables

```yaml
    envVars:
      - key: NODE_ENV
        sync: false
      - key: RENDER_DEPLOY_HOOK
        sync: false
      # ... (10 total)
```

#### Configuration

All environment variables have `sync: false`, meaning:
- Values must be set in the Render dashboard
- Not synced from the repository (security best practice)
- Not committed to version control

#### Required Variables

1. **NODE_ENV**: Set to `production` for production deployments
2. **ADMIN_TOKEN**: Admin authentication token (16+ chars)
3. **CORS_ORIGINS**: Comma-separated allowed origins

#### AI Provider Variables

4. **OPENAI_BSM_KEY**: Primary OpenAI API key
5. **OPENAI_API_KEY**: Fallback OpenAI API key
6. **PERPLEXITY_KEY**: Perplexity AI (search with citations)
7. **KIMI_API_KEY**: Moonshot AI (long-context)
8. **ANTHROPIC_API_KEY**: Anthropic Claude

#### Integration Variables

9. **GITHUB_TOKEN**: GitHub personal access token
10. **RENDER_DEPLOY_HOOK**: Deployment webhook (auto-generated)

### Custom Domains

```yaml
    domains:
      - www.corehub.nexus
      - corehub.nexus
      - lexprim.com
      - www.lexprim.com
```

#### Domain Configuration

- **www.corehub.nexus**: Primary web interface (WWW)
- **corehub.nexus**: Root domain (redirects to WWW)
- **lexprim.com**: Alternative domain
- **www.lexprim.com**: Alternative WWW subdomain

**Note**: DNS must be configured separately in Cloudflare or domain registrar.

### Auto-Deploy

```yaml
    autoDeployTrigger: "off"
```

Auto-deploy is disabled to require manual deployment approval. This provides:
- Manual review before deployment
- Control over deployment timing
- Ability to test in staging first

## Validation

### Automated Validation

Run validation before committing changes:

```bash
npm run validate:render
```

This checks:
- YAML syntax
- Required fields present
- Environment variables configured
- Security settings (sync: false)
- Best practices compliance

### Manual Validation

Before deploying:
1. Verify all environment variables are set in Render dashboard
2. Check custom domain DNS configuration
3. Ensure CORS_ORIGINS includes all domains
4. Verify build/start commands are correct

## Updating render.yaml

### When to Update

Update render.yaml when:
- Adding/removing environment variables
- Changing build/start commands
- Adding custom domains
- Changing service configuration
- Updating region or runtime

### Update Process

1. **Edit** `render.yaml` in repository
2. **Validate** with `npm run validate:render`
3. **Test** changes in a staging environment if possible
4. **Commit** changes with descriptive message
5. **Deploy** manually in Render dashboard
6. **Verify** deployment succeeded

### Best Practices

- Always set `sync: false` for environment variables
- Never commit secrets or API keys
- Keep auto-deploy disabled for production
- Document changes in CHANGELOG.md
- Test in staging before production

## Environment Variable Management

### Setting Variables in Render Dashboard

1. Navigate to service in Render dashboard
2. Go to "Environment" tab
3. Add/edit environment variables
4. Click "Save Changes"
5. Service will redeploy automatically

### Security Considerations

- Use strong, unique values for ADMIN_TOKEN
- Rotate API keys regularly
- Never share production credentials
- Use different keys for staging/production

### CORS Configuration

Example CORS_ORIGINS value:
```
https://www.corehub.nexus,https://corehub.nexus,https://lexprim.com,https://www.lexprim.com,https://lexdo.uk,https://www.lexdo.uk
```

Include all:
- Custom domains
- GitHub Pages URLs
- Frontend applications
- Mobile app origins

## Troubleshooting

### Common Issues

**Build Fails**
- Check build command syntax
- Verify package.json scripts
- Review build logs in Render dashboard

**Service Won't Start**
- Check start command
- Verify required environment variables
- Review service logs

**Domain Not Working**
- Verify DNS configuration
- Check SSL certificate status
- Ensure domain is in domains list

**Environment Variables Not Found**
- Verify variables are set in Render dashboard
- Check variable names match code
- Ensure no typos in variable keys

### Getting Help

1. Check [RENDER-DEPLOYMENT-GUIDE.md](../RENDER-DEPLOYMENT-GUIDE.md)
2. Review Render dashboard logs
3. Consult [Render documentation](https://render.com/docs)
4. Contact development team

## Related Documentation

- [RENDER-DEPLOYMENT-GUIDE.md](../RENDER-DEPLOYMENT-GUIDE.md) - Comprehensive deployment guide
- [.env.example](../.env.example) - Environment variables template
- [SECURITY.md](../SECURITY.md) - Security best practices
- [README.md](../README.md) - Project overview

## Changelog

- **2026-02-20**: Updated to production configuration with SR.BSM service name, Virginia region, 10 env vars, 4 custom domains

---

**Last Updated**: 2026-02-20  
**Configuration Version**: 1.0  
**Service Name**: SR.BSM
