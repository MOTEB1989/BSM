# LexPrim Chat Deployment Guide

## Quick Deploy to lexprim.com

### Option 1: Static Site (Recommended for lexprim.com)

```bash
# Build static site
cd lexprim-chat
npm install
npm run generate

# Files will be in .output/public/
# Upload to Cloudflare Pages or GitHub Pages
```

### Option 2: Node.js Server

```bash
# Build and run
npm run build
PORT=3000 node .output/server/index.mjs
```

### Option 3: Integrate with BSM Backend

```bash
# Generate static files
npm run generate

# Copy to BSM static directory
mkdir -p ../src/public/chat
cp -r .output/public/* ../src/public/chat/

# Access via: https://lexprim.com/chat/
```

## Cloudflare Pages Deployment

1. Connect GitHub repository to Cloudflare Pages
2. Set build settings:
   - **Build command**: `cd lexprim-chat && npm run generate`
   - **Build output directory**: `lexprim-chat/.output/public`
   - **Root directory**: `/`
3. Environment variables:
   - `NUXT_PUBLIC_API_BASE`: `https://api.lexprim.com/api`
   - `NUXT_PUBLIC_SITE_URL`: `https://lexprim.com`
4. Add custom domain: `lexprim.com`

## GitHub Pages Deployment

```bash
# In lexprim-chat directory
npm run generate

# Copy to docs/ for GitHub Pages
cp -r .output/public/* ../docs/chat/

# Commit and push
git add ../docs/chat/
git commit -m "Deploy lexprim chat to GitHub Pages"
git push
```

## Environment Variables

```bash
# Development (.env)
NUXT_PUBLIC_API_BASE=/api
NUXT_PUBLIC_SITE_URL=http://localhost:3000

# Production
NUXT_PUBLIC_API_BASE=https://api.lexprim.com/api
NUXT_PUBLIC_SITE_URL=https://lexprim.com
```

## Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name lexprim.com;

    # Nuxt app
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_set_header Host $host;
    }
}
```
