# QuickNote - Development / Test Script
# Usage: .\scripts\dev.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

function Write-Step  { param($msg) Write-Host "  => $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Fail  { param($msg) Write-Host "  [ERR] $msg" -ForegroundColor Red }
function Write-Title { param($msg) Write-Host "`n$msg" -ForegroundColor Magenta }

Write-Title "========================================"
Write-Title "  QuickNote  -  Development Mode"
Write-Title "========================================"

# ── 1. Check prerequisites ───────────────────────────────────────────────────
Write-Title "[ 1/3 ] Checking prerequisites..."

foreach ($tool in @("node", "npm", "cargo", "rustc")) {
    try {
        $ver = & $tool --version 2>&1 | Select-Object -First 1
        Write-Ok "${tool}: $ver"
    } catch {
        Write-Fail "$tool not found. Please install it first."
        exit 1
    }
}

# ── 2. Install / verify npm dependencies ────────────────────────────────────
Write-Title "[ 2/3 ] Checking npm dependencies..."

Set-Location $Root

if (-not (Test-Path "node_modules")) {
    Write-Step "node_modules not found, running npm install..."
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Fail "npm install failed"; exit 1 }
    Write-Ok "Dependencies installed"
} else {
    Write-Ok "node_modules already present"
}

# ── 3. Start dev server ──────────────────────────────────────────────────────
Write-Title "[ 3/3 ] Starting Tauri dev server..."
Write-Step "Vite dev server  -> http://localhost:1420"
Write-Step "Rust will compile on first run (may take ~1 min)"
Write-Host ""

npm run tauri dev
