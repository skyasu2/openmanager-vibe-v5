# Claude Code Automation Engine Starter (Windows PowerShell)
# Alternative solution for Claude Code CLI hooks not supported

param(
    [switch]$Monitor,     # Monitor only
    [switch]$Quality,     # Quality checks only  
    [switch]$Background,  # Background execution
    [switch]$Stop,        # Stop engine
    [switch]$Status       # Show status
)

$ErrorActionPreference = "Continue"

# Color output function
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    switch ($Color) {
        "Red" { Write-Host $Message -ForegroundColor Red }
        "Green" { Write-Host $Message -ForegroundColor Green }
        "Yellow" { Write-Host $Message -ForegroundColor Yellow }
        "Blue" { Write-Host $Message -ForegroundColor Blue }
        "Cyan" { Write-Host $Message -ForegroundColor Cyan }
        default { Write-Host $Message }
    }
}

function Show-Header {
    Write-Host ""
    Write-ColorOutput "Claude Code Automation Engine v3.0" "Cyan"
    Write-ColorOutput "========================================" "Blue"
    Write-ColorOutput "Solving Claude CLI hooks not supported" "Yellow"
    Write-ColorOutput "Real-time automation + monitoring + quality checks" "Green"
    Write-Host ""
}

function Test-Prerequisites {
    Write-ColorOutput "Checking prerequisites..." "Blue"
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-ColorOutput "Node.js: $nodeVersion" "Green"
    } catch {
        Write-ColorOutput "Node.js is not installed" "Red"
        return $false
    }
    
    # Check project root
    if (-not (Test-Path "package.json")) {
        Write-ColorOutput "package.json not found. Run from project root." "Red"
        return $false
    }
    
    # Check MCP servers
    try {
        $mcpList = claude mcp list 2>$null
        $mcpCount = ($mcpList -split "`n" | Where-Object { $_ -match ":" }).Count
        Write-ColorOutput "MCP servers detected: $mcpCount" "Green"
    } catch {
        Write-ColorOutput "Claude MCP check failed (continuing)" "Yellow"
    }
    
    return $true
}

function Start-AutomationEngine {
    param([string]$Mode = "full")
    
    Write-ColorOutput "Starting automation engine..." "Blue"
    
    switch ($Mode) {
        "monitor" {
            Write-ColorOutput "Monitor mode" "Cyan"
            node scripts/claude/automation-engine.js --monitor-only
        }
        "quality" {
            Write-ColorOutput "Quality check mode" "Cyan"
            node scripts/claude/automation-engine.js --quality-only
        }
        "background" {
            Write-ColorOutput "Background mode" "Cyan"
            Start-Process -WindowStyle Hidden node -ArgumentList "scripts/claude/automation-engine.js"
            Write-ColorOutput "Running in background" "Green"
            return
        }
        default {
            Write-ColorOutput "Full mode" "Cyan"
            node scripts/claude/automation-engine.js
        }
    }
}

function Stop-AutomationEngine {
    Write-ColorOutput "Stopping automation engine..." "Yellow"
    
    # Find Node.js processes
    $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | 
                 Where-Object { $_.CommandLine -like "*automation-engine*" }
    
    if ($processes) {
        $processes | ForEach-Object { 
            Stop-Process -Id $_.Id -Force 
            Write-ColorOutput "Process stopped: PID $($_.Id)" "Green"
        }
    } else {
        Write-ColorOutput "No automation engine running" "Blue"
    }
}

function Show-Status {
    Write-ColorOutput "Automation Engine Status" "Blue"
    
    # Check running processes
    $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | 
                 Where-Object { $_.CommandLine -like "*automation-engine*" }
    
    if ($processes) {
        Write-ColorOutput "Running: $($processes.Count) processes" "Green"
        $processes | ForEach-Object {
            $uptime = (Get-Date) - $_.StartTime
            Write-ColorOutput "   PID: $($_.Id), Uptime: $($uptime.ToString('hh\:mm\:ss'))" "White"
        }
    } else {
        Write-ColorOutput "Stopped" "Red"
    }
    
    # MCP server status
    try {
        Write-ColorOutput "`nMCP Server Status:" "Blue"
        $mcpOutput = claude mcp list 2>$null
        if ($mcpOutput) {
            $mcpLines = $mcpOutput -split "`n" | Where-Object { $_ -match ":" }
            foreach ($line in $mcpLines) {
                if ($line -match "failed|error|disconnected") {
                    Write-ColorOutput "$line" "Red"
                } else {
                    Write-ColorOutput "$line" "Green"
                }
            }
        }
    } catch {
        Write-ColorOutput "MCP status check failed" "Yellow"
    }
    
    # Recent quality score
    $qualityFile = ".claude/quality-report.json"
    if (Test-Path $qualityFile) {
        try {
            $quality = Get-Content $qualityFile | ConvertFrom-Json
            Write-ColorOutput "`nLatest Quality Score: $($quality.score)%" "Blue"
            Write-ColorOutput "   Last check: $($quality.timestamp)" "White"
        } catch {
            Write-ColorOutput "Quality report read failed" "Yellow"
        }
    }
}

function Show-Help {
    Write-Host ""
    Write-ColorOutput "Usage:" "Blue"
    Write-Host ""
    Write-ColorOutput "  .\start-automation.ps1              " "White" -NoNewline
    Write-ColorOutput "# Start full automation" "Green"
    Write-ColorOutput "  .\start-automation.ps1 -Monitor     " "White" -NoNewline  
    Write-ColorOutput "# Monitor only" "Green"
    Write-ColorOutput "  .\start-automation.ps1 -Quality     " "White" -NoNewline
    Write-ColorOutput "# Quality checks only" "Green"
    Write-ColorOutput "  .\start-automation.ps1 -Background  " "White" -NoNewline
    Write-ColorOutput "# Background execution" "Green"
    Write-ColorOutput "  .\start-automation.ps1 -Stop        " "White" -NoNewline
    Write-ColorOutput "# Stop engine" "Green"
    Write-ColorOutput "  .\start-automation.ps1 -Status      " "White" -NoNewline
    Write-ColorOutput "# Show status" "Green"
    Write-Host ""
    Write-ColorOutput "Key Features:" "Blue"
    Write-ColorOutput "  - File change detection and auto processing" "White"
    Write-ColorOutput "  - Real-time MCP server monitoring" "White"
    Write-ColorOutput "  - Automated code quality checks" "White"
    Write-ColorOutput "  - Test automation" "White"
    Write-ColorOutput "  - Security vulnerability scanning" "White"
    Write-ColorOutput "  - Large file modularization suggestions" "White"
    Write-Host ""
}

# Main execution logic
Show-Header

# Show help if no parameters
if ($args.Length -eq 0 -and -not $Monitor -and -not $Quality -and -not $Background -and -not $Stop -and -not $Status) {
    Show-Help
    exit 0
}

# Status check
if ($Status) {
    Show-Status
    exit 0
}

# Stop engine
if ($Stop) {
    Stop-AutomationEngine
    exit 0
}

# Check prerequisites
if (-not (Test-Prerequisites)) {
    Write-ColorOutput "Prerequisites not met" "Red"
    exit 1
}

# Determine execution mode
try {
    if ($Monitor) {
        Start-AutomationEngine "monitor"
    } elseif ($Quality) {
        Start-AutomationEngine "quality"  
    } elseif ($Background) {
        Start-AutomationEngine "background"
    } else {
        Start-AutomationEngine "full"
    }
    
    Write-ColorOutput "`nAutomation engine started successfully!" "Green"
    Write-ColorOutput "Check status: .\start-automation.ps1 -Status" "Blue"
    Write-ColorOutput "Stop: .\start-automation.ps1 -Stop" "Blue"
    
} catch {
    Write-ColorOutput "Failed to start automation engine: $($_.Exception.Message)" "Red"
    exit 1
}

Write-Host ""