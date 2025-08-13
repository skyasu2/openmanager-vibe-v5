#!/bin/bash

# OpenManager VIBE v5 - Production Deployment Script
# 프로덕션 배포를 위한 종합 검증 및 배포 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}${WHITE}"
echo "🚀 OpenManager VIBE v5 - Production Deployment"
echo "=============================================="
echo -e "${NC}"

# 1. 환경변수 검증
echo -e "${BLUE}📋 1단계: 환경변수 검증${NC}"
echo "npm run validate:env"
if npm run validate:env; then
    echo -e "${GREEN}✅ 환경변수 검증 완료${NC}"
else
    echo -e "${RED}❌ 환경변수 검증 실패 - 배포 중단${NC}"
    exit 1
fi

echo ""

# 2. 타입 체크
echo -e "${BLUE}🔍 2단계: TypeScript 타입 검사${NC}"
echo "npm run type-check"
if npm run type-check; then
    echo -e "${GREEN}✅ 타입 검사 완료${NC}"
else
    echo -e "${RED}❌ 타입 에러 발견 - 배포 중단${NC}"
    exit 1
fi

echo ""

# 3. 린트 검사
echo -e "${BLUE}🔧 3단계: ESLint 검사${NC}"
echo "npm run lint"
if npm run lint; then
    echo -e "${GREEN}✅ 린트 검사 완료${NC}"
else
    echo -e "${YELLOW}⚠️ 린트 경고 있음 - 계속 진행${NC}"
fi

echo ""

# 4. 테스트 실행
echo -e "${BLUE}🧪 4단계: 테스트 실행${NC}"
echo "npm run test:quick"
if npm run test:quick; then
    echo -e "${GREEN}✅ 테스트 통과${NC}"
else
    echo -e "${RED}❌ 테스트 실패 - 배포 중단${NC}"
    exit 1
fi

echo ""

# 5. 보안 검사
echo -e "${BLUE}🔒 5단계: 보안 감사${NC}"
echo "npm audit --audit-level moderate"
if npm audit --audit-level moderate; then
    echo -e "${GREEN}✅ 보안 감사 통과${NC}"
else
    echo -e "${YELLOW}⚠️ 보안 취약점 발견 - 확인 후 진행${NC}"
    read -p "계속 진행하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}배포 중단${NC}"
        exit 1
    fi
fi

echo ""

# 6. 프로덕션 빌드
echo -e "${BLUE}🏗️ 6단계: 프로덕션 빌드${NC}"
echo "npm run build"
if npm run build; then
    echo -e "${GREEN}✅ 빌드 성공${NC}"
else
    echo -e "${RED}❌ 빌드 실패 - 배포 중단${NC}"
    exit 1
fi

echo ""

# 7. 빌드 크기 확인
echo -e "${BLUE}📊 7단계: 빌드 크기 확인${NC}"
BUILD_SIZE=$(du -sh .next | cut -f1)
echo "빌드 크기: $BUILD_SIZE"

if [ -f .next/analyze/client.html ]; then
    echo -e "${GREEN}📈 번들 분석 리포트 생성됨: .next/analyze/client.html${NC}"
fi

echo ""

# 8. 배포 전 최종 확인
echo -e "${PURPLE}🎯 배포 전 최종 확인${NC}"
echo "프로젝트: OpenManager VIBE v5"
echo "환경: Production"
echo "빌드 크기: $BUILD_SIZE"
echo "타겟: Vercel (Seoul 리전)"
echo ""

read -p "프로덕션 배포를 실행하시겠습니까? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}배포 취소됨${NC}"
    exit 0
fi

echo ""

# 9. Vercel 배포 실행
echo -e "${BLUE}🚀 9단계: Vercel 배포 실행${NC}"
echo "vercel --prod"

if command -v vercel &> /dev/null; then
    if vercel --prod; then
        echo ""
        echo -e "${GREEN}🎉 배포 성공!${NC}"
        echo -e "${CYAN}📱 배포 후 확인사항:${NC}"
        echo "1. 웹사이트 로딩 확인"
        echo "2. AI Sidebar 동작 확인"  
        echo "3. API 엔드포인트 응답 확인"
        echo "4. Vercel Analytics 데이터 확인"
        echo ""
        echo -e "${BLUE}🔗 유용한 링크:${NC}"
        echo "Vercel Dashboard: https://vercel.com/dashboard"
        echo "Analytics: https://vercel.com/analytics"
        echo "함수 로그: https://vercel.com/functions"
    else
        echo -e "${RED}❌ 배포 실패${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Vercel CLI가 설치되지 않았습니다${NC}"
    echo "설치: npm install -g vercel"
    exit 1
fi

echo ""
echo -e "${CYAN}✨ 배포 완료! OpenManager VIBE v5가 성공적으로 프로덕션에 배포되었습니다.${NC}"