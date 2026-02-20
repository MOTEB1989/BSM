# دليل الوكلاء والواجهات - LexBANK/BSM

## عدد الوكلاء: 18 وكيلاً

---

## جدول الوكلاء وفوائدهم

| # | الوكيل | الفائدة | السياق |
|---|--------|---------|--------|
| 1 | **Raptor** (رابتور) | النائب المعيّن وقائد المستودع - صلاحية كاملة على إدارة المستودع والوكلاء والأوامر | chat, api, ci, mobile |
| 2 | **my-agent** (BSU Smart) | إدارة المنصة وتنفيذ أوامر التيرمنال | api, ci |
| 3 | **agent-auto** | التوجيه الذكي - يختار الوكيل المناسب تلقائياً | chat, api, mobile |
| 4 | **legal-agent** | المستشار القانوني - الأنظمة والقوانين السعودية | chat, api, mobile |
| 5 | **governance-agent** | خبير الحوكمة والامتثال المؤسسي | chat, api, mobile |
| 6 | **ios-chat-integration-agent** | تكامل دردشة iPhone | chat, api, mobile |
| 7 | **governance-review-agent** | مراجعة الامتثال والحوكمة | api, ci, github |
| 8 | **code-review-agent** | مراجعة الكود وتحسين الجودة | api, ci, github |
| 9 | **security-agent** | فحص الأمان واكتشاف الثغرات | api, ci, github |
| 10 | **pr-merge-agent** | دمج طلبات السحب تلقائياً | ci, github |
| 11 | **integrity-agent** | حارس سلامة المستودع | api, ci |
| 12 | **bsu-audit-agent** | تدقيق BSU | api, ci, mobile |
| 13 | **repository-review-agent** | مراجعة المستودع وتقييم الجودة | api, ci, github |
| 14 | **kimi-agent** | KIMI AI - متخصص صيني ومحادثات طويلة | chat, api, mobile |
| 15 | **gemini-agent** | Google Gemini | chat, api, mobile |
| 16 | **claude-agent** | Claude AI (Anthropic) | chat, api, ci, github |
| 17 | **perplexity-agent** | بحث مباشر مع مصادر | chat, api, mobile |
| 18 | **groq-agent** | استجابة فائقة السرعة | chat, api, mobile |

---

## الواجهات والروابط

### واجهات API الأساسية

| الواجهة | الرابط | الوصف |
|---------|--------|-------|
| الصحة | `GET /api/health` | فحص الصحة الأساسي |
| الصحة المفصلة | `GET /api/health/detailed` | فحص شامل (ملفات، سجل، دوائر) |
| الحالة | `GET /api/status` | إمكانيات النظام والميزات |
| حالة المفاتيح | `GET /api/chat/key-status` | حالة مفاتيح مقدمي AI |

### الوكلاء

| الواجهة | الرابط | الوصف |
|---------|--------|-------|
| قائمة الوكلاء | `GET /api/agents` | عرض جميع الوكلاء |
| تشغيل وكيل | `POST /api/agents/run` | تنفيذ وكيل |
| بدء وكيل | `POST /api/agents/start/:agentId` | بدء وكيل |
| إيقاف وكيل | `POST /api/agents/stop/:agentId` | إيقاف وكيل |
| حالة جميع الوكلاء | `GET /api/agents/status` | حالة كل الوكلاء |
| حالة وكيل | `GET /api/agents/:agentId/status` | حالة وكيل معيّن |
| صحة Raptor | `GET /api/agents/raptor-agent/health` | صحة وكيل Raptor |

### الدردشة

| الواجهة | الرابط | الوصف |
|---------|--------|-------|
| دردشة مع وكيل | `POST /api/chat` | دردشة مع وكيل (agentId: raptor-agent, kimi-agent, ...) |
| دردشة مباشرة | `POST /api/chat/direct` | دردشة مباشرة بدون وكيل |

### المعرف والمعرفة

| الواجهة | الرابط | الوصف |
|---------|--------|-------|
| قائمة المعرفة | `GET /api/knowledge` | وثائق قاعدة المعرفة |

### التحكم والتنسيق

| الواجهة | الرابط | الوصف |
|---------|--------|-------|
| تشغيل التحكم | `POST /api/control/run` | تشغيل عبر لوحة التحكم |
| حالة المنسق | `GET /api/orchestrator/status` | حالة خط الأنابيب |
| تشغيل المنسق | `POST /api/orchestrator/run` | تشغيل خط الأنابيب |

### Webhooks والطوارئ

| الواجهة | الرابط | الوصف |
|---------|--------|-------|
| GitHub Webhook | `POST /webhook/github` | استقبال أحداث GitHub |
| Telegram Webhook | `POST /api/webhooks/telegram` | استقبال رسائل Telegram |
| إيقاف الطوارئ | `POST /api/emergency/shutdown` | إيقاف الطوارئ |
| حالة الطوارئ | `GET /api/emergency/status` | حالة الطوارئ |

---

## روابط الواجهات الأمامية

| الواجهة | الرابط التقريبي |
|---------|-----------------|
| الدردشة الرئيسية | `/chat` |
| لوحة الإدارة | `/admin` (يتطلب x-admin-token) |
| الصفحة الرئيسية | `/` (إعادة توجيه إلى /chat) |
| Kimi Chat | `/kimi-chat` (إن وجد) |

---

## Raptor - النائب المعيّن

**Raptor** هو وكيل النيابة المعيّن عن المالك في المستودع. يتولى:

- قيادة المستودع وإدارة الوكلاء
- تنفيذ أوامر التيرمنال المسموحة
- التنسيق بين الوكلاء
- المراقبة والتقارير
- إنشاء الملفات، تقارير الصحة، تدقيق التهيئة، مراجعة المستودع

### كيفية استخدام Raptor

1. من واجهة الدردشة: اختر **"رابتور (النائب)"** من القائمة المنسدلة
2. عبر API: أرسل طلب إلى `POST /api/chat` مع `agentId: "raptor-agent"`
3. عبر تنفيذ الوكيل: `POST /api/agents/run` مع `agentId: "raptor-agent"`

### الأوامر المسموحة لـ Raptor

`npm`, `node`, `git`, `ls`, `cat`, `echo`, `pwd`, `whoami`, `date`, `uptime`, `df`, `du`, `head`, `tail`, `wc`, `grep`, `find`, `curl`, `ping`, `docker`, `pm2`, `npx`, `which`, `env`, `printenv`, `mkdir`, `cp`, `mv`, `touch`, `chmod`, `tar`, `zip`, `unzip`

---

## تفعيل KIMI AI

لتشغيل وكيل KIMI في المستودع:

1. أضف `KIMI_API_KEY` أو `KIM_API_KEY` في ملف `.env`
2. من واجهة الدردشة: اختر **"KIMI AI"** من القائمة المنسدلة
3. سيتم توجيه الطلبات تلقائياً إلى Kimi عند اختيار هذا الوضع

---

## التوجيه التلقائي (agent-auto)

عند اختيار **"ذكي (تلقائي)"**، يتم توجيه الاستعلامات كالتالي:

- **legal-agent**: أسئلة قانونية
- **governance-agent**: أسئلة حوكمة
- **raptor-agent**: قيادة المستودع، نيابة، أوامر، إدارة وكلاء
- **my-agent**: أوامر التيرمنال والإدارة
- **direct**: أسئلة عامة

---

*آخر تحديث: 2026-02-20*
