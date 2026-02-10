# BSM Mobile Mode Documentation

> **Last Updated**: 2026-02-10  
> **Version**: 1.0.0  
> **Status**: Active

## Overview

Mobile Mode is a restricted operational mode for the BSM platform that limits functionality when accessed from mobile devices or when explicitly enabled for safety. This mode enforces strict constraints to prevent destructive or irreversible actions that require desktop oversight.

## Purpose

Mobile Mode exists to:
1. **Prevent Accidental Actions**: Protect against unintended destructive operations on smaller screens
2. **Ensure Safety**: Require desktop verification for high-risk operations
3. **Compliance**: Meet governance requirements for critical changes
4. **User Experience**: Provide read-only, safe browsing on mobile devices

## Activation

### Automatic Activation
Mobile Mode is automatically enabled when:
- User agent indicates mobile device (iOS, Android)
- Screen width < 768px (tablet/phone)
- Network connection is cellular/metered

### Manual Activation
Users or administrators can force Mobile Mode:
```bash
# Environment variable
MOBILE_MODE=true

# Query parameter
?mobileMode=true

# Header
X-Mobile-Mode: true
```

### Status Check
Check current mode via API:
```bash
GET /api/status
```

Response:
```json
{
  "mode": "mobile",
  "timestamp": "2026-02-10T22:00:00.000Z",
  "restrictions": ["no_destructive_actions", "read_only_agents", "no_system_changes"]
}
```

## Restrictions

### 🚫 Prohibited Actions in Mobile Mode

#### 1. Destructive Operations
Mobile Mode **BLOCKS** all destructive or irreversible actions:

- ❌ **File Deletion**: Cannot delete files or directories
- ❌ **Database Drops**: Cannot drop tables or databases
- ❌ **User Deletion**: Cannot remove user accounts
- ❌ **PR Merging**: Cannot merge pull requests
- ❌ **Deployment**: Cannot trigger deployments to production
- ❌ **Secret Rotation**: Cannot rotate API keys or secrets
- ❌ **Agent Modification**: Cannot create, update, or delete agents
- ❌ **System Configuration**: Cannot modify system settings

#### 2. Write Operations
Limited write capabilities:

- ❌ **Agent Execution**: Read-only agent results only
- ❌ **File Creation**: Cannot create new files
- ❌ **Knowledge Base Updates**: Cannot add/modify knowledge documents
- ⚠️ **PR Comments**: Allowed but with mobile indicator
- ⚠️ **Issue Creation**: Allowed with mobile tag

#### 3. System Operations
No system-level changes:

- ❌ **Server Restart**: Cannot restart services
- ❌ **Cache Clearing**: Cannot clear system caches
- ❌ **Log Rotation**: Cannot trigger log rotation
- ❌ **Health Checks**: Cannot modify health check configuration

#### 4. Admin Functions
Admin panel is view-only:

- ✅ **View Agents**: Can list and view agent configurations
- ✅ **View Logs**: Can read audit logs
- ✅ **View Stats**: Can see system statistics
- ❌ **Modify Anything**: Cannot make any changes

### ✅ Allowed Actions in Mobile Mode

#### Read Operations
All read operations are fully supported:

- ✅ **List Agents**: View all available agents
- ✅ **View Documentation**: Access all docs
- ✅ **Read Knowledge Base**: Browse knowledge documents
- ✅ **View PRs**: Read pull request details
- ✅ **View Issues**: Browse issues and comments
- ✅ **Check Status**: View system health and status
- ✅ **View Logs**: Read audit logs (sanitized)

#### Safe Interactions
Limited safe operations:

- ✅ **Chat Interface**: Read-only chat with agents (no actions)
- ✅ **Search**: Search code, issues, and documentation
- ✅ **Analytics**: View reports and dashboards
- ✅ **Notifications**: Receive system notifications

## Implementation

### API Endpoints

#### Status Endpoint
The `/api/status` endpoint behavior in Mobile Mode:

```javascript
// GET /api/status
{
  "status": "ok",
  "mode": "mobile",
  "uptime": 3600,
  "restrictions": {
    "destructiveActions": false,
    "agentExecution": false,
    "systemChanges": false,
    "adminWrites": false
  },
  "allowedActions": [
    "read",
    "search",
    "view_logs",
    "view_agents"
  ]
}
```

#### Modified Endpoints

**Agent Execution** (`POST /api/agents/run`):
```javascript
// Mobile Mode: Returns cached/example results only
if (isMobileMode(req)) {
  return res.status(403).json({
    error: 'Agent execution not allowed in mobile mode',
    code: 'MOBILE_MODE_RESTRICTION',
    suggestion: 'Please use desktop to execute agents'
  });
}
```

**Admin Endpoints** (`/api/admin/*`):
```javascript
// Mobile Mode: Read-only
if (isMobileMode(req) && req.method !== 'GET') {
  return res.status(403).json({
    error: 'Write operations not allowed in mobile mode',
    code: 'MOBILE_MODE_WRITE_DENIED',
    suggestion: 'Switch to desktop for admin modifications'
  });
}
```

### Middleware

Mobile Mode detection middleware:

```javascript
// src/middleware/mobileMode.js
export function mobileMode(req, res, next) {
  const isMobile = 
    req.headers['x-mobile-mode'] === 'true' ||
    /Mobile|Android|iPhone|iPad/.test(req.headers['user-agent']) ||
    process.env.MOBILE_MODE === 'true';
  
  req.mobileMode = isMobile;
  
  if (isMobile) {
    res.setHeader('X-Mobile-Mode', 'true');
    res.setHeader('X-Restrictions', 'destructive-actions-blocked');
  }
  
  next();
}
```

### Route Protection

Protect routes with Mobile Mode checks:

```javascript
// Destructive endpoints require desktop
router.post('/api/agents/run', 
  mobileMode,
  requireDesktop, // Blocks if mobile
  runAgentController
);

// Safe endpoints allow mobile
router.get('/api/agents', 
  mobileMode, // Detects but allows
  listAgentsController
);
```

## UI Behavior

### Mobile Interface

**Visual Indicators**:
- 📱 Mobile Mode badge in header
- 🔒 Locked icon on disabled actions
- ⚠️ Warning banner explaining restrictions

**Action Buttons**:
- Destructive actions: Grayed out with tooltip
- Write operations: Show "Desktop Required" message
- Read operations: Fully functional

### Desktop Interface

**Mobile Mode Toggle** (Admin only):
```html
<button onclick="toggleMobileMode()">
  🔒 Enable Mobile Mode (Safe Mode)
</button>
```

Used for testing or voluntary restriction during risky operations.

## Security Implications

### Protection Against
1. **Accidental Deletions**: Prevents tap errors on mobile
2. **Unauthorized Access**: Limits damage from compromised mobile devices
3. **Network Issues**: Prevents partial writes on unstable connections
4. **Screen Size Issues**: Avoids misclicks on small screens

### Additional Security
- All Mobile Mode restrictions are logged
- Attempts to bypass are flagged and audited
- Cannot disable Mobile Mode via API (only via desktop web UI)

## Configuration

### Environment Variables

```bash
# Force Mobile Mode globally
MOBILE_MODE=true

# Enable Mobile Mode for specific IPs
MOBILE_MODE_IPS=192.168.1.100,192.168.1.101

# Mobile Mode restrictions level
MOBILE_MODE_LEVEL=strict  # strict | moderate | lenient
```

### Restriction Levels

**Strict** (Default):
- No destructive actions
- No agent execution
- No system changes
- View-only admin

**Moderate**:
- No destructive actions
- Agent execution allowed (read-only outputs)
- No system changes
- Limited admin writes (logs, comments)

**Lenient**:
- Warning on destructive actions
- Full agent execution
- System changes with confirmation
- Full admin access with 2FA

## Testing

### Manual Testing

Test Mobile Mode locally:
```bash
# Enable Mobile Mode
export MOBILE_MODE=true
npm start

# Test API with mobile header
curl -H "X-Mobile-Mode: true" http://localhost:3000/api/status
```

### Automated Testing

```javascript
// Test mobile mode restrictions
describe('Mobile Mode', () => {
  it('blocks destructive actions', async () => {
    const res = await request(app)
      .post('/api/agents/run')
      .set('X-Mobile-Mode', 'true')
      .send({ agentId: 'test', input: 'delete file' });
    
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('MOBILE_MODE_RESTRICTION');
  });
  
  it('allows read operations', async () => {
    const res = await request(app)
      .get('/api/agents')
      .set('X-Mobile-Mode', 'true');
    
    expect(res.status).toBe(200);
  });
});
```

## Governance Integration

### PR Review Checklist

Mobile Mode compliance is part of PR review:

- [ ] Mobile Mode restrictions enforced for new endpoints
- [ ] `/api/status` behavior unchanged or explicitly documented
- [ ] No new exposure of destructive actions to mobile
- [ ] UI indicates Mobile Mode status clearly
- [ ] Audit logs include mobile mode indicator

### Change Requirements

When modifying code affecting Mobile Mode:

1. **Document Changes**: Update this file
2. **Security Review**: Required for restriction relaxation
3. **Test Coverage**: Add mobile mode tests
4. **Audit Logging**: Log all mobile mode interactions
5. **User Communication**: Notify users of behavior changes

## Troubleshooting

### Common Issues

**Issue**: Mobile Mode enabled but shouldn't be
```javascript
// Check detection logic
console.log('User-Agent:', req.headers['user-agent']);
console.log('Mobile Mode:', req.mobileMode);
```

**Solution**: Override via header or query param
```bash
curl -H "X-Mobile-Mode: false" http://localhost:3000/api/status?mobileMode=false
```

**Issue**: Desktop UI showing Mobile Mode banner
```javascript
// Clear mobile mode flag
localStorage.removeItem('mobileMode');
location.reload();
```

**Issue**: Actions blocked in legitimate mobile scenario
```plaintext
Solution: Use desktop for critical operations or request temporary override from admin
```

## Future Enhancements

### Planned Features
- [ ] Progressive Web App (PWA) with offline mode
- [ ] Biometric authentication for mobile
- [ ] Limited action approval via mobile (with 2FA)
- [ ] Mobile-specific dashboard
- [ ] Tablet mode (between mobile and desktop)

### Under Consideration
- Temporary elevation for trusted devices
- Action queuing (save for desktop execution)
- Mobile command preview (dry-run)

---

**Document Owner**: UX & Security Teams  
**Approval Required**: For any restriction changes  
**Next Review**: 2026-05-10
