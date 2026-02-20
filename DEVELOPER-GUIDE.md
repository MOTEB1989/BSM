# دليل المطور - Developer Guide

## نظرة عامة - Overview

### العربية
دليل شامل للمطورين للعمل على منصة BSM مع تكامل الوكلاء الذكيين المتعددين ومعايير الأمان المصرفي.

### English
Comprehensive developer guide for working on the BSM platform with multi-agent AI integration and banking security standards.

---

## البدء السريع - Quick Start

### المتطلبات - Prerequisites

```bash
# Node.js 22+
node --version  # v22.x.x

# npm 10+
npm --version   # 10.x.x

# Git
git --version
```

### التثبيت - Installation

```bash
# 1. استنساخ المستودع - Clone repository
git clone https://github.com/MOTEB1989/BSM.git
cd BSM

# 2. تثبيت التبعيات - Install dependencies
npm ci

# 3. تثبيت تبعيات MCP - Install MCP dependencies
npm run mcp:install

# 4. إعداد متغيرات البيئة - Setup environment variables
cp .env.example .env
# Edit .env with your API keys

# 5. التحقق من الصحة - Validate setup
npm run health:detailed

# 6. تشغيل الخادم - Start development server
npm run dev
```

---

## البنية المعمارية - Architecture

### نمط الطبقات - Layered Pattern

```
┌─────────────────────────────────────┐
│   Presentation Layer (UI)           │
│   - Vue 3 Chat Interface            │
│   - Admin Dashboard                 │
│   - Nuxt 3 Chat (lexprim-chat)     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   API Layer (Express.js)            │
│   - RESTful endpoints               │
│   - MCP Protocol Server             │
│   - WebSocket support               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Business Logic Layer              │
│   - Agent Services                  │
│   - Orchestrator                    │
│   - Knowledge Base                  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Integration Layer                 │
│   - AI Provider Clients             │
│   - GitHub Integration              │
│   - Telegram Bot                    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Infrastructure Layer              │
│   - Security (SAMA Compliance)      │
│   - Audit Logging                   │
│   - Circuit Breaker                 │
│   - Caching                         │
└─────────────────────────────────────┘
```

---

## تطوير الوكلاء - Agent Development

### إنشاء وكيل جديد - Creating a New Agent

#### 1. تعريف YAML - YAML Definition

```yaml
# data/agents/my-new-agent.yaml
id: my-new-agent
name: My New AI Agent
nameAr: وكيلي الذكي الجديد
version: 1.0.0
role: advisor
category: conversational

# نموذج AI - AI Model
modelProvider: gemini
modelKey: GEMINI_API_KEY
modelName: gemini-2.0-flash-exp

# إعدادات - Settings
temperature: 0.7
maxTokens: 2048
topP: 0.9

# مطالبات النظام - System Prompts
systemPrompt:
  ar: |
    أنت وكيل ذكي متخصص في [المجال].
    مهمتك [الوصف].
  en: |
    You are an AI agent specialized in [domain].
    Your mission is [description].

# الإجراءات المسموحة - Allowed Actions
actions:
  - respond
  - analyze
  - suggest

# السياقات المسموحة - Allowed Contexts
contexts:
  allowed:
    - chat
    - api
    - mobile

# الأمان - Security
safety:
  mode: safe
  samaCompliant: true
  requiresApproval: false

# المخاطر - Risk
risk:
  level: low
  rationale: "Conversational agent with no system access"

# الموافقة - Approval
approval:
  required: false
  type: none
  approvers: []

# بدء التشغيل - Startup
startup:
  auto_start: false
  allowed_profiles:
    - development
    - staging
    - production

# الفحص الصحي - Health Check
healthcheck:
  endpoint: /api/agents/my-new-agent/health
  interval_seconds: 60
```

#### 2. تسجيل في الفهرس - Register in Index

```json
// data/agents/index.json
{
  "agents": [
    "gemini-agent.yaml",
    "claude-agent.yaml",
    "my-new-agent.yaml"  // أضف هنا - Add here
  ]
}
```

#### 3. تسجيل في السجل - Register in Registry

```yaml
# agents/registry.yaml
agents:
  - id: my-new-agent
    name: My New AI Agent
    category: conversational
    role: advisor
    # ... (نسخ الحقول من YAML - copy fields from YAML)
```

#### 4. التحقق من الصحة - Validate

```bash
npm run validate
npm run validate:registry
npm run validate:agent-sync
```

---

### استخدام الوكيل - Using the Agent

```javascript
// Via API
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Test message',
    destination: 'my-new-agent',
    language: 'ar'
  })
});

// Via MCP
const result = await mcpClient.chat_my_new_agent({
  message: 'Test message',
  language: 'ar'
});
```

---

## تطوير واجهة المستخدم - UI Development

### العمل على واجهة الدردشة - Chat UI Development

```bash
# تشغيل الخادم مع إعادة التحميل - Start with hot reload
npm run dev

# الملفات الأساسية - Core Files
src/chat/
  ├── index.html          # الصفحة الرئيسية - Main page
  ├── app.js              # منطق التطبيق - App logic
  ├── styles.css          # الأنماط - Styles
  ├── provider-status.js  # لوحة حالة المزودين - Provider status
  └── provider-status.css # أنماط اللوحة - Dashboard styles
```

### إضافة ميزة جديدة - Adding a New Feature

```javascript
// في app.js - In app.js
const { createApp } = Vue;

createApp({
  data() {
    return {
      // أضف حالة جديدة - Add new state
      myFeature: false
    };
  },
  methods: {
    // أضف طريقة جديدة - Add new method
    async handleMyFeature() {
      try {
        const response = await fetch('/api/my-endpoint');
        const data = await response.json();
        // معالجة البيانات - Process data
      } catch (error) {
        console.error('Error:', error);
      }
    }
  }
}).mount('#app');
```

---

## تطوير API - API Development

### إضافة نقطة نهاية جديدة - Adding a New Endpoint

```javascript
// src/routes/myRoute.js
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { adminAuth } from '../middleware/auth.js';
import { samaAuditMiddleware } from '../middleware/samaCompliance.js';

const router = Router();

/**
 * GET /api/my-endpoint
 * وصف النقطة - Endpoint description
 */
router.get(
  '/my-endpoint',
  samaAuditMiddleware,  // تدقيق SAMA - SAMA audit
  asyncHandler(async (req, res) => {
    const { language = 'ar' } = req.query;
    
    // منطق العمل - Business logic
    const result = {
      success: true,
      message: language === 'ar' ? 'نجح' : 'Success',
      data: {}
    };
    
    res.json(result);
  })
);

/**
 * POST /api/my-endpoint
 * نقطة محمية - Protected endpoint
 */
router.post(
  '/my-endpoint',
  adminAuth,            // مصادقة المسؤول - Admin auth
  samaAuditMiddleware,  // تدقيق SAMA - SAMA audit
  asyncHandler(async (req, res) => {
    const { data } = req.body;
    
    // التحقق من الصحة - Validation
    if (!data) {
      return res.status(400).json({
        error: true,
        message: 'Missing required field: data'
      });
    }
    
    // معالجة البيانات - Process data
    const result = await processData(data);
    
    res.json({
      success: true,
      data: result
    });
  })
);

export default router;
```

```javascript
// src/routes/index.js
import myRoute from './myRoute.js';

// ... existing imports

export default function registerRoutes(app) {
  // ... existing routes
  
  app.use('/api', myRoute);  // سجل المسار - Register route
}
```

---

## الاختبار - Testing

### اختبارات الوحدة - Unit Tests

```javascript
// tests/myService.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { myService } from '../src/services/myService.js';

describe('MyService', () => {
  it('should process data correctly', async () => {
    const input = { test: 'data' };
    const result = await myService.process(input);
    
    assert.ok(result, 'Result should exist');
    assert.strictEqual(result.success, true, 'Should succeed');
  });
});
```

### اختبارات التكامل - Integration Tests

```bash
# تشغيل جميع الاختبارات - Run all tests
npm test

# اختبارات التكامل - Integration tests
npm run test:integration

# اختبارات الوحدة - Unit tests
npm run test:unit
```

---

## الأمان - Security

### تطبيق معايير SAMA - Implementing SAMA Standards

```javascript
import {
  samaAuditMiddleware,
  samaSecurityHeaders,
  samaDataResidency,
  encryptSensitiveData
} from '../middleware/samaCompliance.js';

// استخدام Middleware - Use Middleware
app.use(samaSecurityHeaders);
app.use(samaAuditMiddleware);
app.use(samaDataResidency);

// تشفير البيانات الحساسة - Encrypt sensitive data
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const encrypted = encryptSensitiveData('sensitive data', key);
```

### فحص الثغرات - Vulnerability Scanning

```bash
# فحص التبعيات - Scan dependencies
npm audit

# فحص الأسرار - Scan for secrets
npm run security:check

# CodeQL Analysis
# يتم تلقائياً في CI/CD - Runs automatically in CI/CD
```

---

## النشر - Deployment

### Render.com

```bash
# التكوين في render.yaml - Configuration in render.yaml
# يتم النشر تلقائياً عند الدفع إلى main - Auto-deploys on push to main

# فحص صحة النشر - Check deployment health
curl https://sr-bsm.onrender.com/api/health
```

### Docker

```bash
# بناء الصورة - Build image
docker build -t bsm:latest .

# تشغيل الحاوية - Run container
docker run -p 3000:3000 --env-file .env bsm:latest

# Docker Compose
docker-compose -f docker-compose.mysql.yml up -d
```

---

## الأدوات والأوامر - Tools & Commands

### أوامر التطوير - Development Commands

```bash
# تطوير مع إعادة التحميل - Development with reload
npm run dev

# فحص الكود - Lint code
npm run lint

# التحقق من الصحة - Validate
npm run validate
npm run validate:registry
npm run validate:agent-sync

# الفحص الصحي - Health check
npm run health
npm run health:detailed

# مراجعة PR محلية - Local PR review
npm run pr-check
npm run pr-check:verbose
```

### أوامر الإنتاج - Production Commands

```bash
# بناء للإنتاج - Build for production
npm run build  # (إذا كان لديك عملية بناء - if you have build process)

# تشغيل الإنتاج - Run production
npm start

# فحص الأمان - Security check
npm audit --production
```

---

## أفضل الممارسات - Best Practices

### 1. الكود - Code

```javascript
// ✅ جيد - Good
import { asyncHandler } from '../utils/asyncHandler.js';
import { getLocalizedMessage } from '../utils/bilingual.js';

router.get('/endpoint', asyncHandler(async (req, res) => {
  const { language = 'ar' } = req.query;
  const message = getLocalizedMessage(messages.success, language);
  
  res.json({ success: true, message });
}));

// ❌ سيئ - Bad
router.get('/endpoint', async (req, res) => {
  try {
    // Hard-coded messages
    res.json({ success: true, message: 'Success' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. الأمان - Security

```javascript
// ✅ جيد - Good
import { timingSafeEqual } from 'crypto';

const isValid = timingSafeEqual(
  Buffer.from(token),
  Buffer.from(expectedToken)
);

// ❌ سيئ - Bad
const isValid = token === expectedToken; // Timing attack vulnerable
```

### 3. معالجة الأخطاء - Error Handling

```javascript
// ✅ جيد - Good
import { AppError } from '../utils/errors.js';
import { getErrorResponse } from '../utils/bilingual.js';

throw new AppError('Invalid input', 400);

// في middleware الأخطاء - In error middleware
const errorResponse = getErrorResponse('invalidInput', req.language);
res.status(statusCode).json(errorResponse);

// ❌ سيئ - Bad
throw new Error('Error'); // Generic error
res.status(500).json({ error: 'Something went wrong' });
```

---

## الموارد - Resources

### الوثائق - Documentation

- [README.md](../README.md) - دليل البدء - Getting Started
- [CLAUDE.md](../CLAUDE.md) - دليل Claude AI - Claude AI Guide
- [API-GUIDE.md](./API-GUIDE.md) - دليل API - API Guide
- [MCP-INTEGRATION.md](./MCP-INTEGRATION.md) - دليل MCP - MCP Guide
- [SAMA-COMPLIANCE.md](./SAMA-COMPLIANCE.md) - دليل ساما - SAMA Guide
- [SECURITY.md](../SECURITY.md) - دليل الأمان - Security Guide
- [GOVERNANCE.md](../GOVERNANCE.md) - دليل الحوكمة - Governance Guide

### الأدوات - Tools

- [GitHub Repository](https://github.com/MOTEB1989/BSM)
- [VS Code Setup](./VSCODE-SETUP.md)
- [Postman Collection](../api/BSM-API.postman_collection.json)

### المجتمع - Community

- **Discord:** [قريباً - Coming Soon]
- **البريد الإلكتروني - Email:** support@lexbank.com
- **GitHub Issues:** للمشاكل والاقتراحات - For bugs and features

---

## استكشاف الأخطاء - Troubleshooting

### مشاكل شائعة - Common Issues

#### 1. فشل بدء الخادم - Server Fails to Start

```bash
# تحقق من المنافذ - Check ports
lsof -i :3000

# تحقق من المتغيرات - Check environment
npm run health:detailed

# أعد تثبيت التبعيات - Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 2. أخطاء وكلاء AI - AI Agent Errors

```bash
# تحقق من مفاتيح API - Check API keys
npm run health:detailed

# تحقق من حالة الوكلاء - Check agent status
curl http://localhost:3000/api/chat/key-status

# أعد تحميل الوكلاء - Reload agents
# (سيتم تحميلها تلقائياً بعد دقيقة - Auto-reload after 1 minute)
```

#### 3. أخطاء التحقق من الصحة - Validation Errors

```bash
# تحقق من ملفات YAML - Check YAML files
npm run validate

# تحقق من السجل - Check registry
npm run validate:registry

# تحقق من المزامنة - Check synchronization
npm run validate:agent-sync
```

---

**آخر تحديث - Last Updated:** 2026-02-20  
**الإصدار - Version:** 2.0.0  
**المصانون - Maintainers:** LexBANK Development Team
