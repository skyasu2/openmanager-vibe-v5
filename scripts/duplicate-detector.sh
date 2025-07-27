#!/bin/bash
# 중복 코드 탐지 스크립트
# DRY 원칙 위반을 찾아 리팩토링 기회 식별

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 설정
SRC_DIR="src"
REPORTS_DIR="docs/reports/code-quality"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 임계값
DUPLICATION_THRESHOLD=5  # 5% 이상이면 경고
MIN_LINES=10            # 최소 10줄 이상 중복
MIN_TOKENS=50           # 최소 50 토큰 이상

echo -e "${BLUE}🔍 중복 코드 탐지 시작...${NC}"
echo "================================"
echo "대상 디렉토리: $SRC_DIR"
echo "중복 임계값: ${DUPLICATION_THRESHOLD}%"
echo ""

# 리포트 디렉토리 생성
mkdir -p "$REPORTS_DIR"

# 1. 파일별 중복 검사
echo -e "\n${YELLOW}1️⃣ 파일별 중복 패턴 분석${NC}"
echo "-------------------------"

# 중복 가능성이 높은 패턴 검색
declare -A duplicate_patterns
duplicate_count=0

# 함수 시그니처 중복 검사
echo "함수 시그니처 검사 중..."
while IFS= read -r line; do
    # 함수명과 위치 추출
    func_name=$(echo "$line" | grep -oP '(function|const|async)\s+\K\w+(?=\s*[<(])')
    file=$(echo "$line" | cut -d: -f1)
    
    if [ -n "$func_name" ]; then
        if [ -n "${duplicate_patterns[$func_name]}" ]; then
            echo -e "${RED}[중복 함수]${NC} $func_name"
            echo "  - ${duplicate_patterns[$func_name]}"
            echo "  - $file"
            ((duplicate_count++))
        else
            duplicate_patterns[$func_name]="$file"
        fi
    fi
done < <(grep -r "^\s*\(export\s\+\)\?\(async\s\+\)\?\(function\|const\)" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null || true)

echo -e "중복 함수 발견: ${duplicate_count}개"

# 2. 코드 블록 중복 검사
echo -e "\n${YELLOW}2️⃣ 코드 블록 중복 검사${NC}"
echo "---------------------"

# 유사한 코드 블록 찾기 (MD5 해시 사용)
declare -A code_hashes
block_duplicates=0

# TypeScript/React 파일에서 코드 블록 추출
find "$SRC_DIR" -name "*.ts" -o -name "*.tsx" | while read -r file; do
    # 함수 본문 추출 (간단한 버전)
    awk '/^[[:space:]]*(export[[:space:]]+)?(async[[:space:]]+)?(function|const)[[:space:]]+[a-zA-Z_][a-zA-Z0-9_]*[[:space:]]*\(/ {
        in_func=1
        brace_count=0
        func_body=""
    }
    in_func {
        func_body = func_body $0 "\n"
        gsub(/{/, "", $0)
        gsub(/}/, "", $0)
        brace_count += gsub(/{/, "", $0) - gsub(/}/, "", $0)
        if (brace_count == 0 && /}/) {
            # 공백과 주석 제거 후 해시
            gsub(/\/\/.*$/, "", func_body)
            gsub(/\/\*.*\*\//, "", func_body)
            gsub(/[[:space:]]+/, " ", func_body)
            print func_body
            in_func=0
        }
    }' "$file" | while read -r func_body; do
        if [ ${#func_body} -gt 100 ]; then  # 100자 이상만 검사
            hash=$(echo "$func_body" | md5sum | cut -d' ' -f1)
            
            if [ -n "${code_hashes[$hash]}" ]; then
                echo -e "${RED}[중복 코드 블록]${NC}"
                echo "  - ${code_hashes[$hash]}"
                echo "  - $file"
                ((block_duplicates++))
            else
                code_hashes[$hash]="$file"
            fi
        fi
    done
done

# 3. 상수/리터럴 중복 검사
echo -e "\n${YELLOW}3️⃣ 하드코딩된 값 중복 검사${NC}"
echo "-------------------------"

# 매직 넘버와 문자열 리터럴 검사
magic_numbers=0
duplicate_strings=0

# 숫자 리터럴 (3자리 이상)
echo "매직 넘버 검사 중..."
grep -r "[^0-9]\([0-9]\{3,\}\)[^0-9]" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | \
    grep -v "test\|spec\|mock" | \
    awk -F: '{print $NF}' | \
    sort | uniq -c | sort -rn | \
    while read count number; do
        if [ $count -gt 2 ]; then
            echo -e "${YELLOW}[반복된 숫자]${NC} $number (${count}회)"
            ((magic_numbers++))
        fi
    done

# 문자열 리터럴 (10자 이상)
echo "중복 문자열 검사 중..."
grep -r "['\"]\([^'\"]\{10,\}\)['\"]" "$SRC_DIR" --include="*.ts" --include="*.tsx" 2>/dev/null | \
    grep -v "test\|spec\|mock" | \
    awk -F"['\"]" '{for(i=2;i<=NF;i+=2) if(length($i)>10) print $i}' | \
    sort | uniq -c | sort -rn | \
    while read count string; do
        if [ $count -gt 2 ]; then
            echo -e "${YELLOW}[반복된 문자열]${NC} \"${string:0:30}...\" (${count}회)"
            ((duplicate_strings++))
        fi
    done

# 4. 복사-붙여넣기 패턴 검사
echo -e "\n${YELLOW}4️⃣ 복사-붙여넣기 패턴 검사${NC}"
echo "---------------------------"

# 연속된 유사한 코드 라인 검사
copy_paste_patterns=0

find "$SRC_DIR" -name "*.ts" -o -name "*.tsx" | while read -r file; do
    # 연속된 유사한 패턴 찾기
    awk '
    {
        # 현재 라인을 정규화
        normalized = $0
        gsub(/[[:space:]]+/, " ", normalized)
        gsub(/['"][^'"]*['"]/, "STRING", normalized)
        gsub(/[0-9]+/, "NUMBER", normalized)
        
        if (prev_pattern == normalized && NR - prev_line == 1) {
            consecutive++
            if (consecutive == 3) {
                print FILENAME ":" prev_line_start ": 연속된 유사 패턴 시작"
            }
        } else {
            if (consecutive >= 3) {
                print FILENAME ":" prev_line ": 연속된 유사 패턴 종료 (" consecutive "줄)"
            }
            consecutive = 1
            prev_line_start = NR
        }
        
        prev_pattern = normalized
        prev_line = NR
    }
    END {
        if (consecutive >= 3) {
            print FILENAME ":" prev_line ": 연속된 유사 패턴 종료 (" consecutive "줄)"
        }
    }' "$file" | while read -r pattern; do
        if [[ $pattern == *"연속된 유사 패턴"* ]]; then
            echo -e "${YELLOW}[복사-붙여넣기]${NC} $pattern"
            ((copy_paste_patterns++))
        fi
    done
done

# 5. 종합 리포트 생성
echo -e "\n${YELLOW}5️⃣ 종합 리포트 생성${NC}"
echo "------------------"

REPORT_FILE="$REPORTS_DIR/duplication-report-$TIMESTAMP.md"

cat > "$REPORT_FILE" << EOF
# 중복 코드 탐지 리포트

**생성일**: $DATE  
**대상**: \`$SRC_DIR\` 디렉토리  
**DRY 원칙 검사 결과**

## 📊 요약

| 항목 | 발견 수 | 상태 |
|------|---------|------|
| 중복 함수 | ${duplicate_count}개 | $([ $duplicate_count -eq 0 ] && echo "✅ 양호" || echo "⚠️ 개선 필요") |
| 중복 코드 블록 | ${block_duplicates}개 | $([ $block_duplicates -eq 0 ] && echo "✅ 양호" || echo "⚠️ 개선 필요") |
| 매직 넘버 | ${magic_numbers}개 | $([ $magic_numbers -eq 0 ] && echo "✅ 양호" || echo "⚠️ 개선 필요") |
| 중복 문자열 | ${duplicate_strings}개 | $([ $duplicate_strings -eq 0 ] && echo "✅ 양호" || echo "⚠️ 개선 필요") |
| 복사-붙여넣기 | ${copy_paste_patterns}개 | $([ $copy_paste_patterns -eq 0 ] && echo "✅ 양호" || echo "⚠️ 개선 필요") |

## 🎯 개선 권장사항

### 1. 중복 함수 제거
\`\`\`typescript
// 공통 유틸리티로 추출
export const commonUtils = {
  // 중복된 함수들을 여기로 이동
};
\`\`\`

### 2. 상수 파일 생성
\`\`\`typescript
// constants/app.constants.ts
export const APP_CONSTANTS = {
  // 매직 넘버와 반복 문자열을 상수로 정의
};
\`\`\`

### 3. 제네릭/템플릿 활용
\`\`\`typescript
// 유사한 패턴을 제네릭으로 통합
function createGenericHandler<T>(type: string) {
  return (data: T) => {
    // 공통 로직
  };
}
\`\`\`

## 📈 다음 단계

1. 중복 코드 리팩토링 계획 수립
2. 공통 유틸리티 모듈 생성
3. 코드 리뷰 프로세스에 중복 검사 포함
4. 지속적인 모니터링 체계 구축

---
*이 리포트는 code-review-specialist 에이전트에 의해 생성되었습니다.*
EOF

echo -e "${GREEN}✅ 리포트 생성 완료: $REPORT_FILE${NC}"

# 6. 중복률 계산 및 경고
echo -e "\n${BLUE}📊 최종 분석${NC}"
echo "============"

total_issues=$((duplicate_count + block_duplicates + magic_numbers + duplicate_strings + copy_paste_patterns))

if [ $total_issues -eq 0 ]; then
    echo -e "${GREEN}🎉 축하합니다! DRY 원칙이 잘 지켜지고 있습니다.${NC}"
else
    echo -e "${YELLOW}⚠️  총 ${total_issues}개의 중복 이슈 발견${NC}"
    echo "리팩토링을 통해 코드 품질을 개선하세요."
fi

echo -e "\n${GREEN}✅ 중복 코드 탐지 완료!${NC}"