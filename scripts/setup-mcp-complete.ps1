# Windows PowerShell MCP 11개 서버 완전 설정 스크립트
# 2025.08.12 - 환경변수 포함 최종 버전

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "MCP 11개 서버 완전 설정 시작" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Python 경로
$pythonPath = "C:\Users\skyas\AppData\Local\Programs\Python\Python311"
$uvxPath = "$pythonPath\Scripts\uvx.exe"

# 1. 시스템 환경변수 설정 (세션용)
Write-Host "`n환경변수 설정 중..." -ForegroundColor Yellow
$env:GITHUB_TOKEN = "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"
$env:TAVILY_API_KEY = "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"
$env:SUPABASE_URL = "https://vnswjnltnhpsueosfhmw.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8"
$env:PROJECT_ROOT = "D:\cursor\openmanager-vibe-v5"

Write-Host "✅ 환경변수 설정 완료" -ForegroundColor Green

# 2. MCP 서버 추가 (11개)
Write-Host "`nMCP 서버 추가 중..." -ForegroundColor Yellow

# Node.js 기반 서버들
Write-Host "  [1/11] filesystem..."
& claude mcp add filesystem npx "@modelcontextprotocol/server-filesystem" "D:\cursor\openmanager-vibe-v5"

Write-Host "  [2/11] memory..."
& claude mcp add memory npx "@modelcontextprotocol/server-memory"

Write-Host "  [3/11] github..."
& claude mcp add github npx "@modelcontextprotocol/server-github"

Write-Host "  [4/11] supabase..."
& claude mcp add supabase npx "@supabase/mcp-server-supabase"

Write-Host "  [5/11] sequential-thinking..."
& claude mcp add sequential-thinking npx "@modelcontextprotocol/server-sequential-thinking"

Write-Host "  [6/11] playwright..."
& claude mcp add playwright npx "@modelcontextprotocol/server-playwright"

Write-Host "  [7/11] context7..."
& claude mcp add context7 npx "context7-mcp"

Write-Host "  [8/11] shadcn-ui..."
& claude mcp add shadcn-ui npx "@ozanbaskan/mcp-server-shadcn"

Write-Host "  [9/11] tavily-mcp..."
& claude mcp add tavily-mcp npx "tavily-mcp"

# Python 기반 서버들
Write-Host "  [10/11] time..."
& claude mcp add time $uvxPath "mcp-server-time"

Write-Host "  [11/11] serena..."
& claude mcp add serena $uvxPath "serena"

Write-Host "`n✅ 11개 MCP 서버 추가 완료!" -ForegroundColor Green

# 3. 환경변수를 JSON에 직접 추가
Write-Host "`n환경변수를 JSON 파일에 추가 중..." -ForegroundColor Yellow

$jsonPath = "C:\Users\skyas\.claude.json"
$jsonContent = Get-Content $jsonPath -Raw
$json = $jsonContent | ConvertFrom-Json

$projectPath = "D:\cursor\openmanager-vibe-v5"

# GitHub 환경변수
if ($json.projects.$projectPath.mcpServers.github) {
    $json.projects.$projectPath.mcpServers.github | Add-Member -MemberType NoteProperty -Name "env" -Value @{
        GITHUB_TOKEN = $env:GITHUB_TOKEN
    } -Force
}

# Supabase 환경변수
if ($json.projects.$projectPath.mcpServers.supabase) {
    $json.projects.$projectPath.mcpServers.supabase | Add-Member -MemberType NoteProperty -Name "env" -Value @{
        SUPABASE_URL = $env:SUPABASE_URL
        SUPABASE_SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY
    } -Force
}

# Tavily 환경변수
if ($json.projects.$projectPath.mcpServers."tavily-mcp") {
    $json.projects.$projectPath.mcpServers."tavily-mcp" | Add-Member -MemberType NoteProperty -Name "env" -Value @{
        TAVILY_API_KEY = $env:TAVILY_API_KEY
    } -Force
}

# Serena 환경변수
if ($json.projects.$projectPath.mcpServers.serena) {
    $json.projects.$projectPath.mcpServers.serena | Add-Member -MemberType NoteProperty -Name "env" -Value @{
        PROJECT_ROOT = $env:PROJECT_ROOT
    } -Force
}

# JSON 저장
$jsonString = $json | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($jsonPath, $jsonString, [System.Text.Encoding]::UTF8)

Write-Host "✅ 환경변수 JSON 추가 완료!" -ForegroundColor Green

# 4. API 재시작
Write-Host "`nClaude API 재시작 중..." -ForegroundColor Yellow
& claude api restart

Start-Sleep -Seconds 5

# 5. 최종 확인
Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "MCP 서버 최종 연결 상태" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
& claude mcp list

Write-Host "`n==================================" -ForegroundColor Green
Write-Host "✨ MCP 11개 서버 설정 완료!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host "`n정상 연결 예상:" -ForegroundColor Cyan
Write-Host "  ✅ filesystem, memory, github, sequential-thinking, time" -ForegroundColor Green
Write-Host "  ✅ supabase, tavily-mcp (환경변수 설정됨)" -ForegroundColor Green
Write-Host "  ✅ shadcn-ui" -ForegroundColor Green
Write-Host "`n추가 설정 필요:" -ForegroundColor Yellow
Write-Host "  ⚠️ playwright - 브라우저 설치 필요" -ForegroundColor Yellow
Write-Host "  ⚠️ context7 - 추가 설정 필요" -ForegroundColor Yellow
Write-Host "  ⚠️ serena - Python 프로젝트 분석 도구" -ForegroundColor Yellow