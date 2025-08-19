#!/bin/bash

# =============================================================================
# Serena MCP Cron 데몬 설정 스크립트
# WSL에서 cron을 사용한 자동 헬스체크 데몬
# =============================================================================

SCRIPT_DIR="/mnt/d/cursor/openmanager-vibe-v5/scripts"
CRON_SCRIPT="$SCRIPT_DIR/serena-quick-recovery.sh"
LOG_FILE="/mnt/d/cursor/openmanager-vibe-v5/logs/serena-cron-daemon.log"

# 로그 디렉토리 생성
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Cron 서비스 확인/시작
ensure_cron_service() {
    if ! pgrep -x "cron" > /dev/null; then
        log "📅 Cron 서비스 시작..."
        sudo service cron start
        if pgrep -x "cron" > /dev/null; then
            log "✅ Cron 서비스 시작 완료"
        else
            log "❌ Cron 서비스 시작 실패"
            return 1
        fi
    else
        log "✅ Cron 서비스 이미 실행 중"
    fi
}

# Cron 작업 추가
install_cron_job() {
    log "📝 Serena MCP 헬스체크 Cron 작업 설치..."
    
    # 기존 Serena 관련 cron 작업 제거
    crontab -l 2>/dev/null | grep -v "serena" | crontab - 2>/dev/null || true
    
    # 새 cron 작업 추가 (3분마다 체크)
    (
        crontab -l 2>/dev/null || true
        echo "# Serena MCP Health Check Daemon"
        echo "*/3 * * * * $CRON_SCRIPT recover >> $LOG_FILE 2>&1"
        echo "# Serena MCP 로그 정리 (매일 자정)"
        echo "0 0 * * * find /mnt/d/cursor/openmanager-vibe-v5/logs -name '*.log' -mtime +7 -delete"
    ) | crontab -
    
    log "✅ Cron 작업 설치 완료 (3분마다 헬스체크)"
    log "📋 현재 Cron 작업 목록:"
    crontab -l | grep -A2 -B2 serena || echo "   (Serena 관련 작업 없음)"
}

# Cron 작업 제거
remove_cron_job() {
    log "🗑️ Serena MCP Cron 작업 제거..."
    crontab -l 2>/dev/null | grep -v -E "(serena|Serena)" | crontab - 2>/dev/null || true
    log "✅ Cron 작업 제거 완료"
}

# 상태 확인
check_status() {
    log "📊 Serena MCP Cron 데몬 상태"
    
    # Cron 서비스 상태
    if pgrep -x "cron" > /dev/null; then
        log "✅ Cron 서비스: 실행 중"
    else
        log "❌ Cron 서비스: 중지됨"
    fi
    
    # Cron 작업 확인
    local cron_jobs=$(crontab -l 2>/dev/null | grep -c serena || echo 0)
    if [[ $cron_jobs -gt 0 ]]; then
        log "✅ Serena Cron 작업: $cron_jobs개 등록됨"
        crontab -l | grep serena
    else
        log "❌ Serena Cron 작업: 등록되지 않음"
    fi
    
    # 최근 로그 확인
    if [[ -f "$LOG_FILE" ]]; then
        log "📝 최근 로그 (최근 5줄):"
        tail -5 "$LOG_FILE" | sed 's/^/   /'
    else
        log "📝 로그 파일 없음"
    fi
}

# 로그 보기
show_logs() {
    if [[ -f "$LOG_FILE" ]]; then
        echo "=== Serena MCP Cron 데몬 로그 ==="
        tail -${1:-20} "$LOG_FILE"
    else
        echo "로그 파일이 없습니다: $LOG_FILE"
    fi
}

# 사용법
usage() {
    cat << EOF
Serena MCP Cron 데몬 관리 스크립트

사용법: $0 [명령어]

명령어:
  install   - Cron 기반 데몬 설치 (3분마다 헬스체크)
  remove    - Cron 작업 제거
  status    - 현재 상태 확인
  logs [N]  - 로그 보기 (기본 20줄)
  restart   - Cron 서비스 재시작
  help      - 이 도움말 출력

예시:
  $0 install    # 데몬 설치
  $0 status     # 상태 확인
  $0 logs 50    # 최근 50줄 로그 보기
  $0 remove     # 데몬 제거
EOF
}

# 메인 실행 로직
case "${1:-help}" in
    "install")
        log "🚀 Serena MCP Cron 데몬 설치 시작"
        ensure_cron_service
        install_cron_job
        log "🎉 설치 완료! 3분마다 Serena MCP 상태를 체크합니다."
        ;;
    "remove")
        remove_cron_job
        ;;
    "status")
        check_status
        ;;
    "logs")
        show_logs "$2"
        ;;
    "restart")
        log "🔄 Cron 서비스 재시작..."
        sudo service cron restart
        log "✅ Cron 서비스 재시작 완료"
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