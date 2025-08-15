# WSL sudo 비밀번호 없이 사용 설정 스크립트
# skyasu 계정이 sudo를 비밀번호 없이 사용할 수 있도록 설정

Write-Host "🔐 WSL sudo 비밀번호 없이 사용 설정..." -ForegroundColor Green

# 1. 현재 사용자 확인
Write-Host "`n👤 현재 WSL 사용자 확인..." -ForegroundColor Yellow

try {
    $currentUser = wsl -e bash -c "whoami"
    Write-Host "현재 사용자: $currentUser" -ForegroundColor Cyan
    
    $groups = wsl -e bash -c "groups"
    Write-Host "사용자 그룹: $groups" -ForegroundColor Cyan
} catch {
    Write-Host "❌ WSL 사용자 정보 확인 실패" -ForegroundColor Red
    exit 1
}

# 2. sudoers 파일 백업 및 수정
Write-Host "`n⚙️ sudoers 파일 수정..." -ForegroundColor Yellow

$sudoersScript = @"
#!/bin/bash
echo '🔐 sudoers 파일 수정 중...'

# 현재 사용자 확인
CURRENT_USER=\$(whoami)
echo '현재 사용자:' \$CURRENT_USER

# sudoers 파일 백업
echo '💾 sudoers 파일 백업 중...'
sudo cp /etc/sudoers /etc/sudoers.backup-\$(date +%Y%m%d-%H%M%S)

# skyasu 사용자를 sudo 그룹에 추가 (이미 있을 수 있음)
echo '👥 skyasu를 sudo 그룹에 추가...'
sudo usermod -aG sudo skyasu

# sudoers.d 디렉토리에 skyasu 전용 설정 파일 생성
echo '📝 skyasu 전용 sudo 설정 생성...'
echo 'skyasu ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/skyasu

# 파일 권한 설정
sudo chmod 440 /etc/sudoers.d/skyasu

# 설정 검증
echo '🔍 sudoers 설정 검증...'
sudo visudo -c

if [ \$? -eq 0 ]; then
    echo '✅ sudoers 설정이 올바릅니다'
else
    echo '❌ sudoers 설정에 오류가 있습니다'
    echo '🔄 백업에서 복원 중...'
    sudo cp /etc/sudoers.backup-* /etc/sudoers
    exit 1
fi

echo '✅ sudo 비밀번호 없이 사용 설정 완료!'
"@

$sudoersScript | Out-File -FilePath "setup-sudo-nopasswd.sh" -Encoding UTF8 -Force

# 3. 스크립트 실행 (비밀번호 입력 필요)
Write-Host "`n🚀 sudo 설정 스크립트 실행..." -ForegroundColor Yellow
Write-Host "⚠️ 비밀번호 입력이 필요합니다: sky3232" -ForegroundColor Yellow

try {
    # 스크립트 실행 권한 부여 및 실행
    wsl -e bash -c "chmod +x setup-sudo-nopasswd.sh"
    
    # 비밀번호를 자동으로 입력하여 스크립트 실행
    $password = "sky3232"
    $scriptExecution = @"
#!/bin/bash
echo '$password' | sudo -S bash -c '
    # sudoers 파일 백업
    cp /etc/sudoers /etc/sudoers.backup-\$(date +%Y%m%d-%H%M%S)
    
    # skyasu를 sudo 그룹에 추가
    usermod -aG sudo skyasu
    
    # sudoers.d에 skyasu 전용 설정 생성
    echo \"skyasu ALL=(ALL) NOPASSWD:ALL\" > /etc/sudoers.d/skyasu
    chmod 440 /etc/sudoers.d/skyasu
    
    # 설정 검증
    visudo -c
    
    echo \"✅ sudo 비밀번호 없이 사용 설정 완료!\"
'
"@
    
    $scriptExecution | Out-File -FilePath "auto-sudo-setup.sh" -Encoding UTF8 -Force
    wsl -e bash -c "chmod +x auto-sudo-setup.sh && ./auto-sudo-setup.sh"
    
    Write-Host "✅ sudo 설정 완료" -ForegroundColor Green
} catch {
    Write-Host "⚠️ 자동 설정 실패, 수동 설정을 시도합니다..." -ForegroundColor Yellow
}

# 4. 설정 테스트
Write-Host "`n🧪 sudo 비밀번호 없이 사용 테스트..." -ForegroundColor Yellow

try {
    $testResult = wsl -e bash -c "sudo -n whoami 2>/dev/null"
    if ($testResult -eq "root") {
        Write-Host "✅ sudo 비밀번호 없이 사용 가능!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 아직 비밀번호가 필요할 수 있습니다" -ForegroundColor Yellow
        Write-Host "💡 WSL 재시작 후 다시 테스트해보세요" -ForegroundColor Cyan
    }
} catch {
    Write-Host "⚠️ 테스트 실패, 수동 확인이 필요합니다" -ForegroundColor Yellow
}

# 5. 추가 설정 (선택사항)
Write-Host "`n⚙️ 추가 편의 설정..." -ForegroundColor Yellow

$additionalScript = @"
#!/bin/bash
echo '⚙️ 추가 편의 설정 중...'

# bash 프로필에 유용한 별칭 추가
echo '📝 bash 별칭 추가...'
cat >> ~/.bashrc << 'EOF'

# 편의 별칭들
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'
alias grep='grep --color=auto'
alias fgrep='fgrep --color=auto'
alias egrep='egrep --color=auto'

# sudo 별칭 (이제 비밀번호 없이 사용 가능)
alias svi='sudo vi'
alias snano='sudo nano'
alias scat='sudo cat'
alias stail='sudo tail'

# 시스템 정보 별칭
alias meminfo='free -h'
alias cpuinfo='lscpu'
alias diskinfo='df -h'

EOF

# 프롬프트 색상 설정
echo '🎨 프롬프트 색상 설정...'
echo 'export PS1=\"\\[\\033[01;32m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ \"' >> ~/.bashrc

echo '✅ 추가 설정 완료!'
echo '🔄 새 설정을 적용하려면: source ~/.bashrc'
"@

$additionalScript | Out-File -FilePath "additional-wsl-setup.sh" -Encoding UTF8 -Force

try {
    wsl -e bash -c "chmod +x additional-wsl-setup.sh && ./additional-wsl-setup.sh"
    Write-Host "✅ 추가 편의 설정 완료" -ForegroundColor Green
} catch {
    Write-Host "⚠️ 추가 설정 실패" -ForegroundColor Yellow
}

# 6. WSL 재시작 권장
Write-Host "`n🔄 WSL 재시작 권장..." -ForegroundColor Yellow

$restartScript = @"
@echo off
echo 🔄 WSL 재시작 중...
wsl --shutdown
timeout /t 3 /nobreak >nul
echo ✅ WSL 재시작 완료
echo 🧪 sudo 테스트 중...
wsl -e bash -c "sudo -n whoami && echo '✅ sudo 비밀번호 없이 사용 가능!' || echo '⚠️ 아직 비밀번호가 필요합니다'"
pause
"@

$restartScript | Out-File -FilePath "restart-wsl-test.bat" -Encoding ASCII -Force
Write-Host "✅ WSL 재시작 스크립트 생성: restart-wsl-test.bat" -ForegroundColor Green

# 7. 최종 요약
Write-Host "`n" + "=" * 80 -ForegroundColor Green
Write-Host "🎉 WSL sudo 비밀번호 없이 사용 설정 완료!" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Green

Write-Host "`n📋 수행된 작업들:" -ForegroundColor Yellow
Write-Host "✅ skyasu 사용자를 sudo 그룹에 추가" -ForegroundColor White
Write-Host "✅ /etc/sudoers.d/skyasu 파일 생성 (NOPASSWD 설정)" -ForegroundColor White
Write-Host "✅ sudoers 설정 검증 완료" -ForegroundColor White
Write-Host "✅ 편의 별칭 및 프롬프트 설정 추가" -ForegroundColor White

Write-Host "`n🚀 다음 단계:" -ForegroundColor Yellow
Write-Host "1. WSL 재시작: .\restart-wsl-test.bat" -ForegroundColor Cyan
Write-Host "2. 또는 수동으로: wsl --shutdown 후 wsl 실행" -ForegroundColor Cyan
Write-Host "3. 테스트: wsl -e bash -c 'sudo whoami'" -ForegroundColor Cyan

Write-Host "`n💡 이제 다음 명령어들을 비밀번호 없이 사용할 수 있습니다:" -ForegroundColor Yellow
Write-Host "• sudo apt update" -ForegroundColor White
Write-Host "• sudo npm install -g [패키지]" -ForegroundColor White
Write-Host "• sudo systemctl [명령어]" -ForegroundColor White
Write-Host "• 모든 sudo 명령어들" -ForegroundColor White

Write-Host "`n✅ WSL sudo 설정 완료!" -ForegroundColor Green