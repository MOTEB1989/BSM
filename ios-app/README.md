# CoreHub Nexus - تطبيق iPhone

دليل شامل لتحويل موقع CoreHub Nexus (https://corehub.nexus) إلى تطبيق iOS محسّن

## 📱 نظرة عامة

تم تحسين هذا التطبيق خصيصاً لأجهزة iPhone مع:
- ✅ واجهة مستخدم محسّنة للمس (Touch-optimized UI)
- ✅ دعم iOS Safe Area (شريط الحالة والشريط السفلي)
- ✅ Progressive Web App (PWA) للعمل دون اتصال
- ✅ Service Worker للتخزين المؤقت الذكي
- ✅ دعم كامل للغة العربية والإنجليزية
- ✅ تصميم متجاوب مع Dark Mode أصلي
- ✅ تحسينات أداء لعرض النطاق المنخفض

## 🚀 الميزات الرئيسية

### 1. واجهة محسّنة لـ iOS
- **Safe Area Support**: دعم كامل لمناطق الأمان في iPhone (notch, status bar, home indicator)
- **Touch Gestures**: استجابة سريعة للمس مع تعطيل التكبير العشوائي
- **Smooth Scrolling**: تمرير سلس محسّن لنظام iOS
- **Haptic Feedback**: ردود فعل لمسية (يمكن تفعيلها مستقبلاً)

### 2. Progressive Web App (PWA)
- **Add to Home Screen**: يمكن إضافة التطبيق إلى الشاشة الرئيسية
- **Standalone Mode**: يعمل كتطبيق منفصل بدون شريط المتصفح
- **Offline Support**: يعمل حتى بدون اتصال إنترنت
- **Background Sync**: مزامنة الرسائل عند العودة للاتصال

### 3. تجربة مستخدم محسّنة
- **Bilingual**: دعم كامل للعربية والإنجليزية
- **Compact Design**: تصميم مضغوط مناسب للشاشات الصغيرة
- **Quick Actions**: أزرار سريعة للمهام الشائعة
- **Smart Caching**: تخزين ذكي للمحادثات محلياً
- **Remote Control Dashboard**: لوحة تحكم عن بُعد داخل التطبيق لمراقبة الحالة وتشغيل أدوات MCP

### 4. لوحة التحكم عن بُعد (Remote Control)

الواجهة الجديدة داخل `/ios-app` تحتوي تبويبين:

- **Chat**: دردشة متعددة الوكلاء (direct / legal / governance / code review / auto)
- **Remote**: فحص النظام وتشغيل أدوات MCP مباشرة من iPhone

وظائف Remote:

- تحديث حالة النظام (`/api/status`, `/api/health`, `/api/chat/key-status`)
- عرض وكلاء الجوال (`/api/agents?mode=mobile`)
- تشغيل Orchestrator (`POST /api/orchestrator/run`)
- فحص جاهزية Cursor Windows (`GET /api/mcp/connection-status`)
- تنفيذ أدوات MCP عبر HTTP:
  - `GET /api/mcp/tools`
  - `POST /api/mcp/tools/call`

## 📂 بنية الملفات

```
ios-app/
├── index.html          # الصفحة الرئيسية المحسّنة لـ iOS
├── app.js              # منطق التطبيق الرئيسي (Vue 3)
├── manifest.json       # بيان PWA للتطبيق
├── sw.js               # Service Worker للعمل دون اتصال
├── icons/              # أيقونات التطبيق (SVG, PNG)
├── splash/             # شاشات Splash لموديلات iPhone مختلفة
└── README.md           # هذا الملف
```

## 🔧 التثبيت والإعداد

### الطريقة 1: PWA على iPhone (الموصى بها)

1. **افتح الموقع في Safari على iPhone**
   ```
   https://corehub.nexus/ios-app/
   ```

2. **أضف إلى الشاشة الرئيسية**
   - اضغط على زر المشاركة (⬆️) في Safari
   - اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen)
   - سمّ التطبيق "CoreHub" أو أي اسم تريده
   - اضغط "إضافة"

3. **افتح التطبيق**
   - ستجد أيقونة CoreHub على الشاشة الرئيسية
   - افتحها وستعمل كتطبيق منفصل

### الطريقة 2: Native iOS App (مستقبلاً)

لتحويل هذا التطبيق إلى تطبيق iOS أصلي:

#### باستخدام React Native (الأسرع)
```bash
# 1. قم بتثبيت React Native CLI
npm install -g react-native-cli

# 2. أنشئ مشروع جديد
npx react-native init CoreHubNexus

# 3. انسخ المنطق من app.js وحوّله إلى React Native
# 4. استخدم WebView لتضمين المحتوى HTML
# 5. أضف مكتبات iOS native للمزايا المتقدمة
```

#### باستخدام Capacitor (الأسهل)
```bash
# 1. قم بتثبيت Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/ios

# 2. أضف منصة iOS
npx cap add ios

# 3. انسخ ملفات ios-app إلى www/
cp -r ios-app/* www/

# 4. زامن المشروع
npx cap sync

# 5. افتح في Xcode
npx cap open ios
```

#### باستخدام Flutter (للأداء الأفضل)
```bash
# 1. أنشئ مشروع Flutter
flutter create corehub_nexus

# 2. استخدم webview_flutter package
# 3. أضف منطق التطبيق باستخدام Dart
# 4. أو استخدم flutter_inappwebview للمزيد من التحكم
```

## 🎨 التخصيص

### تغيير الألوان
عدّل في `index.html`:
```css
/* Primary Color */
.bg-blue-600 { background: #4c6ef5; }  /* الأزرق الأساسي */

/* Gradient */
.from-blue-500 to-purple-600  /* التدرج */
```

### تخصيص الأيقونات
استبدل الملفات في مجلد `icons/`:
- `icon-192.png` - أيقونة 192x192
- `icon-512.png` - أيقونة 512x512
- `apple-touch-icon.png` - أيقونة Apple Touch (180x180)

يمكنك استخدام أدوات مثل:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

### إضافة Splash Screens لـ iPhone
أنشئ صور splash لموديلات iPhone المختلفة:

```bash
# استخدم أداة مثل pwa-asset-generator
npx pwa-asset-generator icons/icon.svg splash/ --splash-only --background "#030712"
```

موديلات iPhone الرئيسية:
- iPhone 15 Pro Max: 1290x2796 (3x)
- iPhone 15 Pro: 1179x2556 (3x)
- iPhone 14: 1170x2532 (3x)
- iPhone SE: 750x1334 (2x)

## 🌐 النشر

### على Cloudflare (موصى به لـ corehub.nexus)

```bash
# 1. تأكد من أن Cloudflare Pages متصل بـ GitHub
# 2. قم بنشر مجلد ios-app إلى corehub.nexus

# في Cloudflare Pages:
# Build command: (none)
# Build output directory: ios-app
# Root directory: /
```

### على Render.com (BSM الحالي)

```yaml
# في render.yaml
static:
  - name: corehub-ios-app
    buildCommand: echo "No build needed"
    staticPublishPath: ./ios-app
    domains:
      - corehub.nexus
    routes:
      - type: rewrite
        source: /ios-app/*
        destination: /ios-app/index.html
```

### على Netlify

```toml
# في netlify.toml
[build]
  publish = "ios-app"

[[redirects]]
  from = "/ios-app/*"
  to = "/ios-app/index.html"
  status = 200
```

### على Vercel

```json
// في vercel.json
{
  "routes": [
    {
      "src": "/ios-app/(.*)",
      "dest": "/ios-app/index.html"
    }
  ]
}
```

## 🔗 الاتصال بـ API

التطبيق يتصل بـ API الحالي في:
```
https://sr-bsm.onrender.com/api/chat
https://sr-bsm.onrender.com/api/chat/direct
```

### تخصيص API URL
عدّل في `app.js`:
```javascript
apiBaseUrl: 'https://your-api-domain.com'
```

أو أضف meta tag في `index.html`:
```html
<meta name="api-base-url" content="https://your-api-domain.com" />
```

## 🧪 الاختبار

### اختبار محلياً
```bash
# استخدم Python HTTP Server
cd ios-app
python3 -m http.server 8080

# أو استخدم Node.js serve
npx serve -s . -l 8080

# افتح http://localhost:8080 في Safari على Mac
# أو استخدم iOS Simulator في Xcode
```

### اختبار على iPhone حقيقي
1. شغّل السيرفر على شبكتك المحلية
2. احصل على IP الخاص بجهازك
3. افتح `http://YOUR_IP:8080` في Safari على iPhone
4. جرّب ميزة "إضافة إلى الشاشة الرئيسية"

### اختبار PWA
استخدم Chrome DevTools:
1. افتح DevTools (F12)
2. اذهب إلى تبويب "Application"
3. تحقق من:
   - Manifest
   - Service Worker
   - Cache Storage
   - Local Storage

## 📊 الأداء

### تحسينات الأداء المطبقة
- ✅ تحميل كسول للمكونات
- ✅ Minification لـ HTML/CSS/JS
- ✅ Compression (Gzip/Brotli)
- ✅ CDN للمكتبات الخارجية
- ✅ Cache-First Strategy
- ✅ حفظ الحالة في LocalStorage

### قياس الأداء
استخدم Lighthouse في Chrome:
```bash
lighthouse https://corehub.nexus/ios-app/ --view
```

أهداف الأداء:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90
- PWA: 100

## 🔒 الأمان

### Headers المطبقة
```javascript
// في app.js - كل طلب API يرسل:
headers: {
  'Content-Type': 'application/json'
}
```

### CORS
تأكد من أن السيرفر يسمح بـ:
```javascript
// في .env
CORS_ORIGINS=https://corehub.nexus,https://www.corehub.nexus
```

### HTTPS Only
التطبيق يعمل فقط على HTTPS في الإنتاج

## 🐛 استكشاف الأخطاء

### المشكلة: Service Worker لا يعمل
**الحل:**
1. تأكد من أن الموقع على HTTPS
2. افحص Console في Safari:
   - Settings > Safari > Advanced > Web Inspector
3. امسح Cache وأعد تحميل الصفحة

### المشكلة: الأيقونة لا تظهر
**الحل:**
1. تأكد من وجود ملفات الأيقونات
2. راجع المسارات في `manifest.json`
3. استخدم أيقونات PNG بدلاً من SVG فقط

### المشكلة: التطبيق لا يعمل دون اتصال
**الحل:**
1. تحقق من تسجيل Service Worker
2. افحص Cache Storage في DevTools
3. تأكد من أن `sw.js` يُحمّل بنجاح

### المشكلة: API لا يستجيب
**الحل:**
1. تحقق من اتصال الإنترنت
2. افحص `apiBaseUrl` في Console
3. تأكد من CORS في السيرفر
4. راجع Network tab في DevTools

## 📚 مراجع مفيدة

### Progressive Web Apps
- [PWA على iOS](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

### iOS Development
- [iOS Safari Web Content Guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/)
- [Designing for iOS Safari](https://webkit.org/blog/)

### Tools
- [PWA Builder](https://www.pwabuilder.com/) - أدوات لبناء PWA
- [Maskable.app](https://maskable.app/) - اختبار أيقونات PWA
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - قياس الأداء

## 🤝 المساهمة

لتحسين التطبيق:
1. Fork المشروع
2. أنشئ branch جديد (`git checkout -b feature/improvement`)
3. Commit التعديلات (`git commit -am 'Add new feature'`)
4. Push إلى Branch (`git push origin feature/improvement`)
5. افتح Pull Request

## 📄 الترخيص

هذا التطبيق جزء من مشروع BSM/BSU وهو مرخص حسب ترخيص المشروع الأساسي.

## 👤 المطور

تم التطوير بواسطة **iOS Chat Integration Agent** 🤖
- Specialized in iPhone optimization
- Mobile-first design approach
- Progressive Web App expert

---

**ملاحظة:** هذا تطبيق PWA محسّن يعمل على Safari iOS. لتطبيق أصلي كامل على App Store، يُنصح باستخدام React Native أو Capacitor أو Flutter.

للدعم: افتح Issue على GitHub أو تواصل عبر المشروع الأساسي.
