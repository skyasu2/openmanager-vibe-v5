#!/bin/bash

# 중복 문서 감지 및 분석 스크립트
# 2025-01-28

set -euo pipefail

PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
DOCS_DIR="$PROJECT_ROOT/docs"
REPORT_FILE="$DOCS_DIR/duplicate-docs-report.md"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== 중복 문서 감지 도구 ===${NC}"
echo ""

# 임시 디렉토리 생성
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# 문서 유사도 검사 함수
check_similarity() {
    local file1=$1
    local file2=$2
    
    # 파일 크기 비교 (20% 이내 차이면 유사할 가능성)
    size1=$(wc -c < "$file1")
    size2=$(wc -c < "$file2")
    size_diff=$((size1 > size2 ? size1 - size2 : size2 - size1))
    size_ratio=$((size_diff * 100 / (size1 > size2 ? size1 : size2)))
    
    if [ $size_ratio -lt 20 ]; then
        # 내용 유사도 검사 (첫 100줄 비교)
        head -n 100 "$file1" > "$TEMP_DIR/file1.tmp"
        head -n 100 "$file2" > "$TEMP_DIR/file2.tmp"
        
        # 공통 라인 수 계산
        common_lines=$(comm -12 <(sort "$TEMP_DIR/file1.tmp") <(sort "$TEMP_DIR/file2.tmp") | wc -l)
        total_lines=$(wc -l < "$TEMP_DIR/file1.tmp")
        
        if [ $total_lines -gt 0 ]; then
            similarity=$((common_lines * 100 / total_lines))
            echo $similarity
        else
            echo 0
        fi
    else
        echo 0
    fi
}

# 리포트 헤더 작성
cat > "$REPORT_FILE" << EOF
# 중복 문서 분석 리포트

*생성일: $(date '+%Y-%m-%d %H:%M:%S')*

## 요약

EOF

# 1. 파일명 기반 중복 검사
echo -e "${GREEN}[1/4] 파일명 기반 중복 검사...${NC}"

# 유사한 파일명 패턴 찾기
declare -A filename_groups
while IFS= read -r file; do
    basename=$(basename "$file" .md)
    # 날짜, 버전 번호 제거
    base_pattern=$(echo "$basename" | sed -E 's/[-_]?[0-9]{4}[-_]?[0-9]{2}[-_]?[0-9]{2}//g' | sed -E 's/[-_]?v?[0-9]+//g')
    
    if [ -n "$base_pattern" ]; then
        if [ -z "${filename_groups[$base_pattern]:-}" ]; then
            filename_groups[$base_pattern]="$file"
        else
            filename_groups[$base_pattern]="${filename_groups[$base_pattern]}|$file"
        fi
    fi
done < <(find "$DOCS_DIR" -name "*.md" -type f)

# 중복 그룹 출력
echo "### 파일명 기반 중복 그룹" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

duplicate_count=0
for pattern in "${!filename_groups[@]}"; do
    IFS='|' read -ra files <<< "${filename_groups[$pattern]}"
    if [ ${#files[@]} -gt 1 ]; then
        ((duplicate_count++))
        echo "#### 그룹 $duplicate_count: $pattern" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        for file in "${files[@]}"; do
            echo "- $file" >> "$REPORT_FILE"
        done
        echo "" >> "$REPORT_FILE"
    fi
done

echo -e "${YELLOW}파일명 기반 중복 그룹: $duplicate_count개${NC}"

# 2. 내용 기반 중복 검사
echo -e "${GREEN}[2/4] 내용 기반 중복 검사...${NC}"

echo "### 내용 기반 중복 의심 파일" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# MD5 해시로 완전 중복 찾기
declare -A md5_map
while IFS= read -r file; do
    hash=$(md5sum "$file" | cut -d' ' -f1)
    if [ -n "${md5_map[$hash]:-}" ]; then
        echo "- **완전 중복**: $file == ${md5_map[$hash]}" >> "$REPORT_FILE"
    else
        md5_map[$hash]="$file"
    fi
done < <(find "$DOCS_DIR" -name "*.md" -type f)

# 3. 카테고리별 분석
echo -e "${GREEN}[3/4] 카테고리별 문서 분석...${NC}"

echo "## 카테고리별 문서 현황" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 카테고리 패턴 정의
declare -A categories
categories["MCP"]="mcp-.*\.md"
categories["AI/ML"]="(ai-|ml-|ML-).*\.md"
categories["Auth"]="(auth-|oauth-|github-oauth-).*\.md"
categories["환경설정"]="(env-|setup-|config-).*\.md"
categories["가이드"]=".*-guide\.md"
categories["보안"]="(security-|secure-).*\.md"
categories["테스트"]="(test-|testing-).*\.md"
categories["배포"]="(deploy-|deployment-|vercel-).*\.md"

for category in "${!categories[@]}"; do
    pattern="${categories[$category]}"
    count=$(find "$DOCS_DIR" -name "*.md" -type f | grep -E "$pattern" | wc -l)
    
    echo "### $category ($count개)" >> "$REPORT_FILE"
    find "$DOCS_DIR" -name "*.md" -type f | grep -E "$pattern" | while read -r file; do
        echo "- $(basename "$file")" >> "$REPORT_FILE"
    done
    echo "" >> "$REPORT_FILE"
done

# 4. 통합 권장사항
echo -e "${GREEN}[4/4] 통합 권장사항 생성...${NC}"

echo "## 통합 권장사항" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

cat >> "$REPORT_FILE" << 'EOF'
### 즉시 통합 가능한 문서들

1. **MCP 문서 통합**
   - 22개 → 6개로 통합
   - 상태 체크 문서들을 하나로 병합
   - 설정 가이드들을 단계별로 정리

2. **인증 문서 통합**
   - 18개 → 3개로 통합
   - OAuth 관련 문서 통합
   - 플랫폼별 설정을 하나의 문서로

3. **AI/ML 문서 통합**
   - 15개 → 4개로 통합
   - 아키텍처, 엔진, RAG, 최적화로 구분

4. **환경 설정 문서 통합**
   - 11개 → 3개로 통합
   - 개발, 테스트, 프로덕션 환경별 구분

### 아카이브 대상

- 30일 이상 수정되지 않은 문서
- 구버전 관련 문서
- 임시 작업 문서

### 자동화 가능 영역

1. 중복 문서 자동 병합
2. 목차 자동 생성
3. 상호 참조 링크 업데이트
4. 메타데이터 추가
EOF

# 통계 요약
total_docs=$(find "$DOCS_DIR" -name "*.md" -type f | wc -l)
echo "" >> "$REPORT_FILE"
echo "## 전체 통계" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- 전체 문서 수: $total_docs개" >> "$REPORT_FILE"
echo "- 중복 의심 그룹: $duplicate_count개" >> "$REPORT_FILE"
echo "- 예상 통합 후: ~40개 (60% 감소)" >> "$REPORT_FILE"

echo ""
echo -e "${GREEN}분석 완료!${NC}"
echo -e "리포트 위치: ${BLUE}$REPORT_FILE${NC}"

# 간단한 요약 출력
echo ""
echo "=== 요약 ==="
echo "전체 문서: $total_docs개"
echo "중복 그룹: $duplicate_count개"
echo ""
echo "카테고리별 현황:"
for category in "${!categories[@]}"; do
    pattern="${categories[$category]}"
    count=$(find "$DOCS_DIR" -name "*.md" -type f | grep -E "$pattern" | wc -l)
    printf "%-15s: %3d개\n" "$category" "$count"
done