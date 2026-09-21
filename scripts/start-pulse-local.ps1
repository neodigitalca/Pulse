# Start Pulse with the AISEO Polish menu on http://localhost:8080
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Set-Location ..

Write-Host "=== Pulse local setup ===" -ForegroundColor Cyan

Write-Host "Updating main from origin..."
git fetch origin main
git checkout main 2>$null
git pull origin main

$sha = (git rev-parse --short HEAD).Trim()
$clusterFile = "src/lib/overview/overview-bulk-action-clusters.ts"
$hasPolish = (Select-String -Path $clusterFile -Pattern "content-polish" -Quiet)
if (-not $hasPolish) {
  Write-Host "Polish menu not in this checkout. Trying feature branch..." -ForegroundColor Yellow
  git fetch origin cursor/polish-aiseo-main-29e7
  git checkout cursor/polish-aiseo-main-29e7
  git pull origin cursor/polish-aiseo-main-29e7
  $sha = (git rev-parse --short HEAD).Trim()
  $hasPolish = (Select-String -Path $clusterFile -Pattern "content-polish" -Quiet)
}
if (-not $hasPolish) {
  throw "Polish menu still missing. Merge PR #3 or pull latest main."
}

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing npm dependencies..."
  npm install
}

Write-Host ""
Write-Host "Docker / WP Staging (optional for API only):" -ForegroundColor Cyan
Write-Host "  Start WP Staging site neopulse.local in the desktop app if you want local /api."
Write-Host "  The React UI (Polish menu) does NOT come from Docker — only Vite on port 8080."
Write-Host ""
Write-Host "Starting Vite (git $sha)..." -ForegroundColor Green
Write-Host "Use http://localhost:8080 — NOT the WP Admin NEO Pulse iframe."
Write-Host ""

npm run dev:local
