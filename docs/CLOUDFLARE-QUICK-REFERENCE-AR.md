# دليل سريع: Cloudflare API في منصة BSM

## أسماء Cloudflare API - ملخص سريع

### للـ GitHub Secrets

```yaml
# DNS & Sync (BSU Nexus)
CLOUDFLARE_TOKEN         # Token للمزامنة التلقائية
CLOUDFLARE_ZONE_ID       # Zone ID لـ corehub.nexus

# Cache & Deployment
CF_API_TOKEN             # Token لمسح Cache والنشر
CF_ZONE_ID               # Zone ID لمسح Cache
CF_ACCOUNT_ID            # Account ID للنشر على Pages
CF_PROJECT_NAME          # اسم مشروع Pages
```

### للسكربتات المحلية

```bash
# DNS Management
CLOUDFLARE_API_TOKEN     # Token لإدارة DNS records
CLOUDFLARE_ZONE_ID       # Zone ID (اختياري، لديه قيمة افتراضية)
```

## الفرق بين الأسماء

| الاسم | الاستخدام الرئيسي | الصلاحيات |
|------|-------------------|-----------|
| `CLOUDFLARE_TOKEN` | BSU Nexus Agent | DNS Read |
| `CF_API_TOKEN` | Workflows (Cache/Deploy) | Cache Purge + Pages R/W |
| `CLOUDFLARE_API_TOKEN` | Scripts (DNS Setup) | DNS Edit |

## أهم 3 معلومات

1. **`CLOUDFLARE_TOKEN`** ≠ **`CF_API_TOKEN`** ≠ **`CLOUDFLARE_API_TOKEN`**
   - هم 3 متغيرات مختلفة لاستخدامات مختلفة!

2. **`CLOUDFLARE_ZONE_ID`** ≠ **`CF_ZONE_ID`**
   - نفس القيمة، لكن أسماء مختلفة في contexts مختلفة

3. **القيمة الحالية لـ Zone ID**: `47f901b97bf4724266f6a0e7c1006a1d`
   - موجودة في `docs/nexus.config.json`

## أين تجد كل Token

```
Cloudflare Dashboard → My Profile → API Tokens → Create Token

اختر Template:
├─ للـ CLOUDFLARE_TOKEN: "Read Zone DNS"
├─ للـ CF_API_TOKEN: "Edit Cloudflare Workers" + Custom (Cache)
└─ للـ CLOUDFLARE_API_TOKEN: "Edit zone DNS"

Account ID & Zone ID:
└─ Cloudflare Dashboard → Domain → Overview → API section
```

## استخدام سريع

### تشغيل BSU Nexus محليًا
```bash
export CLOUDFLARE_TOKEN="your_token"
export CLOUDFLARE_ZONE_ID="47f901b97bf4724266f6a0e7c1006a1d"
python agents/autonomous_sync_agent.py
```

### إعداد GitHub Pages Verification
```bash
export CLOUDFLARE_API_TOKEN="your_token"
./scripts/setup_github_pages_verification.sh
```

### مسح Cache يدويًا
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## الأخطاء الشائعة

❌ **خطأ**: استخدام `CLOUDFLARE_TOKEN` في workflow `cf-deploy.yml`  
✅ **صحيح**: استخدام `CF_API_TOKEN`

❌ **خطأ**: وضع Token في `.env` file  
✅ **صحيح**: استخدام GitHub Secrets أو متغيرات البيئة

❌ **خطأ**: استخدام نفس Token لكل شيء  
✅ **صحيح**: Token مختلف لكل استخدام (least privilege principle)

## روابط مفيدة

- [التوثيق الكامل](./CLOUDFLARE-API-NAMES.md) - شرح تفصيلي
- [DNS Record Types](../dns/DNS-RECORD-TYPES.md) - أنواع DNS records
- [GitHub Pages Verification](../dns/GITHUB-PAGES-VERIFICATION.md) - إعداد GitHub Pages
- [ORBIT Secrets Management](./ORBIT-SECRETS-MANAGEMENT.md) - إدارة الأسرار

---

💡 **نصيحة**: احفظ هذا الملف للرجوع إليه بسرعة!
