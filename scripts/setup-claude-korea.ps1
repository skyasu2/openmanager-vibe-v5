# Claude Code statusline 설정 스크립트
# 작성일: 2025-08-14

Write-Host "🔧 Claude Code statusline 설정 중..." -ForegroundColor Green

# 환경변수 설정
[Environment]::SetEnvironmentVariable("TZ", "Asia/Seoul", "User")
[Environment]::SetEnvironmentVariable("CCUSAGE_CONTEXT_LOW_THRESHOLD", "60", "User")
[Environment]::SetEnvironmentVariable("CCUSAGE_CONTEXT_MEDIUM_THRESHOLD", "85", "User")

# ccusage 설치 확인
$ccusageVersion = ccusage --version 2>$null
if (-not $ccusageVersion) {
    npm install -g ccusage
}

Write-Host "✅ 설정 완료" -ForegroundColor Green