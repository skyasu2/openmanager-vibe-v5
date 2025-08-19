#!/bin/bash

# =============================================================================
# Serena MCP 자동 모니터링 & 복구 시스템 (WSL 환경)
# 백그라운드에서 지속적으로 실행되며 Serena MCP 상태를 모니터링
# =============================================================================

set -euo pipefail

MONITOR_INTERVAL=60  # 1분마다 체크
LOG_FILE="/mnt/d/cursor/openmanager-vibe-v5/logs/serena-monitor.log"
PID_FILE="/tmp/serena-monitor.pid"

# 로그 디렉토리 생성
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 이미 실행 중인지 확인
if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    log "⚠️ Serena 모니터가 이미 실행 중입니다 (PID: $(cat "$PID_FILE"))"
    exit 1
fi

# PID 파일 생성
echo $$ > "$PID_FILE"

# 종료 시 정리
cleanup() {
    log "🛑 Serena 모니터 종료"
    rm -f "$PID_FILE"
    exit 0
}
trap cleanup EXIT INT TERM

log "🚀 Serena MCP 자동 모니터링 시작 (PID: $$)"

while true; do
    # Serena 상태 체크
    if timeout 10s claude mcp list 2>/dev/null | grep -q "serena:.*✓ Connected"; then
        log "✅ Serena MCP 정상 연결됨"
    else
        log "❌ Serena MCP 연결 실패 - 복구 시도"
        
        # 간단한 복구 시도
        log "🔧 Claude Code 연결 리셋 시도..."
        if timeout 15s claude mcp restart 2>/dev/null; then
            log "✅ MCP 재시작 완료"
            sleep 5
            
            # 재확인
            if timeout 10s claude mcp list 2>/dev/null | grep -q "serena:.*✓ Connected"; then
                log "🎉 Serena MCP 복구 성공!"
            else
                log "⚠️ 복구 실패 - 다음 주기에 재시도"
            fi
        else
            log "❌ MCP 재시작 실패"
        fi
    fi
    
    log "😴 ${MONITOR_INTERVAL}초 대기..."
    sleep "$MONITOR_INTERVAL"
done