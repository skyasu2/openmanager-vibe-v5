#!/usr/bin/env pwsh
# Statusline 환경변수 설정 스크립트
# 작성일: 2025-08-14
# 용도: ccusage statusline 최적화를 위한 환경변수 설정

Write-Host "📊 Statusline 환경변수 설정 시작..." -ForegroundColor Cyan

# 컨텍스트 임계값 설정 (더 명확한 경고 체계)
[Environment]::SetEnvironmentVariable("CCUSAGE_CONTEXT_LOW_THRESHOLD", "60", "User")
[Environment]::SetEnvironmentVariable("CCUSAGE_CONTEXT_MEDIUM_THRESHOLD", "85", "User")

# 타임존 설정 (한국 시간)
[Environment]::SetEnvironmentVariable("TZ", "Asia/Seoul", "User")

# 로케일 설정
[Environment]::SetEnvironmentVariable("LANG", "ko_KR.UTF-8", "User")

# 현재 세션에도 적용
$env:CCUSAGE_CONTEXT_LOW_THRESHOLD = "60"
$env:CCUSAGE_CONTEXT_MEDIUM_THRESHOLD = "85"
$env:TZ = "Asia/Seoul"
$env:LANG = "ko_KR.UTF-8"

Write-Host "`n✅ 환경변수 설정 완료!" -ForegroundColor Green
Write-Host "`n📋 설정된 값:" -ForegroundColor Yellow
Write-Host "  - CCUSAGE_CONTEXT_LOW_THRESHOLD: 60% (녹색 → 노란색 전환점)" -ForegroundColor Gray
Write-Host "  - CCUSAGE_CONTEXT_MEDIUM_THRESHOLD: 85% (노란색 → 빨간색 전환점)" -ForegroundColor Gray
Write-Host "  - TZ: Asia/Seoul (한국 시간대)" -ForegroundColor Gray
Write-Host "  - LANG: ko_KR.UTF-8 (한국어 로케일)" -ForegroundColor Gray

Write-Host "`n💡 참고사항:" -ForegroundColor Cyan
Write-Host "  - 60% 미만: 🟢 안전 (녹색)" -ForegroundColor Gray
Write-Host "  - 60-85%: 🟡 주의 (노란색)" -ForegroundColor Gray
Write-Host "  - 85% 이상: 🔴 경고 (빨간색)" -ForegroundColor Gray

Write-Host "`n🔄 Claude Code를 재시작하면 설정이 적용됩니다." -ForegroundColor Yellow

# 현재 ccusage 버전 확인
Write-Host "`n📦 ccusage 버전 확인..." -ForegroundColor Cyan
try {
    $version = & ccusage --version 2>$null
    if ($version) {
        Write-Host ("  ✅ ccusage " + $version + " installed") -ForegroundColor Green
    }
} catch {
    Write-Host "  Warning: ccusage not installed." -ForegroundColor Red
    Write-Host "  Install command: npm install -g ccusage" -ForegroundColor Yellow
}