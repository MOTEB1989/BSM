# BSM Security Guide

## Overview

BSM (Business Service Management) is designed as a **private, local-only system** with production-grade security controls. This document outlines security practices, hardening measures, and operational guidelines.

## Security Architecture

### Core Principles

1. **Local-First**: System operates exclusively on local network
2. **No Cloud Dependencies**: All processing and storage local
3. **Defense in Depth**: Multiple layers of security controls
4. **Least Privilege**: Minimal permissions by default
5. **Audit Everything**: Comprehensive audit logging

### Threat Model

**In Scope:**
- Unauthorized local network access
- Malicious agent execution
- Configuration tampering
- Secrets exposure
- Mobile device compromise

**Out of Scope:**
- Internet-based attacks (system is LAN-only)
- Physical access attacks
- Supply chain attacks

## Security Features

### 1. Network Security

#### LAN-Only Mode
```bash
LAN_ONLY=true
```

Restricts access to local network addresses only:
- 10.0.0.0/8
- 172.16.0.0/12
- 192.168.0.0/16
- 127.0.0.1 (localhost)
- ::1 (IPv6 localhost)

Any non-LAN request is automatically blocked with 403 Forbidden.

#### Egress Control
```bash
EGRESS_POLICY=deny_by_default
EGRESS_ALLOWED_HOSTS=api.openai.com,github.com
```

Controls outbound network access:
- `deny_by_default`: Only allowed hosts can be accessed
- `allow_all`: All outbound connections allowed (dev only)
- `deny_all`: No outbound connections (max security)

### 2. Agent Security

#### Governance Controls

Every agent in `agents/registry.yaml` has:

- **Risk Level**: `low`, `medium`, `high`, `critical`
- **Approval Requirements**: Manual or automated approval
- **Allowed Profiles**: Which environments can run the agent
- **Context Restrictions**: Where agent can operate
- **Auto-start Disabled**: All agents must be manually started

#### Agent Control

Agents are explicitly controlled via API:

```bash
# Start agent (with approval if required)
POST /api/agents/start/:agentId

# Stop agent
POST /api/agents/stop/:agentId

# Check agent status
GET /api/agents/status
```

#### Safe Mode
```bash
SAFE_MODE=true
```

Disables all external API calls and system-level operations. Agents requiring external access will fail to start.

### 3. Mobile Security

#### Mobile Mode
```bash
MOBILE_MODE=true
```

iPhone and mobile devices are treated as **read-only clients**:
- GET/HEAD requests allowed
- POST/PUT/DELETE operations blocked
- Agent execution disabled
- Admin access disabled

Mobile mode is automatically detected via User-Agent but can be enforced globally.

### 4. Authentication & Authorization

#### Admin Token
```bash
# Development (insecure)
ADMIN_TOKEN=change-me

# Production (required, minimum 16 characters)
ADMIN_TOKEN=<strong-token-from-secrets-manager>
```

**Production Requirements:**
- Minimum 16 characters
- Cannot be "change-me"
- Store in secrets manager, not .env file
- Rotate regularly

#### Rate Limiting

API endpoints are rate-limited:
```bash
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100           # 100 requests per window
```

### 5. Audit Logging

All security-critical operations are logged to `logs/audit.log` in append-only mode:

**Logged Events:**
- Authentication attempts
- Agent start/stop operations
- Configuration changes
- Security events
- Access denials
- Emergency actions

**Audit Log Format (JSONL):**
```json
{"timestamp":"2026-02-10T22:04:57.586Z","event":"agent","action":"start","agentId":"bsu-runner","success":true,"user":"system","ip":"::1"}
```

### 6. Emergency Controls

#### Kill-Switch
```bash
POST /api/emergency/shutdown
{
  "token": "admin-token",
  "reason": "Security incident"
}
```

Immediately:
1. Stops all running agents
2. Logs emergency action to audit log
3. Initiates graceful shutdown (5 second delay)

## Secret Management

### Development vs Production

**Development:**
- Secrets in `.env` file (git-ignored)
- Weak tokens acceptable for testing
- Auto-start may be enabled

**Production:**
- Secrets from environment variables ONLY
- Never commit production secrets
- Use secrets manager (HashiCorp Vault, AWS Secrets Manager, etc.)
- Strong tokens (16+ characters)
- All auto-start disabled

### Secret Separation

```bash
# Development
OPENAI_API_KEY=sk-dev-xxx

# Production (from secrets manager)
OPENAI_API_KEY=<from-secrets-manager>
```

### Secret Validation

Server validates on startup:
- Admin token presence in production
- Token length (16+ characters)
- No default values ("change-me")

## Hardening Checklist

### Pre-Production

- [ ] `LAN_ONLY=true`
- [ ] `MOBILE_MODE=true` (if using mobile clients)
- [ ] `SAFE_MODE=true` (if no external APIs needed)
- [ ] `EGRESS_POLICY=deny_by_default`
- [ ] Strong admin token (16+ characters)
- [ ] Secrets from environment, not files
- [ ] Registry validated on startup
- [ ] All agents have `auto_start: false`
- [ ] Audit logging enabled
- [ ] Rate limiting configured

### Production

- [ ] NODE_ENV=production
- [ ] All feature flags reviewed
- [ ] Secrets rotated
- [ ] Audit logs monitored
- [ ] Emergency procedures documented
- [ ] Backup and recovery tested
- [ ] Network isolated (no internet access)
- [ ] Physical security for server

## Incident Response

### Security Event Detection

Monitor `logs/audit.log` for:
- Failed authentication attempts
- Unauthorized agent starts
- Access denials
- Emergency shutdowns

### Response Procedures

1. **Minor Incident** (Failed auth, access denial)
   - Review audit logs
   - Identify source IP
   - Block if malicious

2. **Major Incident** (Unauthorized agent execution)
   - Trigger emergency shutdown
   - Stop all agents
   - Review audit logs
   - Investigate root cause
   - Rotate secrets

3. **Critical Incident** (System compromise)
   - Emergency kill-switch
   - Disconnect from network
   - Preserve logs for forensics
   - Full system audit
   - Rebuild from known-good backup

## Compliance

### Audit Requirements

- All agent operations logged
- Logs retained for minimum 90 days
- Logs tamper-proof (append-only)
- Regular log review

### Access Control

- Admin access requires token
- Mobile devices read-only
- LAN-only enforcement
- No anonymous access

## Security Updates

### Monitoring

- Check for Node.js security updates: `npm audit`
- Monitor dependency vulnerabilities
- Review GitHub security advisories

### Update Process

1. Review security advisory
2. Test update in development
3. Schedule maintenance window
4. Apply updates
5. Verify functionality
6. Monitor for issues

## Contact

For security issues or questions:
- Review this documentation
- Check audit logs
- Consult system administrator

## Version History

- **v1.0.0** (2026-02-10): Initial security documentation
  - LAN-only mode
  - Mobile mode
  - Agent governance
  - Audit logging
  - Emergency controls
