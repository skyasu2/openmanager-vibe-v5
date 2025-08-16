#!/bin/bash

# Serena Pre-warming Service 시스템 통합 설치 스크립트
# WSL 환경에서 Serena MCP를 systemd 서비스로 등록하여 자동 시작

set -e

# 설정 변수
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
SERVICE_NAME="serena-prewarming"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
SCRIPT_PATH="${PROJECT_ROOT}/scripts/mcp/serena-prewarming-service.mjs"
USER_NAME="$USER"
NODE_PATH="/home/${USER_NAME}/.local/bin/node"

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "[$(date '+%H:%M:%S')] ${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "[$(date '+%H:%M:%S')] ${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "[$(date '+%H:%M:%S')] ${RED}[ERROR]${NC} $1" >&2
}

log_warn() {
    echo -e "[$(date '+%H:%M:%S')] ${YELLOW}[WARN]${NC} $1"
}

# 헤더 출력
print_header() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔥 Serena Pre-warming Service 설치 및 관리 스크립트"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# 사용법 출력
print_usage() {
    echo "사용법: $0 [install|uninstall|start|stop|restart|status|logs|dashboard]"
    echo ""
    echo "명령어:"
    echo "  install   - 서비스 설치 및 활성화"
    echo "  uninstall - 서비스 제거"
    echo "  start     - 서비스 시작"
    echo "  stop      - 서비스 중지"
    echo "  restart   - 서비스 재시작"
    echo "  status    - 서비스 상태 확인"
    echo "  logs      - 서비스 로그 확인"
    echo "  dashboard - 웹 대시보드 열기"
    echo ""
}

# 환경 확인
check_environment() {
    log_info "환경 확인 중..."
    
    # WSL 환경 확인
    if ! grep -qi microsoft /proc/version; then
        log_warn "WSL 환경이 아닐 수 있습니다"
    fi
    
    # 프로젝트 디렉토리 확인
    if [ ! -d "$PROJECT_ROOT" ]; then
        log_error "프로젝트 디렉토리가 존재하지 않습니다: $PROJECT_ROOT"
        exit 1
    fi
    
    # 스크립트 파일 확인
    if [ ! -f "$SCRIPT_PATH" ]; then
        log_error "서비스 스크립트가 존재하지 않습니다: $SCRIPT_PATH"
        exit 1
    fi
    
    # Node.js 확인
    if [ ! -f "$NODE_PATH" ]; then
        log_error "Node.js를 찾을 수 없습니다: $NODE_PATH"
        echo "다음 명령으로 Node.js를 설치하세요:"
        echo "curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -"
        echo "sudo apt-get install -y nodejs"
        exit 1
    fi
    
    # uvx 확인
    if ! command -v uvx > /dev/null; then
        log_error "uvx 명령을 찾을 수 없습니다"
        echo "다음 명령으로 uv를 설치하세요:"
        echo "curl -LsSf https://astral.sh/uv/install.sh | sh"
        exit 1
    fi
    
    # sudo 권한 확인
    if ! sudo -n true 2>/dev/null; then
        log_error "sudo 권한이 필요합니다"
        exit 1
    fi
    
    log_success "환경 확인 완료"
}

# 서비스 파일 생성
create_service_file() {
    log_info "systemd 서비스 파일 생성 중..."
    
    sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=Serena MCP Pre-warming Service
Documentation=https://github.com/oraios/serena
After=network.target
Wants=network.target

[Service]
Type=simple
User=$USER_NAME
Group=$USER_NAME
WorkingDirectory=$PROJECT_ROOT
ExecStart=$NODE_PATH $SCRIPT_PATH
ExecReload=/bin/kill -s HUP \$MAINPID
KillMode=mixed
KillSignal=SIGTERM
TimeoutStopSec=30

# 환경 변수
Environment=PATH=/home/$USER_NAME/.local/bin:/usr/local/bin:/usr/bin:/bin
Environment=HOME=/home/$USER_NAME
Environment=NODE_ENV=production

# 재시작 정책
Restart=always
RestartSec=10
StartLimitInterval=60
StartLimitBurst=3

# 로그 설정
StandardOutput=journal
StandardError=journal
SyslogIdentifier=serena-prewarming

# 보안 설정
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$PROJECT_ROOT /tmp

[Install]
WantedBy=multi-user.target
EOF
    
    log_success "서비스 파일 생성 완료: $SERVICE_FILE"
}

# 서비스 설치
install_service() {
    log_info "🚀 Serena Pre-warming Service 설치 시작"
    
    check_environment
    
    # 기존 서비스 중지 (있는 경우)
    if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        log_warn "기존 서비스 중지 중..."
        sudo systemctl stop "$SERVICE_NAME"
    fi
    
    # 서비스 파일 생성
    create_service_file
    
    # systemd 리로드
    log_info "systemd 설정 리로드 중..."
    sudo systemctl daemon-reload
    
    # 서비스 활성화
    log_info "서비스 활성화 중..."
    sudo systemctl enable "$SERVICE_NAME"
    
    # 서비스 시작
    log_info "서비스 시작 중..."
    sudo systemctl start "$SERVICE_NAME"
    
    # 상태 확인
    sleep 3
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        log_success "✅ 서비스 설치 및 시작 완료!"
        echo ""
        show_service_info
    else
        log_error "서비스 시작 실패"
        sudo systemctl status "$SERVICE_NAME" --no-pager
        exit 1
    fi
}

# 서비스 제거
uninstall_service() {
    log_info "🗑️ Serena Pre-warming Service 제거 시작"
    
    # 서비스 중지
    if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        log_info "서비스 중지 중..."
        sudo systemctl stop "$SERVICE_NAME"
    fi
    
    # 서비스 비활성화
    if systemctl is-enabled --quiet "$SERVICE_NAME" 2>/dev/null; then
        log_info "서비스 비활성화 중..."
        sudo systemctl disable "$SERVICE_NAME"
    fi
    
    # 서비스 파일 제거
    if [ -f "$SERVICE_FILE" ]; then
        log_info "서비스 파일 제거 중..."
        sudo rm -f "$SERVICE_FILE"
    fi
    
    # systemd 리로드
    sudo systemctl daemon-reload
    
    # 로그 파일 정리 (선택적)
    read -p "로그 파일도 제거하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "로그 파일 정리 중..."
        sudo rm -f /tmp/serena-prewarming.log
        sudo rm -f /tmp/serena-proxy*.log
        sudo rm -f /tmp/serena-*-state.json
    fi
    
    log_success "✅ 서비스 제거 완료"
}

# 서비스 정보 표시
show_service_info() {
    echo "📊 서비스 정보:"
    echo "  • 이름: $SERVICE_NAME"
    echo "  • 상태: $(systemctl is-active "$SERVICE_NAME")"
    echo "  • 활성화: $(systemctl is-enabled "$SERVICE_NAME" 2>/dev/null || echo 'disabled')"
    echo "  • 웹 대시보드: http://localhost:3101/dashboard"
    echo "  • 상태 API: http://localhost:3101/status"
    echo "  • 헬스체크: http://localhost:3101/health"
    echo ""
    echo "🔧 관리 명령어:"
    echo "  • 상태 확인: sudo systemctl status $SERVICE_NAME"
    echo "  • 로그 확인: sudo journalctl -u $SERVICE_NAME -f"
    echo "  • 재시작: sudo systemctl restart $SERVICE_NAME"
    echo ""
}

# 대시보드 열기
open_dashboard() {
    local dashboard_url="http://localhost:3101/dashboard"
    
    # 서비스 상태 확인
    if ! systemctl is-active --quiet "$SERVICE_NAME"; then
        log_error "서비스가 실행 중이지 않습니다"
        echo "다음 명령으로 서비스를 시작하세요: $0 start"
        exit 1
    fi
    
    # 대시보드 접근 가능 여부 확인
    if curl -s --max-time 3 "$dashboard_url" > /dev/null; then
        log_success "대시보드를 브라우저에서 열어주세요: $dashboard_url"
        
        # WSL에서 Windows 브라우저로 열기 시도
        if command -v wslview > /dev/null; then
            wslview "$dashboard_url"
        elif command -v cmd.exe > /dev/null; then
            cmd.exe /c start "$dashboard_url"
        fi
    else
        log_error "대시보드에 접근할 수 없습니다"
        echo "서비스 상태를 확인해주세요: $0 status"
    fi
}

# 메인 실행
main() {
    print_header
    
    case "${1:-help}" in
        install)
            install_service
            ;;
        uninstall)
            uninstall_service
            ;;
        start)
            log_info "서비스 시작 중..."
            sudo systemctl start "$SERVICE_NAME"
            if systemctl is-active --quiet "$SERVICE_NAME"; then
                log_success "✅ 서비스 시작 완료"
                show_service_info
            else
                log_error "서비스 시작 실패"
                sudo systemctl status "$SERVICE_NAME" --no-pager
            fi
            ;;
        stop)
            log_info "서비스 중지 중..."
            sudo systemctl stop "$SERVICE_NAME"
            log_success "✅ 서비스 중지 완료"
            ;;
        restart)
            log_info "서비스 재시작 중..."
            sudo systemctl restart "$SERVICE_NAME"
            if systemctl is-active --quiet "$SERVICE_NAME"; then
                log_success "✅ 서비스 재시작 완료"
                show_service_info
            else
                log_error "서비스 재시작 실패"
                sudo systemctl status "$SERVICE_NAME" --no-pager
            fi
            ;;
        status)
            echo "📊 Serena Pre-warming Service 상태:"
            echo ""
            sudo systemctl status "$SERVICE_NAME" --no-pager
            echo ""
            show_service_info
            ;;
        logs)
            log_info "서비스 로그 표시 중... (Ctrl+C로 종료)"
            sudo journalctl -u "$SERVICE_NAME" -f --since "1 hour ago"
            ;;
        dashboard)
            open_dashboard
            ;;
        help|--help|-h)
            print_usage
            ;;
        *)
            log_error "알 수 없는 명령어: $1"
            print_usage
            exit 1
            ;;
    esac
}

# 메인 실행
main "$@"