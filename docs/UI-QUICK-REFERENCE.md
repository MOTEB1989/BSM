# 🚀 مرجع سريع لواجهات المستخدم
# UI Quick Reference

---

## 🌐 روابط الوصول السريعة

### البيئة المحلية (Local)

```
Chat UI:    http://localhost:3000/chat
Admin:      http://localhost:3000/admin
iOS App:    http://localhost:3000/ios-app
API:        http://localhost:3000/api
Health:     http://localhost:3000/health
```

### الإنتاج (Production)

```
Chat UI:    https://bsm.onrender.com/chat
Admin:      https://bsm.onrender.com/admin
iOS App:    https://bsm.onrender.com/ios-app
Website:    https://lexdo.uk
API:        https://bsm.onrender.com/api
```

---

## ⚡ أوامر سريعة

```bash
# التثبيت
npm ci

# التشغيل (تطوير)
npm run dev

# التشغيل (إنتاج)
npm start

# فحص الصحة
npm run health

# الاختبارات
npm test
```

---

## 🔑 المتغيرات الأساسية (.env)

```bash
# إلزامي
OPENAI_BSM_KEY=sk-proj-your-key-here
ADMIN_TOKEN=minimum-16-chars-secure-token

# اختياري
PORT=3000
NODE_ENV=development
```

---

## 📡 API Endpoints الأساسية

```bash
# الصحة
GET /health
GET /api/health
GET /api/health/detailed

# الوكلاء
GET  /api/agents
POST /api/agents/run

# الدردشة
POST /api/chat                 # وكيل محدد
POST /api/chat/direct          # دردشة مباشرة
GET  /api/chat/key-status      # حالة المفاتيح

# قاعدة المعرفة
GET /api/knowledge
```

---

## 🎯 الميزات الرئيسية

### واجهة الدردشة (Chat UI)

✅ Vue 3 + Tailwind CSS  
✅ ثنائية اللغة (عربي/إنجليزي)  
✅ 3 أوضاع: ذكي، قانوني، حوكمة  
✅ PWA + Service Worker  
✅ العمل بلا إنترنت

### لوحة التحكم (Admin)

🔐 HTTP Basic Auth  
✅ إدارة الوكلاء  
✅ قاعدة المعرفة  
✅ مراقبة النظام

### تطبيق iOS (iOS App)

📱 محسّن لـ iPhone  
✅ دعم PWA  
✅ Safe Area Support  
✅ تجربة أصلية

---

## 🧪 اختبارات سريعة

```bash
# فحص API
curl http://localhost:3000/api/health

# دردشة بسيطة
curl -X POST http://localhost:3000/api/chat/direct \
  -H "Content-Type: application/json" \
  -d '{"message":"مرحباً","language":"ar"}'

# قائمة الوكلاء
curl http://localhost:3000/api/agents
```

---

## 🔒 المصادقة

### لوحة التحكم

```
Username: admin
Password: [ADMIN_TOKEN from .env]
```

### API Public

لا تحتاج مصادقة (Rate Limited: 100 req/15 min)

---

## 🛠️ استكشاف الأخطاء

### الخادم لا يبدأ

```bash
# تحقق من المنفذ
lsof -i :3000
kill -9 <PID>

# أو استخدم منفذ آخر
PORT=3001 npm start
```

### خطأ مفتاح API

```bash
# تحقق من المفتاح
cat .env | grep OPENAI
# يجب أن يبدأ بـ sk-proj-
```

### واجهة فارغة

```javascript
// في console المتصفح
localStorage.clear();
location.reload();
```

---

## 📱 تثبيت PWA

### iPhone

1. Safari → افتح الرابط
2. Share → Add to Home Screen

### Android

1. Chrome → افتح الرابط
2. Menu → Install App

### Desktop

1. Chrome/Edge → افتح الرابط
2. Install icon في شريط العنوان

---

## 🚀 نشر سريع

### Render.com

```bash
# push إلى GitHub
git push origin main

# Render ينشر تلقائياً
```

### Docker

```bash
docker build -t bsm-app .
docker run -p 3000:3000 \
  -e OPENAI_BSM_KEY=your-key \
  -e ADMIN_TOKEN=your-token \
  bsm-app
```

---

## 📚 توثيق كامل

- [دليل التفعيل الشامل](./UI-ACTIVATION-GUIDE-AR.md)
- [README الرئيسي](../README.md)
- [دليل Chat UI](../src/chat/README.md)
- [دليل iOS App](../ios-app/USER-GUIDE-AR.md)
- [دليل الأمان](../SECURITY.md)

---

## 🎉 روابط مهمة

| الموقع | الرابط |
|--------|--------|
| GitHub | https://github.com/MOTEB1989/BSM |
| Production | https://bsm.onrender.com |
| Website | https://lexdo.uk |
| Docs | https://lexdo.uk |

---

**آخر تحديث:** 2026-02-20  
**الإصدار:** 2.0.0
