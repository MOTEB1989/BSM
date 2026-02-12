# GitHub Webhook Setup Guide

## Overview

BSM supports GitHub webhooks to automatically process events like pull requests, check suites, and pushes. The webhook handler integrates with the orchestrator to trigger appropriate agent workflows.

## Webhook Endpoints

BSM provides two webhook endpoints for GitHub:

1. **Primary endpoint**: `POST /webhook/github` (recommended)
2. **Alternative endpoint**: `POST /api/webhooks/github` (backward compatible)

Both endpoints use the same handler and support full webhook functionality.

## Configuration

### 1. GitHub Repository Settings

Navigate to your repository settings:
```
Repository → Settings → Webhooks → Add webhook
```

Configure the webhook:
- **Payload URL**: `https://your-domain.com/webhook/github`
  - Example: `https://sr-bsm.onrender.com/webhook/github`
- **Content type**: `application/json`
- **Secret**: Set a strong secret token (store in `GITHUB_WEBHOOK_SECRET`)
- **SSL verification**: Enable (recommended)

### 2. Event Selection

Choose which events to send:
- ✅ Pull requests
- ✅ Check suites
- ✅ Pushes
- Or select "Send me everything" for comprehensive coverage

### 3. Environment Variables

Add to your `.env` file or deployment platform:

```bash
# GitHub webhook secret (must match GitHub configuration)
GITHUB_WEBHOOK_SECRET=your-secret-token-here

# GitHub BSU token for automated actions (optional)
GITHUB_BSU_TOKEN=ghp_your_token_here

# CORS origins (include your frontend domains)
CORS_ORIGINS=https://www.lexdo.uk,https://lexdo.uk,https://lexprim.com,https://www.lexprim.com
```

#### Render.com Configuration

If deploying on Render.com:
1. Go to Dashboard → Your Service → Environment
2. Add the environment variables:
   - Key: `GITHUB_WEBHOOK_SECRET`
   - Value: Your secret token
3. Save changes and redeploy if necessary

## Security

### Signature Verification

All webhook requests are verified using HMAC-SHA256:
- GitHub signs each request with your secret
- BSM verifies the signature before processing
- Invalid signatures return `401 Unauthorized`

### No Secret (Development Only)

If `GITHUB_WEBHOOK_SECRET` is not set:
- Signature verification is **bypassed**
- ⚠️ Only use in development/testing environments
- Never deploy to production without a secret

## Webhook Handler Behavior

### Event Processing

1. **Signature verification**: Validates GitHub signature
2. **Event transformation**: Converts GitHub event to orchestrator payload
3. **Draft PR filtering**: Skips draft pull requests automatically
4. **Orchestrator dispatch**: Routes event to appropriate agents
5. **Async processing**: Returns `202 Accepted` immediately
6. **Decision execution**: Executes agent decisions (merge, approve, etc.)

### Supported Events

#### Pull Request
```json
{
  "prNumber": 123,
  "title": "Add feature",
  "body": "Description",
  "author": "username",
  "branch": "feature-branch",
  "baseBranch": "main",
  "filesChanged": 5,
  "additions": 100,
  "deletions": 50
}
```

#### Check Suite
```json
{
  "commit": "abc123...",
  "status": "completed",
  "conclusion": "success",
  "prNumbers": [123, 124]
}
```

#### Push
```json
{
  "ref": "refs/heads/main",
  "commits": [...],
  "pusher": "username",
  "forced": false
}
```

## Testing

### Using curl

Test webhook endpoint:
```bash
curl -X POST https://sr-bsm.onrender.com/webhook/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: ping" \
  -d '{"hook_id": 12345, "zen": "Test webhook"}'
```

Expected response:
```json
{
  "status": "processing",
  "jobId": "job_1234567890_abc",
  "message": "Agents are analyzing your request"
}
```

### Verify in Logs

Check Render logs for webhook activity:
```
POST /webhook/github → status: 202
Webhook received: { event: 'ping', action: undefined }
```

## Troubleshooting

### 404 Not Found

**Problem**: `POST /webhook/github → status: 404`

**Solution**: 
- Verify the webhook URL matches exactly: `/webhook/github`
- Check server logs to confirm the route is registered
- Ensure the server has restarted after configuration changes

### 401 Unauthorized

**Problem**: Signature verification fails

**Solution**:
- Verify `GITHUB_WEBHOOK_SECRET` matches GitHub configuration
- Check that the secret is set correctly in environment variables
- Ensure no extra whitespace in the secret value

### CORS Errors

**Problem**: Browser CORS errors when testing

**Solution**:
- Add your domain to `CORS_ORIGINS` environment variable
- Format: `CORS_ORIGINS=https://domain1.com,https://domain2.com`
- No trailing slashes or spaces
- Restart the server after changes

### No Response from Webhook

**Problem**: GitHub shows webhook delivery failed

**Solution**:
- Check if the server is running and accessible
- Verify SSL certificate is valid (if using HTTPS)
- Check firewall/security group settings
- Review server logs for errors

## API Endpoints Summary

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/webhook/github` | POST | GitHub webhook (primary) | 202 Accepted |
| `/api/webhooks/github` | POST | GitHub webhook (alternative) | 202 Accepted |
| `/api/health` | GET | Health check | 200 OK |
| `/api/agents` | GET | List available agents | 200 OK |
| `/health` | GET | Simple health check | 200 OK |

## Architecture

```
GitHub Event
    ↓
POST /webhook/github
    ↓
Signature Verification
    ↓
Event Transformation
    ↓
Orchestrator
    ↓
Agent Execution
    ↓
Decision Execution (merge, approve, etc.)
```

## References

- Controller: `src/controllers/webhookController.js`
- Routes: `src/app.js` (line 45), `src/routes/webhooks.js`
- Orchestrator: `src/runners/orchestrator.js`
- GitHub Actions: `src/actions/githubActions.js`

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify environment variables are set correctly
3. Test endpoints with curl to isolate issues
4. Review GitHub webhook delivery logs
