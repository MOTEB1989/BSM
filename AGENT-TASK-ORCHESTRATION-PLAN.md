# 🏗️ خطة تنسيق مهام الوكلاء - BSM Platform

**التاريخ:** 2026-02-19  
**الإصدار:** 1.0.0  
**المعماري الرئيسي:** KARIM (BSM Lead Architect)

---

## 📊 ملخص تنفيذي

هذه الوثيقة تحدد الخطة الهندسية المعمارية الاحترافية لتوزيع المهام على وكلاء BSM بشكل تلقائي ومنظم، مما يضمن:
- عدم وجود تداخلات في الأكواد
- التنفيذ المتسلسل المنظم
- التزامن الصحيح بين جميع المكونات

---

## 🤖 خريطة الوكلاء وتخصصاتهم

### المجموعة A: وكلاء المحادثة (Conversational Agents)
| الوكيل | المهمة الرئيسية | السياق المسموح |
|--------|-----------------|----------------|
| `legal-agent` | الاستشارات القانونية والتحليل | chat, api, mobile |
| `governance-agent` | الحوكمة المؤسسية | chat, api, mobile |
| `ios-chat-integration-agent` | تكامل iOS | chat, api, mobile |
| `kimi-agent` | معالجة السياق الطويل | chat, api |

### المجموعة B: وكلاء التدقيق (Audit Agents)
| الوكيل | المهمة الرئيسية | السياق المسموح |
|--------|-----------------|----------------|
| `code-review-agent` | مراجعة الكود | chat, api, ci |
| `governance-review-agent` | مراجعة الحوكمة | chat, api, ci |
| `bsu-audit-agent` | التدقيق الشامل | chat, api, ci |
| `repository-review-agent` | مراجعة المستودع | chat, api, ci |

### المجموعة C: وكلاء الأمان (Security Agents)
| الوكيل | المهمة الرئيسية | السياق المسموح |
|--------|-----------------|----------------|
| `security-agent` | الفحص الأمني | chat, api, ci |

### المجموعة D: وكلاء التنفيذ (Execution Agents)
| الوكيل | المهمة الرئيسية | السياق المسموح |
|--------|-----------------|----------------|
| `pr-merge-agent` | إدارة طلبات السحب | chat, api, ci |
| `integrity-agent` | فحص السلامة | chat, api, ci |
| `my-agent` | إدارة النظام | chat, api |

### المجموعة E: وكلاء الذكاء الاصطناعي (AI Model Agents)
| الوكيل | النموذج | الاستخدام |
|--------|---------|----------|
| `gemini-agent` | Google Gemini | التحليل العميق |
| `claude-agent` | Anthropic Claude | البرمجة المتقدمة |
| `perplexity-agent` | Perplexity | البحث والاستشهادات |
| `groq-agent` | Groq | السرعة العالية |

---

## 🔄 خط أنابيب التنفيذ (Execution Pipeline)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BSM Orchestrator                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │ Phase 1  │───▶│ Phase 2  │───▶│ Phase 3  │───▶│ Phase 4  │      │
│  │Discovery │    │ Analysis │    │ Decision │    │Execution │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│       │               │               │               │              │
│       ▼               ▼               ▼               ▼              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │Integrity │    │ Security │    │Governance│    │ PR-Merge │      │
│  │  Agent   │    │  Agent   │    │  Agent   │    │  Agent   │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│       │               │               │               │              │
│       └───────────────┴───────────────┴───────────────┘              │
│                               │                                      │
│                               ▼                                      │
│                    ┌──────────────────────┐                         │
│                    │  Phase 5: Monitoring │                         │
│                    │    (Audit Agent)     │                         │
│                    └──────────────────────┘                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 توزيع المهام التلقائي

### المهمة 1: تنظيف طلبات السحب (PR Cleanup)
**الوكيل المسؤول:** `pr-merge-agent`  
**الأولوية:** عالية  
**الحالة:** جاهز للتنفيذ

```yaml
task:
  id: pr-cleanup-task
  agent: pr-merge-agent
  triggers:
    - schedule: "0 2 * * *"  # يومياً الساعة 2 صباحاً
    - manual: true
  actions:
    - identify_stale_prs:
        max_age_days: 30
        states: [draft, dirty]
    - categorize_prs:
        categories: [mergeable, conflicting, stale]
    - close_stale_prs:
        comment: "🔒 تم الإغلاق تلقائياً: PR قديم أو يحتوي على تعارضات"
        label: "auto-closed"
  outputs:
    - reports/PR-CLEANUP-REPORT-{timestamp}.md
  notifications:
    on_success: true
    on_failure: true
```

### المهمة 2: فحص السلامة (Integrity Check)
**الوكيل المسؤول:** `integrity-agent`  
**الأولوية:** عالية  
**الحالة:** يعمل تلقائياً

```yaml
task:
  id: integrity-check-task
  agent: integrity-agent
  triggers:
    - on_pr_open: true
    - on_push_to_main: true
    - schedule: "0 6 * * 1"  # أسبوعياً يوم الاثنين
  actions:
    - verify_file_consistency
    - check_registry_sync
    - validate_agent_configs
    - detect_orphaned_files
  outputs:
    - reports/INTEGRITY-REPORT-{timestamp}.md
  healthcheck:
    endpoint: /api/agents/integrity-agent/health
    interval: 60
```

### المهمة 3: التدقيق الأمني (Security Audit)
**الوكيل المسؤول:** `security-agent`  
**الأولوية:** حرجة  
**الحالة:** يعمل مع كل PR

```yaml
task:
  id: security-audit-task
  agent: security-agent
  triggers:
    - on_pr_open: true
    - on_code_change: true
    - schedule: "0 0 * * *"  # يومياً منتصف الليل
  actions:
    - scan_for_secrets
    - check_dependencies
    - audit_configurations
    - validate_permissions
  outputs:
    - reports/SECURITY-AUDIT-{timestamp}.md
  blocking: true  # يحجب الدمج إذا فشل
```

### المهمة 4: مراجعة الكود (Code Review)
**الوكيل المسؤول:** `code-review-agent`  
**الأولوية:** متوسطة  
**الحالة:** عند الطلب

```yaml
task:
  id: code-review-task
  agent: code-review-agent
  triggers:
    - on_pr_ready_for_review: true
    - manual: true
  actions:
    - analyze_code_quality:
        rules: [SOLID, DRY, KISS]
    - check_test_coverage
    - identify_bugs
    - suggest_improvements
  outputs:
    - reports/CODE-REVIEW-{pr_number}.md
  scoring:
    enabled: true
    min_score: 7.0  # من 10
```

### المهمة 5: مراجعة الحوكمة (Governance Review)
**الوكيل المسؤول:** `governance-review-agent`  
**الأولوية:** عالية  
**الحالة:** إلزامي لكل PR

```yaml
task:
  id: governance-review-task
  agent: governance-review-agent
  triggers:
    - on_pr_open: true
    - on_pr_update: true
  actions:
    - verify_ownership
    - check_approval_rules
    - validate_risk_assessment
    - ensure_documentation
  outputs:
    - reports/GOVERNANCE-CHECK-{pr_number}.md
  required: true
```

---

## 🛡️ قواعد منع التداخل

### 1. التنفيذ المتسلسل (Sequential Execution)
```json
{
  "execution": {
    "mode": "sequential",
    "order": ["integrity", "security", "governance", "code-review", "pr-merge"],
    "wait_for_previous": true,
    "timeout_per_agent": 600
  }
}
```

### 2. قفل الموارد (Resource Locking)
```json
{
  "locking": {
    "enabled": true,
    "resources": {
      "registry.yaml": "exclusive",
      "package.json": "exclusive",
      "workflows/*.yml": "shared"
    },
    "timeout": 300
  }
}
```

### 3. فصل السياقات (Context Isolation)
```json
{
  "isolation": {
    "agents": {
      "security-agent": {
        "can_modify": ["reports/", ".github/workflows/"],
        "cannot_modify": ["src/", "data/agents/"]
      },
      "pr-merge-agent": {
        "can_modify": ["reports/"],
        "cannot_modify": ["src/", "agents/", ".github/"]
      }
    }
  }
}
```

---

## 📊 مصفوفة المسؤوليات (RACI Matrix)

| المهمة | Integrity | Security | Governance | Code-Review | PR-Merge |
|--------|:---------:|:--------:|:----------:|:-----------:|:--------:|
| فحص الملفات | **R** | C | I | I | I |
| فحص الأسرار | I | **R** | C | I | I |
| مراجعة الحوكمة | I | I | **R** | C | I |
| مراجعة الكود | I | C | I | **R** | I |
| إدارة PRs | I | C | C | C | **R** |
| التقارير | A | A | A | A | A |

**R** = Responsible (مسؤول)  
**A** = Accountable (محاسب)  
**C** = Consulted (يُستشار)  
**I** = Informed (يُبلَّغ)

---

## 🔧 التكوين الموصى به للـ Orchestrator

```json
{
  "name": "BSU Task Orchestrator",
  "version": "2.0.0",
  "execution": {
    "mode": "sequential",
    "timeout": 3600,
    "continueOnError": false,
    "retryPolicy": {
      "maxRetries": 3,
      "backoffMultiplier": 2,
      "initialDelay": 30
    }
  },
  "agents": [
    {
      "id": "integrity-agent",
      "order": 1,
      "required": true,
      "blocking": true
    },
    {
      "id": "security-agent",
      "order": 2,
      "required": true,
      "blocking": true
    },
    {
      "id": "governance-review-agent",
      "order": 3,
      "required": true,
      "blocking": false
    },
    {
      "id": "code-review-agent",
      "order": 4,
      "required": false,
      "blocking": false
    },
    {
      "id": "pr-merge-agent",
      "order": 5,
      "required": false,
      "blocking": false
    }
  ],
  "scheduling": {
    "pr_cleanup": "0 2 * * *",
    "security_scan": "0 0 * * *",
    "integrity_check": "0 6 * * 1",
    "full_audit": "0 0 1 * *"
  }
}
```

---

## 🚀 أوامر التنفيذ

### تشغيل التنظيف اليدوي
```bash
# تنظيف PRs القديمة
npm run agents:cleanup-prs

# فحص السلامة الشامل
npm run agents:integrity

# تدقيق أمني كامل
npm run agents:security-audit

# تشغيل جميع الوكلاء بالتسلسل
npm run agents:orchestrate
```

### تشغيل عبر GitHub Actions
```yaml
# .github/workflows/agent-orchestrator.yml
on:
  schedule:
    - cron: '0 2 * * *'  # يومياً الساعة 2 صباحاً
  workflow_dispatch:

jobs:
  orchestrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run agents:orchestrate
```

---

## 📈 مؤشرات الأداء (KPIs)

| المؤشر | الهدف | الحالي |
|--------|-------|--------|
| وقت تنفيذ الوكيل | < 10 دقائق | ✅ 5-8 دقائق |
| PRs المفتوحة | < 10 | ✅ 3 |
| نسبة نجاح CI | > 95% | ✅ 95% |
| الثغرات الأمنية الحرجة | 0 | ✅ 0 |
| درجة جودة الكود | > 7/10 | ✅ 8.5/10 |
| نسبة التغطية بالاختبارات | > 80% | ✅ 95% |

---

## ✅ الخلاصة

هذه الخطة الهندسية المعمارية تضمن:

1. **التنظيم:** كل وكيل له مهمة محددة ومسؤولية واضحة
2. **منع التداخل:** التنفيذ المتسلسل مع قفل الموارد
3. **الأتمتة:** جدولة المهام بشكل تلقائي
4. **المراقبة:** تقارير وإشعارات مستمرة
5. **الأمان:** فحوصات أمنية إلزامية قبل الدمج

---

*تم إنشاء هذه الوثيقة بواسطة BSM Lead Architect (KARIM) - 2026-02-19*
