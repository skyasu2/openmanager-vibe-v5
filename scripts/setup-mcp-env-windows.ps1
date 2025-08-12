# Windows PowerShell MCP 환경변수 설정 스크립트
# 2025.08.12 - .env.local에서 환경변수 읽어서 MCP 서버에 적용

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "MCP 서버 환경변수 설정" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Python 경로 설정
$pythonPath = "C:\Users\skyas\AppData\Local\Programs\Python\Python311"
$uvxPath = "$pythonPath\Scripts\uvx.exe"

# 환경변수 정의
$envVars = @{
    GITHUB_TOKEN = "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"
    TAVILY_API_KEY = "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"
    SUPABASE_URL = "https://vnswjnltnhpsueosfhmw.supabase.co"
    SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8"
    SUPABASE_ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8"
}

Write-Host "`n환경변수가 설정된 MCP 서버 재설치 중..." -ForegroundColor Green

# 기존 서버 제거
Write-Host "`n기존 서버 제거 중..." -ForegroundColor Yellow
$serversToRemove = @("github", "supabase", "tavily-mcp", "playwright", "context7", "shadcn-ui", "serena")
foreach ($server in $serversToRemove) {
    & claude mcp remove $server 2>$null
}

# GitHub 서버 (환경변수 포함)
Write-Host "  [1/7] github 추가 (with GITHUB_TOKEN)..."
& claude mcp add github `
    --env GITHUB_TOKEN=$($envVars.GITHUB_TOKEN) `
    -- npx "@modelcontextprotocol/server-github"

# Supabase 서버 (환경변수 포함)
Write-Host "  [2/7] supabase 추가 (with credentials)..."
& claude mcp add supabase `
    --env SUPABASE_URL=$($envVars.SUPABASE_URL) `
    --env SUPABASE_SERVICE_ROLE_KEY=$($envVars.SUPABASE_SERVICE_ROLE_KEY) `
    --env SUPABASE_ACCESS_TOKEN=$($envVars.SUPABASE_ACCESS_TOKEN) `
    -- npx "@supabase/mcp-server-supabase"

# Tavily 서버 (환경변수 포함)
Write-Host "  [3/7] tavily-mcp 추가 (with API key)..."
& claude mcp add tavily-mcp `
    --env TAVILY_API_KEY=$($envVars.TAVILY_API_KEY) `
    -- npx "tavily-mcp"

# Playwright 서버
Write-Host "  [4/7] playwright 추가..."
& claude mcp add playwright npx "@modelcontextprotocol/server-playwright"

# Context7 서버
Write-Host "  [5/7] context7 추가..."
& claude mcp add context7 npx "context7-mcp"

# Shadcn-ui 서버
Write-Host "  [6/7] shadcn-ui 추가..."
& claude mcp add shadcn-ui npx "@ozanbaskan/mcp-server-shadcn"

# Serena 서버 (프로젝트 경로 포함)
Write-Host "  [7/7] serena 추가 (with project path)..."
& claude mcp add serena `
    --env PROJECT_ROOT="D:\cursor\openmanager-vibe-v5" `
    -- $uvxPath "serena"

# API 재시작
Write-Host "`nClaude API 재시작 중..." -ForegroundColor Yellow
& claude api restart

Start-Sleep -Seconds 5

# 연결 확인
Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "MCP 서버 연결 상태 확인" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
& claude mcp list

Write-Host "`n환경변수 설정 완료!" -ForegroundColor Green
Write-Host "모든 MCP 서버가 필요한 환경변수와 함께 설정되었습니다." -ForegroundColor Green