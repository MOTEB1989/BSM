# دليل API الشامل - Comprehensive API Guide

## نظرة عامة - Overview

### العربية
واجهة برمجة التطبيقات (API) الخاصة بمنصة BSM توفر وصولاً موحداً إلى 5 وكلاء ذكاء اصطناعي متقدمين. تم تصميم الواجهة وفقاً لمعايير RESTful API مع دعم كامل للغتين العربية والإنجليزية.

### English
The BSM platform API provides unified access to 5 advanced AI agents. The API is designed according to RESTful standards with full support for both Arabic and English languages.

---

## نقاط النهاية الأساسية - Core Endpoints

### Base URL
```
Production:  https://sr-bsm.onrender.com/api
Development: http://localhost:3000/api
```

---

## 1. الوكلاء - Agents

### 1.1 قائمة الوكلاء المتاحين - List Available Agents

```http
GET /api/agents
```

**Query Parameters:**
- `mode` (optional): Filter by context (`chat`, `api`, `mobile`)
- `language` (optional): Response language (`ar`, `en`)

**Response:**
```json
{
  "agents": [
    {
      "id": "gemini-agent",
      "name": "Gemini Agent",
      "nameAr": "وكيل جيميني",
      "category": "conversational",
      "provider": "Google",
      "capabilities": [
        "arabic_language_expertise",
        "creative_writing",
        "multimodal_understanding"
      ],
      "contexts": ["chat", "api", "mobile"],
      "status": "active"
    },
    {
      "id": "claude-agent",
      "name": "Claude Agent",
      "nameAr": "وكيل كلود",
      "category": "conversational",
      "provider": "Anthropic",
      "capabilities": [
        "deep_analysis",
        "code_review",
        "ethical_reasoning"
      ],
      "contexts": ["chat", "api", "mobile"],
      "status": "active"
    },
    {
      "id": "perplexity-agent",
      "name": "Perplexity Search Agent",
      "nameAr": "وكيل البحث",
      "category": "search",
      "provider": "Perplexity",
      "capabilities": [
        "web_search",
        "citations",
        "real_time_data"
      ],
      "contexts": ["chat", "api", "mobile"],
      "status": "active"
    },
    {
      "id": "kimi-agent",
      "name": "Kimi Agent",
      "nameAr": "وكيل كيمي",
      "category": "conversational",
      "provider": "Moonshot AI",
      "capabilities": [
        "long_context",
        "document_processing",
        "chinese_expertise"
      ],
      "contexts": ["chat", "api", "mobile"],
      "status": "active"
    },
    {
      "id": "gpt-agent",
      "name": "GPT-4 Agent",
      "nameAr": "وكيل GPT-4",
      "category": "conversational",
      "provider": "OpenAI",
      "capabilities": [
        "general_purpose",
        "coding",
        "reasoning"
      ],
      "contexts": ["chat", "api", "mobile"],
      "status": "active"
    }
  ],
  "language": "ar",
  "timestamp": "2026-02-20T21:58:14.760Z"
}
```

---

### 1.2 محادثة مع وكيل - Chat with Agent

```http
POST /api/chat
```

**Request Headers:**
```
Content-Type: application/json
Accept-Language: ar-SA, en-US
```

**Request Body:**
```json
{
  "message": "ما هي أفضل ممارسات الأمان السيبراني؟",
  "destination": "gemini-agent",
  "language": "ar",
  "history": [
    {
      "role": "user",
      "content": "مرحباً"
    },
    {
      "role": "assistant",
      "content": "مرحباً بك! كيف يمكنني مساعدتك اليوم؟"
    }
  ],
  "context": {
    "userId": "user123",
    "sessionId": "session456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "تمت المعالجة بنجاح",
  "data": {
    "response": "أفضل ممارسات الأمان السيبراني تشمل:\n\n1. **التشفير القوي**: استخدام TLS 1.3 وAES-256\n2. **المصادقة المتعددة**: تفعيل 2FA على جميع الحسابات\n3. **تحديثات منتظمة**: تطبيق التصحيحات الأمنية فوراً\n4. **النسخ الاحتياطي**: نسخ احتياطية يومية مشفرة\n5. **التدريب**: تثقيف الموظفين حول التهديدات\n\nوفقاً لمعايير ساما، يجب أيضاً:\n- تسجيل جميع الأحداث الأمنية\n- فحص دوري للثغرات\n- خطة استجابة للحوادث",
    "agent": "gemini-agent",
    "agentName": "وكيل جيميني",
    "provider": "Google Gemini",
    "language": "ar",
    "direction": "rtl",
    "confidence": 0.95,
    "tokens": {
      "input": 15,
      "output": 180,
      "total": 195
    }
  },
  "metadata": {
    "processingTime": "1.2s",
    "correlationId": "req_abc123",
    "timestamp": "2026-02-20T21:58:14.760Z"
  }
}
```

---

### 1.3 محادثة مباشرة مع GPT - Direct GPT Chat

```http
POST /api/chat/direct
```

**Request Body:**
```json
{
  "message": "Explain quantum computing",
  "language": "en",
  "history": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Quantum computing is a revolutionary technology that...",
    "language": "en",
    "direction": "ltr",
    "model": "gpt-4o-mini"
  }
}
```

---

### 1.4 حالة مفاتيح AI - AI Keys Status

```http
GET /api/chat/key-status
```

**Response:**
```json
{
  "providers": {
    "openai": {
      "configured": true,
      "status": "active",
      "keySource": "OPENAI_BSU_KEY",
      "lastChecked": "2026-02-20T21:58:14.760Z"
    },
    "gemini": {
      "configured": true,
      "status": "active",
      "keySource": "GEMINI_API_KEY",
      "lastChecked": "2026-02-20T21:58:14.760Z"
    },
    "anthropic": {
      "configured": true,
      "status": "active",
      "keySource": "ANTHROPIC_API_KEY",
      "lastChecked": "2026-02-20T21:58:14.760Z"
    },
    "perplexity": {
      "configured": true,
      "status": "active",
      "keySource": "PERPLEXITY_KEY",
      "lastChecked": "2026-02-20T21:58:14.760Z"
    },
    "kimi": {
      "configured": true,
      "status": "active",
      "keySource": "KIMI_API_KEY",
      "lastChecked": "2026-02-20T21:58:14.760Z"
    }
  },
  "overall": "healthy",
  "timestamp": "2026-02-20T21:58:14.760Z"
}
```

---

## 2. الصحة والحالة - Health & Status

### 2.1 فحص صحي أساسي - Basic Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-20T21:58:14.760Z",
  "uptime": "15d 6h 32m"
}
```

---

### 2.2 فحص صحي مفصل - Detailed Health Check

```http
GET /api/health/detailed
```

**Response:**
```json
{
  "status": "healthy",
  "components": {
    "api": {
      "status": "healthy",
      "responseTime": "5ms"
    },
    "database": {
      "status": "healthy",
      "connections": 10
    },
    "aiProviders": {
      "openai": "healthy",
      "gemini": "healthy",
      "claude": "healthy",
      "perplexity": "healthy",
      "kimi": "healthy"
    },
    "filesystem": {
      "status": "healthy",
      "diskSpace": "75% available"
    },
    "registry": {
      "status": "valid",
      "agents": 18
    }
  },
  "samaCompliance": {
    "encryption": "active",
    "auditLogging": "active",
    "dataResidency": "configured",
    "status": "compliant"
  },
  "timestamp": "2026-02-20T21:58:14.760Z"
}
```

---

### 2.3 حالة النظام - System Status

```http
GET /api/status
```

**Response:**
```json
{
  "platform": "BSM/LexBANK",
  "version": "2.0.0",
  "environment": "production",
  "features": {
    "multiAgent": true,
    "bilingual": true,
    "samaCompliant": true,
    "mcpProtocol": true,
    "realTimeSearch": true
  },
  "capabilities": [
    "chat",
    "agents",
    "knowledge",
    "orchestrator",
    "mcp"
  ],
  "providers": {
    "openai": "active",
    "gemini": "active",
    "claude": "active",
    "perplexity": "active",
    "kimi": "active"
  },
  "endpoints": {
    "backend": "https://sr-bsm.onrender.com",
    "frontend": "https://moteb1989.github.io/BSM",
    "chat": "https://lexprim.com",
    "corehub": "https://corehub.nexus"
  }
}
```

---

## 3. قاعدة المعرفة - Knowledge Base

### 3.1 قائمة الوثائق - List Documents

```http
GET /api/knowledge
```

**Query Parameters:**
- `language` (optional): Filter by language

**Response:**
```json
{
  "documents": [
    {
      "id": "sama-compliance",
      "title": "SAMA Banking Compliance Guide",
      "titleAr": "دليل الامتثال لمعايير ساما",
      "category": "compliance",
      "language": "bilingual",
      "lastUpdated": "2026-02-20"
    }
  ]
}
```

---

## 4. الإدارة - Administration

### 4.1 تكوين الوكلاء - Agent Configuration

```http
GET /api/admin/agents
```

**Request Headers:**
```
x-admin-token: your-admin-token
```

**Response:**
```json
{
  "agents": [
    {
      "id": "gemini-agent",
      "config": {
        "modelProvider": "gemini",
        "modelName": "gemini-2.0-flash-exp",
        "temperature": 0.7,
        "maxTokens": 2048
      },
      "security": {
        "safeMode": true,
        "riskLevel": "low"
      }
    }
  ]
}
```

---

## أمثلة الاستخدام - Usage Examples

### مثال 1: محادثة باللغة العربية - Arabic Chat

```javascript
const response = await fetch('https://sr-bsm.onrender.com/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': 'ar-SA'
  },
  body: JSON.stringify({
    message: 'اشرح لي الذكاء الاصطناعي',
    destination: 'gemini-agent',
    language: 'ar'
  })
});

const data = await response.json();
console.log(data.data.response);
```

---

### مثال 2: بحث مع استشهادات - Search with Citations

```javascript
const response = await fetch('https://sr-bsm.onrender.com/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Latest AI developments in 2026',
    destination: 'perplexity-agent',
    language: 'en'
  })
});

const data = await response.json();
console.log(data.data.response);
console.log(data.data.citations); // Citations included
```

---

### مثال 3: تحليل نص طويل - Long Text Analysis

```javascript
const longDocument = `...`; // 100K+ characters

const response = await fetch('https://sr-bsm.onrender.com/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: `Analyze this document: ${longDocument}`,
    destination: 'kimi-agent',
    language: 'en'
  })
});

const data = await response.json();
console.log(data.data.response);
```

---

## رموز الحالة - Status Codes

| Code | Arabic | English |
|------|--------|---------|
| 200 | نجاح | Success |
| 201 | تم الإنشاء | Created |
| 400 | طلب غير صالح | Bad Request |
| 401 | غير مصرح | Unauthorized |
| 403 | ممنوع | Forbidden |
| 404 | غير موجود | Not Found |
| 429 | كثرة الطلبات | Too Many Requests |
| 500 | خطأ في الخادم | Server Error |
| 503 | الخدمة غير متاحة | Service Unavailable |

---

## معدلات الطلبات - Rate Limits

| Endpoint | حد الطلبات - Limit | النافذة الزمنية - Window |
|----------|-------------------|------------------------|
| `/api/chat` | 100 requests | 15 minutes |
| `/api/agents` | 200 requests | 15 minutes |
| `/api/health` | Unlimited | - |
| `/webhook/*` | 30 requests | 1 minute |

---

## الأمان - Security

### مصادقة - Authentication

```http
# Admin endpoints
x-admin-token: your-admin-token

# User endpoints (optional)
Authorization: Bearer your-jwt-token
```

### تشفير - Encryption

- جميع الاتصالات مشفرة بـ TLS 1.3
- البيانات الحساسة مشفرة بـ AES-256
- All connections encrypted with TLS 1.3
- Sensitive data encrypted with AES-256

---

## SDK والمكتبات - SDKs & Libraries

### JavaScript/TypeScript

```bash
npm install @lexbank/bsm-client
```

```javascript
import { BSMClient } from '@lexbank/bsm-client';

const client = new BSMClient({
  apiUrl: 'https://sr-bsm.onrender.com/api',
  language: 'ar'
});

const response = await client.chat.send({
  message: 'مرحباً',
  agent: 'gemini-agent'
});
```

---

## الدعم - Support

- **الوثائق - Documentation:** https://moteb1989.github.io/BSM/
- **البريد الإلكتروني - Email:** support@lexbank.com
- **المستودع - Repository:** https://github.com/MOTEB1989/BSM

---

**آخر تحديث - Last Updated:** 2026-02-20  
**الإصدار - Version:** 2.0.0
