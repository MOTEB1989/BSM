# LexPrim Chat Integration Guide

## Overview

This document describes the integration of the LexPrim chat interface with the SR-BSM backend (LexBANK). The chat interface is hosted on GitHub Pages and communicates with the Render-hosted backend via HTTPS.

## Architecture

```
┌─────────────────────┐
│   LexPrim.com       │
│  (GitHub Pages)     │
│  - index.html       │
│  - styles.css       │
│  - app.js (Vue 3)   │
└──────────┬──────────┘
           │ HTTPS
           │ CORS-enabled
           ▼
┌─────────────────────────────────┐
│  SR-BSM Backend (Render.com)    │
│  - /api/chat/direct             │
│  - GPT-4o-mini processing       │
│  - Multilingual support (AR/EN) │
└─────────────────────────────────┘
```

## File Structure

```
docs/
├── lexprim-chat.html        # Main chat interface (Vue 3)
├── LEXPRIM-INTEGRATION.md   # This file
└── CNAME                    # DNS configuration (lexprim.com)
```

## Deployment Steps

### Phase 1: DNS Configuration

1. **Add CNAME Record** (Already configured in `docs/CNAME`)
   ```
   CNAME: lexprim.com → lexbank.github.io
   ```

2. **GitHub Pages Settings**
   - Go to LexBANK/BSM repository
   - Settings → Pages
   - Set source to: `Deploy from a branch`
   - Set branch to: `main` with `/docs` folder
   - Enable custom domain: `lexprim.com`
   - Enable HTTPS: Yes (automatic with Let's Encrypt)

### Phase 2: Backend Configuration (Render)

1. **Update CORS Origins** in environment variables:
   ```
   CORS_ORIGINS=https://www.lexdo.uk,https://lexprim.com,https://www.lexprim.com
   ```

2. **Redeploy Service**
   - Go to Render Dashboard
   - Navigate to your BSM service
   - Manual Deploy → Deploy latest commit

### Phase 3: Configuration

1. **Update API Base URL** in chat interface:
   - File: `docs/lexprim-chat.html`
   - Find: `const API_BASE = 'https://bsm-lexbank.onrender.com'`
   - Update to your actual Render backend URL

2. **Optional: Custom Styling**
   - Update colors in the `<style>` section
   - Customize quick action prompts in the Vue setup

### Phase 4: Testing

1. **Desktop Testing**
   - Navigate to https://lexprim.com
   - Test chat functionality
   - Check browser console for errors (F12 → Console)

2. **Mobile Testing (iPhone)**
   - Open https://lexprim.com on Safari
   - Test on home screen (Add to Home Screen)
   - Verify safe area handling and keyboard behavior

3. **Network Testing**
   - Open DevTools (F12)
   - Go to Network tab
   - Send a test message
   - Verify:
     - POST request to `/api/chat/direct`
     - Status 200
     - Response contains `output` field

### Phase 5: Verification

Check these endpoints:

```bash
# Backend health check
curl https://bsm-lexbank.onrender.com/api/health

# CORS preflight
curl -X OPTIONS https://bsm-lexbank.onrender.com/api/chat/direct \
  -H "Origin: https://lexprim.com" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Test chat endpoint
curl -X POST https://bsm-lexbank.onrender.com/api/chat/direct \
  -H "Content-Type: application/json" \
  -d '{
    "message": "ما هي عاصمة السعودية؟",
    "language": "ar",
    "history": []
  }'
```

## API Endpoint Details

### POST /api/chat/direct

**Request:**
```json
{
  "message": "Your question here",
  "language": "ar|en",
  "history": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ]
}
```

**Response:**
```json
{
  "output": "AI response text"
}
```

**Error Responses:**
- `400`: Invalid input (missing message, invalid language)
- `503`: AI service not configured (missing API key)
- `429`: Rate limit exceeded
- `500`: Server error

## Security Considerations

### CORS Policy
- Only requests from whitelisted origins are accepted
- Preflight requests are automatically handled
- Credentials not required (requests are public)

### Rate Limiting
- Default: 100 requests per 15 minutes per IP
- Configurable via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS`

### Input Validation
- Messages limited to 4000 characters (configurable)
- Language must be "ar" or "en"
- History validated as array of messages

### Data Privacy
- Conversations not stored (stateless)
- All requests use HTTPS/TLS encryption
- Backend logs correlation IDs for troubleshooting

## Environment Variables Reference

Key variables for LexPrim integration:

```bash
# Render Backend
PORT=3000
NODE_ENV=production

# OpenAI Configuration
OPENAI_BSM_KEY=sk-proj-...          # Primary key
OPENAI_API_KEY=sk-proj-...          # Fallback key

# CORS & Network Security
CORS_ORIGINS=https://lexprim.com,https://www.lexprim.com,...
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000         # 15 minutes

# Admin Access
ADMIN_TOKEN=<secure-token-16-chars+>

# Security
EGRESS_POLICY=deny_by_default
EGRESS_ALLOWED_HOSTS=api.openai.com,github.com
```

## Troubleshooting

### Chat not working on LexPrim.com

**Check 1: CORS Error**
- Browser console shows: "Not allowed by CORS"
- **Solution:** Verify `CORS_ORIGINS` includes the lexprim.com domain
- **Action:** Update env variables and redeploy Render service

**Check 2: API URL Incorrect**
- Browser console shows: Network error / 404
- **Solution:** Verify `API_BASE` in `docs/lexprim-chat.html`
- **Action:** Update to correct Render backend URL

**Check 3: Missing API Key**
- Response shows: "AI service is not configured"
- **Solution:** Ensure `OPENAI_BSM_KEY` or `OPENAI_API_KEY` is set
- **Action:** Add key to Render environment and redeploy

**Check 4: Rate Limited**
- Response shows: "Too many requests"
- **Solution:** Wait 15 minutes or increase `RATE_LIMIT_MAX`

### Mobile Issues

**Keyboard Hidden Behind Input**
- **Solution:** Already handled by CSS (`100dvh` and safe-area-inset)

**Pull-to-Refresh Interfering**
- **Solution:** Disabled via `overscroll-behavior: none`

**iPhone Notch/Dynamic Island**
- **Solution:** Safe area insets applied automatically

## Performance Optimization

### Lazy Loading
- Vue 3 is loaded from CDN (240KB gzipped)
- Marked.js for markdown rendering (30KB)
- Tailwind CSS from CDN

### Caching
- Service Worker registration available (optional)
- Browser cache for static assets
- No server-side caching for chat responses

### Message Optimization
- Textarea auto-grows for better UX
- Scroll smooth for message display
- Typing indicator for feedback

## Future Enhancements

1. **Session Persistence**
   - Store chat history in browser localStorage
   - Optional: Backend database for authenticated users

2. **Advanced Features**
   - File upload support
   - Agent selection interface
   - Knowledge base search
   - Analytics and metrics

3. **Multi-Language Support**
   - Currently: Arabic (ar) and English (en)
   - Extensible to: French, Spanish, etc.

4. **Authentication**
   - Optional: Admin-only access
   - Optional: User accounts and history

## Support & Maintenance

For issues or updates:
1. Check the troubleshooting section above
2. Review backend logs on Render Dashboard
3. Verify GitHub Pages deployment: `lexprim.com`
4. Test CORS configuration with curl commands
5. Contact backend administrators for API key issues

## Related Documentation

- **Backend Setup:** See `CLAUDE.md` in repository root
- **Render Deployment:** See `RENDER-DEPLOYMENT-AR.md`
- **Security:** See `SECURITY.md`
- **CORS Details:** See `src/config/env.js` and `src/app.js`

---

**Last Updated:** 2026-02-13
**Integration Branch:** `claude/integrate-chat-interface-PHUfu`
**Status:** ✅ Ready for Deployment
