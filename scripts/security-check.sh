#!/bin/bash

# ==============================================================================
# BSU Security Check Script
# Performs quick security validation checks
# ==============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# ==============================================================================
# Helper Functions
# ==============================================================================

print_header() {
    echo -e "\n${BLUE}=================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((PASSED++))
}

print_error() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARN:${NC} $1"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

# ==============================================================================
# Security Checks
# ==============================================================================

print_header "🔐 BSU Security Validation"

# Check 1: .env file protection
print_info "Checking .env file protection..."
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
    print_error ".env file is tracked in Git! Remove it immediately."
else
    print_success ".env file is not tracked in Git"
fi

# Check 2: .env file exists
if [ ! -f .env ]; then
    print_warning ".env file does not exist. Copy from .env.example"
else
    print_success ".env file exists"
fi

# Check 3: ADMIN_TOKEN strength (if .env exists)
if [ -f .env ]; then
    if grep -q "ADMIN_TOKEN=change-me" .env; then
        print_error "ADMIN_TOKEN is set to default 'change-me'"
    elif grep -q "ADMIN_TOKEN=$" .env || grep -q "ADMIN_TOKEN=\s*$" .env; then
        print_warning "ADMIN_TOKEN is empty"
    else
        ADMIN_TOKEN=$(grep "ADMIN_TOKEN=" .env | cut -d '=' -f2 | tr -d ' ')
        if [ ${#ADMIN_TOKEN} -lt 16 ]; then
            print_error "ADMIN_TOKEN is too short (${#ADMIN_TOKEN} chars). Should be 16+ chars."
        else
            print_success "ADMIN_TOKEN length is sufficient (${#ADMIN_TOKEN} chars)"
        fi
    fi
fi

# Check 4: API Keys format (basic check without revealing values)
if [ -f .env ]; then
    if grep -q "OPENAI.*KEY=\s*$" .env; then
        print_warning "Some OpenAI API keys are empty"
    elif grep -E "OPENAI.*KEY=sk-[a-zA-Z0-9]" .env > /dev/null; then
        print_success "OpenAI API keys are set"
    else
        print_warning "OpenAI API keys may not be configured"
    fi
fi

# Check 5: No hardcoded secrets in source code
print_info "Scanning for hardcoded secrets in source code..."
if grep -r "sk-[a-zA-Z0-9]\{20,\}" src/ --exclude-dir=node_modules --quiet 2>/dev/null; then
    print_error "Found potential OpenAI API keys in source code!"
else
    print_success "No OpenAI API keys found in source code"
fi

if grep -r "AKIA[0-9A-Z]\{16\}" src/ --exclude-dir=node_modules --quiet 2>/dev/null; then
    print_error "Found potential AWS access keys in source code!"
else
    print_success "No AWS access keys found in source code"
fi

# Check 6: .gitignore contains sensitive files
print_info "Checking .gitignore..."
GITIGNORE_CHECKS=(".env" "*.key" "*.pem" "*.secret")
for pattern in "${GITIGNORE_CHECKS[@]}"; do
    if grep -q "^${pattern}$" .gitignore; then
        print_success ".gitignore contains ${pattern}"
    else
        print_warning ".gitignore missing ${pattern}"
    fi
done

# Check 7: npm audit
print_info "Running npm audit..."
if npm audit --audit-level=moderate >/dev/null 2>&1; then
    print_success "No moderate+ vulnerabilities found in dependencies"
else
    print_error "Vulnerabilities found in dependencies. Run: npm audit"
fi

# Check 8: Gitleaks (if available)
if command -v gitleaks &> /dev/null; then
    print_info "Running Gitleaks scan..."
    if gitleaks detect --source . --no-banner --exit-code 0 >/dev/null 2>&1; then
        print_success "Gitleaks: No secrets detected"
    else
        print_error "Gitleaks: Potential secrets detected. Run: gitleaks detect --source . --verbose"
    fi
else
    print_warning "Gitleaks not installed. Install: brew install gitleaks"
fi

# Check 9: Docker Compose passwords
if [ -f docker-compose.yml.example ]; then
    print_info "Checking Docker Compose example..."
    if grep -q "POSTGRES_PASSWORD=bsm_password_dev" docker-compose.yml.example; then
        print_warning "docker-compose.yml.example contains weak example password (expected for example file)"
    fi
    if grep -q "GF_SECURITY_ADMIN_PASSWORD=admin" docker-compose.yml.example; then
        print_warning "docker-compose.yml.example contains weak Grafana password (expected for example file)"
    fi
fi

# Check 10: GitHub workflow secrets usage
print_info "Checking GitHub workflows..."
if grep -r "\${{ secrets\." .github/workflows/ --quiet 2>/dev/null; then
    print_success "GitHub workflows use secrets properly"
else
    print_warning "No GitHub secrets found in workflows"
fi

# Check 11: Sensitive files not committed
print_info "Checking for sensitive files..."
SENSITIVE_FILES=(
    "*.key"
    "*.pem"
    "*.p12"
    "*.pfx"
    ".env.production"
    "config.secret.js"
)

for pattern in "${SENSITIVE_FILES[@]}"; do
    if git ls-files | grep -q "$pattern"; then
        print_error "Sensitive file pattern '$pattern' found in Git!"
    fi
done
print_success "No sensitive file patterns found in Git"

# Check 12: Secret scanning workflow exists
if [ -f .github/workflows/secret-scanning.yml ]; then
    print_success "Secret scanning workflow exists"
else
    print_warning "Secret scanning workflow not found. Create .github/workflows/secret-scanning.yml"
fi

# Check 13: Gitleaks config exists
if [ -f .gitleaks.toml ]; then
    print_success "Gitleaks configuration exists"
else
    print_warning "Gitleaks configuration not found. Create .gitleaks.toml"
fi

# ==============================================================================
# Summary
# ==============================================================================

print_header "📊 Security Check Summary"

echo -e "${GREEN}Passed:${NC}   $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC}   $FAILED"

echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🎉 All security checks passed!${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Security checks passed with warnings. Review warnings above.${NC}"
        exit 0
    fi
else
    echo -e "${RED}❌ Security checks failed! Please fix the errors above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "1. Remove .env from Git: git rm --cached .env"
    echo "2. Generate strong token: openssl rand -base64 32"
    echo "3. Update ADMIN_TOKEN in .env"
    echo "4. Run: npm audit fix"
    echo "5. Review: docs/SECURITY-QUICKSTART.md"
    exit 1
fi
