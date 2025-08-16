#!/bin/bash
# WSL 네트워크 및 방화벽 최적화 스크립트 (Claude Code용)

set -e

echo "=== WSL 네트워크 최적화 도구 (Claude Code용) ==="

# 현재 네트워크 상태 확인
check_network_status() {
    echo ""
    echo "🌐 네트워크 상태 확인:"
    
    # IP 주소 정보
    echo "   📍 IP 주소:"
    ip addr show eth0 | grep "inet " | awk '{print "      " $2}' || echo "      IP 정보 없음"
    
    # DNS 설정
    echo "   🔍 DNS 설정:"
    if [ -f /etc/resolv.conf ]; then
        grep "nameserver" /etc/resolv.conf | head -3 | sed 's/^/      /'
    else
        echo "      DNS 설정 없음"
    fi
    
    # 라우팅 테이블
    echo "   🛣️  기본 라우트:"
    ip route show default | sed 's/^/      /' || echo "      라우트 정보 없음"
    
    # 포트 사용 현황
    echo "   🔌 활성 포트:"
    ss -tuln | grep LISTEN | head -5 | sed 's/^/      /'
}

# 방화벽 상태 확인
check_firewall_status() {
    echo ""
    echo "🔥 방화벽 상태:"
    
    # UFW 상태 확인
    if command -v ufw >/dev/null 2>&1; then
        echo "   UFW 상태: $(sudo ufw status | head -1 | cut -d: -f2)"
        
        # UFW 규칙 확인
        local ufw_rules=$(sudo ufw status numbered 2>/dev/null | grep -E "^\[" | wc -l)
        echo "   UFW 규칙: ${ufw_rules}개"
    else
        echo "   UFW: 미설치"
    fi
    
    # iptables 확인
    if command -v iptables >/dev/null 2>&1; then
        local iptables_rules=$(sudo iptables -L | grep -E "^(ACCEPT|DROP|REJECT)" | wc -l)
        echo "   iptables 규칙: ${iptables_rules}개"
    else
        echo "   iptables: 미설치"
    fi
}

# Claude Code 연결 테스트
test_claude_connectivity() {
    echo ""
    echo "🤖 Claude Code 연결 테스트:"
    
    # GitHub API 테스트 (MCP GitHub 서버용)
    echo "   🐙 GitHub API 연결..."
    if curl -s --connect-timeout 5 https://api.github.com/zen >/dev/null 2>&1; then
        echo "      ✅ GitHub API: 정상"
    else
        echo "      ❌ GitHub API: 연결 실패"
    fi
    
    # Supabase 연결 테스트
    echo "   🗄️  Supabase 연결..."
    if curl -s --connect-timeout 5 https://vnswjnltnhpsueosfhmw.supabase.co/rest/v1/ >/dev/null 2>&1; then
        echo "      ✅ Supabase: 정상"
    else
        echo "      ❌ Supabase: 연결 실패"
    fi
    
    # Tavily API 테스트
    echo "   🔍 Tavily API 연결..."
    if curl -s --connect-timeout 5 https://api.tavily.com >/dev/null 2>&1; then
        echo "      ✅ Tavily API: 정상"
    else
        echo "      ❌ Tavily API: 연결 실패"
    fi
    
    # NPM 레지스트리 테스트 (MCP 서버 설치용)
    echo "   📦 NPM 레지스트리 연결..."
    if curl -s --connect-timeout 5 https://registry.npmjs.org >/dev/null 2>&1; then
        echo "      ✅ NPM 레지스트리: 정상"
    else
        echo "      ❌ NPM 레지스트리: 연결 실패"
    fi
}

# 네트워크 최적화 적용
optimize_network() {
    echo ""
    echo "🔧 네트워크 최적화 적용 중..."
    
    # DNS 최적화
    echo "   🔍 DNS 최적화..."
    
    # systemd-resolved 설정 최적화
    if systemctl is-active --quiet systemd-resolved; then
        echo "      systemd-resolved 최적화 설정"
        
        # DNS 캐시 크기 증가
        sudo mkdir -p /etc/systemd/resolved.conf.d
        cat << EOF | sudo tee /etc/systemd/resolved.conf.d/claude-code.conf > /dev/null
[Resolve]
# Claude Code 최적화 DNS 설정
DNS=8.8.8.8 1.1.1.1
FallbackDNS=8.8.4.4 1.0.0.1
Cache=yes
CacheFromLocalhost=yes
DNSStubListener=yes
ReadEtcHosts=yes
EOF
        
        sudo systemctl restart systemd-resolved
        echo "      ✅ DNS 설정 최적화 완료"
    fi
    
    # 네트워크 성능 튜닝
    echo "   ⚡ 네트워크 성능 튜닝..."
    
    # TCP 설정 최적화
    cat << EOF | sudo tee -a /etc/sysctl.conf > /dev/null

# Claude Code 네트워크 최적화 설정
# TCP 버퍼 크기 최적화
net.core.rmem_default = 262144
net.core.rmem_max = 16777216
net.core.wmem_default = 262144
net.core.wmem_max = 16777216

# TCP 연결 최적화
net.ipv4.tcp_rmem = 4096 65536 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_congestion_control = bbr

# 연결 수 최적화
net.core.somaxconn = 1024
net.ipv4.tcp_max_syn_backlog = 1024

# 빠른 연결 재사용
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 30
EOF
    
    # 설정 적용
    sudo sysctl -p > /dev/null 2>&1
    echo "      ✅ 네트워크 성능 튜닝 완료"
}

# 방화벽 최적화
optimize_firewall() {
    echo ""
    echo "🔥 방화벽 최적화..."
    
    # UFW 설치 및 설정
    if ! command -v ufw >/dev/null 2>&1; then
        echo "   📦 UFW 설치 중..."
        sudo apt update -qq && sudo apt install -y ufw
    fi
    
    # UFW 기본 정책 설정
    echo "   🛡️  방화벽 규칙 설정..."
    
    # 기본 정책: 나가는 연결 허용, 들어오는 연결 차단
    sudo ufw --force reset > /dev/null 2>&1
    sudo ufw default deny incoming > /dev/null 2>&1
    sudo ufw default allow outgoing > /dev/null 2>&1
    
    # Claude Code 및 MCP 서버용 포트 허용
    echo "   🔌 필수 포트 허용..."
    
    # SSH (필요시)
    sudo ufw allow 22/tcp comment "SSH" > /dev/null 2>&1
    
    # 개발 서버 포트들
    sudo ufw allow 3000/tcp comment "Next.js Dev Server" > /dev/null 2>&1
    sudo ufw allow 3001/tcp comment "Dev Server Alt" > /dev/null 2>&1
    sudo ufw allow 5173/tcp comment "Vite Dev Server" > /dev/null 2>&1
    sudo ufw allow 8000/tcp comment "Python Dev Server" > /dev/null 2>&1
    
    # MCP 서버 포트 (일반적으로 사용되는 포트들)
    sudo ufw allow 10000:10010/tcp comment "MCP Servers" > /dev/null 2>&1
    
    # 방화벽 활성화
    sudo ufw --force enable > /dev/null 2>&1
    echo "      ✅ 방화벽 설정 완료"
}

# 성능 모니터링
monitor_performance() {
    echo ""
    echo "📊 네트워크 성능 모니터링 (Ctrl+C로 종료):"
    echo ""
    
    while true; do
        clear
        echo "=== WSL 네트워크 성능 모니터링 ==="
        echo "시간: $(date)"
        echo ""
        
        # 네트워크 인터페이스 통계
        echo "🌐 네트워크 인터페이스 통계:"
        cat /proc/net/dev | grep eth0 | awk '{printf "   RX: %s bytes, TX: %s bytes\n", $2, $10}'
        echo ""
        
        # 활성 연결
        echo "🔌 활성 TCP 연결:"
        ss -t | grep ESTAB | wc -l | awk '{print "   연결 수: " $1}'
        echo ""
        
        # DNS 응답 시간
        echo "🔍 DNS 응답 시간:"
        dig +short +time=1 @8.8.8.8 google.com > /dev/null 2>&1 && echo "   Google DNS: 정상" || echo "   Google DNS: 지연"
        
        sleep 5
    done
}

# 도움말
show_help() {
    echo ""
    echo "📖 사용법:"
    echo "   $0 status     # 네트워크 상태 확인"
    echo "   $0 test       # Claude Code 연결 테스트"
    echo "   $0 optimize   # 네트워크 최적화 적용"
    echo "   $0 firewall   # 방화벽 최적화"
    echo "   $0 monitor    # 성능 모니터링"
    echo "   $0 help       # 도움말"
    echo ""
    echo "🎯 권장 사용 순서:"
    echo "   1. $0 status     # 현재 상태 확인"
    echo "   2. $0 optimize   # 네트워크 최적화"
    echo "   3. $0 firewall   # 방화벽 설정"
    echo "   4. $0 test       # 연결 테스트"
}

# 메인 로직
case "${1:-help}" in
    "status")
        check_network_status
        check_firewall_status
        ;;
    "test")
        test_claude_connectivity
        ;;
    "optimize")
        optimize_network
        check_network_status
        ;;
    "firewall")
        optimize_firewall
        check_firewall_status
        ;;
    "monitor")
        monitor_performance
        ;;
    "help"|*)
        show_help
        ;;
esac