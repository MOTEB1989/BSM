# =========================
# BSM Local Bootstrap (Windows / PowerShell)
# =========================
# This script automates the setup of the BSM project on Windows systems.
# It installs dependencies, configures environment, and starts the development server.
#
# Usage:
#   .\scripts\bootstrap.ps1 [-SkipDeps] [-NoDev]
#
# Options:
#   -SkipDeps   Skip dependency installation (Node.js, npm)
#   -NoDev      Don't start the dev server after setup
#
# Requirements:
#   - Windows 10/11
#   - PowerShell 5.1+
#   - Run as Administrator (for winget installations)

param(
    [switch]$SkipDeps,
    [switch]$NoDev
)

$ErrorActionPreference = "Stop"

# Configuration
$NodeMinVersion = 18
$Port = if ($env:PORT) { $env:PORT } else { "3000" }

# Colors (using Write-Host colors)
function Print-Step($message) {
    Write-Host "==> $message" -ForegroundColor Blue
}

function Print-Success($message) {
    Write-Host "✓ $message" -ForegroundColor Green
}

function Print-Warning($message) {
    Write-Host "⚠ $message" -ForegroundColor Yellow
}

function Print-Error($message) {
    Write-Host "✗ $message" -ForegroundColor Red
}

# Check if command exists
function Test-Command($command) {
    $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
}

# Check Node.js version
function Test-NodeVersion {
    if (Test-Command node) {
        $nodeVersionString = node -v
        $nodeVersion = [int]($nodeVersionString -replace 'v(\d+)\..*', '$1')
        return $nodeVersion -ge $NodeMinVersion
    }
    return $false
}

# Install Node.js using winget
function Install-NodeJs {
    Print-Step "Installing Node.js LTS..."

    if (-not (Test-Command winget)) {
        Print-Error "winget not found. Please install App Installer from Microsoft Store."
        Print-Error "URL: https://www.microsoft.com/store/productId/9NBLGGH4NNS1"
        exit 1
    }

    try {
        winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
        Print-Success "Node.js LTS installed"

        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
                    [System.Environment]::GetEnvironmentVariable("Path", "User")
    }
    catch {
        Print-Error "Failed to install Node.js: $_"
        exit 1
    }
}

# ==================
# Main Script
# ==================

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════╗"
Write-Host "║       BSM Project Bootstrap                           ║"
Write-Host "║       Business Service Management Platform            ║"
Write-Host "╚═══════════════════════════════════════════════════════╝"
Write-Host ""

# 1) Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Print-Error "package.json not found. Please run this script from the BSM project root."
    exit 1
}

Print-Success "Found BSM project"

# 2) Check/Install Node.js
if (-not $SkipDeps) {
    Print-Step "Checking Node.js installation..."

    if (Test-NodeVersion) {
        $nodeVer = node -v
        $npmVer = npm -v
        Print-Success "Node.js $nodeVer is installed"
        Print-Success "npm $npmVer is installed"
    }
    else {
        Print-Warning "Node.js $NodeMinVersion+ not found. Installing..."
        Install-NodeJs

        # Verify installation
        if (Test-NodeVersion) {
            $nodeVer = node -v
            Print-Success "Node.js $nodeVer installed successfully"
        }
        else {
            Print-Error "Node.js installation failed. Please install manually from https://nodejs.org/"
            exit 1
        }
    }
}
else {
    Print-Warning "Skipping dependency checks (-SkipDeps)"
}

# 3) Setup .env file
Print-Step "Setting up environment file..."

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Print-Success "Created .env from .env.example"
        Print-Warning "Please edit .env and add your API keys:"
        Print-Warning "  - OPENAI_BSM_KEY (or OPENAI_BSU_KEY or OPENAI_API_KEY)"
        Print-Warning "  - ADMIN_TOKEN (change from default)"
    }
    else {
        Print-Error ".env.example not found!"
        exit 1
    }
}
else {
    Print-Success ".env file already exists"
}

# 4) Check if API keys are configured
$envContent = Get-Content ".env" -Raw -ErrorAction SilentlyContinue
if ($envContent -match '(?m)^OPENAI.*_KEY=\s*$') {
    Print-Warning "API keys not configured in .env!"
    Print-Warning "The server may fail to start without valid OpenAI keys."
}

# 5) Install npm dependencies
Print-Step "Installing dependencies..."
try {
    npm ci 2>&1 | Out-Null
    Print-Success "Dependencies installed with npm ci"
}
catch {
    Print-Warning "npm ci failed, falling back to npm install..."
    npm install
    Print-Success "Dependencies installed with npm install"
}

# 6) Validate configuration
Print-Step "Validating agent configurations..."
try {
    npm run validate 2>&1 | Out-Null
    Print-Success "All agent configurations are valid"
}
catch {
    Print-Warning "Some agent configurations may have issues. Run 'npm run validate' for details."
}

# 7) Setup complete
Write-Host ""
Print-Success "Bootstrap complete!"
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════╗"
Write-Host "║  Next Steps                                           ║"
Write-Host "╚═══════════════════════════════════════════════════════╝"
Write-Host ""
Write-Host "1. Edit .env file with your API keys:"
Write-Host "   - OPENAI_BSM_KEY (or OPENAI_BSU_KEY or OPENAI_API_KEY)"
Write-Host "   - ADMIN_TOKEN (change from 'change-me')"
Write-Host ""
Write-Host "2. Start the development server:"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "3. Access the application:"
Write-Host "   - API Health: http://localhost:$Port/api/health"
Write-Host "   - Chat UI: http://localhost:$Port/src/chat/"
Write-Host "   - Admin Dashboard: http://localhost:$Port/src/admin/"
Write-Host ""

# 8) Optionally start dev server
if (-not $NoDev) {
    Write-Host ""
    $response = Read-Host "Start development server now? (y/N)"
    if ($response -match '^[Yy]$') {
        Print-Step "Starting development server on port $Port..."
        npm run dev
    }
}
else {
    Print-Warning "Skipping dev server startup (-NoDev)"
}
