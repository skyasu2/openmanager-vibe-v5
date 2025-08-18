#!/bin/bash
# WSL 로컬 개발 환경 최적화 스크립트 (Claude Code용)

set -e

echo "=== WSL 로컬 개발 환경 최적화 도구 ==="

# 현재 개발 환경 상태 확인
check_dev_environment() {
    echo ""
    echo "🛠️  개발 환경 상태 확인:"
    
    # Node.js 환경
    echo "   📦 Node.js 환경:"
    if command -v node >/dev/null 2>&1; then
        echo "      Node.js: $(node --version)"
        echo "      NPM: $(npm --version)"
        echo "      NPX: $(npx --version)"
    else
        echo "      ❌ Node.js 미설치"
    fi
    
    # Python 환경
    echo "   🐍 Python 환경:"
    if command -v python3 >/dev/null 2>&1; then
        echo "      Python: $(python3 --version)"
        if command -v pip3 >/dev/null 2>&1; then
            echo "      Pip: $(pip3 --version | cut -d' ' -f2)"
        fi
    else
        echo "      ❌ Python 미설치"
    fi
    
    # Git 환경
    echo "   🔧 Git 환경:"
    if command -v git >/dev/null 2>&1; then
        echo "      Git: $(git --version)"
    else
        echo "      ❌ Git 미설치"
    fi
    
    # 방화벽 상태
    echo "   🔥 보안 설정:"
    if command -v ufw >/dev/null 2>&1; then
        local ufw_status=$(sudo ufw status | head -1 | cut -d: -f2 | xargs)
        echo "      방화벽: $ufw_status (로컬 개발용)"
    else
        echo "      방화벽: 미설치 (로컬 개발 최적)"
    fi
}

# 개발 포트 확인
check_dev_ports() {
    echo ""
    echo "🔌 개발 서버 포트 상태:"
    
    # 일반적인 개발 포트들
    local dev_ports=(3000 3001 5173 8000 8080 9000)
    
    for port in "${dev_ports[@]}"; do
        if ss -tuln | grep ":$port " >/dev/null 2>&1; then
            echo "   포트 $port: 🟢 사용 중"
        else
            echo "   포트 $port: ⚪ 사용 가능"
        fi
    done
}

# Claude Code MCP 서버 테스트
test_mcp_servers() {
    echo ""
    echo "🤖 MCP 서버 연결 테스트:"
    
    # GitHub API (MCP GitHub 서버용)
    echo "   🐙 GitHub API..."
    if curl -s --connect-timeout 3 https://api.github.com/zen >/dev/null 2>&1; then
        echo "      ✅ 연결 정상"
    else
        echo "      ❌ 연결 실패"
    fi
    
    # NPM 레지스트리 (MCP 서버 설치용)
    echo "   📦 NPM 레지스트리..."
    if curl -s --connect-timeout 3 https://registry.npmjs.org >/dev/null 2>&1; then
        echo "      ✅ 연결 정상"
    else
        echo "      ❌ 연결 실패"
    fi
    
    # Supabase (프로젝트 DB)
    echo "   🗄️  Supabase..."
    if [[ -n "${SUPABASE_PROJECT_ID:-}" ]] && curl -s --connect-timeout 3 "https://${SUPABASE_PROJECT_ID}.supabase.co/rest/v1/" >/dev/null 2>&1; then
        echo "      ✅ 연결 정상"
    else
        echo "      ❌ 연결 실패"
    fi
}

# 로컬 개발 최적화 적용
optimize_for_local_dev() {
    echo ""
    echo "🔧 로컬 개발 환경 최적화 적용 중..."
    
    # 방화벽 비활성화 (로컬 개발용)
    if command -v ufw >/dev/null 2>&1; then
        echo "   🔥 방화벽 비활성화 (로컬 개발 최적화)..."
        sudo ufw disable >/dev/null 2>&1
        echo "      ✅ 방화벽 비활성화 완료"
    fi
    
    # 네트워크 성능 최적화 (개발용)
    echo "   ⚡ 네트워크 성능 최적화..."
    
    # 로컬 개발용 네트워크 설정
    cat << 'EOF' | sudo tee /etc/sysctl.d/99-local-dev.conf > /dev/null
# 로컬 개발 환경 네트워크 최적화
# 빠른 로컬 연결을 위한 설정

# TCP 연결 최적화 (로컬 개발용)
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_tw_reuse = 1
net.core.somaxconn = 2048

# 로컬 루프백 최적화
net.core.rmem_default = 262144
net.core.wmem_default = 262144

# 개발 서버용 연결 수 증가
net.core.netdev_max_backlog = 2000
net.ipv4.tcp_max_syn_backlog = 2048
EOF
    
    sudo sysctl -p /etc/sysctl.d/99-local-dev.conf >/dev/null 2>&1
    echo "      ✅ 네트워크 최적화 완료"
    
    # DNS 최적화 (개발용)
    echo "   🔍 DNS 최적화 (개발용)..."
    
    # 빠른 DNS 서버 설정
    if systemctl is-active --quiet systemd-resolved; then
        sudo mkdir -p /etc/systemd/resolved.conf.d
        cat << 'EOF' | sudo tee /etc/systemd/resolved.conf.d/local-dev.conf > /dev/null
[Resolve]
# 로컬 개발용 DNS 설정
DNS=1.1.1.1 8.8.8.8
FallbackDNS=1.0.0.1 8.8.4.4
Cache=yes
CacheFromLocalhost=yes
DNSStubListener=yes
ReadEtcHosts=yes
# 빠른 응답을 위한 설정
Domains=~.
DNSSEC=no
EOF
        
        sudo systemctl restart systemd-resolved >/dev/null 2>&1
        echo "      ✅ DNS 최적화 완료"
    fi
    
    # 개발 도구 환경변수 설정
    echo "   🛠️  개발 환경변수 설정..."
    
    # 개발용 환경변수를 .bashrc에 추가
    if ! grep -q "# 로컬 개발 환경 설정" ~/.bashrc; then
        cat << 'EOF' >> ~/.bashrc

# 로컬 개발 환경 설정
export NODE_ENV=development
export FORCE_COLOR=1
export NPM_CONFIG_COLOR=always

# 개발 서버 기본 포트
export DEV_PORT=3000
export API_PORT=3001

# 로컬 개발 최적화
export NODE_OPTIONS="--max-old-space-size=4096"
export UV_THREADPOOL_SIZE=128

# Claude Code 개발 환경
export CLAUDE_DEV_MODE=true
export MCP_DEV_MODE=true
EOF
        echo "      ✅ 개발 환경변수 설정 완료"
    else
        echo "      ℹ️  개발 환경변수 이미 설정됨"
    fi
}

# 개발 도구 설치 확인 및 권장사항
check_dev_tools() {
    echo ""
    echo "🛠️  개발 도구 설치 상태:"
    
    # 필수 도구들
    local tools=("curl" "wget" "git" "vim" "nano" "htop" "tree")
    
    for tool in "${tools[@]}"; do
        if command -v "$tool" >/dev/null 2>&1; then
            echo "   ✅ $tool: 설치됨"
        else
            echo "   ❌ $tool: 미설치"
        fi
    done
    
    echo ""
    echo "💡 권장 설치 명령어:"
    echo "   sudo apt update && sudo apt install -y curl wget git vim nano htop tree"
}

# 성능 모니터링 (개발용)
monitor_dev_performance() {
    echo ""
    echo "📊 개발 환경 성능 모니터링 (Ctrl+C로 종료):"
    echo ""
    
    while true; do
        clear
        echo "=== WSL 개발 환경 모니터링 ==="
        echo "시간: $(date)"
        echo ""
        
        # 메모리 사용량
        echo "💾 메모리 사용량:"
        free -h | grep -E "(Mem|Swap)" | sed 's/^/   /'
        echo ""
        
        # CPU 사용률
        echo "🖥️  CPU 사용률:"
        top -bn1 | grep "Cpu(s)" | sed 's/^/   /'
        echo ""
        
        # 네트워크 연결
        echo "🌐 네트워크 연결:"
        ss -tuln | grep LISTEN | wc -l | awk '{print "   활성 포트: " $1 "개"}'
        
        # 개발 서버 포트 확인
        if ss -tuln | grep ":3000" >/dev/null 2>&1; then
            echo "   🟢 개발 서버 (3000): 실행 중"
        else
            echo "   ⚪ 개발 서버 (3000): 대기 중"
        fi
        
        sleep 3
    done
}

# 도움말
show_help() {
    echo ""
    echo "📖 사용법:"
    echo "   $0 status     # 개발 환경 상태 확인"
    echo "   $0 ports      # 개발 포트 상태 확인"
    echo "   $0 test       # MCP 서버 연결 테스트"
    echo "   $0 optimize   # 로컬 개발 최적화 적용"
    echo "   $0 tools      # 개발 도구 설치 상태"
    echo "   $0 monitor    # 성능 모니터링"
    echo "   $0 help       # 도움말"
    echo ""
    echo "🎯 로컬 개발 최적화 포인트:"
    echo "   • 방화벽 비활성화 (로컬 접근 자유)"
    echo "   • 빠른 DNS 서버 (1.1.1.1, 8.8.8.8)"
    echo "   • TCP 연결 최적화 (빠른 재연결)"
    echo "   • 개발 환경변수 자동 설정"
    echo "   • 포트 충돌 방지"
}

# 메인 로직
case "${1:-help}" in
    "status")
        check_dev_environment
        ;;
    "ports")
        check_dev_ports
        ;;
    "test")
        test_mcp_servers
        ;;
    "optimize")
        optimize_for_local_dev
        check_dev_environment
        ;;
    "tools")
        check_dev_tools
        ;;
    "monitor")
        monitor_dev_performance
        ;;
    "help"|*)
        show_help
        ;;
esac