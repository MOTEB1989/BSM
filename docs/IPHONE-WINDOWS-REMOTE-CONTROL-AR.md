# ربط iPhone وCursor (Windows) للتحكم عن بُعد وواجهات الدردشة

هذا الدليل يجهز مشروع BSM بحيث:

- يعمل من **iPhone** عبر واجهات ويب/PWA.
- يتصل من **Cursor على Windows** عبر MCP.
- يوفّر توجيه دردشة متعدد النماذج عبر `banking-hub`.

## 1) إصلاح Git Remote

نفذ الأوامر التالية:

```bash
git remote -v
git status
```

إذا كان الريموت الصحيح هو مستودعك الحالي:

```bash
git remote set-url origin https://github.com/MOTEB1989/BSM.git
```

إذا كنت تريد `BSM-main` فتأكد أولًا أن المستودع موجود ومتاح لك:

```bash
git ls-remote --heads https://github.com/MOTEB1989/BSM-main.git
```

## 2) تشغيل الخادم للاتصال من iPhone

```bash
npm ci
npm run dev
```

بعد التشغيل:

- واجهة الدردشة: `http://<YOUR-IP>:3000/chat`
- واجهة iOS: `http://<YOUR-IP>:3000/ios-app`
- API: `http://<YOUR-IP>:3000/api`

للاستخدام الخارجي (خارج نفس الشبكة)، استخدم نفق آمن مثل Cloudflare Tunnel أو Tailscale Funnel بدل فتح المنافذ مباشرة.

## 3) إعداد MCP لـ Cursor Windows

تمت إضافة ملف:

- `mcp-settings.json`

ويحتوي خادم:

- `bsm-banking-agents` -> `./mcp-servers/banking-hub.js`

كما تمت إضافة نفس الخادم داخل:

- `.github/copilot/mcp.json`

## 4) تشغيل خادم MCP البنكي

```bash
cd mcp-servers
npm install
npm run start:banking
```

الأدوات المتاحة:

- `route_banking_query`
- `check_agent_status`

## 5) إنشاء واجهات ودردشات نماذج الذكاء الاصطناعي

الواجهات الجاهزة في المشروع:

- `/chat` واجهة دردشة رئيسية (AR/EN)
- `/ios-app` واجهة iPhone محسنة
- `frontend/` واجهة ثابتة قابلة للنشر (GitHub Pages)

محادثات النماذج تمر عبر:

- `POST /api/chat/direct`
- ووكلاء النظام عبر `POST /api/control/run`

## 6) ملاحظات أمان سريعة

- لا تحفظ مفاتيح API داخل الواجهة الأمامية.
- فعّل `ADMIN_TOKEN` قوي في الإنتاج.
- أبقِ `SAFE_MODE=false` فقط عند الحاجة للاتصال الخارجي.
- فعّل CORS دومًا على نطاقاتك الفعلية فقط.
