# Add Missing MCP Servers Manually
# Last updated: 2025-08-12

Write-Host "Adding missing MCP servers manually..." -ForegroundColor Green

# Get environment variables from .env.local
$envFile = "D:\cursor\openmanager-vibe-v5\.env.local"
if (Test-Path $envFile) {
    Write-Host "Loading environment variables from .env.local..." -ForegroundColor Cyan
    $envContent = Get-Content $envFile
    
    # Extract keys
    $TAVILY_API_KEY = ($envContent | Select-String "TAVILY_API_KEY=(.+)").Matches[0].Groups[1].Value
    $SUPABASE_URL = ($envContent | Select-String "^SUPABASE_URL=(.+)").Matches[0].Groups[1].Value
    $SUPABASE_ANON_KEY = ($envContent | Select-String "^SUPABASE_ANON_KEY=(.+)").Matches[0].Groups[1].Value
    $SUPABASE_SERVICE_ROLE_KEY = ($envContent | Select-String "^SUPABASE_SERVICE_ROLE_KEY=(.+)").Matches[0].Groups[1].Value
    $GITHUB_TOKEN = ($envContent | Select-String "^GITHUB_TOKEN=(.+)").Matches[0].Groups[1].Value
}

# Read current config
$configFile = "C:\Users\skyas\.claude.json"
$config = Get-Content $configFile -Raw | ConvertFrom-Json

# Add Serena
Write-Host "Adding Serena MCP server..." -ForegroundColor Cyan
$config.projects.'D:\cursor\openmanager-vibe-v5'.mcpServers | Add-Member -NotePropertyName "serena" -NotePropertyValue @{
    type = "stdio"
    command = "uvx"
    args = @("--from", "git+https://github.com/oraios/serena", "serena-mcp-server")
    env = @{}
} -Force

# Add Tavily MCP
Write-Host "Adding Tavily MCP server..." -ForegroundColor Cyan
$config.projects.'D:\cursor\openmanager-vibe-v5'.mcpServers | Add-Member -NotePropertyName "tavily-mcp" -NotePropertyValue @{
    type = "stdio"
    command = "npx"
    args = @("-y", "tavily-mcp")
    env = @{
        TAVILY_API_KEY = $TAVILY_API_KEY
    }
} -Force

# Add Supabase
Write-Host "Adding Supabase MCP server..." -ForegroundColor Cyan
$config.projects.'D:\cursor\openmanager-vibe-v5'.mcpServers | Add-Member -NotePropertyName "supabase" -NotePropertyValue @{
    type = "stdio"
    command = "npx"
    args = @("-y", "@supabase/mcp-server-supabase")
    env = @{
        SUPABASE_URL = $SUPABASE_URL
        SUPABASE_ANON_KEY = $SUPABASE_ANON_KEY
        SUPABASE_SERVICE_ROLE_KEY = $SUPABASE_SERVICE_ROLE_KEY
    }
} -Force

# Fix Playwright (add cmd /c)
Write-Host "Fixing Playwright MCP server..." -ForegroundColor Cyan
$config.projects.'D:\cursor\openmanager-vibe-v5'.mcpServers.playwright = @{
    type = "stdio"
    command = "cmd"
    args = @("/c", "npx -y @modelcontextprotocol/server-playwright")
    env = @{}
}

# Fix Context7 (add cmd /c)
Write-Host "Fixing Context7 MCP server..." -ForegroundColor Cyan
$config.projects.'D:\cursor\openmanager-vibe-v5'.mcpServers.context7 = @{
    type = "stdio"
    command = "cmd"
    args = @("/c", "npx -y context7-mcp-server")
    env = @{}
}

# Fix ShadCN UI (add cmd /c)
Write-Host "Fixing ShadCN UI MCP server..." -ForegroundColor Cyan
$config.projects.'D:\cursor\openmanager-vibe-v5'.mcpServers.'shadcn-ui' = @{
    type = "stdio"
    command = "cmd"
    args = @("/c", "npx -y shadcn-ui-mcp-server")
    env = @{}
}

# Save the config back
Write-Host "Saving configuration..." -ForegroundColor Yellow
$config | ConvertTo-Json -Depth 10 | Set-Content $configFile -Encoding UTF8

Write-Host "`n✅ MCP servers added successfully!" -ForegroundColor Green
Write-Host "Now run 'claude api restart' to apply changes." -ForegroundColor Yellow