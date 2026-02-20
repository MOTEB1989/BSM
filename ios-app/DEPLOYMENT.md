# دليل النشر - CoreHub Nexus iOS App

دليل خطوة بخطوة لنشر تطبيق CoreHub Nexus على corehub.nexus

## 🚀 خيارات النشر

### الخيار 1: Cloudflare Pages (الموصى به)

#### المتطلبات
- حساب Cloudflare
- نطاق corehub.nexus مضاف إلى Cloudflare
- اتصال GitHub مع repository

#### خطوات النشر

1. **الاتصال بـ Cloudflare Pages**
   ```bash
   # من GitHub، اذهب إلى:
   # Cloudflare Dashboard → Pages → Create a project → Connect to Git
   ```

2. **تكوين المشروع**
   ```
   Project name: corehub-nexus-ios
   Production branch: main
   Build command: (none)
   Build output directory: ios-app
   Root directory: /
   ```

3. **إضافة متغيرات البيئة**
   ```
   NODE_ENV=production
   ```

4. **تكوين النطاق المخصص**
   - اذهب إلى Custom domains
   - أضف: corehub.nexus
   - Cloudflare ستضيف CNAME تلقائياً

5. **Deploy**
   ```bash
   git push origin main
   # Cloudflare Pages ستبني ونشر تلقائياً
   ```

#### Cloudflare Workers (اختياري)
إذا كنت تريد إضافة Edge Functions:

```javascript
// workers/ios-app.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Redirect root to /ios-app
    if (url.pathname === '/') {
      return Response.redirect(new URL('/ios-app/', request.url), 302);
    }
    
    // Serve ios-app
    const response = await fetch(request);
    
    // Add custom headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Frame-Options', 'SAMEORIGIN');
    newHeaders.set('X-Content-Type-Options', 'nosniff');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
};
```

### الخيار 2: Render.com (الحالي)

أضف إلى `render.yaml`:

```yaml
services:
  # ... الخدمات الحالية ...
  
  - type: web
    name: corehub-nexus-ios
    env: static
    buildCommand: echo "No build needed"
    staticPublishPath: ./ios-app
    domains:
      - corehub.nexus
    headers:
      - path: /*
        name: X-Frame-Options
        value: SAMEORIGIN
      - path: /*
        name: X-Content-Type-Options
        value: nosniff
      - path: /manifest.json
        name: Content-Type
        value: application/manifest+json
      - path: /sw.js
        name: Service-Worker-Allowed
        value: /ios-app/
    routes:
      - type: rewrite
        source: /ios-app/*
        destination: /ios-app/index.html
```

أو استخدم الخدمة الحالية:
```yaml
services:
  - type: web
    name: sr-bsm
    # ... التكوين الحالي ...
    staticPublishPath: ./
    routes:
      - type: rewrite
        source: /ios-app/*
        destination: /ios-app/index.html
```

### الخيار 3: Netlify

1. **إنشاء netlify.toml**
   ```toml
   [build]
     publish = "ios-app"
     command = "echo 'No build needed'"
   
   [[redirects]]
     from = "/ios-app/*"
     to = "/ios-app/index.html"
     status = 200
   
   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "SAMEORIGIN"
       X-Content-Type-Options = "nosniff"
   
   [[headers]]
     for = "/manifest.json"
     [headers.values]
       Content-Type = "application/manifest+json"
   
   [[headers]]
     for = "/sw.js"
     [headers.values]
       Service-Worker-Allowed = "/ios-app/"
   ```

2. **Deploy**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify init
   netlify deploy --prod
   ```

### الخيار 4: Vercel

1. **إنشاء vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "ios-app/**",
         "use": "@vercel/static"
       }
     ],
     "routes": [
       {
         "src": "/ios-app/(.*)",
         "dest": "/ios-app/index.html"
       }
     ],
     "headers": [
       {
         "source": "/ios-app/(.*)",
         "headers": [
           {
             "key": "X-Frame-Options",
             "value": "SAMEORIGIN"
           },
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           }
         ]
       }
     ]
   }
   ```

2. **Deploy**
   ```bash
   npm i -g vercel
   vercel login
   vercel --prod
   ```

## 🔧 التكوين بعد النشر

### 1. تحديث API URL
إذا كان API على نطاق مختلف، حدّث في `ios-app/app.js`:
```javascript
apiBaseUrl: 'https://sr-bsm.onrender.com'
```

أو أضف في HTML:
```html
<meta name="api-base-url" content="https://sr-bsm.onrender.com" />
```

### 2. تكوين CORS
في `.env` على سيرفر API:
```bash
CORS_ORIGINS=https://corehub.nexus,https://www.corehub.nexus
```

### 3. SSL/HTTPS
تأكد من أن:
- ✅ الموقع يعمل على HTTPS
- ✅ Service Worker يُحمّل على HTTPS فقط
- ✅ Mixed Content غير موجود

### 4. DNS Configuration
في Cloudflare DNS:
```
Type: CNAME
Name: corehub.nexus
Target: [your-deployment].pages.dev
Proxy: ✅ Proxied (Orange Cloud)
```

## 📊 التحقق من النشر

### اختبارات يجب إجراؤها:

1. **فتح الموقع**
   ```
   https://corehub.nexus/ios-app/
   ```

2. **فحص Service Worker**
   - افتح DevTools
   - اذهب إلى Application → Service Workers
   - تحقق من التسجيل الناجح

3. **فحص Manifest**
   - Application → Manifest
   - تحقق من جميع الحقول

4. **فحص PWA**
   - Lighthouse Audit
   - تحقق من نتيجة PWA = 100

5. **اختبار على iPhone**
   - افتح في Safari
   - Share → Add to Home Screen
   - افتح التطبيق من الشاشة الرئيسية

### أوامر الفحص السريع:

```bash
# فحص HTTPS
curl -I https://corehub.nexus/ios-app/

# فحص Manifest
curl https://corehub.nexus/ios-app/manifest.json

# فحص Service Worker
curl https://corehub.nexus/ios-app/sw.js

# Lighthouse audit
lighthouse https://corehub.nexus/ios-app/ --view
```

## 🐛 استكشاف الأخطاء الشائعة

### المشكلة 1: 404 Not Found
**الأسباب:**
- المسار غير صحيح
- Build directory خاطئ

**الحل:**
```bash
# تحقق من بنية المجلد
ls -la ios-app/
# يجب أن تحتوي على: index.html, app.js, manifest.json, sw.js
```

### المشكلة 2: Service Worker لا يعمل
**الأسباب:**
- الموقع ليس على HTTPS
- Scope غير صحيح

**الحل:**
```javascript
// في sw.js، تحقق من:
const CACHE_NAME = 'corehub-nexus-v1';
const OFFLINE_URL = '/ios-app/index.html';

// في index.html، تحقق من:
navigator.serviceWorker.register('/ios-app/sw.js', { 
  scope: '/ios-app/' 
})
```

### المشكلة 3: CORS Error
**الأسباب:**
- API لا يسمح بالنطاق

**الحل:**
```bash
# في سيرفر API
export CORS_ORIGINS=https://corehub.nexus,https://www.corehub.nexus
```

### المشكلة 4: Manifest لا يظهر
**الأسباب:**
- Content-Type خاطئ
- مسار غير صحيح

**الحل:**
```html
<!-- تحقق من -->
<link rel="manifest" href="manifest.json" />
<!-- أو المسار الكامل -->
<link rel="manifest" href="/ios-app/manifest.json" />
```

## 📈 تحسين الأداء

### 1. Enable Compression
في Cloudflare:
- Auto Minify: HTML, CSS, JS ✅
- Brotli Compression ✅

### 2. Cache Settings
```
Browser Cache TTL: 4 hours
Edge Cache TTL: 2 hours
```

### 3. CDN Optimization
استخدم Cloudflare CDN لـ:
- Static assets
- Images
- Scripts

### 4. Service Worker Strategy
```javascript
// Network-first for API
// Cache-first for static assets
```

## 🔒 الأمان

### Headers مطلوبة:
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000
Referrer-Policy: no-referrer-when-downgrade
Permissions-Policy: geolocation=(), camera=(), microphone=()
```

### CSP Policy:
```
default-src 'self';
script-src 'self' 'unsafe-eval' https://unpkg.com https://cdn.tailwindcss.com https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
connect-src 'self' https://sr-bsm.onrender.com;
```

## 📞 الدعم

للمساعدة:
- افتح Issue على GitHub
- راجع logs في Cloudflare Dashboard
- استخدم Browser DevTools للتشخيص

---

**ملاحظة:** هذا الدليل محدّث اعتباراً من 2026-02-20. راجع الوثائق الرسمية لكل منصة للحصول على آخر التحديثات.
