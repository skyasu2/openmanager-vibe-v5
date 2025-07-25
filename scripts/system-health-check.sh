#!/bin/bash

echo "🔍 OpenManager Vibe v5 시스템 상태 점검"
echo "========================================"
echo "실행 시간: $(date)"
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 시스템 헬스체크 스크립트
echo "🔍 시스템 헬스체크 시작..."

# Redis 연결 테스트
REDIS_URL="${UPSTASH_REDIS_REST_URL:-}"
REDIS_TOKEN="${UPSTASH_REDIS_REST_TOKEN:-}"

echo "📊 Redis 상태 확인 중..."
if [ -z "$REDIS_URL" ] || [ -z "$REDIS_TOKEN" ]; then
    echo "❌ Redis 환경변수 미설정"
    REDIS_STATUS=""
else
    REDIS_STATUS=$(curl -s "${REDIS_URL}/ping" -H "Authorization: Bearer ${REDIS_TOKEN}" 2>/dev/null | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
    REDIS_TIME=$(curl -s -w "%{time_total}" -o /dev/null "${REDIS_URL}/ping" -H "Authorization: Bearer ${REDIS_TOKEN}" 2>/dev/null)
    REDIS_KEYS=$(curl -s "${REDIS_URL}/dbsize" -H "Authorization: Bearer ${REDIS_TOKEN}" 2>/dev/null | grep -o '"result":[0-9]*' | cut -d':' -f2)
fi

if [ "$REDIS_STATUS" = "PONG" ]; then
    echo "✅ Redis 연결 성공 (응답시간: ${REDIS_TIME}s, 키 개수: ${REDIS_KEYS})"
else
    echo "❌ Redis 연결 실패"
fi

# 1. Vercel 상태 확인
echo -n "🌐 Vercel 앱 상태: "
VERCEL_STATUS=$(curl -s https://openmanager-vibe-v5.vercel.app/api/health 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$VERCEL_STATUS" = "healthy" ]; then
    echo -e "${GREEN}✅ 정상 (healthy)${NC}"
else
    echo -e "${RED}❌ 이상 ($VERCEL_STATUS)${NC}"
fi

# 2. MCP 서버 상태 확인
echo -n "🖥️  MCP 서버 상태: "
MCP_STATUS=$(curl -s http://104.154.205.25:10000/health 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$MCP_STATUS" = "healthy" ]; then
    echo -e "${GREEN}✅ 정상 (healthy)${NC}"
else
    echo -e "${RED}❌ 이상 ($MCP_STATUS)${NC}"
fi

echo ""
echo "📊 상세 메트릭:"

# 응답시간 측정
VERCEL_TIME=$(curl -s -w "%{time_total}" -o /dev/null https://openmanager-vibe-v5.vercel.app/api/health 2>/dev/null)
MCP_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://104.154.205.25:10000/health 2>/dev/null)

echo "   Vercel 응답시간: ${VERCEL_TIME}초"
echo "   MCP 응답시간: ${MCP_TIME}초"

# Vercel 버전 정보
VERCEL_VERSION=$(curl -s https://openmanager-vibe-v5.vercel.app/api/health 2>/dev/null | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
echo "   Vercel 앱 버전: ${VERCEL_VERSION}"

echo ""

# 전체 상태 판정
ALL_HEALTHY=true
if [ "$VERCEL_STATUS" != "healthy" ]; then ALL_HEALTHY=false; fi
if [ "$MCP_STATUS" != "healthy" ]; then ALL_HEALTHY=false; fi
if [ "$REDIS_STATUS" != "PONG" ]; then ALL_HEALTHY=false; fi

if [ "$ALL_HEALTHY" = true ]; then
    echo -e "🎯 전체 상태: ${GREEN}✅ 모든 서비스 정상 운영 중${NC}"
else
    echo -e "🎯 전체 상태: ${YELLOW}⚠️  일부 서비스에 문제 발생${NC}"
    echo ""
    echo -e "${YELLOW}📋 문제 해결 가이드:${NC}"
    echo "   1. docs/system-status-monitoring-guide.md 참조"
    echo "   2. 개별 서비스 로그 확인"
    echo "   3. 필요시 서비스 재시작"
fi

echo "========================================"
echo "💡 유용한 명령어:"
echo "   npm run system:health        # 이 스크립트 실행"
echo "   npm run redis:test           # Redis 상세 테스트"
echo "   npm run gcp:check            # GCP 상태 점검"
echo "   npm run health:check         # 로컬 헬스체크"
echo ""
echo "📖 상세 가이드: docs/system-status-monitoring-guide.md"