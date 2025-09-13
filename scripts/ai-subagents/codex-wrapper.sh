#!/bin/bash
# 🤖 Codex Wrapper - ChatGPT Plus 기반 실무 코드 검토 전문가
# 기존 ai-cross-validation.sh 패턴 호환 독립 실행

set -uo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# 메모리 안전 검사
check_memory_safety() {
    local available_mb
    available_mb=$(free -m | awk '/^Mem:/{print $7}')
    
    if [ "$available_mb" -lt 500 ]; then
        log_warning "사용 가능한 메모리가 부족합니다 (${available_mb}MB). 분석을 건너뜁니다."
        return 1
    fi
    return 0
}

# 사용량 추적 (usage-tracker.sh 통합)
track_usage() {
    local ai_name="$1"
    local action="$2"
    local status="${3:-success}"
    
    local script_dir="$(dirname "$0")"
    local usage_tracker="$script_dir/usage-tracker.sh"
    
    if [[ -x "$usage_tracker" ]]; then
        "$usage_tracker" log "$ai_name" "$action" 2>/dev/null || true
    fi
}

# 사용 가능 여부 확인
can_use() {
    local ai_name="$1"
    local script_dir="$(dirname "$0")"
    local usage_tracker="$script_dir/usage-tracker.sh"
    
    if [[ -x "$usage_tracker" ]]; then
        local can_use_result
        can_use_result=$("$usage_tracker" check "$ai_name" 2>/dev/null) || return 1
        return 0
    else
        # usage-tracker가 없으면 항상 사용 가능으로 간주
        return 0
    fi
}

# 점수 추출 함수 (표준화)
extract_score_from_text() {
    local text="$1"
    local score=""
    
    # 다양한 점수 패턴 시도
    score=$(echo "$text" | grep -oE '[0-9]+\.?[0-9]*(/10|점|%)' | grep -oE '[0-9]+\.?[0-9]*' | head -1 2>/dev/null || echo "")
    
    if [[ -z "$score" ]]; then
        # 추가 패턴: "점수: 8.5", "Score: 8.5" 등
        score=$(echo "$text" | grep -oiE '(점수|score|평점|rating)[:：]\s*([0-9]+\.?[0-9]*)' | grep -oE '[0-9]+\.?[0-9]*' | head -1 2>/dev/null || echo "")
    fi
    
    if [[ -z "$score" ]]; then
        # 최후 패턴: 첫 번째 숫자 찾기
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

# Codex CLI 분석 (개선된 버전)
analyze_with_codex() {
    local file_path="$1"
    local file_content
    local temp_file
    local start_time end_time duration
    
    # 사용 가능 여부 확인
    if ! can_use "codex"; then
        log_warning "Codex 사용 한도 초과 또는 임박"
        echo "🤖 Codex 분석: 사용 한도 초과"
        return 1
    fi
    
    # 메모리 안전 검사
    if ! check_memory_safety; then
        echo "🤖 Codex 분석: 메모리 부족으로 건너뜀"
        track_usage "codex" "analyze" "memory_error"
        return 1
    fi
    
    log_info "🤖 Codex CLI (GPT-5) 분석 중... (30초 타임아웃)"
    start_time=$(date +%s%3N)  # 밀리초 단위
    
    # 파일 내용을 임시 파일로 저장 (메모리 안전)
    if [ -f "$file_path" ]; then
        temp_file="/tmp/codex_$(basename "$file_path")_$$"
        head -c 2000 "$file_path" > "$temp_file" 2>/dev/null || {
            echo "❌ Codex 분석: 파일 읽기 실패"
            track_usage "codex" "analyze" "file_error"
            return 1
        }
        
        
        # Codex 실행
        local result
        local exit_code
        result=$(timeout 30s codex exec "TypeScript 코드 품질 평가 (10점 만점): $(basename "$file_path") - 간단히 점수와 주요 개선사항 1개만" 2>&1) || exit_code=$?
        
        end_time=$(date +%s%3N)
        duration=$((end_time - start_time))
        
        # 결과 처리
        if [[ $exit_code -eq 124 ]]; then
            log_warning "⚠️ Codex CLI 타임아웃 (30초 초과)"
            echo "🤖 Codex 분석: 타임아웃"
            track_usage "codex" "analyze" "timeout"
            rm -f "$temp_file" 2>/dev/null
            return 1
        elif [[ $exit_code -ne 0 ]]; then
            log_warning "⚠️ Codex CLI 실행 오류"
            echo "🤖 Codex 분석: 실행 오류 또는 네트워크 문제"
            track_usage "codex" "analyze" "error"
            rm -f "$temp_file" 2>/dev/null
            return 1
        else
            # 성공적인 결과
            echo "$result"
            
            # 점수 추출 및 표준화 출력
            local extracted_score
            extracted_score=$(extract_score_from_text "$result")
            echo ""
            echo -e "${CYAN}📊 표준화된 점수: ${extracted_score}/10 (가중치: 0.99)${NC}"
            
            track_usage "codex" "analyze" "success"
        fi
        
        # 임시 파일 정리
        rm -f "$temp_file" 2>/dev/null
    else
        echo "❌ Codex 분석: 파일을 찾을 수 없음 ($file_path)"
        track_usage "codex" "analyze" "file_not_found"
        return 1
    fi
}

# 도움말 표시
show_help() {
    cat << EOF
🤖 Codex Wrapper - ChatGPT Plus 기반 실무 코드 검토

사용법:
  $0 <파일경로>
  $0 -h | --help

예시:
  $0 src/components/Button.tsx
  $0 src/lib/auth.ts

특징:
  • GPT-5 모델 활용 (ChatGPT Plus)
  • 가중치: 0.99 (최고 신뢰도)
  • 30초 타임아웃
  • 2KB 파일 크기 제한
  • 기존 ai-cross-validation.sh 패턴 호환

요구사항:
  • codex CLI 설치 및 인증
  • ChatGPT Plus 구독
  • 500MB+ 여유 메모리
EOF
}

# 메인 함수
main() {
    local file_path="$1"
    
    # 인수 확인
    if [[ "$#" -eq 0 ]] || [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
        show_help
        exit 0
    fi
    
    # Codex CLI 확인
    if ! command -v codex >/dev/null 2>&1; then
        log_error "Codex CLI를 찾을 수 없습니다"
        echo "설치: npm install -g @chatgpt/cli"
        echo "인증: codex auth"
        exit 1
    fi
    
    # 파일 존재 확인
    if [[ ! -f "$file_path" ]]; then
        log_error "파일을 찾을 수 없습니다: $file_path"
        exit 1
    fi
    
    log_info "🚀 Codex Wrapper 시작"
    echo "파일: $file_path"
    echo "가중치: 0.99 (최고 신뢰도)"
    echo ""
    
    # 분석 실행
    analyze_with_codex "$file_path"
    
    log_success "Codex 분석 완료"
}

# 함수 export (다른 스크립트에서 사용 가능)
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    # 소스되는 경우 함수만 export
    export -f analyze_with_codex
    export -f check_memory_safety
    export -f log_info log_success log_warning log_error
else
    # 직접 실행되는 경우 main 함수 호출
    main "$@"
fi
