#!/bin/bash
# 🔍 Verification Specialist Wrapper - AI 교차검증 메인 진입점
# Task 도구와 독립 스크립트 브릿지 역할

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

# 복잡도 분석 함수 (CLAUDE.md 기준)
analyze_complexity() {
    local file_path="$1"
    
    if [[ ! -f "$file_path" ]]; then
        echo 0
        return
    fi
    
    local lines=$(wc -l < "$file_path" 2>/dev/null || echo 0)
    local functions=$(grep -c "function\|const.*=.*(\|=>.*{" "$file_path" 2>/dev/null || echo 0)
    local imports=$(grep -c "import\|require\|from" "$file_path" 2>/dev/null || echo 0)
    
    # 복잡도 점수 계산 (0-5점)
    local complexity=0
    
    # 파일 크기 기준
    if [[ $lines -gt 200 ]]; then complexity=$((complexity + 2)); fi
    if [[ $lines -gt 100 ]]; then complexity=$((complexity + 1)); fi
    
    # 함수 개수 기준  
    if [[ $functions -gt 15 ]]; then complexity=$((complexity + 1)); fi
    if [[ $functions -gt 8 ]]; then complexity=$((complexity + 1)); fi
    
    # Import 개수 기준
    if [[ $imports -gt 20 ]]; then complexity=$((complexity + 1)); fi
    
    # 중요 파일 패턴 검사 (보안/인증/결제)
    if [[ "$file_path" =~ (auth|payment|api.*route|login|security|admin) ]]; then
        complexity=$((complexity + 2))
    fi
    
    echo $complexity
}

# Level 결정 함수
determine_level() {
    local complexity="$1"
    local file_path="$2"
    
    if [[ $complexity -le 1 ]]; then
        echo "1"
    elif [[ $complexity -le 3 ]]; then
        echo "2"
    else
        echo "3"
    fi
}

# 내장 verification-specialist 시도 (실제 Task 도구)
try_builtin_verification() {
    local file_path="$1"
    local level="$2"
    
    log_info "내장 verification-specialist 시도..."
    
    # Claude Code 내장 에이전트는 직접 호출할 수 없으므로
    # 사용자가 Task 도구를 사용하도록 안내
    case $level in
        1)
            echo "💡 Claude 직접 분석을 권장합니다:"
            echo "Task verification-specialist \"$(basename "$file_path") 파일 품질 분석\""
            ;;
        2|3)
            echo "💡 내장 서브에이전트 사용을 권장합니다:"
            echo "Task verification-specialist \"$(basename "$file_path") 종합 검증\""
            echo "Task code-review-specialist \"$(basename "$file_path") 코드 리뷰\""
            echo "Task security-auditor \"$(basename "$file_path") 보안 검토\""
            ;;
    esac
    
    return 1  # fallback으로 독립 스크립트 실행
}

# 독립 스크립트 fallback
run_independent_verification() {
    local file_path="$1"
    local level="$2"
    
    log_info "독립 스크립트로 검증 실행..."
    
    local script_dir="$(dirname "$0")"
    
    case $level in
        1)
            echo "🔍 Level 1: Claude 단독 검증"
            echo "복잡도가 낮은 파일입니다. Claude Code의 기본 분석으로 충분합니다."
            ;;
        2)
            echo "🔍 Level 2: Claude + AI 1개 검증"
            if [[ -x "$script_dir/codex-wrapper.sh" ]]; then
                "$script_dir/codex-wrapper.sh" "$file_path"
            else
                log_warning "codex-wrapper.sh를 찾을 수 없어 기본 검증으로 대체"
            fi
            ;;
        3)
            echo "🔍 Level 3: 전체 AI 교차검증"
            if [[ -x "$script_dir/external-ai-orchestrator.sh" ]]; then
                "$script_dir/external-ai-orchestrator.sh" "$file_path"
            else
                log_warning "external-ai-orchestrator.sh를 찾을 수 없어 개별 AI 검증 실행"
                # 개별 AI 래퍼들 순차 실행
                for wrapper in codex-wrapper.sh gemini-wrapper.sh qwen-wrapper.sh; do
                    if [[ -x "$script_dir/$wrapper" ]]; then
                        echo -e "\n${CYAN}=== $wrapper 실행 ===${NC}"
                        "$script_dir/$wrapper" "$file_path"
                    fi
                done
            fi
            ;;
    esac
}

# 메인 검증 함수
perform_verification() {
    local file_path="$1"
    local force_level="${2:-auto}"
    
    # 파일 존재 확인
    if [[ ! -f "$file_path" ]]; then
        log_error "파일을 찾을 수 없습니다: $file_path"
        return 1
    fi
    
    # 복잡도 분석
    local complexity
    complexity=$(analyze_complexity "$file_path")
    
    # Level 결정
    local level
    if [[ "$force_level" == "auto" ]]; then
        level=$(determine_level "$complexity" "$file_path")
    else
        level="$force_level"
    fi
    
    local file_size=$(wc -l < "$file_path" 2>/dev/null || echo 0)
    local filename=$(basename "$file_path")
    
    # 검증 시작 메시지
    echo -e "\n${CYAN}🔍 AI 교차검증 시작${NC}"
    echo "─────────────────────────────────────"
    echo "파일: $filename (${file_size}줄)"
    echo "복잡도: ${complexity}/5"
    echo "검증 레벨: Level $level"
    
    case $level in
        1) echo "방식: Claude 단독 검증" ;;
        2) echo "방식: Claude + AI 1개 검증" ;;
        3) echo "방식: 전체 AI 교차검증 (Codex + Gemini + Qwen)" ;;
    esac
    
    echo ""
    
    # 내장 verification-specialist 안내 후 독립 스크립트 실행
    if ! try_builtin_verification "$file_path" "$level"; then
        log_info "독립 AI 교차검증 스크립트 실행"
        run_independent_verification "$file_path" "$level"
    fi
    
    log_success "검증 완료"
    return 0
}

# 도움말 표시
show_help() {
    cat << EOF
🔍 Verification Specialist Wrapper - AI 교차검증 메인 진입점

사용법:
  $0 <파일경로> [레벨]
  $0 -h | --help

레벨:
  auto    자동 복잡도 판단 (기본값)
  1       Level 1: Claude 단독
  2       Level 2: Claude + AI 1개  
  3       Level 3: 전체 AI 교차검증

예시:
  $0 src/components/Button.tsx
  $0 src/lib/auth.ts 3
  $0 src/api/route.ts auto

Level 자동 판단 기준:
  • Level 1: 0-1점 (50줄 미만, 간단한 컴포넌트)
  • Level 2: 2-3점 (50-200줄, 중간 복잡도)  
  • Level 3: 4-5점 (200줄+, 보안/인증 관련)

복잡도 계산:
  • 파일 크기: 100줄+ (+1), 200줄+ (+2)
  • 함수 개수: 8개+ (+1), 15개+ (+1)
  • Import 개수: 20개+ (+1)
  • 중요 파일: auth/payment/api (+2)
EOF
}

# 메인 함수
main() {
    local file_path=""
    local level="auto"
    
    # 인수 파싱
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            1|2|3|auto)
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
    
    log_info "🚀 Verification Specialist Wrapper 시작"
    
    # 메인 검증 실행
    perform_verification "$file_path" "$level"
}

# 함수 export (다른 스크립트에서 사용 가능)
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    # 소스되는 경우 함수만 export
    export -f perform_verification
    export -f analyze_complexity
    export -f determine_level
    export -f log_info log_success log_warning log_error
else
    # 직접 실행되는 경우 main 함수 호출
    main "$@"
fi