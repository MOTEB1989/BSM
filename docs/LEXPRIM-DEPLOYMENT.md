# دليل نشر LexBANK على lexprim.com

## نظرة عامة

هذا الدليل يشرح كيفية نشر منصة LexBANK على النطاق الجديد `lexprim.com` وربط واجهة الدردشة به.

## الخطوة 1: إعداد DNS

### تكوين Cloudflare

1. **أضف النطاق إلى Cloudflare**
   - قم بتسجيل الدخول إلى [Cloudflare Dashboard](https://dash.cloudflare.com)
   - أضف `lexprim.com` كموقع جديد
   - قم بتحديث nameservers عند مزود النطاق الخاص بك

2. **إعداد سجلات DNS للباك إند (Backend API)**

   إذا كنت تستخدم Render.com للباك إند:
   ```
   Type: CNAME
   Name: api
   Target: sr-bsm.onrender.com
   Proxy: ✓ Proxied (البرتقالي)
   ```

   أو إذا كنت تريد نطاق فرعي للباك إند:
   ```
   Type: CNAME
   Name: api
   Target: <your-render-service>.onrender.com
   Proxy: ✓ Proxied
   ```

3. **إعداد سجلات DNS للواجهة الأمامية (Frontend)**

   **الخيار أ: استخدام GitHub Pages**
   ```
   Type: A (أضف 4 سجلات)
   Name: @
   Value: 185.199.108.153
   Value: 185.199.109.153
   Value: 185.199.110.153
   Value: 185.199.111.153
   
   Type: CNAME
   Name: www
   Target: lexbank.github.io
   Proxy: ✗ DNS only (رمادي)
   ```

   **الخيار ب: استخدام Cloudflare Pages**
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

## الخطوة 2: تكوين الخادم (Backend)

### تحديث متغيرات البيئة على Render.com

1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. اختر خدمتك (`bsu-api`)
3. اذهب إلى **Environment**
4. أضف/حدّث المتغيرات التالية:

```bash
# إضافة النطاق الجديد إلى CORS
CORS_ORIGINS=https://lexprim.com,https://www.lexprim.com,https://lexdo.uk,https://www.lexdo.uk

# التأكد من وجود المفاتيح الضرورية
OPENAI_BSM_KEY=<your-openai-key>
ADMIN_TOKEN=<your-secure-token>
NODE_ENV=production
```

5. احفظ التغييرات (سيتم إعادة تشغيل الخدمة تلقائياً)

### اختبار الباك إند

```bash
# اختبار الصحة
curl https://api.lexprim.com/api/health

# اختبار قائمة الوكلاء
curl https://api.lexprim.com/api/agents

# اختبار CORS (من المتصفح أو باستخدام أدوات)
curl -H "Origin: https://lexprim.com" -H "Access-Control-Request-Method: POST" \
  -X OPTIONS https://api.lexprim.com/api/chat/direct
```

## الخطوة 3: نشر الواجهة الأمامية

### الخيار أ: GitHub Pages

1. **إعداد Repository**
   ```bash
   # انتقل إلى Settings > Pages في GitHub repository
   # اختر Source: Deploy from a branch
   # اختر Branch: main, Folder: /docs
   ```

2. **تكوين النطاق المخصص**
   - في GitHub Pages settings، أضف `www.lexprim.com` كنطاق مخصص
   - انتظر التحقق من DNS (قد يستغرق بضع دقائق)
   - فعّل "Enforce HTTPS"

3. **تحديث CNAME في المستودع**
   ```bash
   echo "www.lexprim.com" > docs/CNAME
   git add docs/CNAME
   git commit -m "Add lexprim.com to GitHub Pages"
   git push
   ```

4. **تحديث API URL في الواجهة**
   
   عدّل `docs/index.html`:
   ```html
   <meta name="api-base-url" content="https://api.lexprim.com" />
   ```

### الخيار ب: Cloudflare Pages

1. **إنشاء مشروع Cloudflare Pages**
   ```bash
   # ربط GitHub repository
   # Build command: (none)
   # Build output directory: /docs
   # Root directory: /
   ```

2. **تكوين النطاق المخصص**
   - في Cloudflare Pages > Custom domains
   - أضف `lexprim.com` و `www.lexprim.com`

3. **تكوين متغيرات البيئة**
   ```
   API_BASE_URL=https://api.lexprim.com
   ```

### الخيار ج: نشر على خادم خاص

إذا كنت تريد نشر كل شيء على خادم واحد:

```bash
# على الخادم
git clone https://github.com/LexBANK/BSM.git
cd BSM
npm ci

# إنشاء .env
cat > .env << EOF
NODE_ENV=production
PORT=3000
OPENAI_BSM_KEY=<your-key>
ADMIN_TOKEN=<your-token>
CORS_ORIGINS=https://lexprim.com,https://www.lexprim.com
EOF

# تشغيل بواسطة PM2
npm install -g pm2
pm2 start src/server.js --name bsu-api
pm2 save
pm2 startup

# إعداد Nginx كبروكسي عكسي
# انظر القسم التالي
```

## الخطوة 4: إعداد Nginx (اختياري)

إذا كنت تستخدم خادم خاص مع Nginx:

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

    # تقديم الواجهة الأمامية من docs/
    root /var/www/BSM/docs;
    index index.html;

    # معالجة طلبات API
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

    # تقديم ملفات ثابتة أخرى
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

تفعيل الموقع:
```bash
sudo ln -s /etc/nginx/sites-available/lexprim.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# الحصول على شهادة SSL
sudo certbot --nginx -d lexprim.com -d www.lexprim.com
```

## الخطوة 5: اختبار النشر

### اختبار الواجهة الأمامية

1. افتح `https://lexprim.com` في المتصفح
2. يجب أن تظهر واجهة الدردشة
3. تحقق من Console في أدوات المطور (F12) للتأكد من عدم وجود أخطاء CORS

### اختبار الدردشة

1. اكتب رسالة في صندوق الإدخال
2. اضغط "إرسال"
3. يجب أن تحصل على رد من GPT

### اختبار شامل

```bash
# اختبار DNS
nslookup lexprim.com
nslookup www.lexprim.com
nslookup api.lexprim.com

# اختبار SSL
curl -I https://lexprim.com
curl -I https://www.lexprim.com
curl -I https://api.lexprim.com

# اختبار API
curl https://api.lexprim.com/api/health
curl https://api.lexprim.com/api/agents

# اختبار الدردشة (مع مفتاح API صحيح)
curl -X POST https://api.lexprim.com/api/chat/direct \
  -H "Content-Type: application/json" \
  -d '{"message":"مرحبا","language":"ar"}'
```

## الخطوة 6: المراقبة والصيانة

### مراقبة الخدمة

```bash
# إذا كنت تستخدم PM2
pm2 status
pm2 logs bsu-api
pm2 monit

# فحص سجلات Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### تحديثات منتظمة

```bash
# تحديث الكود
cd /var/www/BSM  # أو المسار الخاص بك
git pull
npm ci
pm2 restart bsu-api
```

## حل المشاكل الشائعة

### مشكلة: "CORS error" في Console

**الحل:**
1. تحقق من أن `CORS_ORIGINS` في متغيرات البيئة يتضمن النطاق الصحيح
2. تأكد من أن النطاق بالتنسيق الصحيح: `https://lexprim.com` (بدون شرطة مائلة نهائية)
3. أعد تشغيل الخدمة بعد تغيير المتغيرات

### مشكلة: "API key not configured"

**الحل:**
1. تأكد من إضافة `OPENAI_BSM_KEY` في متغيرات البيئة على Render
2. القيمة يجب أن تبدأ بـ `sk-`
3. أعد نشر الخدمة بعد إضافة المفتاح

### مشكلة: الدردشة لا تعمل

**الحل:**
1. افتح Console في المتصفح (F12)
2. تحقق من أخطاء JavaScript أو CORS
3. تأكد من أن `meta[name="api-base-url"]` يشير إلى URL صحيح
4. اختبر API مباشرة باستخدام `curl` أو Postman

### مشكلة: DNS لا يعمل

**الحل:**
1. انتظر حتى 24-48 ساعة لانتشار DNS
2. استخدم `dig` أو `nslookup` للتحقق
3. تأكد من تكوين Cloudflare بشكل صحيح
4. تحقق من حالة البروكسي (برتقالي = Proxied، رمادي = DNS only)

## الموارد الإضافية

- [Render Documentation](https://render.com/docs)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [GitHub Pages Documentation](https://docs.github.com/pages)
- [BSU Platform Documentation](../README.md)
- [Security & Deployment Guide](./SECURITY-DEPLOYMENT.md)

## الدعم

إذا واجهت مشاكل:
1. تحقق من [GitHub Issues](https://github.com/LexBANK/BSM/issues)
2. راجع [Community & Support](./COMMUNITY.md)
3. اتصل بـ LexFixBot على Telegram: [@LexFixBot](https://t.me/LexFixBot)

---

**آخر تحديث:** 2026-02-11  
**الإصدار:** 1.0.0  
**الحالة:** ✅ جاهز للإنتاج
