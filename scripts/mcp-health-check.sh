#!/bin/bash
# MCP 서버 헬스체크 및 자동 복구 스크립트
# 실행: ./scripts/mcp-health-check.sh

set -e

echo "🔍 MCP 서버 상태 진단 시작..."
echo "=================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
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

# 환경 확인
check_environment() {
    log_info "환경 검사 중..."
    
    # WSL 환경 확인
    if grep -qi microsoft /proc/version; then
        log_success "WSL 환경 감지됨"
    else
        log_warning "WSL 환경이 아닙니다"
    fi
    
    # Claude Code 설치 확인
    if command -v claude >/dev/null 2>&1; then
        CLAUDE_VERSION=$(claude --version)
        log_success "Claude Code 설치됨: $CLAUDE_VERSION"
    else
        log_error "Claude Code가 설치되지 않았습니다"
        exit 1
    fi
    
    # Node.js 확인
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        log_success "Node.js 설치됨: $NODE_VERSION"
    else
        log_error "Node.js가 설치되지 않았습니다"
        exit 1
    fi
    
    # uvx 확인 (Python MCP 서버용)
    if command -v uvx >/dev/null 2>&1; then
        log_success "uvx 설치됨"
    else
        log_warning "uvx가 설치되지 않았습니다 (Python MCP 서버 실행 불가)"
    fi
}

# 환경변수 확인
check_env_vars() {
    log_info "환경변수 검사 중..."
    
    ENV_FILE=".env.local"
    if [[ ! -f "$ENV_FILE" ]]; then
        log_error "$ENV_FILE 파일이 없습니다"
        exit 1
    fi
    
    # 필수 환경변수 목록
    REQUIRED_VARS=(
        "GITHUB_TOKEN"
        "SUPABASE_ACCESS_TOKEN"
        "SUPABASE_PROJECT_ID"
        "TAVILY_API_KEY"
        "UPSTASH_REDIS_REST_URL"
        "UPSTASH_REDIS_REST_TOKEN"
    )
    
    missing_vars=()
    for var in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "^${var}=" "$ENV_FILE"; then
            missing_vars+=("$var")
        else
            log_success "✓ $var 설정됨"
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "누락된 환경변수: ${missing_vars[*]}"
        exit 1
    else
        log_success "모든 필수 환경변수 확인됨"
    fi
}

# MCP 서버 상태 확인
check_mcp_servers() {
    log_info "MCP 서버 연결 상태 확인 중..."
    
    # MCP 서버 목록
    MCP_SERVERS=(
        "filesystem"
        "memory"
        "github"
        "supabase"
        "tavily"
        "playwright"
        "time"
        "thinking"
        "context7"
        "shadcn"
        "serena"
    )
    
    connected_count=0
    failed_servers=()
    
    # Claude MCP 상태 확인
    MCP_STATUS=$(claude mcp list 2>&1)
    
    for server in "${MCP_SERVERS[@]}"; do
        if echo "$MCP_STATUS" | grep -q "$server.*✓ Connected"; then
            log_success "✓ $server - 연결됨"
            ((connected_count++))
        else
            log_error "✗ $server - 연결 실패"
            failed_servers+=("$server")
        fi
    done
    
    echo ""
    log_info "연결 상태 요약:"
    log_success "연결됨: $connected_count/${#MCP_SERVERS[@]}"
    
    if [[ ${#failed_servers[@]} -gt 0 ]]; then
        log_error "실패한 서버: ${failed_servers[*]}"
        return 1
    else
        log_success "모든 MCP 서버 정상 연결됨!"
        return 0
    fi
}

# 자동 복구 시도
auto_recovery() {
    log_info "MCP 서버 자동 복구 시도 중..."
    
    # npm 캐시 정리
    log_info "npm 캐시 정리 중..."
    npm cache clean --force >/dev/null 2>&1 || true
    
    # 문제 있는 패키지 재설치 시도
    log_info "MCP 서버 패키지 재확인 중..."
    
    # 자주 문제가 되는 패키지들
    PACKAGES=(
        "@modelcontextprotocol/server-filesystem"
        "@modelcontextprotocol/server-memory"
        "@modelcontextprotocol/server-github"
        "@supabase/mcp-server-supabase"
        "tavily-mcp"
        "@executeautomation/playwright-mcp-server"
        "@modelcontextprotocol/server-sequential-thinking"
        "@upstash/context7-mcp"
        "@magnusrodseth/shadcn-mcp-server"
    )
    
    for package in "${PACKAGES[@]}"; do
        log_info "패키지 확인: $package"
        npx -y "$package" --version >/dev/null 2>&1 || {
            log_warning "$package 다운로드 필요"
        }
    done
    
    # Python 기반 MCP 서버 확인
    if command -v uvx >/dev/null 2>&1; then
        log_info "Python MCP 서버 확인 중..."
        uvx mcp-server-time --version >/dev/null 2>&1 || {
            log_warning "mcp-server-time 다운로드 필요"
        }
        
        uvx --from git+https://github.com/oraios/serena serena-mcp-server --version >/dev/null 2>&1 || {
            log_warning "serena-mcp-server 다운로드 필요"
        }
    fi
    
    log_success "자동 복구 완료"
}

# 성능 최적화 제안
performance_recommendations() {
    log_info "성능 최적화 제안..."
    
    # WSL 메모리 확인
    if grep -qi microsoft /proc/version; then
        TOTAL_MEM=$(free -h | awk '/^Mem:/ {print $2}')
        AVAILABLE_MEM=$(free -h | awk '/^Mem:/ {print $7}')
        log_info "WSL 메모리: $TOTAL_MEM 총량, $AVAILABLE_MEM 사용 가능"
        
        # 메모리가 8GB 미만이면 경고
        TOTAL_MEM_GB=$(free -g | awk '/^Mem:/ {print $2}')
        if [[ $TOTAL_MEM_GB -lt 8 ]]; then
            log_warning "권장 메모리 8GB 이상, 현재: ${TOTAL_MEM_GB}GB"
            log_info "WSL 메모리 증설: .wslconfig 파일에서 memory=10GB 설정"
        fi
    fi
    
    # Node.js 버전 확인
    NODE_MAJOR_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
    if [[ $NODE_MAJOR_VERSION -lt 20 ]]; then
        log_warning "Node.js 20+ 권장, 현재: $(node --version)"
    fi
    
    log_info "최적화 제안 완료"
}

# 상세 리포트 생성
generate_report() {
    REPORT_FILE="mcp-health-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "MCP 서버 헬스체크 리포트"
        echo "생성 시간: $(date)"
        echo "========================="
        echo ""
        
        echo "환경 정보:"
        echo "- Claude Code: $(claude --version 2>/dev/null || echo 'N/A')"
        echo "- Node.js: $(node --version 2>/dev/null || echo 'N/A')"
        echo "- npm: $(npm --version 2>/dev/null || echo 'N/A')"
        echo "- uvx: $(uvx --version 2>/dev/null || echo 'N/A')"
        echo "- OS: $(uname -a)"
        echo ""
        
        echo "MCP 서버 상태:"
        claude mcp list 2>&1 || echo "MCP 상태 확인 실패"
        echo ""
        
        echo "환경변수 상태:"
        if [[ -f ".env.local" ]]; then
            echo "✓ .env.local 파일 존재"
            grep -c "^[A-Z_]*=" .env.local | xargs echo "환경변수 개수:"
        else
            echo "✗ .env.local 파일 없음"
        fi
        
    } > "$REPORT_FILE"
    
    log_success "상세 리포트 생성: $REPORT_FILE"
}

# 메인 실행 함수
main() {
    echo "🤖 OpenManager VIBE v5 - MCP 헬스체크"
    echo "======================================="
    echo ""
    
    # 단계별 실행
    check_environment
    echo ""
    
    check_env_vars
    echo ""
    
    if check_mcp_servers; then
        echo ""
        log_success "🎉 모든 MCP 서버가 정상적으로 작동하고 있습니다!"
        performance_recommendations
    else
        echo ""
        log_warning "일부 MCP 서버에 문제가 있습니다. 자동 복구를 시도합니다..."
        auto_recovery
        echo ""
        
        log_info "복구 후 재테스트 중..."
        if check_mcp_servers; then
            log_success "🎉 자동 복구 성공!"
        else
            log_error "❌ 자동 복구 실패. 수동 확인이 필요합니다."
        fi
    fi
    
    echo ""
    generate_report
    
    echo ""
    log_info "헬스체크 완료!"
}

# 스크립트 실행
main "$@"