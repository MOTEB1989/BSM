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

في المشروع يوجد ملفان إعداد لـ MCP، لكل عميل (Client) ملفه الخاص:

1. **Cursor (Windows)**  
   - ملف الإعداد: `mcp-settings.json`  
   - هذا الملف يُستخدم من تطبيق Cursor فقط.  
   - يعتمد حقل `servers` ويحتوي مرجع `$schema` لتعريف بنية الملف.  
   - مضاف فيه الخادم:  
     - `bsm-banking-agents` -> `./mcp-servers/banking-hub.js`

2. **GitHub Copilot (GitHub / Copilot Chat)**  
   - ملف الإعداد: `.github/copilot/mcp.json`  
   - هذا الملف يُستخدم من GitHub Copilot فقط (ولا يقرأه Cursor).  
   - يعتمد حقل `mcpServers`، وقد لا يحتوي على حقل `$schema` لأن صيغة Copilot مختلفة.  
   - مضاف فيه نفس الخادم المنطقي `bsm-banking-agents` ولكن بصيغة الإعداد الخاصة بـ Copilot.

> ملاحظة:  
> - يجب أن يعرّف كلا الملفين **نفس خوادم MCP المنطقية** (مثل `bsm-banking-agents`) حتى تحصل على نفس السلوك في Cursor وGitHub Copilot.  
> - الاختلاف في أسماء الحقول (`servers` مقابل `mcpServers`) ووجود `$schema` هو اختلاف مقصود لأن كل عميل يتوقع تنسيقًا مختلفًا، وليس خطأ في الإعداد.
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
- `/ios-app` واجهة iPhone محسنة + تبويب تحكم عن بُعد (Remote)
- `frontend/` واجهة ثابتة قابلة للنشر (GitHub Pages)

محادثات النماذج تمر عبر:

- `POST /api/chat/direct`
- ووكلاء النظام عبر `POST /api/control/run`

تمت إضافة مسار MCP HTTP للواجهة:

- `GET /api/mcp/tools`
- `GET /api/mcp/connection-status` (فحص جاهزية Cursor Windows)
- `POST /api/mcp/tools/call`

## 6) ملاحظات أمان سريعة

- لا تحفظ مفاتيح API داخل الواجهة الأمامية.
- فعّل `ADMIN_TOKEN` قوي في الإنتاج.
- اجعل `SAFE_MODE=true` كإعداد افتراضي آمن، ولا تغيّره إلى `false` إلا عند حاجة موثقة لاتصال خارجي.
- ابدأ بإيقاف CORS أو تقييده لأصول محددة فقط، ثم استخدم متغير البيئة `CORS_ORIGINS` (كما هو موثّق في `.env.example` و`src/config/env.js`) لحصر النطاقات المسموح بها، وراجع ملف `SECURITY.md` لتفاصيل إعداد CORS الآمن.
