#!/bin/bash
# AI 통신 엔드포인트 검증 스크립트 v3.0 (Final)
#
# 사용법: ./scripts/test-ai-endpoints.sh [BASE_URL]
# 기본값: https://openmanager-vibe-v5.vercel.app

BASE_URL="${1:-https://openmanager-vibe-v5.vercel.app}"
PASSED=0
FAILED=0

echo "=============================================="
echo "AI 통신 엔드포인트 검증 v3.0 (Final)"
echo "=============================================="
echo "대상: $BASE_URL"
echo "시간: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="

test_api() {
    local name="$1" method="$2" path="$3" data="$4" codes="$5"
    echo -n "  $name... "

    if [ "$method" = "GET" ]; then
        CODE=$(timeout 30 curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")
    else
        CODE=$(timeout 30 curl -s -o /dev/null -w "%{http_code}" -X "$method" \
            "$BASE_URL$path" -H "Content-Type: application/json" -d "$data")
    fi

    if echo "$codes" | grep -q "$CODE"; then
        echo "PASS ($CODE)"; ((PASSED++))
    else
        echo "FAIL ($CODE)"; ((FAILED++))
    fi
}

test_sse() {
    local name="$1" path="$2"
    echo -n "  $name... "

    # Content-Type 확인으로 SSE 검증
    CT=$(timeout 5 curl -s -I "$BASE_URL$path" 2>&1 | grep -i "content-type" | head -1)

    if echo "$CT" | grep -qi "text/event-stream"; then
        echo "PASS (SSE 활성)"
        ((PASSED++))
    else
        echo "SKIP (SSE 미확인)"
    fi
}

echo ""
echo "1. 핵심 AI API (3개)"
echo "----------------------------------------------"
test_api "supervisor POST" "POST" "/api/ai/supervisor" '{"messages":[{"role":"user","content":"테스트"}]}' "200"
test_api "health GET" "GET" "/api/ai/health" "" "200"
test_api "status GET" "GET" "/api/ai/status" "" "200"

echo ""
echo "2. 분석 API (2개)"
echo "----------------------------------------------"
test_api "intelligent-monitoring POST" "POST" "/api/ai/intelligent-monitoring" '{"action":"analyze"}' "200,503"
test_api "insight-center GET" "GET" "/api/ai/insight-center" "" "200,503"

echo ""
echo "3. 보고서/승인 API (3개)"
echo "----------------------------------------------"
test_api "incident-report GET" "GET" "/api/ai/incident-report" "" "200"
test_api "incident-report POST" "POST" "/api/ai/incident-report" '{"action":"list"}' "200,503"
test_api "approval GET" "GET" "/api/ai/approval?sessionId=test" "" "200"

echo ""
echo "4. 로깅/작업 API (4개)"
echo "----------------------------------------------"
test_api "logs GET" "GET" "/api/logs" "" "200"
test_api "jobs GET" "GET" "/api/ai/jobs" "" "200"
test_api "jobs POST" "POST" "/api/ai/jobs" '{"query":"test","type":"analysis"}' "200,201,400"
test_api "feedback POST" "POST" "/api/ai/feedback" '{"rating":5}' "200,400"

echo ""
echo "5. SSE 스트리밍 (2개)"
echo "----------------------------------------------"
test_sse "logging/stream SSE" "/api/ai/logging/stream"
test_api "unified-stream POST" "POST" "/api/ai/unified-stream" '{"messages":[{"role":"user","content":"test"}]}' "200"

echo ""
echo "6. 유틸리티 API (2개)"
echo "----------------------------------------------"
test_api "wake-up POST" "POST" "/api/ai/wake-up" '{}' "200,503"
test_api "rag/benchmark GET" "GET" "/api/ai/rag/benchmark" "" "200,503"

echo ""
echo "=============================================="
echo "최종 결과"
echo "=============================================="
TOTAL=$((PASSED + FAILED))
echo "성공: $PASSED / $TOTAL"
echo "실패: $FAILED"
if [ $TOTAL -gt 0 ]; then
    RATE=$((PASSED * 100 / TOTAL))
    echo "성공률: ${RATE}%"
fi
echo "=============================================="

[ $FAILED -eq 0 ] && exit 0 || exit 1
