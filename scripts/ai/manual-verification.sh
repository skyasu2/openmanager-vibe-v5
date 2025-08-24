#!/bin/bash

# 🤖 수동 AI 교차 검증 스크립트
# 사용법: ./manual-verification.sh [모드] [대상]

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 도움말 표시
show_help() {
    echo -e "${CYAN}🤖 수동 AI 교차 검증 스크립트${NC}"
    echo ""
    echo -e "${YELLOW}사용법:${NC}"
    echo "  ./manual-verification.sh [모드] [대상]"
    echo ""
    echo -e "${YELLOW}모드 종류:${NC}"
    echo -e "  ${GREEN}research${NC}   - 자료 조사 (기술 스택, 라이브러리 분석)"
    echo -e "  ${GREEN}review${NC}     - 코드 리뷰 (Level 2 표준 검토)"
    echo -e "  ${GREEN}improve${NC}    - 개선 방법 제안"
    echo -e "  ${GREEN}verify${NC}     - 전체 교차 검증 (Level 3)"
    echo -e "  ${GREEN}quick${NC}      - 빠른 검토 (Level 1)"
    echo -e "  ${GREEN}security${NC}   - 보안 검토 전문"
    echo -e "  ${GREEN}performance${NC}- 성능 분석 전문"
    echo ""
    echo -e "${YELLOW}예시:${NC}"
    echo "  ./manual-verification.sh research \"React 18 Server Components\""
    echo "  ./manual-verification.sh review \"src/app/login/page.tsx\""
    echo "  ./manual-verification.sh improve \"성능 최적화 방법\""
    echo "  ./manual-verification.sh verify \"src/app/api/auth/route.ts\""
    echo ""
    echo -e "${YELLOW}AI 전문가별 직접 호출:${NC}"
    echo "  ./manual-verification.sh gemini \"코드 검토 요청\""
    echo "  ./manual-verification.sh codex \"버그 분석 요청\""
    echo "  ./manual-verification.sh qwen \"성능 분석 요청\""
    echo ""
}

# 로그 함수
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

# Claude가 설치되어 있는지 확인
check_claude() {
    if ! command -v claude &> /dev/null; then
        log_error "Claude Code가 설치되지 않았습니다."
        log_info "설치 방법: https://claude.ai/code"
        exit 1
    fi
}

# Task 명령어 실행
execute_task() {
    local agent="$1"
    local prompt="$2"
    
    log_info "AI 에이전트 실행 중: ${agent}"
    log_info "요청 내용: ${prompt}"
    echo ""
    
    # Claude의 Task 도구를 사용하여 서브에이전트 호출
    claude --non-interactive << EOF
Task ${agent} "${prompt}"
EOF
    
    if [ $? -eq 0 ]; then
        log_success "AI 분석이 완료되었습니다."
    else
        log_error "AI 분석 중 오류가 발생했습니다."
        exit 1
    fi
}

# 메인 로직
main() {
    # 인자 확인
    if [ $# -eq 0 ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
        show_help
        exit 0
    fi
    
    if [ $# -lt 2 ]; then
        log_error "모드와 대상을 모두 지정해야 합니다."
        show_help
        exit 1
    fi
    
    local mode="$1"
    local target="$2"
    
    # Claude 설치 확인
    check_claude
    
    echo -e "${PURPLE}🚀 수동 AI 교차 검증 시작${NC}"
    echo -e "모드: ${CYAN}${mode}${NC}"
    echo -e "대상: ${CYAN}${target}${NC}"
    echo ""
    
    case "$mode" in
        "research")
            log_info "자료 조사 모드 - verification-specialist 사용"
            execute_task "verification-specialist" "${target}에 대한 자료 조사 및 분석"
            ;;
        "review")
            log_info "코드 리뷰 모드 - ai-verification-coordinator Level 2"
            execute_task "ai-verification-coordinator" "${target} 표준 리뷰 (Level 2)"
            ;;
        "improve")
            log_info "개선 방법 제안 모드 - external-ai-orchestrator 사용"
            execute_task "external-ai-orchestrator" "${target}에 대한 개선 방법 제안"
            ;;
        "verify")
            log_info "전체 교차 검증 모드 - ai-verification-coordinator Level 3"
            execute_task "ai-verification-coordinator" "${target} 전체 교차 검증 (Level 3)"
            ;;
        "quick")
            log_info "빠른 검토 모드 - verification-specialist Level 1"
            execute_task "verification-specialist" "${target} 빠른 검토 (Level 1)"
            ;;
        "security")
            log_info "보안 검토 모드 - codex-wrapper 전문 분석"
            execute_task "codex-wrapper" "${target} 보안 취약점 및 보안 이슈 검토"
            ;;
        "performance")
            log_info "성능 분석 모드 - qwen-wrapper 전문 분석"
            execute_task "qwen-wrapper" "${target} 성능 최적화 및 알고리즘 분석"
            ;;
        "gemini")
            log_info "Gemini 전용 모드"
            execute_task "gemini-wrapper" "${target}"
            ;;
        "codex")
            log_info "Codex 전용 모드"
            execute_task "codex-wrapper" "${target}"
            ;;
        "qwen")
            log_info "Qwen 전용 모드"
            execute_task "qwen-wrapper" "${target}"
            ;;
        *)
            log_error "알 수 없는 모드: ${mode}"
            echo ""
            show_help
            exit 1
            ;;
    esac
    
    echo ""
    log_success "AI 교차 검증이 완료되었습니다!"
    log_info "자세한 사용법은 docs/ai-tools/manual-ai-verification-guide.md를 참고하세요."
}

# 스크립트 실행
main "$@"