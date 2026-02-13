# الإجابة: أسماء Cloudflare API في منصة BSM

## السؤال
cloudflare مااسم API في منصتنا؟

## الإجابة المختصرة

منصة BSM تستخدم **3 أسماء مختلفة** لـ Cloudflare API tokens حسب الاستخدام:

### 1. للـ GitHub Actions Workflows:

```yaml
# للمزامنة التلقائية (BSU Nexus)
CLOUDFLARE_TOKEN         ← مستخدم في nexus-sync.yml
CLOUDFLARE_ZONE_ID       ← معرف Zone

# لمسح Cache والنشر على Pages
CF_API_TOKEN             ← مستخدم في cf-purge-cache.yml و cf-deploy.yml
CF_ZONE_ID               ← معرف Zone
CF_ACCOUNT_ID            ← معرف الحساب
CF_PROJECT_NAME          ← اسم المشروع
```

### 2. للسكربتات المحلية:

```bash
CLOUDFLARE_API_TOKEN     ← مستخدم في scripts/setup_github_pages_verification.sh
```

## التفاصيل الكاملة

### الفرق بين الأسماء

| الاسم | أين يُستخدم | ما الفرق |
|------|-------------|----------|
| `CLOUDFLARE_TOKEN` | workflow: nexus-sync.yml | للمزامنة التلقائية مع DNS |
| `CF_API_TOKEN` | workflows: cf-*.yml | للنشر ومسح Cache |
| `CLOUDFLARE_API_TOKEN` | Scripts المحلية | لإدارة DNS من Command line |

### الموقع الحالي لـ Zone ID

القيمة الحالية لـ `CLOUDFLARE_ZONE_ID` موجودة في:
- `docs/nexus.config.json` → `"zone_id": "47f901b97bf4724266f6a0e7c1006a1d"`

### الملفات التي تستخدم Cloudflare API

1. **GitHub Workflows**:
   - `.github/workflows/nexus-sync.yml` → يستخدم `CLOUDFLARE_TOKEN` و `CLOUDFLARE_ZONE_ID`
   - `.github/workflows/cf-purge-cache.yml` → يستخدم `CF_API_TOKEN` و `CF_ZONE_ID`
   - `.github/workflows/cf-deploy.yml` → يستخدم `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_PROJECT_NAME`

2. **Python Agents**:
   - `agents/autonomous_sync_agent.py` → يقرأ `CLOUDFLARE_TOKEN` و `CLOUDFLARE_ZONE_ID`

3. **Bash Scripts**:
   - `scripts/setup_github_pages_verification.sh` → يستخدم `CLOUDFLARE_API_TOKEN`

## أمثلة الاستخدام

### مثال 1: تشغيل BSU Nexus Agent محليًا

```bash
export CLOUDFLARE_TOKEN="your_api_token_here"
export CLOUDFLARE_ZONE_ID="47f901b97bf4724266f6a0e7c1006a1d"
python agents/autonomous_sync_agent.py
```

### مثال 2: إعداد GitHub Pages

```bash
export CLOUDFLARE_API_TOKEN="your_api_token_here"
./scripts/setup_github_pages_verification.sh
```

### مثال 3: مسح Cache يدويًا

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/47f901b97bf4724266f6a0e7c1006a1d/purge_cache" \
  -H "Authorization: Bearer YOUR_CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## كيف تحصل على Token

1. انتقل إلى [Cloudflare Dashboard](https://dash.cloudflare.com)
2. اذهب إلى **My Profile** → **API Tokens**
3. اضغط **Create Token**
4. اختر Template حسب الاستخدام:
   - **للـ DNS**: اختر "Edit zone DNS"
   - **للـ Pages**: اختر "Edit Cloudflare Workers"
   - **للـ Cache**: Custom token مع صلاحية "Purge Cache"

## الوثائق الكاملة

تم إنشاء ملفات توثيق شاملة:

1. **[docs/CLOUDFLARE-API-NAMES.md](./CLOUDFLARE-API-NAMES.md)**
   - توثيق تفصيلي لجميع متغيرات Cloudflare
   - شرح كل متغير والصلاحيات المطلوبة
   - أمثلة الاستخدام
   - نصائح أمنية
   - روابط مفيدة

2. **[docs/CLOUDFLARE-QUICK-REFERENCE-AR.md](./CLOUDFLARE-QUICK-REFERENCE-AR.md)**
   - دليل مرجعي سريع
   - جدول ملخص
   - الأخطاء الشائعة وحلولها

## ملخص سريع

✅ **الأسماء الرئيسية**:
- `CLOUDFLARE_TOKEN` - للمزامنة
- `CF_API_TOKEN` - للنشر والـ Cache
- `CLOUDFLARE_API_TOKEN` - للسكربتات

✅ **Zone ID الحالي**: `47f901b97bf4724266f6a0e7c1006a1d`

✅ **Domain**: `corehub.nexus`

⚠️ **مهم**: كل token له استخدام مختلف، لا تخلط بينهم!

---

**تاريخ الإنشاء**: 2026-02-13  
**الإصدار**: 1.0.0  
**المؤلف**: BSM Documentation System
