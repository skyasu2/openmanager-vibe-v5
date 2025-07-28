#!/bin/bash
# 문서 백업 스크립트
# 실행: bash scripts/docs-backup.sh

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 현재 날짜
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H%M%S)

# 백업 디렉토리
BACKUP_DIR="docs/backup-${DATE}-${TIME}"

echo -e "${GREEN}📦 문서 백업 시작...${NC}"

# 백업 디렉토리 생성
mkdir -p "${BACKUP_DIR}"

# 모든 .md 파일 백업
echo -e "${YELLOW}📄 Markdown 파일 백업 중...${NC}"
find docs -name "*.md" -type f | while read -r file; do
    # 백업 디렉토리 자체는 제외
    if [[ ! "$file" =~ backup- ]]; then
        dir=$(dirname "$file")
        mkdir -p "${BACKUP_DIR}/${dir#docs/}"
        cp "$file" "${BACKUP_DIR}/${file#docs/}"
    fi
done

# 백업 정보 파일 생성
cat > "${BACKUP_DIR}/backup-info.txt" << EOF
백업 날짜: ${DATE} ${TIME}
백업 파일 수: $(find "${BACKUP_DIR}" -name "*.md" -type f | wc -l)
백업 크기: $(du -sh "${BACKUP_DIR}" | cut -f1)
백업 이유: JBGE 원칙에 따른 문서 정리 전 백업
EOF

# 백업 검증
ORIGINAL_COUNT=$(find docs -name "*.md" -type f | grep -v backup- | wc -l)
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "*.md" -type f | wc -l)

if [ "$ORIGINAL_COUNT" -eq "$BACKUP_COUNT" ]; then
    echo -e "${GREEN}✅ 백업 완료!${NC}"
    echo -e "  - 원본 파일: ${ORIGINAL_COUNT}개"
    echo -e "  - 백업 파일: ${BACKUP_COUNT}개"
    echo -e "  - 백업 위치: ${BACKUP_DIR}"
else
    echo -e "${RED}❌ 백업 검증 실패!${NC}"
    echo -e "  - 원본 파일: ${ORIGINAL_COUNT}개"
    echo -e "  - 백업 파일: ${BACKUP_COUNT}개"
    exit 1
fi

# 백업 압축 (선택사항)
read -p "백업을 압축하시겠습니까? (y/N): " compress
if [ "$compress" = "y" ] || [ "$compress" = "Y" ]; then
    echo -e "${YELLOW}🗜️  백업 압축 중...${NC}"
    tar -czf "${BACKUP_DIR}.tar.gz" -C docs "backup-${DATE}-${TIME}"
    echo -e "${GREEN}✅ 압축 완료: ${BACKUP_DIR}.tar.gz${NC}"
fi

echo -e "${GREEN}📦 백업 작업 완료!${NC}"