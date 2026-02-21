# دليل إعداد Browser DevTools MCP
# Browser DevTools MCP Setup Guide

## نظرة عامة - Overview

### العربية
يوفر Browser DevTools MCP تكاملاً سلساً بين بيئات التطوير (VS Code/Cursor) وأدوات المطور في المتصفح، مما يتيح:
- أتمتة المتصفح من داخل المحرر
- تصحيح أخطاء التطبيقات مباشرة
- فحص طلبات الشبكة وأدائها
- الوصول إلى وحدة التحكم وعناصر DOM

### English
Browser DevTools MCP provides seamless integration between development environments (VS Code/Cursor) and browser developer tools, enabling:
- Browser automation from within the editor
- Direct application debugging
- Network request and performance inspection
- Console and DOM element access

---

## التثبيت - Installation

### 1. تثبيت الإضافة للمحرر - Install Editor Extension

#### VS Code
```bash
code --install-extension serkan-ozal.browser-devtools-mcp-vscode
```

#### Cursor
```bash
cursor --install-extension serkan-ozal.browser-devtools-mcp-vscode
```

### 2. تثبيت حزمة npm - Install npm Package

تم بالفعل إضافة الحزمة إلى `mcp-servers/package.json`:
The package has already been added to `mcp-servers/package.json`:

```bash
cd mcp-servers
npm install
```

أو تثبيت مباشر:
Or direct installation:

```bash
npm install browser-devtools-mcp
```

---

## التكوين - Configuration

### تكوين تلقائي - Automatic Configuration

تم تكوين Browser DevTools MCP في ملفات MCP التالية:
Browser DevTools MCP is configured in the following MCP files:

1. **GitHub Copilot:** `.github/copilot/mcp.json`
2. **Cursor:** `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "browser-devtools": {
      "command": "npx",
      "args": ["-y", "browser-devtools-mcp"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

### تفعيل الخادم - Activate Server

بعد التثبيت، يمكنك تفعيل الخادم عبر:
After installation, you can activate the server via:

1. **VS Code/Cursor Command Palette:**
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type "MCP: Reload Servers"
   - Select the command

2. **إعادة تشغيل المحرر - Restart Editor:**
   ```bash
   # Close and reopen VS Code/Cursor
   ```

---

## الاستخدام - Usage

### 1. الوصول إلى Browser DevTools

في VS Code/Cursor:
```
1. افتح Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. ابحث عن "Browser DevTools"
3. اختر الأمر المناسب
```

### 2. أتمتة المتصفح - Browser Automation

```javascript
// مثال: التنقل إلى صفحة واختبارها
// Example: Navigate to page and test
await browser.navigate('https://lexprim.com/chat');
await browser.waitForSelector('.chat-container');
const chatVisible = await browser.isVisible('.chat-container');
```

### 3. فحص الشبكة - Network Inspection

```javascript
// مثال: مراقبة طلبات API
// Example: Monitor API requests
const requests = await browser.getNetworkRequests();
const apiCalls = requests.filter(r => r.url.includes('/api/'));
console.log('API Calls:', apiCalls.length);
```

### 4. تصحيح الأخطاء - Debugging

```javascript
// مثال: تنفيذ كود في المتصفح
// Example: Execute code in browser
const result = await browser.evaluate(() => {
  return {
    title: document.title,
    url: window.location.href,
    userAgent: navigator.userAgent
  };
});
```

---

## حالات الاستخدام - Use Cases

### 1. اختبار واجهات المستخدم - UI Testing
```javascript
// اختبار تفاعل المستخدم
await browser.click('.submit-button');
await browser.waitForResponse('/api/submit');
const success = await browser.getText('.success-message');
```

### 2. مراقبة الأداء - Performance Monitoring
```javascript
// قياس أداء التحميل
const metrics = await browser.getPerformanceMetrics();
console.log('Load Time:', metrics.loadTime);
console.log('DOM Ready:', metrics.domContentLoaded);
```

### 3. تصحيح أخطاء API - API Debugging
```javascript
// فحص استجابات API
const apiResponse = await browser.interceptRequest('/api/chat', {
  status: 200,
  body: { message: 'test' }
});
```

### 4. اختبار الاستجابة - Responsive Testing
```javascript
// اختبار على أحجام شاشة مختلفة
await browser.setViewport({ width: 375, height: 667 }); // iPhone
await browser.screenshot('mobile-view.png');

await browser.setViewport({ width: 1920, height: 1080 }); // Desktop
await browser.screenshot('desktop-view.png');
```

---

## التكامل مع BSM - BSM Integration

### 1. اختبار واجهة الدردشة - Chat UI Testing

```javascript
// اختبار واجهة الدردشة العربية/الإنجليزية
await browser.navigate('https://sr-bsm.onrender.com/chat');
await browser.waitForSelector('#messageInput');

// اختبار الرسالة العربية
await browser.type('#messageInput', 'مرحباً، كيف حالك؟');
await browser.click('#sendButton');
await browser.waitForSelector('.message-response');

// التحقق من الاستجابة
const response = await browser.getText('.message-response');
console.log('Response:', response);
```

### 2. اختبار وكلاء الذكاء الاصطناعي - AI Agents Testing

```javascript
// اختبار وكلاء BSU
const agents = ['my-agent', 'legal-agent', 'governance-agent'];

for (const agent of agents) {
  await browser.navigate(`https://sr-bsm.onrender.com/chat?agent=${agent}`);
  await browser.waitForSelector('.agent-indicator');
  
  const agentName = await browser.getText('.agent-indicator');
  console.log(`Testing agent: ${agentName}`);
  
  // اختبار رسالة
  await browser.type('#messageInput', 'test message');
  await browser.click('#sendButton');
  
  // انتظار الاستجابة
  await browser.waitForSelector('.message-response', { timeout: 10000 });
}
```

### 3. مراقبة حالة API - API Status Monitoring

```javascript
// مراقبة حالة مقدمي الخدمة
await browser.navigate('https://sr-bsm.onrender.com/api/status');
const status = await browser.evaluate(() => {
  return JSON.parse(document.body.textContent);
});

console.log('Provider Status:', status.providers);
```

---

## استكشاف الأخطاء - Troubleshooting

### المشكلة 1: الإضافة لا تظهر - Extension Not Showing

**الحل - Solution:**
```bash
# تحقق من التثبيت
code --list-extensions | grep browser-devtools

# أعد التثبيت
code --uninstall-extension serkan-ozal.browser-devtools-mcp-vscode
code --install-extension serkan-ozal.browser-devtools-mcp-vscode

# أعد تشغيل VS Code
```

### المشكلة 2: خادم MCP لا يبدأ - MCP Server Not Starting

**الحل - Solution:**
```bash
# تحقق من تثبيت الحزمة
npm list browser-devtools-mcp

# أعد التثبيت
cd mcp-servers
npm install browser-devtools-mcp

# تحقق من التكوين
cat .cursor/mcp.json | grep browser-devtools
```

### المشكلة 3: خطأ في الاتصال - Connection Error

**الحل - Solution:**
```bash
# تحقق من منافذ الشبكة
netstat -an | grep LISTEN

# أعد تشغيل خوادم MCP
# في VS Code: Command Palette > MCP: Restart Servers
```

---

## الموارد الإضافية - Additional Resources

### الوثائق - Documentation
- [دليل تكامل MCP الشامل](./MCP-INTEGRATION.md)
- [دليل المطور BSM](./DEVELOPER-GUIDE.md)
- [دليل اختبار واجهة الدردشة](../CHAT-TROUBLESHOOTING.md)

### الروابط الخارجية - External Links
- [Browser DevTools MCP على npm](https://www.npmjs.com/package/browser-devtools-mcp)
- [Browser DevTools MCP على VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=serkan-ozal.browser-devtools-mcp-vscode)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)

### الدعم - Support
- **المستودع - Repository:** https://github.com/MOTEB1989/BSM
- **التوثيق الحي - Live Docs:** https://moteb1989.github.io/BSM/
- **المجتمع - Community:** GitHub Discussions

---

## الأمان - Security

### أفضل الممارسات - Best Practices

1. **استخدام في بيئة التطوير فقط**
   - لا تفعّل في الإنتاج
   - `NODE_ENV=development` فقط

2. **تقييد الوصول**
   - استخدم في الشبكة المحلية فقط
   - فعّل `LAN_ONLY=true` عند الاختبار

3. **مراجعة الأكواد المُنفذة**
   - راجع جميع أكواد الأتمتة
   - تجنب تنفيذ أكواد غير موثوقة

4. **حماية البيانات الحساسة**
   - لا تُسجل بيانات المستخدمين
   - أخفِ المفاتيح والرموز السرية

---

## الخلاصة - Summary

✅ **تم التثبيت - Installed:**
- ✅ VS Code Extension: `serkan-ozal.browser-devtools-mcp-vscode`
- ✅ npm Package: `browser-devtools-mcp`

✅ **تم التكوين - Configured:**
- ✅ `.github/copilot/mcp.json`
- ✅ `.cursor/mcp.json`
- ✅ `mcp-servers/package.json`

✅ **جاهز للاستخدام - Ready to Use:**
- ✅ أتمتة المتصفح - Browser automation
- ✅ تصحيح الأخطاء - Debugging
- ✅ فحص الشبكة - Network inspection
- ✅ اختبار واجهة المستخدم - UI testing

---

**آخر تحديث - Last Updated:** 2026-02-21  
**الإصدار - Version:** 1.0.0  
**الحالة - Status:** نشط - Active
