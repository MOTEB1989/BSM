# دليل إعداد نطاق lexdo.uk
# lexdo.uk Domain Setup Guide

هذا الدليل يشرح خطوات إعداد النطاق `lexdo.uk` للعمل مع GitHub Pages والربط مع خدمة BSM على Render.

This guide explains how to set up the `lexdo.uk` domain to work with GitHub Pages and connect to the BSM service on Render.

---

## 📋 الخطوات المطلوبة (Required Steps)

### المرحلة 1: إعداد DNS على Cloudflare (Priority: Critical)

#### أ. تسجيل الدخول إلى Cloudflare
1. افتح [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. اختر النطاق `lexdo.uk`
3. انتقل إلى **DNS** → **Records**

#### ب. إضافة A Records للنطاق الأساسي (Apex Domain)
أضف أربعة A records للنطاق الأساسي `lexdo.uk`:

| Type | Name | Content | TTL | Proxy Status |
|------|------|---------|-----|--------------|
| A | @ | 185.199.108.153 | Auto | DNS only (Grey) |
| A | @ | 185.199.109.153 | Auto | DNS only (Grey) |
| A | @ | 185.199.110.153 | Auto | DNS only (Grey) |
| A | @ | 185.199.111.153 | Auto | DNS only (Grey) |

> ⚠️ **مهم**: يجب أن تكون الحالة **DNS only** (رمادي) وليس Proxied (برتقالي)

#### ج. إضافة CNAME Record لنطاق www
أضف CNAME record لنطاق `www.lexdo.uk`:

| Type | Name | Content | TTL | Proxy Status |
|------|------|---------|-----|--------------|
| CNAME | www | lexbank.github.io | Auto | DNS only (Grey) |

> ℹ️ **ملاحظة**: الـ CNAME يوجه `www.lexdo.uk` إلى GitHub Pages

#### د. استيراد الملف الجاهز (خيار سريع)
بدلاً من الإضافة اليدوية، يمكنك استيراد الملف:
```bash
# انسخ محتوى الملف
cat dns/lexdo-uk-zone.txt

# في Cloudflare Dashboard:
# DNS → Records → Import → الصق المحتوى
```

---

### المرحلة 2: إعداد GitHub Pages

#### أ. التحقق من ملف CNAME
الملف `docs/CNAME` يجب أن يحتوي على:
```
www.lexdo.uk
```

✅ **تم التحديث**: الملف الآن يحتوي على النطاق الصحيح

#### ب. إعدادات GitHub Pages
1. انتقل إلى [إعدادات GitHub Pages](https://github.com/LexBANK/BSM/settings/pages)
2. تأكد من:
   - **Source**: `gh-pages` branch
   - **Custom domain**: `www.lexdo.uk`
   - **Enforce HTTPS**: ✅ مفعّل

#### ج. التحقق من النطاق (Domain Verification)
قد يطلب GitHub التحقق من ملكية النطاق:
1. سيعرض GitHub قيمة TXT record
2. أضفها في Cloudflare:
   - **Type**: TXT
   - **Name**: `_github-pages-challenge-LexBANK`
   - **Content**: القيمة من GitHub
3. انتظر 1-5 دقائق للتوزيع
4. اضغط **Verify** في GitHub

**أو استخدم السكريبت الجاهز**:
```bash
./scripts/setup_github_pages_verification.sh <CLOUDFLARE_API_TOKEN> <GITHUB_CHALLENGE_VALUE>
```

للتفاصيل، راجع: [GITHUB-PAGES-VERIFICATION.md](./GITHUB-PAGES-VERIFICATION.md)

---

### المرحلة 3: إعداد CORS على Render

#### أ. تحديث متغيرات البيئة
في لوحة تحكم Render.com، حدّث متغير `CORS_ORIGINS`:

```bash
CORS_ORIGINS=https://www.lexdo.uk,https://lexdo.uk,https://lexprim.com,https://www.lexprim.com,https://corehub.nexus,https://www.corehub.nexus
```

> ⚠️ **ملاحظات مهمة**:
> - لا توجد مسافات بين النطاقات
> - لا توجد شرطة مائلة في النهاية (/)
> - يجب تضمين كل من `www` والنطاق بدون `www`

#### ب. إعادة تشغيل الخدمة
بعد تحديث المتغيرات:
1. في Render Dashboard → اختر الخدمة `bsu-api` أو `sr-bsm`
2. **Manual Deploy** → **Clear build cache & deploy**

---

## 🧪 اختبار الإعداد (Testing)

### 1. اختبار DNS
```bash
# تحقق من A records
dig lexdo.uk A +short
# النتيجة المتوقعة: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153

# تحقق من CNAME
dig www.lexdo.uk CNAME +short
# النتيجة المتوقعة: lexbank.github.io.
```

### 2. اختبار الواجهة
```bash
# افتح في المتصفح
https://www.lexdo.uk
# يجب أن يعرض واجهة BSU Nexus Control
```

### 3. اختبار API
```bash
# اختبر الـ Health Check
curl https://sr-bsm.onrender.com/api/health

# اختبر قائمة الوكلاء
curl https://sr-bsm.onrender.com/api/agents

# اختبر CORS
curl -H "Origin: https://www.lexdo.uk" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://sr-bsm.onrender.com/api/chat/direct
```

---

## 📊 الحالة المتوقعة (Expected Status)

بعد تطبيق جميع الخطوات:

| الخدمة | الرابط | الحالة |
|--------|--------|--------|
| الموقع الرئيسي | https://www.lexdo.uk | ✅ يعمل |
| الموقع بدون www | https://lexdo.uk | ✅ يحوّل إلى www |
| API الوكلاء | https://sr-bsm.onrender.com/api/agents | ✅ يعمل |
| المحادثة المباشرة | https://sr-bsm.onrender.com/chat | ✅ يعمل |

---

## 🔧 حل المشاكل (Troubleshooting)

### المشكلة: DNS لا يحل
**الحل**:
- انتظر 5-10 دقائق للتوزيع
- تأكد من حالة Proxy Status = DNS only (رمادي)
- امسح ذاكرة DNS المخبأة: `sudo dscacheutil -flushcache` (macOS)

### المشكلة: GitHub Pages لا يعرض الصفحة
**الحل**:
- تحقق من ملف `docs/CNAME` يحتوي على `www.lexdo.uk`
- تأكد من أن Workflow قد نجح: [Actions](https://github.com/LexBANK/BSM/actions)
- تحقق من إعدادات GitHub Pages

### المشكلة: CORS Error في المتصفح
**الحل**:
- تحقق من `CORS_ORIGINS` في Render
- تأكد من عدم وجود مسافات أو شرطات مائلة زائدة
- أعد تشغيل الخدمة على Render

### المشكلة: Certificate Error
**الحل**:
- تأكد من تفعيل **Enforce HTTPS** في GitHub Pages
- انتظر حتى 24 ساعة لإصدار الشهادة
- تحقق من إعدادات SSL في Cloudflare

---

## 📚 ملفات ذات صلة (Related Files)

- [`dns/lexdo-uk-zone.txt`](../dns/lexdo-uk-zone.txt) - ملف DNS Zone الجاهز
- [`docs/CNAME`](./CNAME) - ملف تكوين GitHub Pages
- [`dns/DNS-RECORD-TYPES.md`](../dns/DNS-RECORD-TYPES.md) - مرجع أنواع DNS Records
- [`dns/GITHUB-PAGES-VERIFICATION.md`](../dns/GITHUB-PAGES-VERIFICATION.md) - دليل التحقق من النطاق
- [`.env.example`](../.env.example) - مثال على متغيرات البيئة

---

## 🔗 روابط مفيدة (Useful Links)

- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [GitHub Pages Settings](https://github.com/LexBANK/BSM/settings/pages)
- [Render Dashboard](https://dashboard.render.com/)
- [GitHub Actions](https://github.com/LexBANK/BSM/actions)
- [Cloudflare DNS Documentation](https://developers.cloudflare.com/dns/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)

---

## ✅ قائمة التحقق النهائية (Final Checklist)

- [ ] إضافة 4 A records في Cloudflare لـ lexdo.uk
- [ ] إضافة CNAME record في Cloudflare لـ www.lexdo.uk
- [ ] تحديث `docs/CNAME` إلى `www.lexdo.uk`
- [ ] تفعيل Custom Domain في GitHub Pages
- [ ] تفعيل Enforce HTTPS في GitHub Pages
- [ ] تحديث `CORS_ORIGINS` في Render
- [ ] إعادة تشغيل خدمة Render
- [ ] اختبار DNS بـ `dig`
- [ ] اختبار الواجهة على https://www.lexdo.uk
- [ ] اختبار API مع CORS

---

**آخر تحديث**: 2026-02-13  
**الحالة**: ✅ ملف CNAME محدّث، جاهز للنشر
