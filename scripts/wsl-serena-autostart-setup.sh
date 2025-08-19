#!/bin/bash

# =============================================================================
# WSL Serena MCP 자동 시작 설정 및 최적화 스크립트
# WSL 부팅 시 Serena MCP systemd 서비스 자동 시작 보장
# =============================================================================

set -euo pipefail

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "[$(date '+%H:%M:%S')] $1"
}

# WSL 설정 최적화
optimize_wsl_config() {
    log "${BLUE}🔧 WSL 설정 최적화...${NC}"
    
    # /etc/wsl.conf 백업
    if [[ -f /etc/wsl.conf ]]; then
        sudo cp /etc/wsl.conf /etc/wsl.conf.backup.$(date +%s)
        log "${GREEN}✅ 기존 설정 백업 완료${NC}"
    fi
    
    # 최적화된 WSL 설정
    sudo tee /etc/wsl.conf > /dev/null << 'EOF'
[boot]
# systemd 활성화 (필수)
systemd=true

# 네트워크 최적화
command=bash -c 'echo "WSL 부팅 완료 - Serena MCP 모니터링 시작" >> /var/log/wsl-boot.log; date >> /var/log/wsl-boot.log'

[user]
default=skyasu

[automount]
enabled=true
root=/mnt/
options=metadata,uid=1000,gid=1000,umask=022,fmask=011

[network]
# 네트워크 최적화 (Claude Code 연결 개선)
generateHosts=false
generateResolvConf=false

[interop]
# Windows 실행 파일 접근 최적화
enabled=true
appendWindowsPath=true
EOF
    
    log "${GREEN}✅ WSL 설정 최적화 완료${NC}"
}

# systemd 서비스 상태 확인
check_systemd_service() {
    log "${BLUE}🔍 Serena MCP systemd 서비스 상태 확인...${NC}"
    
    # 서비스 존재 확인
    if ! systemctl list-unit-files | grep -q "serena-mcp-monitor.service"; then
        log "${RED}❌ Serena MCP 서비스가 설치되지 않았습니다${NC}"
        log "${YELLOW}📝 설치 명령어: ./scripts/serena-daemon-manager.sh systemd install${NC}"
        return 1
    fi
    
    # 서비스 활성화 확인
    if systemctl is-enabled --quiet serena-mcp-monitor.service; then
        log "${GREEN}✅ 서비스 부팅 시 자동 시작 활성화됨${NC}"
    else
        log "${YELLOW}⚠️ 서비스 자동 시작 비활성화 - 활성화 중...${NC}"
        sudo systemctl enable serena-mcp-monitor.service
        log "${GREEN}✅ 자동 시작 활성화 완료${NC}"
    fi
    
    # 서비스 실행 상태 확인
    if systemctl is-active --quiet serena-mcp-monitor.service; then
        log "${GREEN}✅ 서비스 현재 실행 중${NC}"
    else
        log "${YELLOW}⚠️ 서비스 중지됨 - 시작 중...${NC}"
        sudo systemctl start serena-mcp-monitor.service
        
        # 시작 확인
        sleep 3
        if systemctl is-active --quiet serena-mcp-monitor.service; then
            log "${GREEN}✅ 서비스 시작 완료${NC}"
        else
            log "${RED}❌ 서비스 시작 실패${NC}"
            sudo systemctl status serena-mcp-monitor.service --no-pager -l
            return 1
        fi
    fi
}

# 서비스 의존성 최적화
optimize_service_dependencies() {
    log "${BLUE}🔧 서비스 의존성 최적화...${NC}"
    
    local service_file="/etc/systemd/system/serena-mcp-monitor.service"
    
    if [[ -f "$service_file" ]]; then
        # 백업
        sudo cp "$service_file" "${service_file}.backup.$(date +%s)"
        
        # 최적화된 서비스 파일 생성
        sudo tee "$service_file" > /dev/null << EOF
[Unit]
Description=Serena MCP Health Monitor Daemon
After=network.target network-online.target
Wants=network-online.target
ConditionPathExists=/mnt/d/cursor/openmanager-vibe-v5

[Service]
Type=simple
User=skyasu
Group=skyasu
WorkingDirectory=/mnt/d/cursor/openmanager-vibe-v5
ExecStart=/mnt/d/cursor/openmanager-vibe-v5/scripts/serena-auto-monitor.sh
Restart=always
RestartSec=10
StartLimitInterval=300
StartLimitBurst=5

# 출력 관리
StandardOutput=append:/mnt/d/cursor/openmanager-vibe-v5/logs/serena-systemd.log
StandardError=append:/mnt/d/cursor/openmanager-vibe-v5/logs/serena-systemd-error.log

# 환경변수 설정
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/home/skyasu/.local/bin
Environment=HOME=/home/skyasu
Environment=USER=skyasu

# 리소스 제한
MemoryLimit=200M
TasksMax=20
TimeoutStartSec=60
TimeoutStopSec=30

# 보안 설정
PrivateTmp=true
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
EOF
        
        # systemd 리로드
        sudo systemctl daemon-reload
        log "${GREEN}✅ 서비스 의존성 최적화 완료${NC}"
    else
        log "${RED}❌ 서비스 파일을 찾을 수 없습니다${NC}"
        return 1
    fi
}

# WSL 재시작 테스트 준비
prepare_boot_test() {
    log "${BLUE}🧪 WSL 부팅 테스트 준비...${NC}"
    
    # 부팅 테스트 로그 디렉토리 생성
    sudo mkdir -p /var/log
    
    # 부팅 시간 측정 스크립트 생성
    sudo tee /usr/local/bin/wsl-boot-test.sh > /dev/null << 'EOF'
#!/bin/bash
# WSL 부팅 시간 및 Serena MCP 서비스 시작 시간 측정

BOOT_LOG="/var/log/wsl-serena-boot.log"

echo "=== WSL 부팅 테스트 $(date) ===" >> "$BOOT_LOG"
echo "부팅 시간: $(uptime)" >> "$BOOT_LOG"

# Serena MCP 서비스 상태 확인 (최대 30초 대기)
for i in {1..30}; do
    if systemctl is-active --quiet serena-mcp-monitor.service; then
        echo "✅ Serena MCP 서비스 시작: ${i}초 후" >> "$BOOT_LOG"
        break
    fi
    sleep 1
done

if ! systemctl is-active --quiet serena-mcp-monitor.service; then
    echo "❌ Serena MCP 서비스 30초 내 시작 실패" >> "$BOOT_LOG"
fi

echo "서비스 상태: $(systemctl is-active serena-mcp-monitor.service)" >> "$BOOT_LOG"
echo "" >> "$BOOT_LOG"
EOF
    
    sudo chmod +x /usr/local/bin/wsl-boot-test.sh
    
    # 부팅 시 테스트 실행하도록 설정
    if ! grep -q "wsl-boot-test.sh" /etc/wsl.conf; then
        sudo sed -i 's|command=.*|command=bash -c "/usr/local/bin/wsl-boot-test.sh \&"|' /etc/wsl.conf
    fi
    
    log "${GREEN}✅ 부팅 테스트 준비 완료${NC}"
}

# 로그 관리 설정
setup_log_management() {
    log "${BLUE}🗂️ 로그 관리 설정...${NC}"
    
    # 로그 디렉토리 생성
    mkdir -p /mnt/d/cursor/openmanager-vibe-v5/logs
    
    # logrotate 설정
    sudo tee /etc/logrotate.d/serena-mcp > /dev/null << 'EOF'
/mnt/d/cursor/openmanager-vibe-v5/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 skyasu skyasu
    postrotate
        systemctl reload-or-restart serena-mcp-monitor.service > /dev/null 2>&1 || true
    endscript
}

/var/log/wsl-serena-boot.log {
    weekly
    rotate 4
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
EOF
    
    log "${GREEN}✅ 로그 관리 설정 완료${NC}"
}

# 상태 보고서
final_status_report() {
    log "${BLUE}📊 WSL Serena MCP 자동 시작 설정 완료 보고서${NC}"
    echo ""
    
    log "${GREEN}✅ 설정 완료 항목:${NC}"
    log "   1. WSL systemd 활성화 및 최적화"
    log "   2. Serena MCP systemd 서비스 자동 시작 설정"
    log "   3. 서비스 의존성 및 재시작 정책 최적화"
    log "   4. 부팅 테스트 스크립트 준비"
    log "   5. 로그 관리 시스템 설정"
    
    echo ""
    log "${BLUE}🔍 현재 서비스 상태:${NC}"
    if systemctl is-active --quiet serena-mcp-monitor.service; then
        log "${GREEN}   ✅ Serena MCP 서비스: 실행 중${NC}"
        log "   📊 PID: $(systemctl show -p MainPID --value serena-mcp-monitor.service)"
        log "   ⏱️ 실행 시간: $(systemctl show -p ActiveEnterTimestamp --value serena-mcp-monitor.service)"
    else
        log "${RED}   ❌ Serena MCP 서비스: 중지됨${NC}"
    fi
    
    if systemctl is-enabled --quiet serena-mcp-monitor.service; then
        log "${GREEN}   ✅ 자동 시작: 활성화됨${NC}"
    else
        log "${RED}   ❌ 자동 시작: 비활성화됨${NC}"
    fi
    
    echo ""
    log "${YELLOW}🚀 WSL 재시작 테스트 방법:${NC}"
    log "   1. Windows에서: wsl --shutdown"
    log "   2. 다시 WSL 시작: wsl"
    log "   3. 테스트 로그 확인: sudo cat /var/log/wsl-serena-boot.log"
    log "   4. 서비스 상태 확인: systemctl status serena-mcp-monitor.service"
    
    echo ""
    log "${GREEN}🎉 WSL 자동 시작 시 Serena MCP systemd 관리 설정 완료!${NC}"
}

# 사용법
usage() {
    cat << EOF
WSL Serena MCP 자동 시작 설정 스크립트

사용법: $0 [옵션]

옵션:
  full          - 전체 설정 (기본값)
  wsl-config    - WSL 설정만 최적화
  service       - systemd 서비스만 확인/설정
  dependencies  - 서비스 의존성만 최적화
  logs          - 로그 관리만 설정
  test          - 부팅 테스트 준비
  status        - 현재 상태만 확인
  help          - 이 도움말 출력

전체 설정 실행 후 WSL을 재시작하여 자동 시작을 테스트하세요.
EOF
}

# 메인 실행 로직
case "${1:-full}" in
    "full")
        log "${BLUE}🚀 WSL Serena MCP 자동 시작 전체 설정 시작${NC}"
        optimize_wsl_config
        check_systemd_service
        optimize_service_dependencies
        prepare_boot_test
        setup_log_management
        final_status_report
        ;;
    "wsl-config")
        optimize_wsl_config
        ;;
    "service")
        check_systemd_service
        ;;
    "dependencies")
        optimize_service_dependencies
        ;;
    "logs")
        setup_log_management
        ;;
    "test")
        prepare_boot_test
        ;;
    "status")
        final_status_report
        ;;
    "help"|"-h"|"--help")
        usage
        ;;
    *)
        echo "알 수 없는 옵션: $1"
        usage
        exit 1
        ;;
esac