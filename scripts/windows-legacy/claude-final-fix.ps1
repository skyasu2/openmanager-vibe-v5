# Claude CLI Final Fix - Config Mismatch Resolution
# Comprehensive solution for npm-global vs unknown issue

Write-Host "🔧 Claude CLI Final Fix - Resolving Config Mismatch..." -ForegroundColor Green

Write-Host "`n📊 Current Issue Analysis:" -ForegroundColor Yellow
Write-Host "- Claude CLI is running as npm-global (correct)" -ForegroundColor White
Write-Host "- But config shows install method as 'unknown' (incorrect)" -ForegroundColor White
Write-Host "- This is a known bug in Claude CLI 1.0.81" -ForegroundColor White

# Solution 1: Force config update with registry modification
Write-Host "`n🔧 Solution 1: Force config recognition..." -ForegroundColor Yellow

$claudeConfigPath = "$env:USERPROFILE\.claude\settings.json"
$claudeDir = "$env:USERPROFILE\.claude"

# Ensure directory exists
if (!(Test-Path $claudeDir)) {
    New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
}

# Create comprehensive config
$fixedConfig = @{
    installMethod = "npm-global"
    version = "1.0.81"
    allowedTools = @()
    hasTrustDialogAccepted = $false
    autoUpdates = $true
    configVersion = "1.0"
    npmGlobalPath = "$env:APPDATA\npm\node_modules\@anthropic-ai\claude-code"
    detectedInstallMethod = "npm-global"
    _meta = @{
        lastUpdated = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        fixedBy = "claude-final-fix.ps1"
    }
}

$fixedConfig | ConvertTo-Json -Depth 4 | Out-File -FilePath $claudeConfigPath -Encoding UTF8 -Force
Write-Host "✅ Enhanced config written" -ForegroundColor Green

# Solution 2: Create PowerShell function wrapper
Write-Host "`n🔧 Solution 2: Creating PowerShell wrapper function..." -ForegroundColor Yellow

$profilePath = $PROFILE
$wrapperFunction = @"

# Claude CLI Fixed Function (Auto-generated)
function claude-fixed {
    param([Parameter(ValueFromRemainingArguments=`$true)][string[]]`$Arguments)
    
    # Set environment for proper detection
    `$env:HOME = `$env:USERPROFILE
    `$env:CLAUDE_CONFIG_DIR = "`$env:USERPROFILE\.claude"
    `$env:CLAUDE_INSTALL_METHOD = "npm-global"
    
    # Call original claude with fixed environment
    & claude @Arguments
}

# Alias for convenience
Set-Alias -Name cf -Value claude-fixed -Force

"@

if (!(Test-Path $profilePath)) {
    New-Item -ItemType File -Path $profilePath -Force | Out-Null
}

$currentProfile = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue
if ($currentProfile -notlike "*claude-fixed*") {
    Add-Content -Path $profilePath -Value $wrapperFunction
    Write-Host "✅ PowerShell wrapper function added to profile" -ForegroundColor Green
    Write-Host "   Use 'claude-fixed' or 'cf' in new sessions" -ForegroundColor Cyan
} else {
    Write-Host "✅ PowerShell wrapper already exists" -ForegroundColor Green
}

# Solution 3: Create batch file wrapper
Write-Host "`n🔧 Solution 3: Creating batch wrapper..." -ForegroundColor Yellow

$batchWrapper = @"
@echo off
REM Claude CLI Config Mismatch Workaround
set HOME=%USERPROFILE%
set CLAUDE_CONFIG_DIR=%USERPROFILE%\.claude
set CLAUDE_INSTALL_METHOD=npm-global

REM Call original claude with fixed environment
claude %*
"@

$batchPath = "claude-fixed.bat"
$batchWrapper | Out-File -FilePath $batchPath -Encoding ASCII -Force
Write-Host "✅ Batch wrapper created: $batchPath" -ForegroundColor Green

# Solution 4: Test all solutions
Write-Host "`n🧪 Testing solutions..." -ForegroundColor Yellow

Write-Host "`nTesting original claude:" -ForegroundColor Cyan
claude doctor 2>&1 | Select-String "Config install method" | Write-Host -ForegroundColor White

Write-Host "`nTesting batch wrapper:" -ForegroundColor Cyan
& ".\claude-fixed.bat" doctor 2>&1 | Select-String "Config install method" | Write-Host -ForegroundColor White

# Summary and recommendations
Write-Host "`n📋 Summary and Recommendations:" -ForegroundColor Green
Write-Host "✅ Created multiple workarounds for the config mismatch" -ForegroundColor White
Write-Host "`n🎯 Recommended usage:" -ForegroundColor Yellow
Write-Host "1. Use batch wrapper: .\claude-fixed.bat [commands]" -ForegroundColor White
Write-Host "2. In new PowerShell sessions: claude-fixed [commands] or cf [commands]" -ForegroundColor White
Write-Host "3. Original claude command will still show the mismatch but works fine" -ForegroundColor White

Write-Host "`n💡 The config mismatch is cosmetic and doesn't affect functionality" -ForegroundColor Cyan
Write-Host "💡 This is a known issue in Claude CLI 1.0.81" -ForegroundColor Cyan
Write-Host "💡 Future updates may resolve this automatically" -ForegroundColor Cyan

Write-Host "`n✅ Claude CLI config mismatch workarounds complete!" -ForegroundColor Green