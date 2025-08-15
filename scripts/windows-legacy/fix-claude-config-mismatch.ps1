# Claude CLI Config Mismatch Fix
# Issue: Running npm-global but config says unknown

Write-Host "🔧 Fixing Claude CLI config mismatch..." -ForegroundColor Green

# 1. Check current status
Write-Host "`n📊 Current Claude CLI Status:" -ForegroundColor Yellow
$claudeVersion = claude --version 2>$null
Write-Host "Version: $claudeVersion" -ForegroundColor White

# 2. Get Claude config directory
$claudeConfigDir = "$env:USERPROFILE\.claude"
Write-Host "Config Directory: $claudeConfigDir" -ForegroundColor White

# 3. Check if config directory exists
if (!(Test-Path $claudeConfigDir)) {
    Write-Host "Creating Claude config directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $claudeConfigDir -Force | Out-Null
    Write-Host "✅ Config directory created" -ForegroundColor Green
}

# 4. Check current config
$configPath = "$claudeConfigDir\settings.json"
if (Test-Path $configPath) {
    Write-Host "`n📄 Current config:" -ForegroundColor Yellow
    $currentConfig = Get-Content $configPath -Raw | ConvertFrom-Json
    Write-Host ($currentConfig | ConvertTo-Json -Depth 3) -ForegroundColor White
} else {
    Write-Host "`n📄 No existing config found" -ForegroundColor Yellow
}

# 5. Create/update config with proper install method
Write-Host "`n⚙️ Updating config to recognize npm-global installation..." -ForegroundColor Yellow

$newConfig = @{
    installMethod = "npm-global"
    allowedTools = @()
    hasTrustDialogAccepted = $false
    autoUpdates = $true
}

# If config exists, merge with existing settings
if (Test-Path $configPath) {
    try {
        $existingConfig = Get-Content $configPath -Raw | ConvertFrom-Json
        if ($existingConfig.allowedTools) {
            $newConfig.allowedTools = $existingConfig.allowedTools
        }
        if ($existingConfig.hasTrustDialogAccepted) {
            $newConfig.hasTrustDialogAccepted = $existingConfig.hasTrustDialogAccepted
        }
        Write-Host "✅ Merged with existing settings" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Could not parse existing config, creating new one" -ForegroundColor Yellow
    }
}

# Write updated config
try {
    $newConfig | ConvertTo-Json -Depth 3 | Out-File -FilePath $configPath -Encoding UTF8 -Force
    Write-Host "✅ Config updated successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to update config: $_" -ForegroundColor Red
    exit 1
}

# 6. Verify the fix
Write-Host "`n🧪 Verifying fix..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    $doctorOutput = claude doctor 2>&1
    Write-Host "Doctor output:" -ForegroundColor Cyan
    Write-Host $doctorOutput -ForegroundColor White
    
    if ($doctorOutput -like "*Config install method: npm-global*") {
        Write-Host "`n✅ SUCCESS: Config mismatch fixed!" -ForegroundColor Green
    } elseif ($doctorOutput -like "*Config install method: unknown*") {
        Write-Host "`n⚠️ Config still shows unknown - may need Claude restart" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Could not verify fix: $_" -ForegroundColor Red
}

# 7. Additional troubleshooting steps
Write-Host "`n💡 Additional steps if issue persists:" -ForegroundColor Cyan
Write-Host "1. Restart your terminal/PowerShell session" -ForegroundColor White
Write-Host "2. Run: npm update -g @anthropic-ai/claude-code" -ForegroundColor White
Write-Host "3. Clear npm cache: npm cache clean --force" -ForegroundColor White
Write-Host "4. Reinstall: npm uninstall -g @anthropic-ai/claude-code && npm install -g @anthropic-ai/claude-code" -ForegroundColor White

Write-Host "`n✅ Claude CLI config mismatch fix complete!" -ForegroundColor Green