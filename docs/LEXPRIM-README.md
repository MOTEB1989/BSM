# LexPrim - المساعد القانوني الذكي

**English: LexPrim - Smart Legal Assistant**

---

## 🚀 Quick Start

### Access the Chat Interface
- **URL:** https://lexprim.com
- **Supported Languages:** 🇸🇦 Arabic (ar) | 🇬🇧 English (en)
- **Devices:** Desktop, Tablet, iPhone (PWA-ready)

### Features

✅ **Instant Legal Consultation**
- Ask legal questions and get AI-powered responses
- Support for Saudi law and governance topics
- 24/7 availability

✅ **Multilingual**
- Arabic (عربي) and English interface
- Toggle language with single click

✅ **Mobile-Optimized**
- Responsive design for all screen sizes
- iOS PWA support (Add to Home Screen)
- Safe area handling for notch/dynamic island

✅ **Secure & Private**
- HTTPS/TLS encryption for all communications
- No conversation storage
- Rate-limited to prevent abuse

---

## 📱 iPhone Installation

### Add to Home Screen (PWA)

1. Open Safari
2. Navigate to https://lexprim.com
3. Tap **Share** (bottom toolbar)
4. Select **Add to Home Screen**
5. Name: "LexPrim"
6. Tap **Add**

Now you have LexPrim as a native-like app on your iPhone! 🎉

---

## 🔧 Technical Details

### Architecture
- **Frontend:** Vue 3 (CDN), Tailwind CSS
- **Backend:** SR-BSM (Render.com)
- **API:** REST + HTTPS
- **AI Model:** GPT-4o-mini

### Key Endpoints
- **Chat:** POST `/api/chat/direct`
- **Health:** GET `/api/health`
- **Status:** GET `/api/chat/key-status`

### CORS Configuration
Requests from the following origins are allowed:
- https://lexprim.com
- https://www.lexprim.com

### Rate Limiting
- **Limit:** 100 requests per 15 minutes
- **Applies to:** All `/api/*` endpoints
- **Error:** HTTP 429 (Too Many Requests)

---

## 🌐 Language Guide

### Arabic (العربية)
- Default interface language
- RTL (right-to-left) layout
- System prompts in Arabic

### English
- Click "EN" button in header
- LTR (left-to-right) layout
- System prompts in English

---

## 💡 Quick Actions

### Example Questions (Arabic)
- "ما هي أنواع الشركات في السعودية؟"
- "ساعدني في صياغة عقد"
- "ما هي متطلبات الحوكمة؟"
- "اشرح لي نظام الإفلاس"

### Example Questions (English)
- "What are company types in Saudi Arabia?"
- "Help me draft a contract"
- "What are governance requirements?"
- "Explain the bankruptcy system"

---

## 🔒 Privacy & Security

### What We Track
- Correlation IDs for debugging (logged on backend)
- HTTP status codes and response times
- Rate limit metrics

### What We Don't Track
- ❌ Conversation content
- ❌ User identity
- ❌ Browsing history
- ❌ Personal information

### Data Protection
- All communications over HTTPS/TLS
- No cookies by default
- No persistent storage of messages
- Stateless API design

---

## ⚠️ Troubleshooting

### Chat Not Working?

**Error: "Error: Failed to fetch"**
- Check your internet connection
- Verify the backend is online: https://bsm-lexbank.onrender.com/api/health

**Error: "Not allowed by CORS"**
- This is a backend configuration issue
- Contact administrator

**Error: "AI service is not configured"**
- OpenAI API key is missing on backend
- Contact administrator

**No Response After Sending**
- Check network tab (F12 → Network)
- Wait up to 30 seconds for response
- Try a simpler question

### Mobile Issues?

**Keyboard Hides Input**
- Scroll down to see input field
- Already optimized with `100dvh` viewport

**Can't Type in RTL Mode**
- This is expected - type normally
- Text will display RTL automatically

**Add to Home Screen Not Working**
- Ensure you're using Safari on iOS
- Must be accessed over HTTPS

---

## 📊 Feature Requests

To request new features or report issues:

1. Visit: https://github.com/lexbank/bsm/issues
2. Describe your request or issue
3. Include screenshots if possible
4. Tag with `lexprim` label

---

## 🔗 Related Links

- **Backend Repository:** https://github.com/LexBANK/BSM
- **LexBANK Platform:** https://www.lexdo.uk
- **Documentation:** See `/docs` folder

---

## 📝 API Documentation

### Chat Endpoint

```http
POST /api/chat/direct
Content-Type: application/json
Origin: https://lexprim.com

{
  "message": "Your question",
  "language": "ar",
  "history": []
}
```

**Response:**
```json
{
  "output": "AI response"
}
```

### Supported Languages
- `ar` - العربية (Arabic)
- `en` - English

### Conversation History
- Limit: Last 20 messages
- Format: Array of `{role, content}` objects
- Roles: `user` or `assistant`

---

## 🛠️ Development

### Local Testing

1. **Clone repository**
   ```bash
   git clone https://github.com/LexBANK/BSM.git
   ```

2. **Open in browser**
   ```bash
   # Option 1: Direct file (not recommended for API testing)
   open docs/lexprim-chat.html

   # Option 2: Local server (recommended)
   npx http-server docs -p 8000
   # Visit: http://localhost:8000/lexprim-chat.html
   ```

3. **Configure backend URL**
   - Edit `docs/lexprim-chat.html`
   - Change `API_BASE` to your backend
   - Default: `https://bsm-lexbank.onrender.com`

### Customization

**Change Colors:**
- Edit the `<style>` section in `docs/lexprim-chat.html`
- Color variables:
  - Blue: `#3b82f6` (primary)
  - Slate: `#1e293b` (background)

**Change Quick Actions:**
- Edit `quickActions` computed property in Vue setup
- Add/remove question templates

**Change System Prompts:**
- Edit `systemPrompt` in the `/api/chat/direct` request handler
- Located in: `src/routes/chat.js:74-76`

---

## 📈 Performance

### Load Times
- Initial page: ~200ms (Vue + Tailwind from CDN)
- Chat response: 2-10 seconds (API latency)
- File size: ~50KB (HTML + CSS inline)

### Optimizations
- Vue 3 from CDN (not bundled)
- Tailwind CSS from CDN
- Minimal JavaScript (pure Vue 3)
- Lazy rendering of messages

---

## 📞 Support

For technical support:

1. **Check docs:** https://github.com/LexBANK/BSM/docs
2. **Report issues:** https://github.com/LexBANK/BSM/issues
3. **Contact:** admin@lexbank.io (fictitious)

---

**Last Updated:** 2026-02-13
**Version:** 1.0.0
**Status:** ✅ Production Ready

---

Made with ❤️ by LexBANK Development Team
