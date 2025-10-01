#!/bin/bash
# 🤖 Gemini Wrapper - Google AI 무료 아키텍처 분석 전문가
# 기존 ai-cross-validation.sh 패턴 호환 독립 실행

set -uo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

# Performance Log 기록 (Phase 1 최적화: 일자별 롤링)
log_performance() {
    local ai_name="$1"
    local duration_ms="$2"
    local script_dir="$(dirname "$(dirname "$0")")"  # scripts/ 디렉토리
    local project_root="$(dirname "$script_dir")"    # 프로젝트 루트
    local perf_log="$project_root/logs/ai-perf/ai-perf-$(date +%F).log"

    # logs/ai-perf 디렉토리 생성
    mkdir -p "$project_root/logs/ai-perf" 2>/dev/null || true

    # JSON 포맷으로 로그 기록
    local timestamp=$(date +%s)
    echo "{\"ai\":\"$ai_name\",\"duration_ms\":$duration_ms,\"timestamp\":$timestamp}" >> "$perf_log" 2>/dev/null || true
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

# Gemini CLI 분석 (개선된 버전)
analyze_with_gemini() {
    local file_path="$1"
    local file_content
    local temp_file
    local start_time end_time duration

    # 사용 가능 여부 확인
    if ! can_use "gemini"; then
        log_warning "Gemini 사용 한도 초과 또는 임박"
        echo "🤖 Gemini 분석: 사용 한도 초과"
        return 1
    fi

    # 메모리 안전 검사
    if ! check_memory_safety; then
        echo "🤖 Gemini 분석: 메모리 부족으로 건너뜀"
        track_usage "gemini" "analyze" "memory_error"
        return 1
    fi

    log_info "🤖 Gemini CLI (구조+아키텍처) 분석 중... (45초 타임아웃)"
    start_time=$(date +%s%3N)  # 밀리초 단위

    # 파일 내용을 임시 파일로 저장 (메모리 안전)
    if [ -f "$file_path" ]; then
        temp_file="/tmp/gemini_$(basename "$file_path")_$$"
        head -c 6000 "$file_path" > "$temp_file" 2>/dev/null || {
            echo "❌ Gemini 분석: 파일 읽기 실패"
            track_usage "gemini" "analyze" "file_error"
            return 1
        }

        # Gemini 실행 (improved 버전 프롬프트 사용)
        local result
        local exit_code=0
        result=$(timeout 45s gemini -p "
구조적 관점에서 TypeScript 코드 분석:

파일: $(basename "$file_path")
---
$(cat "$temp_file")
---

분석 형식:
점수: X.X/10
구조적 장점: [아키텍처 관점 2개]
리팩토링 제안: [구조 개선사항 2개]
확장성: [확장성 평가 또는 '좋음']
" 2>&1) || exit_code=$?

        end_time=$(date +%s%3N)
        duration=$((end_time - start_time))

        # 결과 처리
        if [[ $exit_code -eq 124 ]]; then
            log_warning "⚠️ Gemini CLI 타임아웃 (45초 초과)"
            echo "🤖 Gemini 분석: 타임아웃"

            # Phase 1: 타임아웃도 performance log 기록
            log_performance "gemini" "45000"

            track_usage "gemini" "analyze" "timeout"
            rm -f "$temp_file" 2>/dev/null
            return 1
        elif [[ $exit_code -ne 0 ]]; then
            log_warning "⚠️ Gemini CLI 실행 오류"
            echo "🤖 Gemini 분석: 실행 오류 또는 네트워크 문제"

            # Phase 1: 오류도 performance log 기록
            log_performance "gemini" "$duration"

            track_usage "gemini" "analyze" "error"
            rm -f "$temp_file" 2>/dev/null
            return 1
        else
            # 성공적인 결과
            echo "$result"

            # 점수 추출 및 표준화 출력
            local extracted_score
            extracted_score=$(extract_score_from_text "$result")
            echo ""
            echo -e "${CYAN}📊 표준화된 점수: ${extracted_score}/10 (가중치: 0.98)${NC}"

            # Phase 1: Performance log 기록
            log_performance "gemini" "$duration"

            track_usage "gemini" "analyze" "success"
        fi

        # 임시 파일 정리
        rm -f "$temp_file" 2>/dev/null
    else
        echo "❌ Gemini 분석: 파일을 찾을 수 없음 ($file_path)"
        track_usage "gemini" "analyze" "file_not_found"
        return 1
    fi
}

# 도움말 표시
show_help() {
    cat << EOF
🧠 Gemini Wrapper - Google AI 무료 아키텍처 분석

사용법:
  $0 <파일경로>
  $0 -h | --help

예시:
  $0 src/components/ServerCard.tsx
  $0 src/lib/architecture.ts

특징:
  • Google AI 무료 서비스
  • 가중치: 0.98 (높은 신뢰도)
  • 45초 타임아웃 (Phase 1 최적화)
  • 6KB 파일 크기 제한
  • 기존 ai-cross-validation.sh 패턴 호환

분석 영역:
  • 모듈 구조 및 책임 분리
  • 디자인 패턴 적용성
  • 확장성 및 재사용성
  • 의존성 관리

요구사항:
  • gemini CLI 설치 및 인증
  • Google 계정 로그인 (API 사용 금지)
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

    # Gemini CLI 확인
    if ! command -v gemini >/dev/null 2>&1; then
        log_error "Gemini CLI를 찾을 수 없습니다"
        echo "설치: npm install -g @google/gemini-cli"
        echo "인증: gemini auth (Google 계정 필요)"
        exit 1
    fi

    # 파일 존재 확인
    if [[ ! -f "$file_path" ]]; then
        log_error "파일을 찾을 수 없습니다: $file_path"
        exit 1
    fi

    log_info "🚀 Gemini Wrapper 시작"
    echo "파일: $file_path"
    echo "가중치: 0.98 (구조 분석 전문)"
    echo "한도: 1,000회/일 무료"
    echo ""

    # 분석 실행
    analyze_with_gemini "$file_path"

    log_success "Gemini 분석 완료"
}

# 함수 export (다른 스크립트에서 사용 가능)
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    # 소스되는 경우 함수만 export
    export -f analyze_with_gemini
    export -f check_memory_safety
    export -f log_info log_success log_warning log_error
else
    # 직접 실행되는 경우 main 함수 호출
    main "$@"
fi
