#!/bin/bash

# 🧹 Claude Code WSL 메모리 정리 스크립트
# Node.js 프로세스와 캐시를 정리하여 메모리를 확보합니다.

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      🧹 메모리 정리를 시작합니다...       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
echo ""

# 현재 메모리 상태
echo -e "${YELLOW}📊 현재 메모리 상태:${NC}"
free -h | grep -E "Mem:|Swap:"
echo ""

# 1. Node.js 프로세스 정리
echo -e "${YELLOW}🔄 Node.js 프로세스 정리 중...${NC}"
NODE_COUNT=$(ps aux | grep -E "node|npm" | grep -v grep | wc -l)

if [ "$NODE_COUNT" -gt 0 ]; then
    echo -e "  발견된 Node 프로세스: ${NODE_COUNT}개"
    
    # 개발 서버 확인
    if lsof -i :3000 >/dev/null 2>&1; then
        echo -e "${YELLOW}  ⚠️  개발 서버가 실행 중입니다. 유지합니다.${NC}"
        # 개발 서버를 제외한 다른 Node 프로세스만 종료
        ps aux | grep -E "node|npm" | grep -v grep | grep -v "npm run dev" | awk '{print $2}' | xargs -r kill -9 2>/dev/null
    else
        # 모든 Node 프로세스 종료
        pkill -9 node 2>/dev/null
        pkill -9 npm 2>/dev/null
    fi
    
    echo -e "${GREEN}  ✅ Node.js 프로세스 정리 완료${NC}"
else
    echo -e "${GREEN}  ✅ 정리할 Node 프로세스 없음${NC}"
fi
echo ""

# 2. npm 캐시 정리
echo -e "${YELLOW}🗑️  npm 캐시 정리 중...${NC}"
npm cache verify 2>/dev/null
CACHE_SIZE=$(du -sh ~/.npm 2>/dev/null | cut -f1)
echo -e "  캐시 크기: ${CACHE_SIZE:-0}"

read -p "  npm 캐시를 완전히 정리하시겠습니까? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm cache clean --force
    echo -e "${GREEN}  ✅ npm 캐시 정리 완료${NC}"
else
    echo -e "${YELLOW}  ⏭️  npm 캐시 정리 건너뜀${NC}"
fi
echo ""

# 3. 시스템 캐시 정리
echo -e "${YELLOW}🧹 시스템 캐시 정리 중...${NC}"
# 페이지 캐시만 정리 (안전한 옵션)
sudo sh -c "echo 1 > /proc/sys/vm/drop_caches" 2>/dev/null || {
    echo -e "${YELLOW}  ⚠️  sudo 권한이 필요합니다. 시스템 캐시 정리 건너뜀${NC}"
}
echo -e "${GREEN}  ✅ 시스템 캐시 정리 완료${NC}"
echo ""

# 4. Next.js 캐시 정리
if [ -d ".next" ]; then
    echo -e "${YELLOW}🔄 Next.js 캐시 정리 중...${NC}"
    NEXT_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
    echo -e "  .next 폴더 크기: ${NEXT_SIZE}"
    
    read -p "  .next 캐시를 정리하시겠습니까? (빌드 재수행 필요) (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf .next
        echo -e "${GREEN}  ✅ Next.js 캐시 정리 완료${NC}"
    else
        echo -e "${YELLOW}  ⏭️  Next.js 캐시 정리 건너뜀${NC}"
    fi
    echo ""
fi

# 5. WSL 특정 정리
echo -e "${YELLOW}🐧 WSL 메모리 압축...${NC}"
# WSL2 메모리 압축 트리거
echo 3 | sudo tee /proc/sys/vm/drop_caches > /dev/null 2>&1 || {
    echo -e "${YELLOW}  ⚠️  WSL 메모리 압축 권한 부족${NC}"
}
echo -e "${GREEN}  ✅ WSL 메모리 압축 시도 완료${NC}"
echo ""

# 최종 메모리 상태
echo -e "${BLUE}📊 정리 후 메모리 상태:${NC}"
free -h | grep -E "Mem:|Swap:"
echo ""

# 메모리 사용량 계산
MEMORY_PERCENT=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
FREE_MEMORY=$(free -h | grep Mem | awk '{print $4}')

if [ "$MEMORY_PERCENT" -lt 70 ]; then
    echo -e "${GREEN}✅ 메모리 상태 양호: ${FREE_MEMORY} 사용 가능${NC}"
elif [ "$MEMORY_PERCENT" -lt 85 ]; then
    echo -e "${YELLOW}⚠️  메모리 사용률 높음: ${FREE_MEMORY} 사용 가능${NC}"
else
    echo -e "${RED}❌ 메모리 부족: ${FREE_MEMORY} 사용 가능${NC}"
    echo -e "${YELLOW}추가 권장사항:${NC}"
    echo "  • Windows에서 WSL 재시작: wsl --shutdown"
    echo "  • .wslconfig에서 메모리 할당 증가"
    echo "  • 불필요한 브라우저 탭 닫기"
fi

echo ""
echo -e "${GREEN}🎉 메모리 정리 완료!${NC}"