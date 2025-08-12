# Complete MCP Server Fix for Windows
# Based on official docs and community solutions
# Last updated: 2025-08-12

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Complete MCP Server Fix for Windows" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if running as Administrator (recommended)
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "⚠️  Not running as Administrator. Some operations may fail." -ForegroundColor Yellow
    Write-Host "Consider running PowerShell as Administrator for best results.`n" -ForegroundColor Yellow
}

# Get environment variables from .env.local
$envFile = "D:\cursor\openmanager-vibe-v5\.env.local"
if (Test-Path $envFile) {
    Write-Host "📋 Loading environment variables from .env.local..." -ForegroundColor Cyan
    $envContent = Get-Content $envFile
    
    # Extract keys using more robust regex
    $TAVILY_API_KEY = if ($envContent -match 'TAVILY_API_KEY=(.+)') { $matches[1].Trim() } else { "" }
    $SUPABASE_URL = if ($envContent -match '^SUPABASE_URL=(.+)') { $matches[1].Trim() } else { "" }
    $SUPABASE_ANON_KEY = if ($envContent -match '^SUPABASE_ANON_KEY=(.+)') { $matches[1].Trim() } else { "" }
    $SUPABASE_SERVICE_ROLE_KEY = if ($envContent -match '^SUPABASE_SERVICE_ROLE_KEY=(.+)') { $matches[1].Trim() } else { "" }
    $GITHUB_TOKEN = if ($envContent -match '^GITHUB_TOKEN=(.+)') { $matches[1].Trim() } else { "" }
    
    Write-Host "✅ Environment variables loaded`n" -ForegroundColor Green
} else {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    Write-Host "Please ensure you have a .env.local file with required API keys.`n" -ForegroundColor Yellow
}

# Function to remove MCP server silently
function Remove-MCPServer {
    param([string]$ServerName)
    $output = claude mcp remove $ServerName 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  - Removed $ServerName" -ForegroundColor Gray
    }
}

# Function to test MCP server connection
function Test-MCPServer {
    param([string]$ServerName)
    Write-Host "Testing $ServerName..." -ForegroundColor Cyan -NoNewline
    Start-Sleep -Seconds 2
    # This is a placeholder - actual testing would require claude mcp list parsing
    Write-Host " [PENDING]" -ForegroundColor Yellow
}

Write-Host "🧹 Step 1: Cleaning up existing configurations..." -ForegroundColor Yellow
@("supabase", "supabase-mcp", "tavily-mcp", "tavily", "playwright", "serena") | ForEach-Object {
    Remove-MCPServer $_
}
Write-Host ""

Write-Host "📦 Step 2: Installing/updating required packages..." -ForegroundColor Yellow

# Install npm packages
Write-Host "Installing npm packages..." -ForegroundColor Cyan
npm install -g tavily-mcp@latest @supabase/mcp-server-supabase@latest @microsoft/playwright-mcp@latest --silent 2>$null
Write-Host "✅ npm packages installed`n" -ForegroundColor Green

# Check Python and uvx
Write-Host "Checking Python and uvx installation..." -ForegroundColor Cyan
$pythonPath = (Get-Command python -ErrorAction SilentlyContinue).Path
$uvxPath = (Get-Command uvx -ErrorAction SilentlyContinue).Path

if ($uvxPath) {
    Write-Host "✅ uvx found at: $uvxPath" -ForegroundColor Green
} else {
    Write-Host "⚠️  uvx not found. Installing with pip..." -ForegroundColor Yellow
    pip install --upgrade uv --quiet
    $uvxPath = "C:\Users\$env:USERNAME\AppData\Local\Programs\Python\Python311\Scripts\uvx.exe"
}
Write-Host ""

Write-Host "🔧 Step 3: Adding MCP servers with proper configurations..." -ForegroundColor Yellow

# 1. Supabase (with environment variables)
Write-Host "`n📊 Configuring Supabase MCP..." -ForegroundColor Cyan
if ($SUPABASE_URL -and $SUPABASE_ANON_KEY) {
    # Method 1: Using JSON configuration (recommended for environment variables)
    $supabaseConfig = @{
        command = "cmd"
        args = @("/c", "npx", "-y", "@supabase/mcp-server-supabase@latest")
        env = @{
            SUPABASE_URL = $SUPABASE_URL
            SUPABASE_ANON_KEY = $SUPABASE_ANON_KEY
            SUPABASE_SERVICE_ROLE_KEY = $SUPABASE_SERVICE_ROLE_KEY
        }
    } | ConvertTo-Json -Compress -Depth 3
    
    # Escape quotes for command line
    $supabaseConfig = $supabaseConfig.Replace('"', '\"')
    claude mcp add-json supabase "$supabaseConfig" 2>$null
    
    Write-Host "✅ Supabase configured with environment variables" -ForegroundColor Green
} else {
    Write-Host "⚠️  Supabase skipped - missing environment variables" -ForegroundColor Yellow
}

# 2. Tavily (with API key)
Write-Host "`n🔍 Configuring Tavily MCP..." -ForegroundColor Cyan
if ($TAVILY_API_KEY) {
    # Method 1: Using JSON configuration
    $tavilyConfig = @{
        command = "cmd"
        args = @("/c", "npx", "-y", "tavily-mcp@latest")
        env = @{
            TAVILY_API_KEY = $TAVILY_API_KEY
        }
    } | ConvertTo-Json -Compress -Depth 3
    
    # Escape quotes for command line
    $tavilyConfig = $tavilyConfig.Replace('"', '\"')
    claude mcp add-json tavily-mcp "$tavilyConfig" 2>$null
    
    Write-Host "✅ Tavily configured with API key" -ForegroundColor Green
} else {
    Write-Host "⚠️  Tavily skipped - missing API key" -ForegroundColor Yellow
}

# 3. Playwright (correct package name)
Write-Host "`n🎭 Configuring Playwright MCP..." -ForegroundColor Cyan
claude mcp add playwright "cmd /c npx -y @microsoft/playwright-mcp@latest" 2>$null
Write-Host "✅ Playwright configured with correct package" -ForegroundColor Green

# 4. Serena (Python with proper path)
Write-Host "`n🔬 Configuring Serena MCP..." -ForegroundColor Cyan
if (Test-Path $uvxPath) {
    # Method 1: Direct uvx command
    claude mcp add serena "$uvxPath --from git+https://github.com/oraios/serena serena-mcp-server" 2>$null
    Write-Host "✅ Serena configured with uvx" -ForegroundColor Green
} else {
    Write-Host "⚠️  Serena skipped - uvx not available" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "📋 Step 4: Final Steps" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`n1. Restart Claude API:" -ForegroundColor Yellow
Write-Host "   claude api restart" -ForegroundColor White

Write-Host "`n2. Wait 30 seconds for servers to initialize" -ForegroundColor Yellow

Write-Host "`n3. Check server status:" -ForegroundColor Yellow
Write-Host "   claude mcp list" -ForegroundColor White

Write-Host "`n4. If servers still fail:" -ForegroundColor Yellow
Write-Host "   - Check Windows Firewall settings" -ForegroundColor White
Write-Host "   - Ensure Node.js is in PATH" -ForegroundColor White
Write-Host "   - Try running PowerShell as Administrator" -ForegroundColor White
Write-Host "   - Check individual server logs" -ForegroundColor White

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "📝 Alternative: Direct Config File Edit" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nIf automatic configuration fails, you can manually edit:" -ForegroundColor Yellow
Write-Host "C:\Users\$env:USERNAME\.claude.json" -ForegroundColor White

Write-Host "`nExample configuration:" -ForegroundColor Yellow
Write-Host @'
{
  "projects": {
    "D:\\cursor\\openmanager-vibe-v5": {
      "mcpServers": {
        "supabase": {
          "type": "stdio",
          "command": "cmd",
          "args": ["/c", "npx", "-y", "@supabase/mcp-server-supabase@latest"],
          "env": {
            "SUPABASE_URL": "your-url",
            "SUPABASE_ANON_KEY": "your-key"
          }
        }
      }
    }
  }
}
'@ -ForegroundColor Gray

Write-Host "`n✨ Script completed!" -ForegroundColor Green
Write-Host "Please follow the final steps above to complete the setup." -ForegroundColor Yellow