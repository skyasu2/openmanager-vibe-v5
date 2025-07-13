# -*- coding: utf-8 -*-
# Claude Usage Monitor for Windows PowerShell
# Simple and effective token usage tracking for Claude Code
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

param(
    [string]$Command = "blocks",
    [switch]$Live,
    [switch]$Active,
    [switch]$Breakdown,
    [switch]$Json,
    [string]$Since,
    [string]$Until,
    [switch]$Help
)

# Color definitions
$colors = @{
    Header = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "Blue"
    Default = "White"
}

function Write-ColorText($Text, $Color = "Default") {
    $ForegroundColor = $colors[$Color]
    if ($ForegroundColor) {
        Write-Host $Text -ForegroundColor $ForegroundColor
    } else {
        Write-Host $Text
    }
}

function Show-Help {
    Write-ColorText "`n🤖 Claude Usage Monitor" "Header"
    Write-ColorText "=" * 50 "Header"
    
    Write-Host "`nUSAGE:"
    Write-Host "  .\claude-monitor.ps1 [command] [options]"
    
    Write-Host "`nCOMMANDS:"
    Write-Host "  blocks    View 5-hour usage blocks (default)"
    Write-Host "  daily     View daily usage breakdown"
    Write-Host "  session   View current session statistics"
    
    Write-Host "`nOPTIONS:"
    Write-Host "  -Live        Enable live dashboard mode"
    Write-Host "  -Active      Show only active block"
    Write-Host "  -Breakdown   Show detailed breakdown"
    Write-Host "  -Json        Output in JSON format"
    Write-Host "  -Since       Start date (YYYYMMDD)"
    Write-Host "  -Until       End date (YYYYMMDD)"
    Write-Host "  -Help        Show this help message"
    
    Write-Host "`nEXAMPLES:"
    Write-ColorText "`n  # View current active block" "Info"
    Write-Host "  .\claude-monitor.ps1 blocks -Active"
    
    Write-ColorText "`n  # Live dashboard" "Info"
    Write-Host "  .\claude-monitor.ps1 blocks -Live"
    
    Write-ColorText "`n  # Daily usage for this month" "Info"
    Write-Host "  .\claude-monitor.ps1 daily"
    
    Write-ColorText "`n  # Date range query" "Info"
    Write-Host "  .\claude-monitor.ps1 blocks -Since 20250701 -Until 20250731"
    
    Write-Host "`n"
}

function Test-NodeInstallation {
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

function Test-CcusageInstallation {
    try {
        $result = npx ccusage@latest --help 2>&1
        if ($result -match "ccusage") {
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

function Build-CcusageCommand {
    $args = @("ccusage@latest", $Command)
    
    if ($Live) { $args += "--live" }
    if ($Active) { $args += "--active" }
    if ($Breakdown) { $args += "--breakdown" }
    if ($Json) { $args += "--json" }
    if ($Since) { $args += "--since", $Since }
    if ($Until) { $args += "--until", $Until }
    
    return $args
}

function Show-QuickStats {
    Write-ColorText "`n📊 Claude Token Usage Summary" "Header"
    Write-ColorText ("=" * 50) "Header"
    
    try {
        # Get active block data
        $result = npx ccusage@latest blocks --active --json 2>$null | Out-String
        if ($result) {
            $data = $result | ConvertFrom-Json
            
            if ($data.blocks -and $data.blocks.Count -gt 0) {
                $activeBlock = $data.blocks[0]
                $tokens = $activeBlock.totalTokens
                $maxTokens = 880000
                $percentage = [math]::Round(($tokens / $maxTokens) * 100, 1)
                
                # Calculate time remaining
                $endTime = [DateTime]::Parse($activeBlock.endTime)
                $now = [DateTime]::UtcNow
                $remaining = $endTime - $now
                
                Write-Host "`nActive Block:"
                Write-Host "  Tokens Used: " -NoNewline
                Write-ColorText ("{0:N0} / {1:N0} ({2}%)" -f $tokens, $maxTokens, $percentage) $(
                    if ($percentage -gt 80) { "Error" }
                    elseif ($percentage -gt 60) { "Warning" }
                    else { "Success" }
                )
                
                Write-Host "  Time Remaining: " -NoNewline
                Write-ColorText ("{0}h {1}m" -f [math]::Floor($remaining.TotalHours), $remaining.Minutes) "Info"
                
                if ($activeBlock.burnRate) {
                    Write-Host "  Burn Rate: " -NoNewline
                    Write-ColorText ("{0:N0} tokens/min" -f $activeBlock.burnRate.tokensPerMinute) "Default"
                }
            } else {
                Write-ColorText "No active session found." "Warning"
            }
        }
    } catch {
        Write-ColorText "Error retrieving usage data: $_" "Error"
    }
    
    Write-Host "`n"
}

# Main execution
Clear-Host

# Show help if requested
if ($Help) {
    Show-Help
    exit 0
}

# Check prerequisites
Write-ColorText "🔍 Checking prerequisites..." "Info"

if (-not (Test-NodeInstallation)) {
    Write-ColorText "`n❌ Node.js is not installed!" "Error"
    Write-Host "   Please install Node.js from https://nodejs.org/"
    exit 1
}

if (-not (Test-CcusageInstallation)) {
    Write-ColorText "`n⚠️  ccusage not found. It will be downloaded on first run." "Warning"
}

# Show quick stats if no special options
if (-not ($Live -or $Json -or $Since -or $Until -or $Breakdown)) {
    Show-QuickStats
}

# Build and execute ccusage command
$ccusageArgs = Build-CcusageCommand
Write-ColorText "`n🚀 Running ccusage..." "Info"
Write-Host "Command: npx $($ccusageArgs -join ' ')" -ForegroundColor DarkGray

try {
    & npx @ccusageArgs
} catch {
    Write-ColorText "`n❌ Error running ccusage: $_" "Error"
    exit 1
}

# Show additional tips
if (-not ($Json -or $Live)) {
    Write-Host "`n" 
    Write-ColorText "💡 Quick Commands:" "Info"
    Write-Host "  .\claude-monitor.ps1 -Live           # Live dashboard"
    Write-Host "  .\claude-monitor.ps1 daily            # Daily breakdown"
    Write-Host "  .\claude-monitor.ps1 session          # Current session"
    Write-Host ""
}