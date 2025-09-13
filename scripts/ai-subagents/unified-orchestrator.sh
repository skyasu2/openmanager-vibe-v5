#!/bin/bash
# 🎭 Unified Orchestrator - 통합 AI 교차검증 시스템
# 모든 서브에이전트 래퍼를 통합하는 단일 진입점

set -uo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 설정값
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION="2.0.0"
DEFAULT_TIMEOUT=30

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

log_header() {
    echo -e "\n${BOLD}${CYAN}$1${NC}"
    echo -e "${CYAN}$(printf '%.0s─' {1..50})${NC}"
}

# 사용법 표시
show_help() {
    cat << EOF
${BOLD}🎭 Unified Orchestrator v$VERSION${NC}
${CYAN}통합 AI 교차검증 시스템 - 모든 서브에이전트 래퍼 통합${NC}

${YELLOW}사용법:${NC}
  $0 verify <파일경로> [옵션]
  $0 test <AI이름> [파일경로]
  $0 status
  $0 --help

${YELLOW}검증 명령어:${NC}
  verify <파일>           자동 복잡도 판단으로 검증
  verify <파일> -l <레벨> 지정된 레벨로 검증
  verify <파일> -v        상세 로그 출력
  verify <파일> --force   에러 무시하고 강제 실행

${YELLOW}테스트 명령어:${NC}
  test codex <파일>       Codex 래퍼만 테스트
  test gemini <파일>      Gemini 래퍼만 테스트  
  test qwen <파일>        Qwen 래퍼만 테스트
  test all <파일>         모든 래퍼 순차 테스트

${YELLOW}유틸리티:${NC}
  status                  시스템 상태 및 래퍼 점검
  --help                  이 도움말 표시
  --version               버전 정보

${YELLOW}검증 레벨:${NC}
  Level 1: Claude 단독 (0-1점 복잡도, 50줄 미만)
  Level 2: Claude + AI 1개 (2-3점 복잡도, 50-200줄)
  Level 3: 전체 AI 교차검증 (4-5점 복잡도, 200줄+)

${YELLOW}예시:${NC}
  $0 verify src/components/Button.tsx
  $0 verify src/lib/auth.ts -l 3 -v
  $0 test codex src/api/route.ts
  $0 status

${YELLOW}래퍼 파일들:${NC}
  • verification-specialist-wrapper.sh (메인 진입점)
  • ai-verification-coordinator-wrapper.sh (Level 2-3 조정)
  • codex-wrapper.sh (ChatGPT Plus)
  • gemini-wrapper.sh (Google AI 무료)
  • qwen-wrapper.sh (OAuth 무료)
  • external-ai-orchestrator.sh (병렬 실행)
EOF
}

# 버전 정보 표시
show_version() {
    echo "Unified Orchestrator v$VERSION"
    echo "통합 AI 교차검증 시스템"
}

# 시스템 상태 확인
check_system_status() {
    log_header "🔍 시스템 상태 점검"
    
    local wrappers=(
        "verification-specialist-wrapper.sh:메인 진입점"
        "ai-verification-coordinator-wrapper.sh:Level 2-3 조정자"
        "codex-wrapper.sh:ChatGPT Plus"
        "gemini-wrapper.sh:Google AI 무료"
        "qwen-wrapper.sh:OAuth 무료"
        "external-ai-orchestrator.sh:병렬 실행"
    )
    
    local available_count=0
    local total_count=${#wrappers[@]}
    
    echo "래퍼 스크립트 상태:"
    for wrapper_info in "${wrappers[@]}"; do
        IFS=':' read -r wrapper_name description <<< "$wrapper_info"
        local wrapper_path="$SCRIPT_DIR/$wrapper_name"
        
        if [[ -x "$wrapper_path" ]]; then
            log_success "$wrapper_name - $description"
            ((available_count++))
        else
            log_error "$wrapper_name - 없음 또는 실행 권한 없음"
        fi
    done
    
    echo ""
    echo "래퍼 가용성: $available_count/$total_count"
    
    # AI CLI 도구 확인
    echo ""
    echo "AI CLI 도구 상태:"
    local cli_tools=("claude" "codex" "gemini" "qwen")
    local available_cli=0
    
    for tool in "${cli_tools[@]}"; do
        if command -v "$tool" >/dev/null 2>&1; then
            log_success "$tool CLI 사용 가능"
            ((available_cli++))
        else
            log_warning "$tool CLI 설치되지 않음"
        fi
    done
    
    echo ""
    echo "CLI 도구 가용성: $available_cli/${#cli_tools[@]}"
    
    # 의존성 확인
    echo ""
    echo "시스템 의존성:"
    local dependencies=("bc" "grep" "wc")
    for dep in "${dependencies[@]}"; do
        if command -v "$dep" >/dev/null 2>&1; then
            log_success "$dep 사용 가능"
        else
            log_error "$dep 설치 필요"
        fi
    done
    
    # 전체 상태 평가
    local total_health=$((available_count * 100 / total_count))
    echo ""
    echo "전체 시스템 상태: ${total_health}%"
    
    if [[ $total_health -ge 80 ]]; then
        echo -e "${GREEN}🎉 시스템이 정상적으로 작동합니다${NC}"
    elif [[ $total_health -ge 60 ]]; then
        echo -e "${YELLOW}⚠️ 일부 기능에 문제가 있습니다${NC}"
    else
        echo -e "${RED}🚨 시스템에 심각한 문제가 있습니다${NC}"
    fi
    
    return 0
}

# 단일 AI 래퍼 테스트
test_single_wrapper() {
    local ai_name="$1"
    local file_path="$2"
    
    local wrapper_path="$SCRIPT_DIR/${ai_name}-wrapper.sh"
    
    if [[ ! -x "$wrapper_path" ]]; then
        log_error "${ai_name}-wrapper.sh를 찾을 수 없습니다"
        return 1
    fi
    
    if [[ ! -f "$file_path" ]]; then
        log_error "파일을 찾을 수 없습니다: $file_path"
        return 1
    fi
    
    log_header "🧪 ${ai_name^} 래퍼 테스트"
    echo "파일: $(basename "$file_path")"
    echo "래퍼: $wrapper_path"
    echo ""
    
    # 래퍼 실행
    if "$wrapper_path" "$file_path"; then
        log_success "${ai_name^} 래퍼 테스트 성공"
        return 0
    else
        log_error "${ai_name^} 래퍼 테스트 실패"
        return 1
    fi
}

# 모든 래퍼 순차 테스트
test_all_wrappers() {
    local file_path="$1"
    local ai_names=("codex" "gemini" "qwen")
    local success_count=0
    
    log_header "🧪 모든 래퍼 순차 테스트"
    echo "파일: $(basename "$file_path")"
    echo ""
    
    for ai_name in "${ai_names[@]}"; do
        if test_single_wrapper "$ai_name" "$file_path"; then
            ((success_count++))
        fi
        echo ""
    done
    
    echo "테스트 결과: $success_count/${#ai_names[@]} 성공"
    
    if [[ $success_count -eq ${#ai_names[@]} ]]; then
        log_success "모든 래퍼 테스트 성공"
    elif [[ $success_count -gt 0 ]]; then
        log_warning "일부 래퍼만 성공"
    else
        log_error "모든 래퍼 테스트 실패"
    fi
    
    return $((${#ai_names[@]} - success_count))
}

# 통합 검증 실행
run_unified_verification() {
    local file_path="$1"
    local level="${2:-auto}"
    local verbose="${3:-false}"
    local force="${4:-false}"
    
    # 파일 존재 확인
    if [[ ! -f "$file_path" ]]; then
        log_error "파일을 찾을 수 없습니다: $file_path"
        return 1
    fi
    
    log_header "🎭 통합 AI 교차검증 시작"
    echo "파일: $(basename "$file_path")"
    echo "레벨: $level"
    echo "상세 로그: $verbose"
    echo "강제 실행: $force"
    echo ""
    
    # 메인 진입점 확인
    local main_wrapper="$SCRIPT_DIR/verification-specialist-wrapper.sh"
    if [[ ! -x "$main_wrapper" ]]; then
        log_error "verification-specialist-wrapper.sh를 찾을 수 없습니다"
        
        if [[ "$force" == "true" ]]; then
            log_warning "강제 실행 모드: ai-verification-coordinator로 대체 시도"
            local coordinator_wrapper="$SCRIPT_DIR/ai-verification-coordinator-wrapper.sh"
            
            if [[ -x "$coordinator_wrapper" ]]; then
                local coord_level="2"
                if [[ "$level" == "3" ]]; then
                    coord_level="3"
                fi
                
                "$coordinator_wrapper" "$file_path" "$coord_level"
                return $?
            else
                log_error "대체 래퍼도 찾을 수 없습니다"
                return 1
            fi
        else
            return 1
        fi
    fi
    
    # 메인 검증 실행
    local main_args=("$file_path")
    
    if [[ "$level" != "auto" ]]; then
        main_args+=("$level")
    fi
    
    if [[ "$verbose" == "true" ]]; then
        log_info "상세 로그 모드로 실행"
    fi
    
    # verification-specialist-wrapper 실행
    "$main_wrapper" "${main_args[@]}"
    local exit_code=$?
    
    if [[ $exit_code -eq 0 ]]; then
        log_success "통합 검증 완료"
    else
        log_error "통합 검증 실패 (exit code: $exit_code)"
        
        if [[ "$force" == "true" ]]; then
            log_warning "강제 실행 모드: 결과를 무시하고 성공으로 처리"
            exit_code=0
        fi
    fi
    
    return $exit_code
}

# 메인 함수
main() {
    local command=""
    local file_path=""
    local level="auto"
    local verbose="false"
    local force="false"
    local ai_name=""
    
    # 인수가 없으면 도움말 표시
    if [[ $# -eq 0 ]]; then
        show_help
        exit 0
    fi
    
    # 인수 파싱
    while [[ $# -gt 0 ]]; do
        case $1 in
            verify)
                command="verify"
                shift
                ;;
            test)
                command="test"
                shift
                if [[ $# -gt 0 ]]; then
                    ai_name="$1"
                    shift
                fi
                ;;
            status)
                command="status"
                shift
                ;;
            -l|--level)
                level="$2"
                shift 2
                ;;
            -v|--verbose)
                verbose="true"
                shift
                ;;
            --force)
                force="true"
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            --version)
                show_version
                exit 0
                ;;
            *)
                if [[ -z "$file_path" ]]; then
                    file_path="$1"
                fi
                shift
                ;;
        esac
    done
    
    # 명령어별 실행
    case $command in
        verify)
            if [[ -z "$file_path" ]]; then
                log_error "검증할 파일 경로를 제공해주세요."
                echo "사용법: $0 verify <파일경로> [옵션]"
                exit 1
            fi
            
            run_unified_verification "$file_path" "$level" "$verbose" "$force"
            ;;
            
        test)
            if [[ -z "$ai_name" ]]; then
                log_error "테스트할 AI를 지정해주세요."
                echo "사용법: $0 test <AI이름> <파일경로>"
                echo "AI 이름: codex, gemini, qwen, all"
                exit 1
            fi
            
            if [[ -z "$file_path" ]]; then
                log_error "테스트할 파일 경로를 제공해주세요."
                exit 1
            fi
            
            case $ai_name in
                codex|gemini|qwen)
                    test_single_wrapper "$ai_name" "$file_path"
                    ;;
                all)
                    test_all_wrappers "$file_path"
                    ;;
                *)
                    log_error "지원하지 않는 AI: $ai_name"
                    echo "지원되는 AI: codex, gemini, qwen, all"
                    exit 1
                    ;;
            esac
            ;;
            
        status)
            check_system_status
            ;;
            
        "")
            log_error "명령어를 지정해주세요."
            echo "사용법: $0 <명령어> [옵션]"
            echo "도움말: $0 --help"
            exit 1
            ;;
            
        *)
            log_error "알 수 없는 명령어: $command"
            echo "지원되는 명령어: verify, test, status"
            echo "도움말: $0 --help"
            exit 1
            ;;
    esac
}

# 스크립트 직접 실행 시에만 main 함수 호출
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi