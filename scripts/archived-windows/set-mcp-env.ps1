# MCP 환경변수 설정 스크립트
# Claude Code MCP 서버용 환경변수 설정

Write-Host "🔧 MCP 환경변수 설정 시작..." -ForegroundColor Cyan

# Supabase 환경변수 설정 (시스템 환경변수로 설정)
[System.Environment]::SetEnvironmentVariable('SUPABASE_URL', 'https://vnswjnltnhpsueosfhmw.supabase.co', [System.EnvironmentVariableTarget]::User)
[System.Environment]::SetEnvironmentVariable('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8', [System.EnvironmentVariableTarget]::User)

# 다른 MCP 서버 환경변수 확인 및 설정
if (-not $env:GITHUB_TOKEN) {
    Write-Host "⚠️  GITHUB_TOKEN이 설정되지 않았습니다. GitHub MCP를 사용하려면 설정하세요." -ForegroundColor Yellow
    Write-Host "   설정 방법: [System.Environment]::SetEnvironmentVariable('GITHUB_TOKEN', 'your-token', [System.EnvironmentVariableTarget]::User)" -ForegroundColor Gray
}

if (-not $env:TAVILY_API_KEY) {
    Write-Host "⚠️  TAVILY_API_KEY가 설정되지 않았습니다. Tavily MCP를 사용하려면 설정하세요." -ForegroundColor Yellow
    Write-Host "   설정 방법: [System.Environment]::SetEnvironmentVariable('TAVILY_API_KEY', 'your-key', [System.EnvironmentVariableTarget]::User)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ MCP 환경변수 설정 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 설정된 환경변수:" -ForegroundColor Cyan
Write-Host "   - SUPABASE_URL: $env:SUPABASE_URL" -ForegroundColor Gray
Write-Host "   - SUPABASE_SERVICE_ROLE_KEY: [설정됨]" -ForegroundColor Gray
Write-Host ""
Write-Host "🔄 Claude Code를 재시작하면 설정이 적용됩니다." -ForegroundColor Yellow