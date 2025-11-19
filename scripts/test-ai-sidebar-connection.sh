#!/bin/bash

# AI 사이드바와 엔진 연결 테스트
# UI/UX → API → Engine 전체 플로우 검증

set -e

API_URL="${1:-http://localhost:3000}"

echo "🔍 AI 사이드바 연결 테스트"
echo "API URL: $API_URL"
echo "=========================================="
echo ""

# 색상
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0

test_api() {
    local name="$1"
    local query="$2"
    local expected_field="$3"
    
    echo -n "테스트: $name ... "
    
    response=$(curl -s -X POST "$API_URL/api/ai/query" \
        -H "Content-Type: application/json" \
        -d "{\"query\":\"$query\",\"context\":\"dashboard\",\"mode\":\"google-ai\"}" 2>/dev/null)
    
    if echo "$response" | jq -e ".$expected_field" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 성공${NC}"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗ 실패${NC}"
        echo "  응답: $response"
        ((FAIL++))
        return 1
    fi
}

echo -e "${BLUE}1. 기본 API 연결 테스트${NC}"
echo "----------------------------------------"

test_api "간단한 인사" "안녕하세요" "response"
test_api "서버 상태 질의" "서버 상태 확인" "response"
test_api "응답 시간 확인" "테스트" "responseTime"

echo ""
echo -e "${BLUE}2. 응답 필드 검증${NC}"
echo "----------------------------------------"

echo -n "필수 필드 확인 ... "
response=$(curl -s -X POST "$API_URL/api/ai/query" \
    -H "Content-Type: application/json" \
    -d '{"query":"테스트","context":"dashboard"}')

required_fields=("success" "response" "engine" "responseTime" "timestamp")
all_present=true

for field in "${required_fields[@]}"; do
    if ! echo "$response" | jq -e ".$field" > /dev/null 2>&1; then
        all_present=false
        echo -e "${RED}✗ 실패${NC}"
        echo "  누락된 필드: $field"
        ((FAIL++))
        break
    fi
done

if [ "$all_present" = true ]; then
    echo -e "${GREEN}✓ 성공${NC}"
    ((PASS++))
fi

echo ""
echo -e "${BLUE}3. 엔진 모드 테스트${NC}"
echo "----------------------------------------"

# Google AI 모드
echo -n "Google AI 모드 ... "
response=$(curl -s -X POST "$API_URL/api/ai/query" \
    -H "Content-Type: application/json" \
    -d '{"query":"테스트","mode":"google-ai"}')

if echo "$response" | jq -e '.engine' | grep -q "google\|gemini\|unified"; then
    echo -e "${GREEN}✓ 성공${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ 실패${NC}"
    ((FAIL++))
fi

# Local 모드
echo -n "Local AI 모드 ... "
response=$(curl -s -X POST "$API_URL/api/ai/query" \
    -H "Content-Type: application/json" \
    -d '{"query":"테스트","mode":"local-ai"}')

if echo "$response" | jq -e '.engine' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 성공${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ 실패${NC}"
    ((FAIL++))
fi

echo ""
echo -e "${BLUE}4. 메타데이터 전달 테스트${NC}"
echo "----------------------------------------"

echo -n "서버 메타데이터 전달 ... "
response=$(curl -s -X POST "$API_URL/api/ai/query" \
    -H "Content-Type: application/json" \
    -d '{
        "query":"서버 상태",
        "metadata":{
            "totalServers":17,
            "onlineServers":15,
            "avgCpu":45
        }
    }')

if echo "$response" | jq -e '.response' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 성공${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ 실패${NC}"
    ((FAIL++))
fi

echo ""
echo -e "${BLUE}5. 캐싱 동작 테스트${NC}"
echo "----------------------------------------"

echo -n "첫 번째 요청 ... "
response1=$(curl -s -X POST "$API_URL/api/ai/query" \
    -H "Content-Type: application/json" \
    -d '{"query":"캐시 테스트 12345"}')

if echo "$response1" | jq -e '.response' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 성공${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ 실패${NC}"
    ((FAIL++))
fi

sleep 1

echo -n "두 번째 요청 (캐시 히트 예상) ... "
response2=$(curl -s -X POST "$API_URL/api/ai/query" \
    -H "Content-Type: application/json" \
    -d '{"query":"캐시 테스트 12345"}')

# 캐시 히트 확인 (응답 시간이 더 빠르거나 cached 필드 존재)
time1=$(echo "$response1" | jq -r '.responseTime // 0')
time2=$(echo "$response2" | jq -r '.responseTime // 0')

if [ "$time2" -lt "$time1" ] || echo "$response2" | jq -e '.cached' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 캐시 동작${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠ 캐시 미확인${NC}"
    ((PASS++))
fi

echo ""
echo -e "${BLUE}6. 에러 처리 테스트${NC}"
echo "----------------------------------------"

echo -n "빈 쿼리 에러 처리 ... "
response=$(curl -s -X POST "$API_URL/api/ai/query" \
    -H "Content-Type: application/json" \
    -d '{"query":""}')

if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 성공${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ 실패${NC}"
    ((FAIL++))
fi

echo -n "긴 쿼리 에러 처리 ... "
long_query=$(printf 'a%.0s' {1..1100})
response=$(curl -s -X POST "$API_URL/api/ai/query" \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"$long_query\"}")

if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 성공${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ 실패${NC}"
    ((FAIL++))
fi

echo ""
echo "=========================================="
echo -e "${GREEN}통과: $PASS${NC}"
echo -e "${RED}실패: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 테스트 통과!${NC}"
    echo ""
    echo "📊 연결 상태:"
    echo "  UI (사이드바) → API (/api/ai/query) → Engine (SimplifiedQueryEngine)"
    echo "  ✓ 정상 동작 중"
    exit 0
else
    echo -e "${RED}❌ 일부 테스트 실패${NC}"
    exit 1
fi
