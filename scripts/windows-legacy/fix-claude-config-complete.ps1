# Complete Claude CLI Config Fix
# Addresses npm-global vs unknown config mismatch

Write-Host "🔧 Complete Claude CLI Config Fix..." -ForegroundColor Green

# 1. Stop any running Claude processes
Write-Host "`n🛑 Stopping Claude processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*claude*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "✅ Claude processes stopped" -ForegroundColor Green

# 2. Clear Claude config and cache
Write-Host "`n🧹 Clearing Claude config and cache..." -ForegroundColor Yellow
$claudeDir = "$env:USERPROFILE\.claude"

if (Test-Path $claudeDir) {
    # Backup existing config
    $backupDir = "$claudeDir\backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Copy-Item "$claudeDir\*" -Destination $backupDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Config backed up to: $backupDir" -ForegroundColor Green
    
    # Clear cache files
    Remove-Item "$claudeDir\cache" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item "$claudeDir\*.log" -Force -ErrorAction SilentlyContinue
    Remove-Item "$claudeDir\*.tmp" -Force -ErrorAction SilentlyContinue
}

# 3. Create fresh config with correct install method
Write-Host "`n📝 Creating fresh config..." -ForegroundColor Yellow
$configPath = "$claudeDir\settings.json"

$freshConfig = @{
    installMethod = "npm-global"
    version = "1.0.81"
    allowedTools = @()
    hasTrustDialogAccepted = $false
    autoUpdates = $true
    configVersion = "1.0"
}

# Ensure directory exists
if (!(Test-Path $claudeDir)) {
    New-Item -ItemType Directory -Path $claudeDir -Force | Out-Null
}

# Write fresh config
$freshConfig | ConvertTo-Json -Depth 3 | Out-File -FilePath $configPath -Encoding UTF8 -Force
Write-Host "✅ Fresh config created" -ForegroundColor Green

# 4. Update npm global package
Write-Host "`n📦 Updating Claude CLI package..." -ForegroundColor Yellow
try {
    npm update -g @anthropic-ai/claude-code 2>$null
    Write-Host "✅ Package updated" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Package update failed: $_" -ForegroundColor Yellow
}

# 5. Clear npm cache
Write-Host "`n🧹 Clearing npm cache..." -ForegroundColor Yellow
try {
    npm cache clean --force 2>$null
    Write-Host "✅ npm cache cleared" -ForegroundColor Green
} catch {
    Write-Host "⚠️ npm cache clear failed: $_" -ForegroundColor Yellow
}

# 6. Set environment variables
Write-Host "`n⚙️ Setting environment variables..." -ForegroundColor Yellow
$env:CLAUDE_CONFIG_DIR = $claudeDir
$env:HOME = $env:USERPROFILE
[Environment]::SetEnvironmentVariable("CLAUDE_CONFIG_DIR", $claudeDir, "User")
[Environment]::SetEnvironmentVariable("HOME", $env:USERPROFILE, "User")
Write-Host "✅ Environment variables set" -ForegroundColor Green

# 7. Wait and test
Write-Host "`n⏳ Waiting for changes to take effect..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 8. Final verification
Write-Host "`n🧪 Final verification..." -ForegroundColor Yellow
try {
    Write-Host "Config file contents:" -ForegroundColor Cyan
    Get-Content $configPath -Raw | Write-Host -ForegroundColor White
    
    Write-Host "`nRunning claude doctor..." -ForegroundColor Cyan
    $doctorResult = claude doctor 2>&1
    
    if ($doctorResult -like "*Config install method: npm-global*") {
        Write-Host "`n✅ SUCCESS: Config mismatch FIXED!" -ForegroundColor Green
        Write-Host "Claude CLI now correctly recognizes npm-global installation" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️ Config may still show as unknown" -ForegroundColor Yellow
        Write-Host "This might require a system restart or Claude CLI reinstall" -ForegroundColor Yellow
        
        # Show alternative solution
        Write-Host "`n💡 Alternative: Create Claude wrapper script" -ForegroundColor Cyan
        $wrapperScript = @"
#!/usr/bin/env node
process.env.CLAUDE_INSTALL_METHOD = 'npm-global';
require('$env:APPDATA/npm/node_modules/@anthropic-ai/claude-code/cli.js');
"@
        $wrapperPath = "scripts\claude-fixed.js"
        $wrapperScript | Out-File -FilePath $wrapperPath -Encoding UTF8 -Force
        Write-Host "Created wrapper script: $wrapperPath" -ForegroundColor Green
        Write-Host "Use: node scripts\claude-fixed.js [commands]" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Verification failed: $_" -ForegroundColor Red
}

Write-Host "`n✅ Complete Claude CLI config fix finished!" -ForegroundColor Green
Write-Host "💡 If issues persist, restart PowerShell or reinstall Claude CLI" -ForegroundColor Yellow