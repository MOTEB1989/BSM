# Mobile Mode Guide

## Overview

Mobile Mode is a security feature that restricts operations when requests come from mobile devices (particularly iPhone). In Mobile Mode, mobile clients are treated as **read-only UI clients** with no write or administrative capabilities.

## Purpose

- **Security**: Prevent accidental or unauthorized modifications from mobile devices
- **Use Case**: iPhone as display/monitoring client only
- **Architecture**: Heavy processing remains on server

## Configuration

### Enable Mobile Mode

```bash
# .env
MOBILE_MODE=true
```

### Combine with LAN-Only Mode (Recommended)

```bash
MOBILE_MODE=true
LAN_ONLY=true
```

This ensures mobile devices can only access the system on local network AND are restricted to read-only operations.

## Mobile Detection

Mobile mode is automatically detected based on User-Agent:
- iPhone, iPad, iPod
- Android devices
- Mobile browsers
- Other mobile platforms

**User-Agent Patterns Detected:**
```
/iPhone/i
/iPad/i
/iPod/i
/Android/i
/Mobile/i
/webOS/i
/BlackBerry/i
/Windows Phone/i
```

## Restrictions

When Mobile Mode is enabled, the following operations are **blocked** for mobile clients:

### Blocked Operations

| Operation | Endpoint | Methods |
|-----------|----------|---------|
| Agent Execution | `/api/agents/run` | POST |
| Agent Start | `/api/agents/start` | POST |
| Agent Stop | `/api/agents/stop` | POST |
| Admin Operations | `/api/admin/*` | POST, PUT, DELETE, PATCH |
| Emergency Controls | `/api/emergency/*` | POST |

### Allowed Operations

Mobile clients CAN:
- ✅ View system status: `GET /api/status`
- ✅ List agents: `GET /api/agents`
- ✅ Check agent status: `GET /api/agents/status`
- ✅ View knowledge docs: `GET /api/knowledge`
- ✅ Read chat history: `GET /api/chat` (if implemented)
- ✅ Access chat UI: `/chat`

## Response Format

When a mobile client attempts a restricted operation, they receive:

**Status Code:** `403 Forbidden`

**Response Body:**
```json
{
  "error": "Operation Not Allowed",
  "message": "This operation is restricted in mobile mode. Use desktop client for write operations.",
  "code": "MOBILE_MODE_RESTRICTION",
  "allowedMethods": ["GET", "HEAD", "OPTIONS"],
  "hint": "Mobile devices are configured as read-only clients"
}
```

## System Status

Check if mobile mode is enabled:

```bash
curl http://localhost:3000/api/status
```

Response includes:
```json
{
  "features": {
    "mobileMode": true,
    "lanOnly": false,
    "safeMode": false
  },
  "client": {
    "isMobile": true,
    "restrictions": [
      "write_operations_disabled",
      "agent_execution_disabled",
      "admin_access_disabled"
    ]
  }
}
```

## Use Cases

### Scenario 1: iPhone as Monitor

**Setup:**
```bash
MOBILE_MODE=true
LAN_ONLY=true
```

**Usage:**
- Use iPhone to check system status
- View running agents
- Monitor audit logs
- Read knowledge base
- No ability to start/stop agents or modify system

### Scenario 2: Desktop Admin, Mobile Viewer

**Setup:**
```bash
MOBILE_MODE=true  # Enforced globally
LAN_ONLY=true
```

**Result:**
- Desktop browser: Full access (detected as non-mobile)
- iPhone/iPad: Read-only access
- Same admin token, different capabilities based on client

### Scenario 3: Development Testing

**Setup:**
```bash
MOBILE_MODE=false  # Disabled during development
```

**Result:**
- All clients have full access
- Useful for testing mobile UI with full functionality

## Implementation Details

### Middleware (`src/middleware/mobileMode.js`)

The mobile mode middleware:
1. Checks if `MOBILE_MODE` is enabled
2. Detects if request is from mobile device (User-Agent)
3. Checks if operation is restricted
4. Blocks restricted operations with 403
5. Logs blocked attempts to audit log

### Audit Logging

All blocked mobile operations are logged:

```json
{
  "timestamp": "2026-02-10T22:15:00.000Z",
  "event": "access_denied",
  "resource": "/api/agents/start/agent-auto",
  "action": "POST",
  "reason": "Mobile mode restriction",
  "user": "mobile-client",
  "ip": "192.168.1.100",
  "correlationId": "uuid"
}
```

## Security Considerations

### Why Mobile Mode?

1. **Reduced Attack Surface**: Mobile devices more easily lost/stolen
2. **Accidental Actions**: Touch interfaces prone to accidental taps
3. **Network Security**: Mobile devices may connect to untrusted networks
4. **Principle of Least Privilege**: Mobile clients only need read access

### Limitations

- **User-Agent Spoofing**: Can be bypassed by modifying User-Agent
- **Not Authentication**: Mobile mode is not a replacement for proper auth
- **Defense in Depth**: Use with LAN_ONLY and strong admin token

### Recommendations

**For Production:**
```bash
# Comprehensive mobile security
MOBILE_MODE=true
LAN_ONLY=true
ADMIN_TOKEN=<strong-16+-char-token>
EGRESS_POLICY=deny_by_default
```

## Testing

### Test Mobile Detection

```bash
# Simulate iPhone request
curl -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)" \
  http://localhost:3000/api/status
```

Response will show:
```json
{
  "client": {
    "isMobile": true,
    "restrictions": ["..."]
  }
}
```

### Test Mobile Restriction

```bash
# Try to start agent from "iPhone"
curl -X POST -H "User-Agent: Mozilla/5.0 (iPhone)" \
  http://localhost:3000/api/agents/start/agent-auto
```

Expected: `403 Forbidden` with mobile mode restriction message

### Test Desktop Access

```bash
# Desktop user agent (no User-Agent = desktop)
curl -X POST http://localhost:3000/api/agents/start/agent-auto
```

Expected: Normal agent start (or other validation errors)

## Troubleshooting

### Issue: Mobile client getting unexpected 403 errors

**Check:**
1. Is `MOBILE_MODE=true`? 
2. Is client User-Agent matching mobile patterns?
3. Is endpoint in restricted list?

**Debug:**
```bash
curl -v http://localhost:3000/api/status
# Check client.isMobile in response
```

### Issue: Desktop client being treated as mobile

**Cause:** Desktop User-Agent contains "Mobile" keyword

**Solution:**
- Check actual User-Agent string
- Adjust detection patterns if needed
- Use different browser

### Issue: Want to temporarily disable mobile mode

```bash
# .env
MOBILE_MODE=false
# Restart server
```

## FAQ

**Q: Can I disable mobile mode for specific users?**  
A: Not currently. Mobile mode is global. Use separate instances for different access levels.

**Q: What about tablets?**  
A: iPads detected as mobile. Restrict to read-only by default.

**Q: Can mobile clients use chat?**  
A: Yes, if chat is read-only or uses GET endpoints. Write operations blocked.

**Q: How do I allow mobile admin access?**  
A: Disable MOBILE_MODE or use desktop browser for admin tasks.

## Version History

- **v1.0.0** (2026-02-10): Initial mobile mode implementation
  - User-Agent detection
  - Write operation restrictions
  - Audit logging
  - Status API integration
