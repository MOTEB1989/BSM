# دليل تكامل بروتوكول MCP - MCP Integration Guide

## نظرة عامة - Overview

### العربية
بروتوكول السياق النموذجي (MCP) هو معيار مفتوح المصدر يتيح التكامل السلس بين تطبيقات الذكاء الاصطناعي والخدمات الخارجية. تستخدم منصة BSM بروتوكول MCP للتكامل مع GitHub Copilot وتوفير الوصول الموحد إلى وكلاء الذكاء الاصطناعي المتعددين.

### English
Model Context Protocol (MCP) is an open standard that enables seamless integration between AI applications and external services. The BSM platform uses MCP to integrate with GitHub Copilot and provide unified access to multiple AI agents.

---

## البنية التحتية - Architecture

### خادم MCP الموحد - Unified MCP Server
```
mcp-servers/bsu-agent-server.js
├── الأدوات المتاحة - Available Tools
│   ├── list_agents (قائمة الوكلاء)
│   ├── chat_gpt (محادثة GPT-4)
│   ├── chat_gemini (محادثة Gemini)
│   ├── chat_claude (محادثة Claude)
│   ├── chat_perplexity (محادثة Perplexity)
│   ├── chat_kimi (محادثة Kimi)
│   └── get_key_status (حالة المفاتيح)
│
└── الموارد المتاحة - Available Resources
    ├── bsu://config (التكوين الموحد)
    ├── bsu://agents (قائمة الوكلاء)
    └── bsu://status (حالة النظام)
```

---

## التكوين - Configuration

### ملف التكوين - Configuration File
موقع الملف: `.github/copilot/mcp.json`

```json
{
  "mcpServers": {
    "lexbank-unified": {
      "command": "node",
      "args": ["mcp-servers/bsu-agent-server.js"],
      "env": {
        "BSM_API_URL": "https://sr-bsm.onrender.com/api",
        "NODE_ENV": "production"
      },
      "metadata": {
        "name": "LexBANK/BSU Unified Agent Server",
        "version": "2.0.0",
        "capabilities": ["chat", "agents", "knowledge", "orchestrator"]
      }
    }
  }
}
```

---

## الوكلاء المتاحون - Available AI Agents

### 1. GPT-4 (OpenAI)
```javascript
// استخدام - Usage
await chat_gpt({
  message: "ما هي أفضل ممارسات البرمجة؟",
  language: "ar",
  history: []
});
```

**المميزات - Features:**
- دعم كامل للغة العربية - Full Arabic support
- سياق محادثة طويل - Long conversation context
- قدرات متعددة الاستخدامات - Versatile capabilities

### 2. Gemini (Google)
```javascript
// استخدام - Usage
await chat_gemini({
  message: "Explain quantum computing",
  language: "en"
});
```

**المميزات - Features:**
- فهم متعدد الوسائط - Multimodal understanding
- تفكير متقدم - Advanced reasoning
- خبرة في اللغة العربية - Arabic language expertise

### 3. Claude (Anthropic)
```javascript
// استخدام - Usage
await chat_claude({
  message: "Review this code for security issues",
  language: "en"
});
```

**المميزات - Features:**
- تحليل متعمق - Deep analysis
- مراجعة الكود - Code review
- تفكير أخلاقي - Ethical reasoning

### 4. Perplexity (البحث والاستشهادات - Search & Citations)
```javascript
// استخدام - Usage
await chat_perplexity({
  message: "Latest AI developments in 2026",
  language: "en"
});
```

**المميزات - Features:**
- بحث في الوقت الفعلي - Real-time web search
- مصادر موثوقة - Reliable sources
- استشهادات دقيقة - Accurate citations

### 5. Kimi (Moonshot AI)
```javascript
// استخدام - Usage
await chat_kimi({
  message: "تحليل نص طويل جداً",
  language: "ar"
});
```

**المميزات - Features:**
- سياق طويل جداً (200K+ tokens) - Ultra-long context
- متخصص في اللغة الصينية - Chinese language expertise
- معالجة ملفات كبيرة - Large document processing

---

## التثبيت والإعداد - Installation & Setup

### الخطوة 1: تثبيت التبعيات - Install Dependencies
```bash
# تثبيت التبعيات الرئيسية
npm install

# تثبيت تبعيات خادم MCP
cd mcp-servers
npm install
```

### الخطوة 2: تكوين متغيرات البيئة - Configure Environment Variables
```bash
# نسخ ملف المثال
cp .env.example .env

# إضافة مفاتيح API
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
ANTHROPIC_API_KEY=your_anthropic_key
PERPLEXITY_KEY=your_perplexity_key
KIMI_API_KEY=your_kimi_key
```

### الخطوة 3: تشغيل الخادم - Start Server
```bash
# تشغيل خادم MCP
npm run mcp:start

# أو تشغيل الخادم الرئيسي
npm run dev
```

---

## أمثلة الاستخدام - Usage Examples

### مثال 1: محادثة عربية - Arabic Chat
```javascript
const response = await fetch('https://sr-bsm.onrender.com/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'اشرح لي مفهوم الذكاء الاصطناعي',
    language: 'ar',
    destination: 'gemini-agent'
  })
});
```

### مثال 2: مراجعة الكود - Code Review
```javascript
const response = await fetch('https://sr-bsm.onrender.com/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Review this JavaScript code for best practices',
    language: 'en',
    destination: 'claude-agent'
  })
});
```

### مثال 3: البحث مع الاستشهادات - Search with Citations
```javascript
const response = await fetch('https://sr-bsm.onrender.com/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What are the latest cybersecurity threats?',
    language: 'en',
    destination: 'perplexity-agent'
  })
});
```

---

## الأمان والامتثال - Security & Compliance

### معايير ساما المصرفية - SAMA Banking Standards
تلتزم منصة BSM بمعايير مؤسسة النقد العربي السعودي (ساما) للأمان المصرفي:

The BSM platform complies with Saudi Central Bank (SAMA) banking security standards:

1. **تشفير البيانات - Data Encryption**
   - TLS 1.3 لجميع الاتصالات
   - تشفير البيانات المخزنة (AES-256)
   - إدارة آمنة للمفاتيح

2. **المصادقة والترخيص - Authentication & Authorization**
   - مصادقة ثنائية العامل (2FA)
   - مراقبة الوصول القائمة على الأدوار
   - تسجيل دخول آمن مع الرموز المؤقتة

3. **تدقيق السجلات - Audit Logging**
   - تسجيل جميع التفاعلات مع الذكاء الاصطناعي
   - سجلات غير قابلة للتعديل
   - الاحتفاظ بالسجلات لمدة 7 سنوات

4. **إقامة البيانات - Data Residency**
   - خوادم في السعودية (اختياري)
   - الامتثال للوائح حماية البيانات
   - النسخ الاحتياطي الجغرافي المتعدد

---

## استكشاف الأخطاء - Troubleshooting

### المشكلة: خادم MCP لا يستجيب - MCP Server Not Responding

**الحل - Solution:**
```bash
# تحقق من الحالة
npm run health:detailed

# أعد تشغيل الخادم
pkill -f "bsu-agent-server"
npm run mcp:start
```

### المشكلة: مفاتيح API غير صالحة - Invalid API Keys

**الحل - Solution:**
```bash
# تحقق من حالة المفاتيح
curl https://sr-bsm.onrender.com/api/chat/key-status

# أعد تكوين المفاتيح في .env
```

### المشكلة: خطأ في الاتصال - Connection Error

**الحل - Solution:**
```bash
# تحقق من الشبكة
ping sr-bsm.onrender.com

# تحقق من إعدادات CORS
# تأكد من إضافة نطاقك في CORS_ORIGINS
```

---

## الأداء والمراقبة - Performance & Monitoring

### مقاييس الأداء - Performance Metrics
```javascript
// الحصول على مقاييس الأداء
const metrics = await fetch('https://sr-bsm.onrender.com/api/status');

// مثال على الاستجابة
{
  "providers": {
    "openai": { "status": "active", "latency": "120ms" },
    "gemini": { "status": "active", "latency": "95ms" },
    "claude": { "status": "active", "latency": "110ms" },
    "perplexity": { "status": "active", "latency": "85ms" },
    "kimi": { "status": "active", "latency": "150ms" }
  }
}
```

### الفحص الصحي - Health Checks
```bash
# فحص صحي أساسي
npm run health

# فحص صحي مفصل
npm run health:detailed
```

---

## الموارد الإضافية - Additional Resources

### الوثائق - Documentation
- [دليل المطور - Developer Guide](./DEVELOPER-GUIDE.md)
- [دليل API - API Guide](./API-GUIDE.md)
- [دليل الأمان - Security Guide](../SECURITY.md)
- [دليل الحوكمة - Governance Guide](../GOVERNANCE.md)

### الدعم - Support
- **البريد الإلكتروني - Email:** support@lexbank.com
- **المستودع - Repository:** https://github.com/MOTEB1989/BSM
- **التوثيق الحي - Live Docs:** https://moteb1989.github.io/BSM/

---

## الترخيص - License

MIT License - See [LICENSE](../LICENSE) file for details

---

**آخر تحديث - Last Updated:** 2026-02-20  
**الإصدار - Version:** 2.0.0  
**الحالة - Status:** نشط - Active
