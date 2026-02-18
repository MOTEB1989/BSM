# Chat Error Handling Flow

This document visualizes how errors flow through the system with the new improvements.

## Error Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Action                               │
│                   (Sends chat message)                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (app.js)                             │
│  • Sends POST to /api/chat/direct                               │
│  • Includes: message, language, history                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
                  ▼                     ▼
         ┌─────────────┐      ┌─────────────────┐
         │   Success   │      │  Fetch Failure  │
         │   (200 OK)  │      │   (TypeError)   │
         └──────┬──────┘      └────────┬────────┘
                │                      │
                │                      ▼
                │              ┌───────────────────────────┐
                │              │ Frontend Error Handler    │
                │              │ • instanceof TypeError?   │
                │              │ • Display: "Failed to     │
                │              │   connect to server"      │
                │              └───────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Route (chat.js)                       │
│  • Validates input                                              │
│  • Checks API key exists                                        │
│  • Calls runGPT()                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
                  ▼                     ▼
         ┌─────────────┐      ┌─────────────────┐
         │   Success   │      │     Error       │
         │  (GPT resp) │      │   (Exception)   │
         └──────┬──────┘      └────────┬────────┘
                │                      │
                │                      ▼
                │              ┌───────────────────────────┐
                │              │ Error Middleware          │
                │              │ (errorHandler.js)         │
                │              │                          │
                │              │ Maps error codes:        │
                │              │ • MISSING_API_KEY → 503  │
                │              │ • NETWORK_ERROR → 503    │
                │              │ • GPT_TIMEOUT → 500      │
                │              │ • Other → 500            │
                │              └──────────┬────────────────┘
                │                         │
                ▼                         ▼
         ┌─────────────┐      ┌─────────────────────────┐
         │   Display   │      │ Frontend Error Handler  │
         │   Response  │      │                        │
         │   to User   │      │ • Check err.code       │
         │             │      │ • Check err.status     │
         │             │      │ • Display localized    │
         │             │      │   error message        │
         └─────────────┘      └────────────────────────┘
```

## GPT Service Error Detection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  gptService.runGPT()                             │
│  • Build OpenAI API request                                     │
│  • Set 30s timeout                                              │
│  • Execute within circuit breaker                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              fetch(api.openai.com)                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
   ┌────────────┐   ┌─────────────┐   ┌──────────────┐
   │  Success   │   │   Timeout   │   │ Network Err  │
   │  (200 OK)  │   │   (>30s)    │   │  (ENOTFOUND) │
   └─────┬──────┘   └──────┬──────┘   └──────┬───────┘
         │                 │                  │
         │                 ▼                  ▼
         │        ┌────────────────┐  ┌───────────────────┐
         │        │ GPT_TIMEOUT    │  │ NETWORK_ERROR     │
         │        │ Status: 500    │  │ Status: 503       │
         │        └────────────────┘  └───────────────────┘
         │
         ▼
   ┌────────────────────────────────────────────┐
   │ Return GPT response to caller              │
   └────────────────────────────────────────────┘
```

## Error Code Mapping

| Error Source | Error Code | HTTP Status | User Message (EN) | User Message (AR) |
|-------------|-----------|-------------|------------------|------------------|
| Frontend fetch failure | N/A | N/A | "Failed to connect to server" | "فشل الاتصال بالخادم" |
| Missing API key | MISSING_API_KEY | 503 | "AI service is not configured" | "خدمة الذكاء الاصطناعي غير متاحة" |
| DNS failure | NETWORK_ERROR | 503 | "Cannot connect to AI service" | "لا يمكن الاتصال بخدمة الذكاء" |
| Request timeout | GPT_TIMEOUT | 500 | "AI service request timed out" | "انتهت مهلة طلب الذكاء" |
| Rate limiting | N/A | 429 | "Rate limit exceeded" | "تم تجاوز الحد المسموح" |
| Generic error | N/A | 500 | "Server error occurred" | "حدث خطأ في الخادم" |

## Before vs After

### Before (Generic Error)
```
User Action → Fetch → API Call → Error
                                   ↓
                           "Internal Server Error"
                                   ↓
                           User confused, no action possible
```

### After (Specific Errors)
```
User Action → Fetch → API Call → Error Detection
                                   ↓
                           ┌──────┴───────┐
                           ↓              ↓
                    Error Code        Status Code
                           ↓              ↓
                    Localized      Actionable
                    Message        Guidance
                           ↓              ↓
                    User understands issue and knows what to do
```

## Error Detection Logic

### Frontend (app.js)
```javascript
try {
  const res = await fetch(url, { ... });
  // Handle response
} catch (err) {
  // 1. Check if TypeError (network failure)
  if (err instanceof TypeError) {
    errorMessage = "Failed to connect to server";
  }
  // 2. Check specific error codes from backend
  else if (err.code === 'NETWORK_ERROR') {
    errorMessage = "Cannot connect to AI service";
  }
  else if (err.code === 'GPT_TIMEOUT') {
    errorMessage = "AI service request timed out";
  }
  // 3. Check HTTP status codes
  else if (err.status === 503) {
    errorMessage = "AI service is not available";
  }
  // 4. Default to generic message
  else {
    errorMessage = err.message;
  }
}
```

### Backend (gptService.js)
```javascript
try {
  const res = await fetch(OPENAI_URL, { ... });
  // Handle response
} catch (err) {
  // 1. Check if timeout
  if (err.name === 'AbortError') {
    throw new AppError("...", 500, "GPT_TIMEOUT");
  }
  // 2. Check if network error
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    throw new AppError("...", 503, "NETWORK_ERROR");
  }
  // 3. Re-throw other errors
  throw err;
}
```

## Circuit Breaker Integration

The GPT service uses a circuit breaker pattern:

```
┌────────────────────────────────────────┐
│        Circuit Breaker States          │
├────────────────────────────────────────┤
│                                        │
│  CLOSED (Normal)                       │
│    ↓ (5 failures)                      │
│  OPEN (Blocking)                       │
│    ↓ (30s timeout)                     │
│  HALF_OPEN (Testing)                   │
│    ↓ (success)                         │
│  CLOSED (Normal)                       │
│                                        │
└────────────────────────────────────────┘
```

When circuit is OPEN:
- New requests fail immediately
- Error: "Service temporarily unavailable"
- Prevents cascade failures

## Health Check Flow

```
node scripts/chat-health-check.js https://sr-bsm.onrender.com
          ↓
┌─────────────────────────────────────────┐
│ 1. Test /health                         │
│    ✅ Service running                   │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│ 2. Test /api/health                     │
│    ✅ API responding                    │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│ 3. Test /api/chat/key-status            │
│    Check: status.openai                 │
│    ✅ true  → API key configured        │
│    ❌ false → API key missing           │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│ 4. Test /api/chat/direct                │
│    Send test message                    │
│    ✅ Got response → Chat working       │
│    ❌ Error → Display error code        │
│              and actionable guidance    │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│ Summary Report                          │
│ • Passed: X/4                           │
│ • Failed: Y/4                           │
│ • Recommendations                       │
└─────────────────────────────────────────┘
```

## Key Improvements

1. **Network Error Detection**: Frontend now catches `TypeError` from fetch failures
2. **Error Code Propagation**: Backend errors include specific codes (NETWORK_ERROR, GPT_TIMEOUT, etc.)
3. **Localized Messages**: Errors shown in user's language (Arabic/English)
4. **Actionable Guidance**: Each error suggests what to do next
5. **Diagnostic Tools**: Health check script identifies exact issue
6. **Circuit Breaker**: Prevents cascade failures when API is down

## Testing Error Scenarios

To test each error type:

1. **Network Error**: Stop server, try to send message
2. **Missing API Key**: Remove OPENAI_BSM_KEY env var
3. **Timeout**: Mock slow API response
4. **Rate Limit**: Send many requests rapidly
5. **DNS Error**: Block api.openai.com in hosts file

Each should now show appropriate error message.
