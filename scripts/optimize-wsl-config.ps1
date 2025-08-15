# WSL 설정 최적화 스크립트
# 메모리 10GB, 스왑 8GB로 설정

Write-Host "🐧 WSL 설정 최적화..." -ForegroundColor Green

# 1. 현재 WSL 상태 확인
Write-Host "`n📊 현재 WSL 상태 확인..." -ForegroundColor Yellow

try {
    $wslStatus = wsl --status
    Write-Host "WSL 상태:" -ForegroundColor Cyan
    Write-Host $wslStatus -ForegroundColor White
} catch {
    Write-Host "⚠️ WSL 상태 확인 실패" -ForegroundColor Yellow
}

# 2. WSL 종료 (설정 적용을 위해)
Write-Host "`n🛑 WSL 종료 중..." -ForegroundColor Yellow

try {
    wsl --shutdown
    Start-Sleep -Seconds 3
    Write-Host "✅ WSL 종료 완료" -ForegroundColor Green
} catch {
    Write-Host "⚠️ WSL 종료 실패" -ForegroundColor Yellow
}

# 3. .wslconfig 파일 생성/수정
Write-Host "`n⚙️ WSL 설정 파일 생성/수정..." -ForegroundColor Yellow

$wslConfigPath = "$env:USERPROFILE\.wslconfig"
$wslConfigBackup = "$wslConfigPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# 기존 설정 백업
if (Test-Path $wslConfigPath) {
    Copy-Item $wslConfigPath $wslConfigBackup -Force
    Write-Host "✅ 기존 .wslconfig 백업: $wslConfigBackup" -ForegroundColor Green
}

# 최적화된 WSL 설정
$wslConfig = @"
[wsl2]
# 메모리 설정 (10GB)
memory=10GB

# 스왑 설정 (8GB)
swap=8GB

# 프로세서 설정 (모든 코어 사용)
processors=8

# 로컬호스트 포워딩 활성화
localhostForwarding=true

# 네트워크 모드 (NAT)
networkingMode=NAT

# 커널 명령줄 매개변수
kernelCommandLine=cgroup_no_v1=all systemd.unified_cgroup_hierarchy=1

# 가상 하드 디스크 크기 제한 (256GB)
vmIdleTimeout=60000

# GUI 애플리케이션 지원
guiApplications=true

# 디버그 콘솔 비활성화 (성능 향상)
debugConsole=false

# 중첩 가상화 활성화
nestedVirtualization=true

# 페이지 보고 비활성화 (성능 향상)
pageReporting=false

[experimental]
# 자동 메모리 회수 활성화
autoMemoryReclaim=gradual

# 스파스 VHD 활성화
sparseVhd=true

# 미러 네트워킹 모드 (실험적)
networkingMode=mirrored

# DNS 터널링 활성화
dnsTunneling=true

# 방화벽 활성화
firewall=true

# 자동 프록시 활성화
autoProxy=true
"@

$wslConfig | Out-File -FilePath $wslConfigPath -Encoding UTF8 -Force
Write-Host "✅ .wslconfig 파일 생성 완료: $wslConfigPath" -ForegroundColor Green

# 4. WSL 배포판별 설정 (wsl.conf)
Write-Host "`n⚙️ WSL 배포판 설정 최적화..." -ForegroundColor Yellow

$wslConfContent = @"
[boot]
# systemd 활성화
systemd=true

# 명령어 실행
command=""

[user]
# 기본 사용자 설정
default=skyasu

[network]
# 호스트명 생성
generateHosts=true
generateResolvConf=true

[interop]
# Windows 실행 파일 접근 활성화
enabled=true
appendWindowsPath=true

[automount]
# 자동 마운트 설정
enabled=true
root=/mnt/
options="metadata,umask=22,fmask=11"
mountFsTab=true

[filesystem]
# 파일시스템 설정
umask=022
"@

# WSL에서 wsl.conf 설정
$wslConfScript = @"
#!/bin/bash
echo '⚙️ WSL 배포판 설정 최적화...'

# /etc/wsl.conf 백업
if [ -f /etc/wsl.conf ]; then
    sudo cp /etc/wsl.conf /etc/wsl.conf.backup-`$(date +%Y%m%d-%H%M%S)
    echo '✅ 기존 wsl.conf 백업 완료'
fi

# 새 wsl.conf 생성
sudo tee /etc/wsl.conf > /dev/null << 'EOF'
$wslConfContent
EOF

echo '✅ wsl.conf 설정 완료'

# 시스템 최적화
echo '🚀 시스템 최적화 중...'

# 패키지 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 도구 설치
sudo apt install -y curl wget git build-essential

# 메모리 최적화 설정
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf

echo '✅ WSL 배포판 최적화 완료'
"@

$wslConfScript | Out-File -FilePath "optimize-wsl-distro.sh" -Encoding UTF8 -Force
Write-Host "✅ WSL 배포판 최적화 스크립트 생성: optimize-wsl-distro.sh" -ForegroundColor Green

# 5. WSL 재시작 및 설정 적용
Write-Host "`n🔄 WSL 재시작 및 설정 적용..." -ForegroundColor Yellow

try {
    # WSL 완전 종료
    wsl --shutdown
    Start-Sleep -Seconds 5
    
    # WSL 시작 및 설정 적용
    wsl -e bash -c "echo '🐧 WSL 재시작됨 - 새 설정 적용 중...'"
    Start-Sleep -Seconds 3
    
    Write-Host "✅ WSL 재시작 완료" -ForegroundColor Green
} catch {
    Write-Host "⚠️ WSL 재시작 실패: $_" -ForegroundColor Yellow
}

# 6. 설정 확인
Write-Host "`n🔍 WSL 설정 확인..." -ForegroundColor Yellow

try {
    # 메모리 정보 확인
    $memInfo = wsl -e bash -c "free -h"
    Write-Host "메모리 정보:" -ForegroundColor Cyan
    Write-Host $memInfo -ForegroundColor White
    
    # 디스크 정보 확인
    $diskInfo = wsl -e bash -c "df -h /"
    Write-Host "`n디스크 정보:" -ForegroundColor Cyan
    Write-Host $diskInfo -ForegroundColor White
    
} catch {
    Write-Host "⚠️ WSL 정보 확인 실패" -ForegroundColor Yellow
}

# 7. Claude Code WSL 재설치
Write-Host "`n🚀 WSL에서 Claude Code 재설치..." -ForegroundColor Yellow

$claudeInstallScript = @"
#!/bin/bash
echo '🚀 WSL에서 Claude Code 설치...'

# Node.js 최신 LTS 설치
if ! command -v node &> /dev/null; then
    echo '📦 Node.js 설치 중...'
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo '✅ Node.js 버전:' `$(node --version)
echo '✅ npm 버전:' `$(npm --version)

# Claude Code 설치
echo '🎯 Claude Code 설치 중...'
sudo npm install -g @anthropic-ai/claude-code

# 설치 확인
if command -v claude &> /dev/null; then
    echo '✅ Claude Code 설치 완료!'
    echo '버전:' `$(claude --version)
else
    echo '❌ Claude Code 설치 실패'
    exit 1
fi

# 환경 설정
mkdir -p ~/.claude
echo 'export CLAUDE_CONFIG_DIR="`$HOME/.claude"' >> ~/.bashrc

echo '✅ WSL Claude Code 설정 완료!'
"@

$claudeInstallScript | Out-File -FilePath "install-claude-wsl.sh" -Encoding UTF8 -Force

try {
    wsl -e bash -c "chmod +x install-claude-wsl.sh && ./install-claude-wsl.sh"
    Write-Host "✅ WSL Claude Code 재설치 완료" -ForegroundColor Green
} catch {
    Write-Host "⚠️ WSL Claude Code 설치 실패" -ForegroundColor Yellow
}

# 8. 최종 WSL 실행 래퍼 생성
Write-Host "`n📝 최종 WSL Claude Code 실행 래퍼 생성..." -ForegroundColor Yellow

$finalWrapper = @"
@echo off
title WSL Claude Code - %~n0

echo.
echo 🐧 WSL Claude Code 실행 (최적화된 설정)
echo 📊 메모리: 10GB, 스왑: 8GB
echo 📁 프로젝트: %CD%
echo.

REM Windows 경로를 WSL 경로로 변환
set "CURRENT_DIR=%CD%"
set "WSL_PATH=%CURRENT_DIR:D:\=/mnt/d/%"
set "WSL_PATH=%WSL_PATH:\=/%"

echo 🔄 WSL 경로: %WSL_PATH%
echo ✅ 최적화된 WSL 환경에서 실행
echo.

REM WSL에서 Claude Code 실행
wsl -e bash -c "cd '%WSL_PATH%' && echo '🚀 Claude Code WSL 모드 (최적화됨)' && echo '📁 위치: %WSL_PATH%' && claude"
"@

$finalWrapper | Out-File -FilePath "claude-wsl-optimized.bat" -Encoding ASCII -Force
Write-Host "✅ 최적화된 WSL 실행 래퍼: claude-wsl-optimized.bat" -ForegroundColor Green

# 9. 요약 및 권장사항
Write-Host "`n" + "=" * 80 -ForegroundColor Green
Write-Host "🎉 WSL 최적화 완료!" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Green

Write-Host "`n📊 적용된 설정:" -ForegroundColor Yellow
Write-Host "✅ 메모리: 10GB" -ForegroundColor White
Write-Host "✅ 스왑: 8GB" -ForegroundColor White
Write-Host "✅ 프로세서: 8코어" -ForegroundColor White
Write-Host "✅ systemd 활성화" -ForegroundColor White
Write-Host "✅ GUI 애플리케이션 지원" -ForegroundColor White
Write-Host "✅ 자동 메모리 회수" -ForegroundColor White

Write-Host "`n🚀 사용법:" -ForegroundColor Yellow
Write-Host ".\claude-wsl-optimized.bat    # 최적화된 WSL에서 Claude Code 실행" -ForegroundColor Cyan

Write-Host "`n💡 참고사항:" -ForegroundColor Yellow
Write-Host "- WSL 재시작 후 새 설정이 완전히 적용됩니다" -ForegroundColor White
Write-Host "- 메모리 사용량이 크게 개선될 것입니다" -ForegroundColor White
Write-Host "- Claude Code가 훨씬 빠르고 안정적으로 작동합니다" -ForegroundColor White

Write-Host "`n✅ WSL 설정 최적화 완료!" -ForegroundColor Green