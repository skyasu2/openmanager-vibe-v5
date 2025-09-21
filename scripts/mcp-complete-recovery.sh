#!/bin/bash

# =============================================================================
# MCP 완전 복구 스크립트 v2.0
# WSL 재설치 또는 Claude Code 재설치 후 MCP 환경 완전 복구
# =============================================================================

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로그 함수
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "\n${PURPLE}🔄 $1${NC}"; }

# 전역 변수
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
MCP_CONFIG_FILE="$PROJECT_ROOT/.mcp.json"
ENV_FILE="$PROJECT_ROOT/.env.local"
BACKUP_DIR="$PROJECT_ROOT/.backups/mcp-$(date +%Y%m%d-%H%M%S)"

# 복구 단계 상태 추적
declare -A RECOVERY_STATUS=(
    ["prerequisites"]=false
    ["environment"]=false
    ["dependencies"]=false
    ["mcp_config"]=false
    ["mcp_servers"]=false
    ["verification"]=false
)

# =============================================================================
# 1. 사전 조건 확인 및 준비
# =============================================================================
check_prerequisites() {
    log_step "1️⃣  사전 조건 확인 및 준비"

    # 프로젝트 루트 확인
    if [[ ! -d "$PROJECT_ROOT" ]]; then
        log_error "프로젝트 루트가 존재하지 않습니다: $PROJECT_ROOT"
        exit 1
    fi

    cd "$PROJECT_ROOT" || exit 1
    log_success "프로젝트 루트 확인: $PROJECT_ROOT"

    # 백업 디렉토리 생성
    mkdir -p "$BACKUP_DIR"
    log_success "백업 디렉토리 생성: $BACKUP_DIR"

    # 기존 설정 백업
    if [[ -f "$MCP_CONFIG_FILE" ]]; then
        cp "$MCP_CONFIG_FILE" "$BACKUP_DIR/mcp.json.backup"
        log_success "기존 MCP 설정 백업 완료"
    fi

    if [[ -f "$ENV_FILE" ]]; then
        cp "$ENV_FILE" "$BACKUP_DIR/env.local.backup"
        log_success "기존 환경변수 파일 백업 완료"
    fi

    RECOVERY_STATUS["prerequisites"]=true
}

# =============================================================================
# 2. 환경변수 및 토큰 설정
# =============================================================================
setup_environment() {
    log_step "2️⃣  환경변수 및 토큰 설정"

    # .env.local 파일 존재 확인
    if [[ ! -f "$ENV_FILE" ]]; then
        log_warning ".env.local 파일이 없습니다. 템플릿을 생성합니다."
        cat > "$ENV_FILE" << 'EOF'
# MCP 서버 환경변수 설정
# 각 값을 실제 토큰으로 교체하세요

# Supabase 설정
SUPABASE_ACCESS_TOKEN=sbp_your_supabase_access_token_here
SUPABASE_PROJECT_REF=your_project_ref_here

# Context7 (Upstash) 설정
CONTEXT7_API_KEY=ctx7sk-your_context7_api_key_here

# Vercel 설정 (HTTP MCP - OAuth 방식)
# VERCEL_TOKEN=vercel_your_token_here

# 기타 설정
NODE_ENV=development
DEBUG=""
EOF
        log_warning "⚠️  .env.local 파일을 생성했습니다. 실제 토큰으로 업데이트하세요!"
        log_info "파일 위치: $ENV_FILE"

        # 사용자에게 확인 요청
        read -p "환경변수를 설정하셨나요? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "환경변수 설정 후 다시 실행해주세요."
            exit 1
        fi
    fi

    # 환경변수 로드
    if [[ -f "$ENV_FILE" ]]; then
        source "$ENV_FILE"
        log_success "환경변수 로드 완료"
    fi

    # 필수 환경변수 확인
    local missing_vars=()
    [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]] && missing_vars+=("SUPABASE_ACCESS_TOKEN")
    [[ -z "${CONTEXT7_API_KEY:-}" ]] && missing_vars+=("CONTEXT7_API_KEY")

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "다음 환경변수가 설정되지 않았습니다: ${missing_vars[*]}"
        log_info ".env.local 파일을 확인하고 실제 토큰으로 업데이트하세요."
        exit 1
    fi

    log_success "필수 환경변수 확인 완료"
    RECOVERY_STATUS["environment"]=true
}

# =============================================================================
# 3. 의존성 설치
# =============================================================================
install_dependencies() {
    log_step "3️⃣  의존성 설치"

    # Node.js 확인
    if ! command -v node &> /dev/null; then
        log_warning "Node.js가 설치되지 않았습니다. 설치를 시작합니다..."
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi

    local node_version=$(node --version)
    log_success "Node.js 확인: $node_version"

    # UV (Python 도구) 확인 및 설치
    if ! command -v uvx &> /dev/null; then
        log_warning "UV가 설치되지 않았습니다. 설치를 시작합니다..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        source ~/.bashrc || true
        export PATH="$HOME/.local/bin:$PATH"
    fi

    if command -v uvx &> /dev/null; then
        local uv_version=$(uvx --version 2>/dev/null || echo "Unknown")
        log_success "UV 확인: $uv_version"
    else
        log_error "UV 설치 실패. 수동으로 설치하세요."
        exit 1
    fi

    # Claude Code 확인
    if ! command -v claude &> /dev/null; then
        log_error "Claude Code가 설치되지 않았습니다."
        log_info "Claude Code를 먼저 설치하세요: https://claude.ai/code"
        exit 1
    fi

    local claude_version=$(claude --version 2>/dev/null || echo "Unknown")
    log_success "Claude Code 확인: $claude_version"

    # 시스템 의존성 설치 (Playwright용)
    log_info "시스템 의존성 설치 중..."
    sudo apt update -qq
    sudo apt install -y libgtk-3-0 libnss3 libxss1 libxtst6 libxrandr2 \
                        libgbm1 libxkbcommon0 libdrm2 libatspi2.0-0 \
                        libxcomposite1 libxdamage1 libxfixes3 libcups2 \
                        curl wget jq git

    log_success "시스템 의존성 설치 완료"
    RECOVERY_STATUS["dependencies"]=true
}

# =============================================================================
# 4. MCP 설정 파일 생성
# =============================================================================
create_mcp_config() {
    log_step "4️⃣  MCP 설정 파일 생성"

    # 최적화된 .mcp.json 생성
    cat > "$MCP_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ],
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=1024"
      }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking@latest"
      ],
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=1024"
      }
    },
    "playwright": {
      "command": "node",
      "args": [
        "/mnt/d/cursor/openmanager-vibe-v5/node_modules/@executeautomation/playwright-mcp-server/dist/index.js"
      ],
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=1024 --no-warnings",
        "PLAYWRIGHT_BROWSERS_PATH": "/home/$(whoami)/.cache/ms-playwright",
        "PLAYWRIGHT_HEADLESS": "true",
        "PLAYWRIGHT_DISABLE_GPU": "true",
        "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD": "0",
        "MCP_REQUEST_TIMEOUT": "30000",
        "MCP_CONNECTION_POOL_SIZE": "5",
        "MCP_BROWSER_REUSE": "true",
        "UV_THREADPOOL_SIZE": "4",
        "NODE_ENV": "production"
      }
    },
    "shadcn-ui": {
      "command": "npx",
      "args": [
        "-y",
        "@jpisnice/shadcn-ui-mcp-server@latest"
      ],
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=1024"
      }
    },
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp",
        "--api-key",
        "$CONTEXT7_API_KEY"
      ],
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=1024"
      }
    },
    "time": {
      "command": "/home/$(whoami)/.local/bin/uvx",
      "args": [
        "mcp-server-time"
      ],
      "env": {
        "TERM": "dumb",
        "NO_COLOR": "1",
        "PYTHONUNBUFFERED": "1"
      }
    },
    "serena": {
      "command": "/home/$(whoami)/.local/bin/serena-mcp-server",
      "args": [
        "--project",
        "/mnt/d/cursor/openmanager-vibe-v5",
        "--log-level",
        "ERROR",
        "--tool-timeout",
        "180",
        "--enable-web-dashboard",
        "false",
        "--enable-gui-log-window",
        "false"
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

    log_success "MCP 설정 파일 생성 완료: $MCP_CONFIG_FILE"
    RECOVERY_STATUS["mcp_config"]=true
}

# =============================================================================
# 5. MCP 서버 설치 및 설정
# =============================================================================
install_mcp_servers() {
    log_step "5️⃣  MCP 서버 설치 및 설정"

    # 프로젝트 의존성 설치
    log_info "프로젝트 의존성 설치 중..."
    npm install

    # Playwright 브라우저 설치
    log_info "Playwright 브라우저 설치 중..."
    npx playwright install chromium-headless-shell

    # 브라우저 버전 동기화 (심볼릭 링크)
    local playwright_cache="/home/$(whoami)/.cache/ms-playwright"
    if [[ -d "$playwright_cache/chromium_headless_shell-1187" ]] && [[ ! -d "$playwright_cache/chromium_headless_shell-1179" ]]; then
        ln -sf "$playwright_cache/chromium_headless_shell-1187" "$playwright_cache/chromium_headless_shell-1179"
        log_success "Playwright 브라우저 버전 동기화 완료"
    fi

    # Serena MCP 서버 설치
    log_info "Serena MCP 서버 설치 중..."
    if ! command -v serena-mcp-server &> /dev/null; then
        pip install --user git+https://github.com/oraios/serena.git
    fi

    # 토큰 기반 MCP 서버 설정 (CLI 방식)
    log_info "토큰 기반 MCP 서버 설정 중..."

    # Supabase MCP (로컬 스코프)
    if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" && -n "${SUPABASE_PROJECT_REF:-}" ]]; then
        claude mcp remove supabase -s project 2>/dev/null || true
        claude mcp remove supabase -s local 2>/dev/null || true
        claude mcp add supabase -s local -e SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" -- \
            npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref="$SUPABASE_PROJECT_REF"
        log_success "Supabase MCP 설정 완료 (로컬 스코프)"
    else
        log_warning "Supabase 환경변수가 설정되지 않았습니다. 수동 설정이 필요합니다."
    fi

    # Vercel MCP (HTTP 방식)
    claude mcp remove vercel 2>/dev/null || true
    claude mcp add --transport http vercel https://mcp.vercel.com
    log_success "Vercel MCP 설정 완료 (HTTP 방식)"

    log_success "MCP 서버 설치 및 설정 완료"
    RECOVERY_STATUS["mcp_servers"]=true
}

# =============================================================================
# 6. 설치 검증
# =============================================================================
verify_installation() {
    log_step "6️⃣  설치 검증"

    # Claude Code 재시작 권장
    log_info "Claude Code를 재시작하는 것을 권장합니다."
    read -p "Claude Code를 재시작하셨나요? (y/N): " -n 1 -r
    echo

    # MCP 서버 연결 상태 확인
    log_info "MCP 서버 연결 상태 확인 중..."
    sleep 3

    local mcp_status
    mcp_status=$(claude mcp list 2>/dev/null || echo "연결 실패")

    echo "$mcp_status"

    # 연결된 서버 수 확인
    local connected_count
    connected_count=$(echo "$mcp_status" | grep -c "✓ Connected" 2>/dev/null || echo "0")

    if [[ "$connected_count" -ge 8 ]]; then
        log_success "MCP 서버 연결 성공: $connected_count개 서버"
    else
        log_warning "일부 MCP 서버 연결 실패: $connected_count개 연결됨"
        log_info "트러블슈팅 가이드를 참조하세요: docs/mcp/setup.md"
    fi

    # Health check 스크립트 실행
    if [[ -f "./scripts/mcp-health-check.sh" ]]; then
        log_info "Health check 실행 중..."
        ./scripts/mcp-health-check.sh || true
    fi

    RECOVERY_STATUS["verification"]=true
}

# =============================================================================
# 7. 복구 완료 보고서
# =============================================================================
generate_report() {
    log_step "7️⃣  복구 완료 보고서"

    local report_file="$BACKUP_DIR/recovery-report.md"

    cat > "$report_file" << EOF
# MCP 복구 완료 보고서

**복구 일시**: $(date '+%Y-%m-%d %H:%M:%S')
**프로젝트**: OpenManager VIBE v5
**백업 위치**: $BACKUP_DIR

## 복구 단계 결과

EOF

    for stage in "${!RECOVERY_STATUS[@]}"; do
        if [[ "${RECOVERY_STATUS[$stage]}" == "true" ]]; then
            echo "- ✅ $stage: 완료" >> "$report_file"
        else
            echo "- ❌ $stage: 실패" >> "$report_file"
        fi
    done

    cat >> "$report_file" << EOF

## 설치된 MCP 서버

$(claude mcp list 2>/dev/null || echo "MCP 상태 확인 실패")

## 다음 단계

1. Claude Code에서 MCP 서버 기능 테스트
2. 환경변수 값 확인 및 업데이트 (필요시)
3. 문제 발생 시 트러블슈팅 가이드 참조

## 관련 문서

- [MCP 설정 가이드](./docs/mcp/setup.md)
- [CLAUDE.md MCP 섹션](./CLAUDE.md#mcp)
- [트러블슈팅 가이드](./docs/mcp/README.md)

EOF

    log_success "복구 보고서 생성: $report_file"

    # 요약 출력
    echo -e "\n${CYAN}======================== 복구 완료 ========================${NC}"
    local success_count=0
    for stage in "${!RECOVERY_STATUS[@]}"; do
        [[ "${RECOVERY_STATUS[$stage]}" == "true" ]] && ((success_count++))
    done

    echo -e "${GREEN}✅ 복구 성공: $success_count/${#RECOVERY_STATUS[@]} 단계 완료${NC}"
    echo -e "${BLUE}📁 백업 위치: $BACKUP_DIR${NC}"
    echo -e "${BLUE}📋 보고서: $report_file${NC}"
    echo -e "${CYAN}=========================================================${NC}\n"
}

# =============================================================================
# 메인 실행 함수
# =============================================================================
main() {
    echo -e "${CYAN}🚀 MCP 완전 복구 스크립트 시작${NC}"
    echo -e "${CYAN}WSL 재설치 또는 Claude Code 재설치 후 MCP 환경 완전 복구${NC}\n"

    # 모든 단계 실행
    check_prerequisites
    setup_environment
    install_dependencies
    create_mcp_config
    install_mcp_servers
    verify_installation
    generate_report

    log_success "🎉 MCP 복구 스크립트 완료!"
    log_info "Claude Code에서 MCP 서버를 테스트해보세요."
}

# 스크립트 실행
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi