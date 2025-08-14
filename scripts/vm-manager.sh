#!/bin/bash
# vm-manager.sh - Git Bash용 VM 관리 래퍼
# GCP VM Specialist v2.0 - Windows 최적화 VM API 관리

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔧 GCP VM Manager 시작...${NC}"

# 환경변수 로드
if [ -f ".env.local" ]; then
    echo -e "${CYAN}📁 환경변수 로드 중...${NC}"
    export $(grep "^VM_API_TOKEN=" .env.local | xargs)
    if [ ! -z "$VM_API_TOKEN" ]; then
        echo -e "${GREEN}✅ VM_API_TOKEN 로드됨${NC}"
    fi
fi

# API 토큰 확인
if [ -z "$VM_API_TOKEN" ]; then
    echo -e "${RED}❌ VM_API_TOKEN 환경변수가 설정되지 않았습니다.${NC}"
    echo -e "${YELLOW}💡 .env.local 파일에 VM_API_TOKEN=[토큰] 을 추가하세요.${NC}"
    echo ""
    echo -e "${CYAN}🔑 토큰 설정 방법:${NC}"
    echo "  1. .env.local 파일을 열거나 생성"
    echo "  2. 다음 줄 추가: VM_API_TOKEN=your_token_here"
    echo "  3. 파일 저장 후 다시 실행"
    exit 1
fi

# Node.js 클라이언트 실행
CLIENT_SCRIPT="scripts/vm-api-client.js"
if [ ! -f "$CLIENT_SCRIPT" ]; then
    echo -e "${RED}❌ $CLIENT_SCRIPT 파일을 찾을 수 없습니다.${NC}"
    echo -e "${YELLOW}💡 프로젝트 루트 디렉토리에서 실행하세요.${NC}"
    exit 1
fi

echo -e "${GREEN}🚀 VM API 클라이언트 실행: $1${NC}"

node "$CLIENT_SCRIPT" "$@"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 명령 실행 완료${NC}"
else
    echo -e "${RED}❌ VM API 명령 실행 실패${NC}"
    exit 1
fi