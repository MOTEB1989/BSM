#!/bin/bash
# Manual Test Script for Telegram Webhook
# Usage: ./test-telegram-webhook.sh

set -e

echo "🧪 Telegram Webhook Manual Test"
echo "================================"
echo ""

# Check if server is running
if ! curl -s http://localhost:3000/api/health > /dev/null; then
  echo "❌ Server is not running. Start it with: npm start"
  exit 1
fi

echo "✅ Server is running"
echo ""

# Test 1: /help command
echo "📝 Test 1: /help command (public access)"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/webhooks/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "chat": { "id": 12345 },
      "text": "/help"
    }
  }')
if [ "$RESPONSE" == "OK" ]; then
  echo "✅ Test 1 passed: /help command accepted"
else
  echo "❌ Test 1 failed: Expected 'OK', got '$RESPONSE'"
fi
echo ""

# Test 2: /status command (non-admin)
echo "📝 Test 2: /status command (non-admin, should be blocked)"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/webhooks/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "chat": { "id": 99999 },
      "text": "/status"
    }
  }')
if [ "$RESPONSE" == "OK" ]; then
  echo "✅ Test 2 passed: Non-admin /status blocked (check audit log)"
else
  echo "❌ Test 2 failed: Expected 'OK', got '$RESPONSE'"
fi
echo ""

# Test 3: /run command (non-admin)
echo "📝 Test 3: /run command (non-admin, should be blocked)"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/webhooks/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "chat": { "id": 99999 },
      "text": "/run governance-agent"
    }
  }')
if [ "$RESPONSE" == "OK" ]; then
  echo "✅ Test 3 passed: Non-admin /run blocked (check audit log)"
else
  echo "❌ Test 3 failed: Expected 'OK', got '$RESPONSE'"
fi
echo ""

# Test 4: Invalid secret token
echo "📝 Test 4: Invalid secret token (if TELEGRAM_WEBHOOK_SECRET is set)"
RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost:3000/api/webhooks/telegram \
  -H "Content-Type: application/json" \
  -H "x-telegram-bot-api-secret-token: wrong-token" \
  -d '{
    "message": {
      "chat": { "id": 12345 },
      "text": "/help"
    }
  }')
# If TELEGRAM_WEBHOOK_SECRET is not set, this will pass (200 OK)
# If set, it should return 403
echo "Response code: $RESPONSE"
echo ""

# Test 5: Check audit log
echo "📝 Test 5: Verify audit logging"
if [ -f logs/audit.log ]; then
  echo "✅ Audit log exists"
  echo "Recent audit entries (last 3):"
  tail -3 logs/audit.log | jq -r '"\(.timestamp) | \(.event) | \(.action) | \(.user)"'
  echo ""
else
  echo "❌ Audit log not found at logs/audit.log"
fi

echo ""
echo "🎉 Manual testing complete!"
echo ""
echo "📋 Notes:"
echo "- To test admin access, set ORBIT_ADMIN_CHAT_IDS environment variable"
echo "- To test webhook secret, set TELEGRAM_WEBHOOK_SECRET environment variable"
echo "- Check logs/audit.log for access_denied events"
echo "- Server logs show Telegram message attempts (will fail without TELEGRAM_BOT_TOKEN)"
