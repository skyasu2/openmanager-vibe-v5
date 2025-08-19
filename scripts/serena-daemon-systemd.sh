#!/bin/bash

# =============================================================================
# Serena MCP systemd 서비스 데몬 설정
# WSL에서 systemd를 사용한 안정적인 데몬 실행
# =============================================================================

SERVICE_NAME="serena-mcp-monitor"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
SCRIPT_PATH="/mnt/d/cursor/openmanager-vibe-v5/scripts/serena-auto-monitor.sh"
LOG_FILE="/mnt/d/cursor/openmanager-vibe-v5/logs/serena-systemd-daemon.log"

# 로그 디렉토리 생성
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# systemd 사용 가능 여부 확인
check_systemd() {
    if ! command -v systemctl >/dev/null 2>&1; then
        log "❌ systemd가 설치되지 않았습니다"
        return 1
    fi
    
    if ! systemctl status >/dev/null 2>&1; then
        log "⚠️ systemd가 비활성화되어 있습니다"
        log "📝 WSL에서 systemd 활성화 방법:"
        echo "   1. sudo nano /etc/wsl.conf"
        echo "   2. 다음 내용 추가:"
        echo "      [boot]"
        echo "      systemd=true"
        echo "   3. WSL 재시작: wsl --shutdown && wsl"
        return 1
    fi
    
    log "✅ systemd 사용 가능"
    return 0
}

# systemd 서비스 파일 생성
create_service_file() {
    log "📝 systemd 서비스 파일 생성..."
    
    sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=Serena MCP Health Monitor Daemon
After=network.target
Wants=network.target

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=/mnt/d/cursor/openmanager-vibe-v5
ExecStart=$SCRIPT_PATH
Restart=always
RestartSec=10
StandardOutput=append:$LOG_FILE
StandardError=append:$LOG_FILE

# 환경변수 설정
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/home/$USER/.local/bin
Environment=HOME=/home/$USER

# 리소스 제한
MemoryLimit=100M
TasksMax=10

[Install]
WantedBy=multi-user.target
EOF
    
    if [[ -f "$SERVICE_FILE" ]]; then
        log "✅ 서비스 파일 생성 완료: $SERVICE_FILE"
    else
        log "❌ 서비스 파일 생성 실패"
        return 1
    fi
}

# 서비스 설치
install_service() {
    log "🚀 Serena MCP systemd 서비스 설치 시작"
    
    if ! check_systemd; then
        return 1
    fi
    
    # 스크립트 실행 권한 확인
    if [[ ! -x "$SCRIPT_PATH" ]]; then
        log "⚠️ 스크립트 실행 권한 부여: $SCRIPT_PATH"
        chmod +x "$SCRIPT_PATH"
    fi
    
    # 서비스 파일 생성
    create_service_file
    
    # systemd 데몬 리로드
    log "🔄 systemd 데몬 리로드..."
    sudo systemctl daemon-reload
    
    # 서비스 활성화 (부팅 시 자동 시작)
    log "🔧 서비스 활성화..."
    sudo systemctl enable "$SERVICE_NAME"
    
    # 서비스 시작
    log "▶️ 서비스 시작..."
    sudo systemctl start "$SERVICE_NAME"
    
    # 상태 확인
    if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
        log "🎉 Serena MCP systemd 서비스 설치 및 시작 완료!"
        sudo systemctl status "$SERVICE_NAME" --no-pager -l
    else
        log "❌ 서비스 시작 실패"
        sudo systemctl status "$SERVICE_NAME" --no-pager -l
        return 1
    fi
}

# 서비스 제거
remove_service() {
    log "🗑️ Serena MCP systemd 서비스 제거..."
    
    # 서비스 중지
    if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
        log "⏹️ 서비스 중지..."
        sudo systemctl stop "$SERVICE_NAME"
    fi
    
    # 서비스 비활성화
    if sudo systemctl is-enabled --quiet "$SERVICE_NAME" 2>/dev/null; then
        log "🔧 서비스 비활성화..."
        sudo systemctl disable "$SERVICE_NAME"
    fi
    
    # 서비스 파일 삭제
    if [[ -f "$SERVICE_FILE" ]]; then
        log "📝 서비스 파일 삭제..."
        sudo rm -f "$SERVICE_FILE"
    fi
    
    # 데몬 리로드
    sudo systemctl daemon-reload
    
    log "✅ 서비스 제거 완료"
}

# 상태 확인
check_status() {
    log "📊 Serena MCP systemd 서비스 상태"
    
    if ! check_systemd; then
        return 1
    fi
    
    if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
        log "✅ 서비스 상태: 실행 중"
        
        # 상세 상태
        echo "=== 서비스 상세 정보 ==="
        sudo systemctl status "$SERVICE_NAME" --no-pager -l
        
        # 최근 로그
        echo ""
        echo "=== 최근 로그 (최근 10줄) ==="
        sudo journalctl -u "$SERVICE_NAME" -n 10 --no-pager
        
    else
        log "❌ 서비스 상태: 중지됨 또는 오류"
        sudo systemctl status "$SERVICE_NAME" --no-pager -l 2>/dev/null || echo "서비스가 설치되지 않았습니다"
    fi
}

# 서비스 관리
manage_service() {
    local action="$1"
    
    if ! check_systemd; then
        return 1
    fi
    
    case "$action" in
        "start")
            log "▶️ 서비스 시작..."
            sudo systemctl start "$SERVICE_NAME"
            ;;
        "stop")
            log "⏹️ 서비스 중지..."
            sudo systemctl stop "$SERVICE_NAME"
            ;;
        "restart")
            log "🔄 서비스 재시작..."
            sudo systemctl restart "$SERVICE_NAME"
            ;;
        "enable")
            log "🔧 서비스 자동 시작 활성화..."
            sudo systemctl enable "$SERVICE_NAME"
            ;;
        "disable")
            log "🔧 서비스 자동 시작 비활성화..."
            sudo systemctl disable "$SERVICE_NAME"
            ;;
    esac
    
    # 결과 확인
    sleep 2
    if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
        log "✅ 작업 완료 - 서비스 실행 중"
    else
        log "⚠️ 작업 완료 - 서비스 중지됨"
    fi
}

# 로그 보기
show_logs() {
    local lines="${1:-20}"
    echo "=== Serena MCP systemd 로그 (최근 ${lines}줄) ==="
    sudo journalctl -u "$SERVICE_NAME" -n "$lines" --no-pager
}

# 사용법
usage() {
    cat << EOF
Serena MCP systemd 서비스 데몬 관리 스크립트

사용법: $0 [명령어]

명령어:
  install     - systemd 서비스 설치 및 시작
  remove      - systemd 서비스 제거
  status      - 서비스 상태 확인
  start       - 서비스 시작
  stop        - 서비스 중지
  restart     - 서비스 재시작
  enable      - 부팅 시 자동 시작 활성화
  disable     - 부팅 시 자동 시작 비활성화
  logs [N]    - 서비스 로그 보기 (기본 20줄)
  help        - 이 도움말 출력

systemd 활성화 (필요시):
  sudo nano /etc/wsl.conf
  [boot]
  systemd=true
  
  그 후 WSL 재시작: wsl --shutdown && wsl

예시:
  $0 install    # 서비스 설치 및 시작
  $0 status     # 상태 확인
  $0 logs 50    # 최근 50줄 로그 보기
  $0 restart    # 서비스 재시작
EOF
}

# 메인 실행 로직
case "${1:-help}" in
    "install")
        install_service
        ;;
    "remove")
        remove_service
        ;;
    "status")
        check_status
        ;;
    "start"|"stop"|"restart"|"enable"|"disable")
        manage_service "$1"
        ;;
    "logs")
        show_logs "$2"
        ;;
    "help"|"-h"|"--help")
        usage
        ;;
    *)
        echo "알 수 없는 명령어: $1"
        usage
        exit 1
        ;;
esac