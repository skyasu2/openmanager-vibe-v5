# Claude Code statusline 세션 N/A 문제 해결 스크립트
# 작성일: 2025-08-14

Write-Host "🔧 statusline 세션 문제 해결 중..." -ForegroundColor Green

# 1. Claude Code 데이터 디렉토리 확인
$claudeDataPaths = @(
    "$env:APPDATA\Claude",
    "$env:LOCALAPPDATA\Claude", 
    "$env:USERPROFILE\.claude",
    "$env:USERPROFILE\AppData\Roaming\Claude"
)

foreach ($path in $claudeDataPaths) {
    if (Test-Path $path) {
        Write-Host "📁 Claude 데이터 경로 발견: $path" -ForegroundColor Yellow
        
        # 사용량 파일 검색
        $usageFiles = Get-ChildItem -Path $path -Recurse -Filter "*usage*" -ErrorAction SilentlyContinue
        if ($usageFiles) {
            Write-Host "📊 사용량 파일 발견: $($usageFiles.Count)개" -ForegroundColor Green
        }
    }
}

# 2. ccusage 캐시 정리
Write-Host "🧹 ccusage 캐시 정리..." -ForegroundColor Yellow
try {
    $env:CCUSAGE_CLEAR_CACHE = "true"
    ccusage daily > $null 2>&1
    Write-Host "✅ 캐시 정리 완료" -ForegroundColor Green
} catch {
    Write-Host "⚠️ 캐시 정리 실패" -ForegroundColor Yellow
}

# 3. Claude Code 재시작 권장
Write-Host "`n💡 해결 방법:" -ForegroundColor Cyan
Write-Host "1. Claude Code IDE 완전 종료 후 재시작" -ForegroundColor White
Write-Host "2. 새로운 대화 세션 시작" -ForegroundColor White
Write-Host "3. statusline이 세션 정보를 인식할 때까지 대기" -ForegroundColor White

Write-Host "`n⚠️ 참고사항:" -ForegroundColor Yellow
Write-Host "• N/A session은 Claude Code IDE와 ccusage 간 세션 동기화 문제입니다" -ForegroundColor White
Write-Host "• 대화를 계속하면 자동으로 해결될 수 있습니다" -ForegroundColor White
Write-Host "• 일일/블록 비용은 정상적으로 표시됩니다" -ForegroundColor White