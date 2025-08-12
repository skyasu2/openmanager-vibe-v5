# MCP 환경변수 자동 로드 스크립트
# .env.local 파일에서 MCP 관련 환경변수를 읽어 시스템에 설정
# 
# 사용법: ./scripts/load-mcp-env.ps1

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$envFile = Join-Path $projectRoot ".env.local"

if (Test-Path $envFile) {
    Write-Host "📋 Loading MCP environment variables from .env.local" -ForegroundColor Green
    Write-Host "   Path: $envFile" -ForegroundColor Gray
    Write-Host ""
    
    # .env.local 파일 읽기
    $envContent = Get-Content $envFile
    
    # MCP 관련 환경변수 목록
    $mcpVars = @(
        "TAVILY_API_KEY",
        "SUPABASE_ACCESS_TOKEN", 
        "GITHUB_TOKEN",
        "GOOGLE_AI_API_KEY",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_PROJECT_REF",
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_JWT_SECRET",
        "SUPABASE_DB_PASSWORD"
    )
    
    $loadedCount = 0
    
    foreach ($line in $envContent) {
        # 주석과 빈 줄 건너뛰기
        if ($line -match "^\s*#" -or $line -match "^\s*$") {
            continue
        }
        
        # KEY=VALUE 형식 파싱
        if ($line -match "^([^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            
            # MCP 관련 변수만 설정
            if ($mcpVars -contains $key) {
                # 따옴표 제거
                $value = $value -replace '^["'']|["'']$', ''
                
                # 환경변수 설정 (현재 프로세스)
                [System.Environment]::SetEnvironmentVariable($key, $value, [System.EnvironmentVariableTarget]::Process)
                
                # 값 마스킹하여 표시
                if ($value.Length -gt 10) {
                    $maskedValue = $value.Substring(0, 10) + "..."
                } else {
                    $maskedValue = "***"
                }
                
                Write-Host "  ✅ $key configured ($maskedValue)" -ForegroundColor Gray
                $loadedCount++
            }
        }
    }
    
    Write-Host ""
    Write-Host "✨ Loaded $loadedCount MCP environment variables successfully!" -ForegroundColor Green
    
    # 중요 변수 확인
    Write-Host ""
    Write-Host "📊 MCP Server Status:" -ForegroundColor Cyan
    
    if ([System.Environment]::GetEnvironmentVariable("TAVILY_API_KEY")) {
        Write-Host "  ✅ Tavily MCP: Ready (Web Search enabled)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Tavily MCP: API key not set" -ForegroundColor Yellow
    }
    
    if ([System.Environment]::GetEnvironmentVariable("SUPABASE_ACCESS_TOKEN")) {
        Write-Host "  ✅ Supabase MCP: Ready (Database access enabled)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Supabase MCP: Access token not set" -ForegroundColor Yellow
    }
    
    if ([System.Environment]::GetEnvironmentVariable("GITHUB_TOKEN")) {
        Write-Host "  ✅ GitHub MCP: Ready (Repository access enabled)" -ForegroundColor Green
    } else {
        Write-Host "  ℹ️  GitHub MCP: Token not set (optional)" -ForegroundColor Gray
    }
    
} else {
    Write-Host "⚠️ .env.local file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create .env.local from .env.example:" -ForegroundColor Yellow
    Write-Host "  1. Copy-Item .env.example .env.local" -ForegroundColor Gray
    Write-Host "  2. Edit .env.local and add your API keys" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Required API keys for MCP servers:" -ForegroundColor Cyan
    Write-Host "  - TAVILY_API_KEY: Get from https://tavily.com" -ForegroundColor Gray
    Write-Host "  - SUPABASE_ACCESS_TOKEN: Get from Supabase dashboard > Account > Access Tokens" -ForegroundColor Gray
    Write-Host "  - GITHUB_TOKEN (optional): Get from GitHub Settings > Developer settings" -ForegroundColor Gray
    
    exit 1
}