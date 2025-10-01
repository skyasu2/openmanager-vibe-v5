#!/bin/bash
# 🚀 개선된 AI 교차검증 시스템 v3.0 (복잡도 무관 병렬 최적화)
# Claude Code + 3개 외부 AI CLI 동시 실행 (복잡도 제한 제거)

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 로깅 함수
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_ai() { echo -e "${PURPLE}🤖 $1${NC}"; }

# AI 도구 가중치 (CLAUDE.md 기준) - 복잡도 무관 전체 실행
declare -A AI_WEIGHTS=(
    ["claude"]=1.0
    ["codex"]=0.99
    ["gemini"]=0.98
    ["qwen"]=0.97
)

# AI CLI 도구 상태 확인
check_ai_tools() {
    log_info "AI CLI 도구 상태 확인 중..."
    
    local tools=("claude" "codex" "gemini" "qwen")
    local available_tools=()
    
    for tool in "${tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            log_success "$tool CLI 사용 가능 (가중치: ${AI_WEIGHTS[$tool]})"
            available_tools+=("$tool")
        else
            log_warning "$tool CLI 설치되지 않음"
        fi
    done
    
    if [ ${#available_tools[@]} -lt 3 ]; then
        log_error "최소 3개 AI CLI 도구가 필요합니다 (Codex, Gemini, Qwen)"
        exit 1
    fi
    
    echo "${available_tools[@]}"
}

# Codex CLI 분석 (GPT-5, ChatGPT Plus $20/월)
analyze_with_codex() {
    local file_path="$1"
    local file_content
    
    log_ai "Codex CLI (GPT-5) 실무 중심 분석 시작... (90초 타임아웃)"
    
    if [ -f "$file_path" ]; then
        file_content=$(head -c 8000 "$file_path" 2>/dev/null)
        
        timeout 90s codex exec "
실무 관점에서 TypeScript 코드를 평가해주세요:

파일: $(basename "$file_path")
---
$file_content
---

평가 형식:
점수: X.X/10
실무 장점: [구체적 장점 2개]
개선사항: [실행가능한 개선사항 2개]
보안/성능: [발견된 문제 또는 '문제없음']
" 2>/dev/null || {
            log_warning "Codex CLI 타임아웃 (90초)"
            echo "Codex 분석: 타임아웃 - 파일 크기나 네트워크 문제"
        }
    else
        echo "Codex 분석: 파일 찾을 수 없음"
    fi
}

# Gemini CLI 분석 (Google AI 무료 1K/day)
analyze_with_gemini() {
    local file_path="$1"
    local file_content
    
    log_ai "Gemini CLI (Google AI) 구조적 분석 시작... (45초 타임아웃)"
    
    if [ -f "$file_path" ]; then
        file_content=$(head -c 6000 "$file_path" 2>/dev/null)
        
        timeout 45s gemini -p "
구조적 관점에서 TypeScript 코드 분석:

파일: $(basename "$file_path")
---
$file_content
---

분석 형식:
점수: X.X/10
구조적 장점: [아키텍처 관점 2개]
리팩토링 제안: [구조 개선사항 2개]
확장성: [확장성 평가 또는 '좋음']
" 2>/dev/null || {
            log_warning "Gemini CLI 타임아웃 (45초)"
            echo "Gemini 분석: 타임아웃 - 무료 한도 초과 가능"
        }
    else
        echo "Gemini 분석: 파일 찾을 수 없음"
    fi
}

# Qwen CLI 분석 (OAuth 무료 2K/day)
analyze_with_qwen() {
    local file_path="$1"
    local file_content
    
    log_ai "Qwen CLI (OAuth) 알고리즘 분석 시작... (60초 타임아웃)"
    
    if [ -f "$file_path" ]; then
        file_content=$(head -c 5000 "$file_path" 2>/dev/null)
        
        timeout 60s qwen -p "
알고리즘 관점에서 TypeScript 코드 분석:

파일: $(basename "$file_path")
---
$file_content
---

분석 형식:
점수: X.X/10
알고리즘 장점: [효율성 관점 2개]
최적화: [성능 개선방안 2개]
복잡도: [시간/공간 복잡도 또는 '적정']
" 2>/dev/null || {
            log_warning "Qwen CLI 타임아웃 (60초)"
            echo "Qwen 분석: 타임아웃 - OAuth 한도 초과 가능"
        }
    else
        echo "Qwen 분석: 파일 찾을 수 없음"
    fi
}

# 점수 추출 함수
extract_score() {
    local analysis="$1"
    echo "$analysis" | grep -oP '점수:\s*\K[\d.]+' | head -1
}

# 가중 평균 계산 (Phase 1 최적화: bc 사용)
calculate_weighted_average() {
    local codex_score="$1"
    local gemini_score="$2"
    local qwen_score="$3"

    # 기본값 설정 (분석 실패 시)
    codex_score=${codex_score:-0}
    gemini_score=${gemini_score:-0}
    qwen_score=${qwen_score:-0}

    # 가중 평균 계산 (bc로 부동소수점 처리)
    local weighted_avg=$(echo "scale=1; ($codex_score*0.99 + $gemini_score*0.98 + $qwen_score*0.97) / (0.99 + 0.98 + 0.97)" | bc 2>/dev/null || echo "0.0")

    echo "$weighted_avg"
}

# 메인 교차검증 함수
cross_validate_file() {
    local file_path="$1"
    
    if [ ! -f "$file_path" ]; then
        log_error "파일을 찾을 수 없습니다: $file_path"
        return 1
    fi
    
    echo
    log_info "🎯 AI 교차검증 시작: $(basename "$file_path")"
    echo "=" | head -c 60; echo
    
    # 3개 AI CLI 병렬 분석 시작 (복잡도 무관)
    log_info "3개 AI CLI 병렬 분석 시작 - 복잡도 체크 없이 전체 실행..."
    
    local codex_result gemini_result qwen_result
    local codex_pid gemini_pid qwen_pid
    
    # 병렬 백그라운드 실행
    {
        codex_result=$(analyze_with_codex "$file_path")
        echo "CODEX_DONE:$codex_result" > "/tmp/codex_result_$$"
    } &
    codex_pid=$!

    {
        gemini_result=$(analyze_with_gemini "$file_path")
        echo "GEMINI_DONE:$gemini_result" > "/tmp/gemini_result_$$"
    } &
    gemini_pid=$!

    {
        qwen_result=$(analyze_with_qwen "$file_path")
        echo "QWEN_DONE:$qwen_result" > "/tmp/qwen_result_$$"
    } &
    qwen_pid=$!

    # 병렬 실행 대기 (Phase 1 최적화: 에러 핸들링)
    local codex_exit gemini_exit qwen_exit
    wait $codex_pid
    codex_exit=$?
    wait $gemini_pid
    gemini_exit=$?
    wait $qwen_pid
    qwen_exit=$?
    
    # 결과 읽기 (Phase 1 최적화: fallback 점수)
    if [ -f "/tmp/codex_result_$$" ]; then
        codex_result=$(cat "/tmp/codex_result_$$" | sed 's/^CODEX_DONE://')
        rm -f "/tmp/codex_result_$$"
    elif [ $codex_exit -ne 0 ]; then
        codex_result="점수: 5.0/10\n실무 장점: [분석 실패]\n개선사항: [재시도 필요]\n보안/성능: 타임아웃"
        log_warning "Codex 분석 실패 (exit: $codex_exit) - fallback 점수 5.0 적용"
    fi

    if [ -f "/tmp/gemini_result_$$" ]; then
        gemini_result=$(cat "/tmp/gemini_result_$$" | sed 's/^GEMINI_DONE://')
        rm -f "/tmp/gemini_result_$$"
    elif [ $gemini_exit -ne 0 ]; then
        gemini_result="점수: 5.0/10\n구조적 장점: [분석 실패]\n리팩토링 제안: [재시도 필요]\n확장성: 타임아웃"
        log_warning "Gemini 분석 실패 (exit: $gemini_exit) - fallback 점수 5.0 적용"
    fi

    if [ -f "/tmp/qwen_result_$$" ]; then
        qwen_result=$(cat "/tmp/qwen_result_$$" | sed 's/^QWEN_DONE://')
        rm -f "/tmp/qwen_result_$$"
    elif [ $qwen_exit -ne 0 ]; then
        qwen_result="점수: 5.0/10\n알고리즘 장점: [분석 실패]\n최적화: [재시도 필요]\n복잡도: 타임아웃"
        log_warning "Qwen 분석 실패 (exit: $qwen_exit) - fallback 점수 5.0 적용"
    fi
    
    # 결과 출력
    echo -e "\n${PURPLE}🤖 Codex (GPT-5) 결과:${NC}"
    echo "$codex_result"
    
    echo -e "\n${CYAN}🤖 Gemini 결과:${NC}"
    echo "$gemini_result"
    
    echo -e "\n${BLUE}🤖 Qwen 결과:${NC}"
    echo "$qwen_result"
    
    # 점수 추출 및 가중평균 계산
    local codex_score gemini_score qwen_score
    codex_score=$(extract_score "$codex_result")
    gemini_score=$(extract_score "$gemini_result")
    qwen_score=$(extract_score "$qwen_result")

    local average_score
    average_score=$(calculate_weighted_average "$codex_score" "$gemini_score" "$qwen_score")

    # Phase 1: Claude 오판 감지 (점수 차이 > 30점 + 2엔진 합의)
    local max_score min_score score_diff_100
    max_score=$(printf '%s\n' "$codex_score" "$gemini_score" "$qwen_score" | sort -nr | head -1)
    min_score=$(printf '%s\n' "$codex_score" "$gemini_score" "$qwen_score" | sort -n | head -1)
    # 10점 만점 → 100점 만점으로 변환하여 비교
    score_diff_100=$(echo "($max_score - $min_score) * 10" | bc 2>/dev/null || echo "0")

    # 2엔진 합의 확인 (Codex 제안)
    local consensus_count
    consensus_count=$(printf '%s\n' "$codex_score" "$gemini_score" "$qwen_score" | \
      awk '{print int($1*10)}' | sort | uniq -c | sort -nr | head -1 | awk '{print $1}')

    if (( $(echo "$score_diff_100 > 30" | bc -l 2>/dev/null || echo 0) )); then
        log_warning "⚠️  점수 차이 ${score_diff_100}점 (100점 만점) - 의견 충돌, 사용자 판단 필요"
    elif [ "$consensus_count" -lt 2 ]; then
        log_warning "⚠️  2엔진 합의 부족 (각각 다른 점수) - 검토 권장"
    else
        log_success "✅ 2엔진 이상 합의 (신뢰도 높음)"
    fi

    # 종합 결과
    echo
    echo "=" | head -c 60; echo
    log_success "🎯 AI 교차검증 완료 - $(basename "$file_path")"
    echo -e "${GREEN}📊 점수 요약:${NC}"
    echo "  • Codex (GPT-5):   ${codex_score:-N/A}/10 (가중치: 0.99)"
    echo "  • Gemini:          ${gemini_score:-N/A}/10 (가중치: 0.98)"
    echo "  • Qwen:            ${qwen_score:-N/A}/10 (가중치: 0.97)"
    echo -e "  ${GREEN}• 가중평균:        ${average_score}/10${NC}"
    
    # 품질 등급 (Phase 1 최적화: bc로 부동소수점 비교)
    if (( $(echo "$average_score >= 8.0" | bc -l 2>/dev/null || echo 0) )); then
        echo -e "  ${GREEN}✅ 등급: HIGH (8.0+ 점)${NC}"
    elif (( $(echo "$average_score >= 6.0" | bc -l 2>/dev/null || echo 0) )); then
        echo -e "  ${YELLOW}⚠️  등급: MEDIUM (6.0-7.9 점)${NC}"
    else
        echo -e "  ${RED}🚨 등급: LOW (6.0 미만)${NC}"
    fi
    echo
}

# 사용법 표시
show_usage() {
    echo "사용법: $0 <TypeScript_파일_경로>"
    echo
    echo "예시:"
    echo "  $0 src/components/Button.tsx"
    echo "  $0 src/hooks/useAuth.ts"
    echo
    echo "기능:"
    echo "  • 3개 AI CLI 병렬 분석 (Codex, Gemini, Qwen) - 복잡도 무관"
    echo "  • 가중평균 기반 종합 점수 (0.99, 0.98, 0.97)"  
    echo "  • 실무/구조/알고리즘 다각도 분석"
    echo "  • HIGH/MEDIUM/LOW 품질 등급"
    echo "  • 복잡도 체크 제거 - 모든 파일에 대해 전체 AI 검증"
}

# 메인 실행
main() {
    echo -e "${PURPLE}🚀 개선된 AI 교차검증 시스템 v3.0${NC}"
    echo -e "${BLUE}복잡도 제한 제거 + 병렬 최적화 버전${NC}"
    echo
    
    if [ $# -eq 0 ]; then
        show_usage
        exit 1
    fi
    
    local file_path="$1"
    
    # AI 도구 상태 확인
    local available_tools
    available_tools=($(check_ai_tools))
    
    if [ ${#available_tools[@]} -lt 3 ]; then
        log_warning "3개 AI CLI 필수 (현재: ${#available_tools[@]}개) - Codex, Gemini, Qwen 모두 필요"
        exit 1
    fi
    
    log_success "3개 AI CLI 모두 사용 가능 - 병렬 최적화 실행"
    
    # 파일 교차검증 실행
    cross_validate_file "$file_path"
}

# 스크립트 실행
main "$@"