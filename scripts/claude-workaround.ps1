# Claude CLI Workaround Script
# Use this while the config mismatch exists

param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Arguments
)

Write-Host "🔧 Claude CLI Workaround (fixing config mismatch)..." -ForegroundColor Green

# Set proper environment variables
$env:HOME = $env:USERPROFILE
$env:CLAUDE_CONFIG_DIR = "$env:USERPROFILE\.claude"
$env:CLAUDE_INSTALL_METHOD = "npm-global"

# Ensure config directory exists
if (!(Test-Path $env:CLAUDE_CONFIG_DIR)) {
    New-Item -ItemType Directory -Path $env:CLAUDE_CONFIG_DIR -Force | Out-Null
}

# Run Claude with proper environment
if ($Arguments) {
    & claude @Arguments
} else {
    Write-Host "Usage: .\scripts\claude-workaround.ps1 [claude-commands]" -ForegroundColor Yellow
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\scripts\claude-workaround.ps1 --version" -ForegroundColor White
    Write-Host "  .\scripts\claude-workaround.ps1 doctor" -ForegroundColor White
    Write-Host "  .\scripts\claude-workaround.ps1 config list" -ForegroundColor White
}