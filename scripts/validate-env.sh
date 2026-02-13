#!/bin/bash

# BSM Environment Variable Validation Script
# Checks for security issues in environment configuration

set -e

echo "🔍 Validating BSM environment configuration..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  Warning: .env file not found (using .env.example as reference)"
  ENV_FILE=".env.example"
else
  ENV_FILE=".env"
fi

ERRORS=0
WARNINGS=0

# Check for weak passwords
if grep -q "ADMIN_TOKEN=change-me" "$ENV_FILE" 2>/dev/null; then
  echo "❌ CRITICAL: Default ADMIN_TOKEN detected in $ENV_FILE"
  ERRORS=$((ERRORS + 1))
fi

if grep -q "POSTGRES_PASSWORD=secret" "$ENV_FILE" 2>/dev/null; then
  echo "❌ CRITICAL: Default POSTGRES_PASSWORD detected"
  ERRORS=$((ERRORS + 1))
fi

if grep -q "MYSQL_PASSWORD=bsm_password" "$ENV_FILE" 2>/dev/null; then
  echo "❌ CRITICAL: Default MYSQL_PASSWORD detected"
  ERRORS=$((ERRORS + 1))
fi

# Check ADMIN_TOKEN length
if grep -q "ADMIN_TOKEN=" "$ENV_FILE" 2>/dev/null; then
  TOKEN_LENGTH=$(grep "ADMIN_TOKEN=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '\n' | tr -d ' ' | wc -c)
  if [ "$TOKEN_LENGTH" -gt 0 ] && [ "$TOKEN_LENGTH" -lt 16 ]; then
    echo "❌ CRITICAL: ADMIN_TOKEN is too short (minimum 16 characters, found: $TOKEN_LENGTH)"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Check for secrets in plaintext
if grep -Eq "sk-[a-zA-Z0-9]{20,}" "$ENV_FILE" 2>/dev/null; then
  echo "⚠️  Warning: Potential API key found in $ENV_FILE"
  echo "   Consider using environment variables or secrets manager"
  WARNINGS=$((WARNINGS + 1))
fi

# Check NODE_ENV
if grep -q "NODE_ENV=production" "$ENV_FILE" 2>/dev/null; then
  echo "✅ Production mode detected - validating security settings..."
  
  # Production must have strong secrets
  if ! grep -q "ADMIN_TOKEN=" "$ENV_FILE" || grep -q "ADMIN_TOKEN=$" "$ENV_FILE" || grep -q "ADMIN_TOKEN=change-me" "$ENV_FILE"; then
    echo "❌ CRITICAL: ADMIN_TOKEN not properly set in production"
    ERRORS=$((ERRORS + 1))
  fi
  
  if ! grep -q "GITHUB_WEBHOOK_SECRET=" "$ENV_FILE" || grep -q "GITHUB_WEBHOOK_SECRET=$" "$ENV_FILE"; then
    echo "⚠️  Warning: GITHUB_WEBHOOK_SECRET not set (webhooks will be rejected)"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# Check docker-compose files for weak passwords
echo ""
echo "🐳 Checking Docker Compose configurations..."

if [ -f "docker-compose.hybrid.yml" ]; then
  if grep -q "POSTGRES_PASSWORD=secret" docker-compose.hybrid.yml; then
    echo "❌ CRITICAL: Weak password in docker-compose.hybrid.yml"
    ERRORS=$((ERRORS + 1))
  fi
  
  if grep -q "GF_SECURITY_ADMIN_PASSWORD=admin" docker-compose.hybrid.yml; then
    echo "❌ CRITICAL: Default Grafana password in docker-compose.hybrid.yml"
    ERRORS=$((ERRORS + 1))
  fi
fi

if [ -f "docker-compose.mysql.yml" ]; then
  if grep -q "MYSQL_PASSWORD=bsm_password" docker-compose.mysql.yml; then
    echo "⚠️  Warning: Weak default MySQL password in docker-compose.mysql.yml"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

echo ""
echo "📊 Validation Summary:"
echo "   Errors: $ERRORS"
echo "   Warnings: $WARNINGS"

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "❌ Environment validation FAILED with $ERRORS critical error(s)"
  echo "   Run 'bash scripts/apply-security-fixes.sh' to fix these issues"
  exit 1
fi

if [ $WARNINGS -gt 0 ]; then
  echo ""
  echo "⚠️  Environment validation passed with $WARNINGS warning(s)"
  echo "   Review the warnings above and address them before production deployment"
  exit 0
fi

echo ""
echo "✅ Environment configuration validation passed"
exit 0
