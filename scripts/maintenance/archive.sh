#!/bin/bash
# JBGE 자동 아카이브 스크립트
# 30일 이상 미사용 문서를 자동으로 아카이브합니다.

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 설정
DAYS_THRESHOLD=30
DOCS_DIR="docs"
ARCHIVE_BASE="docs/archive"
ESSENTIAL_DOCS_FILE=".jbge-essential-docs"
DATE=$(date +%Y-%m)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 아카이브 디렉토리 생성
ARCHIVE_DIR="$ARCHIVE_BASE/$DATE"
mkdir -p "$ARCHIVE_DIR"

echo -e "${BLUE}🗄️  JBGE 자동 아카이브 시작...${NC}"
echo "================================"
echo "기준: ${DAYS_THRESHOLD}일 이상 미사용 문서"
echo "제외: 핵심 문서 (${ESSENTIAL_DOCS_FILE})"
echo ""

# 핵심 문서 목록 생성 (없으면)
if [ ! -f "$ESSENTIAL_DOCS_FILE" ]; then
    cat > "$ESSENTIAL_DOCS_FILE" << EOF
# JBGE 핵심 문서 목록 (아카이브 제외)
README.md
CHANGELOG.md
CLAUDE.md
docs/project-overview.md
docs/api-reference.md
docs/setup-guide.md
docs/troubleshooting.md
docs/architecture.md
EOF
    echo -e "${YELLOW}📄 핵심 문서 목록 생성: $ESSENTIAL_DOCS_FILE${NC}"
fi

# 아카이브 대상 찾기
archive_count=0
skipped_count=0

echo -e "\n${YELLOW}🔍 아카이브 대상 검색 중...${NC}"

# find 명령으로 오래된 파일 찾기 (Git 추적 파일만)
while IFS= read -r file; do
    # Git에서 추적하는 파일인지 확인
    if git ls-files --error-unmatch "$file" > /dev/null 2>&1; then
        # 핵심 문서인지 확인
        if grep -qF "$file" "$ESSENTIAL_DOCS_FILE"; then
            echo -e "  ${GREEN}[유지]${NC} $file (핵심 문서)"
            ((skipped_count++))
        else
            # 파일 아카이브
            rel_path=$(dirname "$file" | sed "s|^$DOCS_DIR/||")
            if [ "$rel_path" != "." ]; then
                mkdir -p "$ARCHIVE_DIR/$rel_path"
            fi
            
            mv "$file" "$ARCHIVE_DIR/$rel_path/"
            echo -e "  ${YELLOW}[아카이브]${NC} $file → $ARCHIVE_DIR/$rel_path/"
            ((archive_count++))
        fi
    fi
done < <(find "$DOCS_DIR" -name "*.md" -type f -atime +$DAYS_THRESHOLD 2>/dev/null | grep -v "/archive/" | grep -v "/reports/")

# 아카이브 인덱스 생성
if [ $archive_count -gt 0 ]; then
    INDEX_FILE="$ARCHIVE_DIR/index.md"
    cat > "$INDEX_FILE" << EOF
# 아카이브 인덱스 - $DATE

**아카이브 일시**: $(date '+%Y-%m-%d %H:%M:%S')  
**아카이브 기준**: ${DAYS_THRESHOLD}일 이상 미사용  
**아카이브 문서 수**: ${archive_count}개

## 아카이브된 문서 목록

EOF
    
    # 아카이브된 파일 목록 추가
    find "$ARCHIVE_DIR" -name "*.md" -type f ! -name "index.md" | sort | while read -r file; do
        rel_file=$(echo "$file" | sed "s|$ARCHIVE_DIR/||")
        echo "- $rel_file" >> "$INDEX_FILE"
    done
    
    echo -e "\n${GREEN}✅ 아카이브 인덱스 생성: $INDEX_FILE${NC}"
fi

# 빈 디렉토리 정리
find "$DOCS_DIR" -type d -empty -delete 2>/dev/null || true

# 결과 요약
echo -e "\n${BLUE}📊 아카이브 완료 요약${NC}"
echo "========================"
echo -e "아카이브된 문서: ${YELLOW}${archive_count}개${NC}"
echo -e "유지된 핵심 문서: ${GREEN}${skipped_count}개${NC}"
echo -e "아카이브 위치: ${BLUE}$ARCHIVE_DIR${NC}"

# 로그 파일 생성
LOG_FILE="$ARCHIVE_BASE/archive-log.txt"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 아카이브 실행: ${archive_count}개 문서 이동" >> "$LOG_FILE"

echo -e "\n${GREEN}✅ JBGE 자동 아카이브 완료!${NC}"