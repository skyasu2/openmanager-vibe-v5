#!/bin/bash

# 스크립트 중복 및 정리 작업
# 실행 전 반드시 백업을 권장합니다!

echo "🧹 스크립트 정리 시작..."
echo "================================"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 백업 디렉토리 생성
BACKUP_DIR="scripts/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📦 백업 디렉토리: $BACKUP_DIR${NC}"

# 1. 중복 MCP 설정 스크립트 정리
echo -e "\n${GREEN}1. MCP 설정 스크립트 정리${NC}"
echo "- setup-mcp-env.sh: 기본 MCP 환경 설정 (유지)"
echo "- setup-mcp-env-wsl.sh: WSL 전용 대화형 설정 (유지)"
echo "- setup-mcp-wsl.sh: 중복 (삭제 예정)"
echo "- setup-mcp-wsl-final.sh: 중복 (삭제 예정)"

read -p "MCP 중복 스크립트를 정리하시겠습니까? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp scripts/setup-mcp-wsl.sh "$BACKUP_DIR/"
    cp scripts/setup-mcp-wsl-final.sh "$BACKUP_DIR/"
    rm -f scripts/setup-mcp-wsl.sh
    rm -f scripts/setup-mcp-wsl-final.sh
    echo -e "${GREEN}✅ MCP 중복 스크립트 정리 완료${NC}"
fi

# 2. Vercel 환경 설정 스크립트 정리
echo -e "\n${GREEN}2. Vercel 환경 설정 스크립트 정리${NC}"
echo "- setup-vercel-env.sh: 대화형 설정 (유지)"
echo "- vercel-env-setup.sh: 자동화 설정 (유지)"

# 3. Git 관련 스크립트 정리
echo -e "\n${GREEN}3. Git 관련 스크립트 정리${NC}"
echo "- git-push-helper.sh: 암호화 토큰 사용 (문제: decrypt-single-var.mjs 없음)"
echo "- git-push-safe.sh: 환경변수 사용 (유지)"

read -p "git-push-helper.sh를 삭제하시겠습니까? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp scripts/git-push-helper.sh "$BACKUP_DIR/"
    rm -f scripts/git-push-helper.sh
    echo -e "${GREEN}✅ git-push-helper.sh 삭제 완료${NC}"
fi

# 4. 문서 관련 스크립트 정리
echo -e "\n${GREEN}4. 문서 관련 스크립트 정리${NC}"
echo "- docs-reorganize.sh vs docs/reorganize.sh: 중복"

read -p "docs-reorganize.sh를 삭제하시겠습니까? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp scripts/docs-reorganize.sh "$BACKUP_DIR/"
    rm -f scripts/docs-reorganize.sh
    echo -e "${GREEN}✅ docs-reorganize.sh 삭제 완료${NC}"
fi

# 5. 오래된/사용하지 않는 스크립트 확인
echo -e "\n${GREEN}5. 오래되거나 사용하지 않는 스크립트${NC}"

# 90일 이상 수정되지 않은 스크립트 찾기
echo -e "${YELLOW}90일 이상 수정되지 않은 스크립트:${NC}"
find scripts -name "*.sh" -type f -mtime +90 -exec ls -la {} \; | head -10

# 6. 보안 문제가 있는 스크립트
echo -e "\n${RED}6. 보안 문제가 있는 스크립트${NC}"
echo "다음 스크립트들에 하드코딩된 값이나 플레이스홀더가 있습니다:"
echo "- setup-mcp-env.sh: 'your_supabase_url_here', 'SENSITIVE_INFO_REMOVED'"
echo "- fix-mcp-servers.sh: 하드코딩된 URL 포함"

# 7. 정리 결과 요약
echo -e "\n${GREEN}========== 정리 요약 ==========${NC}"
echo "백업 위치: $BACKUP_DIR"
echo ""
echo "권장 정리 작업:"
echo "1. MCP 중복 스크립트 2개 삭제"
echo "2. git-push-helper.sh 삭제 (의존성 없음)"
echo "3. docs-reorganize.sh 삭제 (중복)"
echo "4. 하드코딩된 값이 있는 스크립트 수정 필요"
echo ""
echo -e "${YELLOW}⚠️  주의: 백업된 파일은 30일 후 삭제하세요${NC}"