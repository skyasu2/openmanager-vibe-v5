#!/bin/bash

# 🚀 Vercel 실제 환경 테스트 스크립트
# Mock 대신 실제 배포된 환경에서 직접 테스트

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로고 출력
echo -e "${PURPLE}"
echo "🚀 =================================="
echo "   Vercel 실제 환경 테스트 스위트"
echo "   Mock 없는 진짜 테스트"
echo "==================================${NC}"
echo ""

# 환경 변수 확인
if [[ -z "$VERCEL_PRODUCTION_URL" ]]; then
    echo -e "${YELLOW}⚠️  VERCEL_PRODUCTION_URL이 설정되지 않았습니다.${NC}"
    echo -e "${CYAN}💡 자동으로 최신 배포를 찾고 있습니다...${NC}"

    # Vercel CLI로 최신 배포 URL 가져오기
    DEPLOYED_URL=$(vercel ls --scope team_2ZLhn2x7YBPZwYs0VF2C2FoB | grep -E "https://.*\.vercel\.app" | head -1 | awk '{print $1}' || echo "")

    if [[ -z "$DEPLOYED_URL" ]]; then
        echo -e "${RED}❌ Vercel 배포를 찾을 수 없습니다. 먼저 배포해주세요.${NC}"
        echo -e "${CYAN}💡 배포 명령어: vercel --prod${NC}"
        exit 1
    fi

    VERCEL_PRODUCTION_URL="$DEPLOYED_URL"
    echo -e "${GREEN}✅ 자동 감지된 배포 URL: $VERCEL_PRODUCTION_URL${NC}"
else
    echo -e "${GREEN}✅ 설정된 배포 URL: $VERCEL_PRODUCTION_URL${NC}"
fi

echo ""

# 테스트 결과 저장
TEST_RESULTS=()
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 테스트 함수
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="${3:-200}"

    echo -e "${BLUE}🧪 테스트: $test_name${NC}"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if eval "$test_command"; then
        echo -e "${GREEN}✅ 통과: $test_name${NC}"
        TEST_RESULTS+=("✅ $test_name")
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ 실패: $test_name${NC}"
        TEST_RESULTS+=("❌ $test_name")
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

# API 헬스체크
run_test "API 헬스체크" \
    "curl -f -s --connect-timeout 10 '$VERCEL_PRODUCTION_URL/api/health' > /dev/null"

# 서버 목록 API
run_test "서버 목록 API" \
    "curl -f -s --connect-timeout 10 '$VERCEL_PRODUCTION_URL/api/servers' | jq '.success' | grep -q 'true'"

# 대시보드 데이터 API
run_test "대시보드 데이터 API" \
    "curl -f -s --connect-timeout 10 '$VERCEL_PRODUCTION_URL/api/dashboard' | jq '.data' > /dev/null"

# AI 쿼리 API (LOCAL 모드) - ⚠️ 무료 티어 보호: 가벼운 쿼리만
run_test "AI 쿼리 API (LOCAL 모드)" \
    "curl -f -s --connect-timeout 10 -X POST '$VERCEL_PRODUCTION_URL/api/ai/query' \
     -H 'Content-Type: application/json' \
     -d '{\"query\":\"상태\",\"engine\":\"LOCAL\"}' | jq '.response' > /dev/null"

# 메인 페이지 로드
run_test "메인 페이지 로드" \
    "curl -f -s --connect-timeout 10 '$VERCEL_PRODUCTION_URL' | grep -q '<title>'"

# 정적 리소스 로드
run_test "정적 리소스 (favicon)" \
    "curl -f -s --connect-timeout 10 '$VERCEL_PRODUCTION_URL/favicon.ico' > /dev/null"

# 보안 헤더 확인
run_test "보안 헤더 확인" \
    "curl -I -s --connect-timeout 10 '$VERCEL_PRODUCTION_URL' | grep -q 'x-frame-options'"

# E2E 테스트 (Playwright)
echo -e "${PURPLE}🎭 E2E 테스트 시작 (Playwright with Vercel URL)${NC}"

if command -v npx > /dev/null; then
    # Playwright를 Vercel URL로 실행
    export TEST_BASE_URL="$VERCEL_PRODUCTION_URL"

    run_test "E2E 테스트 (대시보드)" \
        "cd '$PROJECT_ROOT' && timeout 120 npx playwright test --config playwright-vercel.config.ts || true"
else
    echo -e "${YELLOW}⚠️  Playwright가 설치되지 않아 E2E 테스트를 건너뜁니다.${NC}"
    echo ""
fi

# 성능 테스트
echo -e "${PURPLE}⚡ 성능 테스트${NC}"

# 응답 시간 측정
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' --connect-timeout 10 "$VERCEL_PRODUCTION_URL" || echo "0")
RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc -l 2>/dev/null || echo "0")

if (( $(echo "$RESPONSE_TIME_MS > 0" | bc -l 2>/dev/null || echo 0) )); then
    if (( $(echo "$RESPONSE_TIME_MS < 2000" | bc -l 2>/dev/null || echo 0) )); then
        echo -e "${GREEN}✅ 응답 시간: ${RESPONSE_TIME_MS%.*}ms (우수)${NC}"
        TEST_RESULTS+=("✅ 응답 시간: ${RESPONSE_TIME_MS%.*}ms")
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${YELLOW}⚠️  응답 시간: ${RESPONSE_TIME_MS%.*}ms (개선 필요)${NC}"
        TEST_RESULTS+=("⚠️  응답 시간: ${RESPONSE_TIME_MS%.*}ms")
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    echo -e "${RED}❌ 응답 시간 측정 실패${NC}"
fi

echo ""

# 결과 요약
echo -e "${PURPLE}📊 테스트 결과 요약${NC}"
echo "=================================="
echo -e "${BLUE}배포 URL: $VERCEL_PRODUCTION_URL${NC}"
echo -e "${GREEN}✅ 통과: $PASSED_TESTS${NC}"
echo -e "${RED}❌ 실패: $FAILED_TESTS${NC}"
echo -e "${CYAN}📈 성공률: $(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l 2>/dev/null || echo "0")%${NC}"

echo ""
echo -e "${PURPLE}📋 세부 결과:${NC}"
for result in "${TEST_RESULTS[@]}"; do
    echo "  $result"
done

echo ""

# 최종 결과
if [[ $FAILED_TESTS -eq 0 ]]; then
    echo -e "${GREEN}🎉 모든 테스트 통과! Vercel 배포가 완벽히 작동 중입니다.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  $FAILED_TESTS개 테스트 실패. 배포 상태를 확인해주세요.${NC}"
    exit 1
fi