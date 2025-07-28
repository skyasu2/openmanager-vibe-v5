#!/bin/bash

# 월간 문서 검토 및 아카이빙 자동화 스크립트
# 2025-01-28
# 매월 1일 실행 권장 (cron: 0 0 1 * * /path/to/monthly-review.sh)

set -euo pipefail

# 설정
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
DOCS_DIR="$PROJECT_ROOT/docs"
ARCHIVE_DIR="$DOCS_DIR/archive"
DAYS_THRESHOLD=30  # 30일 이상 미수정 문서 아카이빙
REPORT_FILE="$DOCS_DIR/reports/monthly-review-$(date +%Y-%m).md"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 로그 함수
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# 리포트 디렉토리 생성
mkdir -p "$(dirname "$REPORT_FILE")"
mkdir -p "$ARCHIVE_DIR/$(date +%Y-%m)"

# 리포트 헤더 작성
cat > "$REPORT_FILE" << EOF
# 월간 문서 검토 리포트

*생성일: $(date '+%Y년 %m월 %d일 %H:%M')*

## 요약

- 검토 기간: $(date -d '1 month ago' '+%Y-%m') ~ $(date '+%Y-%m')
- 총 문서 수: $(find "$DOCS_DIR" -name "*.md" -type f | wc -l)개
- 아카이빙 대상: $DAYS_THRESHOLD일 이상 미수정 문서

EOF

# 1. 오래된 문서 찾기
log "오래된 문서 검색 중..."

echo "## 아카이빙 대상 문서" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

archived_count=0
while IFS= read -r file; do
    # 파일 수정 시간 확인
    last_modified=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null)
    current_time=$(date +%s)
    days_old=$(( (current_time - last_modified) / 86400 ))
    
    if [ $days_old -gt $DAYS_THRESHOLD ]; then
        relative_path="${file#$DOCS_DIR/}"
        
        # 보호 대상 파일 체크
        if [[ "$relative_path" =~ ^(README\.md|guides/|reference/|api/) ]]; then
            echo "- [보호됨] $relative_path (${days_old}일)" >> "$REPORT_FILE"
            continue
        fi
        
        # 아카이빙 실행
        archive_path="$ARCHIVE_DIR/$(date +%Y-%m)/$relative_path"
        mkdir -p "$(dirname "$archive_path")"
        
        if mv "$file" "$archive_path" 2>/dev/null; then
            echo "- [아카이빙] $relative_path (${days_old}일) → archive/$(date +%Y-%m)/" >> "$REPORT_FILE"
            ((archived_count++))
        else
            echo "- [실패] $relative_path (${days_old}일)" >> "$REPORT_FILE"
        fi
    fi
done < <(find "$DOCS_DIR" -name "*.md" -type f -not -path "$ARCHIVE_DIR/*")

echo "" >> "$REPORT_FILE"
echo "아카이빙된 문서: $archived_count개" >> "$REPORT_FILE"

# 2. 깨진 링크 검사
log "깨진 링크 검사 중..."

echo "" >> "$REPORT_FILE"
echo "## 깨진 링크 검사" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

broken_links=0
while IFS= read -r file; do
    while IFS= read -r link; do
        # 링크 추출
        url=$(echo "$link" | sed -E 's/\[([^]]+)\]\(([^)]+)\)/\2/')
        
        # 상대 경로 링크 검증
        if [[ "$url" =~ ^\.\.?/ ]]; then
            target_dir=$(dirname "$file")
            target_path=$(cd "$target_dir" && realpath "$url" 2>/dev/null || echo "")
            
            if [ -z "$target_path" ] || [ ! -f "$target_path" ]; then
                echo "- $(basename "$file"): $url" >> "$REPORT_FILE"
                ((broken_links++))
            fi
        fi
    done < <(grep -Eo '\[([^]]+)\]\(([^)]+)\)' "$file" 2>/dev/null || true)
done < <(find "$DOCS_DIR" -name "*.md" -type f -not -path "$ARCHIVE_DIR/*")

echo "" >> "$REPORT_FILE"
echo "깨진 링크 수: $broken_links개" >> "$REPORT_FILE"

# 3. 중복 문서 검사
log "중복 문서 검사 중..."

echo "" >> "$REPORT_FILE"
echo "## 중복 의심 문서" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# MD5 해시로 완전 중복 찾기
declare -A md5_map
duplicate_groups=0

while IFS= read -r file; do
    hash=$(md5sum "$file" | cut -d' ' -f1)
    if [ -n "${md5_map[$hash]:-}" ]; then
        echo "- $(basename "$file") == $(basename "${md5_map[$hash]}")" >> "$REPORT_FILE"
        ((duplicate_groups++))
    else
        md5_map[$hash]="$file"
    fi
done < <(find "$DOCS_DIR" -name "*.md" -type f -not -path "$ARCHIVE_DIR/*")

echo "" >> "$REPORT_FILE"
echo "중복 그룹 수: $duplicate_groups개" >> "$REPORT_FILE"

# 4. 문서 통계
log "문서 통계 생성 중..."

echo "" >> "$REPORT_FILE"
echo "## 문서 통계" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 카테고리별 통계
echo "### 카테고리별 문서 수" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

for dir in "$DOCS_DIR"/*/; do
    if [ -d "$dir" ] && [[ ! "$dir" =~ archive ]]; then
        dir_name=$(basename "$dir")
        doc_count=$(find "$dir" -name "*.md" -type f | wc -l)
        echo "- $dir_name: $doc_count개" >> "$REPORT_FILE"
    fi
done

# 최근 수정된 문서 TOP 10
echo "" >> "$REPORT_FILE"
echo "### 최근 수정된 문서 (TOP 10)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

find "$DOCS_DIR" -name "*.md" -type f -not -path "$ARCHIVE_DIR/*" -exec stat -c "%Y %n" {} \; | \
    sort -rn | head -10 | while read -r timestamp filepath; do
    modified_date=$(date -d "@$timestamp" '+%Y-%m-%d')
    relative_path="${filepath#$DOCS_DIR/}"
    echo "- [$modified_date] $relative_path" >> "$REPORT_FILE"
done

# 5. 권장 조치사항
log "권장 조치사항 생성 중..."

echo "" >> "$REPORT_FILE"
echo "## 권장 조치사항" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ $broken_links -gt 0 ]; then
    echo "1. **깨진 링크 수정**: $broken_links개의 깨진 링크를 수정해주세요." >> "$REPORT_FILE"
fi

if [ $duplicate_groups -gt 0 ]; then
    echo "2. **중복 문서 통합**: $duplicate_groups개의 중복 문서를 통합하는 것을 권장합니다." >> "$REPORT_FILE"
fi

if [ $archived_count -gt 10 ]; then
    echo "3. **문서 업데이트**: 많은 문서가 오래되었습니다. 정기적인 업데이트가 필요합니다." >> "$REPORT_FILE"
fi

# 자동 생성 문서 목록
echo "" >> "$REPORT_FILE"
echo "### 자동 생성 권장 문서" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 필수 문서 체크
required_docs=(
    "getting-started/README.md"
    "guides/development/README.md"
    "api/README.md"
    "troubleshooting/README.md"
)

for doc in "${required_docs[@]}"; do
    if [ ! -f "$DOCS_DIR/$doc" ]; then
        echo "- [ ] $doc (필수)" >> "$REPORT_FILE"
    fi
done

# 6. 다음 단계
echo "" >> "$REPORT_FILE"
echo "## 다음 단계" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. 이 리포트 검토: $REPORT_FILE" >> "$REPORT_FILE"
echo "2. 깨진 링크 수정 실행: \`./scripts/docs/fix-broken-links.sh\`" >> "$REPORT_FILE"
echo "3. 중복 문서 통합 실행: \`./scripts/docs/merge-duplicates.sh\`" >> "$REPORT_FILE"
echo "4. 인덱스 재생성: \`./scripts/docs/generate-index.sh\`" >> "$REPORT_FILE"

# 실행 완료
log "월간 문서 검토 완료!"
echo ""
echo -e "${CYAN}=== 월간 문서 검토 결과 ===${NC}"
echo -e "아카이빙된 문서: ${YELLOW}$archived_count개${NC}"
echo -e "깨진 링크: ${RED}$broken_links개${NC}"
echo -e "중복 문서: ${YELLOW}$duplicate_groups개${NC}"
echo ""
echo -e "상세 리포트: ${BLUE}$REPORT_FILE${NC}"

# 슬랙/이메일 알림 (옵션)
if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -d "{
            \"text\": \"📚 월간 문서 검토 완료\",
            \"attachments\": [{
                \"color\": \"good\",
                \"fields\": [
                    {\"title\": \"아카이빙\", \"value\": \"$archived_count개\", \"short\": true},
                    {\"title\": \"깨진 링크\", \"value\": \"$broken_links개\", \"short\": true},
                    {\"title\": \"중복 문서\", \"value\": \"$duplicate_groups개\", \"short\": true}
                ]
            }]
        }"
fi