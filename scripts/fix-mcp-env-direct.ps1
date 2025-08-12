# PowerShell 스크립트: .claude.json 파일 직접 수정하여 환경변수 추가
# 2025.08.12

Write-Host "==================================" -ForegroundColor Cyan
Write-Host ".claude.json 직접 수정" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# JSON 파일 경로
$jsonPath = "C:\Users\skyas\.claude.json"

# JSON 파일 읽기
$jsonContent = Get-Content $jsonPath -Raw
$json = $jsonContent | ConvertFrom-Json

# 프로젝트 경로
$projectPath = "D:\cursor\openmanager-vibe-v5"

# GitHub 서버 환경변수 업데이트
if ($json.projects.$projectPath.mcpServers.github) {
    $json.projects.$projectPath.mcpServers.github.env = @{
        GITHUB_TOKEN = "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"
    }
    Write-Host "✅ GitHub 서버 환경변수 설정" -ForegroundColor Green
}

# Supabase 서버 환경변수 업데이트
if ($json.projects.$projectPath.mcpServers.supabase) {
    $json.projects.$projectPath.mcpServers.supabase.env = @{
        SUPABASE_URL = "https://vnswjnltnhpsueosfhmw.supabase.co"
        SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8"
    }
    Write-Host "✅ Supabase 서버 환경변수 설정" -ForegroundColor Green
}

# Tavily 서버 환경변수 업데이트
if ($json.projects.$projectPath.mcpServers."tavily-mcp") {
    $json.projects.$projectPath.mcpServers."tavily-mcp".env = @{
        TAVILY_API_KEY = "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"
    }
    Write-Host "✅ Tavily 서버 환경변수 설정" -ForegroundColor Green
}

# Serena 서버 환경변수 업데이트
if ($json.projects.$projectPath.mcpServers.serena) {
    $json.projects.$projectPath.mcpServers.serena.env = @{
        PROJECT_ROOT = "D:\cursor\openmanager-vibe-v5"
    }
    Write-Host "✅ Serena 서버 프로젝트 경로 설정" -ForegroundColor Green
}

# JSON 파일 저장 (한글 인코딩 문제 방지)
$jsonString = $json | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($jsonPath, $jsonString, [System.Text.Encoding]::UTF8)

Write-Host "`n✅ 환경변수 설정 완료!" -ForegroundColor Green
Write-Host "API 재시작 중..." -ForegroundColor Yellow