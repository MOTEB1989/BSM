# LexBANK MCP Server

[Model Context Protocol (MCP)](https://modelcontextprotocol.io) Server للتكامل مع وكلاء الذكاء الاصطناعي في LexBANK/BSM.

## نظرة عامة

يوفر هذا الخادم واجهة MCP لـ GitHub Copilot والأدوات المتوافقة للوصول إلى وكلاء الذكاء الاصطناعي في BSM:

- **Gemini Chat**: للاستفسارات العامة والإبداعية
- **Claude Chat**: للتحليل القانوني والعميق
- **Perplexity Search**: للبحث المباشر في الإنترنت
- **GPT Chat**: للاستشارات التقنية المعقدة
- **Agent Status**: لفحص حالة جميع الوكلاء
- **Banking Knowledge**: للاستعلام من قاعدة المعارف البنكية

## التثبيت

### الخطوة 1: تثبيت الاعتماديات

```bash
cd mcp-servers
npm install
```

### الخطوة 2: تكوين المتغيرات البيئية

قم بتعيين عنوان API للخلفية (اختياري، الافتراضي: https://sr-bsm.onrender.com/api):

```bash
export API_BASE=https://your-backend-url.com/api
```

### الخطوة 3: إعداد GitHub Copilot

أضف التكوين التالي إلى إعدادات GitHub Copilot (Settings > Extensions > GitHub Copilot > Edit in settings.json):

```json
{
  "github.copilot.chat.mcp.servers": {
    "lexbank": {
      "command": "node",
      "args": [
        "/absolute/path/to/BSM/mcp-servers/bsu-agent-server.js"
      ],
      "env": {
        "API_BASE": "https://sr-bsm.onrender.com/api"
      }
    }
  }
}
```

**ملاحظة**: استبدل `/absolute/path/to/BSM` بالمسار الكامل لمستودعك.

## الاستخدام

بعد التكوين، يمكنك استخدام الأدوات التالية في GitHub Copilot:

### 1. الدردشة مع Gemini

```
@lexbank gemini_chat --message "ما هي أفضل الممارسات في البرمجة؟"
```

### 2. الدردشة مع Claude

```
@lexbank claude_chat --message "حلل هذا العقد القانوني"
```

### 3. البحث عبر Perplexity

```
@lexbank perplexity_search --query "أحدث التطورات في التكنولوجيا المالية"
```

### 4. الدردشة مع GPT-4

```
@lexbank gpt_chat --message "كيف أحسن أداء تطبيق Node.js؟"
```

### 5. فحص حالة الوكلاء

```
@lexbank check_agents_status
```

### 6. الاستعلام من قاعدة المعارف البنكية

```
@lexbank banking_knowledge_query --question "ما هي متطلبات SAMA للبنوك؟" --category "legal"
```

## البنية التحتية

```
mcp-servers/
├── bsu-agent-server.js   # خادم MCP الرئيسي
├── package.json          # الاعتماديات والتكوين
└── README.md             # هذا الملف
```

## الأدوات المتاحة

| الأداة | الوصف | المعاملات |
|-------|--------|-----------|
| `gemini_chat` | دردشة مع Gemini | `message`, `temperature` |
| `claude_chat` | دردشة مع Claude | `message`, `history` |
| `perplexity_search` | بحث عبر Perplexity | `query`, `model` |
| `gpt_chat` | دردشة مع GPT-4 | `message`, `context` |
| `check_agents_status` | فحص حالة الوكلاء | - |
| `banking_knowledge_query` | استعلام قاعدة المعارف | `question`, `category` |

## الموارد المتاحة

| المورد | الوصف |
|--------|--------|
| `lexbank://agents/registry` | سجل الوكلاء المتاحين |
| `lexbank://docs/banking-laws` | القوانين البنكية السعودية |
| `lexbank://config/security` | إعدادات الأمان |

## التطوير

### تشغيل الخادم محليًا

```bash
npm start
# أو للتطوير مع إعادة التحميل التلقائي
npm run dev
```

### اختبار الخادم

يمكنك اختبار الخادم باستخدام stdio:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node bsu-agent-server.js
```

## استكشاف الأخطاء

### الخادم لا يعمل

1. تحقق من تثبيت الاعتماديات: `npm install`
2. تحقق من المسار المطلق في إعدادات Copilot
3. تحقق من توفر Backend API

### لا تظهر الأدوات في Copilot

1. أعد تشغيل VS Code
2. تحقق من ملف إعدادات Copilot
3. تحقق من سجلات Copilot (Output > GitHub Copilot)

## الأمان

- جميع الطلبات تمر عبر Backend API الآمن
- لا يتم تخزين أي بيانات حساسة في الخادم
- يستخدم HTTPS للاتصال بالخلفية

## الترخيص

UNLICENSED - للاستخدام الداخلي في LexBANK فقط

## الدعم

للحصول على الدعم، راجع:
- [وثائق BSM الرئيسية](../README.md)
- [وثائق MCP](https://modelcontextprotocol.io)
- [GitHub Issues](https://github.com/LexBANK/BSM/issues)
