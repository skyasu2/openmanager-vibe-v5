#!/bin/bash

##############################################################################
# MCP 서버 종합 헬스체크 스크립트
# 10개 MCP 서버의 상태를 확인하고 상세 리포트 생성
# Claude Code v1.16.0+ CLI 기반
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

# 로그 파일 설정
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="$(dirname "$(dirname "$(realpath "$0")")")/../reports"
HEALTH_LOG="${LOG_DIR}/mcp-health-${TIMESTAMP}.md"

# MCP 서버 목록 (우선순위별)
CRITICAL_SERVERS=("filesystem" "memory" "supabase")
HIGH_SERVERS=("github" "serena")
MEDIUM_SERVERS=("tavily-mcp" "sequential-thinking" "playwright" "context7")
LOW_SERVERS=("time")

# 전역 변수
TOTAL_SERVERS=0
HEALTHY_SERVERS=0
DEGRADED_SERVERS=0
UNHEALTHY_SERVERS=0
declare -a ISSUES=()

##############################################################################
# 유틸리티 함수들
##############################################################################

log_info() {
    echo -e "${CYAN}[INFO]${NC} $1" | tee -a "$HEALTH_LOG"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$HEALTH_LOG"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$HEALTH_LOG"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$HEALTH_LOG"
}

log_header() {
    echo -e "\n${PURPLE}========================================${NC}" | tee -a "$HEALTH_LOG"
    echo -e "${PURPLE}$1${NC}" | tee -a "$HEALTH_LOG"
    echo -e "${PURPLE}========================================${NC}\n" | tee -a "$HEALTH_LOG"
}

##############################################################################
# MCP 서버 상태 확인 함수들
##############################################################################

check_mcp_server() {
    local server_name="$1"
    local priority="$2"
    local start_time=$(date +%s%3N)
    
    echo -e "\n${BLUE}🔍 Checking MCP server: ${server_name}${NC}"
    
    # Claude MCP 상태 확인
    local mcp_output
    local mcp_exit_code
    
    if mcp_output=$(timeout 10 claude mcp list 2>&1); then
        mcp_exit_code=0
    else
        mcp_exit_code=$?
    fi
    
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    # 출력에서 해당 서버 찾기 (헤더 라인 제외)
    local server_line
    server_line=$(echo "$mcp_output" | grep -v "Checking MCP server health" | grep "^${server_name}:" || echo "")
    
    if [[ -z "$server_line" ]]; then
        log_error "Server ${server_name} not found in MCP configuration"
        UNHEALTHY_SERVERS=$((UNHEALTHY_SERVERS + 1))
        ISSUES+=("${server_name}: Not configured")
        echo "| ${server_name} | ${priority} | ❌ Not Found | 0ms | Not configured |" >> "$HEALTH_LOG"
        return 1
    fi
    
    # 연결 상태 파싱
    if echo "$server_line" | grep -q "✓ Connected"; then
        log_success "Server ${server_name} is healthy (${response_time}ms)"
        HEALTHY_SERVERS=$((HEALTHY_SERVERS + 1))
        
        # 응답시간 임계값 검사
        if [[ $response_time -gt 1000 ]]; then
            log_warning "High latency detected: ${response_time}ms"
            ISSUES+=("${server_name}: High latency (${response_time}ms)")
        fi
        
        echo "| ${server_name} | ${priority} | ✅ Connected | ${response_time}ms | Healthy |" >> "$HEALTH_LOG"
        return 0
        
    elif echo "$server_line" | grep -q "✗ Failed to connect"; then
        local error_msg
        error_msg=$(echo "$server_line" | sed 's/.*- //')
        
        log_error "Server ${server_name} connection failed: ${error_msg}"
        UNHEALTHY_SERVERS=$((UNHEALTHY_SERVERS + 1))
        ISSUES+=("${server_name}: ${error_msg}")
        
        echo "| ${server_name} | ${priority} | ❌ Failed | ${response_time}ms | ${error_msg} |" >> "$HEALTH_LOG"
        return 1
        
    else
        log_warning "Server ${server_name} status unknown"
        DEGRADED_SERVERS=$((DEGRADED_SERVERS + 1))
        ISSUES+=("${server_name}: Unknown status")
        
        echo "| ${server_name} | ${priority} | ⚠️ Unknown | ${response_time}ms | Status unclear |" >> "$HEALTH_LOG"
        return 2
    fi
}

check_environment_dependencies() {
    log_header "Environment Dependencies Check"
    
    local env_issues=()
    
    # 환경 변수 로드
    if [ -f .env.local ]; then
        set -a
        source .env.local
        set +a
    fi
    
    # GitHub
    if [[ -z "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]]; then
        env_issues+=("GITHUB_PERSONAL_ACCESS_TOKEN not set (affects: github)")
    else
        log_success "GitHub token configured"
    fi
    
    # Supabase
    if [[ -z "${SUPABASE_URL:-}" ]]; then
        env_issues+=("SUPABASE_URL not set (affects: supabase)")
    else
        log_success "Supabase URL configured"
    fi
    if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
        env_issues+=("SUPABASE_SERVICE_ROLE_KEY not set (affects: supabase)")
    else
        log_success "Supabase service key configured"
    fi
    
    # Tavily
    if [[ -z "${TAVILY_API_KEY:-}" ]]; then
        env_issues+=("TAVILY_API_KEY not set (affects: tavily-mcp)")
    else
        log_success "Tavily API key configured"
    fi
    
    # Upstash Redis (Context7)
    if [[ -z "${UPSTASH_REDIS_REST_URL:-}" ]]; then
        env_issues+=("UPSTASH_REDIS_REST_URL not set (affects: context7)")
    else
        log_success "Upstash Redis URL configured"
    fi
    if [[ -z "${UPSTASH_REDIS_REST_TOKEN:-}" ]]; then
        env_issues+=("UPSTASH_REDIS_REST_TOKEN not set (affects: context7)")
    else
        log_success "Upstash Redis token configured"
    fi
    
    if [[ ${#env_issues[@]} -eq 0 ]]; then
        log_success "All required environment variables are set"
    else
        log_warning "Missing environment variables detected:"
        for issue in "${env_issues[@]}"; do
            log_warning "  - $issue"
        done
    fi
    
    echo "" >> "$HEALTH_LOG"
}

check_runtime_dependencies() {
    log_header "Runtime Dependencies Check"
    
    # Node.js 확인
    if command -v node >/dev/null 2>&1; then
        local node_version
        node_version=$(node --version)
        log_success "Node.js: $node_version"
    else
        log_error "Node.js not found (required for 8 MCP servers)"
        ISSUES+=("Node.js not installed")
    fi
    
    # Python/uvx 확인 (serena, time 서버용)
    if command -v uvx >/dev/null 2>&1; then
        local uvx_version
        uvx_version=$(uvx --version 2>/dev/null || echo "unknown")
        log_success "uvx: $uvx_version"
    else
        log_error "uvx not found (required for Python MCP servers)"
        ISSUES+=("uvx not installed")
    fi
    
    # npx 확인
    if command -v npx >/dev/null 2>&1; then
        log_success "npx: available"
    else
        log_error "npx not found (required for Node.js MCP servers)"
        ISSUES+=("npx not available")
    fi
    
    echo "" >> "$HEALTH_LOG"
}

##############################################################################
# 메인 헬스체크 함수
##############################################################################

perform_health_check() {
    log_header "MCP Servers Health Check Report"
    echo "Generated: $(date)" >> "$HEALTH_LOG"
    echo "" >> "$HEALTH_LOG"
    
    # 환경 및 런타임 의존성 확인
    check_environment_dependencies
    check_runtime_dependencies
    
    # 서버 상태 테이블 헤더
    log_header "Server Status Summary"
    echo "| Server | Priority | Status | Response Time | Details |" >> "$HEALTH_LOG"
    echo "|--------|----------|--------|---------------|---------|" >> "$HEALTH_LOG"
    
    # Critical 서버들 확인
    log_info "Checking CRITICAL servers..."
    for server in "${CRITICAL_SERVERS[@]}"; do
        check_mcp_server "$server" "Critical"
        TOTAL_SERVERS=$((TOTAL_SERVERS + 1))
    done
    
    # High 서버들 확인
    log_info "Checking HIGH priority servers..."
    for server in "${HIGH_SERVERS[@]}"; do
        check_mcp_server "$server" "High"
        TOTAL_SERVERS=$((TOTAL_SERVERS + 1))
    done
    
    # Medium 서버들 확인
    log_info "Checking MEDIUM priority servers..."
    for server in "${MEDIUM_SERVERS[@]}"; do
        check_mcp_server "$server" "Medium"  
        TOTAL_SERVERS=$((TOTAL_SERVERS + 1))
    done
    
    # Low 서버들 확인
    log_info "Checking LOW priority servers..."
    for server in "${LOW_SERVERS[@]}"; do
        check_mcp_server "$server" "Low"
        TOTAL_SERVERS=$((TOTAL_SERVERS + 1))
    done
}

generate_summary() {
    log_header "Health Check Summary"
    
    local health_percentage
    if [[ $TOTAL_SERVERS -gt 0 ]]; then
        health_percentage=$(( (HEALTHY_SERVERS * 100) / TOTAL_SERVERS ))
    else
        health_percentage=0
    fi
    
    echo "**Total Servers:** $TOTAL_SERVERS" >> "$HEALTH_LOG"
    echo "**Healthy:** $HEALTHY_SERVERS ($health_percentage%)" >> "$HEALTH_LOG"
    echo "**Degraded:** $DEGRADED_SERVERS" >> "$HEALTH_LOG"
    echo "**Unhealthy:** $UNHEALTHY_SERVERS" >> "$HEALTH_LOG"
    echo "" >> "$HEALTH_LOG"
    
    # 시스템 전체 상태 결정
    local system_status
    if [[ $UNHEALTHY_SERVERS -gt 0 ]]; then
        system_status="🔴 UNHEALTHY"
        log_error "System Status: $system_status"
    elif [[ $DEGRADED_SERVERS -gt 0 ]]; then
        system_status="🟡 DEGRADED"
        log_warning "System Status: $system_status"
    else
        system_status="🟢 HEALTHY"
        log_success "System Status: $system_status"
    fi
    
    echo "**System Status:** $system_status" >> "$HEALTH_LOG"
    echo "" >> "$HEALTH_LOG"
    
    # 이슈 목록
    if [[ ${#ISSUES[@]} -gt 0 ]]; then
        echo "## Issues Detected" >> "$HEALTH_LOG"
        echo "" >> "$HEALTH_LOG"
        for issue in "${ISSUES[@]}"; do
            echo "- ⚠️ $issue" >> "$HEALTH_LOG"
        done
        echo "" >> "$HEALTH_LOG"
    fi
    
    # 권장사항
    echo "## Recommendations" >> "$HEALTH_LOG"
    echo "" >> "$HEALTH_LOG"
    
    if [[ $UNHEALTHY_SERVERS -gt 0 ]]; then
        echo "- 🔄 Restart failed servers: \`bash scripts/mcp/monitor-setup.sh restart\`" >> "$HEALTH_LOG"
        echo "- 🔧 Check environment variables and dependencies" >> "$HEALTH_LOG"
    fi
    
    if [[ $health_percentage -lt 80 ]]; then
        echo "- 📊 System health below 80% - immediate attention required" >> "$HEALTH_LOG"
    fi
    
    echo "- 📋 Monitor logs: \`tail -f $HEALTH_LOG\`" >> "$HEALTH_LOG"
    echo "- 🔄 Run monitoring setup: \`bash scripts/mcp/monitor-setup.sh\`" >> "$HEALTH_LOG"
    echo "" >> "$HEALTH_LOG"
}

##############################################################################
# 메인 실행
##############################################################################

main() {
    # 로그 디렉토리 생성
    mkdir -p "$LOG_DIR"
    
    # 헬스체크 리포트 초기화
    echo "# MCP Servers Health Check Report" > "$HEALTH_LOG"
    echo "" >> "$HEALTH_LOG"
    
    log_info "Starting MCP servers health check..."
    log_info "Report will be saved to: $HEALTH_LOG"
    
    # 헬스체크 수행
    perform_health_check
    
    # 요약 생성
    generate_summary
    
    # 최종 상태 출력
    echo ""
    echo "=================================================="
    echo "MCP Health Check Complete"
    echo "=================================================="
    echo "Total Servers: $TOTAL_SERVERS"
    echo "Healthy: $HEALTHY_SERVERS"
    echo "Issues: ${#ISSUES[@]}"
    echo "Report: $HEALTH_LOG"
    echo "=================================================="
    
    # 종료 코드 결정
    if [[ $UNHEALTHY_SERVERS -gt 0 ]]; then
        exit 1
    elif [[ $DEGRADED_SERVERS -gt 0 ]]; then
        exit 2
    else
        exit 0
    fi
}

# 스크립트 실행
main "$@"