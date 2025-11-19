#!/bin/bash

# AI 어시스턴트 실제 연동 테스트
# Vercel, Supabase, Google AI API 통합 동작 확인

set -e

API_URL="${1:-http://localhost:3000}"

echo "=== AI 어시스턴트 통합 테스트 ==="
echo "API URL: $API_URL"
echo ""

# 색상
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_endpoint() {
    local name="$1"
    local endpoint="$2"
    local method="${3:-GET}"
    local data="$4"
    
    echo -n "테스트: $name ... "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint" 2>/dev/null || echo "000")
    else
        response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint" 2>/dev/null || echo "000")
    fi
    
    status_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✓ 성공${NC} (${status_code})"
        return 0
    elif [ "$status_code" = "000" ]; then
        echo -e "${RED}✗ 연결 실패${NC}"
        return 1
    else
        echo -e "${YELLOW}⚠ 응답 코드: ${status_code}${NC}"
        return 1
    fi
}

echo "1. 기본 API 엔드포인트 테스트"
echo "----------------------------------------"

test_endpoint "AI Query (간단한 질문)" \
    "/api/ai/query" \
    "POST" \
    '{"query":"안녕하세요"}'

test_endpoint "AI Query (서버 상태)" \
    "/api/ai/query" \
    "POST" \
    '{"query":"서버 상태 확인"}'

test_endpoint "캐시 통계" \
    "/api/ai/cache-stats" \
    "GET"

echo ""
echo "2. Google AI 직접 호출 테스트"
echo "----------------------------------------"

test_endpoint "Google AI Generate" \
    "/api/ai/google-ai/generate" \
    "POST" \
    '{"prompt":"Hello","temperature":0.7}'

echo ""
echo "3. 성능 테스트"
echo "----------------------------------------"

echo -n "응답 시간 측정 ... "
start_time=$(date +%s%3N)

curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"query":"테스트"}' \
    "$API_URL/api/ai/query" > /dev/null 2>&1

end_time=$(date +%s%3N)
elapsed=$((end_time - start_time))

if [ $elapsed -lt 10000 ]; then
    echo -e "${GREEN}✓ ${elapsed}ms${NC} (목표: <10초)"
else
    echo -e "${YELLOW}⚠ ${elapsed}ms${NC} (10초 초과)"
fi

echo ""
echo "4. 캐싱 동작 확인"
echo "----------------------------------------"

echo -n "첫 번째 요청 ... "
response1=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"query":"캐시 테스트"}' \
    "$API_URL/api/ai/query")
echo "완료"

sleep 1

echo -n "두 번째 요청 (캐시 히트 예상) ... "
response2=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"query":"캐시 테스트"}' \
    "$API_URL/api/ai/query")

if echo "$response2" | grep -q '"cached":true'; then
    echo -e "${GREEN}✓ 캐시 히트${NC}"
else
    echo -e "${YELLOW}⚠ 캐시 미스${NC}"
fi

echo ""
echo "=== 테스트 완료 ==="
