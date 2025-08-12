# Claude Code with MCP 환경변수 자동 로드 및 검증
# 
# 사용법: ./scripts/start-claude-with-mcp.ps1

Clear-Host
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   🚀 Claude Code + MCP Server Launcher" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# 1. 환경변수 로드
Write-Host "STEP 1: Loading environment variables..." -ForegroundColor Yellow
& "$PSScriptRoot\load-mcp-env.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Failed to load environment variables. Exiting..." -ForegroundColor Red
    exit 1
}

# 2. Claude API 재시작 (환경변수 적용)
Write-Host ""
Write-Host "STEP 2: Restarting Claude API to apply environment..." -ForegroundColor Yellow
Write-Host "  Executing: claude api restart" -ForegroundColor Gray
claude api restart

Start-Sleep -Seconds 2

# 3. MCP 서버 상태 확인
Write-Host ""
Write-Host "STEP 3: Checking MCP servers connection status..." -ForegroundColor Yellow
Write-Host "  Executing: claude mcp list" -ForegroundColor Gray
Write-Host ""
claude mcp list

# 4. 환경변수 상세 검증
Write-Host ""
Write-Host "STEP 4: Detailed environment verification..." -ForegroundColor Yellow

$verificationResults = @{
    "Core" = @{
        "TAVILY_API_KEY" = @{
            "Name" = "Tavily Web Search"
            "Required" = $true
            "Docs" = "https://tavily.com"
        }
        "SUPABASE_ACCESS_TOKEN" = @{
            "Name" = "Supabase Database"
            "Required" = $true
            "Docs" = "Supabase Dashboard > Account > Access Tokens"
        }
    }
    "Optional" = @{
        "GITHUB_TOKEN" = @{
            "Name" = "GitHub API"
            "Required" = $false
            "Docs" = "GitHub Settings > Developer settings > Personal access tokens"
        }
        "GOOGLE_AI_API_KEY" = @{
            "Name" = "Google AI (Gemini)"
            "Required" = $false
            "Docs" = "https://makersuite.google.com/app/apikey"
        }
    }
    "Supabase" = @{
        "SUPABASE_URL" = @{
            "Name" = "Supabase Project URL"
            "Required" = $false
            "Docs" = "Supabase Dashboard > Settings > API"
        }
        "SUPABASE_PROJECT_REF" = @{
            "Name" = "Supabase Project Reference"
            "Required" = $false
            "Docs" = "From Supabase URL: https://[PROJECT_REF].supabase.co"
        }
    }
}

$coreReady = $true
$optionalCount = 0
$supabaseCount = 0

Write-Host ""
Write-Host "🔐 Core MCP Services:" -ForegroundColor Cyan
foreach ($category in $verificationResults.Keys) {
    if ($category -eq "Core") {
        foreach ($var in $verificationResults[$category].Keys) {
            $info = $verificationResults[$category][$var]
            $value = [System.Environment]::GetEnvironmentVariable($var)
            
            if ($value) {
                Write-Host "  ✅ $($info.Name)" -ForegroundColor Green
                Write-Host "     Variable: $var" -ForegroundColor Gray
                Write-Host "     Status: Configured ($(($value.Substring(0, [Math]::Min(10, $value.Length)))...))" -ForegroundColor Gray
            } else {
                Write-Host "  ❌ $($info.Name)" -ForegroundColor Red
                Write-Host "     Variable: $var" -ForegroundColor Gray
                Write-Host "     Get key from: $($info.Docs)" -ForegroundColor Yellow
                $coreReady = $false
            }
        }
    }
}

Write-Host ""
Write-Host "📦 Optional Services:" -ForegroundColor Cyan
foreach ($var in $verificationResults["Optional"].Keys) {
    $info = $verificationResults["Optional"][$var]
    $value = [System.Environment]::GetEnvironmentVariable($var)
    
    if ($value) {
        Write-Host "  ✅ $($info.Name) - Configured" -ForegroundColor Green
        $optionalCount++
    } else {
        Write-Host "  ⚪ $($info.Name) - Not configured (optional)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🗄️ Supabase Extended Config:" -ForegroundColor Cyan
foreach ($var in $verificationResults["Supabase"].Keys) {
    $info = $verificationResults["Supabase"][$var]
    $value = [System.Environment]::GetEnvironmentVariable($var)
    
    if ($value) {
        Write-Host "  ✅ $($info.Name) - Configured" -ForegroundColor Green
        $supabaseCount++
    } else {
        Write-Host "  ⚪ $($info.Name) - Not configured" -ForegroundColor Gray
    }
}

# 5. 최종 상태 요약
Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   📊 Final Status Report" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

if ($coreReady) {
    Write-Host "✨ Core MCP services are fully configured!" -ForegroundColor Green
    Write-Host "   - Tavily Web Search: Ready" -ForegroundColor Gray
    Write-Host "   - Supabase Database: Ready" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Some core MCP services are not configured" -ForegroundColor Yellow
    Write-Host "   Please add the missing API keys to .env.local" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📈 Service Coverage:" -ForegroundColor Cyan
Write-Host "   Core Services: $(if($coreReady){'2/2 ✅'}else{'Incomplete ⚠️'})" -ForegroundColor Gray
Write-Host "   Optional Services: $optionalCount/2 configured" -ForegroundColor Gray
Write-Host "   Supabase Extended: $supabaseCount/2 configured" -ForegroundColor Gray

Write-Host ""
Write-Host "🎯 You can now use Claude Code with MCP servers!" -ForegroundColor Green
Write-Host "   Command: claude" -ForegroundColor Gray
Write-Host ""

# 6. 유용한 명령어 제공
Write-Host "📝 Useful Commands:" -ForegroundColor Cyan
Write-Host "   claude mcp list         - List all MCP servers" -ForegroundColor Gray
Write-Host "   claude api restart      - Restart Claude API" -ForegroundColor Gray
Write-Host "   claude --help          - Show Claude help" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   MCP Usage Guide: docs/mcp-usage-guide-2025.md" -ForegroundColor Gray
Write-Host "   Environment Setup: docs/mcp-environment-variables-guide.md" -ForegroundColor Gray
Write-Host ""