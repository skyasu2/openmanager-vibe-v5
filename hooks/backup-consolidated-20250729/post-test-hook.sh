#!/bin/bash

# PostToolUse Hook: 테스트 실행 후 자동 분석 및 개선
# 트리거: npm test, npm run test:*, vitest, jest
# 파일: hooks/post-test-hook.sh

set -euo pipefail

# 공통 함수 로드
source "$(dirname "$0")/shared-functions.sh"

# 인자 확인
TEST_COMMAND="${1:-npm test}"
TEST_OUTPUT="${2:-}"
HOOK_NAME="post-test"

log_info "테스트 실행 감지: $TEST_COMMAND"

# 테스트 결과 분석
TESTS_FAILED=false
COVERAGE_LOW=false
COVERAGE_PERCENT=0
FAILED_TEST_COUNT=0
TEST_DURATION=0

# 테스트 출력 분석
if [ -n "$TEST_OUTPUT" ]; then
    # 실패한 테스트 감지
    if echo "$TEST_OUTPUT" | grep -qE "(FAIL|Failed|Error|✗|failed tests?)"; then
        TESTS_FAILED=true
        FAILED_TEST_COUNT=$(echo "$TEST_OUTPUT" | grep -cE "(FAIL|✗)" || echo "0")
        log_error "테스트 실패 감지: $FAILED_TEST_COUNT 개"
    fi
    
    # 커버리지 분석
    if echo "$TEST_OUTPUT" | grep -qE "Coverage|coverage"; then
        # 다양한 커버리지 리포트 형식 지원
        COVERAGE_PERCENT=$(echo "$TEST_OUTPUT" | grep -oE "([0-9]+(\.[0-9]+)?%|[0-9]+\.[0-9]+)" | head -1 | tr -d '%' || echo "0")
        
        if [ -n "$COVERAGE_PERCENT" ] && (( $(echo "$COVERAGE_PERCENT < 80" | bc -l) )); then
            COVERAGE_LOW=true
            log_warning "테스트 커버리지 부족: ${COVERAGE_PERCENT}% (목표: 80%)"
        fi
    fi
    
    # 테스트 실행 시간 추출
    if echo "$TEST_OUTPUT" | grep -qE "Time:|Duration:|took"; then
        TEST_DURATION=$(echo "$TEST_OUTPUT" | grep -oE "[0-9]+(\.[0-9]+)?s" | head -1 || echo "0s")
        log_info "테스트 실행 시간: $TEST_DURATION"
    fi
fi

# 테스트 실패 시 test-automation-specialist 자동 호출
if [ "$TESTS_FAILED" = true ]; then
    log_error "테스트 실패 - test-automation-specialist 자동 호출"
    
    # 프롬프트 생성
    TEST_PROMPT=$(create_subagent_prompt "test-automation-specialist" \
        "테스트 실패 분석 및 수정" \
        "" \
        "$(cat << EOF
테스트 명령: $TEST_COMMAND
실패한 테스트 수: $FAILED_TEST_COUNT
테스트 실행 시간: $TEST_DURATION

다음 작업을 수행해주세요:
1. 실패한 테스트 분석 (에러 메시지, 스택 트레이스)
2. 테스트 코드 또는 구현 코드 수정
3. 새로운 엣지 케이스 테스트 추가
4. 테스트 안정성 개선 (flaky test 제거)
5. 테스트 실행 속도 최적화

주의사항:
- 기존 테스트 파일을 수정할 때는 반드시 Read 도구로 먼저 읽어주세요
- 테스트가 실패하는 근본 원인을 파악하세요
- 단순히 테스트를 통과시키기 위한 수정이 아닌, 실제 버그를 수정하세요
EOF
)")
    
    # 이슈 생성
    ISSUE_FILE=$(create_issue_file "test-failure" \
        "테스트 실패: $FAILED_TEST_COUNT 개" \
        "$TEST_PROMPT" \
        "high")
    
    # audit 로그
    write_audit_log "$HOOK_NAME" "test-failure-detected" \
        "{\"command\": \"$TEST_COMMAND\", \"failed_count\": $FAILED_TEST_COUNT, \"issue_file\": \"$ISSUE_FILE\"}"
    
    # test-automation-specialist로 위임
    delegate_to_subagent "test-automation-specialist" "테스트 실패 수정"
fi

# 커버리지가 낮은 경우 경고 및 개선 제안
if [ "$COVERAGE_LOW" = true ]; then
    log_warning "커버리지 개선 필요: ${COVERAGE_PERCENT}%"
    
    # 커버리지 개선 제안
    COVERAGE_PROMPT=$(cat << EOF
# 테스트 커버리지 개선 필요

**현재 커버리지**: ${COVERAGE_PERCENT}%  
**목표 커버리지**: 80%  
**시간**: $(get_timestamp)  

## 개선 제안

1. 커버리지가 낮은 파일 식별
2. 핵심 비즈니스 로직 우선 테스트
3. 엣지 케이스 및 에러 처리 테스트
4. 통합 테스트 추가

## 권장 사항

test-automation-specialist를 사용하여 체계적인 테스트 추가를 권장합니다.

\`\`\`bash
# 커버리지 리포트 상세 확인
npm run test:coverage -- --reporter=html
\`\`\`
EOF
)
    
    create_issue_file "low-coverage" \
        "테스트 커버리지 부족" \
        "$COVERAGE_PROMPT" \
        "medium"
    
    suggest_subagent "test-automation-specialist" "테스트 커버리지 개선"
fi

# 성능 메트릭 기록
if [ -n "$TEST_DURATION" ]; then
    record_performance_metric "test_duration" "$TEST_DURATION"
fi

if [ -n "$COVERAGE_PERCENT" ]; then
    record_performance_metric "test_coverage" "$COVERAGE_PERCENT"
fi

# E2E 테스트 실패 시 특별 처리
if [[ "$TEST_COMMAND" =~ (e2e|playwright|cypress) ]] && [ "$TESTS_FAILED" = true ]; then
    log_error "E2E 테스트 실패 - 스크린샷 및 비디오 확인 필요"
    
    create_issue_file "e2e-test-failure" \
        "E2E 테스트 실패" \
        "E2E 테스트가 실패했습니다. 스크린샷과 비디오를 확인하세요.\n\n테스트 명령: $TEST_COMMAND" \
        "critical"
    
    # Playwright 스크린샷 위치 안내
    if [[ "$TEST_COMMAND" =~ playwright ]]; then
        echo "📸 스크린샷 위치: test-results/"
        echo "🎥 비디오 위치: test-results/"
    fi
fi

# 테스트 성공 시 긍정적 피드백
if [ "$TESTS_FAILED" = false ] && [ "$COVERAGE_LOW" = false ]; then
    log_success "✅ 모든 테스트 통과! 커버리지: ${COVERAGE_PERCENT}%"
    
    # 성공 메트릭 기록
    write_audit_log "$HOOK_NAME" "test-success" \
        "{\"command\": \"$TEST_COMMAND\", \"coverage\": \"$COVERAGE_PERCENT\", \"duration\": \"$TEST_DURATION\"}"
fi

exit $EXIT_SUCCESS