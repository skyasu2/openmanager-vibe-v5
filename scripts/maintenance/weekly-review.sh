#!/bin/bash
# JBGE 주간 문서 검토 스크립트
# DRY 원칙 적용, 리포트 격리, 핵심 문서 상태 점검

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 설정
DOCS_DIR="docs"
REPORTS_DIR="docs/reports"
ARCHIVE_DIR="docs/archive"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}📋 JBGE 주간 문서 검토 시작...${NC}"
echo "================================"
echo "실행일: $DATE"
echo ""

# 디렉토리 준비
mkdir -p "$REPORTS_DIR/performance"
mkdir -p "$REPORTS_DIR/agent-analysis"
mkdir -p "$REPORTS_DIR/daily"

# 1. 중복 내용 검사 (DRY 원칙)
echo -e "\n${YELLOW}1️⃣ DRY 원칙 적용 - 중복 검사${NC}"
echo "--------------------------------"

# 파일 해시 기반 중복 찾기
declare -A file_hashes
duplicate_count=0

while IFS= read -r file; do
    if [ -f "$file" ]; then
        # 파일 내용의 해시 생성 (공백, 빈 줄 제거)
        hash=$(grep -v '^[[:space:]]*$' "$file" | sed 's/^[[:space:]]*//' | md5sum | cut -d' ' -f1)
        
        if [ -n "${file_hashes[$hash]}" ]; then
            echo -e "${RED}[중복 발견]${NC}"
            echo "  원본: ${file_hashes[$hash]}"
            echo "  중복: $file"
            ((duplicate_count++))
        else
            file_hashes[$hash]="$file"
        fi
    fi
done < <(find "$DOCS_DIR" -name "*.md" -type f | grep -v "/archive/" | grep -v "/reports/")

echo -e "중복 파일 발견: ${duplicate_count}개"

# 2. 리포트 문서 격리
echo -e "\n${YELLOW}2️⃣ 리포트 문서 격리${NC}"
echo "-------------------"

report_count=0
# 리포트 패턴 매칭
for pattern in "*-report-*.md" "*-analysis-*.md" "daily-*.md" "performance-*.md"; do
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            # 파일 유형별 분류
            if [[ $file =~ performance ]]; then
                target_dir="$REPORTS_DIR/performance"
            elif [[ $file =~ (agent|analysis) ]]; then
                target_dir="$REPORTS_DIR/agent-analysis"
            elif [[ $file =~ daily ]]; then
                target_dir="$REPORTS_DIR/daily"
            else
                target_dir="$REPORTS_DIR"
            fi
            
            mv "$file" "$target_dir/"
            echo -e "  ${YELLOW}[격리]${NC} $(basename $file) → $target_dir/"
            ((report_count++))
        fi
    done < <(find "$DOCS_DIR" -name "$pattern" -type f 2>/dev/null | grep -v "/reports/" | grep -v "/archive/")
done

echo -e "격리된 리포트: ${report_count}개"

# 3. 핵심 문서 상태 점검
echo -e "\n${YELLOW}3️⃣ 핵심 문서 상태 점검${NC}"
echo "----------------------"

# 핵심 문서 목록
declare -a essential_docs=(
    "docs/project-overview.md"
    "docs/api-reference.md"
    "docs/setup-guide.md"
    "docs/troubleshooting.md"
    "docs/architecture.md"
)

missing_count=0
outdated_count=0

for doc in "${essential_docs[@]}"; do
    if [ -f "$doc" ]; then
        # 최종 수정일 확인
        last_modified=$(stat -c %Y "$doc" 2>/dev/null || stat -f %m "$doc" 2>/dev/null)
        current_time=$(date +%s)
        days_old=$(( (current_time - last_modified) / 86400 ))
        
        if [ $days_old -gt 14 ]; then
            echo -e "  ${YELLOW}⚠️  $doc${NC} - ${days_old}일 전 수정 (갱신 필요)"
            ((outdated_count++))
        else
            echo -e "  ${GREEN}✅ $doc${NC} - ${days_old}일 전 수정"
        fi
    else
        echo -e "  ${RED}❌ $doc${NC} - 파일 없음!"
        ((missing_count++))
    fi
done

# 4. JBGE 보고서 생성
echo -e "\n${YELLOW}4️⃣ JBGE 보고서 생성${NC}"
echo "------------------"

REPORT_FILE="$REPORTS_DIR/jbge-weekly-$TIMESTAMP.md"

cat > "$REPORT_FILE" << EOF
# JBGE 주간 문서 검토 보고서

**생성일**: $DATE  
**검토 기준**: Just Barely Good Enough 원칙

## 📊 검토 결과 요약

### DRY 원칙 검사
- 중복 파일 발견: ${duplicate_count}개
- 조치 필요: 중복 파일 통합

### 리포트 격리
- 격리된 리포트: ${report_count}개
- 위치: \`$REPORTS_DIR\`

### 핵심 문서 상태
- 누락된 문서: ${missing_count}개
- 갱신 필요 문서: ${outdated_count}개 (14일 이상)

## 🎯 권장 조치

EOF

# 권장 조치 추가
if [ $duplicate_count -gt 0 ]; then
    echo "### 중복 제거 필요" >> "$REPORT_FILE"
    echo "다음 명령으로 중복 파일을 확인하고 통합하세요:" >> "$REPORT_FILE"
    echo "\`\`\`bash" >> "$REPORT_FILE"
    echo "./scripts/merge-duplicates.sh" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

if [ $missing_count -gt 0 ]; then
    echo "### 핵심 문서 복구 필요" >> "$REPORT_FILE"
    echo "누락된 핵심 문서를 즉시 생성하거나 복구하세요." >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

if [ $outdated_count -gt 0 ]; then
    echo "### 문서 갱신 필요" >> "$REPORT_FILE"
    echo "14일 이상된 문서를 검토하고 최신 정보로 업데이트하세요." >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# 문서 통계 추가
total_docs=$(find "$DOCS_DIR" -name "*.md" -type f | grep -v "/archive/" | grep -v "/reports/" | wc -l)
echo "" >> "$REPORT_FILE"
echo "## 📈 문서 통계" >> "$REPORT_FILE"
echo "- 활성 문서 수: ${total_docs}개" >> "$REPORT_FILE"
echo "- 권장 최대 개수: 6개" >> "$REPORT_FILE"

if [ $total_docs -gt 6 ]; then
    echo "- **경고**: 문서가 너무 많습니다! JBGE 정리가 필요합니다." >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "*JBGE 원칙: 딱 필요한 만큼만 문서화*" >> "$REPORT_FILE"

echo -e "${GREEN}✅ 보고서 생성 완료: $REPORT_FILE${NC}"

# 5. 7일 이상된 리포트 삭제
echo -e "\n${YELLOW}5️⃣ 오래된 리포트 정리${NC}"
echo "--------------------"

deleted_count=$(find "$REPORTS_DIR" -name "*.md" -type f -mtime +7 -delete -print 2>/dev/null | wc -l)
echo -e "삭제된 오래된 리포트: ${deleted_count}개"

# 완료 메시지
echo -e "\n${BLUE}📋 주간 검토 완료 요약${NC}"
echo "====================="
echo -e "중복 발견: ${duplicate_count}개"
echo -e "리포트 격리: ${report_count}개"
echo -e "핵심 문서 누락: ${missing_count}개"
echo -e "갱신 필요: ${outdated_count}개"
echo -e "오래된 리포트 삭제: ${deleted_count}개"
echo ""
echo -e "${GREEN}✅ JBGE 주간 문서 검토 완료!${NC}"