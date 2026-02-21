# Stop infrastructure (PostgreSQL + Redis)
# Usage: pwsh scripts/docker-stop.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Set-Location $Root

Write-Host "Stopping containers..." -ForegroundColor Yellow
docker compose -f apps/backend/docker/docker-compose.dev.yml down
Write-Host "Infrastructure stopped." -ForegroundColor Green
