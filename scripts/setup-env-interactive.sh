#!/bin/bash

# 🔧 대화형 환경변수 설정 스크립트
# OpenManager Vibe v5 - 보안 강화된 환경변수 시스템

echo "🔧 OpenManager Vibe v5 - 환경변수 설정 마법사"
echo "=================================================="
echo ""
echo "이 스크립트는 하드코딩된 시크릿을 제거한 후"
echo "실제 환경변수를 안전하게 설정하는 과정을 안내합니다."
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 현재 상태 확인
echo -e "${BLUE}🔍 현재 상태 확인 중...${NC}"
echo ""

# .env.local 파일 존재 확인
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local 파일 존재${NC}"
else
    echo -e "${RED}❌ .env.local 파일 없음${NC}"
    echo "env.local.template을 .env.local로 복사하는 중..."
    cp env.local.template .env.local
    echo -e "${GREEN}✅ .env.local 파일 생성 완료${NC}"
fi

# 하드코딩된 시크릿 검사
echo ""
echo -e "${BLUE}🔍 하드코딩된 시크릿 검사 중...${NC}"
HARDCODED_SECRETS=0

# 주요 패턴 검사
patterns=(
    "AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGZiZjUyMmQ0YTkyMzIwM3AxMA"
    "charming-condor-46598.upstash.io"
    "Ov23liFnUsRO0ttNegju"
    "c7a990fa0259aa25af76ed38ab60a2a69252b2c5"
)

for pattern in "${patterns[@]}"; do
    if grep -q "$pattern" .env.local 2>/dev/null; then
        echo -e "${RED}❌ 하드코딩된 시크릿 발견: $pattern${NC}"
        HARDCODED_SECRETS=1
    fi
done

if [ $HARDCODED_SECRETS -eq 0 ]; then
    echo -e "${GREEN}✅ 하드코딩된 시크릿 정리 완료${NC}"
else
    echo -e "${RED}❌ 하드코딩된 시크릿이 남아있습니다. 먼저 정리해주세요.${NC}"
    exit 1
fi

echo ""
echo "=================================================="
echo ""

# 사용자 선택 메뉴
echo -e "${YELLOW}📋 환경변수 설정 방법을 선택해주세요:${NC}"
echo ""
echo "1. 🔧 대화형 설정 (권장) - 단계별 안내"
echo "2. 📖 가이드 표시 - 수동 설정 가이드"
echo "3. 🚀 Vercel 연결 확인 - Vercel CLI 설정"
echo "4. ❌ 종료"
echo ""
read -p "선택 (1-4): " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}🔧 대화형 환경변수 설정 시작${NC}"
        echo "=================================================="
        echo ""
        
        # Supabase 설정
        echo -e "${BLUE}🗄️ Supabase 설정${NC}"
        echo "1. https://supabase.com/dashboard 접속"
        echo "2. 프로젝트 선택: OpenManager Vibe v5"
        echo "3. Settings → API 이동"
        echo ""
        read -p "Supabase URL을 입력하세요 (https://your-project-id.supabase.co): " supabase_url
        read -p "Supabase Anon Key를 입력하세요: " supabase_anon_key
        read -p "Supabase Service Role Key를 입력하세요: " supabase_service_key
        
        echo ""
        echo -e "${BLUE}🔴 Redis (Upstash) 설정${NC}"
        echo "1. https://console.upstash.com/ 접속"
        echo "2. Redis 인스턴스 선택"
        echo "3. 연결 정보 복사"
        echo ""
        read -p "Redis REST URL을 입력하세요 (https://your-instance.upstash.io): " redis_url
        read -p "Redis REST Token을 입력하세요: " redis_token
        
        echo ""
        echo -e "${BLUE}🔐 GitHub OAuth 설정${NC}"
        echo "1. GitHub → Settings → Developer settings → OAuth Apps"
        echo "2. 기존 OAuth 앱 확인"
        echo ""
        read -p "GitHub Client ID를 입력하세요: " github_client_id
        read -p "GitHub Client Secret을 입력하세요: " github_client_secret
        
        echo ""
        echo -e "${BLUE}🤖 Google AI API 설정${NC}"
        echo "1. https://makersuite.google.com/app/apikey 접속"
        echo "2. API 키 생성/확인"
        echo ""
        read -p "Google AI API Key를 입력하세요: " google_ai_key
        
        # NextAuth Secret 생성
        echo ""
        echo -e "${BLUE}🔐 NextAuth Secret 생성 중...${NC}"
        nextauth_secret=$(openssl rand -base64 32)
        echo "자동 생성된 NextAuth Secret: $nextauth_secret"
        
        # .env.local 파일 업데이트
        echo ""
        echo -e "${BLUE}📝 .env.local 파일 업데이트 중...${NC}"
        
        # 백업 생성
        cp .env.local .env.local.backup
        
        # 실제 값으로 교체
        sed -i "s|SUPABASE_URL=your_supabase_url_here|SUPABASE_URL=$supabase_url|g" .env.local
        sed -i "s|NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here|NEXT_PUBLIC_SUPABASE_URL=$supabase_url|g" .env.local
        sed -i "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here|NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabase_anon_key|g" .env.local
        sed -i "s|SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here|SUPABASE_SERVICE_ROLE_KEY=$supabase_service_key|g" .env.local
        
        sed -i "s|UPSTASH_REDIS_REST_URL=your_upstash_redis_url_here|UPSTASH_REDIS_REST_URL=$redis_url|g" .env.local
        sed -i "s|UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token_here|UPSTASH_REDIS_REST_TOKEN=$redis_token|g" .env.local
        sed -i "s|KV_REST_API_URL=https://your_redis_host_here|KV_REST_API_URL=$redis_url|g" .env.local
        sed -i "s|KV_REST_API_TOKEN=your_redis_token_here|KV_REST_API_TOKEN=$redis_token|g" .env.local
        
        # Redis URL 구성
        redis_host=$(echo $redis_url | sed 's|https://||')
        redis_connection_url="rediss://default:$redis_token@$redis_host:6379"
        sed -i "s|KV_URL=rediss://default:your_redis_password_here@your_redis_host_here:6379|KV_URL=$redis_connection_url|g" .env.local
        
        sed -i "s|GITHUB_CLIENT_ID=your_github_client_id_here|GITHUB_CLIENT_ID=$github_client_id|g" .env.local
        sed -i "s|GITHUB_CLIENT_SECRET=your_github_client_secret_here|GITHUB_CLIENT_SECRET=$github_client_secret|g" .env.local
        sed -i "s|NEXTAUTH_SECRET=your_nextauth_secret_here_generate_random_string|NEXTAUTH_SECRET=$nextauth_secret|g" .env.local
        
        sed -i "s|GOOGLE_AI_API_KEY=your_google_ai_api_key_here|GOOGLE_AI_API_KEY=$google_ai_key|g" .env.local
        
        echo -e "${GREEN}✅ .env.local 파일 업데이트 완료${NC}"
        echo ""
        echo -e "${YELLOW}📋 다음 단계:${NC}"
        echo "1. 로컬 테스트: npm run dev"
        echo "2. Vercel 환경변수 설정: ./scripts/setup-env-interactive.sh 실행하고 옵션 3 선택"
        echo "3. 배포: git add . && git commit -m '🔐 환경변수 설정 완료' && git push"
        ;;
        
    2)
        echo ""
        echo -e "${GREEN}📖 환경변수 설정 가이드${NC}"
        echo "=================================================="
        echo ""
        cat setup-env-guide.md
        ;;
        
    3)
        echo ""
        echo -e "${GREEN}🚀 Vercel 연결 확인${NC}"
        echo "=================================================="
        echo ""
        
        # Vercel 로그인 확인
        if vercel whoami >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Vercel 로그인 상태 확인됨${NC}"
            echo "현재 사용자: $(vercel whoami)"
        else
            echo -e "${YELLOW}⚠️ Vercel 로그인 필요${NC}"
            echo "다음 명령어로 로그인하세요:"
            echo "vercel login"
            echo ""
            read -p "로그인 후 Enter를 누르세요..."
        fi
        
        # 프로젝트 연결 확인
        echo ""
        echo -e "${BLUE}🔗 프로젝트 연결 확인 중...${NC}"
        if vercel ls >/dev/null 2>&1; then
            echo -e "${GREEN}✅ 프로젝트 연결 확인됨${NC}"
            echo "연결된 프로젝트:"
            vercel ls | head -5
        else
            echo -e "${YELLOW}⚠️ 프로젝트 연결 필요${NC}"
            echo "다음 명령어로 연결하세요:"
            echo "vercel link --yes"
            echo "프로젝트 선택: skyasus-projects/openmanager-vibe-v5"
        fi
        
        echo ""
        echo -e "${BLUE}📋 환경변수 설정 가이드:${NC}"
        echo "1. 로컬 .env.local 파일 설정 완료 후"
        echo "2. 다음 명령어들로 Vercel 환경변수 설정:"
        echo ""
        echo "vercel env add SUPABASE_URL"
        echo "vercel env add NEXT_PUBLIC_SUPABASE_URL"
        echo "vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY"
        echo "vercel env add SUPABASE_SERVICE_ROLE_KEY"
        echo "vercel env add UPSTASH_REDIS_REST_URL"
        echo "vercel env add UPSTASH_REDIS_REST_TOKEN"
        echo "vercel env add KV_URL"
        echo "vercel env add KV_REST_API_URL"
        echo "vercel env add KV_REST_API_TOKEN"
        echo "vercel env add GITHUB_CLIENT_ID"
        echo "vercel env add GITHUB_CLIENT_SECRET"
        echo "vercel env add NEXTAUTH_SECRET"
        echo "vercel env add GOOGLE_AI_API_KEY"
        echo ""
        echo "3. 설정 확인: vercel env ls"
        ;;
        
    4)
        echo ""
        echo -e "${YELLOW}👋 설정이 취소되었습니다.${NC}"
        echo "나중에 다시 실행하세요: ./scripts/setup-env-interactive.sh"
        exit 0
        ;;
        
    *)
        echo ""
        echo -e "${RED}❌ 잘못된 선택입니다. 1-4 중에서 선택해주세요.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 환경변수 설정이 완료되었습니다!${NC}"
echo ""
echo -e "${BLUE}📋 확인사항:${NC}"
echo "1. .env.local 파일에 실제 값이 설정되었는지 확인"
echo "2. 로컬 테스트: npm run dev"
echo "3. Vercel 환경변수 설정 (옵션 3 참고)"
echo "4. 프로덕션 배포 및 테스트"
echo ""
echo -e "${YELLOW}⚠️ 주의: .env.local 파일은 절대 Git에 커밋하지 마세요!${NC}"