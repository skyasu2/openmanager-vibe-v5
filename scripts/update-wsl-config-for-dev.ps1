# 로컬 개발용 WSL 설정 업데이트 스크립트

$ErrorActionPreference = "Stop"

Write-Host "=== 로컬 개발용 WSL 설정 업데이트 ===" -ForegroundColor Cyan

$wslConfigPath = "$env:USERPROFILE\.wslconfig"

# 기존 설정 백업
if (Test-Path $wslConfigPath) {
    $backupPath = "$wslConfigPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $wslConfigPath $backupPath
    Write-Host "   기존 설정 백업: $backupPath" -ForegroundColor Green
}

# 로컬 개발 최적화 WSL 설정
$devOptimizedConfig = @"
# WSL 로컬 개발 환경 최적화 설정
# 생성일: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
# 용도: 로컬 개발, Claude Code, MCP 서버

[wsl2]
# 메모리 설정 (8GB - 개발 서버 + MCP 서버)
memory=8GB
processors=6

# 스왑 설정 (16GB - 대용량 프로젝트 지원)
swap=16GB
swapfile=C:/temp/wsl-swap.vhdx

# 네트워크 설정 (mirrored - localhost 접근 최적화)
networkingMode=mirrored

# 로컬 개발 최적화
nestedVirtualization=false
vmIdleTimeout=60000

# 실험적 기능 (개발 환경 최적화)
[experimental]
# 자동 메모리 회수 (장시간 개발 세션 지원)
autoMemoryReclaim=gradual

# 스파스 VHD (디스크 공간 절약)
sparseVhd=true

# DNS 터널링 (빠른 외부 API 호출)
dnsTunneling=true

# 방화벽 비활성화 (로컬 개발용)
firewall=false

# 자동 프록시 (기업 환경 지원)
autoProxy=true

# 호스트 주소 루프백 (localhost 접근 개선)
hostAddressLoopback=true
"@

# 설정 파일 저장
$devOptimizedConfig | Out-File -FilePath $wslConfigPath -Encoding UTF8 -Force
Write-Host "   ✅ 로컬 개발용 WSL 설정 생성 완료" -ForegroundColor Green

Write-Host "`n📋 로컬 개발 최적화 설정:" -ForegroundColor Yellow
Write-Host "   • 메모리: 8GB (안정적인 개발 환경)" -ForegroundColor White
Write-Host "   • 스왑: 16GB (대용량 프로젝트 지원)" -ForegroundColor White
Write-Host "   • 네트워킹: 미러링 (localhost 최적화)" -ForegroundColor White
Write-Host "   • 방화벽: 비활성화 (로컬 접근 자유)" -ForegroundColor White
Write-Host "   • DNS 터널링: 활성화 (빠른 API 호출)" -ForegroundColor White
Write-Host "   • 자동 메모리 회수: 활성화 (장시간 개발)" -ForegroundColor White

Write-Host "`n🔄 WSL 재시작 중..." -ForegroundColor Cyan
wsl --shutdown
Start-Sleep -Seconds 3

Write-Host "✅ WSL 재시작 완료!" -ForegroundColor Green

# 설정 확인
Write-Host "`n🧪 설정 적용 확인..." -ForegroundColor Yellow
$testResult = wsl bash -c "echo 'WSL 연결 테스트 성공'" 2>$null
if ($testResult) {
    Write-Host "   ✅ WSL 연결: 정상" -ForegroundColor Green
} else {
    Write-Host "   ❌ WSL 연결: 실패" -ForegroundColor Red
}

Write-Host "`n💡 추가 최적화:" -ForegroundColor Cyan
Write-Host "   wsl ./scripts/wsl-dev-optimize.sh status   # 개발 환경 상태 확인" -ForegroundColor White
Write-Host "   wsl ./scripts/wsl-dev-optimize.sh ports    # 개발 포트 확인" -ForegroundColor White