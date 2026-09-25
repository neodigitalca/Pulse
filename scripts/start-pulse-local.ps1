# Pull main, start UI. API = neodigital.ca unless Docker is up (see start-local-docker.ps1).
$ErrorActionPreference = "Continue"
Set-Location (Join-Path $PSScriptRoot "..")

try {
    git fetch origin main 2>&1 | Out-Null
    git checkout main 2>&1 | Out-Null
    git reset --hard origin/main 2>&1 | Out-Null
} catch {}

if (-not (Test-Path "node_modules")) { npm install }

node scripts/start-pulse-local.cjs
