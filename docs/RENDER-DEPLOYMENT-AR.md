# Render Deployment Configuration - Quick Reference

## البيانات المطلوبة للنشر على Render.com

### متغيرات البيئة الضرورية (Environment Variables)

قم بإضافة هذه المتغيرات في لوحة التحكم Render → Environment:

#### 1. CORS_ORIGINS (إلزامي)
```
CORS_ORIGINS=https://www.lexdo.uk,https://lexdo.uk,https://lexprim.com,https://www.lexprim.com
```
- **الوصف**: النطاقات المسموح لها بالاتصال بالـ API
- **المطلوب**: جميع النطاقات الأمامية (frontend domains)
- **تنسيق**: قائمة مفصولة بفواصل، بدون مسافات
- **ملاحظة**: لا تضع / في النهاية

#### 2. GITHUB_WEBHOOK_SECRET (إلزامي للـ webhooks)
```
GITHUB_WEBHOOK_SECRET=your-secret-token-here
```
- **الوصف**: مفتاح سري للتحقق من webhooks القادمة من GitHub
- **التوليد**: استخدم نص عشوائي قوي (32+ حرف)
- **أمر التوليد**: `openssl rand -hex 32`
- **التطبيق**: يجب أن يتطابق مع السر المعيَّن في GitHub Webhook Settings

#### 3. ADMIN_TOKEN (إلزامي للإنتاج)
```
ADMIN_TOKEN=your-admin-token-here
```
- **الوصف**: رمز المصادقة للوصول إلى لوحة الإدارة
- **المتطلبات**: 16+ حرف في بيئة الإنتاج
- **التوليد**: `openssl rand -base64 24`

#### 4. OPENAI_BSU_KEY (إلزامي)
```
OPENAI_BSU_KEY=sk-proj-...
```
- **الوصف**: مفتاح OpenAI API
- **الحصول عليه**: من [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **البدائل**: يدعم أيضًا `OPENAI_API_KEY` أو `OPENAI_BSM_KEY`

#### 5. NODE_ENV (موصى به)
```
NODE_ENV=production
```
- **الوصف**: بيئة التشغيل
- **القيم**: `development` أو `production`

### متغيرات اختيارية

#### GITHUB_BSU_TOKEN (للإجراءات التلقائية)
```
GITHUB_BSU_TOKEN=ghp_...
```
- **الوصف**: رمز GitHub لتنفيذ الإجراءات (دمج، موافقة، الخ)
- **المتطلبات**: صلاحيات `repo` على الأقل
- **الحصول عليه**: GitHub Settings → Developer settings → Personal access tokens

#### RATE_LIMIT_MAX (افتراضي: 100)
```
RATE_LIMIT_MAX=200
```
- **الوصف**: عدد الطلبات المسموحة لكل نافذة زمنية

#### RATE_LIMIT_WINDOW_MS (افتراضي: 900000 = 15 دقيقة)
```
RATE_LIMIT_WINDOW_MS=900000
```
- **الوصف**: النافذة الزمنية لحد الطلبات (بالميلي ثانية)

## خطوات التكوين في Render

### الخطوة 1: إنشاء Web Service
1. افتح [Render Dashboard](https://dashboard.render.com)
2. انقر على "New +" → "Web Service"
3. اربط مستودع GitHub: `LexBANK/BSM`
4. اختر الفرع: `main` أو الفرع المطلوب

### الخطوة 2: إعدادات الخدمة
```
Name: sr-bsm (أو أي اسم)
Environment: Node
Region: Frankfurt (أو الأقرب لك)
Branch: main
Build Command: npm ci
Start Command: npm start
Plan: Free (أو حسب الحاجة)
```

### الخطوة 3: إضافة Environment Variables
1. في صفحة الخدمة، اذهب إلى "Environment"
2. أضف المتغيرات المطلوبة:
   - `CORS_ORIGINS`
   - `GITHUB_WEBHOOK_SECRET`
   - `ADMIN_TOKEN`
   - `OPENAI_BSU_KEY`
   - `NODE_ENV=production`
3. انقر "Save Changes"

### الخطوة 4: Deploy
- سيبدأ Render بالنشر تلقائيًا
- انتظر حتى يظهر "Live" ✅
- سيكون الـ URL: `https://sr-bsm.onrender.com`

## تكوين GitHub Webhook

بعد نشر الخدمة على Render:

1. افتح مستودع GitHub
2. اذهب إلى Settings → Webhooks → Add webhook
3. أدخل:
   ```
   Payload URL: https://sr-bsm.onrender.com/webhook/github
   Content type: application/json
   Secret: [نفس قيمة GITHUB_WEBHOOK_SECRET]
   ```
4. اختر الأحداث:
   - Pull requests
   - Check suites
   - Pushes
5. انقر "Add webhook"

## التحقق من التكوين

### 1. اختبار Health Endpoint
```bash
curl https://sr-bsm.onrender.com/api/health
```
يجب أن ترى: `{"status":"ok",...}`

### 2. اختبار Agents Endpoint
```bash
curl https://sr-bsm.onrender.com/api/agents
```
يجب أن ترى قائمة الوكلاء (agents)

### 3. اختبار Webhook Endpoint
```bash
curl -X POST https://sr-bsm.onrender.com/webhook/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: ping" \
  -d '{"hook_id": 12345}'
```
يجب أن ترى: `401 Unauthorized` (طبيعي بدون توقيع صحيح)

### 4. فحص Logs في Render
- اذهب إلى Dashboard → Logs
- ابحث عن: `BSU API started`
- يجب أن ترى: `port: 10000`, `Agents: 9 agents loaded`

## استكشاف الأخطاء

### خطأ: "Not allowed by CORS"
**السبب**: `CORS_ORIGINS` غير مُعدَّ أو خاطئ

**الحل**:
```bash
CORS_ORIGINS=https://www.lexdo.uk,https://lexdo.uk,https://lexprim.com,https://www.lexprim.com
```
- تأكد من عدم وجود مسافات
- تأكد من عدم وجود / في النهاية
- أعد تشغيل الخدمة

### خطأ: "POST /webhook/github 404"
**السبب**: الخادم لم يتم تحديثه بعد الكود الجديد

**الحل**:
1. تأكد من دمج PR الجديد في `main`
2. انتظر إعادة النشر التلقائية
3. أو انقر "Manual Deploy" في Render

### خطأ: "ADMIN_TOKEN must be set"
**السبب**: `ADMIN_TOKEN` غير معيَّن في الإنتاج

**الحل**:
```bash
# توليد token جديد
openssl rand -base64 24
# أضفه في Render Environment
ADMIN_TOKEN=<النص_المولد>
```

### خطأ: "Invalid webhook signature"
**السبب**: `GITHUB_WEBHOOK_SECRET` لا يتطابق مع GitHub

**الحل**:
1. توليد secret جديد: `openssl rand -hex 32`
2. تحديثه في Render Environment
3. تحديثه في GitHub Webhook Settings
4. اختبار webhook من GitHub

## المراجع

- [GitHub Webhook Setup Guide](./GITHUB-WEBHOOK-SETUP.md)
- [BSM Documentation](../README.md)
- [Environment Variables Reference](../.env.example)

## الدعم

في حالة وجود مشاكل:
1. راجع Logs في Render Dashboard
2. تحقق من Environment Variables
3. اختبر الـ endpoints باستخدام curl
4. راجع GitHub Webhook delivery logs
