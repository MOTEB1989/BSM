#Requires -Version 5.1
<#
.SYNOPSIS
  Bootstrap BSM on Windows in one run.

.DESCRIPTION
  - Installs Node.js LTS, Git, and GitHub CLI via winget when missing.
  - Clones (or updates) LexBANK/BSM into a target folder.
  - Generates .env.example when absent and creates .env.
  - Installs dependencies, runs validation, and starts the dev server.

.SECURITY
  Do NOT hardcode production secrets in this script.
  Provide secrets via environment variables or an external Key Management Layer.
#>

$ErrorActionPreference = 'Stop'

$Repo = 'LexBANK/BSM'
$BaseDir = Join-Path $env:USERPROFILE 'Desktop'
$ProjDir = Join-Path $BaseDir 'BSM'

function Ensure-WingetApp {
  param(
    [Parameter(Mandatory=$true)][string]$Id,
    [Parameter(Mandatory=$true)][string]$Name
  )

  Write-Host "==> Checking $Name ..."
  $installed = winget list --id $Id --exact 2>$null | Select-String -Quiet $Id
  if (-not $installed) {
    Write-Host "==> Installing $Name ..."
    winget install --id $Id -e --accept-source-agreements --accept-package-agreements
  } else {
    Write-Host "==> $Name already installed."
  }
}

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
  throw 'winget غير موجود. ثبّت App Installer من Microsoft Store ثم أعد المحاولة.'
}

Ensure-WingetApp -Id 'OpenJS.NodeJS.LTS' -Name 'Node.js LTS'
Ensure-WingetApp -Id 'Git.Git' -Name 'Git'
Ensure-WingetApp -Id 'GitHub.cli' -Name 'GitHub CLI'

$machinePath = [Environment]::GetEnvironmentVariable('Path','Machine')
$userPath    = [Environment]::GetEnvironmentVariable('Path','User')
$env:Path = "$machinePath;$userPath"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'node غير متاح بعد التثبيت. اغلق PowerShell وافتحه مرة أخرى ثم أعد تشغيل السكربت.'
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw 'npm غير متاح بعد التثبيت. اغلق PowerShell وافتحه مرة أخرى ثم أعد تشغيل السكربت.'
}

Write-Host "Node: $(node -v)"
Write-Host "NPM : $(npm -v)"

if (-not (Test-Path $BaseDir)) {
  New-Item -ItemType Directory -Path $BaseDir | Out-Null
}

if (Test-Path $ProjDir) {
  Write-Host '==> Repo folder exists. Pulling latest...'
  Set-Location $ProjDir
  git fetch --all
  git pull
} else {
  Write-Host "==> Cloning repo $Repo into $ProjDir ..."
  Set-Location $BaseDir
  git clone "https://github.com/$Repo.git" $ProjDir
  Set-Location $ProjDir
}

if (-not (Test-Path (Join-Path $ProjDir 'package.json'))) {
  throw 'package.json غير موجود. أنت لست في جذر مشروع Node الصحيح.'
}

$EnvExample = Join-Path $ProjDir '.env.example'
if (-not (Test-Path $EnvExample)) {
  Write-Host '==> .env.example missing. Creating template...'
  @'
# ===== BSM Env Template =====
# ضع مفاتيحك هنا عبر طبقة إدارة مفاتيح خارجية (Key Management Layer)
OPENAI_BSM_KEY=
OPENAI_BRINDER_KEY=
OPENAI_LEXNEXUS_KEY=
ADMIN_TOKEN=
PORT=3000
'@ | Set-Content -Encoding UTF8 $EnvExample
}

$EnvFile = Join-Path $ProjDir '.env'
if (-not (Test-Path $EnvFile)) {
  Copy-Item $EnvExample $EnvFile -Force
}

function Set-EnvValue {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][string]$Key,
    [Parameter(Mandatory=$true)][string]$Value
  )

  $content = Get-Content $Path -Raw
  if ($content -match "(?m)^\s*$([regex]::Escape($Key))\s*=") {
    $content = [regex]::Replace($content, "(?m)^\s*$([regex]::Escape($Key))\s*=.*$", "$Key=$Value")
  } else {
    $content = $content.TrimEnd() + "`r`n$Key=$Value`r`n"
  }
  Set-Content -Path $Path -Value $content -Encoding UTF8
}

# Secrets should come from secure external sources, not hardcoded here.
$OPENAI_BSM_KEY      = $env:OPENAI_BSM_KEY
$OPENAI_BRINDER_KEY  = $env:OPENAI_BRINDER_KEY
$OPENAI_LEXNEXUS_KEY = $env:OPENAI_LEXNEXUS_KEY
$ADMIN_TOKEN         = $env:ADMIN_TOKEN
$PORT                = if ($env:PORT) { $env:PORT } else { '3000' }

if (-not $OPENAI_BSM_KEY -or -not $OPENAI_BRINDER_KEY -or -not $OPENAI_LEXNEXUS_KEY -or -not $ADMIN_TOKEN) {
  Write-Warning 'One or more required secrets are missing from environment variables.'
  Write-Warning 'Populate them through a Key Management Layer, then rerun this script.'
}

if ($OPENAI_BSM_KEY)      { Set-EnvValue -Path $EnvFile -Key 'OPENAI_BSM_KEY' -Value $OPENAI_BSM_KEY }
if ($OPENAI_BRINDER_KEY)  { Set-EnvValue -Path $EnvFile -Key 'OPENAI_BRINDER_KEY' -Value $OPENAI_BRINDER_KEY }
if ($OPENAI_LEXNEXUS_KEY) { Set-EnvValue -Path $EnvFile -Key 'OPENAI_LEXNEXUS_KEY' -Value $OPENAI_LEXNEXUS_KEY }
if ($ADMIN_TOKEN)         { Set-EnvValue -Path $EnvFile -Key 'ADMIN_TOKEN' -Value $ADMIN_TOKEN }
Set-EnvValue -Path $EnvFile -Key 'PORT' -Value $PORT

Write-Host "==> .env ready at $EnvFile"

Write-Host '==> Installing dependencies...'
try {
  npm ci
} catch {
  Write-Host 'npm ci failed. Falling back to npm install...'
  npm install
}

Write-Host '==> Running validate...'
npm run validate

Write-Host '==> Starting dev server...'
Write-Host "Open: http://localhost:$PORT"
Write-Host "Health: http://localhost:$PORT/api/health"
npm run dev
