# LexPrim Chat - Nuxt 3 Mobile-First Interface

> واجهة دردشة حديثة مبنية على Nuxt 3 لمنصة LexBANK على lexprim.com

## نظرة عامة

تطبيق Nuxt 3 حديث ومحسّن للجوال يوفر واجهة دردشة احترافية للتفاعل مع منصة BSM.

### المميزات

- ✅ **Mobile-First Design** - محسّن للهواتف المحمولة
- ✅ **Vue 3 Composition API** - أحدث تقنيات Vue
- ✅ **Pinia State Management** - إدارة حالة قوية
- ✅ **RTL Support** - دعم كامل للعربية
- ✅ **Tailwind CSS** - تصميم حديث ومرن
- ✅ **Agent Selection** - اختيار الوكلاء الذكيين
- ✅ **Direct Chat** - دردشة مباشرة مع GPT
- ✅ **Orchestrator Integration** - متصل بـ /api/control/run
- ✅ **No Cloud Lock-in** - قابل للنشر على أي خادم
- ✅ **Private Usage** - لا يتطلب نظام مصادقة عام

## البنية التقنية

```
lexprim-chat/
├── assets/
│   └── styles/
│       ├── main.scss          # أنماط SCSS الرئيسية
│       └── tailwind.css       # Tailwind CSS
├── components/
│   ├── ChatHeader.vue         # رأس الصفحة مع اختيار الوكيل
│   ├── ChatWelcome.vue        # شاشة الترحيب
│   ├── ChatMessage.vue        # فقاعة الرسالة
│   ├── ChatLoading.vue        # مؤشر التحميل
│   ├── ChatError.vue          # عرض الأخطاء
│   └── ChatInput.vue          # مربع الإدخال
├── composables/
│   └── useApi.js              # API communication
├── pages/
│   └── index.vue              # الصفحة الرئيسية
├── stores/
│   └── chat.js                # Pinia store للدردشة
├── app.vue                    # مكون التطبيق الجذري
├── nuxt.config.ts             # إعدادات Nuxt
├── tailwind.config.js         # إعدادات Tailwind
└── package.json               # الحزم والسكربتات
```

## التثبيت

```bash
cd lexprim-chat

# تثبيت الحزم
npm install

# تشغيل بيئة التطوير
npm run dev

# بناء للإنتاج
npm run build

# معاينة البناء
npm run preview

# توليد موقع ثابت
npm run generate
```

## الاستخدام

### تشغيل محلي

```bash
# تشغيل خادم التطوير على http://localhost:3000
npm run dev
```

### متغيرات البيئة

أنشئ ملف `.env`:

```bash
# Base URL للـ API
NUXT_PUBLIC_API_BASE=/api

# أو حدد API خارجي
# NUXT_PUBLIC_API_BASE=https://api.lexprim.com/api

# عنوان الموقع
NUXT_PUBLIC_SITE_URL=https://lexprim.com
```

### الربط مع BSM Backend

التطبيق يتصل بـ endpoints التالية:

1. **GET /api/agents** - قائمة الوكلاء المتاحة
2. **POST /api/chat/direct** - دردشة مباشرة مع GPT
3. **POST /api/control/run** - تشغيل وكيل عبر Orchestrator

#### مثال: Direct Chat

```javascript
POST /api/chat/direct
Content-Type: application/json

{
  "message": "مرحبا",
  "language": "ar",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

#### مثال: Agent Execution

```javascript
POST /api/control/run
Content-Type: application/json

{
  "agentId": "legal-agent",
  "input": "أحتاج مساعدة قانونية",
  "context": {
    "mobile": true,
    "source": "lexprim-chat"
  }
}
```

## النشر

### الخيار 1: Static Generation (GitHub Pages, Cloudflare Pages)

```bash
# توليد موقع ثابت
npm run generate

# الملفات في .output/public/
# ارفعها إلى GitHub Pages أو Cloudflare Pages
```

### الخيار 2: Server-Side Rendering (Node.js)

```bash
# بناء للإنتاج
npm run build

# تشغيل
node .output/server/index.mjs
```

### الخيار 3: Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
```

```bash
docker build -t lexprim-chat .
docker run -p 3000:3000 -e NUXT_PUBLIC_API_BASE=/api lexprim-chat
```

### الخيار 4: دمج مع BSM Backend

لدمج الواجهة مع backend BSM على نفس الخادم:

1. **بناء الواجهة كـ Static Site**:
   ```bash
   cd lexprim-chat
   npm run generate
   ```

2. **نسخ الملفات إلى مجلد public في BSM**:
   ```bash
   cp -r .output/public/* ../src/public/lexprim/
   ```

3. **تكوين Express لخدمة الملفات**:
   ```javascript
   // في src/app.js
   app.use('/lexprim', express.static('src/public/lexprim'))
   ```

4. **الوصول عبر**: `https://api.lexprim.com/lexprim/`

## تكوين Nginx (إنتاج)

```nginx
server {
    listen 443 ssl http2;
    server_name lexprim.com www.lexprim.com;

    ssl_certificate /etc/letsencrypt/live/lexprim.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lexprim.com/privkey.pem;

    # Nuxt 3 Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API Proxy إلى BSM Backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## التطوير

### إضافة وكيل جديد

1. الوكلاء يُحملون تلقائياً من `/api/agents`
2. يظهرون في قائمة اختيار الوكيل في الرأس
3. عند الاختيار، يتم استخدام `/api/control/run`

### تخصيص الألوان

عدّل `tailwind.config.js`:

```javascript
colors: {
  'lex': {
    500: '#0ea5e9',  // اللون الأساسي
    600: '#0284c7',
    // ...
  }
}
```

### إضافة لغة جديدة

1. عدّل `stores/chat.js` لإضافة اللغة
2. أضف الترجمات في المكونات
3. حدّث `toggleLanguage()` function

## Telegram Webhook Integration

لدمج Telegram webhook على نفس النطاق:

1. **في BSM Backend**، endpoint موجود بالفعل:
   ```
   POST /api/webhooks/telegram
   ```

2. **تكوين Telegram Bot**:
   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -d "url=https://lexprim.com/api/webhooks/telegram" \
     -d "secret_token=<SECRET>"
   ```

3. **متغيرات البيئة المطلوبة**:
   ```bash
   TELEGRAM_BOT_TOKEN=<bot-token>
   TELEGRAM_WEBHOOK_SECRET=<secret>
   ORBIT_ADMIN_CHAT_IDS=<comma-separated-chat-ids>
   ```

## الأمان

### Mobile Mode

التطبيق يرسل `mobile: true` في context، مما يفعّل القيود:

```javascript
{
  "context": {
    "mobile": true,
    "source": "lexprim-chat"
  }
}
```

### CORS

تأكد من إضافة lexprim.com في CORS_ORIGINS على backend:

```bash
CORS_ORIGINS=https://lexprim.com,https://www.lexprim.com
```

### Rate Limiting

Backend BSM يطبق rate limiting تلقائياً (100 req / 15 min).

## المشاكل الشائعة

### مشكلة: CORS Error

```bash
# تأكد من إضافة النطاق في backend
CORS_ORIGINS=https://lexprim.com,https://www.lexprim.com
```

### مشكلة: API لا يستجيب

```bash
# تحقق من NUXT_PUBLIC_API_BASE
echo $NUXT_PUBLIC_API_BASE

# أو عدّل .env
NUXT_PUBLIC_API_BASE=https://api.lexprim.com/api
```

### مشكلة: Agents لا تظهر

```bash
# تحقق من endpoint
curl https://api.lexprim.com/api/agents

# يجب أن يعيد JSON array
```

## الاختبار

```bash
# تشغيل في بيئة التطوير
npm run dev

# فتح في المتصفح
open http://localhost:3000

# اختبار على جوال (نفس الشبكة)
# استخدم عنوان IP الخاص بك
http://192.168.1.x:3000
```

## المساهمة

عند إضافة ميزات جديدة:

1. اتبع Vue 3 Composition API
2. استخدم Pinia للـ state management
3. حافظ على دعم RTL
4. اختبر على الجوال أولاً
5. وثّق التغييرات

## الرخصة

خاص - LexBANK Platform

## الدعم

- 📧 GitHub Issues: https://github.com/LexBANK/BSM/issues
- 🤖 Telegram Bot: [@LexFixBot](https://t.me/LexFixBot)
- 📚 Documentation: /docs

---

**الإصدار:** 1.0.0  
**آخر تحديث:** 2026-02-11  
**الحالة:** ✅ جاهز للتطوير
