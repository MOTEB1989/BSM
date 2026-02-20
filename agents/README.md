# Agent Registry v2.0 - Saffio System

## نظرة عامة
هذا الملف يحتوي على جميع الوكلاء (Agents) المسجلة في منصة BSM/LexBANK.

## الهيكل

### Metadata
```yaml
version: "2.0"
metadata:
  validator_version: "1.2.0"
  last_audit: "2026-02-20T00:00:00Z"
  governance:
    duplicate_prevention: enabled
    auto_validation: true
```

### فئات الوكلاء (Categories)

#### 1. Conversational Agents (6 وكلاء)
وكلاء محادثة ومساعدة:
- `legal-agent` - تحليل قانوني
- `ios-chat-integration-agent` - تكامل iPhone
- `kimi-agent` - مساعد Moonshot AI
- `gemini-agent` - Google Gemini
- `claude-agent` - Anthropic Claude
- `perplexity-agent` - بحث Perplexity
- `groq-agent` - Groq LPU

#### 2. Audit Agents (5 وكلاء)
وكلاء المراجعة والتدقيق:
- `governance-agent` - حوكمة
- `governance-review-agent` - مراجعة الحوكمة
- `code-review-agent` - مراجعة الكود
- `bsu-audit-agent` - تدقيق BSU
- `repository-review-agent` - مراجعة المستودع

#### 3. Security Agents (2 وكلاء)
وكلاء الأمان:
- `security-agent` - فحص أمني
- `pr-merge-agent` - دمج آلي للـ PRs

#### 4. System Agents (2 وكلاء)
وكلاء النظام:
- `integrity-agent` - حارس سلامة المستودع
- `my-agent` - BSU Smart Agent

## مستويات المخاطر (Risk Levels)

| Level | Count | Description |
|-------|-------|-------------|
| low | 13 | عمليات آمنة، لا تعديلات على النظام |
| medium | 3 | عمليات محدودة تتطلب مراجعة |
| high | 0 | عمليات حساسة (غير موجودة حالياً) |
| critical | 0 | عمليات بالغة الخطورة (غير موجودة حالياً) |

## الحماية من التكرار (Anti-Duplication)

### نظام صافيو (Saffio)
- ✅ فحص تلقائي قبل كل commit
- ✅ فحص في CI على كل PR
- ✅ كشف التطابق الكامل (100%)
- ✅ كشف التشابه الجزئي (70%+)

### الأوامر
```bash
# فحص التكرارات
npm run check:duplicates

# التحقق من صحة Registry
npm run validate:registry

# فحص كامل
npm test
```

## قواعد الـ Validation

### الحقول المطلوبة
- `id` - معرف فريد
- `name` - اسم الوكيل
- `category` - الفئة
- `contexts` - السياقات المسموحة
- `risk.level` - مستوى المخاطر

### القواعد الحاكمة
1. ✅ جميع الوكلاء لديها `auto_start: false`
2. ✅ الوكلاء عالية المخاطر تتطلب موافقة
3. ✅ الوكلاء المدمرة ممنوعة من سياق mobile
4. ✅ الوكلاء الداخلية غير قابلة للاختيار

## إضافة وكيل جديد

### الخطوات
1. أضف تعريف الوكيل في `agents/registry.yaml`
2. اتبع الهيكل الموجود
3. شغل `npm run check:duplicates`
4. شغل `npm run validate:registry`
5. Commit التغييرات

### مثال
```yaml
- id: my-new-agent
  name: My New Agent
  category: conversational
  role: advisor
  execution:
    runtime: node
  safety:
    mode: safe
    requires_approval: false
  contexts:
    allowed:
      - chat
      - api
  expose:
    selectable: true
    internal_only: false
  risk:
    level: low
    rationale: "Safe conversational agent"
  approval:
    required: false
    type: none
    approvers: []
  startup:
    auto_start: false
    allowed_profiles:
      - development
      - staging
      - production
  healthcheck:
    endpoint: /api/agents/my-new-agent/health
    interval_seconds: 60
```

## الصيانة

### التحديثات
- يتم تحديث `last_audit` عند أي تعديل
- `validator_version` يشير إلى نسخة نظام الـ validation
- `duplicate_prevention` يجب أن يكون دائماً `enabled`

### المزامنة
يتم مزامنة هذا الملف تلقائياً مع:
- `LexBANK/BSM` (كل 6 ساعات)
- الـ validation في CI/CD

## المراجع
- [نظام صافيو](../docs/SAFFIO-SYSTEM.md)
- [دليل الحوكمة](../GOVERNANCE.md)
- [مخطط الوكلاء](../AGENT-TASK-ORCHESTRATION-PLAN.md)
