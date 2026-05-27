# QuickNote - Package / Release Build Script
# Usage: .\scripts\build.ps1 [-Target <target-triple>] [-Bundle <nsis|msi|all>]
#
# Examples:
#   .\scripts\build.ps1
#   .\scripts\build.ps1 -Bundle nsis
#   .\scripts\build.ps1 -Target x86_64-pc-windows-msvc

param(
    [string]$Target  = "",
    [string]$Bundle  = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

function Write-Step  { param($msg) Write-Host "  => $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Fail  { param($msg) Write-Host "  [ERR] $msg" -ForegroundColor Red }
function Write-Title { param($msg) Write-Host "`n$msg" -ForegroundColor Magenta }
function Write-Info  { param($msg) Write-Host "  [i]  $msg" -ForegroundColor Yellow }

Write-Title "========================================"
Write-Title "  QuickNote  -  Release Build"
Write-Title "========================================"

$StartTime = Get-Date

# ── 1. Check prerequisites ───────────────────────────────────────────────────
Write-Title "[ 1/4 ] Checking prerequisites..."

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
Write-Title "[ 2/4 ] Checking npm dependencies..."

Set-Location $Root

if (-not (Test-Path "node_modules")) {
    Write-Step "Running npm install..."
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Fail "npm install failed"; exit 1 }
    Write-Ok "Dependencies installed"
} else {
    Write-Ok "node_modules present"
}

# ── 3. Run build ─────────────────────────────────────────────────────────────
Write-Title "[ 3/4 ] Building release package..."

$TauriArgs = @()
if ($Target -ne "") {
    $TauriArgs += "--target", $Target
    Write-Info "Target triple: $Target"
}
if ($Bundle -ne "") {
    $TauriArgs += "--bundles", $Bundle
    Write-Info "Bundle type: $Bundle"
}

Write-Step "Running: npm run tauri build $($TauriArgs -join ' ')"
Write-Host ""

if ($TauriArgs.Count -gt 0) {
    npm run tauri build -- @TauriArgs
} else {
    npm run tauri build
}

if ($LASTEXITCODE -ne 0) {
    Write-Fail "Build failed. Check the output above."
    exit 1
}

# ── 4. Show output ───────────────────────────────────────────────────────────
Write-Title "[ 4/4 ] Build complete!"

$BundleDir = Join-Path $Root "src-tauri\target\release\bundle"
if (Test-Path $BundleDir) {
    Write-Ok "Installer packages:"
    Get-ChildItem -Path $BundleDir -Recurse -Include "*.exe","*.msi","*.dmg","*.deb","*.AppImage" |
        ForEach-Object {
            $size = [math]::Round($_.Length / 1MB, 2)
            Write-Host "     $($_.FullName)  ($size MB)" -ForegroundColor White
        }
} else {
    Write-Info "Bundle directory not found at: $BundleDir"
}

$Elapsed = (Get-Date) - $StartTime
Write-Host ""
Write-Host "  Total time: $([math]::Round($Elapsed.TotalSeconds, 1)) s" -ForegroundColor Gray
Write-Host ""
