# Fix MCP Servers for Windows (Claude Code)
# Last updated: 2025-08-12

Write-Host "Fixing MCP Server Configurations for Windows..." -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Warning: Not running as Administrator. Some operations may fail." -ForegroundColor Yellow
}

# Remove all problematic servers first
Write-Host "`nRemoving problematic MCP servers..." -ForegroundColor Yellow
claude mcp remove serena 2>$null
claude mcp remove tavily-mcp 2>$null
claude mcp remove supabase 2>$null
claude mcp remove playwright 2>$null
claude mcp remove context7 2>$null
claude mcp remove shadcn-ui 2>$null

Write-Host "`nInstalling/updating required packages..." -ForegroundColor Yellow

# Install Python packages
Write-Host "Installing Python packages with pip..." -ForegroundColor Cyan
pip install --upgrade pip --quiet
pip install --upgrade serena-agent --quiet 2>$null

# Install npm packages globally
Write-Host "Installing npm packages globally..." -ForegroundColor Cyan
npm install -g tavily-mcp@latest context7-mcp-server@latest shadcn-ui-mcp-server@latest --silent

# Get environment variables from .env.local
$envFile = "D:\cursor\openmanager-vibe-v5\.env.local"
if (Test-Path $envFile) {
    Write-Host "`nLoading environment variables from .env.local..." -ForegroundColor Cyan
    $envContent = Get-Content $envFile
    
    # Extract keys
    $TAVILY_API_KEY = ($envContent | Select-String "TAVILY_API_KEY=(.+)").Matches[0].Groups[1].Value
    $SUPABASE_URL = ($envContent | Select-String "^SUPABASE_URL=(.+)").Matches[0].Groups[1].Value
    $SUPABASE_ANON_KEY = ($envContent | Select-String "^SUPABASE_ANON_KEY=(.+)").Matches[0].Groups[1].Value
    $SUPABASE_SERVICE_ROLE_KEY = ($envContent | Select-String "^SUPABASE_SERVICE_ROLE_KEY=(.+)").Matches[0].Groups[1].Value
    $GITHUB_TOKEN = ($envContent | Select-String "^GITHUB_TOKEN=(.+)").Matches[0].Groups[1].Value
}

Write-Host "`nAdding MCP servers with correct configurations..." -ForegroundColor Green

# Add Serena (Python uvx)
Write-Host "Adding Serena MCP server..." -ForegroundColor Cyan
$serenaConfig = @{
    command = "python"
    args = @("-m", "serena", "start-mcp-server")
    env = @{}
} | ConvertTo-Json -Compress
claude mcp add-json serena $serenaConfig

# Add Tavily MCP (with API key)
Write-Host "Adding Tavily MCP server..." -ForegroundColor Cyan
$tavilyConfig = @{
    command = "npx"
    args = @("-y", "tavily-mcp")
    env = @{
        TAVILY_API_KEY = $TAVILY_API_KEY
    }
} | ConvertTo-Json -Compress
claude mcp add-json tavily-mcp $tavilyConfig

# Add Supabase (with credentials)
Write-Host "Adding Supabase MCP server..." -ForegroundColor Cyan
$supabaseConfig = @{
    command = "npx"
    args = @("-y", "@supabase/mcp-server-supabase")
    env = @{
        SUPABASE_URL = $SUPABASE_URL
        SUPABASE_ANON_KEY = $SUPABASE_ANON_KEY
        SUPABASE_SERVICE_ROLE_KEY = $SUPABASE_SERVICE_ROLE_KEY
    }
} | ConvertTo-Json -Compress
claude mcp add-json supabase $supabaseConfig

# Add Playwright
Write-Host "Adding Playwright MCP server..." -ForegroundColor Cyan
claude mcp add playwright "npx -y @modelcontextprotocol/server-playwright"

# Add Context7
Write-Host "Adding Context7 MCP server..." -ForegroundColor Cyan
claude mcp add context7 "npx -y context7-mcp-server"

# Add ShadCN UI
Write-Host "Adding ShadCN UI MCP server..." -ForegroundColor Cyan
claude mcp add shadcn-ui "npx -y shadcn-ui-mcp-server"

Write-Host "`nRestarting Claude API..." -ForegroundColor Yellow
Start-Process -FilePath "claude" -ArgumentList "api", "restart" -NoNewWindow -Wait -RedirectStandardOutput NUL 2>$null

Write-Host "`nWaiting for API to restart (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "`nChecking MCP server status..." -ForegroundColor Green
claude mcp list

Write-Host "`n✅ MCP Server configuration completed!" -ForegroundColor Green
Write-Host "If any servers still fail, try:" -ForegroundColor Yellow
Write-Host "  1. Close and reopen Claude Code" -ForegroundColor White
Write-Host "  2. Run 'claude api restart' manually" -ForegroundColor White
Write-Host "  3. Check individual server logs with 'claude mcp logs <server-name>'" -ForegroundColor White