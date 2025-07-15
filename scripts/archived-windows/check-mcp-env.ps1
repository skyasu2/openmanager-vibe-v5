# MCP 환경변수 확인 스크립트
Write-Host "=== MCP 환경변수 상태 확인 ===" -ForegroundColor Cyan
Write-Host ""

# 환경변수 확인 함수
function Check-EnvVar {
    param($name)
    $value = [Environment]::GetEnvironmentVariable($name, "User")
    if ($value) {
        Write-Host "✓ $name" -ForegroundColor Green -NoNewline
        Write-Host " : " -NoNewline
        Write-Host "설정됨 (길이: $($value.Length)자)" -ForegroundColor Gray
    } else {
        Write-Host "✗ $name" -ForegroundColor Red -NoNewline
        Write-Host " : 설정되지 않음" -ForegroundColor Yellow
    }
}

# 필수 환경변수 확인
Check-EnvVar "GITHUB_TOKEN"
Check-EnvVar "SUPABASE_URL"
Check-EnvVar "SUPABASE_SERVICE_ROLE_KEY"

Write-Host ""
Write-Host "환경변수를 설정하려면 다음 명령을 실행하세요:" -ForegroundColor Yellow
Write-Host "powershell -ExecutionPolicy Bypass -File scripts\setup-mcp-env.ps1" -ForegroundColor White