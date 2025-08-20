#!/bin/bash

# OpenManager VIBE v5 - API 엔드포인트 테스트 스크립트
# 작성일: 2025-08-20
# 작성자: Claude Code (Test Automation Specialist)

set -e

BASE_URL="http://localhost:3000"
TIMESTAMP=$(date '+%Y-%m-%d_%H:%M:%S')
REPORT_FILE="reports/api-test-report-${TIMESTAMP}.json"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 결과 저장용 배열
declare -a test_results=()

echo -e "${BLUE}🚀 OpenManager VIBE v5 API 엔드포인트 테스트 시작${NC}"
echo "=================================================="
echo "시간: $TIMESTAMP"
echo "기본 URL: $BASE_URL"
echo ""

# 헬퍼 함수: API 테스트
test_api() {
    local endpoint="$1"
    local expected_status="$2"
    local test_name="$3"
    local method="${4:-GET}"
    local body="${5:-}"
    
    echo -e "${YELLOW}테스트: $test_name${NC}"
    echo "엔드포인트: $endpoint"
    
    # 요청 시작 시간 기록
    start_time=$(date +%s.%N)
    
    # curl 실행
    if [ -n "$body" ]; then
        response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
            -X "$method" \
            -H "Content-Type: application/json" \
            -d "$body" \
            "$BASE_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
            -X "$method" \
            "$BASE_URL$endpoint" 2>/dev/null)
    fi
    
    # 응답 파싱
    lines=($(echo "$response" | tail -2))
    status_code="${lines[0]}"
    response_time="${lines[1]}"
    response_body=$(echo "$response" | head -n -2)
    
    # 결과 판정
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ 성공${NC} - 상태: $status_code, 시간: ${response_time}s"
        result="PASS"
    else
        echo -e "${RED}❌ 실패${NC} - 예상: $expected_status, 실제: $status_code"
        result="FAIL"
    fi
    
    # JSON 유효성 검증 (200 응답인 경우)
    json_valid="false"
    if [ "$status_code" = "200" ] && command -v jq >/dev/null 2>&1; then
        if echo "$response_body" | jq . >/dev/null 2>&1; then
            json_valid="true"
            echo -e "${GREEN}✅ 유효한 JSON${NC}"
        else
            echo -e "${RED}❌ 잘못된 JSON 형식${NC}"
        fi
    fi
    
    # 결과 저장
    test_results+=("{
        \"test_name\": \"$test_name\",
        \"endpoint\": \"$endpoint\",
        \"method\": \"$method\",
        \"expected_status\": $expected_status,
        \"actual_status\": $status_code,
        \"response_time\": $response_time,
        \"result\": \"$result\",
        \"json_valid\": $json_valid,
        \"timestamp\": \"$(date -Iseconds)\"
    }")
    
    echo "응답 본문 (처음 200자):"
    echo "$response_body" | head -c 200
    if [ ${#response_body} -gt 200 ]; then
        echo "..."
    fi
    echo ""
    echo "---"
    echo ""
}

# 서버 상태 확인
echo -e "${BLUE}1. 서버 상태 확인${NC}"
if ! curl -s "$BASE_URL" >/dev/null; then
    echo -e "${RED}❌ 서버가 실행되지 않았습니다. npm run dev를 실행하세요.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 서버가 실행 중입니다.${NC}"
echo ""

# 핵심 API 엔드포인트 테스트
echo -e "${BLUE}2. 핵심 API 엔드포인트 테스트${NC}"

# 1. 헬스체크 API
test_api "/api/health" "200" "헬스체크 API"

# 2. 서버 목록 API
test_api "/api/servers/all" "200" "서버 목록 API"

# 3. 시스템 상태 API (존재한다면)
test_api "/api/system/status" "200" "시스템 상태 API (선택)"

# 4. 메트릭 API
test_api "/api/metrics" "200" "메트릭 API (기본)"

# 5. 대시보드 API
test_api "/api/dashboard" "200" "대시보드 API"

# 6. 인증 테스트 API
test_api "/api/auth/test" "200" "인증 테스트 API"

# 7. AI 쿼리 API (POST)
test_api "/api/ai/query" "400" "AI 쿼리 API (빈 요청)" "POST"

# 8. AI 쿼리 API (올바른 요청)
test_api "/api/ai/query" "200" "AI 쿼리 API (올바른 요청)" "POST" '{"query":"시스템 상태는 어떤가요?"}'

# 추가 테스트: 에러 처리
echo -e "${BLUE}3. 에러 처리 테스트${NC}"

# 존재하지 않는 엔드포인트
test_api "/api/nonexistent" "404" "존재하지 않는 엔드포인트"

# 잘못된 메서드
test_api "/api/health" "405" "잘못된 메서드 (POST to GET endpoint)" "POST"

# 결과 집계
echo -e "${BLUE}4. 테스트 결과 집계${NC}"

passed_tests=0
failed_tests=0
total_tests=${#test_results[@]}

for result in "${test_results[@]}"; do
    if echo "$result" | grep -q '"result": "PASS"'; then
        ((passed_tests++))
    else
        ((failed_tests++))
    fi
done

echo "총 테스트: $total_tests"
echo -e "통과: ${GREEN}$passed_tests${NC}"
echo -e "실패: ${RED}$failed_tests${NC}"

# JSON 리포트 생성
mkdir -p reports
cat > "$REPORT_FILE" << EOF
{
    "test_session": {
        "timestamp": "$TIMESTAMP",
        "base_url": "$BASE_URL",
        "total_tests": $total_tests,
        "passed_tests": $passed_tests,
        "failed_tests": $failed_tests,
        "success_rate": $(echo "scale=2; $passed_tests * 100 / $total_tests" | bc -l 2>/dev/null || echo "0")
    },
    "tests": [
        $(IFS=','; echo "${test_results[*]}")
    ]
}
EOF

echo ""
echo -e "${BLUE}📊 상세 리포트가 생성되었습니다: $REPORT_FILE${NC}"

# 성공률 계산 및 종료 코드 결정
if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}🎉 모든 테스트가 통과했습니다!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️ 일부 테스트가 실패했습니다. 상세 내용을 확인하세요.${NC}"
    exit 1
fi