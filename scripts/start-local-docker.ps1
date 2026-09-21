# WP Staging + Docker (neopulse.local). Run from repo root in PowerShell.
$ErrorActionPreference = "Continue"

Write-Host "Starting Docker container (if site exists)..." -ForegroundColor Cyan
docker start wpstg-neopulse-local-php 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Open WP Staging Desktop -> start site neopulse.local, then run this again." -ForegroundColor Yellow
}

Start-Sleep -Seconds 2
$env:PULSE_LOCAL_WP = "1"
& "$PSScriptRoot/start-pulse-local.ps1"
