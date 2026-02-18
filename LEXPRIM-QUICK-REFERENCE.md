# بطاقة مرجعية سريعة - lexprim.com

## تكوين سريع (Quick Setup)

### 1. DNS على Cloudflare
```
api.lexprim.com → CNAME → sr-bsm.onrender.com (Proxied)
lexprim.com → A → 185.199.108-111.153 (4 records)
www.lexprim.com → CNAME → lexbank.github.io (DNS only)
```

### 2. متغيرات البيئة على Render
```bash
CORS_ORIGINS=https://lexprim.com,https://www.lexprim.com,https://lexdo.uk,https://www.lexdo.uk
```

### 3. CNAME في GitHub
```bash
echo "www.lexprim.com" > docs/CNAME
```

### 4. API URL في docs/index.html
```html
<meta name="api-base-url" content="https://api.lexprim.com" />
```

## اختبار سريع (Quick Test)

```bash
# DNS
nslookup lexprim.com

# API Health
curl https://api.lexprim.com/api/health

# Chat Test
curl -X POST https://api.lexprim.com/api/chat/direct \
  -H "Content-Type: application/json" \
  -d '{"message":"مرحبا","language":"ar"}'
```

## روابط مفيدة (Useful Links)

- 📖 دليل النشر الكامل: [docs/LEXPRIM-DEPLOYMENT.md](docs/LEXPRIM-DEPLOYMENT.md)
- 🌐 Cloudflare Dashboard: https://dash.cloudflare.com
- 🚀 Render Dashboard: https://dashboard.render.com
- 📄 GitHub Pages Settings: https://github.com/LexBANK/BSM/settings/pages

## حل المشاكل السريع (Quick Troubleshooting)

| المشكلة | الحل السريع |
|---------|-------------|
| CORS error | أضف النطاق في CORS_ORIGINS على Render ثم أعد التشغيل |
| API key error | أضف OPENAI_BSM_KEY في Render Environment |
| DNS لا يعمل | انتظر 24 ساعة، تحقق من Cloudflare |
| 404 error | تحقق من CNAME في docs/ وإعدادات GitHub Pages |

## للدعم (Support)

- 🤖 Telegram Bot: @LexFixBot
- 📧 GitHub Issues: https://github.com/LexBANK/BSM/issues
- 📚 Documentation: docs/COMMUNITY.md
