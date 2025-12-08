$ErrorActionPreference = 'Stop'

$ConfigPath = "$env:USERPROFILE\.wslconfig"
$BackupDir = "$env:USERPROFILE\wsl-config-backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupPath = "$BackupDir\.wslconfig.$Timestamp.bak"

# Ensure backup directory exists
if (-not (Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
    Write-Host "Created backup directory: $BackupDir"
}

# Backup existing file if it exists
if (Test-Path -Path $ConfigPath) {
    Copy-Item -Path $ConfigPath -Destination $BackupPath
    Write-Host "Backed up existing config to: $BackupPath"
}

# Define new configuration content
$NewConfig = @'
[wsl2]
# Memory Settings
memory=20GB              # Minimum 16GB, Recommended 20GB
swap=10GB               # Swap memory

# CPU Settings
processors=8            # Number of CPU cores

# Networking (Required for MCP Servers)
networkingMode=mirrored # Mirrored mode required
dnsTunneling=true       # MCP DNS resolution required
autoProxy=true          # MCP proxy connection required
firewall=true           # Integrate with Windows firewall

# GUI Support
guiApplications=true      # Enable GUI applications

[experimental]
# Performance Optimization
autoMemoryReclaim=gradual  # Gradual memory reclamation
sparseVhd=true            # Enable VHD disk space reclamation
'@

# Write new configuration
Set-Content -Path $ConfigPath -Value $NewConfig -Encoding UTF8
Write-Host "Successfully updated .wslconfig with optimized settings."
Write-Host "Please run 'wsl --shutdown' in a standard command prompt/PowerShell to apply changes."
