#!/bin/bash
# MCP 서버 및 서브에이전트 헬스체크 스크립트
# Created: 2025-08-21
# Purpose: 시스템 상태 자동 모니터링 및 보고

set -e

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 프로젝트 루트
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
REPORT_DIR="$PROJECT_ROOT/reports/health"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$REPORT_DIR/health_check_$TIMESTAMP.md"

# 보고서 디렉토리 생성
mkdir -p "$REPORT_DIR"

# 헬스체크 함수
log_status() {
    local service=$1
    local status=$2
    local message=$3
    
    if [ "$status" == "OK" ]; then
        echo -e "${GREEN}✅ $service: $message${NC}"
        echo "✅ **$service**: $message" >> "$REPORT_FILE"
    elif [ "$status" == "WARN" ]; then
        echo -e "${YELLOW}⚠️ $service: $message${NC}"
        echo "⚠️ **$service**: $message" >> "$REPORT_FILE"
    else
        echo -e "${RED}❌ $service: $message${NC}"
        echo "❌ **$service**: $message" >> "$REPORT_FILE"
    fi
}

# 보고서 헤더
echo "# 🏥 시스템 헬스체크 보고서" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**생성 시간**: $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"
echo "**호스트**: $(hostname)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo -e "${BLUE}=== MCP 서버 및 서브에이전트 헬스체크 시작 ===${NC}"
echo "## 1. MCP 서버 상태" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 1. Claude Code 상태 확인
echo -e "\n${BLUE}[1/5] Claude Code 상태 확인...${NC}"
if command -v claude &> /dev/null; then
    CLAUDE_VERSION=$(claude --version 2>&1 | head -1)
    log_status "Claude Code" "OK" "설치됨 - $CLAUDE_VERSION"
    
    # MCP 서버 목록 확인
    MCP_COUNT=$(claude mcp list 2>/dev/null | grep -c "✓" || echo "0")
    if [ "$MCP_COUNT" -gt "0" ]; then
        log_status "MCP Servers" "OK" "$MCP_COUNT개 서버 연결됨"
    else
        log_status "MCP Servers" "WARN" "연결된 서버 없음"
    fi
else
    log_status "Claude Code" "ERROR" "설치되지 않음"
fi

# 2. AI CLI 도구 상태
echo -e "\n${BLUE}[2/5] AI CLI 도구 상태 확인...${NC}"
echo "" >> "$REPORT_FILE"
echo "## 2. AI CLI 도구 상태" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Gemini CLI
if command -v gemini &> /dev/null; then
    GEMINI_VERSION=$(gemini --version 2>&1 | head -1)
    log_status "Gemini CLI" "OK" "설치됨 - $GEMINI_VERSION"
else
    log_status "Gemini CLI" "ERROR" "설치되지 않음"
fi

# Qwen CLI
if command -v qwen &> /dev/null; then
    QWEN_VERSION=$(qwen --version 2>&1 | head -1)
    log_status "Qwen CLI" "OK" "설치됨 - $QWEN_VERSION"
else
    log_status "Qwen CLI" "ERROR" "설치되지 않음"
fi

# Codex CLI
if command -v codex &> /dev/null || command -v codex-cli &> /dev/null; then
    CODEX_VERSION=$(codex --version 2>&1 || codex-cli --version 2>&1 | head -1)
    log_status "Codex CLI" "OK" "설치됨 - $CODEX_VERSION"
else
    log_status "Codex CLI" "ERROR" "설치되지 않음"
fi

# 3. Supabase 보안 상태
echo -e "\n${BLUE}[3/5] Supabase 보안 상태 확인...${NC}"
echo "" >> "$REPORT_FILE"
echo "## 3. Supabase 보안 상태" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# .env.local 파일 확인
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    if grep -q "SUPABASE_SERVICE_ROLE_KEY" "$PROJECT_ROOT/.env.local"; then
        log_status "Supabase Config" "OK" "환경변수 설정됨"
    else
        log_status "Supabase Config" "WARN" "Supabase 키 누락"
    fi
else
    log_status "Supabase Config" "ERROR" ".env.local 파일 없음"
fi

# 4. Node.js 환경
echo -e "\n${BLUE}[4/5] Node.js 환경 확인...${NC}"
echo "" >> "$REPORT_FILE"
echo "## 4. Node.js 환경" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_status "Node.js" "OK" "버전 $NODE_VERSION"
    
    # npm 패키지 상태
    if [ -d "$PROJECT_ROOT/node_modules" ]; then
        PACKAGE_COUNT=$(ls -1 "$PROJECT_ROOT/node_modules" | wc -l)
        log_status "NPM Packages" "OK" "$PACKAGE_COUNT개 패키지 설치됨"
    else
        log_status "NPM Packages" "ERROR" "node_modules 없음"
    fi
else
    log_status "Node.js" "ERROR" "설치되지 않음"
fi

# 5. 시스템 리소스
echo -e "\n${BLUE}[5/5] 시스템 리소스 확인...${NC}"
echo "" >> "$REPORT_FILE"
echo "## 5. 시스템 리소스" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 메모리 상태
MEM_INFO=$(free -h | grep "^Mem:")
MEM_TOTAL=$(echo $MEM_INFO | awk '{print $2}')
MEM_USED=$(echo $MEM_INFO | awk '{print $3}')
MEM_AVAILABLE=$(echo $MEM_INFO | awk '{print $7}')

log_status "Memory" "OK" "총 $MEM_TOTAL / 사용 $MEM_USED / 가용 $MEM_AVAILABLE"

# 디스크 상태
DISK_INFO=$(df -h "$PROJECT_ROOT" | tail -1)
DISK_TOTAL=$(echo $DISK_INFO | awk '{print $2}')
DISK_USED=$(echo $DISK_INFO | awk '{print $3}')
DISK_AVAILABLE=$(echo $DISK_INFO | awk '{print $4}')
DISK_PERCENT=$(echo $DISK_INFO | awk '{print $5}')

if [ "${DISK_PERCENT%\%}" -lt 80 ]; then
    log_status "Disk" "OK" "총 $DISK_TOTAL / 사용 $DISK_USED / 가용 $DISK_AVAILABLE ($DISK_PERCENT 사용)"
else
    log_status "Disk" "WARN" "디스크 사용률 높음 - $DISK_PERCENT"
fi

# 요약
echo "" >> "$REPORT_FILE"
echo "## 📊 요약" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 전체 상태 계산
TOTAL_ISSUES=$(grep "❌" "$REPORT_FILE" 2>/dev/null | wc -l || echo "0")
TOTAL_WARNINGS=$(grep "⚠️" "$REPORT_FILE" 2>/dev/null | wc -l || echo "0")

if [ "$TOTAL_ISSUES" -eq 0 ] && [ "$TOTAL_WARNINGS" -eq 0 ]; then
    OVERALL_STATUS="✅ **시스템 정상**"
    echo -e "\n${GREEN}✅ 시스템 상태: 정상${NC}"
elif [ "$TOTAL_ISSUES" -eq 0 ]; then
    OVERALL_STATUS="⚠️ **경고 $TOTAL_WARNINGS개**"
    echo -e "\n${YELLOW}⚠️ 시스템 상태: 경고 $TOTAL_WARNINGS개${NC}"
else
    OVERALL_STATUS="❌ **오류 $TOTAL_ISSUES개, 경고 $TOTAL_WARNINGS개**"
    echo -e "\n${RED}❌ 시스템 상태: 오류 $TOTAL_ISSUES개, 경고 $TOTAL_WARNINGS개${NC}"
fi

echo "$OVERALL_STATUS" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**보고서 저장 위치**: \`$REPORT_FILE\`" >> "$REPORT_FILE"

echo -e "\n${BLUE}=== 헬스체크 완료 ===${NC}"
echo -e "보고서 저장: ${GREEN}$REPORT_FILE${NC}"

# 심각한 문제가 있으면 종료 코드 1 반환
if [ "$TOTAL_ISSUES" -gt 0 ]; then
    exit 1
fi

exit 0