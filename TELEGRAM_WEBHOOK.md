# Telegram Webhook Integration

> **⚠️ Note**: This is the **ORBIT admin bot** documentation (private, for administrators only).  
> **For public Telegram community channels**, see [COMMUNITY.md](./COMMUNITY.md).

## Overview

The Telegram webhook integration provides a remote control interface for BSM through Telegram. It enforces governance-safe execution by:

- ✅ Routing all execution through the Orchestrator
- ✅ Never executing agents directly
- ✅ Enforcing admin-only access for sensitive commands
- ✅ Enforcing Mobile Mode restrictions automatically
- ✅ Comprehensive audit logging for all actions
- ✅ Webhook secret validation

## Architecture

```
Telegram Bot
    ↓
POST /api/webhooks/telegram
    ↓
src/webhooks/telegram.js
    ↓
Orchestrator (with mobile mode context)
    ↓
Agent Execution (with governance restrictions)
```

## Supported Commands

| Command | Access | Description |
|---------|--------|-------------|
| `/start` | Anyone | Show help message |
| `/help` | Anyone | Show help message |
| `/status` | Admin only | Return system status |
| `/run <agent>` | Admin only | Execute agent via orchestrator |

## Configuration

### Environment Variables

Add these to your `.env` file or set them in your environment:

```bash
# Required for sending messages
TELEGRAM_BOT_TOKEN=<your-bot-token>

# Optional - webhook secret for validation
TELEGRAM_WEBHOOK_SECRET=<random-secret-string>

# Required - comma-separated list of admin chat IDs
ORBIT_ADMIN_CHAT_IDS=12345,67890
```

### Getting Your Chat ID

1. Start a chat with your bot
2. Send any message
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for `"chat":{"id":12345,...}` in the response

## Security Features

### 1. Admin-Only Execution

Only chat IDs listed in `ORBIT_ADMIN_CHAT_IDS` can execute:
- `/run <agent>` - Agent execution
- `/status` - System status

Non-admins receive a "🚫 Unauthorized" message and the attempt is logged in the audit log.

### 2. Mobile Mode Enforcement

All Telegram requests are executed with a mobile mode context:

```javascript
{
  mode: 'mobile',
  actor: `telegram:${chatId}`,
  ip: 'telegram'
}
```

This ensures:
- Destructive agents are blocked
- Infrastructure agents are blocked
- Safe-by-default behavior

### 3. Orchestrator Routing

All agent execution requests are routed through the orchestrator:

```javascript
await orchestrator({
  event: "telegram.agent_run",
  payload: { agentId, source: "telegram", chatId },
  context: { mode: "mobile", ... }
});
```

This ensures:
- Governance policies are applied
- Multiple agents can be coordinated
- Execution is tracked and logged

### 4. Webhook Secret Validation

If `TELEGRAM_WEBHOOK_SECRET` is set, all webhook requests must include:

```
x-telegram-bot-api-secret-token: <your-secret>
```

Requests with invalid or missing secrets are rejected with 403 Forbidden.

### 5. Audit Logging

All actions are logged to `logs/audit.log` in JSONL format:

```json
{
  "timestamp": "2026-02-11T00:25:20.590Z",
  "event": "access_denied",
  "resource": "telegram_run",
  "action": "run_agent",
  "reason": "Not admin",
  "user": "telegram:12345",
  "ip": "telegram",
  "correlationId": "d8f137fd-65a1-49b4-a1f6-7d6b298df2a8"
}
```

Log entries include:
- `access_denied` - Non-admin access attempts
- `agent` - Agent execution requests

## Setting Up the Webhook

### 1. Set Webhook URL

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/webhooks/telegram",
    "secret_token": "<your-secret>"
  }'
```

### 2. Verify Webhook

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

### 3. Test Commands

Send these messages to your bot:

- `/start` - Should show help message
- `/help` - Should show help message
- `/status` - Admin only, shows system status
- `/run governance-agent` - Admin only, triggers agent

## Testing

### Manual Testing

Run the included test script:

```bash
./test-telegram-webhook.sh
```

This tests:
- ✅ Public commands (/help, /start)
- ✅ Admin-only commands (/status, /run)
- ✅ Access control enforcement
- ✅ Audit logging

### Webhook Simulation

Test the webhook locally:

```bash
curl -X POST http://localhost:3000/api/webhooks/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "chat": { "id": 12345 },
      "text": "/help"
    }
  }'
```

## Troubleshooting

### Bot Not Responding

1. Check `TELEGRAM_BOT_TOKEN` is set correctly
2. Verify webhook is set: `curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"`
3. Check server logs for errors

### "🚫 Unauthorized" Message

1. Verify your chat ID is in `ORBIT_ADMIN_CHAT_IDS`
2. Check audit log: `tail -f logs/audit.log | grep access_denied`
3. Ensure chat IDs are comma-separated with no spaces

### 403 Forbidden Errors

1. Check `TELEGRAM_WEBHOOK_SECRET` matches what you set in Telegram
2. Ensure webhook secret is sent in `x-telegram-bot-api-secret-token` header

### Agent Not Executing

1. Check server logs for orchestrator errors
2. Verify agent ID exists: `curl http://localhost:3000/api/agents`
3. Check audit log for execution attempts: `grep telegram_run_request logs/audit.log`

## Implementation Details

### File Structure

```
src/
  webhooks/
    telegram.js         # Main webhook handler
  routes/
    webhooks.js         # Route configuration
  orbit/
    agents/
      TelegramAgent.js  # Message sending functionality
```

### Key Functions

- `telegramWebhook(req, res)` - Main webhook handler
- `reply(chatId, text)` - Send message to Telegram chat
- Admin check: `ADMIN_IDS.includes(chatId)`
- Orchestrator call: `orchestrator({ event, payload, context })`

### Dependencies

- `node-fetch` - For Telegram API calls
- `express` - Web framework
- `src/runners/orchestrator.js` - Agent orchestration
- `src/utils/auditLogger.js` - Audit logging
- `src/orbit/agents/TelegramAgent.js` - Telegram messaging

## Security Considerations

1. **Never bypass the orchestrator** - All execution must go through the orchestrator to ensure governance policies are applied.

2. **Mobile mode is mandatory** - Telegram is always treated as a mobile client with restricted permissions.

3. **Admin lists must be protected** - Store `ORBIT_ADMIN_CHAT_IDS` in secrets, not in code.

4. **Webhook secrets are recommended** - Use `TELEGRAM_WEBHOOK_SECRET` in production to prevent unauthorized webhook calls.

5. **Audit all actions** - Every command is logged with user context for security auditing.

## Future Enhancements

- [ ] Rate limiting per chat ID
- [ ] Command history per user
- [ ] Async execution with status updates
- [ ] Support for inline keyboards
- [ ] Multi-agent pipeline support
- [ ] Execution result reporting to chat

## License

Part of BSM (Business Service Management) platform.
