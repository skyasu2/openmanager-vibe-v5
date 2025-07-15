# MCP 환경변수 설정 스크립트 (PowerShell)
# 사용법: PowerShell 관리자 권한으로 실행

Write-Host "=== MCP 환경변수 설정 스크립트 ===" -ForegroundColor Green
Write-Host ""

# GitHub Token 확인 및 설정
$githubToken = [Environment]::GetEnvironmentVariable("GITHUB_TOKEN", "User")
if (-not $githubToken) {
    Write-Host "GITHUB_TOKEN이 설정되지 않았습니다." -ForegroundColor Yellow
    Write-Host "GitHub Personal Access Token을 생성하세요: https://github.com/settings/tokens" -ForegroundColor Cyan
    $inputToken = Read-Host "GitHub Token을 입력하세요"
    if ($inputToken) {
        [Environment]::SetEnvironmentVariable("GITHUB_TOKEN", $inputToken, "User")
        Write-Host "✓ GITHUB_TOKEN 설정 완료" -ForegroundColor Green
    }
} else {
    Write-Host "✓ GITHUB_TOKEN이 이미 설정되어 있습니다" -ForegroundColor Green
}

# Supabase URL 확인 및 설정
$supabaseUrl = [Environment]::GetEnvironmentVariable("SUPABASE_URL", "User")
if (-not $supabaseUrl) {
    Write-Host ""
    Write-Host "SUPABASE_URL이 설정되지 않았습니다." -ForegroundColor Yellow
    Write-Host "Supabase 프로젝트 URL (예: https://xxx.supabase.co)" -ForegroundColor Cyan
    $inputUrl = Read-Host "Supabase URL을 입력하세요"
    if ($inputUrl) {
        [Environment]::SetEnvironmentVariable("SUPABASE_URL", $inputUrl, "User")
        Write-Host "✓ SUPABASE_URL 설정 완료" -ForegroundColor Green
    }
} else {
    Write-Host "✓ SUPABASE_URL이 이미 설정되어 있습니다" -ForegroundColor Green
}

# Supabase Service Role Key 확인 및 설정
$supabaseKey = [Environment]::GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY", "User")
if (-not $supabaseKey) {
    Write-Host ""
    Write-Host "SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다." -ForegroundColor Yellow
    Write-Host "Supabase 프로젝트 설정에서 Service Role Key를 확인하세요" -ForegroundColor Cyan
    $inputKey = Read-Host "Service Role Key를 입력하세요"
    if ($inputKey) {
        [Environment]::SetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY", $inputKey, "User")
        Write-Host "✓ SUPABASE_SERVICE_ROLE_KEY 설정 완료" -ForegroundColor Green
    }
} else {
    Write-Host "✓ SUPABASE_SERVICE_ROLE_KEY가 이미 설정되어 있습니다" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== 설정 완료 ===" -ForegroundColor Green
Write-Host "Claude Code를 재시작하여 변경사항을 적용하세요." -ForegroundColor Yellow
Write-Host ""
Write-Host "설정된 환경변수 확인:" -ForegroundColor Cyan
Write-Host "- GITHUB_TOKEN: $([Environment]::GetEnvironmentVariable('GITHUB_TOKEN', 'User') -ne $null)" -ForegroundColor White
Write-Host "- SUPABASE_URL: $([Environment]::GetEnvironmentVariable('SUPABASE_URL', 'User') -ne $null)" -ForegroundColor White
Write-Host "- SUPABASE_SERVICE_ROLE_KEY: $([Environment]::GetEnvironmentVariable('SUPABASE_SERVICE_ROLE_KEY', 'User') -ne $null)" -ForegroundColor White