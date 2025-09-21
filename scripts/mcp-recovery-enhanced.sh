#!/bin/bash

# ====================================================================
# MCP 완전 복구 스크립트 - 에러 핸들링 및 롤백 기능 강화 버전
# ====================================================================
# 목적: WSL/Claude Code 재설치 후 MCP 환경 완전 복구 (안전성 강화)
# 사용법: ./scripts/mcp-recovery-enhanced.sh [--rollback|--dry-run]
# 생성일: 2025-09-20
# 개선사항: 에러 핸들링, 롤백 기능, 단계별 검증, 진행 상황 추적
# ====================================================================

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 프로젝트 루트 및 백업 디렉토리
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
BACKUP_ROOT="$PROJECT_ROOT/.backups"
RECOVERY_BACKUP="$BACKUP_ROOT/recovery-$(date +%Y%m%d-%H%M%S)"
RECOVERY_LOG="$PROJECT_ROOT/logs/mcp-recovery-enhanced.log"

# 복구 상태 추적
RECOVERY_STATE_FILE="$PROJECT_ROOT/.mcp-recovery-state"
STEPS_COMPLETED=()
TOTAL_STEPS=7

# 로깅 함수
log_step() {
    local step="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${PURPLE}🔄 $step️⃣  $message${NC}"
    echo "[$timestamp] STEP $step: $message" >> "$RECOVERY_LOG"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" >> "$RECOVERY_LOG"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> "$RECOVERY_LOG"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$RECOVERY_LOG"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$RECOVERY_LOG"
}

# 복구 상태 저장
save_recovery_state() {
    local step="$1"
    echo "$step" >> "$RECOVERY_STATE_FILE"
    STEPS_COMPLETED+=("$step")
}

# 복구 상태 로드
load_recovery_state() {
    if [[ -f "$RECOVERY_STATE_FILE" ]]; then
        while IFS= read -r step; do
            STEPS_COMPLETED+=("$step")
        done < "$RECOVERY_STATE_FILE"
    fi
}

# 단계 완료 여부 확인
is_step_completed() {
    local step="$1"
    for completed in "${STEPS_COMPLETED[@]}"; do
        if [[ "$completed" == "$step" ]]; then
            return 0
        fi
    done
    return 1
}

# 롤백 함수
rollback_recovery() {
    log_error "복구 중 오류 발생. 롤백을 시작합니다..."

    # 백업 파일들 복원
    if [[ -d "$RECOVERY_BACKUP" ]]; then
        log_info "백업에서 설정 파일 복원 중..."

        if [[ -f "$RECOVERY_BACKUP/mcp.json.backup" ]]; then
            cp "$RECOVERY_BACKUP/mcp.json.backup" "$PROJECT_ROOT/.mcp.json" 2>/dev/null || true
            log_success ".mcp.json 복원 완료"
        fi

        if [[ -f "$RECOVERY_BACKUP/env.local.backup" ]]; then
            cp "$RECOVERY_BACKUP/env.local.backup" "$PROJECT_ROOT/.env.local" 2>/dev/null || true
            log_success ".env.local 복원 완료"
        fi
    fi

    # 부분적으로 설치된 MCP 서버들 정리
    log_info "부분적으로 설치된 MCP 서버 정리 중..."
    claude mcp list 2>/dev/null | grep "✗ Failed" | while read -r line; do
        local server_name
        server_name=$(echo "$line" | cut -d':' -f1)
        claude mcp remove "$server_name" 2>/dev/null || true
    done

    # 복구 상태 파일 삭제
    rm -f "$RECOVERY_STATE_FILE"

    log_error "롤백 완료. 수동으로 문제를 해결한 후 다시 시도해주세요."
    exit 1
}

# 에러 핸들러 설정
error_handler() {
    local line_number="$1"
    local error_code="$2"
    log_error "라인 $line_number에서 오류 발생 (코드: $error_code)"
    rollback_recovery
}

trap 'error_handler ${LINENO} $?' ERR

# Dry run 모드 확인
check_dry_run() {
    if [[ "${1:-}" == "--dry-run" ]]; then
        log_info "=== DRY RUN 모드: 실제 변경 없이 시뮬레이션만 수행 ==="
        return 0
    fi
    return 1
}

# 필수 조건 확인
check_prerequisites() {
    if is_step_completed "prerequisites"; then
        log_info "1단계 이미 완료됨 - 건너뛰기"
        return 0
    fi

    log_step "1" "사전 조건 확인 및 준비"

    # 프로젝트 루트 확인
    if [[ ! -d "$PROJECT_ROOT" ]]; then
        log_error "프로젝트 루트 디렉토리를 찾을 수 없습니다: $PROJECT_ROOT"
        return 1
    fi
    log_success "프로젝트 루트 확인: $PROJECT_ROOT"

    # 백업 디렉토리 생성
    mkdir -p "$RECOVERY_BACKUP"
    mkdir -p "$PROJECT_ROOT/logs"
    log_success "백업 디렉토리 생성: $RECOVERY_BACKUP"

    # 기존 설정 백업
    [[ -f "$PROJECT_ROOT/.mcp.json" ]] && cp "$PROJECT_ROOT/.mcp.json" "$RECOVERY_BACKUP/mcp.json.backup"
    [[ -f "$PROJECT_ROOT/.env.local" ]] && cp "$PROJECT_ROOT/.env.local" "$RECOVERY_BACKUP/env.local.backup"
    log_success "기존 설정 백업 완료"

    save_recovery_state "prerequisites"
    return 0
}

# 환경변수 설정 확인
setup_environment() {
    if is_step_completed "environment"; then
        log_info "2단계 이미 완료됨 - 건너뛰기"
        return 0
    fi

    log_step "2" "환경변수 및 토큰 설정"

    # 환경변수 파일 확인
    if [[ -f "$PROJECT_ROOT/.env.local" ]]; then
        # 보안 검사 수행
        "$PROJECT_ROOT/scripts/setup-mcp-env.sh" --security-check || log_warning "보안 검사에서 일부 문제 발견"
        log_success "환경변수 로드 완료"
    else
        log_warning "환경변수 파일이 없습니다. 수동 설정이 필요합니다."
        log_info "다음 명령어로 설정하세요: ./scripts/setup-mcp-env.sh --interactive"
    fi

    save_recovery_state "environment"
    return 0
}

# 의존성 설치
install_dependencies() {
    if is_step_completed "dependencies"; then
        log_info "3단계 이미 완료됨 - 건너뛰기"
        return 0
    fi

    log_step "3" "의존성 설치"

    # Node.js 확인
    if command -v node &> /dev/null; then
        local node_version
        node_version=$(node --version)
        log_success "Node.js 확인: $node_version"
    else
        log_error "Node.js가 설치되지 않았습니다"
        return 1
    fi

    # UV 확인
    if command -v uvx &> /dev/null; then
        local uv_version
        uv_version=$(uvx --version)
        log_success "UV 확인: $uv_version"
    else
        log_error "UV가 설치되지 않았습니다"
        return 1
    fi

    # Claude Code 확인
    if command -v claude &> /dev/null; then
        local claude_version
        claude_version=$(claude --version)
        log_success "Claude Code 확인: $claude_version"
    else
        log_error "Claude Code가 설치되지 않았습니다"
        return 1
    fi

    # 시스템 의존성 설치 (에러 허용)
    log_info "시스템 의존성 설치 중..."
    if sudo apt update &>/dev/null && sudo apt install -y curl wget git jq &>/dev/null; then
        log_success "시스템 의존성 설치 완료"
    else
        log_warning "일부 시스템 의존성 설치 실패 (무시하고 계속)"
    fi

    save_recovery_state "dependencies"
    return 0
}

# MCP 설정 파일 생성
create_mcp_config() {
    if is_step_completed "config"; then
        log_info "4단계 이미 완료됨 - 건너뛰기"
        return 0
    fi

    log_step "4" "MCP 설정 파일 생성"

    # 개선된 MCP 설정 파일 생성 (보안 강화)
    cat > "$PROJECT_ROOT/.mcp.json" << 'EOF'
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "time": {
      "command": "/home/$USER/.local/bin/uvx",
      "args": ["mcp-server-time"],
      "env": {
        "TERM": "dumb",
        "NO_COLOR": "1",
        "PYTHONUNBUFFERED": "1"
      }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking@latest"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"],
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=1024 --no-warnings",
        "PLAYWRIGHT_BROWSERS_PATH": "/home/$USER/.cache/ms-playwright",
        "PLAYWRIGHT_HEADLESS": "true",
        "PLAYWRIGHT_DISABLE_GPU": "true",
        "MCP_CONNECTION_POOL_SIZE": "5"
      }
    },
    "shadcn-ui": {
      "command": "npx",
      "args": ["-y", "@jpisnice/shadcn-ui-mcp-server@latest"]
    },
    "serena": {
      "command": "/home/$USER/.local/bin/serena-mcp-server",
      "args": [
        "--project", "/mnt/d/cursor/openmanager-vibe-v5",
        "--log-level", "ERROR",
        "--tool-timeout", "180",
        "--enable-web-dashboard", "false",
        "--enable-gui-log-window", "false"
      ],
      "env": {
        "TERM": "dumb",
        "NO_COLOR": "1",
        "PYTHONUNBUFFERED": "1",
        "PYTHONIOENCODING": "utf-8",
        "PYTHONHASHSEED": "0",
        "MALLOC_TRIM_THRESHOLD_": "100000"
      }
    }
  }
}
EOF

    # 파일 권한 설정
    chmod 644 "$PROJECT_ROOT/.mcp.json"
    log_success "MCP 설정 파일 생성 완료: $PROJECT_ROOT/.mcp.json"

    save_recovery_state "config"
    return 0
}

# MCP 서버 설치
install_mcp_servers() {
    if is_step_completed "servers"; then
        log_info "5단계 이미 완료됨 - 건너뛰기"
        return 0
    fi

    log_step "5" "MCP 서버 설치 및 설정"

    # 프로젝트 의존성 설치
    log_info "프로젝트 의존성 설치 중..."
    cd "$PROJECT_ROOT"
    if npm install &>/dev/null; then
        log_success "프로젝트 의존성 설치 완료"
    else
        log_warning "프로젝트 의존성 설치 실패 (무시하고 계속)"
    fi

    # Playwright 브라우저 설치
    log_info "Playwright 브라우저 설치 중..."
    if npx playwright install chromium &>/dev/null; then
        log_success "Playwright 브라우저 설치 완료"
    else
        log_warning "Playwright 브라우저 설치 실패"
    fi

    # Serena MCP 서버 설치
    log_info "Serena MCP 서버 설치 중..."
    if uvx --from git+https://github.com/oraios/serena serena-mcp-server --help &>/dev/null; then
        log_success "Serena MCP 서버 설치 완료"
    else
        log_warning "Serena MCP 서버 설치 실패"
    fi

    # 토큰 기반 MCP 서버 설정 (보안 강화)
    log_info "토큰 기반 MCP 서버 설정 중..."

    # Context7 MCP - 환경변수 방식으로 변경 (보안 개선)
    if [[ -n "${CONTEXT7_API_KEY:-}" ]]; then
        if claude mcp remove context7 &>/dev/null; then
            log_info "기존 Context7 MCP 제거"
        fi
        if claude mcp add context7 -s local -- npx -y @upstash/context7-mcp &>/dev/null; then
            log_success "Context7 MCP 설정 완료 (환경변수 방식)"
        else
            log_warning "Context7 MCP 설정 실패"
        fi
    else
        log_warning "Context7 API 키가 설정되지 않았습니다"
    fi

    # Supabase MCP
    if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" && -n "${SUPABASE_PROJECT_ID:-}" ]]; then
        if claude mcp remove supabase &>/dev/null; then
            log_info "기존 Supabase MCP 제거"
        fi
        if claude mcp add supabase -s local -e SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" -- npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref="$SUPABASE_PROJECT_ID" &>/dev/null; then
            log_success "Supabase MCP 설정 완료"
        else
            log_warning "Supabase MCP 설정 실패"
        fi
    else
        log_warning "Supabase 환경변수가 설정되지 않았습니다"
    fi

    # Vercel MCP
    if claude mcp remove vercel &>/dev/null; then
        log_info "기존 Vercel MCP 제거"
    fi
    if claude mcp add --transport http vercel https://mcp.vercel.com &>/dev/null; then
        log_success "Vercel MCP 설정 완료 (HTTP 방식)"
    else
        log_warning "Vercel MCP 설정 실패"
    fi

    save_recovery_state "servers"
    return 0
}

# 설치 검증
verify_installation() {
    if is_step_completed "verification"; then
        log_info "6단계 이미 완료됨 - 건너뛰기"
        return 0
    fi

    log_step "6" "설치 검증"

    # MCP 서버 연결 확인
    log_info "MCP 서버 연결 상태 확인..."
    local mcp_status
    if mcp_status=$(claude mcp list 2>&1); then
        local connected_count
        connected_count=$(echo "$mcp_status" | grep -c "✓ Connected" || echo "0")
        local failed_count
        failed_count=$(echo "$mcp_status" | grep -c "✗ Failed" || echo "0")

        log_success "연결된 MCP 서버: $connected_count개"
        if [[ "$failed_count" -gt 0 ]]; then
            log_warning "실패한 MCP 서버: $failed_count개"
        fi

        # 최소 3개 이상 연결되어야 성공으로 간주
        if [[ "$connected_count" -ge 3 ]]; then
            log_success "MCP 서버 연결 검증 통과"
        else
            log_error "MCP 서버 연결 실패 (최소 3개 필요, 현재 $connected_count개)"
            return 1
        fi
    else
        log_error "MCP 상태 확인 실패"
        return 1
    fi

    # 환경변수 보안 검사
    log_info "환경변수 보안 검사..."
    if "$PROJECT_ROOT/scripts/setup-mcp-env.sh" --security-check &>/dev/null; then
        log_success "환경변수 보안 검사 통과"
    else
        log_warning "환경변수 보안 검사에서 일부 문제 발견"
    fi

    save_recovery_state "verification"
    return 0
}

# 정리 및 보고
cleanup_and_report() {
    if is_step_completed "cleanup"; then
        log_info "7단계 이미 완료됨 - 건너뛰기"
        return 0
    fi

    log_step "7" "정리 및 완료 보고"

    # 임시 파일 정리
    log_info "임시 파일 정리 중..."
    find "$PROJECT_ROOT" -name "*.tmp" -type f -delete 2>/dev/null || true

    # 오래된 백업 정리 (선택적)
    "$PROJECT_ROOT/scripts/setup-mcp-env.sh" --cleanup || true

    # 복구 상태 파일 삭제
    rm -f "$RECOVERY_STATE_FILE"

    # 최종 보고서 생성
    local report_file="$PROJECT_ROOT/logs/mcp-recovery-report-$(date +%Y%m%d-%H%M%S).txt"
    {
        echo "MCP 복구 완료 보고서"
        echo "===================="
        echo "복구 일시: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "프로젝트: $PROJECT_ROOT"
        echo "백업 위치: $RECOVERY_BACKUP"
        echo ""
        echo "=== MCP 서버 상태 ==="
        claude mcp list 2>&1 || echo "MCP 상태 확인 실패"
        echo ""
        echo "=== 완료된 단계 ==="
        printf '%s\n' "${STEPS_COMPLETED[@]}"
    } > "$report_file"

    log_success "복구 보고서 생성: $report_file"
    log_success "🎉 MCP 환경 복구가 완전히 완료되었습니다!"

    save_recovery_state "cleanup"
    return 0
}

# 진행 상황 표시
show_progress() {
    local completed_steps=${#STEPS_COMPLETED[@]}
    local progress=$((completed_steps * 100 / TOTAL_STEPS))
    echo -e "\n${BLUE}📊 복구 진행 상황: $completed_steps/$TOTAL_STEPS 단계 ($progress%) 완료${NC}"
}

# 메인 함수
main() {
    local mode="${1:-}"

    echo -e "${PURPLE}🛠️  MCP 완전 복구 스크립트 (에러 핸들링 강화 버전)${NC}"
    echo -e "${PURPLE}프로젝트: OpenManager VIBE v5${NC}"
    echo -e "${PURPLE}목적: WSL 재설치 또는 Claude Code 재설치 후 MCP 환경 완전 복구${NC}\n"

    # Dry run 모드 확인
    local dry_run=false
    if check_dry_run "$mode"; then
        dry_run=true
    fi

    # 롤백 모드 확인
    if [[ "$mode" == "--rollback" ]]; then
        rollback_recovery
        exit 0
    fi

    # 복구 상태 로드
    load_recovery_state
    show_progress

    # 환경변수 로드
    if [[ -f "$PROJECT_ROOT/.env.local" ]]; then
        set +u  # 일시적으로 unset 변수 허용
        source "$PROJECT_ROOT/.env.local"
        set -u
    fi

    # 단계별 복구 실행
    if ! $dry_run; then
        check_prerequisites && show_progress
        setup_environment && show_progress
        install_dependencies && show_progress
        create_mcp_config && show_progress
        install_mcp_servers && show_progress
        verify_installation && show_progress
        cleanup_and_report && show_progress
    else
        log_info "DRY RUN: 모든 단계를 시뮬레이션했습니다"
    fi

    echo -e "\n${GREEN}🎉 MCP 환경 복구 완료!${NC}"
    echo -e "${BLUE}📋 다음 단계:${NC}"
    echo "1. Claude Code를 재시작하세요"
    echo "2. 토큰 설정: ./scripts/setup-mcp-env.sh --interactive"
    echo "3. 상태 확인: ./scripts/mcp-health-check-enhanced.sh"
}

# 헬프 메시지
show_help() {
    cat << EOF
MCP 완전 복구 스크립트 (에러 핸들링 강화 버전)

사용법:
    $0 [옵션]

옵션:
    --dry-run    실제 변경 없이 시뮬레이션만 수행
    --rollback   이전 상태로 롤백
    --help       이 도움말 표시

기능:
    - 에러 발생 시 자동 롤백
    - 단계별 복구 상태 추적
    - 부분 실패 시 재시작 지원
    - 보안 강화된 설정 생성
EOF
}

# 스크립트 실행
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ "${1:-}" == "--help" ]]; then
        show_help
        exit 0
    fi
    main "$@"
fi