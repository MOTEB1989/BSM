# أسماء Cloudflare API في منصة BSM

## نظرة عامة

منصة BSM (Business Service Management) تستخدم Cloudflare لإدارة DNS والنشر. هذا المستند يوضح جميع أسماء متغيرات Cloudflare API المستخدمة في المنصة.

## أسماء متغيرات Cloudflare API

### 1. متغيرات GitHub Secrets (الأساسية)

المنصة تستخدم الأسماء التالية في GitHub Secrets:

#### `CLOUDFLARE_TOKEN`
- **الاستخدام**: مستخدم في workflow `nexus-sync.yml`
- **الموقع**: `.github/workflows/nexus-sync.yml`
- **الوصف**: Cloudflare API Token للمزامنة التلقائية لـ BSU Nexus
- **الصلاحيات المطلوبة**: DNS Read
- **مثال الاستخدام**:
  ```yaml
  env:
    CLOUDFLARE_TOKEN: ${{ secrets.CLOUDFLARE_TOKEN }}
  ```

#### `CLOUDFLARE_ZONE_ID`
- **الاستخدام**: مستخدم في workflow `nexus-sync.yml`
- **الموقع**: `.github/workflows/nexus-sync.yml`
- **الوصف**: معرف Zone الخاص بـ corehub.nexus
- **القيمة الحالية**: `47f901b97bf4724266f6a0e7c1006a1d` (في nexus.config.json)
- **مثال الاستخدام**:
  ```yaml
  env:
    CLOUDFLARE_ZONE_ID: ${{ secrets.CLOUDFLARE_ZONE_ID }}
  ```

#### `CF_API_TOKEN`
- **الاستخدام**: مستخدم في workflows `cf-purge-cache.yml` و `cf-deploy.yml`
- **المواقع**: 
  - `.github/workflows/cf-purge-cache.yml`
  - `.github/workflows/cf-deploy.yml`
- **الوصف**: Cloudflare API Token لإدارة Cache والنشر على Cloudflare Pages
- **الصلاحيات المطلوبة**: 
  - Purge Cache
  - Cloudflare Pages Read & Write
- **مثال الاستخدام**:
  ```yaml
  env:
    CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
  ```

#### `CF_ZONE_ID`
- **الاستخدام**: مستخدم في workflow `cf-purge-cache.yml`
- **الموقع**: `.github/workflows/cf-purge-cache.yml`
- **الوصف**: معرف Zone لعمليات مسح Cache
- **مثال الاستخدام**:
  ```yaml
  env:
    CF_ZONE_ID: ${{ secrets.CF_ZONE_ID }}
  ```

#### `CF_ACCOUNT_ID`
- **الاستخدام**: مستخدم في workflow `cf-deploy.yml`
- **الموقع**: `.github/workflows/cf-deploy.yml`
- **الوصف**: معرف حساب Cloudflare للنشر على Pages
- **الحصول عليه**: Cloudflare Dashboard → Workers & Pages → Overview
- **مثال الاستخدام**:
  ```yaml
  env:
    CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
  ```

#### `CF_PROJECT_NAME`
- **الاستخدام**: مستخدم في workflow `cf-deploy.yml`
- **الموقع**: `.github/workflows/cf-deploy.yml`
- **الوصف**: اسم مشروع Cloudflare Pages
- **القيمة الافتراضية**: `orbit-workers`
- **مثال الاستخدام**:
  ```yaml
  env:
    CF_PROJECT_NAME: ${{ secrets.CF_PROJECT_NAME }}
  ```

### 2. متغيرات البيئة للسكربتات

#### `CLOUDFLARE_API_TOKEN`
- **الاستخدام**: مستخدم في سكربت إعداد GitHub Pages
- **الموقع**: `scripts/setup_github_pages_verification.sh`
- **الوصف**: Cloudflare API Token لإدارة DNS records
- **الصلاحيات المطلوبة**: DNS Edit
- **مثال الاستخدام**:
  ```bash
  ./scripts/setup_github_pages_verification.sh <CLOUDFLARE_API_TOKEN> <GITHUB_CHALLENGE_VALUE>
  ```
  أو:
  ```bash
  CLOUDFLARE_API_TOKEN=your_token bash setup_github_pages_verification.sh
  ```

### 3. متغيرات ORBIT Self-Healing Agent

هذه المتغيرات اختيارية ومستخدمة في نظام ORBIT:

#### `CF_ACCOUNT_ID`
- **الاستخدام**: معرف حساب Cloudflare لـ ORBIT Workers
- **الموقع**: `.env.example` (سطر 99)
- **الحصول عليه**: Cloudflare Dashboard → Workers & Pages → Overview
- **التنسيق**: 32 حرف hexadecimal

#### `CF_ZONE_ID`
- **الاستخدام**: معرف Zone لـ ORBIT Workers
- **الموقع**: `.env.example` (سطر 100)
- **الحصول عليه**: Cloudflare Dashboard → Your Domain → Overview → API section
- **التنسيق**: 32 حرف hexadecimal

#### `CF_PROJECT_NAME`
- **الاستخدام**: اسم مشروع Cloudflare Workers لـ ORBIT
- **الموقع**: `.env.example` (سطر 101)
- **القيمة الافتراضية**: `orbit-workers`

## جدول ملخص

| اسم المتغير | الاستخدام | الموقع الرئيسي | الصلاحيات المطلوبة |
|-------------|-----------|----------------|-------------------|
| `CLOUDFLARE_TOKEN` | BSU Nexus Sync | nexus-sync.yml | DNS Read |
| `CLOUDFLARE_ZONE_ID` | BSU Nexus Sync | nexus-sync.yml | - |
| `CF_API_TOKEN` | Cache Purge & Pages Deploy | cf-purge-cache.yml, cf-deploy.yml | Purge Cache, Pages R/W |
| `CF_ZONE_ID` | Cache Purge | cf-purge-cache.yml | - |
| `CF_ACCOUNT_ID` | Pages Deploy & ORBIT | cf-deploy.yml, .env.example | - |
| `CF_PROJECT_NAME` | Pages Project Name | cf-deploy.yml, .env.example | - |
| `CLOUDFLARE_API_TOKEN` | DNS Management Script | setup_github_pages_verification.sh | DNS Edit |

## Cloudflare API Endpoints المستخدمة

المنصة تستخدم Cloudflare API v4 التالية:

### 1. DNS Records API
```bash
https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records
```
**الاستخدام**: قراءة وإدارة سجلات DNS

**السكربتات المستخدمة**:
- `agents/autonomous_sync_agent.py`
- `scripts/setup_github_pages_verification.sh`

### 2. Purge Cache API
```bash
https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache
```
**الاستخدام**: مسح Cache (كامل أو URLs محددة)

**الـ Workflows المستخدمة**:
- `.github/workflows/cf-purge-cache.yml`

### 3. Token Verification API
```bash
https://api.cloudflare.com/client/v4/user/tokens/verify
```
**الاستخدام**: التحقق من صلاحية API Token

**السكربتات المستخدمة**:
- `scripts/setup_github_pages_verification.sh`

## كيفية الحصول على Cloudflare Tokens

### 1. Cloudflare API Token (للـ DNS)
1. انتقل إلى [Cloudflare Dashboard](https://dash.cloudflare.com)
2. اذهب إلى **My Profile** → **API Tokens**
3. اضغط **Create Token**
4. اختر template **Edit zone DNS**
5. حدد Zone Permissions:
   - Zone → DNS → Edit
   - Zone → Zone → Read
6. حدد Zone Resources:
   - Include → Specific zone → `lexdo.uk` أو `corehub.nexus`
7. اضغط **Continue to summary**
8. اضغط **Create Token**
9. احفظ Token (لن تراه مرة أخرى!)

### 2. Cloudflare Account ID
1. انتقل إلى [Cloudflare Dashboard](https://dash.cloudflare.com)
2. اذهب إلى **Workers & Pages**
3. انسخ **Account ID** من قسم Overview

### 3. Cloudflare Zone ID
1. انتقل إلى [Cloudflare Dashboard](https://dash.cloudflare.com)
2. اختر Domain الخاص بك (مثل `lexdo.uk`)
3. في صفحة Overview، scroll down إلى قسم **API**
4. انسخ **Zone ID**

## أمثلة الاستخدام

### مثال 1: استخدام BSU Nexus Agent محليًا

```bash
# تعيين متغيرات البيئة
export CLOUDFLARE_TOKEN="your_cloudflare_token_here"
export CLOUDFLARE_ZONE_ID="47f901b97bf4724266f6a0e7c1006a1d"

# تشغيل Agent
python agents/autonomous_sync_agent.py
```

### مثال 2: إعداد GitHub Pages Verification

```bash
# الطريقة 1: تمرير كـ arguments
./scripts/setup_github_pages_verification.sh your_cloudflare_token abc123challenge

# الطريقة 2: استخدام متغيرات البيئة
export CLOUDFLARE_API_TOKEN="your_token"
export GITHUB_PAGES_CHALLENGE="abc123challenge"
./scripts/setup_github_pages_verification.sh
```

### مثال 3: مسح Cloudflare Cache يدويًا

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## الأمان

⚠️ **تحذيرات هامة**:

1. **لا تضع Tokens في `.env`**: استخدم GitHub Secrets أو متغيرات البيئة فقط
2. **لا تشارك Tokens**: كل Token شخصي ويجب حمايته
3. **استخدم أقل صلاحيات ممكنة**: امنح كل Token فقط الصلاحيات التي يحتاجها
4. **قم بتدوير Tokens دوريًا**: غيّر Tokens كل 3-6 أشهر
5. **راجع `.gitleaks.toml`**: المنصة تفحص Cloudflare API Keys تلقائيًا

### قواعد Gitleaks الموجودة

المنصة تحتوي على قواعد للكشف عن تسريب Cloudflare API Keys:

```toml
[rules.cloudflare-api-key]
id = "cloudflare-api-key"
description = "Cloudflare API Key"
regex = '''(?i)(cloudflare.{0,20}['"\\s:=]+)([a-z0-9]{37})'''
tags = ["cloudflare", "api-key", "high"]
```

## الموارد الإضافية

- [Cloudflare API Documentation](https://developers.cloudflare.com/api/)
- [DNS Record Types](../dns/DNS-RECORD-TYPES.md)
- [GitHub Pages Verification Guide](../dns/GITHUB-PAGES-VERIFICATION.md)
- [ORBIT Bootstrap Guide](./ORBIT-BOOTSTRAP-GUIDE.md)
- [ORBIT Secrets Management](./ORBIT-SECRETS-MANAGEMENT.md)

## الدعم

إذا كان لديك أسئلة حول Cloudflare API في المنصة:
1. راجع هذا المستند أولاً
2. تحقق من [SECURITY.md](../SECURITY.md) للمعلومات الأمنية
3. تواصل مع فريق التطوير

---

**آخر تحديث**: 2026-02-13  
**الإصدار**: 1.0.0
