# QuickNote - Clean Build Artifacts
# Usage: .\scripts\clean.ps1 [-All]
#
# By default: cleans Rust target dir and Vite dist
# -All: also removes node_modules (full reset)

param([switch]$All)

$Root = Split-Path $PSScriptRoot -Parent

function Remove-IfExists {
    param($Path, $Label)
    if (Test-Path $Path) {
        Write-Host "  removing  $Label" -ForegroundColor Yellow
        Remove-Item -Recurse -Force $Path
        Write-Host "  [OK] done" -ForegroundColor Green
    } else {
        Write-Host "  [skip] $Label not found" -ForegroundColor Gray
    }
}

Write-Host "`n  QuickNote - Clean" -ForegroundColor Magenta
Write-Host "  ==================" -ForegroundColor Magenta

Remove-IfExists (Join-Path $Root "src-tauri\target") "Rust target dir"
Remove-IfExists (Join-Path $Root "dist")             "Vite dist"

if ($All) {
    Remove-IfExists (Join-Path $Root "node_modules") "node_modules"
    Write-Host "`n  Run .\scripts\dev.ps1 to reinstall and start fresh." -ForegroundColor Cyan
}

Write-Host "`n  Clean complete.`n" -ForegroundColor Green
