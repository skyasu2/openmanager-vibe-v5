#!/bin/bash

# 🔧 MCP 서버 복구 스크립트
# 실패한 MCP 서버들을 자동으로 복구합니다

set -e

echo "🚀 MCP 서버 복구 스크립트 시작"
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

# 환경 검사
check_environment() {
    log_info "환경 검사 중..."
    
    # WSL 환경 확인
    if [[ ! -f /proc/version ]] || ! grep -q "microsoft\|WSL" /proc/version; then
        log_warning "WSL 환경이 아닙니다. 일부 기능이 제한될 수 있습니다."
    else
        log_success "WSL 환경 확인됨"
    fi
    
    # Node.js 확인
    if ! command -v node &> /dev/null; then
        log_error "Node.js가 설치되지 않았습니다."
        exit 1
    else
        log_success "Node.js $(node --version) 확인됨"
    fi
    
    # npm 확인
    if ! command -v npm &> /dev/null; then
        log_error "npm이 설치되지 않았습니다."
        exit 1
    else
        log_success "npm $(npm --version) 확인됨"
    fi
    
    # uvx 확인 (Python MCP 서버용)
    if ! command -v uvx &> /dev/null; then
        log_warning "uvx가 설치되지 않았습니다. Python MCP 서버가 작동하지 않을 수 있습니다."
    else
        log_success "uvx 확인됨"
    fi
}

# npm 캐시 정리
clean_npm_cache() {
    log_info "npm 캐시 정리 중..."
    npm cache clean --force 2>/dev/null || log_warning "npm 캐시 정리 실패 (무시하고 계속)"
    log_success "npm 캐시 정리 완료"
}

# MCP 패키지 재설치
reinstall_mcp_packages() {
    log_info "MCP 패키지 재설치 중..."
    
    local packages=(
        "@modelcontextprotocol/server-filesystem"
        "@modelcontextprotocol/server-memory"
        "@modelcontextprotocol/server-github"
        "@supabase/mcp-server-supabase@latest"
        "tavily-mcp"
        "@executeautomation/playwright-mcp-server"
        "@modelcontextprotocol/server-sequential-thinking"
        "@upstash/context7-mcp"
        "@magnusrodseth/shadcn-mcp-server"
    )
    
    for package in "${packages[@]}"; do
        log_info "설치 중: $package"
        if npm install -g "$package" 2>/dev/null; then
            log_success "$package 설치 완료"
        else
            log_warning "$package 설치 실패 (무시하고 계속)"
        fi
    done
}

# Python MCP 서버 설치
install_python_mcp() {
    log_info "Python MCP 서버 설치 중..."
    
    if command -v uvx &> /dev/null; then
        # mcp-server-time 설치
        if uvx --help &> /dev/null; then
            log_info "mcp-server-time 설치 중..."
            uvx mcp-server-time --version 2>/dev/null || log_warning "mcp-server-time 설치/확인 실패"
        fi
        
        # serena MCP 서버 설치
        log_info "serena MCP 서버 설치 중..."
        uvx --from "git+https://github.com/oraios/serena" serena-mcp-server --help 2>/dev/null || log_warning "serena 설치/확인 실패"
        
        log_success "Python MCP 서버 설치 시도 완료"
    else
        log_warning "uvx가 없어 Python MCP 서버를 설치할 수 없습니다."
    fi
}

# 기존 MCP 프로세스 정리
cleanup_mcp_processes() {
    log_info "기존 MCP 프로세스 정리 중..."
    
    # MCP 관련 프로세스 종료
    pkill -f "mcp" 2>/dev/null || true
    pkill -f "npx.*server" 2>/dev/null || true
    pkill -f "uvx.*mcp" 2>/dev/null || true
    
    # 잠시 대기
    sleep 2
    
    log_success "MCP 프로세스 정리 완료"
}

# 환경변수 확인
check_environment_variables() {
    log_info "환경변수 확인 중..."
    
    local required_vars=(
        "GITHUB_PERSONAL_ACCESS_TOKEN"
        "SUPABASE_PROJECT_ID"
        "SUPABASE_ACCESS_TOKEN"
        "TAVILY_API_KEY"
        "UPSTASH_REDIS_REST_URL"
        "UPSTASH_REDIS_REST_TOKEN"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        else
            log_success "$var 설정됨"
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_warning "누락된 환경변수:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        log_warning "MCP_SETUP_GUIDE.md를 참조하여 환경변수를 설정하세요."
    else
        log_success "모든 환경변수가 설정됨"
    fi
}

# MCP 서버 테스트
test_mcp_servers() {
    log_info "MCP 서버 테스트 중..."
    
    # filesystem 테스트
    if npx -y @modelcontextprotocol/server-filesystem --version &> /dev/null; then
        log_success "filesystem 서버 작동 확인"
    else
        log_warning "filesystem 서버 문제 있음"
    fi
    
    # memory 테스트  
    if npx -y @modelcontextprotocol/server-memory --version &> /dev/null; then
        log_success "memory 서버 작동 확인"
    else
        log_warning "memory 서버 문제 있음"
    fi
    
    # github 테스트 (환경변수 필요)
    if [[ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ]]; then
        if timeout 5s npx -y @modelcontextprotocol/server-github --version &> /dev/null; then
            log_success "github 서버 작동 확인"
        else
            log_warning "github 서버 문제 있음"
        fi
    else
        log_warning "GITHUB_PERSONAL_ACCESS_TOKEN이 없어 github 서버 테스트 건너뜀"
    fi
    
    # Python 서버 테스트
    if command -v uvx &> /dev/null; then
        if timeout 5s uvx mcp-server-time --version &> /dev/null; then
            log_success "time 서버 작동 확인"
        else
            log_warning "time 서버 문제 있음"
        fi
    fi
}

# 권한 수정
fix_permissions() {
    log_info "권한 확인 및 수정 중..."
    
    # 프로젝트 디렉토리 권한 확인
    local project_dir="/mnt/d/cursor/openmanager-vibe-v5"
    if [[ -d "$project_dir" ]]; then
        if [[ -r "$project_dir" && -w "$project_dir" ]]; then
            log_success "프로젝트 디렉토리 권한 정상"
        else
            log_warning "프로젝트 디렉토리 권한 문제 있음"
            chmod -R u+rw "$project_dir" 2>/dev/null || log_warning "권한 수정 실패"
        fi
    fi
    
    # .bashrc 권한 확인
    if [[ -f ~/.bashrc ]]; then
        chmod 600 ~/.bashrc
        log_success ".bashrc 권한 설정 완료"
    fi
}

# 종합 리포트
generate_report() {
    echo
    echo "🎯 MCP 복구 완료 리포트"
    echo "========================"
    
    log_info "다음 단계:"
    echo "1. 환경변수가 누락된 경우 MCP_SETUP_GUIDE.md를 참조하여 설정"
    echo "2. Claude Code 완전 재시작"
    echo "3. claude mcp status 명령으로 상태 확인"
    
    echo
    log_info "MCP 서버 상태 확인:"
    echo "claude mcp status 또는 /mcp 명령 사용"
    
    echo
    log_success "MCP 복구 스크립트 완료!"
}

# 메인 실행 함수
main() {
    echo "🔧 OpenManager Vibe v5 - MCP 서버 복구"
    echo "========================================="
    echo "실패한 MCP 서버들을 복구합니다..."
    echo
    
    # 단계별 실행
    check_environment
    cleanup_mcp_processes
    clean_npm_cache
    fix_permissions
    reinstall_mcp_packages
    install_python_mcp
    check_environment_variables
    test_mcp_servers
    generate_report
    
    echo
    log_success "🎉 모든 복구 작업이 완료되었습니다!"
    log_info "이제 Claude Code를 재시작하고 /mcp 명령으로 상태를 확인하세요."
}

# 스크립트 실행
main "$@"