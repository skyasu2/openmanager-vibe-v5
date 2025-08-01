#!/bin/bash

##############################################################################
# MCP 모니터링 환경 설정 스크립트
# 10개 MCP 서버 모니터링을 위한 환경 구성 및 자동 복구
##############################################################################

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$PROJECT_ROOT/reports"
SETUP_LOG="$LOG_DIR/mcp-monitor-setup-$(date +%Y%m%d_%H%M%S).log"

# MCP 서버 설정 매핑
declare -A MCP_SERVER_CONFIG=(
    ["filesystem"]="npx -- -y @modelcontextprotocol/server-filesystem@latest /mnt/d/cursor/openmanager-vibe-v5"
    ["memory"]="npx -- -y @modelcontextprotocol/server-memory@latest"
    ["github"]="npx -e GITHUB_PERSONAL_ACCESS_TOKEN -- -y @modelcontextprotocol/server-github@latest"
    ["supabase"]="npx -e SUPABASE_URL -e SUPABASE_SERVICE_ROLE_KEY -e SUPABASE_ANON_KEY -- -y @supabase/mcp-server-supabase@latest --project-ref vnswjnltnhpsueosfhmw"
    ["tavily-mcp"]="npx -e TAVILY_API_KEY -- -y tavily-mcp@0.2.9"
    ["sequential-thinking"]="npx -- -y @modelcontextprotocol/server-sequential-thinking@latest"
    ["playwright"]="npx -- -y @playwright/mcp@latest"
    ["context7"]="npx -e UPSTASH_REDIS_REST_URL -e UPSTASH_REDIS_REST_TOKEN -- -y @upstash/context7-mcp@latest"
    ["time"]="uvx -- mcp-server-time"
    ["serena"]="uvx -- --from git+https://github.com/oraios/serena serena-mcp-server --context ide-assistant --project /mnt/d/cursor/openmanager-vibe-v5"
)

# 필수 환경변수 매핑
declare -A ENV_REQUIREMENTS=(
    ["github"]="GITHUB_PERSONAL_ACCESS_TOKEN"
    ["supabase"]="SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY SUPABASE_ANON_KEY"
    ["tavily-mcp"]="TAVILY_API_KEY"
    ["context7"]="UPSTASH_REDIS_REST_URL UPSTASH_REDIS_REST_TOKEN"
)

##############################################################################
# 유틸리티 함수들
##############################################################################

log_info() {
    echo -e "${CYAN}[INFO]${NC} $1" | tee -a "$SETUP_LOG"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$SETUP_LOG"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$SETUP_LOG"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$SETUP_LOG"
}

log_header() {
    echo -e "\n${PURPLE}========================================${NC}" | tee -a "$SETUP_LOG"
    echo -e "${PURPLE}$1${NC}" | tee -a "$SETUP_LOG"
    echo -e "${PURPLE}========================================${NC}\n" | tee -a "$SETUP_LOG"
}

##############################################################################
# 환경 확인 함수들
##############################################################################

check_prerequisites() {
    log_header "Checking Prerequisites"
    
    local missing=()
    
    # Claude CLI 확인
    if ! command -v claude >/dev/null 2>&1; then
        missing+=("Claude CLI")
        log_error "Claude CLI not found"
    else
        log_success "Claude CLI: $(claude --version)"
    fi
    
    # Node.js 확인
    if ! command -v node >/dev/null 2>&1; then
        missing+=("Node.js")
        log_error "Node.js not found"
    else
        log_success "Node.js: $(node --version)"
    fi
    
    # npx 확인
    if ! command -v npx >/dev/null 2>&1; then
        missing+=("npx")
        log_error "npx not found"
    else
        log_success "npx: available"
    fi
    
    # uvx 확인 (Python 서버용)
    if ! command -v uvx >/dev/null 2>&1; then
        missing+=("uvx")
        log_error "uvx not found (required for serena, time servers)"
    else
        log_success "uvx: $(uvx --version 2>/dev/null || echo 'available')"
    fi
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing prerequisites: ${missing[*]}"
        echo "Please install missing dependencies before continuing."
        exit 1
    fi
    
    log_success "All prerequisites satisfied"
}

load_environment() {
    log_header "Loading Environment Variables"
    
    # .env.local 파일 로드
    if [[ -f "$PROJECT_ROOT/.env.local" ]]; then
        set -a
        source "$PROJECT_ROOT/.env.local"
        set +a
        log_success "Environment variables loaded from .env.local"
    else
        log_warning ".env.local file not found"
    fi
    
    # 필수 환경변수 확인
    local missing_env=()
    
    for server in "${!ENV_REQUIREMENTS[@]}"; do
        local vars=${ENV_REQUIREMENTS[$server]}
        for var in $vars; do
            if [[ -z "${!var:-}" ]]; then
                missing_env+=("$var (required for $server)")
            fi
        done
    done
    
    if [[ ${#missing_env[@]} -gt 0 ]]; then
        log_warning "Missing environment variables:"
        for var in "${missing_env[@]}"; do
            log_warning "  - $var"
        done
    else
        log_success "All required environment variables are set"
    fi
}

##############################################################################
# MCP 서버 관리 함수들
##############################################################################

get_current_servers() {
    local servers=()
    if claude mcp list >/dev/null 2>&1; then
        while IFS=: read -r server_name _; do
            [[ -n "$server_name" ]] && servers+=("$server_name")
        done < <(claude mcp list 2>/dev/null | grep -E "^[a-z-]+:")
    fi
    echo "${servers[@]}"
}

remove_server() {
    local server_name="$1"
    
    log_info "Removing MCP server: $server_name"
    
    if claude mcp remove "$server_name" 2>/dev/null; then
        log_success "Server $server_name removed successfully"
        return 0
    else
        log_warning "Failed to remove server $server_name (may not exist)"
        return 1
    fi
}

add_server() {
    local server_name="$1"
    local config="${MCP_SERVER_CONFIG[$server_name]}"
    
    log_info "Adding MCP server: $server_name"
    
    # 환경변수 값으로 변수 치환
    local expanded_config="$config"
    for var in GITHUB_PERSONAL_ACCESS_TOKEN SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY SUPABASE_ANON_KEY TAVILY_API_KEY UPSTASH_REDIS_REST_URL UPSTASH_REDIS_REST_TOKEN; do
        local value="${!var:-}"
        if [[ -n "$value" ]]; then
            expanded_config=$(echo "$expanded_config" | sed "s/-e $var/-e $var=$value/g")
        fi
    done
    
    local full_command="claude mcp add $server_name $expanded_config"
    
    if eval "$full_command" 2>/dev/null; then
        log_success "Server $server_name added successfully"
        return 0
    else
        log_error "Failed to add server $server_name"
        return 1
    fi
}

restart_server() {
    local server_name="$1"
    
    log_info "Restarting MCP server: $server_name"
    
    # 서버 제거
    remove_server "$server_name"
    
    # 짧은 대기
    sleep 2
    
    # 서버 추가
    if add_server "$server_name"; then
        log_success "Server $server_name restarted successfully"
        return 0
    else
        log_error "Failed to restart server $server_name"
        return 1
    fi
}

restart_claude_api() {
    log_info "Restarting Claude API..."
    
    if claude api restart 2>/dev/null; then
        log_success "Claude API restarted successfully"
        return 0
    else
        log_error "Failed to restart Claude API"
        return 1
    fi
}

##############################################################################
# 모니터링 설정 함수들
##############################################################################

setup_all_servers() {
    log_header "Setting Up All MCP Servers"
    
    local success_count=0
    local total_count=${#MCP_SERVER_CONFIG[@]}
    
    for server_name in "${!MCP_SERVER_CONFIG[@]}"; do
        log_info "Setting up server: $server_name"
        
        # 기존 서버 제거 후 재추가
        remove_server "$server_name" || true
        sleep 1
        
        if add_server "$server_name"; then
            ((success_count++))
        fi
    done
    
    log_info "Server setup complete: $success_count/$total_count servers configured"
    
    # Claude API 재시작
    sleep 3
    restart_claude_api
    
    # 연결 확인을 위한 대기
    sleep 5
    
    return $((total_count - success_count))
}

repair_failed_servers() {
    log_header "Repairing Failed Servers"
    
    local current_servers
    read -ra current_servers <<< "$(get_current_servers)"
    
    # 현재 연결된 서버 확인
    local failed_servers=()
    local server_status
    
    if server_status=$(claude mcp list 2>&1); then
        while IFS=: read -r server_name rest; do
            if [[ "$rest" == *"✗ Failed to connect"* ]]; then
                failed_servers+=("$server_name")
            fi
        done <<< "$server_status"
    fi
    
    if [[ ${#failed_servers[@]} -eq 0 ]]; then
        log_success "No failed servers to repair"
        return 0
    fi
    
    log_info "Found ${#failed_servers[@]} failed servers: ${failed_servers[*]}"
    
    local repaired=0
    for server in "${failed_servers[@]}"; do
        if restart_server "$server"; then
            ((repaired++))
        fi
    done
    
    log_info "Repaired $repaired/${#failed_servers[@]} servers"
    
    # Claude API 재시작
    restart_claude_api
    
    return $((${#failed_servers[@]} - repaired))
}

verify_setup() {
    log_header "Verifying MCP Setup"
    
    # 짧은 대기 후 상태 확인
    sleep 3
    
    local health_check_script="$SCRIPT_DIR/health-check.sh"
    
    if [[ -f "$health_check_script" ]]; then
        log_info "Running health check..."
        if bash "$health_check_script"; then
            log_success "Health check passed"
            return 0
        else
            log_warning "Health check detected issues"
            return 1
        fi
    else
        log_warning "Health check script not found, performing basic verification"
        
        if claude mcp list >/dev/null 2>&1; then
            local connected_count
            connected_count=$(claude mcp list 2>/dev/null | grep -c "✓ Connected" || echo "0")
            log_info "Connected servers: $connected_count"
            
            if [[ $connected_count -ge 8 ]]; then
                log_success "Most servers are connected ($connected_count/10)"
                return 0
            else
                log_warning "Only $connected_count servers connected"
                return 1
            fi
        else
            log_error "Cannot verify MCP setup - claude mcp list failed"
            return 1
        fi
    fi
}

##############################################################################
# 메인 작업 함수들
##############################################################################

do_setup() {
    log_header "MCP Monitoring Setup"
    
    check_prerequisites
    load_environment
    setup_all_servers
    verify_setup
    
    log_success "MCP monitoring setup complete"
}

do_repair() {
    log_header "MCP Server Repair"
    
    check_prerequisites
    load_environment
    repair_failed_servers
    verify_setup
    
    log_success "MCP server repair complete"
}

do_restart() {
    log_header "MCP Server Restart"
    
    check_prerequisites
    load_environment
    
    # 모든 서버 재시작
    log_info "Restarting all MCP servers..."
    
    local current_servers
    read -ra current_servers <<< "$(get_current_servers)"
    
    for server in "${current_servers[@]}"; do
        restart_server "$server"
    done
    
    restart_claude_api
    verify_setup
    
    log_success "MCP server restart complete"
}

do_status() {
    log_header "MCP Server Status"
    
    if command -v claude >/dev/null 2>&1; then
        claude mcp list
    else
        log_error "Claude CLI not available"
        exit 1
    fi
}

show_help() {
    cat << EOF
MCP Monitoring Setup Script

Usage: $0 [COMMAND]

Commands:
    setup     Complete MCP monitoring setup (default)
    repair    Repair failed MCP servers
    restart   Restart all MCP servers
    status    Show current MCP server status
    help      Show this help message

Examples:
    $0                    # Run complete setup
    $0 setup             # Same as above
    $0 repair            # Repair failed servers only
    $0 restart           # Restart all servers
    $0 status            # Show server status

Environment:
    This script requires .env.local with proper API keys and tokens.
    See env.local.template for required variables.

EOF
}

##############################################################################
# 메인 실행
##############################################################################

main() {
    # 로그 디렉토리 생성
    mkdir -p "$LOG_DIR"
    
    # 로그 파일 초기화
    echo "# MCP Monitor Setup Log - $(date)" > "$SETUP_LOG"
    echo "" >> "$SETUP_LOG"
    
    local command="${1:-setup}"
    
    case "$command" in
        setup)
            do_setup
            ;;
        repair)
            do_repair
            ;;
        restart)
            do_restart
            ;;
        status)
            do_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
    
    log_info "Setup log saved to: $SETUP_LOG"
}

# 스크립트 실행
main "$@"