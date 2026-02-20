# نظام الإشعارات والتنسيق بين الوكلاء
## Agent Team Notification & Coordination System

### نظرة عامة

نظام شامل للإشعارات والتنسيق بين جميع وكلاء BSM، يتيح:
- إخطار جميع الوكلاء بأي تحديث أو تغيير في المستودع
- تفعيل "الدرع الأمني الشامل" عند اكتشاف تهديدات
- التنسيق التلقائي بين الوكلاء لحل المشاكل
- طلب الموافقة قبل تنفيذ الإجراءات الحرجة

---

## المكونات الأساسية

### 1. خدمة الإشعارات (Notification Service)
**المسار**: `src/services/notificationService.js`

خدمة مركزية لبث الإشعارات إلى جميع الوكلاء المشتركين.

#### الميزات:
- الاشتراك وإلغاء الاشتراك للوكلاء
- بث الإشعارات حسب الأولوية (critical, high, normal, low)
- تصفية الإشعارات حسب النوع
- تخزين آخر 1000 إشعار
- دعم القنوات المتعددة (internal, audit, telegram)

#### أنواع الإشعارات:
- `urgent` - إشعارات عاجلة
- `security` - تنبيهات أمنية
- `repository_change` - تغييرات في المستودع
- `integration_issue` - مشاكل في التكامل
- `approval_request` - طلبات موافقة
- `collaboration_request` - طلبات تعاون

### 2. خدمة تنسيق الوكلاء (Agent Coordination Service)
**المسار**: `src/services/agentCoordinationService.js`

تدير التعاون بين الوكلاء للمهام المعقدة.

#### الميزات:
- بدء جلسات تعاون بين الوكلاء
- إرسال الرسائل بين المشاركين
- تتبع حالة الجلسات
- الموافقة على الجلسات قبل التنفيذ
- سجل كامل للتعاون

#### حالات الجلسة:
- `pending_approval` - بانتظار الموافقة
- `active` - نشطة
- `completed` - مكتملة
- `cancelled` - ملغاة

### 3. خدمة الدرع الأمني (Security Shield Service)
**المسار**: `src/services/securityShieldService.js`

نظام حماية شامل يُفعّل عند اكتشاف تهديدات أمنية.

#### الميزات:
- تفعيل الدرع الأمني تلقائياً عند التهديدات
- تصنيف مستوى التهديد (normal, elevated, high, critical)
- تسجيل جميع الثغرات والتهديدات
- التنسيق التلقائي مع وكلاء الأمان
- إجراءات فورية حسب مستوى التهديد

#### مستويات التهديد:
- `normal` - عادي
- `elevated` - مرتفع
- `high` - عالي
- `critical` - حرج

---

## واجهات API

### الإشعارات (Notifications)

#### الحصول على الإشعارات
```http
GET /api/notifications?limit=50&type=security&priority=high
```

**المعاملات**:
- `limit` (اختياري): عدد الإشعارات (افتراضي: 50)
- `type` (اختياري): نوع الإشعار
- `priority` (اختياري): الأولوية
- `since` (اختياري): تاريخ ISO 8601

**الرد**:
```json
{
  "success": true,
  "count": 10,
  "notifications": [
    {
      "id": "notif_1234567890_abc123",
      "timestamp": "2026-02-20T14:00:00.000Z",
      "type": "security",
      "priority": "critical",
      "message": "🛡️ SECURITY ALERT: Vulnerability detected",
      "details": {},
      "broadcasted": true
    }
  ]
}
```

#### الاشتراك في الإشعارات
```http
POST /api/notifications/subscribe
Content-Type: application/json

{
  "agentId": "governance-agent",
  "filters": ["security", "urgent"],
  "priority": "high",
  "channels": ["internal", "telegram"]
}
```

**الرد**:
```json
{
  "success": true,
  "subscription": {
    "agentId": "governance-agent",
    "subscribedAt": "2026-02-20T14:00:00.000Z",
    "filters": ["security", "urgent"],
    "priority": "high",
    "channels": ["internal", "telegram"]
  }
}
```

#### بث إشعار (مسؤول فقط)
```http
POST /api/notifications/broadcast
X-Admin-Token: your-admin-token
Content-Type: application/json

{
  "type": "urgent",
  "priority": "critical",
  "message": "إشعار عاجل لجميع الوكلاء",
  "details": {
    "reason": "اختبار النظام"
  }
}
```

#### إحصائيات الإشعارات
```http
GET /api/notifications/stats
```

**الرد**:
```json
{
  "success": true,
  "stats": {
    "totalNotifications": 245,
    "totalSubscribers": 8,
    "byType": {
      "security": 45,
      "repository_change": 120,
      "urgent": 10
    },
    "byPriority": {
      "critical": 15,
      "high": 50,
      "normal": 180
    }
  }
}
```

### التنسيق بين الوكلاء (Coordination)

#### بدء جلسة تعاون
```http
POST /api/notifications/coordination/start
Content-Type: application/json

{
  "initiator": "security-agent",
  "task": "Fix security vulnerability in authentication",
  "requiredAgents": ["integrity-agent", "governance-agent"],
  "priority": "high",
  "approvalRequired": true,
  "userContext": {
    "vulnerabilityId": "CVE-2026-1234"
  }
}
```

**الرد**:
```json
{
  "success": true,
  "session": {
    "sessionId": "collab_1234567890_xyz789",
    "status": "pending_approval",
    "createdAt": "2026-02-20T14:00:00.000Z",
    "task": "Fix security vulnerability in authentication",
    "participants": ["security-agent"]
  }
}
```

#### الموافقة على جلسة (مسؤول فقط)
```http
POST /api/notifications/coordination/{sessionId}/approve
X-Admin-Token: your-admin-token
```

#### الانضمام إلى جلسة
```http
POST /api/notifications/coordination/{sessionId}/join
Content-Type: application/json

{
  "agentId": "integrity-agent"
}
```

#### إرسال رسالة في جلسة
```http
POST /api/notifications/coordination/{sessionId}/message
Content-Type: application/json

{
  "agentId": "security-agent",
  "message": "تم فحص الكود، وجدت ثغرة في الملف auth.js",
  "metadata": {
    "file": "src/middleware/auth.js",
    "line": 42
  }
}
```

#### إكمال جلسة
```http
POST /api/notifications/coordination/{sessionId}/complete
Content-Type: application/json

{
  "result": {
    "status": "fixed",
    "summary": "تم إصلاح الثغرة الأمنية بنجاح"
  }
}
```

#### الجلسات النشطة
```http
GET /api/notifications/coordination
```

#### سجل التعاون
```http
GET /api/notifications/coordination/history?limit=10
```

### الدرع الأمني (Security Shield)

#### حالة الدرع
```http
GET /api/notifications/security/status
```

**الرد**:
```json
{
  "success": true,
  "status": {
    "shieldActive": false,
    "threatLevel": "normal",
    "recentThreats": [],
    "activeActivations": [],
    "totalActivations": 3,
    "systemHealth": {
      "healthy": true,
      "checks": {
        "memoryUsage": true,
        "safeMode": false,
        "lanOnly": false,
        "uptime": true
      }
    }
  }
}
```

#### الإبلاغ عن ثغرة أمنية
```http
POST /api/notifications/security/report-vulnerability
Content-Type: application/json

{
  "description": "SQL Injection vulnerability in user input",
  "severity": "high",
  "source": "code_review",
  "details": {
    "file": "src/controllers/userController.js",
    "line": 87,
    "cwe": "CWE-89"
  }
}
```

**الرد**:
```json
{
  "success": true,
  "threat": {
    "threatId": "shield_1234567890_abc123",
    "timestamp": "2026-02-20T14:00:00.000Z",
    "type": "vulnerability",
    "description": "SQL Injection vulnerability in user input",
    "severity": "high"
  }
}
```

#### تفعيل الدرع يدوياً (مسؤول فقط)
```http
POST /api/notifications/security/activate-shield
X-Admin-Token: your-admin-token
Content-Type: application/json

{
  "description": "Detected intrusion attempt",
  "severity": "critical",
  "source": "firewall",
  "details": {
    "ip": "192.168.1.100",
    "timestamp": "2026-02-20T14:00:00.000Z"
  }
}
```

#### إلغاء تفعيل الدرع (مسؤول فقط)
```http
POST /api/notifications/security/deactivate-shield
X-Admin-Token: your-admin-token
Content-Type: application/json

{
  "activationId": "shield_1234567890_abc123",
  "resolution": {
    "status": "resolved",
    "summary": "تم التعامل مع التهديد وإصلاح الثغرة",
    "actions": [
      "Blocked malicious IP",
      "Updated firewall rules",
      "Patched vulnerability"
    ]
  }
}
```

#### سجل التهديدات
```http
GET /api/notifications/security/threats?limit=20&severity=high
```

#### إحصائيات الأمان
```http
GET /api/notifications/security/stats
```

---

## التكامل التلقائي

### GitHub Webhooks

النظام يتكامل تلقائياً مع GitHub ويرسل إشعارات عند:

1. **Push Events** - عند رفع تحديثات جديدة
2. **Pull Request Events** - عند فتح/إغلاق/دمج PR
3. **Security Advisory** - عند اكتشاف ثغرات أمنية
4. **Issues** - عند فتح/إغلاق المشاكل (خاصة الأمنية)
5. **Workflow Runs** - عند فشل CI/CD
6. **Deployments** - عند فشل النشر

#### مثال: عند فشل CI/CD
```
1. GitHub يرسل webhook
2. النظام يستقبل الإشعار
3. يبث تنبيه لجميع الوكلاء
4. يبدأ جلسة تنسيق تلقائية
5. يطلب موافقة قبل التنفيذ
6. ينفذ الإصلاح بعد الموافقة
```

---

## أمثلة الاستخدام

### مثال 1: اكتشاف ثغرة أمنية

```javascript
// 1. وكيل الأمان يكتشف ثغرة
await notificationService.securityAlert(
  "SQL Injection vulnerability detected",
  {
    file: "src/database/queries.js",
    severity: "high"
  }
);

// 2. النظام يفعّل الدرع الأمني تلقائياً
// 3. يرسل إشعار لجميع الوكلاء
// 4. يبدأ جلسة تنسيق مع وكلاء الأمان
// 5. يطلب موافقة المستخدم قبل الإصلاح
```

### مثال 2: مشكلة في التكامل

```javascript
// 1. اكتشاف مشكلة في API
await notificationService.integrationIssue(
  "Payment Gateway API",
  {
    message: "Connection timeout",
    errorCode: "ETIMEDOUT"
  }
);

// 2. يبدأ تنسيق بين الوكلاء للإصلاح
const session = await agentCoordinationService.coordinateIntegrationFix(
  "Payment Gateway API",
  { message: "Connection timeout" },
  "monitoring-agent"
);

// 3. الوكلاء يتعاونون لحل المشكلة
// 4. يُخطر المستخدم بالتقدم
```

### مثال 3: تحديث في المستودع

```javascript
// عند push جديد إلى GitHub
await notificationService.repositoryChange("push", {
  description: "5 commits pushed to main branch",
  pusher: "developer1",
  commits: [/* ... */]
});

// جميع الوكلاء المشتركين يستقبلون الإشعار فوراً
```

---

## متغيرات البيئة

لا توجد متغيرات إضافية مطلوبة. النظام يستخدم المتغيرات الموجودة:

- `ADMIN_TOKEN` - للمصادقة على العمليات الحرجة
- `GITHUB_WEBHOOK_SECRET` - للتحقق من webhooks
- `TELEGRAM_BOT_TOKEN` - لإرسال إشعارات Telegram (اختياري)

---

## التدقيق والسجلات

جميع العمليات يتم تدقيقها تلقائياً:

- **Notification Broadcasts** - تُسجل في `logs/audit.log`
- **Coordination Sessions** - تُسجل في `logs/audit.log`
- **Security Events** - تُسجل في `logs/audit.log` و `data/audit/audit.log`
- **Shield Activations** - تُعتبر حالات طوارئ وتُسجل بأولوية عالية

---

## الأمان

### الحماية المضمنة:
1. ✅ المصادقة على جميع العمليات الحرجة
2. ✅ التحقق من webhooks قبل المعالجة
3. ✅ تدقيق شامل لجميع الإجراءات
4. ✅ طلب موافقة قبل التنفيذ
5. ✅ حد أقصى لحجم الإشعارات (1000)
6. ✅ تصفية وتحقق من المدخلات

### معالجة الأخطاء:
- جميع الأخطاء تُسجل ولا تُوقف النظام
- الإشعارات تستمر حتى عند فشل بعض الوكلاء
- النظام يعمل بشكل مستقل عن Orchestrator الحالي

---

## الاختبار

### اختبار محلي:

```bash
# 1. تشغيل السيرفر
npm run dev

# 2. الاشتراك في الإشعارات
curl -X POST http://localhost:3000/api/notifications/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "test-agent",
    "priority": "normal"
  }'

# 3. إرسال إشعار تجريبي (يتطلب admin token)
curl -X POST http://localhost:3000/api/notifications/broadcast \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: your-admin-token" \
  -d '{
    "type": "test",
    "priority": "normal",
    "message": "رسالة تجريبية"
  }'

# 4. التحقق من الإشعارات
curl http://localhost:3000/api/notifications
```

---

## الأسئلة الشائعة

### س: هل النظام يعمل في الوقت الفعلي؟
ج: نعم، يستخدم EventEmitter لبث الإشعارات فوراً لجميع المشتركين.

### س: ماذا يحدث عند تفعيل الدرع الأمني؟
ج: 
1. يُرسل تنبيه فوري لجميع الوكلاء
2. يبدأ جلسة تنسيق تلقائية
3. يُسجل كحالة طوارئ
4. يُنفذ إجراءات فورية حسب مستوى التهديد

### س: هل يمكن تعطيل الإشعارات مؤقتاً؟
ج: نعم، عن طريق إلغاء الاشتراك: `POST /api/notifications/unsubscribe`

### س: كيف أعرف حالة الجلسات النشطة؟
ج: `GET /api/notifications/coordination` تعرض جميع الجلسات النشطة.

### س: هل النظام يدعم Telegram؟
ج: نعم، إذا كان `TELEGRAM_BOT_TOKEN` مضبوطاً، سيرسل إشعارات تلقائياً.

---

## الدعم والمساهمة

للإبلاغ عن مشاكل أو اقتراح تحسينات:
1. افتح Issue في GitHub
2. أرسل Pull Request
3. راجع الوثائق في `docs/`

---

**تم التطوير بواسطة**: BSM/LexBANK Team  
**الإصدار**: 1.0.0  
**التاريخ**: 2026-02-20
