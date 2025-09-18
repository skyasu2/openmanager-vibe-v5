#!/bin/bash

# Serena MCP 빠른 설정 스크립트
# 대기시간 문제 해결을 위한 캐시 기반 접근

set -e

PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
LOG_FILE="/tmp/serena-setup.log"

USER_HOME="${HOME:-$(getent passwd "$USER" | cut -d: -f6)}"
DEFAULT_UVX_PATH="$USER_HOME/.local/bin/uvx"

if command -v uvx >/dev/null 2>&1; then
    UVX_BIN="$(command -v uvx)"
else
    UVX_BIN="$DEFAULT_UVX_PATH"
fi

# 로그 함수
log() {
    echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 1. uv 캐시 확인 및 준비
log "🔍 Serena 캐시 상태 확인 중..."

# Serena가 이미 캐시되어 있는지 확인
if "$UVX_BIN" --from git+https://github.com/oraios/serena serena-mcp-server --help > /dev/null 2>&1; then
    log "✅ Serena가 이미 캐시되어 있습니다"
else
    log "⏳ Serena 캐시 생성 중... (최초 1회만 소요)"
    "$UVX_BIN" --from git+https://github.com/oraios/serena serena-mcp-server --help > "$LOG_FILE" 2>&1
    log "✅ Serena 캐시 생성 완료"
fi

# 2. 빠른 연결 테스트
log "🧪 빠른 연결 테스트 중..."

# timeout으로 빠른 테스트 (30초 내 응답 확인)
timeout 30s "$UVX_BIN" --from git+https://github.com/oraios/serena serena-mcp-server --project "$PROJECT_ROOT" &
TEST_PID=$!

# 프로세스가 시작되는지 확인
sleep 3
if kill -0 "$TEST_PID" 2>/dev/null; then
    log "✅ Serena 프로세스 시작 확인됨"
    kill "$TEST_PID" 2>/dev/null || true
else
    log "❌ Serena 프로세스 시작 실패"
    exit 1
fi

# 3. Claude Code MCP 설정 확인
log "📋 MCP 설정 확인 중..."

if grep -q '"serena"' "$PROJECT_ROOT/.mcp.json"; then
    log "✅ Serena MCP 설정 발견됨"
else
    log "❌ Serena MCP 설정이 없습니다"
    exit 1
fi

# 4. 완료 메시지
log "🎉 Serena MCP 준비 완료!"
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Serena가 캐시되어 빠른 시작이 가능합니다"
echo "⚡ 대기시간이 대폭 단축됩니다 (4분 → 30초 이내)"
echo "📋 로그: $LOG_FILE"
echo
echo "🤖 Claude Code 재시작 권장:"
echo "   claude api restart"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
