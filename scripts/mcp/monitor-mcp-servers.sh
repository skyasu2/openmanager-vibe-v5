#!/bin/bash

# MCP 서버 상태 모니터링 스크립트
# 작성일: 2025-08-21
# 용도: 모든 MCP 서버의 상태를 확인하고 보고

set -euo pipefail

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# MCP 서버 목록
declare -A MCP_SERVERS
MCP_SERVERS=(
    ["filesystem"]="mcp-server-filesystem"
    ["memory"]="mcp-server-memory"
    ["github"]="mcp-server-github"
    ["supabase"]="mcp-server-supabase"
    ["tavily"]="tavily-mcp"
    ["playwright"]="playwright-mcp-server"
    ["time"]="mcp-server-time"
    ["context7"]="context7-mcp"
    ["gcp"]="google-cloud-mcp"
    ["serena"]="serena-mcp-server"
    ["sequential-thinking"]="mcp-server-sequential-thinking"
    ["shadcn-ui"]="shadcn-mcp"
)

# 헤더 출력
echo ""
echo "========================================="
echo "      MCP 서버 상태 모니터링"
echo "      $(timestamp)"
echo "========================================="
echo ""

# 실행 중인 프로세스 수 확인
TOTAL_PROCESSES=$(ps aux | grep -E "mcp|serena|playwright|shadcn|context7|tavily|supabase|github|sequential" | grep -v grep | wc -l)
log "실행 중인 MCP 관련 프로세스: ${TOTAL_PROCESSES}개"
echo ""

# 각 서버 상태 확인
RUNNING_COUNT=0
NOT_RUNNING_COUNT=0
echo "개별 서버 상태:"
echo "-----------------------------------------"

for SERVER_NAME in "${!MCP_SERVERS[@]}"; do
    PROCESS_NAME="${MCP_SERVERS[$SERVER_NAME]}"
    
    # 프로세스 확인
    if ps aux | grep -v grep | grep -q "$PROCESS_NAME"; then
        success "✅ $SERVER_NAME ($PROCESS_NAME) - 실행 중"
        ((RUNNING_COUNT++))
    else
        # Serena는 다른 이름으로 실행될 수 있음
        if [[ "$SERVER_NAME" == "serena" ]] && ps aux | grep -v grep | grep -q "serena"; then
            success "✅ $SERVER_NAME (serena) - 실행 중"
            ((RUNNING_COUNT++))
        # GCP는 google-cloud-mcp 또는 다른 프로세스로 실행
        elif [[ "$SERVER_NAME" == "gcp" ]] && ps aux | grep -v grep | grep -q "google-cloud"; then
            success "✅ $SERVER_NAME (google-cloud) - 실행 중"
            ((RUNNING_COUNT++))
        else
            error "❌ $SERVER_NAME ($PROCESS_NAME) - 실행되지 않음"
            ((NOT_RUNNING_COUNT++))
        fi
    fi
done

echo ""
echo "-----------------------------------------"
echo "요약:"
echo "-----------------------------------------"
success "실행 중: ${RUNNING_COUNT}개"
if [ $NOT_RUNNING_COUNT -gt 0 ]; then
    error "실행되지 않음: ${NOT_RUNNING_COUNT}개"
else
    log "실행되지 않음: 0개"
fi

# 성공률 계산
TOTAL_SERVERS=${#MCP_SERVERS[@]}
SUCCESS_RATE=$((RUNNING_COUNT * 100 / TOTAL_SERVERS))
echo ""
log "전체 성공률: ${SUCCESS_RATE}% (${RUNNING_COUNT}/${TOTAL_SERVERS})"

# 환경변수 확인
echo ""
echo "========================================="
echo "      환경변수 설정 확인"
echo "========================================="
echo ""

# 필수 환경변수 목록
declare -A REQUIRED_ENV_VARS
REQUIRED_ENV_VARS=(
    ["GITHUB_PERSONAL_ACCESS_TOKEN"]="GitHub MCP"
    ["SUPABASE_ACCESS_TOKEN"]="Supabase MCP"
    ["TAVILY_API_KEY"]="Tavily MCP"
    ["UPSTASH_REDIS_REST_URL"]="Context7 MCP"
    ["UPSTASH_REDIS_REST_TOKEN"]="Context7 MCP"
    ["GCP_PROJECT_ID"]="GCP MCP"
)

ENV_OK=0
ENV_MISSING=0

for ENV_VAR in "${!REQUIRED_ENV_VARS[@]}"; do
    SERVICE="${REQUIRED_ENV_VARS[$ENV_VAR]}"
    if [ -z "${!ENV_VAR:-}" ]; then
        warning "⚠️  $ENV_VAR (필요: $SERVICE) - 설정되지 않음"
        ((ENV_MISSING++))
    else
        success "✅ $ENV_VAR (필요: $SERVICE) - 설정됨"
        ((ENV_OK++))
    fi
done

echo ""
echo "-----------------------------------------"
log "환경변수: ${ENV_OK}개 설정됨, ${ENV_MISSING}개 누락"

# 특별 체크: GCP 인증 파일
echo ""
echo "========================================="
echo "      특별 체크"
echo "========================================="
echo ""

# GCP 인증 파일 확인
GCP_CRED_FILE="$HOME/.config/gcloud/application_default_credentials.json"
if [ -f "$GCP_CRED_FILE" ]; then
    success "✅ GCP 인증 파일 존재: $GCP_CRED_FILE"
else
    error "❌ GCP 인증 파일 없음: $GCP_CRED_FILE"
fi

# Playwright 브라우저 확인
PLAYWRIGHT_BROWSERS="$HOME/.cache/ms-playwright"
if [ -d "$PLAYWRIGHT_BROWSERS" ]; then
    BROWSER_COUNT=$(ls -1 "$PLAYWRIGHT_BROWSERS" | wc -l)
    success "✅ Playwright 브라우저 설치됨: ${BROWSER_COUNT}개"
else
    error "❌ Playwright 브라우저 미설치"
fi

# 최종 상태
echo ""
echo "========================================="
echo "      최종 상태"
echo "========================================="
echo ""

if [ $NOT_RUNNING_COUNT -eq 0 ] && [ $ENV_MISSING -eq 0 ]; then
    success "🎉 모든 MCP 서버가 정상 작동 중입니다!"
elif [ $SUCCESS_RATE -ge 80 ]; then
    warning "⚠️  대부분의 MCP 서버가 작동 중이지만 일부 문제가 있습니다."
    echo ""
    log "다음 명령어로 Claude를 재시작하세요:"
    echo "  pkill -f claude && sleep 2 && claude"
else
    error "❌ MCP 서버에 심각한 문제가 있습니다."
    echo ""
    log "문제 해결 방법:"
    echo "  1. 환경변수 확인: source ~/.bashrc"
    echo "  2. Claude 재시작: pkill -f claude && claude"
    echo "  3. 개별 서버 테스트: ./scripts/mcp/test-all-mcp.sh"
fi

echo ""
echo "========================================="
log "모니터링 완료"
echo "========================================="