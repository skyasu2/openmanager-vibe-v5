#!/bin/bash

# 훅 시스템 테스트 시나리오
# 실행: bash test-hook-scenarios.sh

set -euo pipefail

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 테스트 결과 카운터
PASSED=0
FAILED=0

# 로그 함수
log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# 테스트 준비
setup_test_env() {
    log_info "테스트 환경 준비 중..."
    
    # 테스트용 임시 디렉토리 생성
    TEST_DIR="test-hooks-temp"
    mkdir -p "$TEST_DIR"
    
    # audit 디렉토리 생성
    mkdir -p ".claude/audit"
    mkdir -p ".claude/issues"
    mkdir -p ".claude/metrics"
    
    # 훅 실행 권한 설정
    chmod +x hooks/*.sh 2>/dev/null || true
}

# 테스트 정리
cleanup_test_env() {
    log_info "테스트 환경 정리 중..."
    rm -rf "$TEST_DIR"
}

# 테스트 1: post-edit-hook.sh 동작 확인
test_post_edit_hook() {
    log_test "post-edit-hook.sh 테스트"
    
    # 테스트 파일 생성
    TEST_FILE="$TEST_DIR/test-auth-service.ts"
    echo "// Test auth service" > "$TEST_FILE"
    
    log_info "테스트 파일 생성: $TEST_FILE"
    
    # 훅 실행 및 출력 캡처
    OUTPUT=$(./hooks/post-edit-hook.sh "$TEST_FILE" 2>&1)
    EXIT_CODE=$?
    
    log_info "훅 실행 결과 (exit code: $EXIT_CODE):"
    echo "$OUTPUT"
    
    # 훅 실행
    if echo "$OUTPUT" | grep -q "보안 중요 파일"; then
        log_success "보안 파일 감지 성공"
    else
        log_fail "보안 파일 감지 실패"
    fi
    
    # audit 로그 확인
    if [ -f ".claude/audit/audit.log" ] && grep -q "post-edit" ".claude/audit/audit.log"; then
        log_success "Audit 로그 기록 성공"
    else
        log_fail "Audit 로그 기록 실패"
    fi
}

# 테스트 2: pre-database-hook.sh 동작 확인
test_pre_database_hook() {
    log_test "pre-database-hook.sh 테스트"
    
    # 위험한 작업 테스트
    if ! ./hooks/pre-database-hook.sh "delete" "DROP TABLE users" 2>&1 | grep -q "차단"; then
        log_fail "위험한 DB 작업 차단 실패"
    else
        log_success "위험한 DB 작업 차단 성공"
    fi
    
    # 스키마 변경 위임 테스트
    OUTPUT=$(./hooks/pre-database-hook.sh "alter" "ALTER TABLE users ADD COLUMN test" 2>&1)
    EXIT_CODE=$?
    
    if [ "$EXIT_CODE" -eq 2 ] && echo "$OUTPUT" | grep -q "database-administrator"; then
        log_success "DB 작업 위임 성공 (exit code: 2)"
    else
        log_fail "DB 작업 위임 실패 (exit code: $EXIT_CODE)"
    fi
}

# 테스트 3: agent-completion-hook.sh 동작 확인
test_agent_completion_hook() {
    log_test "agent-completion-hook.sh 테스트"
    
    # 성공한 에이전트 테스트
    ./hooks/agent-completion-hook.sh "code-review-specialist" "completed" "코드 리뷰 완료" 2>&1
    
    if [ -f ".claude/issues/agent-completion-code-review-specialist-"* ]; then
        log_success "에이전트 완료 이슈 파일 생성 성공"
    else
        log_fail "에이전트 완료 이슈 파일 생성 실패"
    fi
    
    # 실패한 에이전트 테스트
    ./hooks/agent-completion-hook.sh "database-administrator" "failed" "연결 실패" 2>&1
    
    if [ -f ".claude/issues/CRITICAL-agent-failure-"* ]; then
        log_success "에이전트 실패 알림 생성 성공"
    else
        log_fail "에이전트 실패 알림 생성 실패"
    fi
}

# 테스트 4: 훅 체이닝 시뮬레이션
test_hook_chaining() {
    log_test "훅 체이닝 시뮬레이션"
    
    # 보안 파일 편집 시나리오
    SECURITY_FILE="$TEST_DIR/auth-handler.ts"
    echo "export function authenticate() {}" > "$SECURITY_FILE"
    
    # post-edit-hook 실행 (code-review 트리거)
    log_info "1단계: post-edit-hook 실행"
    ./hooks/post-edit-hook.sh "$SECURITY_FILE" 2>&1 | grep -q "코드 리뷰" && \
        log_success "코드 리뷰 트리거 확인"
    
    # post-security-edit-hook 실행 (security-auditor 권장)
    log_info "2단계: post-security-edit-hook 실행"
    if [ -f "./hooks/post-security-edit-hook.sh" ]; then
        ./hooks/post-security-edit-hook.sh "$SECURITY_FILE" 2>&1 | grep -q "security-auditor" && \
            log_success "보안 검사 권장 확인"
    else
        log_info "post-security-edit-hook.sh 파일 없음 (예상됨)"
    fi
}

# 테스트 5: 성능 측정
test_hook_performance() {
    log_test "훅 성능 측정"
    
    # 100개 파일에 대한 훅 실행 시간 측정
    START_TIME=$(date +%s%N)
    
    for i in {1..100}; do
        TEST_FILE="$TEST_DIR/perf-test-$i.ts"
        echo "// Performance test $i" > "$TEST_FILE"
        ./hooks/post-edit-hook.sh "$TEST_FILE" >/dev/null 2>&1
    done
    
    END_TIME=$(date +%s%N)
    ELAPSED=$((($END_TIME - $START_TIME) / 1000000)) # 밀리초로 변환
    
    if [ "$ELAPSED" -lt 5000 ]; then # 5초 미만
        log_success "훅 성능 양호 (100개 파일 처리: ${ELAPSED}ms)"
    else
        log_fail "훅 성능 저하 (100개 파일 처리: ${ELAPSED}ms)"
    fi
}

# 테스트 6: 훅 설정 검증
test_hook_configuration() {
    log_test "훅 설정 파일 검증"
    
    # settings.local.json 존재 확인
    if [ -f ".claude/settings.local.json" ]; then
        log_success "설정 파일 존재"
        
        # JSON 유효성 검사
        if jq . ".claude/settings.local.json" >/dev/null 2>&1; then
            log_success "JSON 형식 유효"
        else
            log_fail "JSON 형식 오류"
        fi
        
        # 필수 훅 설정 확인
        HOOK_COUNT=$(jq '.hooks | length' ".claude/settings.local.json" 2>/dev/null || echo "0")
        if [ "$HOOK_COUNT" -gt 0 ]; then
            log_success "훅 설정 존재 (${HOOK_COUNT}개 이벤트)"
        else
            log_fail "훅 설정 없음"
        fi
    else
        log_fail "설정 파일 없음"
    fi
}

# 테스트 7: MCP 서버 연동 확인
test_mcp_integration() {
    log_test "MCP 서버 연동 확인"
    
    # mcp.json 파일 확인
    if [ -f ".claude/mcp.json" ]; then
        log_success "MCP 설정 파일 존재"
        
        # Supabase MCP 설정 확인
        if jq '.mcpServers.supabase' ".claude/mcp.json" >/dev/null 2>&1; then
            log_success "Supabase MCP 서버 설정 확인"
        else
            log_fail "Supabase MCP 서버 설정 없음"
        fi
    else
        log_fail "MCP 설정 파일 없음"
    fi
}

# 메인 테스트 실행
main() {
    echo "======================================"
    echo "🧪 훅 시스템 통합 테스트 시작"
    echo "======================================"
    echo ""
    
    setup_test_env
    
    # 모든 테스트 실행
    test_post_edit_hook
    echo ""
    test_pre_database_hook
    echo ""
    test_agent_completion_hook
    echo ""
    test_hook_chaining
    echo ""
    test_hook_performance
    echo ""
    test_hook_configuration
    echo ""
    test_mcp_integration
    
    cleanup_test_env
    
    echo ""
    echo "======================================"
    echo "📊 테스트 결과 요약"
    echo "======================================"
    echo -e "${GREEN}통과: $PASSED${NC}"
    echo -e "${RED}실패: $FAILED${NC}"
    echo ""
    
    if [ "$FAILED" -eq 0 ]; then
        echo -e "${GREEN}✅ 모든 테스트 통과!${NC}"
        exit 0
    else
        echo -e "${RED}❌ 일부 테스트 실패${NC}"
        exit 1
    fi
}

# 스크립트 실행
main "$@"