#!/bin/bash
# God Class 및 난개발 패턴 탐지 스크립트
# 스파게티 코드, 순환 의존성, 높은 복잡도 등을 검사

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 설정
SRC_DIR="src"
REPORTS_DIR="docs/reports/code-quality"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 임계값
MAX_FILE_LINES=500      # 파일당 최대 라인 수
MAX_CLASS_LINES=300     # 클래스당 최대 라인 수
MAX_FUNCTION_LINES=50   # 함수당 최대 라인 수
MAX_METHODS=20          # 클래스당 최대 메서드 수
MAX_COMPLEXITY=10       # 최대 순환 복잡도
MAX_NESTING=4          # 최대 중첩 깊이
MAX_PARAMS=5           # 함수 매개변수 최대 개수

echo -e "${BLUE}🍝 God Class 및 난개발 패턴 탐지 시작...${NC}"
echo "========================================"
echo "대상 디렉토리: $SRC_DIR"
echo ""

# 리포트 디렉토리 생성
mkdir -p "$REPORTS_DIR"

# 결과 저장 변수
god_classes=()
spaghetti_code=()
long_methods=()
deep_nesting=()
too_many_params=()
circular_deps=()

# 1. God Class 탐지
echo -e "\n${YELLOW}1️⃣ God Class 탐지${NC}"
echo "----------------"

find "$SRC_DIR" -name "*.ts" -o -name "*.tsx" | while read -r file; do
    # 파일 크기 확인
    lines=$(wc -l < "$file")
    
    if [ $lines -gt $MAX_FILE_LINES ]; then
        echo -e "${RED}[대형 파일]${NC} $file (${lines}줄)"
        
        # 클래스 분석
        class_count=$(grep -c "^\s*\(export\s\+\)\?class\s" "$file" 2>/dev/null || echo 0)
        method_count=$(grep -c "^\s*\(public\|private\|protected\|static\|async\)\?\s*[a-zA-Z_][a-zA-Z0-9_]*\s*(" "$file" 2>/dev/null || echo 0)
        import_count=$(grep -c "^import" "$file" 2>/dev/null || echo 0)
        
        if [ $method_count -gt $MAX_METHODS ] || [ $import_count -gt 10 ]; then
            god_classes+=("$file:${lines}줄,${method_count}메서드,${import_count}imports")
            echo -e "  ${PURPLE}→ God Class 의심${NC} (메서드: $method_count, 의존성: $import_count)"
        fi
    fi
done

# 2. 스파게티 코드 탐지
echo -e "\n${YELLOW}2️⃣ 스파게티 코드 탐지${NC}"
echo "-------------------"

find "$SRC_DIR" -name "*.ts" -o -name "*.tsx" | while read -r file; do
    # 중첩 깊이 분석
    max_indent=0
    current_indent=0
    
    while IFS= read -r line; do
        # 들여쓰기 수준 계산
        indent=$(echo "$line" | sed 's/[^ ].*//' | wc -c)
        indent=$((indent / 2))  # 2칸 들여쓰기 기준
        
        if [[ $line == *"{"* ]]; then
            ((current_indent++))
            [ $current_indent -gt $max_indent ] && max_indent=$current_indent
        elif [[ $line == *"}"* ]]; then
            ((current_indent--))
        fi
    done < "$file"
    
    if [ $max_indent -gt $MAX_NESTING ]; then
        echo -e "${RED}[깊은 중첩]${NC} $file (최대 깊이: $max_indent)"
        deep_nesting+=("$file:깊이_${max_indent}")
    fi
    
    # 긴 함수 탐지
    awk '
    /^[[:space:]]*(export[[:space:]]+)?(async[[:space:]]+)?(function|const)[[:space:]]+[a-zA-Z_][a-zA-Z0-9_]*[[:space:]]*\(/ {
        func_name = $0
        gsub(/^[[:space:]]*/, "", func_name)
        gsub(/[[:space:]]*{.*$/, "", func_name)
        start_line = NR
        brace_count = 1
        in_func = 1
    }
    in_func {
        if (/{/) brace_count += gsub(/{/, "", $0)
        if (/}/) brace_count -= gsub(/}/, "", $0)
        
        if (brace_count == 0) {
            func_lines = NR - start_line + 1
            if (func_lines > '$MAX_FUNCTION_LINES') {
                print FILENAME ":" start_line ": " func_name " (" func_lines "줄)"
            }
            in_func = 0
        }
    }' "$file" | while read -r long_func; do
        echo -e "${YELLOW}[긴 함수]${NC} $long_func"
        long_methods+=("$long_func")
    done
done

# 3. 복잡도 분석
echo -e "\n${YELLOW}3️⃣ 복잡도 분석${NC}"
echo "-------------"

# Cyclomatic Complexity 근사치 계산
find "$SRC_DIR" -name "*.ts" -o -name "*.tsx" | while read -r file; do
    # if, for, while, switch, catch, && , || 등의 개수로 복잡도 추정
    complexity=$(grep -E "(if\s*\(|for\s*\(|while\s*\(|switch\s*\(|catch\s*\(|\&\&|\|\||case\s+)" "$file" | wc -l)
    
    if [ $complexity -gt $((MAX_COMPLEXITY * 5)) ]; then  # 파일 전체 기준
        echo -e "${RED}[높은 복잡도]${NC} $file (복잡도 지표: $complexity)"
        spaghetti_code+=("$file:복잡도_$complexity")
    fi
done

# 4. 매개변수 과다 함수
echo -e "\n${YELLOW}4️⃣ 매개변수 과다 함수 탐지${NC}"
echo "-------------------------"

grep -r "function\|const.*=.*(" "$SRC_DIR" --include="*.ts" --include="*.tsx" | while read -r line; do
    # 매개변수 개수 세기
    params=$(echo "$line" | sed 's/.*(//' | sed 's/).*//' | tr ',' '\n' | wc -l)
    
    if [ $params -gt $MAX_PARAMS ]; then
        file=$(echo "$line" | cut -d: -f1)
        func_sig=$(echo "$line" | cut -d: -f2- | sed 's/[[:space:]]*{.*//')
        echo -e "${YELLOW}[많은 매개변수]${NC} $file: $func_sig (${params}개)"
        too_many_params+=("$file:$func_sig:${params}개")
    fi
done

# 5. 순환 의존성 검사
echo -e "\n${YELLOW}5️⃣ 순환 의존성 검사${NC}"
echo "------------------"

# import 관계 분석
declare -A import_graph
declare -A visited

# import 문 파싱
find "$SRC_DIR" -name "*.ts" -o -name "*.tsx" | while read -r file; do
    rel_file=$(echo "$file" | sed "s|^$SRC_DIR/||")
    
    # import 추출
    grep "^import.*from" "$file" 2>/dev/null | while read -r import_line; do
        imported=$(echo "$import_line" | sed "s/.*from[[:space:]]*['\"]//;s/['\"].*//" | sed "s|^\./||")
        
        # 상대 경로 처리
        if [[ $imported == ../* ]]; then
            # 상위 디렉토리 import 처리
            dir=$(dirname "$rel_file")
            imported=$(cd "$dir" && cd "$(dirname "$imported")" && pwd | sed "s|.*/$SRC_DIR/||")/$(basename "$imported")
        fi
        
        # 그래프에 추가
        if [ -n "$imported" ]; then
            import_graph["$rel_file"]+=" $imported"
        fi
    done
done

# DFS로 순환 탐지
detect_cycle() {
    local node=$1
    local path=$2
    
    if [[ " $path " == *" $node "* ]]; then
        echo -e "${RED}[순환 의존성]${NC} $path → $node"
        circular_deps+=("$path → $node")
        return
    fi
    
    visited["$node"]=1
    
    for next in ${import_graph["$node"]}; do
        detect_cycle "$next" "$path → $node"
    done
}

# 모든 노드에서 순환 검사
for node in "${!import_graph[@]}"; do
    if [ -z "${visited[$node]}" ]; then
        detect_cycle "$node" ""
    fi
done

# 6. 종합 리포트 생성
echo -e "\n${YELLOW}6️⃣ 종합 리포트 생성${NC}"
echo "------------------"

REPORT_FILE="$REPORTS_DIR/antipattern-report-$TIMESTAMP.md"

cat > "$REPORT_FILE" << EOF
# 난개발 패턴 탐지 리포트

**생성일**: $DATE  
**대상**: \`$SRC_DIR\` 디렉토리  
**코드 품질 검사 결과**

## 📊 검사 결과 요약

| 패턴 | 발견 수 | 심각도 |
|------|---------|--------|
| God Class | ${#god_classes[@]}개 | $([ ${#god_classes[@]} -eq 0 ] && echo "✅ 없음" || echo "🔴 높음") |
| 스파게티 코드 | ${#spaghetti_code[@]}개 | $([ ${#spaghetti_code[@]} -eq 0 ] && echo "✅ 없음" || echo "🟡 중간") |
| 긴 메서드 | ${#long_methods[@]}개 | $([ ${#long_methods[@]} -eq 0 ] && echo "✅ 없음" || echo "🟡 중간") |
| 깊은 중첩 | ${#deep_nesting[@]}개 | $([ ${#deep_nesting[@]} -eq 0 ] && echo "✅ 없음" || echo "🟡 중간") |
| 과다 매개변수 | ${#too_many_params[@]}개 | $([ ${#too_many_params[@]} -eq 0 ] && echo "✅ 없음" || echo "🟡 중간") |
| 순환 의존성 | ${#circular_deps[@]}개 | $([ ${#circular_deps[@]} -eq 0 ] && echo "✅ 없음" || echo "🔴 높음") |

## 🔴 Critical Issues (즉시 수정 필요)

### God Classes
EOF

if [ ${#god_classes[@]} -gt 0 ]; then
    for gc in "${god_classes[@]}"; do
        echo "- $gc" >> "$REPORT_FILE"
    done
    cat >> "$REPORT_FILE" << EOF

**리팩토링 제안**:
1. 단일 책임 원칙(SRP) 적용
2. 관련 기능별로 클래스 분리
3. 공통 기능을 유틸리티로 추출
EOF
else
    echo "없음" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

### 순환 의존성
EOF

if [ ${#circular_deps[@]} -gt 0 ]; then
    for cd in "${circular_deps[@]}"; do
        echo "- $cd" >> "$REPORT_FILE"
    done
    cat >> "$REPORT_FILE" << EOF

**해결 방안**:
1. 의존성 역전 원칙(DIP) 적용
2. 인터페이스/추상화 레이어 도입
3. 공통 모듈로 기능 이동
EOF
else
    echo "없음" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

## 🟡 Medium Issues (개선 권장)

### 긴 메서드 (${MAX_FUNCTION_LINES}줄 초과)
EOF

if [ ${#long_methods[@]} -gt 0 ]; then
    for lm in "${long_methods[@]:0:5}"; do  # 상위 5개만
        echo "- $lm" >> "$REPORT_FILE"
    done
    [ ${#long_methods[@]} -gt 5 ] && echo "... 외 $((${#long_methods[@]} - 5))개" >> "$REPORT_FILE"
else
    echo "없음" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

### 과다 매개변수 함수 (${MAX_PARAMS}개 초과)
EOF

if [ ${#too_many_params[@]} -gt 0 ]; then
    for tmp in "${too_many_params[@]:0:5}"; do  # 상위 5개만
        echo "- $tmp" >> "$REPORT_FILE"
    done
    [ ${#too_many_params[@]} -gt 5 ] && echo "... 외 $((${#too_many_params[@]} - 5))개" >> "$REPORT_FILE"
else
    echo "없음" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << EOF

## 🎯 개선 권장사항

### 1. 즉시 적용 가능한 리팩토링
- 긴 함수를 작은 단위로 분할
- 매개변수 객체 패턴 적용
- 중첩된 조건문을 조기 반환으로 개선

### 2. 중기 개선 계획
- God Class를 책임별로 분리
- 순환 의존성 해결을 위한 아키텍처 재설계
- 복잡한 로직을 전략 패턴으로 리팩토링

### 3. 장기 품질 관리
- 코드 리뷰 체크리스트에 안티패턴 검사 추가
- 정기적인 코드 품질 측정 자동화
- 팀 교육 및 코딩 표준 수립

## 📈 코드 품질 점수

\`\`\`
전체 점수: $(( 100 - ${#god_classes[@]}*10 - ${#circular_deps[@]}*10 - ${#long_methods[@]}*2 - ${#too_many_params[@]}*2 ))/100
\`\`\`

---
*이 리포트는 code-review-specialist 에이전트에 의해 생성되었습니다.*
EOF

echo -e "${GREEN}✅ 리포트 생성 완료: $REPORT_FILE${NC}"

# 7. 최종 평가
echo -e "\n${BLUE}📊 최종 평가${NC}"
echo "==========="

total_issues=$(( ${#god_classes[@]} + ${#spaghetti_code[@]} + ${#long_methods[@]} + ${#deep_nesting[@]} + ${#too_many_params[@]} + ${#circular_deps[@]} ))

if [ $total_issues -eq 0 ]; then
    echo -e "${GREEN}🎉 훌륭합니다! 깨끗한 코드가 유지되고 있습니다.${NC}"
else
    echo -e "${YELLOW}⚠️  총 ${total_issues}개의 안티패턴 발견${NC}"
    echo ""
    echo "우선순위:"
    [ ${#god_classes[@]} -gt 0 ] && echo -e "  1. ${RED}God Class 리팩토링${NC}"
    [ ${#circular_deps[@]} -gt 0 ] && echo -e "  2. ${RED}순환 의존성 해결${NC}"
    [ ${#long_methods[@]} -gt 0 ] && echo -e "  3. ${YELLOW}긴 메서드 분할${NC}"
fi

echo -e "\n${GREEN}✅ 난개발 패턴 탐지 완료!${NC}"