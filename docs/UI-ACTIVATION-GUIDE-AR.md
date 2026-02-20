# 🚀 دليل تفعيل واجهة المستخدم
# UI Activation Guide

**التاريخ:** 2026-02-20  
**الإصدار:** 2.0.0  
**الحالة:** ✅ جاهز للاستخدام

---

## 📋 نظرة عامة

منصة **BSM (Business Service Management)** توفر **4 واجهات مستخدم** مختلفة، كل واحدة مصممة لاستخدام محدد:

1. **واجهة الدردشة الرئيسية** - Chat UI (Vue 3)
2. **لوحة التحكم الإدارية** - Admin Dashboard
3. **تطبيق iOS** - CoreHub Nexus
4. **واجهة Lexprim** - Nuxt 3 Chat Interface

جميع الواجهات **مفعّلة ومجهزة** وجاهزة للاستخدام الفوري.

---

## 🎯 الخطوات السريعة للتفعيل

### الخطوة 1: تثبيت المتطلبات

```bash
# تأكد من وجود Node.js 18+ أو 22+
node --version  # يجب أن يكون v18.0.0 أو أحدث

# استنساخ المستودع
git clone https://github.com/MOTEB1989/BSM.git
cd BSM

# تثبيت الحزم
npm ci
```

### الخطوة 2: إعداد البيئة

```bash
# نسخ ملف البيئة التجريبي
cp .env.example .env

# تحرير الملف وإضافة مفاتيح API
nano .env  # أو استخدم محرر النصوص المفضل
```

**المتغيرات المطلوبة:**

```bash
# مفتاح OpenAI (إلزامي)
OPENAI_BSM_KEY=sk-proj-your-key-here

# رمز الإدارة (إلزامي في الإنتاج)
ADMIN_TOKEN=your-secure-token-minimum-16-chars

# المنفذ (اختياري، الافتراضي 3000)
PORT=3000

# البيئة
NODE_ENV=development
```

### الخطوة 3: تشغيل الخادم

```bash
# وضع التطوير (مع إعادة التحميل التلقائي)
npm run dev

# أو وضع الإنتاج
npm start
```

**النتيجة المتوقعة:**

```
[14:04:38.790] INFO: BSU API started
    port: 3000
    env: "development"
```

### الخطوة 4: الوصول إلى الواجهات

الآن يمكنك الوصول إلى جميع الواجهات! 🎉

---

## 🌐 روابط الوصول

بعد تشغيل الخادم، استخدم الروابط التالية:

### 1️⃣ واجهة الدردشة الرئيسية (Chat UI)

**الرابط المحلي:**
```
http://localhost:3000/chat
```

**الرابط المباشر (إنتاج):**
```
https://bsm.onrender.com/chat
```

**الميزات:**
- ✅ دردشة ثنائية اللغة (عربي/إنجليزي)
- ✅ 3 أوضاع: المساعد الذكي، الوكيل القانوني، وكيل الحوكمة
- ✅ دعم PWA (تطبيق ويب تقدمي)
- ✅ Service Worker للعمل بلا إنترنت
- ✅ واجهة عصرية بتصميم Tailwind CSS

**لقطة شاشة:**

![Chat UI](https://via.placeholder.com/800x600.png?text=Chat+UI+Screenshot)

---

### 2️⃣ لوحة التحكم الإدارية (Admin Dashboard)

**الرابط المحلي:**
```
http://localhost:3000/admin
```

**الرابط المباشر (إنتاج):**
```
https://bsm.onrender.com/admin
```

**المصادقة:**
- اسم المستخدم: `admin`
- كلمة المرور: (قيمة `ADMIN_TOKEN` من ملف `.env`)

**الميزات:**
- ✅ إدارة الوكلاء
- ✅ إدارة قاعدة المعرفة
- ✅ مراقبة النظام
- ✅ عرض السجلات

---

### 3️⃣ تطبيق iOS (CoreHub Nexus)

**الرابط المحلي:**
```
http://localhost:3000/ios-app
```

**الرابط المباشر (إنتاج):**
```
https://bsm.onrender.com/ios-app
```

**الميزات:**
- ✅ محسّن لأجهزة iPhone
- ✅ دعم Safe Area
- ✅ دعم PWA للتثبيت
- ✅ تجربة تطبيق أصلي

**تثبيت على iPhone:**
1. افتح الرابط في Safari
2. اضغط على زر المشاركة
3. اختر "إضافة إلى الشاشة الرئيسية"

---

### 4️⃣ واجهة Lexprim (Nuxt 3)

**الموقع:** `lexprim-chat/`

**التشغيل:**

```bash
cd lexprim-chat
npm install
npm run dev
```

**الرابط المحلي:**
```
http://localhost:3001
```

**الميزات:**
- ✅ بنية Nuxt 3
- ✅ إدارة الحالة مع Pinia
- ✅ مكونات Vue 3 حديثة
- ✅ Composables API

---

## 🔧 الإطارات والتقنيات المستخدمة

### 1. واجهة الدردشة الرئيسية

| المكون | التقنية | الإصدار |
|--------|---------|---------|
| الإطار | Vue 3 | 3.4+ |
| CSS | Tailwind CSS | 3.4+ |
| الأيقونات | Lucide Icons | Latest |
| PWA | Service Worker | - |
| التخزين | localStorage | - |

**الملفات الرئيسية:**
- `src/chat/index.html` - الصفحة الرئيسية
- `src/chat/app.js` - منطق التطبيق
- `src/chat/styles.css` - الأنماط المخصصة
- `src/chat/manifest.json` - ملف PWA
- `src/chat/sw.js` - Service Worker

### 2. لوحة التحكم الإدارية

| المكون | التقنية |
|--------|---------|
| HTML | Vanilla HTML5 |
| CSS | Custom CSS |
| JavaScript | ES6+ |
| المصادقة | HTTP Basic Auth |

**الملفات:**
- `src/admin/index.html`
- `src/admin/app.js`
- `src/admin/styles.css`

### 3. تطبيق iOS

| المكون | التقنية |
|--------|---------|
| الإطار | Vue 3 |
| CSS | Tailwind CSS |
| PWA | Service Worker |
| تحسينات iOS | viewport-fit=cover |

**الملفات:**
- `ios-app/index.html`
- `ios-app/app.js`
- `ios-app/manifest.json`
- `ios-app/sw.js`

### 4. واجهة Lexprim

| المكون | التقنية | الإصدار |
|--------|---------|---------|
| الإطار | Nuxt 3 | 3.10+ |
| إدارة الحالة | Pinia | Latest |
| Composables | useApi | Custom |
| مكونات | Vue 3 SFC | - |

**المكونات:**
- `ChatHeader.vue`
- `ChatInput.vue`
- `ChatMessage.vue`
- `ChatError.vue`
- `ChatLoading.vue`
- `ChatWelcome.vue`

---

## 📡 API Endpoints

جميع الواجهات تتصل بنفس API Backend:

### نقاط النهاية العامة

```
GET  /health                  # فحص الصحة
GET  /api/health              # فحص صحة API
GET  /api/health/detailed     # فحص شامل
GET  /api/status              # حالة النظام
GET  /api/agents              # قائمة الوكلاء
GET  /api/knowledge           # قاعدة المعرفة
```

### نقاط نهاية الدردشة

```
POST /api/chat                # دردشة الوكلاء
POST /api/chat/direct         # دردشة مباشرة مع GPT
GET  /api/chat/key-status     # حالة مفاتيح AI
```

**مثال طلب دردشة:**

```bash
curl -X POST http://localhost:3000/api/chat/direct \
  -H "Content-Type: application/json" \
  -d '{
    "message": "مرحباً، كيف يمكنني المساعدة؟",
    "language": "ar"
  }'
```

**الاستجابة:**

```json
{
  "output": "مرحباً! أنا مساعد BSM الذكي. كيف يمكنني مساعدتك اليوم؟"
}
```

---

## 🔒 الأمان والصلاحيات

### واجهة الدردشة (مفتوحة)

- ✅ لا تحتاج مصادقة
- ✅ محمية بـ Rate Limiting (100 طلب/15 دقيقة)
- ✅ CSP Headers مطبقة
- ✅ CORS مضبوط

### لوحة التحكم (محمية)

- 🔐 تتطلب HTTP Basic Auth
- 🔐 اسم المستخدم: `admin`
- 🔐 كلمة المرور: `ADMIN_TOKEN`
- ✅ حماية ضد Timing Attacks

### تطبيق iOS (مفتوح)

- ✅ نفس حماية واجهة الدردشة
- ✅ تحسينات أمان Safari
- ✅ HTTPS إلزامي في الإنتاج

---

## 🧪 الاختبار والتحقق

### 1. اختبار الصحة

```bash
# فحص سريع
npm run health

# فحص مفصل
npm run health:detailed
```

### 2. اختبار API

```bash
# فحص نقطة الصحة
curl http://localhost:3000/api/health

# قائمة الوكلاء
curl http://localhost:3000/api/agents

# حالة مفاتيح AI
curl http://localhost:3000/api/chat/key-status
```

### 3. اختبار الواجهات

```bash
# واجهة الدردشة
curl http://localhost:3000/chat/ | grep -o "<title>.*</title>"

# لوحة التحكم (مع المصادقة)
curl -u admin:your-token http://localhost:3000/admin/ | head -20

# تطبيق iOS
curl http://localhost:3000/ios-app/ | grep -o "<title>.*</title>"
```

---

## 🚀 النشر

### Render.com (موصى به)

الملف `render.yaml` معد مسبقاً:

```yaml
services:
  - type: web
    name: bsm-api
    env: node
    buildCommand: npm ci
    startCommand: npm start
    envVars:
      - key: OPENAI_BSM_KEY
        sync: false
      - key: ADMIN_TOKEN
        generateValue: true
      - key: NODE_ENV
        value: production
```

**الروابط بعد النشر:**
- Chat UI: `https://your-app.onrender.com/chat`
- Admin: `https://your-app.onrender.com/admin`
- iOS App: `https://your-app.onrender.com/ios-app`

### Docker

```bash
# بناء الصورة
docker build -t bsm-app .

# تشغيل الحاوية
docker run -p 3000:3000 \
  -e OPENAI_BSM_KEY=your-key \
  -e ADMIN_TOKEN=your-token \
  bsm-app
```

### Docker Compose

```bash
# مع MySQL + Redis
docker-compose -f docker-compose.mysql.yml up -d

# كامل مع Go services
docker-compose -f docker-compose.hybrid.yml up -d
```

---

## 🌍 الوصول عبر الإنترنت

### الموقع المباشر (GitHub Pages)

```
https://lexdo.uk
```

**الميزات:**
- ✅ واجهة دردشة مستقلة
- ✅ تستخدم Vue 3 CDN
- ✅ تتصل بـ API Backend
- ✅ مستضافة على GitHub Pages
- ✅ DNS مضبوط عبر Cloudflare

### موقع الإنتاج (Render)

```
https://bsm.onrender.com
```

**جميع الواجهات:**
- Chat: `https://bsm.onrender.com/chat`
- Admin: `https://bsm.onrender.com/admin`
- iOS: `https://bsm.onrender.com/ios-app`
- API: `https://bsm.onrender.com/api`

---

## 📱 تثبيت كتطبيق PWA

### على Chrome/Edge (Desktop)

1. افتح `http://localhost:3000/chat`
2. انقر على أيقونة "تثبيت" في شريط العنوان
3. اتبع التعليمات

### على Safari (iOS)

1. افتح الرابط في Safari
2. اضغط على زر المشاركة (Share)
3. اختر "إضافة إلى الشاشة الرئيسية"
4. اضغط "إضافة"

### على Chrome (Android)

1. افتح الرابط في Chrome
2. اضغط على القائمة (⋮)
3. اختر "تثبيت التطبيق"
4. اضغط "تثبيت"

---

## 🔍 استكشاف الأخطاء

### المشكلة: الخادم لا يبدأ

**الحل:**

```bash
# تحقق من المنفذ
lsof -i :3000

# إنهاء العملية
kill -9 <PID>

# أو استخدم منفذ آخر
PORT=3001 npm start
```

### المشكلة: خطأ مفتاح API غير صالح

**الحل:**

```bash
# تحقق من ملف .env
cat .env | grep OPENAI

# تأكد من صحة المفتاح
# يجب أن يبدأ بـ sk-proj-
```

### المشكلة: لا يمكن الوصول إلى لوحة التحكم

**الحل:**

```bash
# تحقق من ADMIN_TOKEN
echo $ADMIN_TOKEN

# تأكد من أنه 16 حرف على الأقل
# يجب ألا يكون "change-me"
```

### المشكلة: واجهة فارغة

**الحل:**

```bash
# امسح الذاكرة المؤقتة
localStorage.clear()  # في console المتصفح

# أعد تحميل الصفحة
Ctrl + Shift + R  # (Hard Reload)

# تحقق من Console للأخطاء
F12 → Console
```

### المشكلة: خطأ CORS

**الحل:**

```bash
# أضف أصل في .env
CORS_ORIGINS=http://localhost:3000,https://lexdo.uk

# أعد تشغيل الخادم
npm start
```

---

## 📚 الموارد الإضافية

### التوثيق

- [README الرئيسي](../README.md)
- [دليل الأمان](../SECURITY.md)
- [دليل النشر](./UNIFIED-DEPLOYMENT-GUIDE.md)
- [دليل التطوير](./DEVELOPMENT-GUIDE.md)

### Chat UI

- [دليل الدردشة](../src/chat/README.md)
- [PWA Configuration](../src/chat/manifest.json)
- [Service Worker](../src/chat/sw.js)

### iOS App

- [دليل المستخدم iOS](../ios-app/USER-GUIDE-AR.md)
- [دليل النشر iOS](../ios-app/DEPLOYMENT.md)

### Lexprim

- [دليل Nuxt 3](../lexprim-chat/README.md)
- [دليل النشر](../lexprim-chat/DEPLOYMENT.md)

---

## 🎓 أمثلة الاستخدام

### مثال 1: الدردشة البسيطة

```javascript
// من واجهة الدردشة
async function sendMessage() {
  const response = await fetch('/api/chat/direct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'ما هي خدماتكم؟',
      language: 'ar'
    })
  });
  
  const data = await response.json();
  console.log(data.output);
}
```

### مثال 2: استخدام وكيل محدد

```javascript
// استخدام الوكيل القانوني
async function askLegalAgent() {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: 'legal-agent',
      message: 'ما هي القوانين المتعلقة بالعقود؟',
      language: 'ar'
    })
  });
  
  const data = await response.json();
  console.log(data.output);
}
```

### مثال 3: التاريخ والذاكرة

```javascript
// دردشة مع سياق
async function chatWithHistory() {
  const response = await fetch('/api/chat/direct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'هل يمكنك تلخيص ما قلته؟',
      language: 'ar',
      history: [
        { role: 'user', content: 'أنا أحتاج مساعدة قانونية' },
        { role: 'assistant', content: 'بالتأكيد، كيف يمكنني مساعدتك؟' }
      ]
    })
  });
  
  const data = await response.json();
  console.log(data.output);
}
```

---

## ✅ قائمة التحقق

قبل الإطلاق، تأكد من:

- [ ] Node.js 18+ مثبت
- [ ] جميع الحزم مثبتة (`npm ci`)
- [ ] ملف `.env` معد بشكل صحيح
- [ ] `OPENAI_BSM_KEY` صالح
- [ ] `ADMIN_TOKEN` آمن (16+ حرف)
- [ ] الخادم يعمل بدون أخطاء
- [ ] يمكن الوصول إلى `/chat`
- [ ] يمكن الوصول إلى `/admin` (مع المصادقة)
- [ ] يمكن الوصول إلى `/ios-app`
- [ ] API تستجيب بشكل صحيح
- [ ] لا توجد أخطاء في Console المتصفح
- [ ] PWA يمكن تثبيته

---

## 🎉 الخلاصة

الآن جميع واجهات المستخدم **مفعّلة وجاهزة للاستخدام**!

**الروابط السريعة:**

| الواجهة | الرابط المحلي | الحالة |
|---------|---------------|---------|
| Chat UI | `http://localhost:3000/chat` | ✅ جاهز |
| Admin | `http://localhost:3000/admin` | ✅ جاهز |
| iOS App | `http://localhost:3000/ios-app` | ✅ جاهز |
| API | `http://localhost:3000/api` | ✅ جاهز |

**للإنتاج:**
- `https://bsm.onrender.com/chat`
- `https://bsm.onrender.com/admin`
- `https://bsm.onrender.com/ios-app`
- `https://lexdo.uk` (GitHub Pages)

---

**تم بحمد الله ✨**

**المطورون:**
- BSU Development Team
- KARIM (Supreme Architect)

**آخر تحديث:** 2026-02-20
