#!/bin/bash

# MCP 서버 재시작 스크립트
# 작성일: 2025-08-21
# 용도: Claude와 MCP 서버들을 안전하게 재시작

set -euo pipefail

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# 타임스탬프 함수
timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# 로그 함수
log() {
    echo -e "${BLUE}[$(timestamp)]${NC} $1"
}

error() {
    echo -e "${RED}[$(timestamp)] ERROR:${NC} $1"
}

success() {
    echo -e "${GREEN}[$(timestamp)] SUCCESS:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(timestamp)] WARNING:${NC} $1"
}

info() {
    echo -e "${CYAN}[$(timestamp)] INFO:${NC} $1"
}

# 헤더 출력
echo ""
echo "========================================="
echo "      MCP 서버 재시작 유틸리티"
echo "      $(timestamp)"
echo "========================================="
echo ""

# 현재 상태 확인
info "현재 MCP 서버 상태 확인 중..."
CURRENT_PROCESSES=$(ps aux | grep -E "claude|mcp|serena|playwright|shadcn|context7|tavily|supabase|github|sequential" | grep -v grep | wc -l)
log "현재 실행 중인 관련 프로세스: ${CURRENT_PROCESSES}개"

# Claude 프로세스 확인
CLAUDE_PID=$(pgrep -f "claude" || echo "")
if [ -n "$CLAUDE_PID" ]; then
    warning "Claude가 실행 중입니다 (PID: $CLAUDE_PID)"
    echo ""
    echo -e "${YELLOW}주의:${NC} Claude를 재시작하면 현재 세션이 종료됩니다."
    echo -e "${YELLOW}계속하시겠습니까?${NC} (y/N): \c"
    read -r CONFIRM
    
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        info "재시작이 취소되었습니다."
        exit 0
    fi
else
    info "Claude가 실행 중이지 않습니다."
fi

# Step 1: Claude 종료
echo ""
echo "========================================="
echo "Step 1: Claude 프로세스 종료"
echo "========================================="
echo ""

if [ -n "$CLAUDE_PID" ]; then
    info "Claude 종료 중..."
    pkill -f claude || true
    sleep 2
    
    # 확인
    if pgrep -f claude > /dev/null 2>&1; then
        warning "Claude가 아직 실행 중입니다. 강제 종료 시도..."
        pkill -9 -f claude || true
        sleep 1
    fi
    
    success "Claude가 종료되었습니다."
else
    log "종료할 Claude 프로세스가 없습니다."
fi

# Step 2: MCP 서버 프로세스 정리
echo ""
echo "========================================="
echo "Step 2: MCP 서버 프로세스 정리"
echo "========================================="
echo ""

info "MCP 서버 프로세스 종료 중..."

# MCP 관련 프로세스 종료
MCP_PATTERNS=(
    "mcp-server"
    "serena-mcp"
    "playwright-mcp"
    "shadcn-mcp"
    "context7-mcp"
    "tavily-mcp"
    "supabase-mcp"
    "github-mcp"
    "sequential-thinking"
)

for PATTERN in "${MCP_PATTERNS[@]}"; do
    if pgrep -f "$PATTERN" > /dev/null 2>&1; then
        log "종료: $PATTERN"
        pkill -f "$PATTERN" || true
    fi
done

sleep 2

# 남은 프로세스 확인
REMAINING=$(ps aux | grep -E "mcp|serena|playwright|shadcn|context7|tavily|supabase|github|sequential" | grep -v grep | wc -l)
if [ "$REMAINING" -gt 0 ]; then
    warning "아직 ${REMAINING}개의 프로세스가 실행 중입니다."
else
    success "모든 MCP 서버 프로세스가 종료되었습니다."
fi

# Step 3: 환경변수 확인
echo ""
echo "========================================="
echo "Step 3: 환경변수 확인"
echo "========================================="
echo ""

# 필수 환경변수 확인
ENV_OK=true
REQUIRED_VARS=(
    "GITHUB_PERSONAL_ACCESS_TOKEN"
    "SUPABASE_ACCESS_TOKEN"
    "TAVILY_API_KEY"
    "UPSTASH_REDIS_REST_URL"
    "UPSTASH_REDIS_REST_TOKEN"
    "GCP_PROJECT_ID"
)

for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR:-}" ]; then
        warning "⚠️ $VAR이 설정되지 않았습니다."
        ENV_OK=false
    else
        success "✅ $VAR 설정됨"
    fi
done

if [ "$ENV_OK" = false ]; then
    echo ""
    warning "일부 환경변수가 누락되었습니다."
    info "다음 명령어로 환경변수를 로드하세요:"
    echo "  source ~/.bashrc"
    echo ""
fi

# Step 4: Claude 재시작 안내
echo ""
echo "========================================="
echo "Step 4: Claude 재시작"
echo "========================================="
echo ""

success "MCP 서버 재시작 준비가 완료되었습니다!"
echo ""
info "이제 Claude를 시작하세요:"
echo ""
echo -e "${MAGENTA}  claude${NC}"
echo ""
info "Claude가 시작되면 MCP 서버들이 자동으로 연결됩니다."

# Step 5: 재시작 후 확인 명령어 안내
echo ""
echo "========================================="
echo "재시작 후 확인 방법"
echo "========================================="
echo ""

info "Claude 시작 후 다음 명령어로 상태를 확인하세요:"
echo ""
echo "1. MCP 서버 상태 모니터링:"
echo -e "${CYAN}   ./scripts/mcp/monitor-mcp-servers.sh${NC}"
echo ""
echo "2. MCP 서버 기능 테스트:"
echo -e "${CYAN}   ./scripts/mcp/test-all-mcp.sh${NC}"
echo ""
echo "3. Claude에서 MCP 도구 목록 확인:"
echo -e "${CYAN}   claude mcp list${NC}"

echo ""
echo "========================================="
log "재시작 준비 완료"
echo "========================================="