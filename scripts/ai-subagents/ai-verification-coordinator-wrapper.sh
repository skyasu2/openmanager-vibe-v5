#!/bin/bash
# 🎯 AI Verification Coordinator Wrapper - 3단계 레벨 기반 검증 조정자
# Level 2+ 검증에서 다중 AI 결과 수집 및 의사결정
#
# ⚠️  DEPRECATED (2025-09-19): ai-verification-coordinator 시스템이 제거됨
# ⚠️  대신 AI 교차검증 v3.0 서브에이전트 기반 시스템 사용
# ⚠️  개별 AI CLI 직접 실행: codex exec, gemini, timeout 60 qwen -p
#
echo "⚠️  DEPRECATED: 이 스크립트는 더 이상 사용되지 않습니다."
echo "⚠️  AI 교차검증 v3.0 서브에이전트 기반 시스템을 사용하세요."
echo "⚠️  개별 AI CLI: codex exec, gemini, timeout 60 qwen -p"
exit 1

set -uo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# 로깅 함수
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# AI 가중치 설정 (CLAUDE.md 기준)
declare -A AI_WEIGHTS=(
    ["codex"]="0.99"
    ["gemini"]="0.98"
    ["qwen"]="0.97"
    ["claude"]="1.00"
)

# 의사결정 임계값
declare -A DECISION_THRESHOLDS=(
    ["auto_approve"]="8.5"
    ["conditional"]="6.5"
    ["needs_improvement"]="4.0"
)

# 점수 추출 함수 (개선된 정규식)
extract_score() {
    local text="$1"
    local score=""
    
    # 다양한 점수 패턴 시도
    score=$(echo "$text" | grep -oE '[0-9]+\.?[0-9]*(?=/10|점|%)' | head -1 2>/dev/null || echo "")
    
    if [[ -z "$score" ]]; then
        # 추가 패턴: "점수: 8.5", "Score: 8.5" 등
        score=$(echo "$text" | grep -oE '(점수|Score|평점)[:：]\s*([0-9]+\.?[0-9]*)' | grep -oE '[0-9]+\.?[0-9]*' | head -1 2>/dev/null || echo "")
    fi
    
    if [[ -z "$score" ]]; then
        # 최후 패턴: 단순 숫자 찾기
        score=$(echo "$text" | grep -oE '[0-9]+\.?[0-9]*' | head -1 2>/dev/null || echo "7.0")
    fi
    
    # 100점 만점을 10점 만점으로 변환
    if (( $(echo "$score > 10" | bc -l 2>/dev/null || echo 0) )); then
        score=$(echo "scale=1; $score / 10" | bc 2>/dev/null || echo "7.0")
    fi
    
    # 범위 검증 (0-10)
    if (( $(echo "$score < 0" | bc -l 2>/dev/null || echo 0) )); then
        score="0.0"
    elif (( $(echo "$score > 10" | bc -l 2>/dev/null || echo 0) )); then
        score="10.0"
    fi
    
    echo "$score"
}

# 가중치 평균 계산
calculate_weighted_average() {
    local scores=("$@")
    local total_weighted_sum=0
    local total_weight=0
    local ai_names=("codex" "gemini" "qwen")
    
    log_info "가중치 평균 계산 중..."
    
    for i in "${!scores[@]}"; do
        local score="${scores[$i]}"
        local ai_name="${ai_names[$i]:-unknown}"
        local weight="${AI_WEIGHTS[$ai_name]:-0.5}"
        
        if [[ "$score" != "N/A" ]] && [[ "$score" != "ERROR" ]]; then
            local weighted_value=$(echo "scale=3; $score * $weight" | bc 2>/dev/null || echo "0")
            total_weighted_sum=$(echo "scale=3; $total_weighted_sum + $weighted_value" | bc 2>/dev/null || echo "$total_weighted_sum")
            total_weight=$(echo "scale=3; $total_weight + $weight" | bc 2>/dev/null || echo "$total_weight")
            
            echo "  • $ai_name: ${score}/10 (가중치: $weight) = $weighted_value"
        else
            echo "  • $ai_name: 분석 실패 (점수 제외)"
        fi
    done
    
    if (( $(echo "$total_weight > 0" | bc -l 2>/dev/null || echo 0) )); then
        local final_score=$(echo "scale=2; $total_weighted_sum / $total_weight" | bc 2>/dev/null || echo "7.0")
        echo "  총 가중합: $total_weighted_sum, 총 가중치: $total_weight"
        echo "$final_score"
    else
        echo "7.0"  # 기본값
    fi
}

# 의사결정 함수
make_decision() {
    local score="$1"
    local file_path="$2"
    
    echo -e "\n${MAGENTA}🎯 의사결정 분석${NC}"
    echo "─────────────────────────────"
    echo "최종 점수: ${score}/10"
    
    local decision=""
    local recommendation=""
    
    if (( $(echo "$score >= ${DECISION_THRESHOLDS[auto_approve]}" | bc -l 2>/dev/null || echo 0) )); then
        decision="✅ 자동 승인"
        recommendation="코드 품질이 우수합니다. 배포 가능합니다."
    elif (( $(echo "$score >= ${DECISION_THRESHOLDS[conditional]}" | bc -l 2>/dev/null || echo 0) )); then
        decision="⚠️ 조건부 승인"
        recommendation="일부 개선 후 배포를 권장합니다. 주요 이슈를 검토하세요."
    elif (( $(echo "$score >= ${DECISION_THRESHOLDS[needs_improvement]}" | bc -l 2>/dev/null || echo 0) )); then
        decision="🔧 개선 필요"
        recommendation="상당한 개선이 필요합니다. 리팩토링을 고려하세요."
    else
        decision="❌ 자동 거절"
        recommendation="심각한 문제가 있습니다. 전면 재작성을 권장합니다."
    fi
    
    echo "결정: $decision"
    echo "권장사항: $recommendation"
    
    return 0
}

# AI 분석 결과 수집
collect_ai_results() {
    local file_path="$1"
    local level="$2"
    
    local script_dir="$(dirname "$0")"
    local results=()
    local scores=()
    
    echo -e "\n${CYAN}🤖 AI 분석 결과 수집 (Level $level)${NC}"
    echo "─────────────────────────────────────"
    
    case $level in
        2)
            # Level 2: Claude + AI 1개 (Codex 우선)
            echo "Level 2 검증: Claude + Codex"
            
            if [[ -x "$script_dir/codex-wrapper.sh" ]]; then
                echo -e "\n${BLUE}🤖 Codex CLI 분석:${NC}"
                local codex_result
                codex_result=$("$script_dir/codex-wrapper.sh" "$file_path" 2>&1 || echo "ERROR")
                results+=("$codex_result")
                
                local codex_score
                codex_score=$(extract_score "$codex_result")
                scores+=("$codex_score")
                
                echo "추출된 점수: ${codex_score}/10"
            else
                log_warning "codex-wrapper.sh를 찾을 수 없음"
                results+=("Codex 분석 실패")
                scores+=("N/A")
            fi
            ;;
            
        3)
            # Level 3: 전체 AI (Codex + Gemini + Qwen)
            echo "Level 3 검증: 전체 AI 교차검증"
            
            for ai in codex gemini qwen; do
                local wrapper="$script_dir/${ai}-wrapper.sh"
                
                if [[ -x "$wrapper" ]]; then
                    echo -e "\n${BLUE}🤖 ${ai^} CLI 분석:${NC}"
                    local result
                    result=$("$wrapper" "$file_path" 2>&1 || echo "ERROR")
                    results+=("$result")
                    
                    local score
                    score=$(extract_score "$result")
                    scores+=("$score")
                    
                    echo "추출된 점수: ${score}/10"
                else
                    log_warning "${ai}-wrapper.sh를 찾을 수 없음"
                    results+=("${ai^} 분석 실패")
                    scores+=("N/A")
                fi
            done
            ;;
            
        *)
            log_error "지원하지 않는 레벨: $level"
            return 1
            ;;
    esac
    
    # 결과 반환 (scores 배열을 공백으로 구분하여 반환)
    echo "${scores[@]}"
}

# 상세 결과 출력
show_detailed_results() {
    local file_path="$1"
    local level="$2"
    local scores=("$@")
    # scores 배열에서 file_path와 level 제거
    scores=("${scores[@]:2}")
    
    echo -e "\n${GREEN}📊 상세 분석 결과${NC}"
    echo "═══════════════════════════════════════"
    echo "파일: $(basename "$file_path")"
    echo "검증 레벨: Level $level"
    
    local ai_names=("Codex" "Gemini" "Qwen")
    local valid_scores=()
    
    echo -e "\n${CYAN}개별 AI 점수:${NC}"
    for i in "${!scores[@]}"; do
        local score="${scores[$i]}"
        local ai_name="${ai_names[$i]:-AI$((i+1))}"
        local weight="${AI_WEIGHTS[${ai_name,,}]:-0.5}"
        
        if [[ "$score" != "N/A" ]] && [[ "$score" != "ERROR" ]]; then
            echo "  • $ai_name: ${score}/10 (가중치: $weight)"
            valid_scores+=("$score")
        else
            echo "  • $ai_name: 분석 실패"
        fi
    done
    
    if [[ ${#valid_scores[@]} -eq 0 ]]; then
        log_error "모든 AI 분석이 실패했습니다"
        return 1
    fi
    
    # 가중치 평균 계산
    local final_score
    final_score=$(calculate_weighted_average "${scores[@]}")
    
    echo -e "\n${YELLOW}최종 가중 평균: ${final_score}/10${NC}"
    
    # 의사결정
    make_decision "$final_score" "$file_path"
    
    return 0
}

# 메인 조정 함수
coordinate_verification() {
    local file_path="$1"
    local level="${2:-2}"
    
    # 파일 존재 확인
    if [[ ! -f "$file_path" ]]; then
        log_error "파일을 찾을 수 없습니다: $file_path"
        return 1
    fi
    
    # Level 2, 3만 지원
    if [[ "$level" != "2" ]] && [[ "$level" != "3" ]]; then
        log_error "AI Verification Coordinator는 Level 2, 3만 지원합니다"
        return 1
    fi
    
    log_info "🚀 AI Verification Coordinator 시작"
    echo "파일: $(basename "$file_path")"
    echo "레벨: Level $level"
    
    # AI 결과 수집
    local scores_string
    scores_string=$(collect_ai_results "$file_path" "$level")
    
    # 문자열을 배열로 변환
    read -ra scores <<< "$scores_string"
    
    # 상세 결과 출력
    show_detailed_results "$file_path" "$level" "${scores[@]}"
    
    log_success "AI 교차검증 조정 완료"
    return 0
}

# 도움말 표시
show_help() {
    cat << EOF
🎯 AI Verification Coordinator - 다중 AI 검증 조정자

사용법:
  $0 <파일경로> [레벨]
  $0 -h | --help

레벨:
  2    Level 2: Claude + Codex (기본값)
  3    Level 3: 전체 AI (Codex + Gemini + Qwen)

예시:
  $0 src/components/Button.tsx 2
  $0 src/lib/auth.ts 3

기능:
  • 다중 AI 결과 수집 및 파싱
  • 가중치 기반 점수 계산
  • 자동 의사결정 (승인/조건부/거절)
  • 상세 분석 결과 제공

가중치 시스템:
  • Codex: 0.99 (실무 코드 리뷰)
  • Gemini: 0.98 (아키텍처 분석)
  • Qwen: 0.97 (성능 최적화)

의사결정 기준:
  • 8.5점 이상: ✅ 자동 승인
  • 6.5-8.4점: ⚠️ 조건부 승인
  • 4.0-6.4점: 🔧 개선 필요
  • 4.0점 미만: ❌ 자동 거절
EOF
}

# 메인 함수
main() {
    local file_path=""
    local level="2"
    
    # 인수 파싱
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            2|3)
                level="$1"
                shift
                ;;
            *)
                if [[ -z "$file_path" ]]; then
                    file_path="$1"
                fi
                shift
                ;;
        esac
    done
    
    # 파일 경로 확인
    if [[ -z "$file_path" ]]; then
        log_error "파일 경로를 제공해주세요."
        show_help
        exit 1
    fi
    
    # bc 명령어 확인
    if ! command -v bc >/dev/null 2>&1; then
        log_error "bc 명령어를 찾을 수 없습니다. 'sudo apt install bc' 또는 'yum install bc'로 설치하세요."
        exit 1
    fi
    
    # 메인 조정 실행
    coordinate_verification "$file_path" "$level"
}

# 함수 export (다른 스크립트에서 사용 가능)
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    # 소스되는 경우 함수만 export
    export -f coordinate_verification
    export -f collect_ai_results
    export -f calculate_weighted_average
    export -f make_decision
    export -f extract_score
    export -f log_info log_success log_warning log_error
else
    # 직접 실행되는 경우 main 함수 호출
    main "$@"
fi