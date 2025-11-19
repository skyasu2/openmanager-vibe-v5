#!/bin/bash

# AI 어시스턴트 무료 티어 아키텍처 검증 스크립트
# 각 서비스의 무료 티어 제한과 실제 구현 확인

set -e

echo "🔍 AI 어시스턴트 무료 티어 아키텍처 검증"
echo "=========================================="
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 결과 카운터
PASS=0
FAIL=0
WARN=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++))
}

echo "1️⃣  Vercel 무료 티어 제한 검증"
echo "----------------------------------------"

# Vercel Edge Functions 타임아웃 (10초)
if grep -q "GOOGLE_AI_TIMEOUT=8000" .env.local 2>/dev/null; then
    check_pass "Google AI 타임아웃: 8초 (Vercel 10초 제한 내)"
else
    check_warn "Google AI 타임아웃 설정 확인 필요"
fi

# API 라우트 runtime 설정 확인
EDGE_ROUTES=$(find src/app/api/ai -name "route.ts" -exec grep -l "runtime = 'nodejs'" {} \; | wc -l)
if [ "$EDGE_ROUTES" -gt 0 ]; then
    check_pass "Node.js 런타임 사용: ${EDGE_ROUTES}개 라우트"
else
    check_fail "런타임 설정 확인 필요"
fi

echo ""
echo "2️⃣  Supabase 무료 티어 제한 검증"
echo "----------------------------------------"

# Supabase 연결 설정 확인
if grep -q "SUPABASE_URL=" .env.local 2>/dev/null; then
    check_pass "Supabase URL 설정됨"
else
    check_fail "Supabase URL 미설정"
fi

if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local 2>/dev/null; then
    check_pass "Supabase Anon Key 설정됨"
else
    check_fail "Supabase Anon Key 미설정"
fi

# pgvector 확장 사용 확인
if grep -rq "vector(" src/services/ai/ 2>/dev/null; then
    check_pass "pgvector 확장 사용 중 (RAG 검색)"
else
    check_warn "pgvector 사용 확인 필요"
fi

# 캐싱 전략 확인
if grep -rq "getCachedData\|setCachedData" src/app/api/ai/ 2>/dev/null; then
    check_pass "캐싱 시스템 구현됨 (DB 부하 감소)"
else
    check_warn "캐싱 시스템 확인 필요"
fi

echo ""
echo "3️⃣  Google Cloud Functions 무료 티어 검증"
echo "----------------------------------------"

# GCP 프로젝트 설정 확인
if grep -q "GCP_PROJECT_ID=" .env.local 2>/dev/null; then
    check_pass "GCP 프로젝트 ID 설정됨"
else
    check_warn "GCP 프로젝트 ID 미설정 (선택사항)"
fi

# Cloud Functions 호출 최적화 확인
if grep -rq "timeout.*8000\|timeout.*10000" src/ 2>/dev/null; then
    check_pass "Cloud Functions 타임아웃 최적화됨"
else
    check_warn "타임아웃 설정 확인 필요"
fi

echo ""
echo "4️⃣  Google AI API 무료 티어 제한 검증"
echo "----------------------------------------"

# API 키 설정 확인
if grep -q "GOOGLE_AI_API_KEY=" .env.local 2>/dev/null; then
    check_pass "Google AI API 키 설정됨"
else
    check_fail "Google AI API 키 미설정"
fi

# 무료 티어 제한 설정 확인
if grep -q "GOOGLE_AI_DAILY_LIMIT=1200" .env.local 2>/dev/null; then
    check_pass "일일 제한: 1200 요청 (1500 제한의 80%)"
else
    check_warn "일일 제한 설정 확인 필요"
fi

if grep -q "GOOGLE_AI_MINUTE_LIMIT=10" .env.local 2>/dev/null; then
    check_pass "분당 제한: 10 요청 (15 RPM의 67%)"
else
    check_warn "분당 제한 설정 확인 필요"
fi

if grep -q "GOOGLE_AI_TPM_LIMIT=800000" .env.local 2>/dev/null; then
    check_pass "토큰 제한: 800K (1M TPM의 80%)"
else
    check_warn "토큰 제한 설정 확인 필요"
fi

# 쿼터 보호 기능 확인
if grep -q "GOOGLE_AI_QUOTA_PROTECTION=true" .env.local 2>/dev/null; then
    check_pass "쿼터 보호 기능 활성화됨"
else
    check_warn "쿼터 보호 기능 확인 필요"
fi

# 사용량 추적 시스템 확인
if [ -f "src/services/ai/GoogleAIUsageTracker.ts" ]; then
    check_pass "사용량 추적 시스템 구현됨"
else
    check_fail "사용량 추적 시스템 미구현"
fi

echo ""
echo "5️⃣  통합 시스템 아키텍처 검증"
echo "----------------------------------------"

# Unified Engine 구현 확인
if [ -f "src/services/ai/SimplifiedQueryEngine.ts" ]; then
    check_pass "Unified Query Engine 구현됨"
else
    check_fail "Query Engine 미구현"
fi

# Provider 패턴 확인
PROVIDERS=$(find src/services/ai -name "*Provider*.ts" 2>/dev/null | wc -l)
if [ "$PROVIDERS" -gt 0 ]; then
    check_pass "Provider 패턴 구현: ${PROVIDERS}개"
else
    check_warn "Provider 패턴 확인 필요"
fi

# 에러 핸들링 확인
if [ -f "src/services/ai/routing/AIErrorHandler.ts" ]; then
    check_pass "AI 에러 핸들러 구현됨"
else
    check_warn "에러 핸들러 확인 필요"
fi

# 폴백 시스템 확인
if grep -rq "fallback\|Fallback" src/services/ai/ 2>/dev/null; then
    check_pass "폴백 시스템 구현됨"
else
    check_warn "폴백 시스템 확인 필요"
fi

# 캐시 매니저 확인
if [ -f "src/services/ai/routing/AICacheManager.ts" ]; then
    check_pass "AI 캐시 매니저 구현됨"
else
    check_warn "캐시 매니저 확인 필요"
fi

echo ""
echo "6️⃣  보안 및 최적화 검증"
echo "----------------------------------------"

# 환경변수 암호화 확인
if grep -rq "EnhancedEnvCryptoManager\|encryption" src/lib/ 2>/dev/null; then
    check_pass "환경변수 암호화 시스템 구현됨"
else
    check_warn "암호화 시스템 확인 필요"
fi

# Rate Limiting 확인
if grep -rq "rateLimit\|RateLimit" src/ 2>/dev/null; then
    check_pass "Rate Limiting 구현됨"
else
    check_warn "Rate Limiting 확인 필요"
fi

# 입력 검증 확인
if grep -rq "zod\|validation" src/app/api/ai/ 2>/dev/null; then
    check_pass "입력 검증 시스템 구현됨"
else
    check_warn "입력 검증 확인 필요"
fi

echo ""
echo "=========================================="
echo "검증 결과 요약"
echo "=========================================="
echo -e "${GREEN}통과: ${PASS}${NC}"
echo -e "${YELLOW}경고: ${WARN}${NC}"
echo -e "${RED}실패: ${FAIL}${NC}"
echo ""

# 전체 점수 계산
TOTAL=$((PASS + WARN + FAIL))
SCORE=$((PASS * 100 / TOTAL))

echo "전체 점수: ${SCORE}%"
echo ""

if [ "$FAIL" -eq 0 ] && [ "$WARN" -le 3 ]; then
    echo -e "${GREEN}✓ 무료 티어 아키텍처 검증 통과${NC}"
    exit 0
elif [ "$FAIL" -eq 0 ]; then
    echo -e "${YELLOW}⚠ 일부 경고 사항 확인 필요${NC}"
    exit 0
else
    echo -e "${RED}✗ 필수 항목 실패 - 수정 필요${NC}"
    exit 1
fi
