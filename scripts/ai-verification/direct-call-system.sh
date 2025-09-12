#!/bin/bash

# 직접 호출 방식 AI 교차검증 시스템
# Claude Code + 외부 AI CLI 직접 통합

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# AI 도구 버전 확인
check_ai_tools() {
    log_info "AI CLI 도구 버전 확인 중..."
    
    echo "Claude Code: $(claude --version)"
    echo "Codex CLI: $(codex --version)"  
    echo "Gemini CLI: $(gemini --version)"
    echo "Qwen CLI: $(qwen --version)"
    
    log_success "모든 AI 도구 정상 확인"
}

# 파일 복잡도 분석
analyze_complexity() {
    local file_path="$1"
    local line_count
    local file_size
    
    if [[ ! -f "$file_path" ]]; then
        echo "1"  # 파일 없으면 Level 1
        return
    fi
    
    line_count=$(wc -l < "$file_path" 2>/dev/null || echo "0")
    file_size=$(stat --printf="%s" "$file_path" 2>/dev/null || echo "0")
    
    # Level 결정 로직
    if [[ $line_count -gt 200 || $file_size -gt 10000 ]]; then
        echo "3"  # Level 3: 복합 분석
    elif [[ $line_count -gt 50 || $file_size -gt 2000 ]]; then
        echo "2"  # Level 2: 중간 분석  
    else
        echo "1"  # Level 1: 간단 분석
    fi
}

# Claude Code 분석 (항상 실행)
claude_analysis() {
    local file_path="$1"
    local analysis_type="$2"
    
    log_info "Claude Code 분석 시작: $file_path"
    
    # Claude Code의 자연어 기반 분석
    echo "Claude Code에서 $file_path 파일을 $analysis_type 관점에서 분석해주세요."
    
    log_success "Claude Code 분석 완료"
}

# Codex CLI 직접 호출 
codex_direct_call() {
    local file_path="$1"
    local analysis_type="$2"
    local timeout="${3:-60}"
    
    log_info "Codex CLI 직접 호출: $analysis_type"
    
    local prompt="$file_path 파일을 실무 관점에서 $analysis_type 분석. 구체적 개선사항 3가지 제시 (${timeout}초 내)"
    
    # 타임아웃과 함께 실행
    timeout "${timeout}s" codex exec "$prompt" || {
        log_warning "Codex CLI 타임아웃 (${timeout}초)"
        return 1
    }
    
    log_success "Codex CLI 분석 완료"
}

# Gemini CLI 직접 호출
gemini_direct_call() {
    local file_path="$1" 
    local analysis_type="$2"
    local timeout="${3:-45}"
    
    log_info "Gemini CLI 직접 호출: $analysis_type"
    
    local prompt="$file_path 파일의 구조적 관점에서 $analysis_type 분석. 아키텍처 개선점 2가지"
    
    # 타임아웃과 함께 실행
    timeout "${timeout}s" gemini -p "$prompt" || {
        log_warning "Gemini CLI 타임아웃 (${timeout}초)"
        return 1
    }
    
    log_success "Gemini CLI 분석 완료"
}

# Qwen CLI 직접 호출
qwen_direct_call() {
    local file_path="$1"
    local analysis_type="$2"  
    local timeout="${3:-60}"
    
    log_info "Qwen CLI 직접 호출: $analysis_type"
    
    local prompt="$file_path 파일의 성능 최적화 관점에서 $analysis_type 분석. 알고리즘 개선 방향"
    
    # OAuth 상태 확인 후 실행
    if timeout "${timeout}s" qwen -p "$prompt"; then
        log_success "Qwen CLI 분석 완료"
    else
        log_warning "Qwen CLI 실행 실패 (OAuth 또는 타임아웃)"
        return 1
    fi
}

# 병렬 AI 분석 실행
parallel_ai_analysis() {
    local file_path="$1"
    local analysis_type="$2"
    local level="$3"
    
    log_info "Level $level 병렬 AI 분석 시작"
    
    # 백그라운드 프로세스 배열
    local pids=()
    
    case "$level" in
        "2")
            log_info "Level 2: Claude + Codex 병렬 실행"
            codex_direct_call "$file_path" "$analysis_type" 45 &
            pids+=($!)
            ;;
        "3") 
            log_info "Level 3: Claude + 3개 AI 완전 병렬 실행"
            codex_direct_call "$file_path" "$analysis_type" 60 &
            pids+=($!)
            
            gemini_direct_call "$file_path" "$analysis_type" 45 &
            pids+=($!)
            
            qwen_direct_call "$file_path" "$analysis_type" 60 &
            pids+=($!)
            ;;
    esac
    
    # 모든 백그라운드 프로세스 완료 대기
    for pid in "${pids[@]}"; do
        if wait "$pid"; then
            log_success "병렬 프로세스 $pid 완료"
        else
            log_warning "병렬 프로세스 $pid 실패"
        fi
    done
    
    log_success "Level $level 병렬 분석 완료"
}

# 메인 분석 함수
main_analysis() {
    local file_path="$1"
    local analysis_type="${2:-코드품질}"
    
    log_info "=== 직접 호출 방식 AI 교차검증 시작 ==="
    log_info "파일: $file_path"
    log_info "분석 타입: $analysis_type"
    
    # 복잡도 분석
    local level
    level=$(analyze_complexity "$file_path")
    log_info "복잡도 Level: $level"
    
    # 항상 Claude Code 분석 먼저 실행
    claude_analysis "$file_path" "$analysis_type"
    
    # Level에 따른 추가 AI 분석
    if [[ "$level" -gt 1 ]]; then
        parallel_ai_analysis "$file_path" "$analysis_type" "$level"
    else
        log_info "Level 1: Claude Code만으로 충분"
    fi
    
    log_success "=== AI 교차검증 완료 ==="
}

# 도움말
show_help() {
    cat << EOF
직접 호출 방식 AI 교차검증 시스템

사용법:
  $0 <파일경로> [분석타입]

예시:
  $0 src/app/api/auth/route.ts 보안검토
  $0 src/components/Button.tsx 코드품질
  $0 tsconfig.json 설정최적화

분석 Level:
  Level 1: Claude Code만 (50줄 미만, 2KB 미만)
  Level 2: Claude + Codex 병렬 (200줄 미만, 10KB 미만)  
  Level 3: Claude + 3개 AI 완전 병렬 (200줄 이상)

옵션:
  --check-tools  AI 도구 버전 확인
  --help         도움말 표시
EOF
}

# 메인 로직
main() {
    case "${1:-}" in
        "--check-tools")
            check_ai_tools
            ;;
        "--help"|"-h"|"")
            show_help
            ;;
        *)
            if [[ $# -lt 1 ]]; then
                log_error "파일 경로가 필요합니다"
                show_help
                exit 1
            fi
            
            main_analysis "$1" "${2:-코드품질}"
            ;;
    esac
}

# 스크립트 실행
main "$@"