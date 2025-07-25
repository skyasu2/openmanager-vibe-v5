# MCP $ 8 �� �l��
# �1|: 2025-07-15

Write-Host "=== MCP $ 8 �� �l�� ===" -ForegroundColor Cyan
Write-Host "Claude Code MCP �   \ �� J� 8| ��i��.`n" -ForegroundColor Gray

# 1. X�� Ux
Write-Host "[1] X�� $ ��" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor DarkGray

$requiredEnvVars = @{
    "GITHUB_TOKEN" = "GitHub API a8��"
    "SUPABASE_URL" = "Supabase pt0�t� URL"
    "SUPABASE_SERVICE_ROLE_KEY" = "Supabase D� �"
    "TAVILY_API_KEY" = "Tavily � �� API"
}

$missingVars = @()

foreach ($var in $requiredEnvVars.Keys) {
    $userValue = [Environment]::GetEnvironmentVariable($var, "User")
    $processValue = [Environment]::GetEnvironmentVariable($var, "Process")
    
    if ($userValue) {
        Write-Host "   $var (��� �)" -ForegroundColor Green
        Write-Host "    ��: $($requiredEnvVars[$var])" -ForegroundColor DarkGray
        Write-Host "    : $($userValue.Substring(0, [Math]::Min(20, $userValue.Length)))..." -ForegroundColor DarkGray
    } elseif ($processValue) {
        Write-Host "  � $var (\8� ��)" -ForegroundColor Yellow
        Write-Host "    � ܤ\ �ܑ � �|���" -ForegroundColor Yellow
    } else {
        Write-Host "   $var (�$)" -ForegroundColor Red
        Write-Host "    ��: $($requiredEnvVars[$var])" -ForegroundColor DarkGray
        $missingVars += $var
    }
}

# 2. MCP $ | Ux
Write-Host "`n[2] MCP $ | X" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor DarkGray

$projectPath = Get-Location
$mcpPaths = @{
    "\� $" = "$projectPath\.claude\mcp.json"
    " \� $" = "$env:APPDATA\Claude\claude_desktop_config.json"
    "WSL H $" = "\\wsl$\Ubuntu\home\$env:USERNAME\.claude\claude_config.json"
}

foreach ($name in $mcpPaths.Keys) {
    $path = $mcpPaths[$name]
    if (Test-Path $path) {
        $size = (Get-Item $path).Length
        Write-Host "   $name" -ForegroundColor Green
        Write-Host "    �\: $path" -ForegroundColor DarkGray
        Write-Host "    l0: $size bytes" -ForegroundColor DarkGray
    } else {
        Write-Host "  - $name (�L)" -ForegroundColor Gray
    }
}

# 3. Claude Code \8� ��
Write-Host "`n[3] Claude Code � ��" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor DarkGray

$claudeProcs = Get-Process | Where-Object {$_.ProcessName -like "*claude*"}
if ($claudeProcs) {
    foreach ($proc in $claudeProcs) {
        Write-Host "   $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Green
        Write-Host "    T��: $([Math]::Round($proc.WorkingSet64 / 1MB, 2)) MB" -ForegroundColor DarkGray
    }
} else {
    Write-Host "   Claude Code  �� JL" -ForegroundColor Red
}

# 4. WSL X� Ux
Write-Host "`n[4] WSL X� ��" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor DarkGray

try {
    $wslStatus = wsl --status 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   WSL2 � ��" -ForegroundColor Green
        
        # WSL �� X�� Ux
        $wslEnvCheck = wsl bash -c "echo `$GITHUB_TOKEN" 2>$null
        if ($wslEnvCheck) {
            Write-Host "   WSL X�� �(" -ForegroundColor Green
        } else {
            Write-Host "  � WSL X�� ��" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "  � WSL �� Ux �(" -ForegroundColor Yellow
}

# 5. t� )� �
Write-Host "`n[5] �� t� )�" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor DarkGray

if ($missingVars.Count -gt 0) {
    Write-Host "`n=4 D X�� $ D�:" -ForegroundColor Red
    Write-Host "   �L �9D PowerShell( ��)� �X8�:`n" -ForegroundColor White
    
    foreach ($var in $missingVars) {
        Write-Host "   [Environment]::SetEnvironmentVariable('$var', 'your-value-here', 'User')" -ForegroundColor Cyan
    }
}

Write-Host "`n=� � t� \8�:" -ForegroundColor Cyan
Write-Host @"

1. X�� $ (PowerShell  �� �\):
   $(if ($missingVars.Count -gt 0) { " �9 �" } else { " D�" })

2. Claude Code D ��:
   taskkill /f /im claude.exe

3. WSL �ܑ (X�� �0T):
   wsl --shutdown
   
4. Claude Code ��:
   \� �T� �

5. MCP �� Ux:
   Claude Code� '/mcp' �%

"@ -ForegroundColor White

Write-Host "`n= �  ��t D�\ ��:" -ForegroundColor Yellow
Write-Host "   1. scripts/setup-mcp-env.ps1 �" -ForegroundColor Gray
Write-Host "   2. scripts/verify-mcp-servers.cjs �" -ForegroundColor Gray
Write-Host "   3. Claude Code \� Ux: %APPDATA%\Claude\logs" -ForegroundColor Gray

Write-Host "`n�� D�!" -ForegroundColor Green