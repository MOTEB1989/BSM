#!/usr/bin/env bash
#
# Get Telegram Chat ID Script
# Purpose: Extract your Telegram chat ID by querying the bot's updates
# Usage: ./scripts/get-telegram-chat-id.sh
#
# Prerequisites:
# - A Telegram bot token (from @BotFather)
# - You must send at least one message to the bot before running this script
#

set -euo pipefail

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check for jq
if ! command -v jq >/dev/null 2>&1; then
    log_error "jq is required but not installed."
    log_info "Install it from: https://stedolan.github.io/jq/"
    exit 1
fi

echo ""
log_info "========================================="
log_info "   Telegram Chat ID Extractor"
log_info "========================================="
echo ""

# Get bot token
read -s -p "Enter your TELEGRAM_BOT_TOKEN (hidden): " TOKEN
echo ""

# Validate token format
if ! [[ $TOKEN =~ ^[0-9]{8,10}:[A-Za-z0-9_-]{35}$ ]]; then
    log_error "Invalid Telegram bot token format"
    log_info "Expected format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz-1234567"
    exit 1
fi

log_info "Fetching updates from Telegram API..."

# Make API call
RESPONSE=$(curl -s "https://api.telegram.org/bot${TOKEN}/getUpdates")

# Check if response is valid JSON
if ! echo "$RESPONSE" | jq empty 2>/dev/null; then
    log_error "Invalid response from Telegram API"
    echo "$RESPONSE"
    exit 1
fi

# Check for errors in response
if echo "$RESPONSE" | jq -e '.ok == false' >/dev/null 2>&1; then
    log_error "Telegram API returned an error:"
    echo "$RESPONSE" | jq -r '.description'
    exit 1
fi

# Extract chat IDs
CHAT_IDS=$(echo "$RESPONSE" | jq -r '.result[]?.message.chat.id' 2>/dev/null | sort -u)

if [ -z "$CHAT_IDS" ]; then
    log_error "No chat IDs found!"
    echo ""
    log_info "Possible reasons:"
    echo "  1. You haven't sent any message to the bot yet"
    echo "  2. The bot token is incorrect"
    echo "  3. The bot has no message history"
    echo ""
    log_info "Solution:"
    echo "  1. Open Telegram and search for your bot"
    echo "  2. Send a message to the bot (e.g., 'hello' or '/start')"
    echo "  3. Run this script again"
    echo ""
    exit 1
fi

# Display results
echo ""
log_success "Found the following chat IDs:"
echo ""
echo "$CHAT_IDS" | while read -r CHAT_ID; do
    if [ -n "$CHAT_ID" ]; then
        # Get additional info about this chat
        CHAT_INFO=$(echo "$RESPONSE" | jq -r ".result[] | select(.message.chat.id == $CHAT_ID) | .message.chat | \"\(.first_name // \"\") \(.last_name // \"\") (@\(.username // \"no-username\"))\"" | head -1)
        echo "  • Chat ID: ${GREEN}${CHAT_ID}${NC}"
        echo "    User: ${CHAT_INFO}"
        echo ""
    fi
done

# Provide comma-separated list
COMMA_SEPARATED=$(echo "$CHAT_IDS" | tr '\n' ',' | sed 's/,$//')
echo ""
log_info "For ORBIT_ADMIN_CHAT_IDS, use this value:"
echo -e "  ${GREEN}${COMMA_SEPARATED}${NC}"
echo ""

log_success "Done! Use the chat ID(s) above in your bootstrap script."
