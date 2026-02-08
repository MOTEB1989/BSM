#!/usr/bin/env bash
#
# ORBIT Bootstrap Script for LexBANK/BSM
# Purpose: Automates GitHub and Cloudflare Workers secrets setup
# Usage: ./scripts/bootstrap-orbit.sh
#
# This script will:
# - Authenticate with GitHub CLI
# - Collect required secrets interactively
# - Set GitHub repository secrets
# - Set Wrangler (Cloudflare Workers) secrets if wrangler is available
#
# Security Notes:
# - Run this script ONCE on a secure machine
# - All secrets are stored securely in GitHub Secrets and Cloudflare Workers
# - Never commit this script with hardcoded secrets
#

set -euo pipefail

# Repository configuration
readonly OWNER="LexBANK"
readonly REPO="BSM"
readonly REPO_FULL="${OWNER}/${REPO}"

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v gh >/dev/null 2>&1; then
        log_error "GitHub CLI (gh) is not installed."
        log_info "Install it from: https://cli.github.com/"
        exit 1
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        log_warning "jq is not installed. It's recommended for validation."
        log_info "Install it from: https://stedolan.github.io/jq/"
    fi
    
    log_success "Prerequisites check passed"
}

# Authenticate with GitHub
authenticate_github() {
    log_info "Checking GitHub CLI authentication..."
    
    if ! gh auth status >/dev/null 2>&1; then
        log_warning "GitHub CLI is not authenticated."
        log_info "A browser window will open to complete authentication."
        gh auth login --web --scopes "repo,workflow"
    else
        log_success "GitHub CLI is already authenticated"
    fi
}

# Collect secrets from user
collect_secrets() {
    log_info "Starting secret collection for ${REPO_FULL}"
    echo ""
    
    # Cloudflare configuration
    log_info "=== Cloudflare Configuration ==="
    read -p "Enter Cloudflare Account ID: " CF_ACCOUNT_ID
    read -p "Enter Cloudflare Zone ID: " CF_ZONE_ID
    read -p "Enter Cloudflare Project Name [orbit-workers]: " CF_PROJECT_NAME
    CF_PROJECT_NAME=${CF_PROJECT_NAME:-orbit-workers}
    
    echo ""
    log_info "=== GitHub Configuration ==="
    log_info "Create a GitHub Personal Access Token (PAT) with 'repo' and 'workflow' scopes"
    log_info "Create it at: https://github.com/settings/tokens/new"
    read -s -p "Paste ORBIT_GITHUB_TOKEN (hidden): " ORBIT_GITHUB_TOKEN
    echo ""
    
    # Validate token is not empty
    if [ -z "$ORBIT_GITHUB_TOKEN" ]; then
        log_error "ORBIT_GITHUB_TOKEN cannot be empty"
        exit 1
    fi
    
    echo ""
    log_info "=== Telegram Configuration ==="
    log_info "Create a Telegram bot via @BotFather to get the token"
    read -s -p "Paste TELEGRAM_BOT_TOKEN (hidden): " TELEGRAM_BOT_TOKEN
    echo ""
    
    # Validate token is not empty
    if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
        log_error "TELEGRAM_BOT_TOKEN cannot be empty"
        exit 1
    fi
    
    log_info "To get your chat ID, run: ./scripts/get-telegram-chat-id.sh"
    read -p "Enter comma-separated admin chat IDs (e.g., 123456789,987654321): " ORBIT_ADMIN_CHAT_IDS
    
    echo ""
    log_success "All secrets collected successfully"
}

# Validate secrets format
validate_secrets() {
    log_info "Validating secrets format..."
    
    # Validate Cloudflare Account ID (32 hex characters)
    if ! [[ $CF_ACCOUNT_ID =~ ^[a-f0-9]{32}$ ]]; then
        log_warning "CF_ACCOUNT_ID format looks unusual (expected 32 hex chars)"
    fi
    
    # Validate Cloudflare Zone ID (32 hex characters)
    if ! [[ $CF_ZONE_ID =~ ^[a-f0-9]{32}$ ]]; then
        log_warning "CF_ZONE_ID format looks unusual (expected 32 hex chars)"
    fi
    
    # Validate GitHub token format (ghp_ prefix)
    if ! [[ $ORBIT_GITHUB_TOKEN =~ ^ghp_[A-Za-z0-9_]{36,}$ ]]; then
        log_warning "ORBIT_GITHUB_TOKEN format looks unusual (expected ghp_ prefix)"
    fi
    
    # Validate Telegram bot token format
    if ! [[ $TELEGRAM_BOT_TOKEN =~ ^[0-9]{8,10}:[A-Za-z0-9_-]{35}$ ]]; then
        log_warning "TELEGRAM_BOT_TOKEN format looks unusual"
    fi
    
    # Validate chat IDs (comma-separated numbers)
    if ! [[ $ORBIT_ADMIN_CHAT_IDS =~ ^[0-9]+(,[0-9]+)*$ ]]; then
        log_warning "ORBIT_ADMIN_CHAT_IDS format looks unusual (expected comma-separated numbers)"
    fi
    
    log_success "Validation completed"
}

# Set GitHub secrets
set_github_secrets() {
    log_info "Setting GitHub repository secrets for ${REPO_FULL}..."
    
    # Set Cloudflare secrets
    echo "$CF_ACCOUNT_ID" | gh secret set CF_ACCOUNT_ID --repo "$REPO_FULL" || {
        log_error "Failed to set CF_ACCOUNT_ID"
        exit 1
    }
    log_success "Set CF_ACCOUNT_ID"
    
    echo "$CF_ZONE_ID" | gh secret set CF_ZONE_ID --repo "$REPO_FULL" || {
        log_error "Failed to set CF_ZONE_ID"
        exit 1
    }
    log_success "Set CF_ZONE_ID"
    
    echo "$CF_PROJECT_NAME" | gh secret set CF_PROJECT_NAME --repo "$REPO_FULL" || {
        log_error "Failed to set CF_PROJECT_NAME"
        exit 1
    }
    log_success "Set CF_PROJECT_NAME"
    
    # Set GitHub token
    echo "$ORBIT_GITHUB_TOKEN" | gh secret set ORBIT_GITHUB_TOKEN --repo "$REPO_FULL" || {
        log_error "Failed to set ORBIT_GITHUB_TOKEN"
        exit 1
    }
    log_success "Set ORBIT_GITHUB_TOKEN"
    
    # Set Telegram secrets
    echo "$TELEGRAM_BOT_TOKEN" | gh secret set TELEGRAM_BOT_TOKEN --repo "$REPO_FULL" || {
        log_error "Failed to set TELEGRAM_BOT_TOKEN"
        exit 1
    }
    log_success "Set TELEGRAM_BOT_TOKEN"
    
    echo "$ORBIT_ADMIN_CHAT_IDS" | gh secret set ORBIT_ADMIN_CHAT_IDS --repo "$REPO_FULL" || {
        log_error "Failed to set ORBIT_ADMIN_CHAT_IDS"
        exit 1
    }
    log_success "Set ORBIT_ADMIN_CHAT_IDS"
    
    log_success "All GitHub secrets set successfully"
}

# Set Wrangler secrets
set_wrangler_secrets() {
    if ! command -v wrangler >/dev/null 2>&1; then
        log_warning "wrangler CLI not found - skipping Cloudflare Workers secrets"
        log_info "Install wrangler with: npm install -g wrangler"
        return 0
    fi
    
    log_info "Setting Wrangler (Cloudflare Workers) secrets..."
    
    # Check if logged in
    if ! wrangler whoami >/dev/null 2>&1; then
        log_info "Logging into Cloudflare via Wrangler..."
        wrangler login || {
            log_error "Failed to login to Wrangler"
            return 1
        }
    fi
    
    # Set secrets for production environment
    echo "$ORBIT_GITHUB_TOKEN" | wrangler secret put ORBIT_GITHUB_TOKEN --env production 2>&1 | grep -v "Creating the secret" || true
    log_success "Set ORBIT_GITHUB_TOKEN in Wrangler"
    
    echo "$TELEGRAM_BOT_TOKEN" | wrangler secret put TELEGRAM_BOT_TOKEN --env production 2>&1 | grep -v "Creating the secret" || true
    log_success "Set TELEGRAM_BOT_TOKEN in Wrangler"
    
    echo "$ORBIT_ADMIN_CHAT_IDS" | wrangler secret put ORBIT_ADMIN_CHAT_IDS --env production 2>&1 | grep -v "Creating the secret" || true
    log_success "Set ORBIT_ADMIN_CHAT_IDS in Wrangler"
    
    log_success "All Wrangler secrets set successfully"
}

# Print summary
print_summary() {
    echo ""
    log_success "========================================="
    log_success "   Bootstrap Complete!"
    log_success "========================================="
    echo ""
    log_info "Secrets configured:"
    echo "  • CF_ACCOUNT_ID"
    echo "  • CF_ZONE_ID"
    echo "  • CF_PROJECT_NAME"
    echo "  • ORBIT_GITHUB_TOKEN"
    echo "  • TELEGRAM_BOT_TOKEN"
    echo "  • ORBIT_ADMIN_CHAT_IDS"
    echo ""
    log_info "Next steps:"
    echo "  1. Review wrangler.toml and update account_id/zone_id"
    echo "  2. Deploy Workers: wrangler publish --env production"
    echo "  3. Set Telegram webhook (see docs/ORBIT-BOOTSTRAP-GUIDE.md)"
    echo "  4. Test ORBIT in report-only mode initially"
    echo ""
    log_info "Documentation:"
    echo "  • Setup guide: docs/ORBIT-BOOTSTRAP-GUIDE.md"
    echo "  • Secrets management: docs/ORBIT-SECRETS-MANAGEMENT.md"
    echo ""
}

# Main execution
main() {
    echo ""
    log_info "========================================="
    log_info "   ORBIT Bootstrap Script"
    log_info "   Repository: ${REPO_FULL}"
    log_info "========================================="
    echo ""
    
    check_prerequisites
    authenticate_github
    collect_secrets
    validate_secrets
    set_github_secrets
    set_wrangler_secrets
    print_summary
    
    log_success "Bootstrap process completed successfully!"
}

# Run main function
main "$@"
