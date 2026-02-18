# إعداد خادم MCP لـ LexBANK

دليل شامل لإعداد خادم Model Context Protocol (MCP) للتكامل مع GitHub Copilot ووكلاء الذكاء الاصطناعي في BSM.

## 📋 المتطلبات الأساسية

- Node.js 22+ (راجع `.nvmrc`)
- GitHub Copilot مُفعّل في VS Code
- الوصول إلى BSM Backend API

## 🚀 التثبيت السريع

### 1. تثبيت اعتماديات MCP Server

```bash
cd mcp-servers
npm install
```

### 2. تكوين GitHub Copilot

أضف التكوين التالي إلى إعدادات VS Code:

**الطريقة الأولى: عبر واجهة الإعدادات**
1. افتح VS Code Settings (Ctrl+,)
2. ابحث عن "GitHub Copilot MCP"
3. انقر "Edit in settings.json"

**الطريقة الثانية: مباشرة في settings.json**
1. افتح Command Palette (Ctrl+Shift+P)
2. اكتب "Preferences: Open User Settings (JSON)"
3. أضف التكوين التالي:

```json
{
  "github.copilot.chat.mcp.servers": {
    "lexbank": {
      "command": "node",
      "args": [
        "/home/runner/work/BSM/BSM/mcp-servers/bsu-agent-server.js"
      ],
      "env": {
        "API_BASE": "https://sr-bsm.onrender.com/api"
      }
    }
  }
}
```

**⚠️ مهم**: استبدل المسار بالمسار الكامل لمستودعك على جهازك.

### 3. إعادة تشغيل VS Code

أعد تشغيل VS Code لتطبيق التغييرات.

## 🔧 التكوين المتقدم

### متغيرات البيئة

يمكنك تخصيص عنوان Backend API:

```json
{
  "github.copilot.chat.mcp.servers": {
    "lexbank": {
      "command": "node",
      "args": ["/path/to/mcp-servers/bsu-agent-server.js"],
      "env": {
        "API_BASE": "http://localhost:3000/api"
      }
    }
  }
}
```

### مفاتيح API للوكلاء (اختياري)

إذا كنت تريد إضافة مفاتيح API مباشرة:

```json
{
  "github.copilot.chat.mcp.servers": {
    "lexbank": {
      "command": "node",
      "args": ["/path/to/mcp-servers/bsu-agent-server.js"],
      "env": {
        "API_BASE": "https://sr-bsm.onrender.com/api",
        "GEMINI_API_KEY": "your-gemini-key",
        "PERPLEXITY_API_KEY": "your-perplexity-key",
        "ANTHROPIC_API_KEY": "your-claude-key"
      }
    }
  }
}
```

## 📚 الأدوات المتاحة

بعد التثبيت، ستتوفر الأدوات التالية في GitHub Copilot Chat:

### 1. **gemini_chat** - دردشة مع Gemini
للاستفسارات العامة والإبداعية

```
@lexbank use gemini_chat
message: "ما هي أفضل الممارسات في البرمجة؟"
```

### 2. **claude_chat** - دردشة مع Claude
للتحليل القانوني والعميق

```
@lexbank use claude_chat
message: "حلل هذا العقد القانوني"
```

### 3. **perplexity_search** - بحث عبر Perplexity
للبحث المباشر في الإنترنت

```
@lexbank use perplexity_search
query: "أحدث التطورات في التكنولوجيا المالية"
model: "balanced"
```

### 4. **gpt_chat** - دردشة مع GPT-4
للاستشارات التقنية المعقدة

```
@lexbank use gpt_chat
message: "كيف أحسن أداء تطبيق Node.js؟"
```

### 5. **check_agents_status** - فحص حالة الوكلاء
لمعرفة حالة جميع الوكلاء (Online/Offline)

```
@lexbank use check_agents_status
```

### 6. **banking_knowledge_query** - استعلام قاعدة المعارف
للاستعلام من قاعدة المعارف البنكية

```
@lexbank use banking_knowledge_query
question: "ما هي متطلبات SAMA للبنوك؟"
category: "legal"
```

الفئات المتاحة: `general`, `legal`, `technical`, `compliance`

## 🔍 الموارد المتاحة

يوفر خادم MCP الموارد التالية للقراءة:

- **`lexbank://agents/registry`** - سجل الوكلاء المتاحين
- **`lexbank://docs/banking-laws`** - القوانين البنكية السعودية (SAMA)
- **`lexbank://config/security`** - إعدادات الأمان الحالية

## 🧪 الاختبار والتحقق

### اختبار الخادم محليًا

```bash
cd mcp-servers
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node bsu-agent-server.js
```

يجب أن ترى قائمة بجميع الأدوات المتاحة.

### التحقق من التكامل

1. افتح VS Code
2. افتح Copilot Chat (Ctrl+Shift+I)
3. اكتب `@lexbank` - يجب أن ترى الأدوات المتاحة
4. جرب أداة: `@lexbank use check_agents_status`

## 🐛 استكشاف الأخطاء وإصلاحها

### المشكلة: الخادم لا يظهر في Copilot

**الحلول:**
1. تحقق من تثبيت الاعتماديات: `cd mcp-servers && npm install`
2. تحقق من المسار المطلق في settings.json
3. أعد تشغيل VS Code بالكامل
4. افتح Output Panel > GitHub Copilot للتحقق من الأخطاء

### المشكلة: خطأ "Module not found"

```bash
cd mcp-servers
npm install
```

### المشكلة: الأدوات لا تستجيب

1. تحقق من أن Backend API يعمل: `curl https://sr-bsm.onrender.com/api/health`
2. تحقق من المتغيرات البيئية في settings.json
3. راجع سجلات Copilot في Output Panel

### المشكلة: خطأ في الاتصال بـ Backend

تحقق من:
- الاتصال بالإنترنت
- توفر Backend API
- صحة عنوان API_BASE

## 📖 أمثلة الاستخدام

### مثال 1: البحث عن معلومات مالية

```
@lexbank use perplexity_search
query: "What are the latest regulations from SAMA regarding fintech?"
model: "pro"
```

### مثال 2: تحليل قانوني

```
@lexbank use claude_chat
message: "Review this contract for compliance with Saudi banking laws"
```

### مثال 3: استشارة تقنية

```
@lexbank use gpt_chat
message: "How can I optimize database queries in Express.js?"
context: "Using PostgreSQL with 1M+ records"
```

### مثال 4: فحص حالة النظام

```
@lexbank use check_agents_status
```

### مثال 5: استعلام قاعدة المعارف

```
@lexbank use banking_knowledge_query
question: "What are the KYC requirements for corporate accounts?"
category: "compliance"
```

## 🏗️ البنية التحتية

```
mcp-servers/
├── bsu-agent-server.js    # خادم MCP الرئيسي
├── package.json           # الاعتماديات والإعدادات
├── README.md              # الوثائق التفصيلية
└── .gitignore             # استثناءات Git
```

## 🔐 الأمان

- ✅ جميع الطلبات تمر عبر Backend API الآمن
- ✅ لا يتم تخزين مفاتيح API في الكود
- ✅ استخدام HTTPS للاتصال بالخلفية
- ✅ لا يتم تخزين بيانات المحادثات

### تحديثات الأمان

**🔒 2026-02-18 - Security Patch Applied:**

تم تحديث @modelcontextprotocol/sdk من v0.4.0 إلى v1.25.2 لإصلاح ثغرتين أمنيتين حرجتين:

1. **ReDoS Vulnerability (HIGH):**
   - الثغرة: Regular Expression Denial of Service
   - الإصدارات المتأثرة: < 1.25.2
   - الحل: تحديث إلى 1.25.2+

2. **DNS Rebinding Protection (MEDIUM-HIGH):**
   - الثغرة: حماية DNS rebinding غير مفعلة افتراضياً
   - الإصدارات المتأثرة: < 1.24.0
   - الحل: تحديث إلى 1.24.0+ (مضمن في 1.25.2)

📖 **للمزيد من التفاصيل:** راجع [SECURITY-PATCH-MCP-2026-02-18.md](./SECURITY-PATCH-MCP-2026-02-18.md)

**للتحقق من الإصدار الآمن:**
```bash
cd mcp-servers
npm list @modelcontextprotocol/sdk
# يجب أن يظهر: @modelcontextprotocol/sdk@1.25.2
```

## 🔗 روابط مفيدة

- [وثائق MCP الرسمية](https://modelcontextprotocol.io)
- [وثائق BSM](./README.md)
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [BSM Backend API](https://sr-bsm.onrender.com/api)

## 📝 ملاحظات

1. **المسار المطلق**: تأكد من استخدام المسار الكامل لملف `bsu-agent-server.js`
2. **Node.js Version**: تأكد من استخدام Node.js 22+ (راجع `.nvmrc`)
3. **إعادة التشغيل**: قد تحتاج لإعادة تشغيل VS Code بعد تغيير الإعدادات
4. **Backend API**: تأكد من أن Backend API متاح ويعمل بشكل صحيح

## 🤝 المساهمة

للمساهمة في تطوير خادم MCP:
1. افتح issue في [GitHub](https://github.com/LexBANK/BSM/issues)
2. قدم pull request مع التحسينات المقترحة
3. اتبع معايير الكود في المستودع

## 📄 الترخيص

UNLICENSED - للاستخدام الداخلي في LexBANK فقط

---

**تم الإنشاء بواسطة**: LexBANK Team  
**التاريخ**: 2026-02-18  
**الإصدار**: 1.0.0
