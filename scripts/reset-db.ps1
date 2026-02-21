# Reset database — drops all tables and re-pushes schema
# Usage: pwsh scripts/reset-db.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Set-Location $Root

$container = docker ps -q -f "ancestor=postgres:16-alpine"
if (-not $container) {
    Write-Error "PostgreSQL container is not running. Start it first: docker compose -f apps/backend/docker/docker-compose.dev.yml up -d"
    exit 1
}

Write-Host "This will DROP all tables in mvp_template and re-create them." -ForegroundColor Red
$confirm = Read-Host "Are you sure? (y/N)"
if ($confirm -ne 'y') {
    Write-Host "Cancelled." -ForegroundColor DarkGray
    exit 0
}

Write-Host "Dropping all tables..." -ForegroundColor Yellow
docker exec $container psql -U postgres -d mvp_template -c "
DO `$`$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END `$`$;
"

Write-Host "Re-pushing schema..." -ForegroundColor Yellow
npm run db:push -w apps/backend
if ($LASTEXITCODE -eq 0) {
    Write-Host "Database reset complete." -ForegroundColor Green
}
