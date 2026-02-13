#!/bin/bash

# BSM Security Quick Fixes Application Script
# Applies all recommended security fixes

set -e

echo "🔒 Applying BSM security quick fixes..."
echo ""

# Check if running in CI environment
if [ -n "$CI" ]; then
  echo "ℹ️  Running in CI environment - skipping interactive steps"
  exit 0
fi

# 1. Check prerequisites
echo "📋 Checking prerequisites..."
if ! command -v openssl &> /dev/null; then
  echo "❌ Error: openssl is required but not installed"
  exit 1
fi

if ! command -v node &> /dev/null; then
  echo "❌ Error: node is required but not installed"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo "❌ Error: npm is required but not installed"
  exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# 2. Install dependencies
echo "📦 Installing security dependencies..."
echo "   - rate-limit-redis@4.0.0"
echo "   - isomorphic-dompurify@2.9.0"

if npm install --save rate-limit-redis@4.0.0 isomorphic-dompurify@2.9.0 2>&1 | grep -q "up to date"; then
  echo "✅ Dependencies already installed"
else
  echo "✅ Dependencies installed successfully"
fi
echo ""

# 3. Generate strong passwords
echo "🔑 Generating strong passwords..."
POSTGRES_PASS=$(openssl rand -base64 32)
MYSQL_PASS=$(openssl rand -base64 32)
MYSQL_ROOT_PASS=$(openssl rand -base64 32)
GRAFANA_PASS=$(openssl rand -base64 24)
ADMIN_TOKEN=$(openssl rand -base64 32)
WEBHOOK_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

echo "✅ Passwords generated"
echo ""

# 4. Create secure .env file
echo "📝 Creating secure .env file..."
cat > .env.secure <<EOF
# ============================================
# BSM Platform - Secure Environment Configuration
# Generated: $(date)
# ============================================
# ⚠️  WARNING: This file contains sensitive credentials
# ⚠️  DO NOT commit this file to version control
# ⚠️  Store these credentials in a secure password manager

NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# ====================================
# SECURITY TOKENS (REQUIRED)
# ====================================
# Admin authentication token (minimum 16 characters)
ADMIN_TOKEN=${ADMIN_TOKEN}

# GitHub webhook secret for signature verification
GITHUB_WEBHOOK_SECRET=${WEBHOOK_SECRET}

# Encryption key for sensitive data (32 bytes hex)
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# ====================================
# AI PROVIDER API KEYS
# ====================================
# Get these from your AI provider accounts
# OpenAI: https://platform.openai.com/api-keys
# Perplexity: https://www.perplexity.ai/settings/api
OPENAI_BSU_KEY=
OPENAI_BSM_KEY=
OPENAI_API_KEY=
PERPLEXITY_KEY=
OPENAI_MODEL=gpt-4o-mini

# ====================================
# DATABASE CREDENTIALS
# ====================================
# PostgreSQL (for docker-compose.hybrid.yml)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=bsm_user
POSTGRES_PASSWORD=${POSTGRES_PASS}
POSTGRES_DB=bsm

# MySQL (for docker-compose.mysql.yml)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=bsm_user
MYSQL_PASSWORD=${MYSQL_PASS}
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASS}
MYSQL_DATABASE=bsm_db

# ====================================
# REDIS CACHE
# ====================================
REDIS_URL=redis://localhost:6379

# ====================================
# MONITORING CREDENTIALS
# ====================================
GRAFANA_USER=admin
GRAFANA_PASSWORD=${GRAFANA_PASS}

# ====================================
# RATE LIMITING
# ====================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
MAX_AGENT_INPUT_LENGTH=4000

# ====================================
# CORS CONFIGURATION
# ====================================
CORS_ORIGINS=https://www.lexdo.uk,https://lexdo.uk,https://lexprim.com,https://www.lexprim.com

# ====================================
# FEATURE FLAGS
# ====================================
MOBILE_MODE=false
LAN_ONLY=false
SAFE_MODE=false

# ====================================
# SECURITY SETTINGS
# ====================================
EGRESS_POLICY=deny_by_default
EGRESS_ALLOWED_HOSTS=api.openai.com,github.com
EOF

echo "✅ Secure .env file created at .env.secure"
echo ""

# 5. Create password file
echo "💾 Creating secure password file..."
cat > .passwords.txt <<EOF
BSM Platform - Secure Credentials
Generated: $(date)
================================

⚠️  CRITICAL: Store these credentials securely!
⚠️  Delete this file after storing credentials in password manager

Admin Token:       ${ADMIN_TOKEN}
Webhook Secret:    ${WEBHOOK_SECRET}
Encryption Key:    ${ENCRYPTION_KEY}

PostgreSQL:        ${POSTGRES_PASS}
MySQL User:        ${MYSQL_PASS}
MySQL Root:        ${MYSQL_ROOT_PASS}

Grafana:           ${GRAFANA_PASS}

================================
To use these credentials:
1. Copy .env.secure to .env
2. Add your AI provider API keys to .env
3. Update docker-compose files with these passwords
4. Delete this file: rm .passwords.txt
EOF

chmod 600 .passwords.txt
echo "✅ Passwords saved to .passwords.txt (restricted permissions)"
echo ""

# 6. Create backup of existing files
echo "💾 Creating backups of configuration files..."
if [ -f .env ]; then
  cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
  echo "✅ Backed up .env"
fi

if [ -f docker-compose.hybrid.yml ]; then
  cp docker-compose.hybrid.yml docker-compose.hybrid.yml.backup.$(date +%Y%m%d_%H%M%S)
  echo "✅ Backed up docker-compose.hybrid.yml"
fi

if [ -f docker-compose.mysql.yml ]; then
  cp docker-compose.mysql.yml docker-compose.mysql.yml.backup.$(date +%Y%m%d_%H%M%S)
  echo "✅ Backed up docker-compose.mysql.yml"
fi
echo ""

# 7. Create utility files
echo "📁 Creating utility scripts and files..."

# Create keyValidator.js
mkdir -p src/utils
cat > src/utils/keyValidator.js <<'EOF'
/**
 * API Key Validator
 * Validates and tracks API key usage
 */
import crypto from "crypto";
import logger from "./logger.js";

class KeyValidator {
  constructor() {
    this.blacklist = new Map();
    this.failureThreshold = 3;
  }
  
  validateFormat(provider, key) {
    if (!key || typeof key !== "string") return false;
    
    const patterns = {
      openai: /^sk-(proj-)?[a-zA-Z0-9-_]{20,}$/,
      anthropic: /^sk-ant-[a-zA-Z0-9-_]{20,}$/,
      perplexity: /^pplx-[a-zA-Z0-9-_]{20,}$/,
      google: /^AIza[a-zA-Z0-9-_]{35}$/
    };
    
    return patterns[provider]?.test(key) ?? false;
  }
  
  isBlacklisted(key) {
    const hash = this.hashKey(key);
    const entry = this.blacklist.get(hash);
    
    if (!entry) return false;
    
    // Blacklist expires after 1 hour
    if (Date.now() - entry.timestamp > 3600000) {
      this.blacklist.delete(hash);
      return false;
    }
    
    return entry.failures >= this.failureThreshold;
  }
  
  recordFailure(key, statusCode) {
    const hash = this.hashKey(key);
    const entry = this.blacklist.get(hash) || { failures: 0, timestamp: Date.now() };
    
    entry.failures++;
    entry.timestamp = Date.now();
    entry.lastStatus = statusCode;
    
    this.blacklist.set(hash, entry);
    
    if (entry.failures >= this.failureThreshold) {
      logger.warn(`API key blacklisted after ${entry.failures} failures`);
    }
  }
  
  recordSuccess(key) {
    const hash = this.hashKey(key);
    this.blacklist.delete(hash);
  }
  
  hashKey(key) {
    return crypto.createHash("sha256").update(key).digest("hex").substring(0, 16);
  }
}

export const keyValidator = new KeyValidator();
EOF

echo "✅ Created src/utils/keyValidator.js"

# Create sanitizer.js
cat > src/utils/sanitizer.js <<'EOF'
/**
 * Input Sanitizer
 * Removes XSS, control characters, and normalizes input
 */
import DOMPurify from "isomorphic-dompurify";

export const sanitizeInput = (input) => {
  if (typeof input !== "string") {
    return "";
  }
  
  // Remove control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
  
  // Remove HTML/scripts
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, " ").trim();
  
  return sanitized;
};

export const sanitizeArray = (arr, maxLength = 50) => {
  if (!Array.isArray(arr)) {
    return [];
  }
  
  return arr.slice(0, maxLength).map(item => {
    if (typeof item === "string") {
      return sanitizeInput(item);
    }
    if (typeof item === "object" && item !== null) {
      return Object.keys(item).reduce((acc, key) => {
        acc[key] = typeof item[key] === "string" ? sanitizeInput(item[key]) : item[key];
        return acc;
      }, {});
    }
    return item;
  });
};

export const removeControlChars = (str) => {
  return str.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
};
EOF

echo "✅ Created src/utils/sanitizer.js"
echo ""

# 8. Validate environment
echo "🔍 Validating environment configuration..."
if bash scripts/validate-env.sh; then
  echo "✅ Environment validation passed"
else
  echo "⚠️  Environment validation found issues - review output above"
fi
echo ""

# 9. Display summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Security quick fixes applied successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Generated Files:"
echo "   • .env.secure        - Secure environment configuration"
echo "   • .passwords.txt     - Generated passwords (DELETE after use)"
echo "   • src/utils/keyValidator.js   - API key validation"
echo "   • src/utils/sanitizer.js      - Input sanitization"
echo ""
echo "🔐 Secure Credentials Generated:"
echo "   • Admin Token:       ${ADMIN_TOKEN:0:8}...${ADMIN_TOKEN: -8}"
echo "   • Webhook Secret:    ${WEBHOOK_SECRET:0:8}...${WEBHOOK_SECRET: -8}"
echo "   • Postgres Password: ${POSTGRES_PASS:0:8}...${POSTGRES_PASS: -8}"
echo "   • MySQL Password:    ${MYSQL_PASS:0:8}...${MYSQL_PASS: -8}"
echo "   • Grafana Password:  ${GRAFANA_PASS:0:8}...${GRAFANA_PASS: -8}"
echo ""
echo "⚠️  NEXT STEPS (CRITICAL):"
echo "   1. Review .passwords.txt and store credentials securely"
echo "   2. Copy .env.secure to .env"
echo "   3. Add your AI provider API keys to .env"
echo "   4. Update docker-compose files with new passwords"
echo "   5. Review and apply code changes from reports/SECURITY-AUDIT-PERFORMANCE.md"
echo "   6. DELETE .passwords.txt after storing credentials"
echo ""
echo "📚 Documentation:"
echo "   • Full audit: reports/SECURITY-AUDIT-PERFORMANCE.md"
echo "   • Quick fixes: reports/SECURITY-QUICK-FIXES.md"
echo "   • Checklist: PRODUCTION-SECURITY-CHECKLIST.md"
echo ""
echo "🧪 Verification:"
echo "   npm run validate:env   # Validate environment"
echo "   npm test              # Run test suite"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
