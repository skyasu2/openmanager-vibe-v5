#!/bin/bash

# 🚀 Vercel 환경변수 설정 스크립트
# OpenManager Vibe v5 - Vercel 배포용 환경변수 설정

echo "🚀 Vercel 환경변수 설정 도구"
echo "====================================="
echo ""
echo "이 스크립트는 로컬 .env.local 파일의 환경변수를"
echo "Vercel 대시보드에 자동으로 설정합니다."
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Vercel 로그인 확인
echo -e "${BLUE}🔍 Vercel 로그인 상태 확인 중...${NC}"
if ! vercel whoami >/dev/null 2>&1; then
    echo -e "${RED}❌ Vercel 로그인 필요${NC}"
    echo "다음 명령어로 로그인하세요:"
    echo "vercel login"
    echo ""
    read -p "로그인 후 Enter를 누르세요..."
    
    # 로그인 재확인
    if ! vercel whoami >/dev/null 2>&1; then
        echo -e "${RED}❌ Vercel 로그인 실패${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Vercel 로그인 확인: $(vercel whoami)${NC}"
echo ""

# 2. 프로젝트 연결 확인
echo -e "${BLUE}🔗 프로젝트 연결 확인 중...${NC}"
if ! vercel ls >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ 프로젝트 연결 필요${NC}"
    echo "프로젝트를 연결하는 중..."
    vercel link --yes
    
    if ! vercel ls >/dev/null 2>&1; then
        echo -e "${RED}❌ 프로젝트 연결 실패${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ 프로젝트 연결 확인됨${NC}"
echo ""

# 3. .env.local 파일 확인
echo -e "${BLUE}📁 .env.local 파일 확인 중...${NC}"
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local 파일 없음${NC}"
    echo "먼저 다음 명령어로 환경변수를 설정하세요:"
    echo "npm run env:setup"
    exit 1
fi

echo -e "${GREEN}✅ .env.local 파일 존재${NC}"
echo ""

# 4. 환경변수 목록 정의
VERCEL_ENV_VARS=(
    "SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "UPSTASH_REDIS_REST_URL"
    "UPSTASH_REDIS_REST_TOKEN"
    "KV_URL"
    "KV_REST_API_URL"
    "KV_REST_API_TOKEN"
    "GITHUB_CLIENT_ID"
    "GITHUB_CLIENT_SECRET"
    "NEXTAUTH_SECRET"
    "GOOGLE_AI_API_KEY"
    "GOOGLE_AI_ENABLED"
    "GOOGLE_AI_MODEL"
    "GOOGLE_AI_BETA_MODE"
    "GOOGLE_AI_DAILY_LIMIT"
    "GOOGLE_AI_MINUTE_LIMIT"
    "GOOGLE_AI_RPM_LIMIT"
    "GOOGLE_AI_TPM_LIMIT"
    "GOOGLE_AI_QUOTA_PROTECTION"
    "NODE_ENV"
    "NEXT_PUBLIC_SITE_URL"
    "AI_ENGINE_MODE"
    "USE_DYNAMIC_AI_MODEL_ROUTING"
    "MONITORING_ENABLED"
    "METRICS_ENABLED"
    "PERFORMANCE_TRACKING"
    "HEALTH_CHECK_ENABLED"
)

# 5. 환경변수 읽기 및 설정
echo -e "${BLUE}🔧 환경변수 설정 시작...${NC}"
echo ""

# .env.local 파일 로드
source .env.local

TOTAL_VARS=${#VERCEL_ENV_VARS[@]}
PROCESSED=0
SKIPPED=0
FAILED=0

for env_var in "${VERCEL_ENV_VARS[@]}"; do
    echo -n "처리 중: $env_var ... "
    
    # 환경변수 값 가져오기
    value="${!env_var}"
    
    if [ -z "$value" ]; then
        echo -e "${YELLOW}건너뜀 (값 없음)${NC}"
        ((SKIPPED++))
        continue
    fi
    
    # 플레이스홀더 확인
    if [[ "$value" == *"your_"* ]] || [[ "$value" == *"_here"* ]]; then
        echo -e "${YELLOW}건너뜀 (플레이스홀더)${NC}"
        ((SKIPPED++))
        continue
    fi
    
    # Vercel 환경변수 설정
    if echo "$value" | vercel env add "$env_var" production >/dev/null 2>&1; then
        echo -e "${GREEN}완료${NC}"
        ((PROCESSED++))
    else
        echo -e "${RED}실패${NC}"
        ((FAILED++))
    fi
done

echo ""
echo -e "${BLUE}📊 설정 결과:${NC}"
echo "총 환경변수: $TOTAL_VARS개"
echo "설정 완료: $PROCESSED개"
echo "건너뜀: $SKIPPED개"
echo "실패: $FAILED개"
echo ""

# 6. 설정 확인
echo -e "${BLUE}🔍 Vercel 환경변수 확인 중...${NC}"
echo ""
vercel env ls
echo ""

# 7. 다음 단계 안내
if [ $PROCESSED -gt 0 ]; then
    echo -e "${GREEN}🎉 환경변수 설정이 완료되었습니다!${NC}"
    echo ""
    echo -e "${BLUE}📋 다음 단계:${NC}"
    echo "1. 배포 실행: npm run deploy"
    echo "2. 또는: vercel --prod"
    echo "3. 배포 후 테스트: https://openmanager-vibe-v5.vercel.app"
    echo ""
    echo -e "${YELLOW}⚠️ 주의사항:${NC}"
    echo "- 환경변수 변경 후에는 새로운 배포가 필요합니다"
    echo "- 민감한 정보는 절대 로그에 노출하지 마세요"
else
    echo -e "${YELLOW}⚠️ 설정된 환경변수가 없습니다.${NC}"
    echo "먼저 다음 명령어로 로컬 환경변수를 설정하세요:"
    echo "npm run env:setup"
fi