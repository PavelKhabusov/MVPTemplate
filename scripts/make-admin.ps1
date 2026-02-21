# Grant admin role to a user
# Usage: pwsh scripts/make-admin.ps1 -Email user@example.com

param(
    [Parameter(Mandatory=$true)]
    [string]$Email
)

$ErrorActionPreference = "Stop"

$container = docker ps -q -f "ancestor=postgres:16-alpine"
if (-not $container) {
    Write-Error "PostgreSQL container is not running. Start it first: docker compose -f apps/backend/docker/docker-compose.dev.yml up -d"
    exit 1
}

$result = docker exec $container psql -U postgres -d mvp_template -t -c "SELECT id, email, role FROM users WHERE email = '$Email';"
if (-not $result.Trim()) {
    Write-Error "User with email '$Email' not found. Register an account first."
    exit 1
}

docker exec $container psql -U postgres -d mvp_template -c "UPDATE users SET role = 'admin' WHERE email = '$Email';"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Admin role granted to $Email" -ForegroundColor Green
    Write-Host "Sign out and sign back in to see the Admin Panel." -ForegroundColor DarkGray
}
