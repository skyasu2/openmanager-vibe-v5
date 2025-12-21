#!/bin/bash

###############################################################################
# AI Wrapper Comprehensive Verification Suite
#
# 목적: 3-tier 복잡도 테스트로 실제 워크로드 검증
# 버전: 1.0.0
# 날짜: 2025-10-24
# 근거: logs/ai-decisions/2025-10-24-wrapper-scripts-comprehensive-analysis.md
#       Task 9 - 종합 검증 테스트 스위트 구현 (lines 419-454)
###############################################################################

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 프로젝트 루트 자동 결정 (포터블)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# 설정
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="/tmp/wrapper-verification-${TIMESTAMP}"
REPORT_FILE="${OUTPUT_DIR}/verification-report.md"
LOG_DIR="${PROJECT_ROOT}/logs/ai-perf"

# 통계 변수
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 출력 디렉토리 생성
mkdir -p "$OUTPUT_DIR"
mkdir -p "$LOG_DIR"

###############################################################################
# Test Scenarios - Three-Tier Complexity
###############################################################################

# Simple: 기준선 테스트 (예상 ~13초)
SIMPLE_QUERY="useState vs useReducer 선택 기준"
SIMPLE_EXPECTED_TIME=30  # 여유있게 30초

# Medium: 중간 복잡도 (예상 ~120초)
MEDIUM_QUERY="React 컴포넌트 최적화: useMemo, useCallback, React.memo 차이점 3가지"
MEDIUM_EXPECTED_TIME=180  # 여유있게 180초

# Complex: 실제 워크로드 (예상 ~284초, v2.4.0에서 300초 타임아웃 발생)
COMPLEX_QUERY="TypeScript strict mode에서 발생할 수 있는 타입 안전성 문제 5가지와 해결 방법"
COMPLEX_EXPECTED_TIME=600  # v2.5.0 타임아웃 테스트

###############################################################################
# Functions
###############################################################################

usage() {
    cat <<EOF
${CYAN}AI Wrapper Comprehensive Verification Suite v1.0.0${NC}

사용법: $0 [OPTIONS]

옵션:
  -w, --wrapper WRAPPER   특정 wrapper만 테스트 (codex|gemini|qwen)
  -t, --tier TIER         특정 tier만 테스트 (simple|medium|complex)
  -h, --help              도움말 표시

테스트 Tiers:
  Simple:  기준선 테스트 (~13초 예상)
  Medium:  중간 복잡도 (~120초 예상)
  Complex: 실제 워크로드 (~284초 예상, 600초 타임아웃 검증)

예시:
  $0                           # 전체 테스트 (9개: 3 wrappers × 3 tiers)
  $0 -w codex                  # Codex wrapper만 전체 tier 테스트
  $0 -t complex                # 모든 wrapper의 complex tier만 테스트
  $0 -w gemini -t simple       # Gemini wrapper의 simple tier만 테스트

EOF
    exit 0
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_test_start() {
    local wrapper=$1
    local tier=$2
    local query=$3
    local expected_time=$4
    
    echo ""
    echo -e "${CYAN}🧪 테스트 시작${NC}"
    echo -e "  Wrapper: ${YELLOW}$wrapper${NC}"
    echo -e "  Tier: ${YELLOW}$tier${NC}"
    echo -e "  Query: ${YELLOW}$query${NC}"
    echo -e "  Expected Time: ${YELLOW}~${expected_time}초${NC}"
    echo ""
}

extract_metrics() {
    local output_file=$1
    local wrapper=$2
    
    # 실행 시간 추출
    local exec_time=""
    if grep -q "실행 시간:" "$output_file" 2>/dev/null; then
        exec_time=$(grep "실행 시간:" "$output_file" | grep -oP '\d+초' | head -1)
    elif grep -q "Execution Time:" "$output_file" 2>/dev/null; then
        exec_time=$(grep "Execution Time:" "$output_file" | grep -oP '\d+' | head -1)
        exec_time="${exec_time}초"
    fi
    
    # 토큰 사용량 추출
    local tokens=""
    if grep -q "토큰 사용:" "$output_file" 2>/dev/null; then
        tokens=$(grep "토큰 사용:" "$output_file" | grep -oP '\d+' | head -1)
    elif grep -q "Tokens Used:" "$output_file" 2>/dev/null; then
        tokens=$(grep "Tokens Used:" "$output_file" | grep -oP '\d+' | head -1)
    fi
    
    echo "${exec_time:-N/A}|${tokens:-N/A}"
}

run_wrapper_test() {
    local wrapper=$1
    local tier=$2
    local query=$3
    local expected_time=$4
    local wrapper_script="${PROJECT_ROOT}/scripts/ai-wrappers/${wrapper}-wrapper.sh"
    local output_file="${OUTPUT_DIR}/${wrapper}-${tier}.txt"
    local metrics_file="${OUTPUT_DIR}/${wrapper}-${tier}-metrics.txt"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    print_test_start "$wrapper" "$tier" "$query" "$expected_time"
    
    # Wrapper 존재 확인
    if [[ ! -f "$wrapper_script" ]]; then
        echo -e "${RED}❌ Wrapper not found: $wrapper_script${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "FAILED|N/A|N/A|Wrapper not found" > "$metrics_file"
        return 1
    fi
    
    # 시작 시간 기록
    local start_time=$(date +%s)
    
    # Wrapper 실행 (타임아웃 = expected_time + 60초 버퍼)
    local timeout_limit=$((expected_time + 60))
    local exit_code=0
    
    echo -e "${YELLOW}⏳ 실행 중... (타임아웃: ${timeout_limit}초)${NC}"
    
    if timeout "${timeout_limit}s" "$wrapper_script" "$query" > "$output_file" 2>&1; then
        exit_code=0
    else
        exit_code=$?
    fi
    
    # 종료 시간 기록
    local end_time=$(date +%s)
    local actual_time=$((end_time - start_time))
    
    # 메트릭 추출
    local metrics=$(extract_metrics "$output_file" "$wrapper")
    local exec_time=$(echo "$metrics" | cut -d'|' -f1)
    local tokens=$(echo "$metrics" | cut -d'|' -f2)
    
    # 결과 판정
    if [[ $exit_code -eq 0 ]]; then
        if [[ $actual_time -le $expected_time ]]; then
            echo -e "${GREEN}✅ PASSED${NC} (${actual_time}초, ${exec_time}, ${tokens} 토큰)"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            echo "PASSED|${actual_time}|${exec_time}|${tokens}" > "$metrics_file"
        else
            echo -e "${YELLOW}⚠️  PASSED (시간 초과)${NC} (${actual_time}초 > ${expected_time}초 예상)"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            echo "PASSED_SLOW|${actual_time}|${exec_time}|${tokens}" > "$metrics_file"
        fi
    elif [[ $exit_code -eq 124 ]]; then
        echo -e "${RED}❌ TIMEOUT${NC} (${timeout_limit}초 초과)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "TIMEOUT|${actual_time}|N/A|N/A" > "$metrics_file"
    else
        echo -e "${RED}❌ FAILED${NC} (exit code: $exit_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo "FAILED|${actual_time}|${exec_time}|${tokens}" > "$metrics_file"
    fi
}

generate_report() {
    cat > "$REPORT_FILE" <<EOF
# AI Wrapper Comprehensive Verification Report

**날짜**: $(date '+%Y-%m-%d %H:%M:%S')
**버전**: Wrapper v2.5.0 Verification
**테스트 스위트**: Three-Tier Complexity Testing

---

## 📊 종합 결과

- **총 테스트**: $TOTAL_TESTS개
- **통과**: $PASSED_TESTS개
- **실패**: $FAILED_TESTS개
- **성공률**: $(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")%

---

## 🧪 테스트 결과 상세

EOF

    # 각 wrapper별 결과 추가
    for wrapper in codex gemini qwen; do
        echo "" >> "$REPORT_FILE"
        echo "### ${wrapper^} Wrapper" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        echo "| Tier | Status | Actual Time | Exec Time | Tokens |" >> "$REPORT_FILE"
        echo "|------|--------|-------------|-----------|--------|" >> "$REPORT_FILE"
        
        for tier in simple medium complex; do
            local metrics_file="${OUTPUT_DIR}/${wrapper}-${tier}-metrics.txt"
            if [[ -f "$metrics_file" ]]; then
                local status=$(cut -d'|' -f1 "$metrics_file")
                local actual=$(cut -d'|' -f2 "$metrics_file")
                local exec=$(cut -d'|' -f3 "$metrics_file")
                local tokens=$(cut -d'|' -f4 "$metrics_file")
                
                local status_icon=""
                case "$status" in
                    PASSED) status_icon="✅ PASSED" ;;
                    PASSED_SLOW) status_icon="⚠️ PASSED (slow)" ;;
                    TIMEOUT) status_icon="❌ TIMEOUT" ;;
                    FAILED) status_icon="❌ FAILED" ;;
                    *) status_icon="❓ SKIPPED" ;;
                esac
                
                echo "| $tier | $status_icon | ${actual}초 | $exec | $tokens |" >> "$REPORT_FILE"
            else
                echo "| $tier | ❓ SKIPPED | N/A | N/A | N/A |" >> "$REPORT_FILE"
            fi
        done
    done
    
    cat >> "$REPORT_FILE" <<EOF

---

## 📁 출력 파일

- **보고서**: $REPORT_FILE
- **로그 디렉토리**: $OUTPUT_DIR
- **개별 결과**: ${OUTPUT_DIR}/<wrapper>-<tier>.txt

---

## 🎯 검증 기준

### Simple Tier (기준선)
- **Query**: "$SIMPLE_QUERY"
- **예상 시간**: ~13초
- **타임아웃**: ${SIMPLE_EXPECTED_TIME}초

### Medium Tier (중간 복잡도)
- **Query**: "$MEDIUM_QUERY"
- **예상 시간**: ~120초
- **타임아웃**: ${MEDIUM_EXPECTED_TIME}초

### Complex Tier (실제 워크로드)
- **Query**: "$COMPLEX_QUERY"
- **예상 시간**: ~284초
- **타임아웃**: ${COMPLEX_EXPECTED_TIME}초 (v2.5.0 검증)

---

## 📝 참고

- **종합 분석 문서**: logs/ai-decisions/2025-10-24-wrapper-scripts-comprehensive-analysis.md
- **Task 9 근거**: Lines 419-454 (Three-Tier Test Methodology)
- **Wrapper 버전**: v2.5.0 (Portability + 600s timeout)

EOF

    echo -e "${GREEN}✅ 보고서 생성 완료: $REPORT_FILE${NC}"
}

###############################################################################
# Main Execution
###############################################################################

# 인자 파싱
WRAPPER_FILTER=""
TIER_FILTER=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -w|--wrapper)
            WRAPPER_FILTER="$2"
            shift 2
            ;;
        -t|--tier)
            TIER_FILTER="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            usage
            ;;
    esac
done

# 검증
if [[ -n "$WRAPPER_FILTER" ]] && [[ ! "$WRAPPER_FILTER" =~ ^(codex|gemini|qwen)$ ]]; then
    echo -e "${RED}❌ Invalid wrapper: $WRAPPER_FILTER (must be: codex, gemini, qwen)${NC}"
    exit 1
fi

if [[ -n "$TIER_FILTER" ]] && [[ ! "$TIER_FILTER" =~ ^(simple|medium|complex)$ ]]; then
    echo -e "${RED}❌ Invalid tier: $TIER_FILTER (must be: simple, medium, complex)${NC}"
    exit 1
fi

print_header "AI Wrapper Comprehensive Verification Suite v1.0.0"

echo -e "${BLUE}🎯 설정${NC}"
echo -e "  출력 디렉토리: ${YELLOW}$OUTPUT_DIR${NC}"
echo -e "  보고서: ${YELLOW}$REPORT_FILE${NC}"
if [[ -n "$WRAPPER_FILTER" ]]; then
    echo -e "  Wrapper 필터: ${YELLOW}$WRAPPER_FILTER${NC}"
fi
if [[ -n "$TIER_FILTER" ]]; then
    echo -e "  Tier 필터: ${YELLOW}$TIER_FILTER${NC}"
fi

# 테스트 실행 대상 결정
WRAPPERS=("codex" "gemini" "qwen")
TIERS=("simple" "medium" "complex")

if [[ -n "$WRAPPER_FILTER" ]]; then
    WRAPPERS=("$WRAPPER_FILTER")
fi

if [[ -n "$TIER_FILTER" ]]; then
    TIERS=("$TIER_FILTER")
fi

# 예상 총 테스트 수 계산
TOTAL_EXPECTED=$((${#WRAPPERS[@]} * ${#TIERS[@]}))
echo -e "${BLUE}  예상 테스트 수: ${YELLOW}${TOTAL_EXPECTED}개${NC}"

print_header "테스트 실행"

# 메인 테스트 루프
for wrapper in "${WRAPPERS[@]}"; do
    for tier in "${TIERS[@]}"; do
        case "$tier" in
            simple)
                run_wrapper_test "$wrapper" "simple" "$SIMPLE_QUERY" "$SIMPLE_EXPECTED_TIME"
                ;;
            medium)
                run_wrapper_test "$wrapper" "medium" "$MEDIUM_QUERY" "$MEDIUM_EXPECTED_TIME"
                ;;
            complex)
                run_wrapper_test "$wrapper" "complex" "$COMPLEX_QUERY" "$COMPLEX_EXPECTED_TIME"
                ;;
        esac
    done
done

# 보고서 생성
print_header "보고서 생성"
generate_report

# 최종 결과 출력
print_header "최종 결과"

echo -e "${BLUE}📊 통계${NC}"
echo -e "  총 테스트: ${YELLOW}$TOTAL_TESTS${NC}개"
echo -e "  통과: ${GREEN}$PASSED_TESTS${NC}개"
echo -e "  실패: ${RED}$FAILED_TESTS${NC}개"

if [[ $TOTAL_TESTS -gt 0 ]]; then
    SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
    echo -e "  성공률: ${YELLOW}${SUCCESS_RATE}%${NC}"
fi

echo ""
echo -e "${BLUE}📁 출력${NC}"
echo -e "  보고서: ${YELLOW}$REPORT_FILE${NC}"
echo -e "  로그: ${YELLOW}$OUTPUT_DIR${NC}"

echo ""

# 종료 코드
if [[ $FAILED_TESTS -eq 0 ]]; then
    echo -e "${GREEN}🎉 모든 테스트 통과!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  $FAILED_TESTS개 테스트 실패${NC}"
    exit 1
fi
