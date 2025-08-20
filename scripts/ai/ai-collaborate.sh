#!/bin/bash

# 🤖 AI Collaboration System v2.0
# Claude Code Max + Gemini + Codex + Qwen 협력 시스템
# 
# 작업 크기와 중요도에 따른 자동 검토 레벨 결정
# Claude Code 베스트 프랙티스 적용
#
# @author Claude Code + Multi-AI 협업
# @created 2025-08-20

set -e

# === 색상 코드 ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# === 설정 ===
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
REPORTS_DIR="$PROJECT_ROOT/reports/ai-reviews"
LOG_FILE="$PROJECT_ROOT/logs/ai-collaborate.log"

# === 배너 표시 ===
show_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     🤖 AI Collaboration System v2.0                     ║
║                                                          ║
║     Claude Code Max + Gemini + Codex + Qwen             ║
║     자동 검토 레벨 결정 및 협력 개발                    ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# === 도움말 표시 ===
show_help() {
    cat << EOF

사용법: $(basename $0) <command> [options]

${BLUE}명령어:${NC}
  ${GREEN}review${NC} <files...>      특정 파일 검토
  ${GREEN}watch${NC}                  파일 변경 감시 및 자동 검토
  ${GREEN}commit${NC} <hash>          커밋 검토
  ${GREEN}pr${NC} <number>            Pull Request 검토
  ${GREEN}analyze${NC} <files...>     작업 분석 (검토 레벨 확인)
  ${GREEN}status${NC}                 AI 사용량 현황
  ${GREEN}report${NC}                 검토 보고서 목록
  ${GREEN}daily${NC}                  일일 요약 생성
  ${GREEN}test${NC}                   시스템 테스트
  ${GREEN}setup${NC}                  초기 설정

${BLUE}옵션:${NC}
  --auto                  자동 모드 (확인 없이 적용)
  --focus <type>          검토 초점 (security/performance/architecture)
  --level <1-3>           검토 레벨 강제 지정
  --ai <name>             특정 AI만 사용 (gemini/codex/qwen)
  --verbose               상세 로그 출력
  --dry-run               실행 시뮬레이션

${BLUE}예시:${NC}
  $(basename $0) review src/app/api/auth/route.ts
  $(basename $0) watch --auto
  $(basename $0) commit HEAD --focus security
  $(basename $0) pr 123 --level 3
  $(basename $0) analyze src/**/*.ts
  $(basename $0) status

${BLUE}검토 레벨 자동 결정 기준:${NC}
  Level 1 (1 AI):   < 50줄, 낮은 중요도
  Level 2 (2 AI):   50-200줄, 중간 중요도
  Level 3 (3 AI):   > 200줄, 높은 중요도 또는 중요 파일

${BLUE}중요 파일 (자동 Level 3):${NC}
  - *.config.*, .env*, package.json
  - auth/*, login/*, session/*
  - api/*, routes/*, controllers/*
  - security/*, crypto/*, keys/*

EOF
}

# === 로그 함수 ===
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 로그 파일에 기록
    mkdir -p $(dirname "$LOG_FILE")
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    # 콘솔 출력
    case $level in
        ERROR)
            echo -e "${RED}❌ $message${NC}" >&2
            ;;
        WARNING)
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        SUCCESS)
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        INFO)
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
        DEBUG)
            if [ "$VERBOSE" = true ]; then
                echo -e "${WHITE}🔍 $message${NC}"
            fi
            ;;
    esac
}

# === 의존성 확인 ===
check_dependencies() {
    log INFO "의존성 확인 중..."
    
    local missing=()
    
    # Node.js 확인
    if ! command -v node &> /dev/null; then
        missing+=("Node.js")
    fi
    
    # AI CLI 도구 확인
    if ! command -v gemini &> /dev/null; then
        missing+=("Gemini CLI")
    fi
    
    if ! command -v codex-cli &> /dev/null && ! command -v codex &> /dev/null; then
        missing+=("Codex CLI")
    fi
    
    if ! command -v qwen &> /dev/null; then
        missing+=("Qwen CLI")
    fi
    
    # Git 확인
    if ! command -v git &> /dev/null; then
        missing+=("Git")
    fi
    
    # jq 확인 (JSON 파싱용)
    if ! command -v jq &> /dev/null; then
        missing+=("jq")
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        log ERROR "다음 도구가 설치되지 않았습니다: ${missing[*]}"
        log INFO "설치 방법:"
        echo "  sudo apt-get update"
        echo "  sudo apt-get install -y nodejs git jq"
        echo "  npm install -g @google/gemini-cli"
        echo "  npm install -g @codex/codex-cli"
        echo "  npm install -g @qwen-code/qwen-cli"
        return 1
    fi
    
    log SUCCESS "모든 의존성이 설치되어 있습니다"
    return 0
}

# === 환경변수 로드 ===
load_environment() {
    if [ -f "$PROJECT_ROOT/.env.local" ]; then
        log DEBUG "환경변수 로드 중..."
        export $(grep -v '^#' "$PROJECT_ROOT/.env.local" | xargs) 2>/dev/null || true
    else
        log WARNING ".env.local 파일이 없습니다"
    fi
}

# === 파일 검토 ===
review_files() {
    local files=("$@")
    
    if [ ${#files[@]} -eq 0 ]; then
        log ERROR "검토할 파일을 지정해주세요"
        return 1
    fi
    
    log INFO "${#files[@]}개 파일 검토 시작..."
    
    # Node.js 스크립트 실행
    cd "$PROJECT_ROOT"
    node "$SCRIPTS_DIR/ai/ai-collaboration-workflow.mjs" review "${files[@]}" $EXTRA_OPTS
}

# === 파일 감시 ===
watch_files() {
    log INFO "파일 변경 감시 모드 시작..."
    log INFO "종료하려면 Ctrl+C를 누르세요"
    
    cd "$PROJECT_ROOT"
    node "$SCRIPTS_DIR/ai/ai-collaboration-workflow.mjs" watch $EXTRA_OPTS
}

# === 커밋 검토 ===
review_commit() {
    local commit=${1:-HEAD}
    
    log INFO "커밋 검토: $commit"
    
    cd "$PROJECT_ROOT"
    node "$SCRIPTS_DIR/ai/ai-collaboration-workflow.mjs" commit "$commit" $EXTRA_OPTS
}

# === PR 검토 ===
review_pr() {
    local pr_number=$1
    
    if [ -z "$pr_number" ]; then
        log ERROR "PR 번호를 지정해주세요"
        return 1
    fi
    
    log INFO "Pull Request #$pr_number 검토..."
    
    cd "$PROJECT_ROOT"
    node "$SCRIPTS_DIR/ai/ai-collaboration-workflow.mjs" pr "$pr_number" $EXTRA_OPTS
}

# === 작업 분석 ===
analyze_task() {
    local files=("$@")
    
    if [ ${#files[@]} -eq 0 ]; then
        log ERROR "분석할 파일을 지정해주세요"
        return 1
    fi
    
    log INFO "${#files[@]}개 파일 분석 중..."
    
    cd "$PROJECT_ROOT"
    node "$SCRIPTS_DIR/ai/ai-review-system.mjs" analyze "${files[@]}"
}

# === AI 사용량 현황 ===
show_status() {
    log INFO "AI 사용량 현황 확인..."
    
    cd "$PROJECT_ROOT"
    node "$SCRIPTS_DIR/ai/ai-review-system.mjs" status
    
    # Claude Code 사용량도 표시
    if command -v ccusage &> /dev/null; then
        echo ""
        echo -e "${CYAN}=== Claude Code 사용량 ===${NC}"
        ccusage daily
    fi
}

# === 보고서 목록 ===
list_reports() {
    log INFO "검토 보고서 목록..."
    
    cd "$PROJECT_ROOT"
    node "$SCRIPTS_DIR/ai/ai-review-reporter.mjs" list --limit 20
}

# === 일일 요약 ===
generate_daily() {
    log INFO "일일 요약 생성 중..."
    
    cd "$PROJECT_ROOT"
    node "$SCRIPTS_DIR/ai/ai-review-reporter.mjs" daily
}

# === 시스템 테스트 ===
test_system() {
    log INFO "AI 협력 시스템 테스트 시작..."
    
    echo -e "\n${CYAN}1. 의존성 체크${NC}"
    check_dependencies || return 1
    
    echo -e "\n${CYAN}2. AI CLI 도구 테스트${NC}"
    
    # Gemini 테스트
    echo -n "  Gemini CLI: "
    if gemini --version &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi
    
    # Codex 테스트
    echo -n "  Codex CLI: "
    if codex-cli --version &> /dev/null || codex --version &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi
    
    # Qwen 테스트
    echo -n "  Qwen CLI: "
    if qwen --version &> /dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi
    
    echo -e "\n${CYAN}3. 스크립트 모듈 테스트${NC}"
    
    # 각 모듈 존재 확인
    local modules=(
        "ai-review-system.mjs"
        "ai-collaboration-workflow.mjs"
        "ai-review-reporter.mjs"
    )
    
    for module in "${modules[@]}"; do
        echo -n "  $module: "
        if [ -f "$SCRIPTS_DIR/ai/$module" ]; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${RED}✗${NC}"
        fi
    done
    
    echo -e "\n${CYAN}4. 간단한 검토 테스트${NC}"
    
    # 테스트 파일 생성
    local test_file="$PROJECT_ROOT/test-ai-review.tmp.js"
    cat > "$test_file" << 'EOF'
// Test file for AI review
function calculateSum(a, b) {
    return a + b;
}

console.log(calculateSum(1, 2));
EOF
    
    # 분석 실행
    if analyze_task "test-ai-review.tmp.js"; then
        log SUCCESS "테스트 성공!"
    else
        log ERROR "테스트 실패"
    fi
    
    # 테스트 파일 제거
    rm -f "$test_file"
    
    log SUCCESS "시스템 테스트 완료"
}

# === 초기 설정 ===
setup_system() {
    log INFO "AI 협력 시스템 초기 설정..."
    
    echo -e "\n${CYAN}1. 디렉토리 생성${NC}"
    mkdir -p "$REPORTS_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    log SUCCESS "디렉토리 생성 완료"
    
    echo -e "\n${CYAN}2. 환경변수 설정${NC}"
    if [ ! -f "$PROJECT_ROOT/.env.local" ]; then
        if [ -f "$PROJECT_ROOT/.env.local.example" ]; then
            cp "$PROJECT_ROOT/.env.local.example" "$PROJECT_ROOT/.env.local"
            log WARNING ".env.local 파일이 생성되었습니다. 토큰을 설정해주세요."
        else
            log WARNING ".env.local.example 파일이 없습니다"
        fi
    else
        log SUCCESS ".env.local 파일 존재"
    fi
    
    echo -e "\n${CYAN}3. 실행 권한 설정${NC}"
    chmod +x "$PROJECT_ROOT/scripts/ai-collaborate.sh"
    chmod +x "$PROJECT_ROOT/scripts/ai/"*.mjs
    log SUCCESS "실행 권한 설정 완료"
    
    echo -e "\n${CYAN}4. npm 패키지 설치${NC}"
    cd "$PROJECT_ROOT"
    if [ -f "package.json" ]; then
        # chokidar 설치 확인
        if ! npm list chokidar &> /dev/null; then
            log INFO "chokidar 설치 중..."
            npm install chokidar
        fi
        log SUCCESS "npm 패키지 확인 완료"
    fi
    
    log SUCCESS "초기 설정 완료!"
    echo ""
    echo -e "${GREEN}이제 다음 명령어로 시작할 수 있습니다:${NC}"
    echo "  $0 test     # 시스템 테스트"
    echo "  $0 watch    # 파일 감시 모드"
    echo "  $0 review <files>  # 파일 검토"
}

# === 메인 함수 ===
main() {
    # 옵션 파싱
    VERBOSE=false
    DRY_RUN=false
    EXTRA_OPTS=""
    
    # 인자 처리
    ARGS=()
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose)
                VERBOSE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                EXTRA_OPTS="$EXTRA_OPTS --dry-run"
                shift
                ;;
            --auto)
                EXTRA_OPTS="$EXTRA_OPTS --auto"
                shift
                ;;
            --focus)
                EXTRA_OPTS="$EXTRA_OPTS --focus $2"
                shift 2
                ;;
            --level)
                EXTRA_OPTS="$EXTRA_OPTS --level $2"
                shift 2
                ;;
            --ai)
                EXTRA_OPTS="$EXTRA_OPTS --ai $2"
                shift 2
                ;;
            --help|-h)
                show_banner
                show_help
                exit 0
                ;;
            *)
                ARGS+=("$1")
                shift
                ;;
        esac
    done
    
    # 배너 표시
    show_banner
    
    # 환경변수 로드
    load_environment
    
    # 명령어 처리
    if [ ${#ARGS[@]} -eq 0 ]; then
        show_help
        exit 0
    fi
    
    COMMAND="${ARGS[0]}"
    
    case $COMMAND in
        review)
            review_files "${ARGS[@]:1}"
            ;;
        watch)
            watch_files
            ;;
        commit)
            review_commit "${ARGS[1]}"
            ;;
        pr)
            review_pr "${ARGS[1]}"
            ;;
        analyze)
            analyze_task "${ARGS[@]:1}"
            ;;
        status)
            show_status
            ;;
        report|reports)
            list_reports
            ;;
        daily)
            generate_daily
            ;;
        test)
            test_system
            ;;
        setup)
            setup_system
            ;;
        *)
            log ERROR "알 수 없는 명령어: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

# === 시그널 핸들러 ===
trap 'echo -e "\n${YELLOW}중단됨${NC}"; exit 130' INT TERM

# === 실행 ===
main "$@"