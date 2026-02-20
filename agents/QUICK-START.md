# 🚀 دليل البدء السريع - نظام صافيو

## ⚡ الأوامر الأساسية

```bash
# 1️⃣ فحص التكرارات
npm run check:duplicates

# 2️⃣ التحقق من صحة Registry
npm run validate:registry

# 3️⃣ دمج وكلاء من مصدر ثانوي
npm run merge:agents

# 4️⃣ تثبيت Git Hooks
npm run install:hooks

# 5️⃣ فحص شامل
npm test
```

## 📝 إضافة وكيل جديد

### الخطوات
```bash
# 1. عدّل agents/registry.yaml
vim agents/registry.yaml

# 2. تحقق من عدم وجود تكرارات
npm run check:duplicates

# 3. تحقق من الصحة
npm run validate:registry

# 4. Commit
git add agents/registry.yaml
git commit -m "feat: add new agent"
```

### مثال - وكيل جديد
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

## 🔍 حل مشكلة التكرارات

### إذا وجدت تكرارات:

```bash
# 1. شغل التقرير التفصيلي
npm run check:duplicates

# ستحصل على مخرجات مثل:
# ❌ تم اكتشاف 2 تكرار
# 📊 التفاصيل:
#   1. [exact-id] agent-1 ↔ agent-1 (100%)
#   2. [similar] agent-2 ↔ agent-3 (85%)

# 2. افتح Registry
vim agents/registry.yaml

# 3. احذف أو دمج الوكلاء المكررة

# 4. تحقق مرة أخرى
npm run check:duplicates
```

## 🛡️ الحماية التلقائية

### 1. Git Hook (Local)
```bash
# يتم تلقائياً عند git commit
# يمنع commit إذا كان هناك تكرار
git commit -m "..."
# 🔍 صافيو: فحص التكرارات...
# ✅ صافيو: الفحص نجح - يمكن المتابعة
```

### 2. GitHub Workflow (CI)
```bash
# يعمل تلقائياً على كل PR
# يضيف تعليق إذا كان هناك تكرار
```

### 3. Sync Workflow
```bash
# يعمل كل 6 ساعات
# يمنع التكرار أثناء المزامنة بين المستودعات
```

## 📊 فهم مستويات التشابه

| النسبة | المعنى | الإجراء |
|--------|--------|---------|
| 100% | تطابق كامل | ❌ احذف فوراً |
| 70-99% | تشابه عالي | ⚠️ راجع ودمج أو احذف |
| <70% | مقبول | ✅ لا مشكلة |

## 🔧 استكشاف الأخطاء

### مشكلة: "Registry format invalid"
```bash
# تأكد من صحة YAML
npx yaml-lint agents/registry.yaml
```

### مشكلة: "Missing required field"
```bash
# تحقق من الحقول المطلوبة:
# - id
# - name
# - category
# - contexts.allowed
# - risk.level
```

### مشكلة: Git Hook لا يعمل
```bash
# أعد تثبيت Hooks
npm run install:hooks
```

## 📚 المراجع

- [دليل نظام صافيو الكامل](../docs/SAFFIO-SYSTEM.md)
- [هيكل Registry](README.md)
- [سجل التغييرات](../CHANGELOG.md)

---

**صافيو** - نظام حماية من التكرار 🧹
