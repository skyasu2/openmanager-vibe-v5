# Claude Code Path Fix Script
# ERROR: ENOENT: no such file or directory, mkdir 'D:\cursor\openmanager-vibe-v5\:USERPROFILE\.claude'

Write-Host "Fixing Claude Code path error..." -ForegroundColor Green

# 1. Set up environment variables
Write-Host "Setting environment variables..." -ForegroundColor Yellow

# Check for USERPROFILE
if (-not $env:USERPROFILE) {
    Write-Host "USERPROFILE environment variable not found." -ForegroundColor Red
    exit 1
}

# Set HOME environment variable for Unix compatibility
if (-not $env:HOME) {
    [Environment]::SetEnvironmentVariable("HOME", $env:USERPROFILE, "User")
    $env:HOME = $env:USERPROFILE
    Write-Host "HOME environment variable set to: $env:HOME" -ForegroundColor Green
}

# Explicitly set CLAUDE_CONFIG_DIR
$claudeConfigDir = "$env:USERPROFILE\.claude"
[Environment]::SetEnvironmentVariable("CLAUDE_CONFIG_DIR", $claudeConfigDir, "User")
$env:CLAUDE_CONFIG_DIR = $claudeConfigDir
Write-Host "CLAUDE_CONFIG_DIR set to: $env:CLAUDE_CONFIG_DIR" -ForegroundColor Green

# 2. Check and create Claude config directory
Write-Host "Checking Claude config directory..." -ForegroundColor Yellow

if (Test-Path $env:CLAUDE_CONFIG_DIR) {
    Write-Host "Claude config directory already exists: $env:CLAUDE_CONFIG_DIR" -ForegroundColor Green
} else {
    Write-Host "Claude config directory not found, creating..." -ForegroundColor Yellow
    try {
        New-Item -ItemType Directory -Path $env:CLAUDE_CONFIG_DIR -Force | Out-Null
        Write-Host "Successfully created Claude config directory." -ForegroundColor Green
    } catch {
        Write-Host "Failed to create directory: $_" -ForegroundColor Red
        exit 1
    }
}

# 3. Check permissions
Write-Host "Checking permissions..." -ForegroundColor Yellow
try {
    $testFile = "$env:CLAUDE_CONFIG_DIR\test-write.tmp"
    "test" | Out-File -FilePath $testFile -Force
    Remove-Item $testFile -Force
    Write-Host "Write permissions are OK." -ForegroundColor Green
} catch {
    Write-Host "Write permissions check failed: $_" -ForegroundColor Red
}

# 4. Update PowerShell profile for persistence
Write-Host "Updating PowerShell profile..." -ForegroundColor Yellow

$profileContent = @"
# Set Claude Code environment variables
`$env:HOME = `$env:USERPROFILE
`$env:CLAUDE_CONFIG_DIR = "`$env:USERPROFILE\.claude"
"@

$profilePath = $PROFILE
if (-not (Test-Path $profilePath)) {
    New-Item -ItemType File -Path $profilePath -Force | Out-Null
}

$currentProfile = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue
if ($currentProfile -notlike "*CLAUDE_CONFIG_DIR*") {
    Add-Content -Path $profilePath -Value "`n$profileContent"
    Write-Host "PowerShell profile updated successfully." -ForegroundColor Green
} else {
    Write-Host "PowerShell profile already configured." -ForegroundColor Green
}

# 5. Final check
Write-Host "\nFinal verification..." -ForegroundColor Cyan
Write-Host "HOME: $env:HOME" -ForegroundColor White
Write-Host "USERPROFILE: $env:USERPROFILE" -ForegroundColor White  
Write-Host "CLAUDE_CONFIG_DIR: $env:CLAUDE_CONFIG_DIR" -ForegroundColor White

if (Test-Path "$env:CLAUDE_CONFIG_DIR\settings.json") {
    Write-Host "Claude settings.json file found." -ForegroundColor Green
} else {
    Write-Host "Claude settings.json not found (this is normal, it will be created on first run)." -ForegroundColor Yellow
}

Write-Host "\nClaude Code path fix complete!" -ForegroundColor Green
Write-Host "Changes will apply in a new PowerShell session." -ForegroundColor Yellow
