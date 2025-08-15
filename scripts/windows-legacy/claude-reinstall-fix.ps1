# Claude CLI Complete Reinstall Fix
# Final solution for npm-global vs unknown config mismatch

Write-Host "🔧 Claude CLI Complete Reinstall Fix..." -ForegroundColor Green

# 1. Backup current config
Write-Host "`n💾 Backing up current configuration..." -ForegroundColor Yellow
$claudeDir = "$env:USERPROFILE\.claude"
$backupDir = "claude-config-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

if (Test-Path $claudeDir) {
    Copy-Item $claudeDir -Destination $backupDir -Recurse -Force
    Write-Host "✅ Config backed up to: $backupDir" -ForegroundColor Green
}

# 2. Completely uninstall Claude CLI
Write-Host "`n🗑️ Uninstalling Claude CLI..." -ForegroundColor Yellow
try {
    npm uninstall -g @anthropic-ai/claude-code 2>$null
    Write-Host "✅ Claude CLI uninstalled" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Uninstall may have failed, continuing..." -ForegroundColor Yellow
}

# 3. Clear all caches and configs
Write-Host "`n🧹 Clearing all caches..." -ForegroundColor Yellow
npm cache clean --force 2>$null
Remove-Item $claudeDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ Caches and configs cleared" -ForegroundColor Green

# 4. Reinstall Claude CLI
Write-Host "`n📦 Reinstalling Claude CLI..." -ForegroundColor Yellow
try {
    npm install -g @anthropic-ai/claude-code
    Write-Host "✅ Claude CLI reinstalled" -ForegroundColor Green
} catch {
    Write-Host "❌ Reinstall failed: $_" -ForegroundColor Red
    exit 1
}

# 5. Verify installation
Write-Host "`n🧪 Verifying installation..." -ForegroundColor Yellow
$version = claude --version 2>$null
if ($version) {
    Write-Host "✅ Claude CLI version: $version" -ForegroundColor Green
} else {
    Write-Host "❌ Claude CLI not working after reinstall" -ForegroundColor Red
    exit 1
}

# 6. Run doctor to check config
Write-Host "`n🏥 Running diagnostics..." -ForegroundColor Yellow
claude doctor

# 7. Restore backed up settings if needed
if (Test-Path "$backupDir\settings.json") {
    Write-Host "`n🔄 Restoring previous settings..." -ForegroundColor Yellow
    $backupSettings = Get-Content "$backupDir\settings.json" -Raw | ConvertFrom-Json
    
    # Only restore user preferences, not install method
    $newSettings = @{
        allowedTools = $backupSettings.allowedTools
        hasTrustDialogAccepted = $backupSettings.hasTrustDialogAccepted
    }
    
    # Apply restored settings
    foreach ($key in $newSettings.Keys) {
        if ($newSettings[$key]) {
            claude config set $key $newSettings[$key] 2>$null
        }
    }
    Write-Host "✅ User settings restored" -ForegroundColor Green
}

Write-Host "`n✅ Claude CLI reinstall complete!" -ForegroundColor Green
Write-Host "The config mismatch should now be resolved." -ForegroundColor Green