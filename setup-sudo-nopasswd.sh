#!/bin/bash
echo '🔐 sudoers 파일 수정 중...'

# 현재 사용자 확인
CURRENT_USER=\sky-note\skyas
echo '현재 사용자:' \

# sudoers 파일 백업
echo '💾 sudoers 파일 백업 중...'
sudo cp /etc/sudoers /etc/sudoers.backup-\

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

if [ \False -eq 0 ]; then
    echo '✅ sudoers 설정이 올바릅니다'
else
    echo '❌ sudoers 설정에 오류가 있습니다'
    echo '🔄 백업에서 복원 중...'
    sudo cp /etc/sudoers.backup-* /etc/sudoers
    exit 1
fi

echo '✅ sudo 비밀번호 없이 사용 설정 완료!'
