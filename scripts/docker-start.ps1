# Start infrastructure (PostgreSQL + Redis)
# Usage: pwsh scripts/docker-start.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Set-Location $Root

Write-Host "Starting PostgreSQL + Redis..." -ForegroundColor Yellow
docker compose -f apps/backend/docker/docker-compose.dev.yml up -d
if ($LASTEXITCODE -ne 0) { Write-Error "Failed. Is Docker running?"; exit 1 }

Write-Host "Waiting for PostgreSQL..." -ForegroundColor DarkGray
$retries = 0
do {
    Start-Sleep -Seconds 1
    $retries++
    docker exec docker-postgres-1 pg_isready -U postgres 2>$null | Out-Null
} while ($LASTEXITCODE -ne 0 -and $retries -lt 15)

if ($retries -lt 15) {
    Write-Host "Infrastructure ready." -ForegroundColor Green
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "name=docker-"
} else {
    Write-Warning "PostgreSQL may still be starting..."
}
