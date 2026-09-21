# Pull main, start UI. API = neodigital.ca unless Docker is up (see start-local-docker.ps1).
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

git fetch origin main 2>$null
git checkout main 2>$null
git reset --hard origin/main 2>$null

if (-not (Test-Path "node_modules")) { npm install }

node scripts/start-pulse-local.cjs
