# Refresh local UI from the ASAP/Polish PR branch. Docker is WordPress only; Vite serves localhost:8080.
param(
  [string]$Branch = "cursor/asap-article-style-29e7"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot | Out-Null
Set-Location ..

Write-Host "Fetching origin..."
git fetch origin $Branch

Write-Host "Checking out $Branch..."
git checkout $Branch
git pull origin $Branch

$sha = (git rev-parse --short HEAD).Trim()
Write-Host "UI git SHA: $sha (should appear under NEO Pulse logo when showVersion is on)"

Write-Host ""
Write-Host "Start the UI (leave this running):"
Write-Host "  npm run dev:local"
Write-Host ""
Write-Host "Open http://localhost:8080/#generator -> Opt -> Posts or SAP -> AISEO -> Content -> Polish -> Short"
Write-Host ""
Write-Host "Docker (WordPress API only). Restart WP Staging site in the desktop app, or:"
Write-Host "  docker restart wpstg-neopulse-local-php"
Write-Host "If plugins are empty in the container, see docs/deploy-local-branching-pathway.md docker cp block."
