# LexBANK Deployment Guide for lexprim.com

## Overview

This guide explains how to deploy the LexBANK platform on the new `lexprim.com` domain and connect the chat interface to it.

## Step 1: DNS Setup

### Cloudflare Configuration

1. **Add Domain to Cloudflare**
   - Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Add `lexprim.com` as a new site
   - Update nameservers at your domain registrar

2. **DNS Records for Backend API**

   If using Render.com for backend:
   ```
   Type: CNAME
   Name: api
   Target: sr-bsm.onrender.com
   Proxy: ✓ Proxied (orange cloud)
   ```

   Or for a custom backend subdomain:
   ```
   Type: CNAME
   Name: api
   Target: <your-render-service>.onrender.com
   Proxy: ✓ Proxied
   ```

3. **DNS Records for Frontend**

   **Option A: GitHub Pages**
   ```
   Type: A (add 4 records)
   Name: @
   Value: 185.199.108.153
   Value: 185.199.109.153
   Value: 185.199.110.153
   Value: 185.199.111.153
   
   Type: CNAME
   Name: www
   Target: lexbank.github.io
   Proxy: ✗ DNS only (grey cloud)
   ```

   **Option B: Cloudflare Pages**
   ```
   Type: CNAME
   Name: @
   Target: <your-project>.pages.dev
   Proxy: ✓ Proxied
   
   Type: CNAME
   Name: www
   Target: <your-project>.pages.dev
   Proxy: ✓ Proxied
   ```

## Step 2: Backend Configuration

### Update Environment Variables on Render.com

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your service (`bsu-api`)
3. Go to **Environment**
4. Add/update these variables:

```bash
# Add new domain to CORS
CORS_ORIGINS=https://lexprim.com,https://www.lexprim.com,https://lexdo.uk,https://www.lexdo.uk

# Ensure required keys are present
OPENAI_BSM_KEY=<your-openai-key>
ADMIN_TOKEN=<your-secure-token>
NODE_ENV=production
```

5. Save changes (service will automatically restart)

### Test Backend

```bash
# Test health
curl https://api.lexprim.com/api/health

# Test agents list
curl https://api.lexprim.com/api/agents

# Test CORS (from browser or tools)
curl -H "Origin: https://lexprim.com" -H "Access-Control-Request-Method: POST" \
  -X OPTIONS https://api.lexprim.com/api/chat/direct
```

## Step 3: Frontend Deployment

### Option A: GitHub Pages

1. **Repository Setup**
   ```bash
   # Go to Settings > Pages in GitHub repository
   # Choose Source: Deploy from a branch
   # Choose Branch: main, Folder: /docs
   ```

2. **Custom Domain Configuration**
   - In GitHub Pages settings, add `www.lexprim.com` as custom domain
   - Wait for DNS verification (may take a few minutes)
   - Enable "Enforce HTTPS"

3. **Update CNAME in Repository**
   ```bash
   echo "www.lexprim.com" > docs/CNAME
   git add docs/CNAME
   git commit -m "Add lexprim.com to GitHub Pages"
   git push
   ```

4. **Update API URL in Frontend**
   
   Edit `docs/index.html`:
   ```html
   <meta name="api-base-url" content="https://api.lexprim.com" />
   ```

### Option B: Cloudflare Pages

1. **Create Cloudflare Pages Project**
   ```bash
   # Connect GitHub repository
   # Build command: (none)
   # Build output directory: /docs
   # Root directory: /
   ```

2. **Custom Domain Configuration**
   - In Cloudflare Pages > Custom domains
   - Add `lexprim.com` and `www.lexprim.com`

3. **Environment Variables**
   ```
   API_BASE_URL=https://api.lexprim.com
   ```

### Option C: Self-Hosted

If you want to deploy everything on a single server:

```bash
# On the server
git clone https://github.com/LexBANK/BSM.git
cd BSM
npm ci

# Create .env
cat > .env << EOF
NODE_ENV=production
PORT=3000
OPENAI_BSM_KEY=<your-key>
ADMIN_TOKEN=<your-token>
CORS_ORIGINS=https://lexprim.com,https://www.lexprim.com
EOF

# Run with PM2
npm install -g pm2
pm2 start src/server.js --name bsu-api
pm2 save
pm2 startup

# Setup Nginx as reverse proxy
# See next section
```

## Step 4: Nginx Setup (Optional)

If using a self-hosted server with Nginx:

```nginx
# /etc/nginx/sites-available/lexprim.com
server {
    listen 80;
    server_name lexprim.com www.lexprim.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lexprim.com www.lexprim.com;

    ssl_certificate /etc/letsencrypt/live/lexprim.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lexprim.com/privkey.pem;

    # Serve frontend from docs/
    root /var/www/BSM/docs;
    index index.html;

    # Handle API requests
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/lexprim.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d lexprim.com -d www.lexprim.com
```

## Step 5: Test Deployment

### Test Frontend

1. Open `https://lexprim.com` in browser
2. Chat interface should appear
3. Check Console in developer tools (F12) for CORS errors

### Test Chat

1. Type a message in the input box
2. Click "Send"
3. Should receive a response from GPT

### Comprehensive Testing

```bash
# Test DNS
nslookup lexprim.com
nslookup www.lexprim.com
nslookup api.lexprim.com

# Test SSL
curl -I https://lexprim.com
curl -I https://www.lexprim.com
curl -I https://api.lexprim.com

# Test API
curl https://api.lexprim.com/api/health
curl https://api.lexprim.com/api/agents

# Test chat (with valid API key)
curl -X POST https://api.lexprim.com/api/chat/direct \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","language":"en"}'
```

## Step 6: Monitoring & Maintenance

### Monitor Service

```bash
# If using PM2
pm2 status
pm2 logs bsu-api
pm2 monit

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Regular Updates

```bash
# Update code
cd /var/www/BSM  # or your path
git pull
npm ci
pm2 restart bsu-api
```

## Troubleshooting

### Issue: "CORS error" in Console

**Solution:**
1. Check that `CORS_ORIGINS` in environment variables includes the correct domain
2. Ensure domain is in correct format: `https://lexprim.com` (no trailing slash)
3. Restart service after changing variables

### Issue: "API key not configured"

**Solution:**
1. Ensure `OPENAI_BSM_KEY` is added in environment variables on Render
2. Value must start with `sk-`
3. Redeploy service after adding key

### Issue: Chat not working

**Solution:**
1. Open Console in browser (F12)
2. Check for JavaScript or CORS errors
3. Verify `meta[name="api-base-url"]` points to correct URL
4. Test API directly with `curl` or Postman

### Issue: DNS not resolving

**Solution:**
1. Wait up to 24-48 hours for DNS propagation
2. Use `dig` or `nslookup` to verify
3. Ensure Cloudflare is configured correctly
4. Check proxy status (orange = Proxied, grey = DNS only)

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [GitHub Pages Documentation](https://docs.github.com/pages)
- [BSU Platform Documentation](../README.md)
- [Security & Deployment Guide](./SECURITY-DEPLOYMENT.md)

## Support

If you encounter issues:
1. Check [GitHub Issues](https://github.com/LexBANK/BSM/issues)
2. Review [Community & Support](./COMMUNITY.md)
3. Contact LexFixBot on Telegram: [@LexFixBot](https://t.me/LexFixBot)

---

**Last Updated:** 2026-02-11  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
