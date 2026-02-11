# LexBANK Chat Interface

> واجهة الدردشة الذكية من منصة LexBANK - مدعومة بتقنية GPT

## نظرة عامة (Overview)

واجهة دردشة تفاعلية متعددة اللغات (عربي/إنجليزي) مبنية على Vue 3 و Tailwind CSS. تدعم الدردشة المباشرة مع GPT والوكلاء المتخصصين.

## المميزات (Features)

### 🎯 أوضاع الدردشة
- **دردشة مباشرة** - GPT مباشر مع الاحتفاظ بسجل المحادثة
- **الوكيل القانوني** - تحليل قانوني متخصص
- **وكيل الحوكمة** - استشارات حوكمة مؤسسية

### 🌐 دعم اللغات
- العربية (Arabic) - RTL
- الإنجليزية (English) - LTR
- تبديل سهل بين اللغتين

### 🎨 التصميم
- وضع داكن احترافي
- تصميم متجاوب (Mobile-first)
- رسوم متحركة سلسة
- أيقونات تفاعلية
- إجراءات سريعة للبدء

### 🔒 الأمان
- Content Security Policy (CSP)
- CORS محمي
- معدل تحديد الطلبات
- حماية ضد XSS

## البنية التقنية (Tech Stack)

- **Framework**: Vue 3 (Composition API)
- **Styling**: Tailwind CSS
- **Markdown**: Marked.js
- **Backend**: Express.js
- **AI**: OpenAI GPT-4o-mini

## الملفات (Files)

```
src/chat/
├── index.html           # واجهة HTML الرئيسية
├── app.js              # منطق Vue.js و API calls
├── styles.css          # تنسيقات مخصصة
├── tailwind.config.js  # إعدادات Tailwind
├── key-status-display.js # عرض حالة مفاتيح API
└── README.md           # هذا الملف
```

## الاستخدام (Usage)

### الوصول للواجهة
```bash
# تشغيل الخادم
npm start

# افتح المتصفح
http://localhost:3000/chat/
```

### نقاط النهاية (API Endpoints)

#### 1. الدردشة المباشرة
```javascript
POST /api/chat/direct
Content-Type: application/json

{
  "message": "مرحبا، كيف يمكنك مساعدتي؟",
  "language": "ar",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

#### 2. الدردشة بالوكلاء
```javascript
POST /api/chat
Content-Type: application/json

{
  "agentId": "legal-agent",
  "input": "ما هي أنواع الشركات في السعودية؟"
}
```

#### 3. حالة مفاتيح الذكاء الاصطناعي
```javascript
GET /api/chat/key-status

// Response
{
  "timestamp": "2026-01-01T10:00:00.000Z",
  "status": {
    "openai": true,
    "anthropic": false,
    "perplexity": true,
    "google": false
  },
  "ui": {
    "openai": "✅ GPT-4 Ready",
    "anthropic": "🔴 Claude Offline",
    "perplexity": "✅ Perplexity Ready",
    "google": "🔴 Gemini Offline"
  }
}
```

### مثال كود (Code Example)

```javascript
// إرسال رسالة
async function sendMessage(text) {
  const response = await fetch('/api/chat/direct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: text,
      language: 'ar',
      history: []
    })
  });
  
  const data = await response.json();
  return data.output;
}
```

## الإعدادات (Configuration)

### متغيرات البيئة المطلوبة

```env
# OpenAI API Key
OPENAI_BSU_KEY=sk-xxxxxxxxxxxxx

# Server Settings
PORT=3000
NODE_ENV=production

# CORS Origins
CORS_ORIGINS=https://your-domain.com,https://lexprim.com,https://www.lexprim.com

# Admin Token
ADMIN_TOKEN=secure-token-16-chars
```

### إعدادات CSP

يتم تكوينها تلقائياً في `src/app.js`:

```javascript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-eval'",  // مطلوب لـ Vue
      "https://unpkg.com",
      "https://cdn.tailwindcss.com",
      "https://cdn.jsdelivr.net"
    ],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:"],
    connectSrc: ["'self'", ...env.corsOrigins]
  }
}
```

## التخصيص (Customization)

### تغيير الألوان

في `tailwind.config.js`:

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        lex: {
          400: '#8b5cf6',
          500: '#7c3aed',
          600: '#6d28d9',  // اللون الأساسي
          700: '#5b21b6'
        }
      }
    }
  }
};
```

### إضافة إجراءات سريعة

في `app.js`:

```javascript
const quickActions = computed(() => {
  if (lang.value === 'ar') {
    return [
      { icon: '⚖️', text: 'سؤالك هنا' },
      // أضف المزيد...
    ];
  }
  return [
    { icon: '⚖️', text: 'Your question here' },
    // Add more...
  ];
});
```

### إضافة وضع دردشة جديد

1. أضف الوكيل في `data/agents/`
2. أضف إلى القائمة في `index.html`:

```html
<button @click="setMode('new-agent')" class="...">
  {{ lang === 'ar' ? 'وكيل جديد' : 'New Agent' }}
</button>
```

## استكشاف الأخطاء (Troubleshooting)

### المشكلة: "AI service is not configured"
**الحل**: أضف `OPENAI_BSM_KEY` أو `OPENAI_API_KEY` إلى ملف `.env`

### المشكلة: "CORS error"
**الحل**: أضف أصل الطلب إلى `CORS_ORIGINS` في `.env`

### المشكلة: CDN resources blocked
**الحل**: تحقق من إعدادات CSP في `src/app.js`

### المشكلة: الواجهة لا تعمل في Production
**الحل**: 
1. تأكد من تثبيت المكتبات: `npm ci`
2. تحقق من المتغيرات البيئية
3. راجع logs: `pm2 logs` أو `docker logs`

### المشكلة: `GET /api/health` لا يعمل (خصوصًا على Render)
**تشخيص أدق (بدون افتراض أن route مفقود):**
1. تحقّق من **base path** الفعلي على Render (بعض الإعدادات تمرر الخدمة تحت مسار مختلف).
2. تحقّق من إعدادات **reverse proxy** أو أي ingress أمام التطبيق (قد يعيد كتابة المسار).
3. تأكد من عدم وجود **mismatch** بين المسار المتوقع `/api/health` والمسار النهائي بعد إعادة الكتابة.

**أوامر سريعة للتحقق:**
```bash
# اختبر endpoint كما تراه الخدمة داخليًا
curl http://localhost:3000/api/health

# اختبر endpoint الخارجي بعد النشر
curl https://your-app.onrender.com/api/health
```

## الأداء (Performance)

### تحسينات مطبقة
- ✅ CDN caching للمكتبات
- ✅ Gzip compression
- ✅ CSS minification
- ✅ Lazy loading للرسائل
- ✅ Virtual scrolling للمحادثات الطويلة

### معايير الأداء
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Message send latency: < 2s (بدون GPT)

## الأمان (Security)

### ممارسات مطبقة
- ✅ CSP Headers
- ✅ XSS Protection
- ✅ Rate Limiting
- ✅ Input Validation
- ✅ HTTPS في Production
- ✅ Secure cookies
- ✅ CORS protection

### التدقيق الأمني
```bash
# فحص الثغرات
npm audit

# فحص الأسرار
npm run gitleaks
```

## الاختبار (Testing)

### اختبار يدوي
```bash
# 1. تشغيل الخادم
npm start

# 2. في متصفح آخر
curl http://localhost:3000/api/health

# 3. افتح الواجهة
open http://localhost:3000/chat/
```

### اختبار API
```bash
# دردشة مباشرة
curl -X POST http://localhost:3000/api/chat/direct \
  -H "Content-Type: application/json" \
  -d '{"message":"مرحبا","language":"ar"}'

# وكيل
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"agentId":"legal-agent","input":"سؤال"}'
```

## النشر (Deployment)

### Render.com (موصى به)
```yaml
# render.yaml
services:
  - type: web
    name: bsu-api
    env: node
    buildCommand: npm ci
    startCommand: npm start
    envVars:
      - key: OPENAI_BSU_KEY
        sync: false
      - key: NODE_ENV
        value: production
```

### Docker
```bash
# بناء
docker build -t lexbank-chat .

# تشغيل
docker run -p 3000:3000 \
  -e OPENAI_BSU_KEY=sk-xxx \
  -e NODE_ENV=production \
  lexbank-chat
```

## المساهمة (Contributing)

عند إضافة ميزات جديدة:
1. حافظ على التصميم المتجاوب
2. اختبر في Arabic RTL
3. أضف التوثيق
4. اتبع معايير الكود

## الترخيص (License)

خاص - LexBANK Platform

## الدعم (Support)

للمشاكل والاستفسارات:
- GitHub Issues: [LexBANK/BSM](https://github.com/LexBANK/BSM/issues)
- Documentation: [lexdo.uk](https://lexdo.uk)

---

Built with ❤️ by LexBANK Team
