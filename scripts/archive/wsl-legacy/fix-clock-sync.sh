#!/bin/bash

# 🕐 WSL 시간 동기화 스크립트
# 
# WSL에서 시계가 Windows와 동기화되지 않을 때 사용
# "Session was issued in the future" 오류 해결

echo "🕐 WSL 시간 동기화 시작..."

# 현재 시간 확인
echo "현재 WSL 시간: $(date)"

# Windows 시간과 동기화 (관리자 권한 필요)
if command -v hwclock &> /dev/null; then
    sudo hwclock -s
    echo "✅ hwclock으로 시간 동기화 완료"
else
    # hwclock이 없으면 ntpdate 사용
    if command -v ntpdate &> /dev/null; then
        sudo ntpdate time.windows.com
        echo "✅ ntpdate로 시간 동기화 완료"
    else
        # 둘 다 없으면 수동 설정
        echo "⚠️  시간 동기화 도구가 없습니다. 수동으로 설정하세요:"
        echo "sudo date -s \"$(powershell.exe -Command 'Get-Date -Format "yyyy-MM-dd HH:mm:ss"' | tr -d '\r')\""
    fi
fi

# 동기화 후 시간 확인
echo "동기화 후 WSL 시간: $(date)"

# NTP 서비스 재시작 (있는 경우)
if systemctl is-active --quiet ntp; then
    sudo systemctl restart ntp
    echo "✅ NTP 서비스 재시작됨"
fi

# 시간대 확인
echo "현재 시간대: $(timedatectl | grep "Time zone" || echo "시간대 정보 없음")"

echo ""
echo "💡 팁:"
echo "1. WSL을 재시작한 후에는 항상 이 스크립트를 실행하세요"
echo "2. 영구적 해결을 위해 /etc/wsl.conf에 다음을 추가하세요:"
echo "   [boot]"
echo "   systemd=true"
echo ""
echo "3. Windows에서 다음 명령으로도 동기화 가능:"
echo "   wsl -d Ubuntu -u root -- ntpdate time.windows.com"