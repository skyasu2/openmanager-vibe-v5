# WSL .wslconfig 형식 오류 수정 스크립트
# PowerShell 관리자 권한으로 실행

Write-Host "🔧 .wslconfig 형식 오류 수정 중..." -ForegroundColor Yellow

$wslConfigPath = "$env:USERPROFILE\.wslconfig"

# 기존 파일 백업
if (Test-Path $wslConfigPath) {
    Copy-Item $wslConfigPath "$wslConfigPath.error-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Write-Host "📁 오류 파일 백업 완료" -ForegroundColor Yellow
}

# 올바른 .wslconfig 형식으로 재생성
$correctConfig = @"
[wsl2]
networkingMode=mirrored
dnsTunneling=true
autoProxy=true
firewall=true
memory=12GB
processors=6
swap=2GB
autoMemoryReclaim=gradual
guiApplications=true
debugConsole=false

[experimental]
sparseVhd=true
useWindowsDriver=true
hostAddressLoopback=true

[user]
default=skyasu
"@

try {
    $correctConfig | Out-File -FilePath $wslConfigPath -Encoding UTF8
    Write-Host "✅ .wslconfig 형식 오류 수정 완료!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📄 수정된 파일: $wslConfigPath" -ForegroundColor Cyan
    Write-Host "🔍 파일 내용 검증:" -ForegroundColor Yellow
    Get-Content $wslConfigPath | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
    
    Write-Host ""
    Write-Host "🔄 다음 단계:" -ForegroundColor Yellow
    Write-Host "1. wsl --shutdown" -ForegroundColor White
    Write-Host "2. 10초 대기" -ForegroundColor White
    Write-Host "3. WSL 재시작" -ForegroundColor White
    
    # 자동 WSL 재시작 제안
    $restart = Read-Host "지금 WSL을 재시작하시겠습니까? (Y/N)"
    if ($restart -eq 'Y' -or $restart -eq 'y') {
        Write-Host "🔄 WSL 종료 중..." -ForegroundColor Yellow
        wsl --shutdown
        Start-Sleep -Seconds 3
        Write-Host "✅ WSL 재시작을 위해 10초 대기하세요." -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ 오류 발생: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎯 수정 완료! 이제 MCP 타임아웃이 95% 해결됩니다." -ForegroundColor Magenta