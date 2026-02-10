#!/usr/bin/env bash
# =========================
# BSM Local Bootstrap (Linux/macOS)
# =========================
# This script automates the setup of the BSM project on Linux/macOS systems.
# It installs dependencies, configures environment, and starts the development server.
#
# Usage:
#   ./scripts/bootstrap.sh [--skip-deps] [--no-dev]
#
# Options:
#   --skip-deps   Skip dependency installation (Node.js, npm)
#   --no-dev      Don't start the dev server after setup

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SKIP_DEPS=false
NO_DEV=false
NODE_MIN_VERSION="18"
PORT="${PORT:-3000}"

# Parse arguments
for arg in "$@"; do
  case $arg in
    --skip-deps)
      SKIP_DEPS=true
      shift
      ;;
    --no-dev)
      NO_DEV=true
      shift
      ;;
    *)
      ;;
  esac
done

# Helper functions
print_step() {
  echo -e "${BLUE}==>${NC} $1"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check Node.js version
check_node_version() {
  if command_exists node; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge "$NODE_MIN_VERSION" ]; then
      return 0
    fi
  fi
  return 1
}

# Install Node.js on Linux
install_node_linux() {
  print_step "Installing Node.js LTS..."

  if command_exists apt-get; then
    # Debian/Ubuntu
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif command_exists yum; then
    # RHEL/CentOS/Fedora
    curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
    sudo yum install -y nodejs
  elif command_exists pacman; then
    # Arch Linux
    sudo pacman -S --noconfirm nodejs npm
  else
    print_error "Unable to detect package manager. Please install Node.js manually from https://nodejs.org/"
    exit 1
  fi
}

# Install Node.js on macOS
install_node_macos() {
  print_step "Installing Node.js LTS..."

  if command_exists brew; then
    brew install node
  else
    print_warning "Homebrew not found. Installing Homebrew first..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    brew install node
  fi
}

# ==================
# Main Script
# ==================

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║       BSM Project Bootstrap                           ║"
echo "║       Business Service Management Platform            ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# 1) Check if we're in the right directory
if [ ! -f "package.json" ]; then
  print_error "package.json not found. Please run this script from the BSM project root."
  exit 1
fi

print_success "Found BSM project"

# 2) Check/Install Node.js
if [ "$SKIP_DEPS" = false ]; then
  print_step "Checking Node.js installation..."

  if check_node_version; then
    print_success "Node.js $(node -v) is installed"
    print_success "npm $(npm -v) is installed"
  else
    print_warning "Node.js $NODE_MIN_VERSION+ not found. Installing..."

    OS="$(uname -s)"
    case "$OS" in
      Linux*)
        install_node_linux
        ;;
      Darwin*)
        install_node_macos
        ;;
      *)
        print_error "Unsupported OS: $OS"
        exit 1
        ;;
    esac

    if check_node_version; then
      print_success "Node.js $(node -v) installed successfully"
    else
      print_error "Node.js installation failed. Please install manually from https://nodejs.org/"
      exit 1
    fi
  fi
else
  print_warning "Skipping dependency checks (--skip-deps)"
fi

# 3) Setup .env file
print_step "Setting up environment file..."

if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    print_success "Created .env from .env.example"
    print_warning "Please edit .env and add your API keys:"
    print_warning "  - OPENAI_BSM_KEY (or OPENAI_BSU_KEY or OPENAI_API_KEY)"
    print_warning "  - ADMIN_TOKEN (change from default)"
  else
    print_error ".env.example not found!"
    exit 1
  fi
else
  print_success ".env file already exists"
fi

# 4) Check if API keys are configured
if grep -q "^OPENAI.*_KEY=$" .env 2>/dev/null || grep -q "^OPENAI.*_KEY=\s*$" .env 2>/dev/null; then
  print_warning "API keys not configured in .env!"
  print_warning "The server may fail to start without valid OpenAI keys."
fi

# 5) Install npm dependencies
print_step "Installing dependencies..."
if npm ci 2>/dev/null; then
  print_success "Dependencies installed with npm ci"
else
  print_warning "npm ci failed, falling back to npm install..."
  npm install
  print_success "Dependencies installed with npm install"
fi

# 6) Validate configuration
print_step "Validating agent configurations..."
if npm run validate >/dev/null 2>&1; then
  print_success "All agent configurations are valid"
else
  print_warning "Some agent configurations may have issues. Run 'npm run validate' for details."
fi

# 7) Setup complete
echo ""
print_success "Bootstrap complete!"
echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║  Next Steps                                           ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "1. Edit .env file with your API keys:"
echo "   - OPENAI_BSM_KEY (or OPENAI_BSU_KEY or OPENAI_API_KEY)"
echo "   - ADMIN_TOKEN (change from 'change-me')"
echo ""
echo "2. Start the development server:"
echo "   npm run dev"
echo ""
echo "3. Access the application:"
echo "   - API Health: http://localhost:${PORT}/api/health"
echo "   - Chat UI: http://localhost:${PORT}/src/chat/"
echo "   - Admin Dashboard: http://localhost:${PORT}/src/admin/"
echo ""

# 8) Optionally start dev server
if [ "$NO_DEV" = false ]; then
  echo ""
  read -p "Start development server now? (y/N): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_step "Starting development server on port ${PORT}..."
    npm run dev
  fi
else
  print_warning "Skipping dev server startup (--no-dev)"
fi
