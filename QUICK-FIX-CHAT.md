# Quick Fix Guide - Chat Not Working

**Issue:** Chat not working on https://sr-bsm.onrender.com

## Most Likely Cause: Missing OpenAI API Key

### Quick Fix (5 minutes)

1. **Get OpenAI API Key**
   - Go to: https://platform.openai.com/api-keys
   - Create new key or use existing one
   - Copy the key (starts with `sk-`)

2. **Add to Render**
   - Go to: https://dashboard.render.com
   - Select `bsu-api` service
   - Click "Environment" tab
   - Click "Add Environment Variable"
   - Name: `OPENAI_BSM_KEY`
   - Value: Paste your API key
   - Click "Save Changes"

3. **Wait for Redeploy**
   - Service will automatically redeploy (2-3 minutes)
   - Watch "Events" tab for progress

4. **Test**
   - Open: https://sr-bsm.onrender.com/chat
   - Try sending a message
   - Should work now! ✅

## Alternative Causes

### If quick fix didn't work, run diagnostic:

```bash
# Clone repo
git clone https://github.com/LexBANK/BSM.git
cd BSM

# Install dependencies
npm ci

# Run health check
node scripts/chat-health-check.js https://sr-bsm.onrender.com
```

The health check will tell you exactly what's wrong.

## More Help

- See `CHAT-TROUBLESHOOTING.md` for detailed guide
- See `CHAT-DIAGNOSTIC-REPORT.md` for technical analysis
- Check Render logs for error messages
- Contact @MOTEB1989 if issue persists
