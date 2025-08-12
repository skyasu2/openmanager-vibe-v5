# PowerShell 스크립트: MCP 서버 환경변수 직접 업데이트
# 2025.08.12

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "MCP 서버 환경변수 직접 수정" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# JSON 파일 경로
$jsonPath = "C:\Users\skyas\.claude.json"

# JSON 파일 읽기
$json = Get-Content $jsonPath -Raw | ConvertFrom-Json

# 프로젝트 경로
$projectPath = "D:\cursor\openmanager-vibe-v5"

# GitHub 서버에 환경변수 추가
if ($json.projects.$projectPath.mcpServers.github) {
    $json.projects.$projectPath.mcpServers.github = @{
        type = "stdio"
        command = "npx"
        args = @("@modelcontextprotocol/server-github")
        env = @{
            GITHUB_TOKEN = "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"
        }
    }
    Write-Host "✅ GitHub 서버 환경변수 추가" -ForegroundColor Green
}

# Supabase 서버에 환경변수 추가
if ($json.projects.$projectPath.mcpServers.supabase -eq $null) {
    $json.projects.$projectPath.mcpServers | Add-Member -Name "supabase" -Value @{
        type = "stdio"
        command = "npx"
        args = @("@supabase/mcp-server-supabase")
        env = @{
            SUPABASE_URL = "https://vnswjnltnhpsueosfhmw.supabase.co"
            SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8"
        }
    } -MemberType NoteProperty
    Write-Host "✅ Supabase 서버 추가 및 환경변수 설정" -ForegroundColor Green
}

# Tavily 서버에 환경변수 추가
if ($json.projects.$projectPath.mcpServers."tavily-mcp" -eq $null) {
    $json.projects.$projectPath.mcpServers | Add-Member -Name "tavily-mcp" -Value @{
        type = "stdio"
        command = "npx"
        args = @("tavily-mcp")
        env = @{
            TAVILY_API_KEY = "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"
        }
    } -MemberType NoteProperty
    Write-Host "✅ Tavily 서버 추가 및 환경변수 설정" -ForegroundColor Green
}

# GitHub 서버 추가 (없는 경우)
if ($json.projects.$projectPath.mcpServers.github -eq $null) {
    $json.projects.$projectPath.mcpServers | Add-Member -Name "github" -Value @{
        type = "stdio"
        command = "npx"
        args = @("@modelcontextprotocol/server-github")
        env = @{
            GITHUB_TOKEN = "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"
        }
    } -MemberType NoteProperty
    Write-Host "✅ GitHub 서버 추가 및 환경변수 설정" -ForegroundColor Green
}

# Serena 서버에 프로젝트 경로 추가
if ($json.projects.$projectPath.mcpServers.serena -eq $null) {
    $json.projects.$projectPath.mcpServers | Add-Member -Name "serena" -Value @{
        type = "stdio"
        command = "C:\Users\skyas\AppData\Local\Programs\Python\Python311\Scripts\uvx.exe"
        args = @("serena")
        env = @{
            PROJECT_ROOT = "D:\cursor\openmanager-vibe-v5"
        }
    } -MemberType NoteProperty
    Write-Host "✅ Serena 서버 추가 및 프로젝트 경로 설정" -ForegroundColor Green
}

# JSON 파일 저장
$json | ConvertTo-Json -Depth 10 | Set-Content $jsonPath -Encoding UTF8

Write-Host "`n✅ MCP 서버 환경변수 설정 완료!" -ForegroundColor Green
Write-Host "`nClaude API를 재시작합니다..." -ForegroundColor Yellow

# Claude API 재시작
& claude api restart

Start-Sleep -Seconds 5

# 연결 확인
Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "MCP 서버 연결 상태 확인" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
& claude mcp list