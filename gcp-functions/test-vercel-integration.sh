#!/bin/bash
# GCP Functions + Vercel 통합 테스트
# 2025-11-20

set -e

echo "🧪 GCP Functions + Vercel 통합 테스트"
echo "======================================"
echo ""

BASE_URL="https://openmanager-vibe-v5.vercel.app"
GCP_BASE="https://asia-northeast3-openmanager-free-tier.cloudfunctions.net"

# 색상 코드
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 테스트 결과 카운터
PASSED=0
FAILED=0

# 테스트 함수
test_endpoint() {
  local name=$1
  local url=$2
  local method=${3:-GET}
  local data=${4:-}
  
  echo -n "Testing $name... "
  
  if [ "$method" = "POST" ]; then
    response=$(curl -s -L -w "\n%{http_code}" -X POST "$url" \
      -H "Content-Type: application/json" \
      -H "Origin: https://openmanager-vibe-v5.vercel.app" \
      -d "$data" 2>/dev/null)
  else
    response=$(curl -s -L -w "\n%{http_code}" "$url" 2>/dev/null)
  fi
  
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$status_code" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC} (${status_code})"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC} (${status_code})"
    echo "   Response: $(echo "$body" | head -c 100)"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

echo "📍 1. GCP Functions 직접 테스트"
echo "--------------------------------"

test_endpoint "Health Check" "$GCP_BASE/health-check"

test_endpoint "ML Analytics" "$GCP_BASE/ml-analytics-engine" "POST" \
  '{"metrics":[{"cpu":80,"memory":70,"timestamp":"2025-11-20T12:00:00Z"}]}'

echo ""
echo "📍 2. Vercel 프로덕션 테스트"
echo "--------------------------------"

test_endpoint "Vercel Home" "$BASE_URL/"

test_endpoint "Vercel Main" "$BASE_URL/main"

echo ""
echo "📍 3. Vercel API → GCP Functions 연동 테스트"
echo "--------------------------------"

# AI Query API 테스트 (내부적으로 GCP Functions 호출)
test_endpoint "AI Query API" "$BASE_URL/api/ai/query" "POST" \
  '{"query":"서버 상태 확인","mode":"auto"}'

echo ""
echo "======================================"
echo "📊 테스트 결과 요약"
echo "======================================"
echo -e "✅ 통과: ${GREEN}$PASSED${NC}"
echo -e "❌ 실패: ${RED}$FAILED${NC}"
echo -e "📈 성공률: $(( PASSED * 100 / (PASSED + FAILED) ))%"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 모든 테스트 통과!${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  일부 테스트 실패${NC}"
  exit 1
fi
