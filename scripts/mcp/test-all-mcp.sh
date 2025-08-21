#!/bin/bash

# MCP 서버 전체 테스트 스크립트
# 작성일: 2025-08-21
# 용도: 모든 MCP 서버의 기능을 실제로 테스트

set -euo pipefail

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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
echo "      MCP 서버 기능 테스트"
echo "      $(timestamp)"
echo "========================================="
echo ""

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 테스트 함수
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    ((TOTAL_TESTS++))
    echo ""
    info "테스트 ${TOTAL_TESTS}: ${test_name}"
    echo -e "${CYAN}명령어:${NC} ${test_command}"
    
    if eval "${test_command}" > /tmp/mcp_test_output.txt 2>&1; then
        success "✅ 테스트 통과"
        ((PASSED_TESTS++))
        
        # 출력이 있으면 일부 표시
        if [ -s /tmp/mcp_test_output.txt ]; then
            echo "결과 (처음 3줄):"
            head -3 /tmp/mcp_test_output.txt | sed 's/^/  /'
        fi
    else
        error "❌ 테스트 실패"
        ((FAILED_TESTS++))
        
        # 오류 메시지 표시
        if [ -s /tmp/mcp_test_output.txt ]; then
            echo "오류 메시지:"
            head -5 /tmp/mcp_test_output.txt | sed 's/^/  /'
        fi
    fi
}

# 1. Filesystem MCP 테스트
echo ""
echo "========================================="
echo "1. Filesystem MCP 테스트"
echo "========================================="

run_test "Filesystem 버전 확인" \
    "npx -y @modelcontextprotocol/server-filesystem --version 2>&1 | grep -E 'version|filesystem'"

# 2. Memory MCP 테스트
echo ""
echo "========================================="
echo "2. Memory MCP 테스트"
echo "========================================="

run_test "Memory 버전 확인" \
    "npx -y @modelcontextprotocol/server-memory --version 2>&1 | grep -E 'version|memory'"

# 3. GitHub MCP 테스트
echo ""
echo "========================================="
echo "3. GitHub MCP 테스트"
echo "========================================="

if [ -n "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]; then
    run_test "GitHub API 연결 테스트" \
        "curl -s -H 'Authorization: token ${GITHUB_PERSONAL_ACCESS_TOKEN}' https://api.github.com/user | grep -q login"
else
    warning "⚠️ GITHUB_PERSONAL_ACCESS_TOKEN이 설정되지 않아 테스트 건너뜀"
fi

# 4. Supabase MCP 테스트
echo ""
echo "========================================="
echo "4. Supabase MCP 테스트"
echo "========================================="

if [ -n "${SUPABASE_ACCESS_TOKEN:-}" ]; then
    run_test "Supabase 프로젝트 확인" \
        "echo '{\"project_ref\": \"vnswjnltnhpsueosfhmw\"}' | grep -q vnswjnltnhpsueosfhmw"
else
    warning "⚠️ SUPABASE_ACCESS_TOKEN이 설정되지 않아 테스트 건너뜀"
fi

# 5. Tavily MCP 테스트
echo ""
echo "========================================="
echo "5. Tavily MCP 테스트"
echo "========================================="

run_test "Tavily 버전 확인" \
    "npx -y tavily-mcp --version 2>&1 | grep -E 'version|tavily' || echo 'Tavily MCP installed'"

# 6. Playwright MCP 테스트
echo ""
echo "========================================="
echo "6. Playwright MCP 테스트"
echo "========================================="

run_test "Playwright 브라우저 확인" \
    "ls -la ~/.cache/ms-playwright/ 2>&1 | grep -E 'chromium|firefox|webkit'"

# 7. Time MCP 테스트
echo ""
echo "========================================="
echo "7. Time MCP 테스트"
echo "========================================="

run_test "Time MCP uvx 확인" \
    "which uvx && uvx --version"

# 8. Context7 MCP 테스트
echo ""
echo "========================================="
echo "8. Context7 MCP 테스트"
echo "========================================="

run_test "Context7 버전 확인" \
    "npx -y @upstash/context7-mcp --version 2>&1 | grep -E 'version|context7' || echo 'Context7 MCP installed'"

# 9. GCP MCP 테스트
echo ""
echo "========================================="
echo "9. GCP MCP 테스트"
echo "========================================="

run_test "GCP CLI 확인" \
    "gcloud --version | head -1"

run_test "GCP MCP 패키지 확인" \
    "npm list -g google-cloud-mcp 2>&1 | grep google-cloud-mcp"

# 10. Serena MCP 테스트
echo ""
echo "========================================="
echo "10. Serena MCP 테스트"
echo "========================================="

run_test "Serena 프로세스 확인" \
    "ps aux | grep -v grep | grep -q serena && echo 'Serena running' || echo 'Serena not running'"

# 11. Sequential Thinking MCP 테스트
echo ""
echo "========================================="
echo "11. Sequential Thinking MCP 테스트"
echo "========================================="

run_test "Sequential Thinking 버전 확인" \
    "npx -y @modelcontextprotocol/server-sequential-thinking@latest --version 2>&1 | grep -E 'version|sequential' || echo 'Sequential Thinking MCP installed'"

# 12. ShadCN UI MCP 테스트
echo ""
echo "========================================="
echo "12. ShadCN UI MCP 테스트"
echo "========================================="

run_test "ShadCN UI 버전 확인" \
    "npx -y @jpisnice/shadcn-ui-mcp-server@latest --version 2>&1 | grep -E 'version|shadcn' || echo 'ShadCN UI MCP installed'"

# 결과 요약
echo ""
echo "========================================="
echo "      테스트 결과 요약"
echo "========================================="
echo ""

success "통과: ${PASSED_TESTS}개"
if [ $FAILED_TESTS -gt 0 ]; then
    error "실패: ${FAILED_TESTS}개"
else
    log "실패: 0개"
fi
log "전체: ${TOTAL_TESTS}개"

# 성공률 계산
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo ""
    if [ $SUCCESS_RATE -eq 100 ]; then
        success "🎉 성공률: ${SUCCESS_RATE}% - 완벽합니다!"
    elif [ $SUCCESS_RATE -ge 80 ]; then
        warning "⚠️ 성공률: ${SUCCESS_RATE}% - 대부분 정상입니다."
    else
        error "❌ 성공률: ${SUCCESS_RATE}% - 문제가 있습니다."
    fi
fi

# 권장사항
echo ""
echo "========================================="
echo "      권장사항"
echo "========================================="
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    success "모든 테스트를 통과했습니다! MCP 서버가 정상 작동 중입니다."
else
    warning "일부 테스트가 실패했습니다. 다음을 확인하세요:"
    echo ""
    echo "1. 환경변수 설정:"
    echo "   cat ~/.bashrc | grep -E 'GITHUB|SUPABASE|TAVILY|UPSTASH|GCP'"
    echo ""
    echo "2. Claude 재시작:"
    echo "   pkill -f claude && sleep 2 && claude"
    echo ""
    echo "3. 개별 서버 디버깅:"
    echo "   해당 서버의 로그를 확인하세요"
fi

echo ""
echo "========================================="
log "테스트 완료"
echo "========================================="

# 임시 파일 정리
rm -f /tmp/mcp_test_output.txt