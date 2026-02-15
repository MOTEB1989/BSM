# Chat Troubleshooting Guide

## Issue: Chat Not Working on https://sr-bsm.onrender.com

This document provides troubleshooting steps to diagnose and fix chat issues on the BSM platform.

## Common Issues and Solutions

### 1. Missing or Invalid OpenAI API Key

**Symptoms:**
- Chat shows error: "AI service is not configured"
- Key status shows: "🔴 GPT-4 Offline"

**Solution:**
1. Check that one of these environment variables is set in Render dashboard:
   - `OPENAI_BSM_KEY` (highest priority)
   - `OPENAI_BSU_KEY` (medium priority)
   - `OPENAI_API_KEY` (lowest priority)

2. Verify the API key is valid:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

3. If using a new API key, redeploy the service on Render

### 2. Network/DNS Connectivity Issues

**Symptoms:**
- Chat shows error: "Cannot connect to AI service"
- Error code: `NETWORK_ERROR`
- Server logs show: "getaddrinfo ENOTFOUND api.openai.com"

**Solution:**
1. Check Render's network status
2. Verify that `api.openai.com` is accessible from the Render environment
3. Check if there are any firewall or network restrictions
4. Check Render's status page for outages

### 3. Request Timeout Issues

**Symptoms:**
- Chat shows error: "AI service request timed out"
- Error code: `GPT_TIMEOUT`
- Requests take longer than 30 seconds

**Solution:**
1. Check OpenAI API status: https://status.openai.com
2. Increase timeout in `src/services/gptService.js` if needed
3. Consider using a faster model (e.g., `gpt-3.5-turbo` instead of `gpt-4`)

### 4. CORS Issues

**Symptoms:**
- Browser console shows CORS errors
- Chat cannot connect to API from different domain

**Solution:**
1. Set `CORS_ORIGINS` environment variable in Render dashboard:
   ```
   CORS_ORIGINS=https://sr-bsm.onrender.com,https://www.lexdo.uk,https://lexdo.uk
   ```
2. Redeploy the service

### 5. Rate Limiting

**Symptoms:**
- Chat shows error: "Rate limit exceeded"
- Error code: 429
- Multiple users hitting the service

**Solution:**
1. Check OpenAI API rate limits
2. Upgrade OpenAI API plan if needed
3. Implement request queuing or caching
4. Adjust rate limiting in `src/app.js`

## Diagnostic Steps

### Step 1: Check Service Health

Visit: `https://sr-bsm.onrender.com/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-15T14:00:00.000Z"
}
```

### Step 2: Check API Key Status

Visit: `https://sr-bsm.onrender.com/api/chat/key-status`

Expected response:
```json
{
  "timestamp": "2026-02-15T14:00:00.000Z",
  "status": {
    "openai": true,
    "anthropic": false,
    "perplexity": false,
    "google": false
  },
  "ui": {
    "openai": "✅ GPT-4 Ready",
    "anthropic": "🔴 Claude Offline",
    "perplexity": "🔴 Perplexity Offline",
    "google": "🔴 Gemini Offline"
  }
}
```

If `status.openai` is `false`, the API key is not configured.

### Step 3: Check Server Logs

1. Go to Render dashboard
2. Select the `bsu-api` service
3. Click "Logs" tab
4. Look for errors related to:
   - `ENOTFOUND api.openai.com` (DNS issue)
   - `MISSING_API_KEY` (API key not configured)
   - `GPT_TIMEOUT` (timeout issue)
   - `GPT_ERROR` (OpenAI API error)

### Step 4: Test Chat Endpoint Manually

Using curl or Postman:

```bash
curl -X POST https://sr-bsm.onrender.com/api/chat/direct \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, test message",
    "language": "en"
  }'
```

Expected response:
```json
{
  "output": "Hello! How can I help you today?"
}
```

Error response examples:
```json
{
  "error": "AI service is not configured. Please contact the administrator.",
  "code": "MISSING_API_KEY",
  "correlationId": "..."
}
```

```json
{
  "error": "Cannot connect to AI service. Please check server network configuration.",
  "code": "NETWORK_ERROR",
  "correlationId": "..."
}
```

### Step 5: Check Browser Console

1. Open browser developer tools (F12)
2. Go to Console tab
3. Try sending a chat message
4. Look for errors:
   - Network errors (fetch failed)
   - CORS errors
   - 500/503 status codes

## Environment Variables Checklist

Required for production:
- ✅ `NODE_ENV=production`
- ✅ `ADMIN_TOKEN` (minimum 16 characters)
- ✅ One of: `OPENAI_BSM_KEY`, `OPENAI_BSU_KEY`, or `OPENAI_API_KEY`

Optional but recommended:
- `OPENAI_MODEL` (default: `gpt-4o-mini`)
- `CORS_ORIGINS` (comma-separated list of allowed origins)
- `LOG_LEVEL` (default: `info`)
- `RATE_LIMIT_MAX` (default: `100`)
- `RATE_LIMIT_WINDOW_MS` (default: `900000` / 15 minutes)

## Recent Changes

The following error handling improvements were made:

1. **Frontend (`src/chat/app.js`)**:
   - Better detection of network errors
   - Improved error messages for different error types
   - Support for `NETWORK_ERROR` and `GPT_TIMEOUT` codes

2. **Backend (`src/services/gptService.js`)**:
   - Detection of DNS errors (`ENOTFOUND`)
   - Detection of connection errors (`ECONNREFUSED`)
   - Returns 503 for network errors

3. **Error Handler (`src/middleware/errorHandler.js`)**:
   - Added handling for `NETWORK_ERROR`
   - Added handling for `GPT_TIMEOUT`
   - User-friendly messages for each error type

## Quick Fix Commands

### Restart Service on Render
1. Go to Render dashboard
2. Select `bsu-api` service
3. Click "Manual Deploy" → "Clear build cache & deploy"

### Check Environment Variables
1. Go to Render dashboard
2. Select `bsu-api` service
3. Click "Environment" tab
4. Verify all required variables are set

### Update Environment Variables
1. Add/update variables in Render dashboard
2. Click "Save"
3. Service will automatically redeploy

## Contact Support

If the issue persists after following these steps:

1. Collect diagnostic information:
   - Health check response
   - Key status response
   - Server logs (last 100 lines)
   - Browser console errors
   - Error correlationId from error response

2. Create a GitHub issue with:
   - Description of the problem
   - Steps to reproduce
   - All diagnostic information collected
   - Screenshots if applicable

## Additional Resources

- OpenAI API Status: https://status.openai.com
- Render Status: https://status.render.com
- Repository: https://github.com/LexBANK/BSM
- Documentation: See `CLAUDE.md` and `README.md`
