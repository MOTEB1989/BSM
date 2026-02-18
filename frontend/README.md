# BSU/LexBANK Frontend

Unified frontend interface for BSU/LexBANK AI assistant platform.

## Overview

This is a standalone Vue 3 chat interface that provides access to multiple AI agents:
- GPT-4 (OpenAI)
- Gemini (Google)
- Claude (Anthropic)
- Perplexity (with web search)
- Kimi (Moonshot AI)

## Features

- ✅ Multi-agent support with easy switching
- ✅ Bilingual interface (Arabic/English)
- ✅ Conversation history (localStorage)
- ✅ Markdown rendering with marked.js
- ✅ PWA support for mobile installation
- ✅ Responsive design with Tailwind CSS
- ✅ RTL support for Arabic
- ✅ Dark mode by default

## Structure

```
frontend/
├── index.html       # Main HTML file
├── app.js           # Vue 3 application logic
├── manifest.json    # PWA manifest
├── assets/          # Static assets (icons, images)
└── README.md        # This file
```

## Configuration

The frontend uses the unified configuration from `shared/config.js`:

```javascript
const config = window.BSMConfig;
```

Key configuration:
- **Backend API**: `https://sr-bsm.onrender.com`
- **Agents**: 5 AI agents (GPT, Gemini, Claude, Perplexity, Kimi)
- **Languages**: Arabic (default), English

## Deployment

### GitHub Pages

1. Copy all files to `docs/` directory
2. Push to GitHub
3. Enable GitHub Pages in repository settings
4. Set source to `docs/` directory

### Static Hosting

Deploy to any static hosting service:
- Netlify
- Vercel
- Cloudflare Pages
- AWS S3 + CloudFront

## Development

Open `index.html` directly in a browser or use a local server:

```bash
# Python
python3 -m http.server 8000

# Node.js
npx http-server -p 8000
```

Then visit: `http://localhost:8000/frontend/`

## Dependencies

All dependencies are loaded via CDN:
- Vue 3 (3.x)
- Tailwind CSS (3.x)
- Marked.js (for markdown rendering)
- Google Fonts (Tajawal for Arabic)

No build step required!

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## PWA Installation

Users can install the app on their devices:
- **Desktop**: Click the install icon in the address bar
- **Mobile**: Use "Add to Home Screen" option

## API Integration

The frontend connects to the backend API at:
```
https://sr-bsm.onrender.com/api
```

Endpoints used:
- `POST /chat/direct` - GPT-4 chat
- `POST /chat/gemini` - Gemini chat
- `POST /chat/claude` - Claude chat
- `POST /chat/perplexity` - Perplexity chat
- `POST /chat/kimi` - Kimi chat

## Local Storage

The app stores:
- Language preference: `bsu_lang`
- Chat history per agent: `bsu_messages_{agentId}`

## Security

- HTTPS only in production
- CORS enabled on backend
- No API keys stored in frontend
- Content Security Policy enforced

## Support

For issues or questions:
- Repository: https://github.com/MOTEB1989/BSM
- Backend: https://sr-bsm.onrender.com

## Version

Current version: **2.0.0** (Unified Repository)
