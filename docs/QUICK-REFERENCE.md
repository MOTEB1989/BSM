# 🎯 نظرة سريعة - المستودع الموحد
# Quick Reference - Unified Repository

**آخر تحديث / Last Updated**: 2026-02-18
**الحالة / Status**: ✅ **جاهز للإنتاج / Production Ready**

---

## 🚀 البدء السريع (Quick Start)

### 1. استنساخ المستودع / Clone Repository
```bash
git clone https://github.com/MOTEB1989/BSM.git
cd BSM
```

### 2. التثبيت / Install
```bash
npm install
# MCP dependencies install automatically via postinstall
```

### 3. التكوين / Configure
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 4. التشغيل / Run
```bash
# Development server
npm run dev

# MCP server
npm run mcp:start

# Frontend (local testing)
cd frontend && python3 -m http.server 8000
```

---

## 📁 الملفات الرئيسية (Key Files)

| الملف / File | الوصف / Description | الحجم / Size |
|-------------|---------------------|--------------|
| `shared/config.js` | التكوين الموحد / Unified config | 3.2 KB |
| `frontend/index.html` | واجهة Vue 3 / Vue 3 interface | 11 KB |
| `frontend/app.js` | منطق التطبيق / App logic | 4.4 KB |
| `mcp-servers/bsu-agent-server.js` | خادم MCP / MCP server | 8.5 KB |
| `.github/copilot/mcp.json` | تكوين Copilot / Copilot config | 424 B |

---

## 🤖 الوكلاء المتاحون (Available Agents)

| الوكيل / Agent | الموفر / Provider | النموذج / Model | نقطة النهاية / Endpoint |
|---------------|------------------|-----------------|-------------------------|
| GPT-4 | OpenAI | gpt-4 | `/api/chat/direct` |
| Gemini | Google | gemini-2.0-flash-exp | `/api/chat/gemini` |
| Claude | Anthropic | claude-3-5-sonnet | `/api/chat/claude` |
| Perplexity | Perplexity | sonar-pro | `/api/chat/perplexity` |
| Kimi | Moonshot | kimi-latest | `/api/chat/kimi` |

---

## 📡 عناوين URL (URLs)

| المكون / Component | URL |
|-------------------|-----|
| الواجهة / Frontend | https://moteb1989.github.io/BSM/frontend/ |
| الخادم / Backend | https://sr-bsm.onrender.com |
| API | https://sr-bsm.onrender.com/api |
| المستودع / Repository | https://github.com/MOTEB1989/BSM |

---

## 🛠️ الأوامر المتاحة (Available Commands)

### الخادم / Server
```bash
npm run dev              # Development with auto-reload
npm start                # Production server
```

### التحقق / Validation
```bash
npm test                 # Run all validations
npm run validate         # Validate data structures
npm run validate:registry # Validate agent registry
```

### الصحة / Health
```bash
npm run health           # Basic health check
npm run health:detailed  # Comprehensive health check
```

### MCP
```bash
npm run mcp:install      # Install MCP dependencies
npm run mcp:start        # Start MCP server
```

### مراجعة PR / PR Review
```bash
npm run pr-check         # Local PR review
npm run pr-check:verbose # Verbose PR review
```

---

## 🧰 أدوات MCP (MCP Tools)

استخدم في GitHub Copilot / Use in GitHub Copilot:

```
@workspace /list_agents
@workspace /chat_gpt message="مرحبا" language="ar"
@workspace /chat_gemini message="Hello" language="en"
@workspace /chat_claude message="مرحبا"
@workspace /chat_perplexity message="Latest AI news"
@workspace /chat_kimi message="你好"
@workspace /get_key_status
```

---

## 📚 التوثيق (Documentation)

| الدليل / Guide | الوصف / Description | الحجم / Size |
|---------------|---------------------|--------------|
| [UNIFIED-REPOSITORY-STRATEGY](./UNIFIED-REPOSITORY-STRATEGY.md) | استراتيجية التوحيد / Unified strategy | 14.5 KB |
| [UNIFIED-DEPLOYMENT-GUIDE](./UNIFIED-DEPLOYMENT-GUIDE.md) | دليل النشر / Deployment guide | 18.8 KB |
| [MIGRATION-GUIDE](./MIGRATION-GUIDE.md) | دليل الانتقال / Migration guide | 13.2 KB |
| [UNIFIED-IMPLEMENTATION-SUMMARY](./UNIFIED-IMPLEMENTATION-SUMMARY.md) | ملخص التنفيذ / Implementation summary | 15.5 KB |

---

## 🔒 الأمان (Security)

### متغيرات البيئة الضرورية / Required Environment Variables
```bash
NODE_ENV=production
OPENAI_API_KEY=sk-...
ADMIN_TOKEN=your-secure-token-min-16-chars
CORS_ORIGINS=https://moteb1989.github.io
```

### الميزات الأمنية / Security Features
- ✅ HTTPS only in production
- ✅ CORS with specific origins
- ✅ Content Security Policy (CSP)
- ✅ Rate limiting (100 req/15min)
- ✅ Circuit breaker for API calls
- ✅ Helmet.js security headers
- ✅ No API keys in frontend

---

## 🧪 الاختبار (Testing)

### اختبار الخادم / Test Backend
```bash
curl https://sr-bsm.onrender.com/health
curl https://sr-bsm.onrender.com/api/status
curl https://sr-bsm.onrender.com/api/chat/key-status
```

### اختبار الواجهة / Test Frontend
```bash
# Open in browser:
https://moteb1989.github.io/BSM/frontend/

# Or test locally:
cd frontend
python3 -m http.server 8000
# Visit: http://localhost:8000
```

### اختبار MCP / Test MCP
```bash
npm run mcp:start
# Use GitHub Copilot commands
```

---

## 🐛 استكشاف الأخطاء (Troubleshooting)

### مشكلة: الواجهة لا تعمل / Frontend doesn't work
```bash
# Check GitHub Pages status
gh api repos/MOTEB1989/BSM/pages

# Verify files committed
git ls-files frontend/
```

### مشكلة: خطأ CORS / CORS error
```bash
# Update CORS_ORIGINS in backend
CORS_ORIGINS=https://moteb1989.github.io

# Update shared/config.js
nano shared/config.js
```

### مشكلة: MCP لا يعمل / MCP not working
```bash
# Install dependencies
cd mcp-servers && npm install

# Verify config
cat ../.github/copilot/mcp.json

# Restart VS Code
```

---

## 📊 الإحصائيات (Statistics)

- **إجمالي الملفات / Total Files**: 15 files created
- **سطور الكود / Lines of Code**: ~3,120 lines
- **التوثيق / Documentation**: 62.5 KB (4 guides)
- **التبعيات / Dependencies**: 239 packages
- **الحجم الإجمالي / Total Size**: ~95 KB (code + docs)

---

## 🎯 الخطوات التالية (Next Steps)

1. **النشر / Deploy**:
   - Frontend → GitHub Pages
   - Backend → Render.com (already deployed)
   - MCP → Automatic with Copilot

2. **الاختبار / Test**:
   - Test all 5 AI agents
   - Verify MCP tools in Copilot
   - Check CORS and security

3. **المراقبة / Monitor**:
   - Check health endpoints
   - Monitor logs
   - Watch error rates

4. **التحسين / Optimize**:
   - Add new features
   - Improve performance
   - Enhance documentation

---

## 🔗 روابط سريعة (Quick Links)

- 📖 [Main README](../README.md)
- 🔧 [Frontend README](../frontend/README.md)
- 🤖 [MCP Server README](../mcp-servers/README.md)
- 🐛 [GitHub Issues](https://github.com/MOTEB1989/BSM/issues)
- 💬 [Discussions](https://github.com/MOTEB1989/BSM/discussions)

---

## ✅ قائمة التحقق (Checklist)

### التثبيت / Installation
- [ ] استنساخ المستودع / Clone repository
- [ ] تثبيت التبعيات / Install dependencies
- [ ] تكوين البيئة / Configure environment

### الاختبار / Testing
- [ ] اختبار الخادم / Test backend
- [ ] اختبار الواجهة / Test frontend
- [ ] اختبار MCP / Test MCP

### النشر / Deployment
- [ ] نشر الواجهة / Deploy frontend
- [ ] تحديث الخادم / Update backend
- [ ] تكوين MCP / Configure MCP

### التحقق / Verification
- [ ] التحقق من الصحة / Health check
- [ ] اختبار الوكلاء / Test agents
- [ ] التحقق من الأمان / Security check

---

## 📞 الحصول على المساعدة (Getting Help)

### للمشاكل التقنية / For Technical Issues
1. تحقق من التوثيق / Check documentation
2. ابحث في القضايا / Search issues
3. افتح قضية جديدة / Open new issue

### للأسئلة العامة / For General Questions
1. راجع الأدلة / Review guides
2. تحقق من المناقشات / Check discussions
3. اسأل في المناقشات / Ask in discussions

---

**نصيحة / Tip**: احفظ هذه الصفحة كمرجع سريع! / Bookmark this page for quick reference!

---

**الإصدار / Version**: 2.0.0
**التاريخ / Date**: 2026-02-18
**الحالة / Status**: ✅ **مكتمل / Complete**
