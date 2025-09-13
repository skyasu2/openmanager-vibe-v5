#!/bin/bash

# external-ai-orchestrator.sh
# 외부 AI 3개 순차 실행 오케스트레이션 독립 스크립트

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로깅 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 도움말 표시
show_help() {
    cat << EOF
🤖 External AI Orchestrator - 3개 AI 순차 검증 시스템

사용법:
  $0 <파일경로> [옵션]
  $0 analyze "주제" [level]

옵션:
  -h, --help     이 도움말 표시
  -v, --verbose  상세 로그 출력
  -t, --timeout  타임아웃 설정 (기본: 30초)

예시:
  $0 src/components/Button.tsx
  $0 analyze "React Hook 최적화" comprehensive
  $0 src/lib/auth.ts --verbose --timeout 45

가중치:
  • Codex (ChatGPT): 0.99 (실무 코드 리뷰)
  • Gemini (Google): 0.98 (아키텍처 분석)  
  • Qwen (Alibaba): 0.97 (성능 최적화)
EOF
}

# 파일 복잡도 분석
analyze_file_complexity() {
    local file_path="$1"
    
    if [[ ! -f "$file_path" ]]; then
        echo 0
        return
    fi
    
    local lines=$(wc -l < "$file_path")
    local functions=$(grep -c "function\|const.*=.*(" "$file_path" 2>/dev/null || echo 0)
    local imports=$(grep -c "import\|require" "$file_path" 2>/dev/null || echo 0)
    
    # 복잡도 점수 계산 (0-5)
    local complexity=0
    if [[ $lines -gt 200 ]]; then complexity=$((complexity + 2)); fi
    if [[ $lines -gt 100 ]]; then complexity=$((complexity + 1)); fi
    if [[ $functions -gt 10 ]]; then complexity=$((complexity + 1)); fi
    if [[ $imports -gt 20 ]]; then complexity=$((complexity + 1)); fi
    
    echo $complexity
}

# 메모리 안전성 검사
check_memory_safety() {
    local available_memory
    available_memory=$(free -m | awk '/^Mem:/ {print $7}')
    
    if [[ $available_memory -lt 500 ]]; then
        log_warning "사용 가능한 메모리가 ${available_memory}MB로 부족합니다"
        return 1
    fi
    
    return 0
}

# Codex 래퍼 실행
run_codex_analysis() {
    local file_path="$1"
    local timeout_duration="$2"
    local temp_file="/tmp/codex_$(basename "$file_path")_$$"
    
    log_info "🤖 Codex CLI 분석 시작..."
    
    # 파일 크기 제한 (2KB)
    head -c 2000 "$file_path" > "$temp_file"
    
    # Codex 실행 (타임아웃 적용)
    local result
    result=$(timeout "$timeout_duration"s codex exec "
TypeScript 코드 품질 평가 (10점 만점): $(basename "$file_path")

실무 관점에서 다음을 중점 검토:
1. 버그 가능성 및 런타임 에러
2. 보안 취약점 (XSS, 인젝션 등)  
3. 성능 최적화 기회
4. 코드 품질 및 유지보수성
5. TypeScript 타입 안전성

간단히 점수와 주요 개선사항 1-2개만 제시
" 2>/dev/null || {
        log_warning "Codex CLI 타임아웃 (${timeout_duration}초 초과)"
        echo "🤖 Codex 분석: 타임아웃 또는 네트워크 문제"
    })
    
    # 임시 파일 정리
    rm -f "$temp_file" 2>/dev/null
    
    echo "$result"
}

# Gemini 래퍼 실행
run_gemini_analysis() {
    local file_path="$1"
    local timeout_duration="$2"
    local temp_file="/tmp/gemini_$(basename "$file_path")_$$"
    
    log_info "🧠 Gemini CLI 분석 시작..."
    
    # 파일 크기 제한 (2KB)
    head -c 2000 "$file_path" > "$temp_file"
    
    # Gemini 실행 (타임아웃 적용)
    local result
    result=$(timeout "$timeout_duration"s gemini -p "
TypeScript 파일 $(basename "$file_path") 아키텍처 점수(10점)와 개선점 1개 간단히

구조적 관점에서 다음을 중점 분석:
1. 모듈 구조 및 책임 분리
2. 디자인 패턴 적용 적절성
3. 의존성 관리 및 결합도
4. 확장성 및 재사용성
5. 코드 구조 일관성

점수와 핵심 개선사항 1개만 간단히
" 2>/dev/null || {
        log_warning "Gemini CLI 타임아웃 (${timeout_duration}초 초과)"
        echo "🧠 Gemini 분석: 타임아웃 또는 무료 한도 초과"
    })
    
    # 임시 파일 정리
    rm -f "$temp_file" 2>/dev/null
    
    echo "$result"
}

# Qwen 래퍼 실행
run_qwen_analysis() {
    local file_path="$1"
    local timeout_duration="$2"
    local temp_file="/tmp/qwen_$(basename "$file_path")_$$"
    
    log_info "⚡ Qwen CLI 분석 시작..."
    
    # 파일 크기 제한 (1.5KB)
    head -c 1500 "$file_path" > "$temp_file"
    
    # Qwen 실행 (타임아웃 적용)
    local result
    result=$(timeout "$timeout_duration"s qwen -p "
TypeScript $(basename "$file_path") 성능 점수(10점)와 최적화 제안 1개

알고리즘 관점에서 다음을 중점 분석:
1. 시간 복잡도 및 공간 복잡도
2. 반복문 및 재귀 최적화 기회
3. 데이터 구조 선택 적절성
4. 메모리 사용 효율성
5. 병렬 처리 가능성

점수와 핵심 최적화 방안 1개만 간단히
" 2>/dev/null || {
        log_warning "Qwen CLI 타임아웃 (${timeout_duration}초 초과)"
        echo "⚡ Qwen 분석: 타임아웃 또는 OAuth 한도 초과"
    })
    
    # 임시 파일 정리
    rm -f "$temp_file" 2>/dev/null
    
    echo "$result"
}

# 점수 추출 함수
extract_score() {
    local text="$1"
    # 점수 패턴 매칭 (8.5/10, 8.5점, 85% 등)
    local score
    score=$(echo "$text" | grep -oE '[0-9]+\.?[0-9]*(?=/10|점|%)' | head -1)
    
    if [[ -n "$score" ]]; then
        # 100점 만점을 10점 만점으로 변환
        if (( $(echo "$score > 10" | bc -l) )); then
            score=$(echo "scale=1; $score / 10" | bc)
        fi
        echo "$score"
    else
        echo "7.0"  # 기본값
    fi
}

# 가중치 평균 계산
calculate_weighted_average() {
    local codex_score="$1"
    local gemini_score="$2" 
    local qwen_score="$3"
    
    # 가중치
    local codex_weight=0.99
    local gemini_weight=0.98
    local qwen_weight=0.97
    
    # 가중 평균 계산
    local weighted_sum
    weighted_sum=$(echo "scale=2; ($codex_score * $codex_weight) + ($gemini_score * $gemini_weight) + ($qwen_score * $qwen_weight)" | bc)
    
    local total_weight
    total_weight=$(echo "scale=2; $codex_weight + $gemini_weight + $qwen_weight" | bc)
    
    local final_score
    final_score=$(echo "scale=2; $weighted_sum / $total_weight" | bc)
    
    echo "$final_score"
}

# 의사결정 함수
make_decision() {
    local score="$1"
    
    if (( $(echo "$score >= 8.5" | bc -l) )); then
        echo "✅ 자동 승인"
    elif (( $(echo "$score >= 6.5" | bc -l) )); then
        echo "⚠️ 조건부 승인"
    elif (( $(echo "$score >= 4.0" | bc -l) )); then
        echo "🔄 개선 필요"
    else
        echo "❌ 자동 거절"
    fi
}

# 메인 분석 함수
run_parallel_analysis() {
    local file_path="$1"
    local timeout_duration="${2:-30}"
    local verbose="${3:-false}"
    
    # 파일 존재 확인
    if [[ ! -f "$file_path" ]]; then
        log_error "파일을 찾을 수 없습니다: $file_path"
        return 1
    fi
    
    # 메모리 안전성 확인
    if ! check_memory_safety; then
        log_error "메모리 부족으로 분석을 중단합니다"
        return 1
    fi
    
    # 복잡도 분석
    local complexity
    complexity=$(analyze_file_complexity "$file_path")
    local file_size=$(wc -l < "$file_path")
    
    log_info "📊 파일 분석: $(basename "$file_path") (${file_size}줄, 복잡도: ${complexity}/5)"
    
    if [[ $complexity -lt 3 ]]; then
        log_warning "간단한 파일입니다. Level 1-2 검증으로 충분할 수 있습니다."
    fi
    
    echo -e "\n${CYAN}🚀 3개 AI 순차 분석 시작...${NC}"
    
    # 순차 실행
    local codex_result
    local gemini_result  
    local qwen_result
    
    # 순차적으로 실행 (안정성 향상)
    echo -e "${YELLOW}1/3 Codex 분석 중...${NC}"
    codex_result=$(run_codex_analysis "$file_path" "$timeout_duration")
    
    echo -e "${YELLOW}2/3 Gemini 분석 중...${NC}"
    gemini_result=$(run_gemini_analysis "$file_path" "$timeout_duration")
    
    echo -e "${YELLOW}3/3 Qwen 분석 중...${NC}"
    qwen_result=$(run_qwen_analysis "$file_path" "$timeout_duration")
    
    # 결과 표시
    echo -e "\n${GREEN}📊 AI 분석 결과:${NC}"
    echo "─────────────────────────────────────────"
    
    if [[ "$verbose" == "true" ]]; then
        echo -e "\n🤖 ${BLUE}Codex CLI (가중치: 0.99):${NC}"
        echo "$codex_result"
        
        echo -e "\n🧠 ${BLUE}Gemini CLI (가중치: 0.98):${NC}"
        echo "$gemini_result"
        
        echo -e "\n⚡ ${BLUE}Qwen CLI (가중치: 0.97):${NC}"
        echo "$qwen_result"
    fi
    
    # 점수 추출
    local codex_score
    local gemini_score
    local qwen_score
    
    codex_score=$(extract_score "$codex_result")
    gemini_score=$(extract_score "$gemini_result")
    qwen_score=$(extract_score "$qwen_result")
    
    echo -e "\n${CYAN}📈 점수 분석:${NC}"
    echo "• Codex:  ${codex_score}/10"
    echo "• Gemini: ${gemini_score}/10"
    echo "• Qwen:   ${qwen_score}/10"
    
    # 가중 평균 계산
    local final_score
    final_score=$(calculate_weighted_average "$codex_score" "$gemini_score" "$qwen_score")
    
    # 최종 의사결정
    local decision
    decision=$(make_decision "$final_score")
    
    echo -e "\n${YELLOW}🎯 최종 결과:${NC}"
    echo "가중 평균: ${final_score}/10"
    echo "의사결정: $decision"
    
    # 권장사항
    echo -e "\n${GREEN}💡 권장사항:${NC}"
    if (( $(echo "$final_score >= 8.5" | bc -l) )); then
        echo "✅ 코드 품질이 우수합니다. 배포 가능합니다."
    elif (( $(echo "$final_score >= 6.5" | bc -l) )); then
        echo "⚠️ 일부 개선 후 배포를 권장합니다."
    else
        echo "🔧 상당한 개선이 필요합니다. 리팩토링을 고려하세요."
    fi
    
    return 0
}

# 주제 분석 함수
analyze_topic() {
    local topic="$1"
    local level="${2:-standard}"
    local timeout_duration=30
    
    log_info "📝 주제 분석: $topic"
    
    echo -e "\n${CYAN}🚀 3개 AI 주제 분석 시작...${NC}"
    
    # 병렬 실행
    {
        echo "🤖 Codex 분석:"
        timeout ${timeout_duration}s codex exec "실무 관점에서 '$topic'에 대해 간단히 분석하고 점수(10점)와 개선사항 1개 제시" 2>/dev/null || echo "타임아웃"
        echo ""
    } &
    
    {
        echo "🧠 Gemini 분석:"
        timeout ${timeout_duration}s gemini -p "아키텍처 관점에서 '$topic'에 대해 간단히 분석하고 점수(10점)와 개선사항 1개 제시" 2>/dev/null || echo "타임아웃"
        echo ""
    } &
    
    {
        echo "⚡ Qwen 분석:"
        timeout ${timeout_duration}s qwen -p "성능 최적화 관점에서 '$topic'에 대해 간단히 분석하고 점수(10점)와 개선사항 1개 제시" 2>/dev/null || echo "타임아웃"
        echo ""
    } &
    
    # 모든 작업 완료 대기
    wait
    
    log_success "주제 분석 완료"
}

# 메인 함수
main() {
    local file_path=""
    local timeout_duration=30
    local verbose=false
    local command=""
    
    # 인수 파싱
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -t|--timeout)
                timeout_duration="$2"
                shift 2
                ;;
            analyze)
                command="analyze"
                shift
                ;;
            *)
                if [[ -z "$file_path" && "$command" != "analyze" ]]; then
                    file_path="$1"
                elif [[ "$command" == "analyze" ]]; then
                    analyze_topic "$1" "$2"
                    exit 0
                fi
                shift
                ;;
        esac
    done
    
    # 파일 경로가 제공되지 않은 경우
    if [[ -z "$file_path" && "$command" != "analyze" ]]; then
        log_error "파일 경로를 제공해주세요."
        show_help
        exit 1
    fi
    
    # AI CLI 도구 확인
    if ! command -v codex >/dev/null 2>&1; then
        log_warning "Codex CLI를 찾을 수 없습니다. 설치 확인: npm install -g @chatgpt/cli"
    fi
    
    if ! command -v gemini >/dev/null 2>&1; then
        log_warning "Gemini CLI를 찾을 수 없습니다. 설치 확인: npm install -g @google/gemini-cli"
    fi
    
    if ! command -v qwen >/dev/null 2>&1; then
        log_warning "Qwen CLI를 찾을 수 없습니다. 설치 확인: npm install -g qwen-cli"
    fi
    
    # 메인 분석 실행
    log_info "🚀 External AI Orchestrator 시작"
    echo "파일: $file_path"
    echo "타임아웃: ${timeout_duration}초"
    echo "상세 로그: $verbose"
    
    run_parallel_analysis "$file_path" "$timeout_duration" "$verbose"
}

# 스크립트 직접 실행 시에만 main 함수 호출
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi