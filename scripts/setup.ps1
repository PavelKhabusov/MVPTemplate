# MVPTemplate — Full Setup Script
# Usage: pwsh scripts/setup.ps1
# Runs: install deps → start Docker → configure env → push DB schema → optionally create admin

param(
    [string]$AdminEmail,
    [switch]$SkipDocker,
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Set-Location $Root

Write-Host "`n=== MVPTemplate Setup ===" -ForegroundColor Cyan

# --- 1. Install dependencies ---
if (-not $SkipInstall) {
    Write-Host "`n[1/5] Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Error "npm install failed"; exit 1 }
} else {
    Write-Host "`n[1/5] Skipping install (--SkipInstall)" -ForegroundColor DarkGray
}

# --- 2. Start Docker (PostgreSQL + Redis) ---
if (-not $SkipDocker) {
    Write-Host "`n[2/5] Starting Docker containers (PostgreSQL + Redis)..." -ForegroundColor Yellow
    docker compose -f apps/backend/docker/docker-compose.dev.yml up -d
    if ($LASTEXITCODE -ne 0) { Write-Error "Docker compose failed. Is Docker running?"; exit 1 }

    # Wait for PostgreSQL to be ready
    Write-Host "Waiting for PostgreSQL..." -ForegroundColor DarkGray
    $retries = 0
    do {
        Start-Sleep -Seconds 1
        $retries++
        docker exec $(docker ps -q -f "ancestor=postgres:16-alpine") pg_isready -U postgres 2>$null | Out-Null
    } while ($LASTEXITCODE -ne 0 -and $retries -lt 15)

    if ($retries -ge 15) { Write-Warning "PostgreSQL may not be ready yet, continuing anyway..." }
    else { Write-Host "PostgreSQL is ready." -ForegroundColor Green }
} else {
    Write-Host "`n[2/5] Skipping Docker (--SkipDocker)" -ForegroundColor DarkGray
}

# --- 3. Configure environment files ---
Write-Host "`n[3/5] Configuring environment..." -ForegroundColor Yellow

$backendEnv = "apps/backend/.env"
$mobileEnv = "apps/mobile/.env"

if (-not (Test-Path $backendEnv)) {
    Copy-Item "apps/backend/.env.example" $backendEnv
    # Generate JWT secrets
    $accessSecret = -join ((1..32) | ForEach-Object { "{0:x2}" -f (Get-Random -Max 256) })
    $refreshSecret = -join ((1..32) | ForEach-Object { "{0:x2}" -f (Get-Random -Max 256) })
    (Get-Content $backendEnv) `
        -replace 'change-me-access-secret-min-32-chars', $accessSecret `
        -replace 'change-me-refresh-secret-min-32-chars', $refreshSecret |
        Set-Content $backendEnv
    Write-Host "Created $backendEnv with generated JWT secrets" -ForegroundColor Green
} else {
    Write-Host "$backendEnv already exists, skipping" -ForegroundColor DarkGray
}

if (-not (Test-Path $mobileEnv)) {
    Copy-Item "apps/mobile/.env.example" $mobileEnv
    Write-Host "Created $mobileEnv" -ForegroundColor Green
} else {
    Write-Host "$mobileEnv already exists, skipping" -ForegroundColor DarkGray
}

# --- 4. Push database schema ---
Write-Host "`n[4/5] Pushing database schema..." -ForegroundColor Yellow
npm run db:push -w apps/backend
if ($LASTEXITCODE -ne 0) { Write-Error "db:push failed"; exit 1 }
Write-Host "Database schema pushed successfully" -ForegroundColor Green

# --- 5. Create admin user (optional) ---
if ($AdminEmail) {
    Write-Host "`n[5/5] Setting admin role for $AdminEmail..." -ForegroundColor Yellow
    $container = docker ps -q -f "ancestor=postgres:16-alpine"
    if ($container) {
        docker exec $container psql -U postgres -d mvp_template -c "UPDATE users SET role = 'admin' WHERE email = '$AdminEmail';"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Admin role set for $AdminEmail" -ForegroundColor Green
        } else {
            Write-Warning "Could not set admin. User may not exist yet — register first, then re-run:"
            Write-Host "  pwsh scripts/make-admin.ps1 -Email $AdminEmail" -ForegroundColor DarkGray
        }
    } else {
        Write-Warning "PostgreSQL container not found"
    }
} else {
    Write-Host "`n[5/5] No admin email specified, skipping. Use -AdminEmail to set one." -ForegroundColor DarkGray
}

# --- Done ---
Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host @"

Next steps:
  npm run dev              # Start everything (mobile + backend)
  npm run dev:mobile       # Frontend only (demo mode)
  npm run dev:backend      # Backend only

Useful commands:
  pwsh scripts/make-admin.ps1 -Email user@example.com   # Grant admin role
  pwsh scripts/reset-db.ps1                              # Reset database
  npm run db:studio -w apps/backend                      # Open Drizzle Studio

"@ -ForegroundColor White
