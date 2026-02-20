# الوكلاء والواجهات والروابط | Agents, Interfaces & Links

> آخر تحديث: 2026-02-20

## عدد الوكلاء: 18 وكيل

| # | الاسم | ID | الفئة | الفائدة |
|---|------|-----|-------|---------|
| 1 | **Raptor** | raptor-agent | system | نائب مالك المستودع، قيادة المستودع والوكالة، تنفيذ الأوامر، تنسيق الوكلاء |
| 2 | BSU Smart Agent | my-agent | system | إدارة المنصة، تنفيذ أوامر التيرمنال، الإشراف على النظام |
| 3 | Smart Router Agent | agent-auto | conversational | توجيه الاستعلامات للوكيل المناسب (legal, governance, raptor, direct) |
| 4 | Legal Analysis Agent | legal-agent | conversational | التحليل القانوني السعودي والخليجي، العقود، نظام العمل |
| 5 | Governance Agent | governance-agent | audit | الحوكمة، الامتثال، لوائح هيئة السوق، إدارة المخاطر |
| 6 | iPhone Chat Integration | ios-chat-integration-agent | conversational | مراجعة تكامل المحادثة على iPhone |
| 7 | Governance Compliance Officer | governance-review-agent | audit | مراجعة الامتثال ووقف التغييرات غير المطابقة |
| 8 | Code Review Agent | code-review-agent | audit | مراجعة الكود وتحليل ثابت |
| 9 | Security Agent | security-agent | security | فحص الثغرات وتقرير الأمان |
| 10 | PR Merge Agent | pr-merge-agent | security | دمج الطلبات تلقائياً بعد التحقق من الجودة |
| 11 | Repository Integrity Guardian | integrity-agent | system | صيانة المستودع، التنظيف، التحقق |
| 12 | BSU Audit Agent | bsu-audit-agent | audit | عمليات تدقيق آمنة للتهيئة |
| 13 | Repository Review Agent | repository-review-agent | audit | مراجعة المستودع: البنية، الجودة، CI/CD |
| 14 | KIMI AI Agent | kimi-agent | conversational | مساعد محادثة بـ Moonshot AI (Kimi) |
| 15 | Google Gemini AI | gemini-agent | conversational | محادثة بـ Google Gemini |
| 16 | Claude AI (Anthropic) | claude-agent | conversational | Claude للتحليل والمراجعة والت推理 |
| 17 | Perplexity Search AI | perplexity-agent | conversational | بحث ويب مع إحالات |
| 18 | Groq LPU AI | groq-agent | conversational | محادثة سريعة بـ Groq |

---

## الواجهات (Interfaces)

### واجهات الويب (Web UIs)

| الواجهة | المسار | الوصف |
|--------|-------|-------|
| Chat | `/chat` | واجهة المحادثة الرئيسية (Vue 3 + Tailwind) |
| Kimi Chat | `/kimi-chat` | واجهة محادثة Kimi |
| Admin | `/admin` | لوحة الإدارة (يتطلب `x-admin-token`) |
| iOS App | `/ios-app` | تطبيق CoreHub Nexus للـ iPhone |

### نقاط النهاية الرئيسية (API Endpoints)

| المسار | الطريقة | الوصف |
|--------|---------|-------|
| `/health` | GET | فحص الصحة الأساسي |
| `/api/health` | GET | فحص صحة API |
| `/api/health/detailed` | GET | فحص شامل (ملفات، سجل، دوائر) |
| `/api/status` | GET | القدرات والميزات |
| `/api/agents` | GET | قائمة الوكلاء |
| `/api/agents/run` | POST | تشغيل وكيل |
| `/api/agents/start/:agentId` | POST | بدء وكيل |
| `/api/agents/stop/:agentId` | POST | إيقاف وكيل |
| `/api/agents/status` | GET | حالة جميع الوكلاء |
| `/api/agents/:agentId/status` | GET | حالة وكيل محدد |
| `/api/agents/:agentId/health` | GET | فحص صحة وكيل |
| `/api/chat` | POST | محادثة مع وكيل (agentId, message, history) |
| `/api/chat/key-status` | GET | حالة مفاتيح مزودي AI |
| `/api/knowledge` | GET | وثائق المعرفة |
| `/api/admin/*` | * | إدارة (يتطلب `x-admin-token`) |
| `/api/ai-proxy/*` | POST | وكيل متعدد المزودين |
| `/api/orchestrator/run` | POST | تشغيل خط الأنابيب |
| `/api/orchestrator/status` | GET | حالة التنسيق |
| `/api/control/*` | POST | مستوى التحكم |
| `/api/emergency/*` | POST | إجراءات الطوارئ |
| `/api/agent/execute` | POST | تنفيذ أمر (admin فقط) |
| `/api/agent/status` | GET | حالة النظام |
| `/webhook/github` | POST | Webhook من GitHub |
| `/api/webhooks/github` | POST | Webhook GitHub (API) |
| `/api/webhooks/telegram` | POST | Webhook Telegram |

---

## روابط تشغيل Raptor

### عبر المحادثة (Chat)

```http
POST /api/chat
Content-Type: application/json

{
  "agentId": "raptor-agent",
  "message": "اعرض حالة المستودع وتشغيل الاختبارات",
  "history": [],
  "language": "ar"
}
```

### عبر تشغيل الوكيل (Agent Run)

```http
POST /api/agents/run
Content-Type: application/json

{
  "agentId": "raptor-agent",
  "input": "اعرض حالة المستودع وتشغيل الاختبارات"
}
```

### أمثلة أوامر لـ Raptor

| المهمة | الأمر/الطلب |
|--------|-------------|
| حالة Git | "اعرض حالة Git" |
| تشغيل الاختبارات | "شغّل الاختبارات" |
| تثبيت المكتبات | "ثبّت المكتبات" |
| قائمة الوكلاء | "ما الوكلاء المتاحة؟" |
| فحص الصحة | "فحص صحة النظام" |
| تنسيق المهام | "وجّه هذا السؤال القانوني لـ legal-agent" |

---

## تمكين النماذج (Enabling Models)

لتفعيل نموذج Kimi (K) أو غيره:

1. **Kimi**: ضع `KIMI_API_KEY` في `.env`
2. **Claude**: ضع `ANTHROPIC_API_KEY` في `.env`
3. **Perplexity**: ضع `PERPLEXITY_KEY` في `.env`
4. **OpenAI**: ضع `OPENAI_BSM_KEY` أو `OPENAI_API_KEY` في `.env`
5. **Gemini**: ضع مفتاح Google في `.env`

---

## بنية الملفات

```
data/agents/
  index.json           # سجل ملفات الوكلاء
  raptor-agent.yaml    # Raptor
  my-agent.yaml        # BSU Smart Agent
  ...

agents/
  registry.yaml        # سجل الحوكمة للوكلاء
```

---

*هذا الملف جزء من مستودع LexBANK/BSM.*
