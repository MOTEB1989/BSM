# BSM Agent Context Governance

## Overview

BSM implements a comprehensive governance system for controlling agent execution contexts. This ensures agents only run in appropriate environments (mobile, API, CI/CD, etc.) with proper safety controls.

## Governance Architecture

### 1. Registry System

All agents are registered in `agents/registry.yaml` with complete governance metadata:

```yaml
agents:
  - id: agent-name
    name: Human Readable Name
    category: conversational | infra | system | security | audit
    contexts:
      allowed:
        - chat      # Web chat interface
        - api       # Direct API calls
        - ci        # CI/CD pipelines
        - mobile    # Telegram/mobile interfaces
        - github    # GitHub Actions
    safety:
      mode: safe | restricted | destructive
      requires_approval: true/false
    risk:
      level: low | medium | high | critical
      rationale: "Explanation of risk assessment"
    approval:
      required: true/false
      type: none | manual | automated
      approvers: ["admin", "architect"]
    startup:
      auto_start: false  # Always false per governance
      allowed_profiles: ["development", "staging", "production"]
    healthcheck:
      endpoint: /api/agents/{agent-id}/health
      interval_seconds: 60
    expose:
      selectable: true/false
      internal_only: true/false
```

### 2. Context Enforcement

#### Mobile Context (Telegram)
**Guard:** `src/guards/telegramGuard.js`

**Rules:**
- ✅ Only agents with `mobile` in `contexts.allowed`
- ❌ Blocked: `destructive` safety mode
- ❌ Blocked: Agents requiring approval (unless admin)
- ❌ Blocked: High/critical risk (unless admin)

**Allowed Agents:**
- `governance-agent` - Governance advisory
- `legal-agent` - Legal advisory
- `bsu-audit-agent` - Safe auditing

**Telegram Commands:**
- `/agents` - List available agents
- `/run <agent-id>` - Execute agent (admin only)
- `/status` - System status (admin only)

#### API Context
**Endpoint:** `GET /api/agents?mode=<context>`

**Filtering:**
- `?mode=mobile` - Returns mobile-compatible agents
- `?mode=ci` - Returns CI/CD compatible agents
- `?mode=api` - Returns API-compatible agents
- No mode - Returns all agents with governance info

**Response Format:**
```json
{
  "count": 3,
  "agents": [{
    "id": "agent-id",
    "name": "Agent Name",
    "contexts": {
      "allowed": ["chat", "api", "mobile"]
    },
    "safety": {
      "mode": "safe",
      "requires_approval": false
    },
    "risk": {
      "level": "low",
      "rationale": "..."
    },
    "approval": {
      "required": false,
      "type": "none",
      "approvers": []
    },
    "expose": {
      "selectable": true,
      "internal_only": false
    }
  }],
  "mode": "mobile",
  "filtered": true,
  "correlationId": "..."
}
```

### 3. Validation System

#### Registry Validation
**Script:** `npm run validate:registry`

**Checks:**
- ✅ All required fields present
- ✅ Valid enum values (categories, contexts, risk levels)
- ✅ ID format (lowercase alphanumeric with hyphens)
- ✅ Unique agent IDs
- ✅ auto_start = false (security requirement)
- ✅ Healthcheck endpoint matches pattern
- ✅ BSM Governance Rules:
  - Destructive agents CANNOT have mobile context
  - High/critical risk requires approval
  - Internal-only agents not selectable

#### Agent Validation
**Script:** `npm run validate`

**Checks:**
- ✅ Agent YAML files exist in data/agents/
- ✅ Agent IDs match registry entries
- ✅ Allowed actions are whitelisted
- ✅ Registry governance fields complete

## Current Agent Context Matrix

| Agent ID | Mobile | API | CI | GitHub | Safety | Risk |
|----------|--------|-----|----|----- ---|--------|------|
| governance-agent | ✅ | ✅ | ❌ | ❌ | safe | low |
| legal-agent | ✅ | ✅ | ❌ | ❌ | safe | low |
| bsu-audit-agent | ✅ | ✅ | ✅ | ❌ | safe | low |
| governance-review-agent | ❌ | ✅ | ✅ | ✅ | safe | medium |
| code-review-agent | ❌ | ✅ | ✅ | ✅ | safe | low |
| security-agent | ❌ | ✅ | ✅ | ✅ | safe | medium |
| pr-merge-agent | ❌ | ❌ | ✅ | ✅ | restricted | medium |
| integrity-agent | ❌ | ✅ | ✅ | ❌ | restricted | medium |
| my-agent | ❌ | ✅ | ✅ | ❌ | restricted | medium |

## Usage Examples

### 1. Telegram Bot Usage

```bash
# List available agents
/agents

# Response:
📱 Available Agents:

• governance-agent - Governance Agent (low risk)
• legal-agent - Legal Analysis Agent (low risk)
• bsu-audit-agent - BSU Audit Agent (low risk)

Use /run <agent-id>

# Run an agent (admin only)
/run governance-agent
```

### 2. API Usage

```bash
# Get all mobile-compatible agents
curl "http://localhost:3000/api/agents?mode=mobile"

# Get all CI/CD-compatible agents
curl "http://localhost:3000/api/agents?mode=ci"

# Get all agents with governance info
curl "http://localhost:3000/api/agents"
```

### 3. Adding a New Agent

1. **Create agent YAML** in `data/agents/`:
```yaml
id: new-agent
name: New Agent
role: Agent role
contexts:
  allowed:
    - api
    - mobile
```

2. **Register in registry.yaml**:
```yaml
- id: new-agent
  name: New Agent
  category: conversational
  contexts:
    allowed:
      - api
      - mobile
  safety:
    mode: safe
    requires_approval: false
  risk:
    level: low
    rationale: "Safe operations only"
  approval:
    required: false
    type: none
    approvers: []
  startup:
    auto_start: false
    allowed_profiles: ["development", "staging", "production"]
  healthcheck:
    endpoint: /api/agents/new-agent/health
    interval_seconds: 60
  expose:
    selectable: true
    internal_only: false
```

3. **Validate**:
```bash
npm run validate:registry
npm run validate
```

4. **Test**:
```bash
# Check it appears in mobile context
curl "http://localhost:3000/api/agents?mode=mobile"

# Try running in Telegram
/agents  # Should see new-agent
```

## Governance Rules

### Hard Rules (Enforced by Validation)

1. **No Auto-Start**: `auto_start` must always be `false`
2. **No Destructive Mobile**: Agents with `safety.mode: destructive` CANNOT have `mobile` in contexts
3. **High Risk Requires Approval**: Agents with `risk.level: high|critical` must have `approval.required: true`
4. **Internal-Only Not Selectable**: Agents with `internal_only: true` must have `selectable: false`
5. **Unique IDs**: Agent IDs must be unique across registry
6. **Valid Healthcheck**: Endpoint must match `/api/agents/{id}/health`

### Soft Rules (Best Practices)

1. Conversational agents should allow `mobile` context
2. CI/CD agents should be `internal_only: true`
3. System-modifying agents should require `approval`
4. Production-impacting agents should have `risk.level: medium` or higher

## Security Considerations

1. **Defense in Depth**: Multiple layers (registry, guard, API filter)
2. **Deny by Default**: Agents not in registry are blocked
3. **Audit Trail**: All guard blocks are logged with reasoning
4. **Admin Bypass**: Admins can access higher-risk agents in Telegram
5. **Context Isolation**: Mobile context is most restricted
6. **Backward Compatible**: System works without registry (permissive mode)

## Monitoring and Auditing

All context enforcement is logged:

```json
{
  "level": "warn",
  "msg": "Agent blocked: not allowed in mobile context",
  "agentId": "pr-merge-agent",
  "contexts": ["ci", "github"],
  "isAdmin": true
}
```

Access denials are audited:
```json
{
  "eventType": "access_denied",
  "resource": "telegram_agent",
  "action": "run_agent",
  "reason": "Agent not allowed in mobile context",
  "user": "telegram:12345",
  "correlationId": "..."
}
```

## Troubleshooting

### Agent Not Appearing in /agents
- Check registry.yaml - agent must have `mobile` in `contexts.allowed`
- Check `safety.mode` - cannot be `destructive`
- Check `approval.required` - if true, only admins see it
- Validate: `npm run validate:registry`

### Agent Blocked in Telegram
- Check logs for specific block reason
- Verify agent exists in registry.yaml
- Confirm `mobile` context is allowed
- Check if admin approval required

### API Filter Not Working
- Clear registry cache (1 minute TTL)
- Check agent ID matches between data/agents/ and registry.yaml
- Verify registry.yaml syntax: `npm run validate:registry`
- Check server logs for registry load errors

## Future Enhancements

- [ ] Context-based rate limiting
- [ ] Time-based context restrictions (e.g., mobile only during business hours)
- [ ] User-role based context filtering
- [ ] Dynamic context assignment via admin API
- [ ] Context compliance reports
