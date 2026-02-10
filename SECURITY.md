# BSM Security Policy

> **Last Updated**: 2026-02-10  
> **Version**: 1.0.0  
> **Status**: Active

## Overview

This document defines the security policies, guidelines, and requirements for the BSM (Business Service Management) platform. All code changes, pull requests, and deployments must comply with these security standards.

## Security Principles

### 1. Defense in Depth
- Multiple layers of security controls
- No single point of failure
- Assume breach mentality

### 2. Least Privilege
- Minimal permissions by default
- Explicit permission grants only
- Regular permission audits

### 3. Secure by Default
- Safe defaults in all configurations
- Explicit opt-in for risky operations
- Clear security warnings

## Security Requirements

### File System Security

#### ❌ PROHIBITED: Filesystem Wildcards
- **Never** use `**` (recursive glob) patterns in production code
- **Never** use `*` wildcards without explicit path validation
- **Always** use explicit, validated file paths

```javascript
// ❌ FORBIDDEN
const files = await fs.readdir('**/*.yaml');

// ✅ ALLOWED
const agentsDir = path.join(process.cwd(), 'data', 'agents');
const files = await fs.readdir(agentsDir);
```

#### File Access Validation
- All file operations must validate paths
- Prevent directory traversal attacks
- Use `fsSafe.js` utility for file operations
- Log all file access attempts

### Network Security

#### Default Deny Network Egress
- All outbound network access is **DENIED** by default
- Explicit allowlist for external services
- Document all egress requirements

#### Allowed External Services
1. **OpenAI API** (`api.openai.com`)
   - Purpose: LLM inference
   - Authentication: API key
   - Encryption: TLS 1.2+

2. **GitHub API** (`api.github.com`)
   - Purpose: Repository operations
   - Authentication: GitHub token
   - Encryption: TLS 1.2+

3. **Cloudflare API** (if enabled)
   - Purpose: DNS/CDN management
   - Authentication: API token
   - Encryption: TLS 1.2+

#### Network Security Controls
```javascript
// All fetch calls must be justified
const allowedHosts = [
  'api.openai.com',
  'api.github.com'
];

// Validate before making requests
if (!allowedHosts.includes(new URL(url).hostname)) {
  throw new Error('Unauthorized network access');
}
```

### Secrets Management

#### Environment-Scoped Secrets
- **Development**: Use `.env` file (never committed)
- **Production**: Use platform secrets management (Render.com, GitHub Secrets)
- **CI/CD**: Use GitHub Secrets only

#### Secret Naming Convention
```
# Development
OPENAI_BSM_KEY_DEV=sk-dev-...

# Production
OPENAI_BSM_KEY=sk-prod-...
```

#### Secret Handling Rules
1. ✅ **DO**: Load from environment variables only
2. ✅ **DO**: Validate secrets on startup
3. ✅ **DO**: Use timing-safe comparison for tokens
4. ❌ **NEVER**: Commit secrets to repository
5. ❌ **NEVER**: Log secret values (even partially)
6. ❌ **NEVER**: Return secrets in API responses
7. ❌ **NEVER**: Store secrets in database without encryption

```javascript
// ✅ CORRECT: Safe secret handling
const apiKey = process.env.OPENAI_BSM_KEY;
if (!apiKey) {
  throw new Error('API key not configured');
}
logger.info('API key loaded successfully'); // No value logged

// ❌ WRONG: Never log secrets
logger.info(`API key: ${apiKey}`); // FORBIDDEN
```

### Authentication & Authorization

#### Admin Token Security
- **Minimum Length**: 16 characters in production
- **Validation**: Must be set before server starts
- **Comparison**: Always use timing-safe comparison
- **Headers**: Support multiple auth methods

```javascript
// Admin token validation locations:
// 1. Header: x-admin-token
// 2. Basic Auth: admin:{token}
// 3. Query Param: ?token={token} (deprecated, avoid in production)
```

#### Admin Endpoints
All admin endpoints require `ADMIN_TOKEN`:
- `GET /api/admin/*`
- `POST /api/admin/*`
- `PUT /api/admin/*`
- `DELETE /api/admin/*`

#### System Endpoints
System-critical endpoints require additional validation:
- Must check `ADMIN_TOKEN`
- Must log all access attempts
- Must rate-limit aggressively (10 req/hour)

### Agent Security

#### Action Allowlist
Agents can only perform explicitly allowed actions:

```javascript
const allowedActions = new Set([
  "create_file",
  "review_pr",
  "request_changes",
  "approve_pr",
  "create_review_comment",
  "generate_fix_suggestion",
  "scan_vulnerabilities",
  "block_pr",
  "alert_security_team",
  "generate_security_report",
  "suggest_fixes",
  "auto_merge",
  "manual_review_request",
  "run_tests",
  "deploy_staging",
  "rollback_merge",
  "validate_structure",
  "cleanup_stale_prs",
  "archive_old_issues",
  "optimize_database",
  "generate_health_report",
  "audit_configuration",
  "validate_guards",
  "check_api_routes",
  "verify_ui_config",
  "generate_audit_report"
]);
```

#### Adding New Actions
1. Document the action purpose and risk level
2. Add to `allowedActions` in `scripts/validate.js`
3. Get security team approval
4. Update this document

#### Agent Privilege Escalation Prevention
- Agents cannot modify their own permissions
- Agents cannot create or modify other agents
- Agents cannot access file system outside data directories
- All agent actions are logged

### Input Validation

#### Request Validation
- **Maximum payload size**: 1MB
- **Maximum agent input length**: 4000 characters (configurable)
- **Required fields**: Always validate presence and type
- **String sanitization**: Remove control characters

```javascript
// Example validation
function validateAgentInput(input) {
  if (!input || typeof input !== 'string') {
    throw new AppError('Invalid input', 400, 'INVALID_INPUT');
  }
  
  if (input.length > MAX_AGENT_INPUT_LENGTH) {
    throw new AppError('Input too long', 400, 'INPUT_TOO_LONG');
  }
  
  return input.trim();
}
```

#### Prompt Injection Prevention
- Validate and sanitize all LLM inputs
- Use structured prompts with clear delimiters
- Never directly interpolate user input into system prompts
- Implement content filtering

### Rate Limiting

#### API Rate Limits
- **Default**: 100 requests per 15 minutes per IP
- **Admin endpoints**: 50 requests per 15 minutes per token
- **Agent execution**: 10 concurrent executions per user
- **System endpoints**: 10 requests per hour per token

#### Configuration
```javascript
// In src/app.js
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Content Security

#### CORS Policy
- **Default**: Deny all origins
- **Allowed**: Explicitly configured in `CORS_ORIGINS` environment variable
- **Credentials**: Only for authenticated requests

```javascript
// Allowed origins must be explicitly configured
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [];
```

#### Security Headers (Helmet)
- `Content-Security-Policy`: Restrict resource loading
- `X-Frame-Options`: DENY (prevent clickjacking)
- `X-Content-Type-Options`: nosniff
- `Strict-Transport-Security`: Force HTTPS
- `X-XSS-Protection`: Enable browser XSS protection

## Audit & Logging

### Security Event Logging

All security-relevant events MUST be logged:

1. **Authentication Events**
   - Login attempts (success/failure)
   - Token validation failures
   - Session creation/destruction

2. **Authorization Events**
   - Permission checks
   - Access denials
   - Privilege escalation attempts

3. **Data Access Events**
   - Admin endpoint access
   - System configuration changes
   - Agent execution

4. **Network Events**
   - Outbound connections
   - Failed connection attempts
   - Rate limit violations

### Log Format
```json
{
  "timestamp": "2026-02-10T22:00:00.000Z",
  "level": "info",
  "event": "admin_access",
  "correlationId": "uuid-v4",
  "ip": "192.168.1.1",
  "endpoint": "/api/admin/agents",
  "method": "GET",
  "user": "admin",
  "result": "success"
}
```

### Sensitive Data in Logs
❌ **NEVER LOG**:
- API keys or tokens (full or partial)
- Passwords or credentials
- Personal identifiable information (PII)
- Internal system paths (in production)

✅ **SAFE TO LOG**:
- Event types and outcomes
- IP addresses (for security monitoring)
- Correlation IDs
- Error codes (not full messages with sensitive data)

## Vulnerability Management

### Dependency Scanning
- Run `npm audit` before every deployment
- Fix critical and high vulnerabilities immediately
- Document accepted risks for moderate/low vulnerabilities

### Secret Scanning
- Gitleaks configured in `.gitleaks.toml`
- Runs on every commit in CI/CD
- Blocks commits with exposed secrets

### Code Scanning
- CodeQL analysis on every PR
- JavaScript security rules enabled
- Manual security review for high-risk changes

## Incident Response

### Security Incident Classification

**P0 - Critical**
- Active exploitation
- Data breach
- Privilege escalation in production

**P1 - High**
- Exposed secrets
- Authentication bypass
- Critical vulnerability in dependencies

**P2 - Medium**
- Moderate security issues
- Configuration weaknesses
- Non-critical vulnerabilities

**P3 - Low**
- Minor security improvements
- Documentation gaps
- Informational findings

### Response Steps
1. **Contain**: Isolate affected systems
2. **Assess**: Determine scope and impact
3. **Remediate**: Apply fixes
4. **Verify**: Test remediation
5. **Document**: Write incident report
6. **Learn**: Update security controls

## Security Review Requirements

### For All PRs
- [ ] No secrets committed
- [ ] No filesystem wildcards (`**`)
- [ ] Network egress is justified
- [ ] Input validation implemented
- [ ] Error handling doesn't leak sensitive data

### For Security-Sensitive PRs
- [ ] Security team review required
- [ ] Threat model documented
- [ ] Penetration testing completed
- [ ] Security controls validated
- [ ] Incident response plan updated

### Definition: Security-Sensitive Changes
- Authentication or authorization logic
- Cryptography implementation
- Network security controls
- Secrets management
- Admin/system endpoints
- Agent permission changes

## Compliance

### Data Protection
- No personal data stored without encryption
- Data retention policies enforced
- Right to erasure implemented (where applicable)
- Data processing documented

### Regulatory Compliance
- GDPR considerations for EU users
- Data residency requirements documented
- Audit trails for compliance reporting

## Security Contacts

### Reporting Security Issues
- **Email**: security@lexdo.uk (if available)
- **GitHub**: Private security advisory
- **Response Time**: 24 hours for critical, 72 hours for others

### Security Team
- Primary: Repository maintainers
- Escalation: GitHub Security Team

## Updates and Maintenance

This document is reviewed and updated:
- After any security incident
- Quarterly security review
- When new features introduce security implications
- When security best practices evolve

---

**Document Owner**: Security Team  
**Approval**: Required for any changes  
**Next Review**: 2026-05-10
