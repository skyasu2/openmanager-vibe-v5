#!/bin/bash

# GCP Functions 코드 정리 스크립트
# 불필요한 코드 제거 및 최적화

set -e

echo "🧹 GCP Functions 코드 정리 시작"
echo "=========================================="
echo ""

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 백업 디렉토리 생성
BACKUP_DIR="archive/gcp-cleanup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}1. 백업 생성${NC}"
echo "----------------------------------------"
cp -r src/lib/gcp "$BACKUP_DIR/"
echo -e "${GREEN}✓${NC} 백업 완료: $BACKUP_DIR"
echo ""

echo -e "${BLUE}2. 불필요한 타입 제거${NC}"
echo "----------------------------------------"

# UnifiedAI 타입 제거 (사용하지 않음)
if grep -q "UnifiedAIRequest\|UnifiedAIResponse" src/lib/gcp/gcp-functions.types.ts; then
    echo -e "${YELLOW}⚠${NC} UnifiedAI 타입 발견 (제거 권장)"
    echo "  파일: src/lib/gcp/gcp-functions.types.ts"
    echo "  수동 제거 필요"
else
    echo -e "${GREEN}✓${NC} 불필요한 타입 없음"
fi
echo ""

echo -e "${BLUE}3. 중복 설정 확인${NC}"
echo "----------------------------------------"

# GCP URL 중복 확인
GCP_CONFIG_COUNT=$(grep -r "GCP_FUNCTIONS_URL\|gcpFunctions.*url" src/ --include="*.ts" | wc -l)
echo "  GCP 설정 발견: ${GCP_CONFIG_COUNT}개 위치"

if [ "$GCP_CONFIG_COUNT" -gt 2 ]; then
    echo -e "${YELLOW}⚠${NC} 중복 설정 발견 (통합 권장)"
    echo "  권장: src/lib/gcp/gcp-functions.config.ts만 사용"
else
    echo -e "${GREEN}✓${NC} 설정 중복 없음"
fi
echo ""

echo -e "${BLUE}4. 사용하지 않는 함수 확인${NC}"
echo "----------------------------------------"

# 실제 사용 위치 확인
USAGE_COUNT=$(grep -r "gcpFunctions\|GCPFunctions" src/ --include="*.ts" --include="*.tsx" | grep -v "\.types\|\.config\|\.utils\|gcp/" | wc -l)
echo "  실제 사용: ${USAGE_COUNT}개 위치"

if [ "$USAGE_COUNT" -lt 5 ]; then
    echo -e "${YELLOW}⚠${NC} 사용률 낮음 (활용도 검토 필요)"
else
    echo -e "${GREEN}✓${NC} 적절히 사용 중"
fi
echo ""

echo -e "${BLUE}5. 로깅 최적화 제안${NC}"
echo "----------------------------------------"

# debugLog 사용 확인
DEBUG_LOG_COUNT=$(grep -r "debugLog" src/lib/gcp/ | wc -l)
echo "  debugLog 호출: ${DEBUG_LOG_COUNT}개"

if [ "$DEBUG_LOG_COUNT" -gt 10 ]; then
    echo -e "${YELLOW}⚠${NC} 과도한 로깅 (최적화 권장)"
    echo "  권장: 개발 환경에서만 로깅"
else
    echo -e "${GREEN}✓${NC} 로깅 적절"
fi
echo ""

echo -e "${BLUE}6. 캐싱 전략 확인${NC}"
echo "----------------------------------------"

# 캐싱 구현 확인
if grep -q "cache\|Cache" src/lib/gcp/resilient-ai-client.ts; then
    echo -e "${GREEN}✓${NC} 캐싱 구현됨"
    
    # TTL 확인
    if grep -q "DEFAULT_CACHE_TTL.*5.*60.*1000" src/lib/gcp/resilient-ai-client.ts; then
        echo "  TTL: 5분 (적절)"
    else
        echo -e "${YELLOW}⚠${NC} TTL 확인 필요"
    fi
else
    echo -e "${YELLOW}⚠${NC} 캐싱 미구현 (성능 개선 가능)"
fi
echo ""

echo "=========================================="
echo -e "${GREEN}정리 완료${NC}"
echo ""
echo "📋 다음 단계:"
echo "  1. 백업 확인: $BACKUP_DIR"
echo "  2. 불필요한 타입 수동 제거"
echo "  3. 중복 설정 통합"
echo "  4. 로깅 최적화"
echo ""
echo "📚 상세 가이드: docs/core/platforms/gcp/GCP-FUNCTIONS-OPTIMIZATION.md"
