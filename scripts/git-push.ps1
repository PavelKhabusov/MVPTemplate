# Commit all changes and push to a feature branch
# Usage: pwsh scripts/git-push.ps1 -Message "what changed"
# Branch: claude/<date>-<short-message>

param(
    [Parameter(Mandatory=$true)]
    [string]$Message,
    [string]$Branch
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Set-Location $Root

# Generate branch name if not provided
if (-not $Branch) {
    $date = Get-Date -Format "yyyy-MM-dd"
    $slug = ($Message.ToLower() -replace '[^a-z0-9\s]', '' -replace '\s+', '-').Substring(0, [Math]::Min(40, $Message.Length))
    $Branch = "claude/$date-$slug"
}

# Check for changes
$status = git status --porcelain
if (-not $status) {
    Write-Host "No changes to commit." -ForegroundColor DarkGray
    exit 0
}

# Show what will be committed
Write-Host "`nChanges to commit:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Create branch, commit, push
$currentBranch = git branch --show-current

if ($currentBranch -ne $Branch) {
    Write-Host "Creating branch: $Branch" -ForegroundColor Cyan
    git checkout -b $Branch 2>$null
    if ($LASTEXITCODE -ne 0) {
        git checkout $Branch
    }
}

git add -A
git commit -m "$Message`n`nCo-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
if ($LASTEXITCODE -ne 0) { Write-Error "Commit failed"; exit 1 }

git push -u origin $Branch
if ($LASTEXITCODE -ne 0) { Write-Error "Push failed"; exit 1 }

Write-Host "`nPushed to branch: $Branch" -ForegroundColor Green
Write-Host "Create PR: gh pr create --base main --head $Branch" -ForegroundColor DarkGray
