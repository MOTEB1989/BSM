# تكامل المنصات | Platform Integration

دليل ربط iPhone و Cursor (Windows) والتحكم عن بُعد وإنشاء واجهات دردشة الذكاء الاصطناعي.

Guide for connecting iPhone, Cursor (Windows), remote control, and AI chat interfaces.

---

## 🔗 الواجهات والروابط | Interfaces & URLs

| الواجهة | الرابط | الوصف |
|--------|--------|-------|
| **CoreHub** | https://corehub.nexus | واجهة إدارة الوكلاء (نفس Backend) |
| **CoreHub WWW** | https://www.corehub.nexus | نفس الواجهة |
| **LexPrim** | https://lexprim.com | دردشة Nuxt 3 الرئيسية |
| **LexPrim WWW** | https://www.lexprim.com | نفس الواجهة |
| **Backend API** | https://sr-bsm.onrender.com | خادم BSM على Render |
| **GitHub Pages** | https://moteb1989.github.io/BSM | الواجهة الأمامية |
| **Lexdo Docs** | https://lexdo.uk | التوثيق والموقع |
| **Cloudflare** | https://9e71cbf3.lexbank.pages.dev | نشر بديل |
| **المستودع** | https://github.com/MOTEB1989/BSM | كود المصدر |

> **ملاحظة**: corehub.nexus و lexprim.com و sr-bsm.onrender.com تشير إلى نفس الخادم (domains في Render).
> corehub.nexus قد يكون خلف Cloudflare (فحص أمان). استخدم sr-bsm.onrender.com أو lexprim.com للوصول المباشر.

---

## 📱 iPhone / الجوال

### PWA على الآيفون | PWA on iPhone

1. افتح المتصفح (Safari) وانتقل إلى أحد الروابط:
   ```
   https://corehub.nexus/chat
   https://lexprim.com
   https://sr-bsm.onrender.com/chat
   https://moteb1989.github.io/BSM
   ```

2. من قائمة المشاركة (Share) اختر **"إضافة إلى الشاشة الرئيسية"** (Add to Home Screen)

3. سيظهر أيقونة LexBANK كتطبيق مستقل مع دعم RTL والعربية

### واجهات الدردشة المتاحة | Available Chat Interfaces

| الواجهة | الرابط | الوصف |
|---------|--------|-------|
| LexBANK Chat | `/chat` | دردشة مع وكلاء الذكاء الاصطناعي |
| Direct Chat | `/chat` (وضع Direct) | محادثة مباشرة بدون وكيل |
| Legal Agent | `/chat` (وضع Legal) | الخبير القانوني |
| Governance | `/chat` (وضع Governance) | وكيل الحوكمة |

### API للجوال | Mobile API

```
GET  /api/mobile/status   # حالة المنصة
GET  /api/mobile/connect  # فحص الاتصال
POST /api/chat/direct     # دردشة مباشرة
GET  /api/chat/key-status # حالة مفاتيح AI
```

---

## 💻 Cursor (Windows)

### إعداد MCP | MCP Setup

1. افتح Cursor على Windows
2. انتقل إلى **Settings** → **Tools & MCP** → **Add new MCP server**
3. أو انسخ محتوى `.cursor/mcp.json` إلى إعدادات Cursor

### تكوين MCP | MCP Configuration

الملف `.cursor/mcp.json` في جذر المشروع:

```json
{
  "mcpServers": {
    "lexbank-unified": {
      "command": "node",
      "args": ["./mcp-servers/bsu-agent-server.js"],
      "env": {
        "BSM_API_URL": "https://sr-bsm.onrender.com/api"
      }
    },
    "bsm-banking-agents": {
      "command": "node",
      "args": ["./mcp-servers/banking-hub.js"],
      "env": {
        "BSM_API_URL": "https://sr-bsm.onrender.com/api"
      }
    }
  }
}
```

### خوادم MCP المتاحة | Available MCP Servers

| الخادم | الأمر | الوصف |
|--------|-------|-------|
| lexbank-unified | `npm run mcp:start` | وكلاء LexBANK الموحدين |
| bsm-banking-agents | `npm run mcp:banking` | عُصبة العوامل البنكية |

### أدوات Cursor | Cursor Tools

بعد الربط، Cursor يمكنه استخدام:

- `list_agents` - قائمة الوكلاء
- `chat_gpt` - دردشة GPT
- `chat_gemini` - دردشة Gemini
- `chat_claude` - دردشة Claude
- `chat_perplexity` - دردشة Perplexity
- `route_banking_query` - توجيه استفسار بنكي
- `banking_chat` - دردشة بنكية مباشرة

---

## 🔗 التحكم عن بُعد | Remote Control

### من الآيفون | From iPhone

- **الدردشة**: كاملة عبر PWA
- **الحالة**: `GET /api/mobile/status`
- **الوكلاء**: للقراءة فقط في وضع الجوال (MOBILE_MODE)

### من Cursor | From Cursor

- **تشغيل الوكلاء**: عبر أدوات MCP
- **الدردشة**: عبر `chat_gpt`, `chat_gemini`, إلخ
- **المعرفة**: عبر الموارد `bsu://agents`, `bsu://status`

### من سطح المكتب | From Desktop

- وصول كامل لجميع نقاط النهاية
- تشغيل الوكلاء، الإدارة، الطوارئ

---

## 🏗️ بنية المشروع | Project Structure

```
BSM/
├── .cursor/
│   └── mcp.json              # تكوين Cursor MCP
├── mcp-servers/
│   ├── bsu-agent-server.js   # خادم LexBANK الموحد
│   └── banking-hub.js       # عُصبة العوامل البنكية
├── src/
│   ├── chat/                 # واجهة الدردشة (PWA)
│   ├── routes/
│   │   ├── chat.js           # API الدردشة
│   │   └── mobile.js         # API الجوال والتحكم
│   └── middleware/
│       └── mobileMode.js     # قيود وضع الجوال
├── shared/
│   └── config.js             # إعدادات موحدة
└── docs/
    └── INTEGRATION.md        # هذا الملف
```

---

## ⚙️ متغيرات البيئة | Environment Variables

للخوادم المحلية أو التطوير:

```bash
# Backend URL (للـ MCP والواجهات)
BSM_API_URL=https://sr-bsm.onrender.com/api

# مفاتيح AI - ترتيب الأولوية في الدردشة
OPENAI_BSM_KEY=sk-...      # أو OPENAI_BSU_KEY أو OPENAI_API_KEY
KIMI_API_KEY=...           # Moonshot Kimi
PERPLEXITY_KEY=...         # Perplexity (بحث مباشر)
ANTHROPIC_API_KEY=...      # Claude
GEMINI_API_KEY=...         # أو GOOGLE_API_KEY - Gemini
GROQ_API_KEY=...           # Groq (سريع)
```

### النماذج المفعّلة في الواجهة | Models Shown in UI

شريط الحالة يعرض الحالة الفعلية حسب المفاتيح المُعدّة:
- **GPT-4** ← OPENAI_BSM_KEY / OPENAI_BSU_KEY / OPENAI_API_KEY
- **Kimi** ← KIMI_API_KEY
- **Perplexity** ← PERPLEXITY_KEY
- **Claude** ← ANTHROPIC_API_KEY
- **Gemini** ← GEMINI_API_KEY أو GOOGLE_API_KEY
- **Groq** ← GROQ_API_KEY

الدردشة تجرب النماذج بالترتيب أعلاه حتى ينجح أحدها.

---

## 🔧 استكشاف الأخطاء | Troubleshooting

### Cursor لا يتعرف على MCP

1. أعد تشغيل Cursor بالكامل
2. تأكد أن `node` في PATH
3. نفّذ `npm run mcp:install` في جذر المشروع

### الآيفون لا يتصل

1. تأكد من HTTPS (مطلوب لـ PWA)
2. تحقق من CORS في `shared/config.js`
3. جرّب `GET /api/mobile/connect`

### الدردشة لا تعمل من الجوال

1. تحقق من `MOBILE_MODE` - الدردشة مسموحة دائماً
2. راجع `GET /api/chat/key-status` للتأكد من مفاتيح AI

---

## 📚 مراجع | References

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Cursor MCP Docs](https://cursor.com/docs/context/mcp)
- [PWA على iOS](https://developer.apple.com/documentation/webkit/webkit_js)
