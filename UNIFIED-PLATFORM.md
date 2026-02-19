# 🎨 BSM Unified Platform

## نظرة عامة (Overview)

المنصة الموحدة لـ BSM/LexBANK تجمع كل الواجهات والوكلاء في تجربة مستخدم سلسة واحترافية.

The BSM/LexBANK Unified Platform combines all interfaces and agents into a seamless, professional user experience.

---

## 🌟 الميزات (Features)

### 1. الواجهة الموحدة (Unified Interface)
- ✅ تصميم حديث (Glass Morphism + Dark Mode)
- ✅ دعم كامل RTL/LTR (عربي/إنجليزي)
- ✅ Responsive (موبايل + ديسكتوب)
- ✅ PWA (قابل للتثبيت)

### 2. اختيار ذكي (Smart Selection)
- ✅ 13 وكلاً متخصصاً (13 Specialized Agents)
- ✅ 9 نماذج AI مختلفة (9 Different AI Models)
- ✅ تصنيف حسب الفئة (Category-based organization)
- ✅ توصيات تلقائية (Automatic recommendations)

### 3. نماذج الذكاء الاصطناعي (AI Models)
| Model | Provider | Icon | Status | Capabilities |
|-------|----------|------|--------|--------------|
| **OpenAI GPT-4** | OpenAI | 🤖 | ✅ Active | Chat, Code, Analysis |
| **Google Gemini** | Google | 🧠 | ✅ Active | Chat, Creative, Arabic |
| **Claude AI** | Anthropic | 🎓 | ✅ Active | Legal, Code Review, Security |
| **Perplexity** | Perplexity AI | 🔍 | ✅ Active | Search, News, Facts |
| **Groq LPU** | Groq | ⚡ | ✅ Active | Speed, Realtime, Translation |
| **KIMI AI** | Moonshot | 🌙 | ✅ Active | Chinese, Multilingual |
| **Cohere** | Cohere | 🔮 | ⏳ Optional | Chat, Embeddings |
| **Mistral AI** | Mistral | 🌪️ | ⏳ Optional | Chat, Reasoning |
| **Azure OpenAI** | Microsoft | ☁️ | ⏳ Optional | Enterprise, Chat |

### 4. الوكلاء المتخصصون (Specialized Agents)

#### 🔄 الموجّهات (Routers)
- **agent-auto** - التوجيه التلقائي الذكي / Smart Auto Router
  - يختار أفضل وكيل تلقائياً بناءً على سؤالك
  - Automatically selects the best agent for your query

#### ⚖️ الخبراء (Experts)
- **legal-agent** - الخبير القانوني / Legal Expert
  - متخصص في الأنظمة والقوانين السعودية
  - Saudi legal systems specialist

- **governance-agent** - خبير الحوكمة / Governance Expert
  - حوكمة الشركات والمتطلبات التنظيمية
  - Corporate governance and compliance

#### 🛠️ الأدوات (Tools)
- **security-agent** - مدقق الأمان / Security Scanner
  - فحص الأمان واكتشاف الثغرات
  - Security audits and vulnerability detection

- **code-review-agent** - مراجع الكود / Code Reviewer
  - مراجعة الأكواد وتحسين الجودة
  - Code quality and best practices

- **integrity-agent** - حارس السلامة / Integrity Guardian
  - مراقبة صحة المستودع
  - Repository health monitoring

- **pr-merge-agent** - مدير الدمج / Merge Manager
  - دمج طلبات السحب تلقائياً
  - Automated PR merging

#### 🧠 نماذج AI (AI Models)
- **gemini-agent** - Google Gemini
  - محادثة عربية إبداعية / Creative Arabic conversation

- **claude-agent** - Claude AI
  - تحليل قانوني متقدم / Advanced legal analysis

- **perplexity-agent** - Perplexity
  - بحث مباشر مع مصادر / Real-time search with sources

- **groq-agent** - Groq السريع / Groq Fast
  - استجابة فورية فائقة السرعة / Ultra-fast instant response

- **kimi-agent** - KIMI AI
  - متخصص صيني وعربي / Chinese and Arabic specialist

#### 💬 الأساسيات (Basic)
- **direct** - دردشة مباشرة / Direct Chat
  - محادثة مباشرة بدون وكيل
  - Direct conversation without agent

---

## 🚀 الاستخدام (Usage)

### الوصول السريع (Quick Access)

```
Production:   https://moteb1989.github.io/BSM/
Development:  http://localhost:3000/
Backend:      https://sr-bsm.onrender.com
```

### اختيار الوكيل (Selecting an Agent)

**للمستخدم العادي (For Regular Users):**
- استخدم "التوجيه التلقائي" - يختار أفضل وكيل تلقائياً
- Use "Smart Auto Router" - automatically selects the best agent

**للمستخدم المتقدم (For Advanced Users):**
- اختر وكيل محدد حسب الحاجة:
  - ⚖️ الخبير القانوني - للأسئلة القانونية / Legal questions
  - 🏛️ خبير الحوكمة - لأسئلة الحوكمة / Governance questions
  - 🔒 مدقق الأمان - لفحص الأمان / Security scanning
  - 💻 مراجع الكود - لمراجعة الأكواد / Code review

**للتجربة (For Experimentation):**
- اختر نموذج AI مباشر:
  - 🧠 Gemini - للمحتوى العربي الإبداعي / Creative Arabic content
  - 🎓 Claude - للتحليل القانوني المتقدم / Advanced legal analysis
  - 🔍 Perplexity - للبحث المباشر / Real-time search
  - ⚡ Groq - للاستجابة الفورية / Instant response

---

## 🔧 التكامل (Integration)

### Frontend ➜ Backend

```javascript
// الواجهة تتصل تلقائياً بـ Backend
// Frontend automatically connects to Backend
const API_BASE = window.API_BASE; // Auto-detected

// إرسال رسالة / Send message
const response = await fetch(`${API_BASE}/api/control/run`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: 'gemini-agent',
    input: 'مرحباً',
    context: { mobile: false, language: 'ar' }
  })
});
```

### Backend ➜ AI Models

```javascript
// Backend يختار النموذج تلقائياً
// Backend automatically selects the model
import { models, isModelAvailable } from './config/models.js';

if (isModelAvailable('google')) {
  // Use Gemini
} else if (isModelAvailable('openai')) {
  // Fallback to OpenAI
}
```

---

## 📊 الإحصائيات (Statistics)

| المكون (Component) | العدد (Count) | الحالة (Status) |
|-------------------|--------------|----------------|
| الوكلاء المتخصصين (Specialized Agents) | 13 | ✅ Active |
| نماذج AI (AI Models) | 9 | ✅ 6 Active + 3 Optional |
| الواجهات (Interfaces) | 1 (Unified) | ✅ Active |
| اللغات المدعومة (Supported Languages) | 2 (AR/EN) | ✅ Active |
| API Endpoints | 15+ | ✅ Active |

---

## 🔐 الأمان (Security)

- ✅ HTTPS فقط في Production (HTTPS only in Production)
- ✅ CORS محدد (Restricted CORS)
- ✅ Rate limiting
- ✅ Input validation
- ✅ API keys مخفية (Hidden API keys)
- ✅ Helmet security headers
- ✅ No secrets in code

---

## 🧪 الاختبار (Testing)

### Manual Testing

```bash
# 1. Test connection
curl https://sr-bsm.onrender.com/health

# 2. Test chat endpoint
curl -X POST https://sr-bsm.onrender.com/api/chat/direct \
  -H "Content-Type: application/json" \
  -d '{"message":"مرحباً","language":"ar"}'

# 3. Test agent
curl -X POST https://sr-bsm.onrender.com/api/control/run \
  -H "Content-Type: application/json" \
  -d '{"agentId":"gemini-agent","input":"Hello"}'
```

### Validation

```bash
# Run all validation tests
npm test

# Output:
✅ Registry validated: 16 agents with governance fields
✅ Orchestrator config validated: 3 agents configured
OK: validation passed
```

---

## 🐛 استكشاف الأخطاء (Troubleshooting)

### Problem: "غير متصل" (Disconnected)

**الحل (Solution):**
1. تحقق من Backend على Render (Check Backend on Render)
2. افتح Console (F12) وانظر للأخطاء (Check Console for errors)
3. جرب refresh (Ctrl+Shift+R)

### Problem: "لا توجد نماذج متاحة" (No models available)

**الحل (Solution):**
1. تأكد من API Keys في Render (Check API Keys in Render)
2. تحقق من `.env` يحتوي على المفاتيح (Verify .env has keys)
3. أعد deploy Backend (Redeploy Backend)

### Problem: "الواجهة بطيئة" (Interface is slow)

**الحل (Solution):**
- استخدم Groq للسرعة الفائقة (Use Groq for ultra-fast speed)
- قلل history المرسل للـ API (Reduce history sent to API)
- فعّل caching في Backend (Enable caching in Backend)

---

## 📞 الدعم (Support)

- **GitHub Issues:** https://github.com/MOTEB1989/BSM/issues
- **Documentation:** https://moteb1989.github.io/BSM/docs/
- **Email:** support@bsm.sa (if applicable)

---

## 📚 المراجع (References)

### Related Documentation
- [CLAUDE.md](../CLAUDE.md) - Full system documentation
- [README.md](../README.md) - Project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [SECURITY.md](SECURITY.md) - Security guidelines

### Configuration Files
- [shared/config.js](../shared/config.js) - Unified configuration
- [src/config/models.js](../src/config/models.js) - Model providers
- [agents/registry.yaml](../agents/registry.yaml) - Agent registry
- [.env.example](../.env.example) - Environment variables

---

## 🎯 ملاحظات التنفيذ (Implementation Notes)

### Design Decisions
1. **Glass Morphism Design**: Modern, professional look with frosted glass effect
2. **Category-based Organization**: Agents organized by function (routers, experts, tools, AI models)
3. **Real-time Status**: Live connection indicator for backend health
4. **Bilingual Support**: Full Arabic/English with RTL/LTR direction switching
5. **Markdown Rendering**: Rich formatting for agent responses
6. **LocalStorage Persistence**: Chat history saved locally

### Performance Optimizations
- Minified JavaScript for faster load
- CSS animations for smooth UX
- Lazy loading for agent selection
- Auto-scroll optimization
- Connection pooling for API calls

### Future Enhancements
- [ ] Voice input support
- [ ] Export chat history
- [ ] Agent performance metrics
- [ ] Multi-agent conversations
- [ ] Code syntax highlighting
- [ ] File upload support
- [ ] Image generation integration

---

**Version:** 2.0.0  
**Last Updated:** 2026-02-19  
**Status:** ✅ Production Ready
