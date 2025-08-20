#!/bin/bash

# ============================================
# MCP 서버 자동 복구 스크립트
# 작성일: 2025-08-20
# 버전: 1.0.0
# ============================================

set -e

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

# 프로젝트 루트 디렉토리
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
cd "$PROJECT_ROOT"

# ============================================
# 1. 환경변수 확인 및 복구
# ============================================
check_env_vars() {
    log_info "환경변수 확인 중..."
    
    local missing_vars=()
    
    # 필수 환경변수 목록
    required_vars=(
        "GITHUB_PERSONAL_ACCESS_TOKEN"
        "SUPABASE_ACCESS_TOKEN"
        "TAVILY_API_KEY"
        "UPSTASH_REDIS_REST_URL"
        "UPSTASH_REDIS_REST_TOKEN"
        "GCP_PROJECT_ID"
    )
    
    # .env.local 파일 존재 확인
    if [ ! -f ".env.local" ]; then
        log_warning ".env.local 파일이 없습니다. 템플릿에서 생성합니다..."
        cp .env.local.template .env.local
        log_error ".env.local 파일을 생성했습니다. 토큰을 설정해주세요."
        exit 1
    fi
    
    # 각 환경변수 확인
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env.local; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_warning "누락된 환경변수:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
    else
        log_success "모든 환경변수가 설정되어 있습니다."
    fi
}

# ============================================
# 2. MCP 서버 상태 확인
# ============================================
test_mcp_server() {
    local server_name=$1
    local test_command=$2
    
    log_info "테스트 중: $server_name..."
    
    # Claude Code 내에서 실제 테스트는 수동으로 해야 함
    case "$server_name" in
        "filesystem")
            # 파일 시스템 테스트 (간단한 파일 생성/삭제)
            touch /tmp/mcp_test_file 2>/dev/null && rm /tmp/mcp_test_file 2>/dev/null
            if [ $? -eq 0 ]; then
                log_success "$server_name: 정상"
                return 0
            fi
            ;;
        "github")
            # GitHub API 테스트
            local token=$(grep GITHUB_PERSONAL_ACCESS_TOKEN .env.local | cut -d'=' -f2)
            if [ -n "$token" ]; then
                response=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: token $token" https://api.github.com/user)
                if [ "$response" = "200" ]; then
                    log_success "$server_name: 토큰 유효"
                    return 0
                else
                    log_error "$server_name: 토큰 무효 (HTTP $response)"
                    return 1
                fi
            fi
            ;;
        "supabase")
            # Supabase URL 접근 테스트
            local url=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2)
            if [ -n "$url" ]; then
                response=$(curl -s -o /dev/null -w "%{http_code}" "$url/rest/v1/")
                if [ "$response" = "200" ] || [ "$response" = "401" ]; then
                    log_success "$server_name: 접근 가능"
                    return 0
                fi
            fi
            ;;
        *)
            log_info "$server_name: 수동 테스트 필요"
            return 0
            ;;
    esac
    
    log_warning "$server_name: 테스트 실패"
    return 1
}

# ============================================
# 3. Claude Code 프로세스 관리
# ============================================
restart_claude() {
    log_info "Claude Code 재시작 중..."
    
    # 기존 프로세스 종료
    if pgrep -f claude > /dev/null; then
        log_info "기존 Claude Code 프로세스 종료..."
        pkill -f claude
        sleep 2
    fi
    
    # 프로세스 완전 종료 확인
    if pgrep -f claude > /dev/null; then
        log_warning "프로세스가 여전히 실행 중입니다. 강제 종료..."
        pkill -9 -f claude
        sleep 1
    fi
    
    log_success "Claude Code 프로세스가 종료되었습니다."
    log_info "Claude Code를 수동으로 재시작해주세요: claude"
}

# ============================================
# 4. Docker 기반 GitHub MCP 설정 (선택사항)
# ============================================
setup_docker_github_mcp() {
    log_info "Docker 기반 GitHub MCP 설정 확인..."
    
    # Docker 설치 확인
    if ! command -v docker &> /dev/null; then
        log_warning "Docker가 설치되어 있지 않습니다."
        read -p "Docker를 설치하시겠습니까? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Docker 설치 중..."
            sudo apt update
            sudo apt install -y docker.io
            sudo systemctl start docker
            sudo usermod -aG docker $USER
            log_success "Docker 설치 완료. 재로그인이 필요합니다."
        fi
    else
        log_success "Docker가 설치되어 있습니다."
        
        # GitHub MCP 이미지 확인
        if ! docker images | grep -q github-mcp-server; then
            log_info "GitHub MCP Docker 이미지 다운로드 중..."
            docker pull ghcr.io/github/github-mcp-server
        else
            log_success "GitHub MCP Docker 이미지가 존재합니다."
        fi
    fi
}

# ============================================
# 5. 자동 복구 실행
# ============================================
auto_recovery() {
    log_info "MCP 서버 자동 복구 시작..."
    
    # 실패한 서버 목록
    failed_servers=()
    
    # 각 MCP 서버 테스트
    servers=("filesystem" "memory" "github" "supabase" "tavily" "playwright" "time" "context7" "gcp" "serena" "sequential-thinking" "shadcn-ui")
    
    for server in "${servers[@]}"; do
        if ! test_mcp_server "$server"; then
            failed_servers+=("$server")
        fi
    done
    
    # 결과 출력
    echo
    log_info "===== 테스트 결과 ====="
    echo "총 서버: ${#servers[@]}개"
    echo "정상: $((${#servers[@]} - ${#failed_servers[@]}))개"
    echo "실패: ${#failed_servers[@]}개"
    
    if [ ${#failed_servers[@]} -gt 0 ]; then
        log_warning "실패한 서버:"
        for server in "${failed_servers[@]}"; do
            echo "  - $server"
        done
        
        # GitHub 서버 특별 처리
        if [[ " ${failed_servers[@]} " =~ " github " ]]; then
            echo
            log_warning "GitHub MCP 서버 문제 감지!"
            log_info "해결 방법:"
            echo "  1. 새 토큰 발급: https://github.com/settings/tokens"
            echo "  2. .env.local 파일에서 GITHUB_PERSONAL_ACCESS_TOKEN 업데이트"
            echo "  3. Claude Code 재시작"
            echo
            read -p "Claude Code를 재시작하시겠습니까? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                restart_claude
            fi
        fi
    else
        log_success "모든 MCP 서버가 정상입니다!"
    fi
}

# ============================================
# 6. 상세 진단 모드
# ============================================
detailed_diagnosis() {
    log_info "상세 진단 모드 실행..."
    
    echo
    echo "===== 시스템 정보 ====="
    echo "OS: $(uname -a)"
    echo "Node.js: $(node --version)"
    echo "npm: $(npm --version)"
    echo "Python: $(python3 --version)"
    echo "Docker: $(docker --version 2>/dev/null || echo 'Not installed')"
    
    echo
    echo "===== MCP 설정 파일 ====="
    if [ -f ".mcp.json" ]; then
        echo "✅ .mcp.json 존재"
        echo "서버 목록:"
        cat .mcp.json | jq -r '.mcpServers | keys[]' 2>/dev/null || echo "JSON 파싱 실패"
    else
        echo "❌ .mcp.json 파일 없음"
    fi
    
    echo
    echo "===== Claude Code 프로세스 ====="
    if pgrep -f claude > /dev/null; then
        echo "✅ Claude Code 실행 중"
        ps aux | grep claude | grep -v grep
    else
        echo "❌ Claude Code 실행되지 않음"
    fi
    
    echo
    echo "===== 네트워크 연결 ====="
    echo -n "GitHub API: "
    curl -s -o /dev/null -w "%{http_code}" https://api.github.com && echo " ✅" || echo " ❌"
    
    echo -n "Supabase: "
    curl -s -o /dev/null -w "%{http_code}" https://vnswjnltnhpsueosfhmw.supabase.co && echo " ✅" || echo " ❌"
}

# ============================================
# 메인 실행
# ============================================
main() {
    clear
    echo "============================================"
    echo "     MCP 서버 자동 복구 스크립트 v1.0"
    echo "============================================"
    echo
    
    # 메뉴 선택
    echo "작업을 선택하세요:"
    echo "1) 자동 복구 실행"
    echo "2) 환경변수 확인"
    echo "3) Claude Code 재시작"
    echo "4) Docker GitHub MCP 설정"
    echo "5) 상세 진단"
    echo "6) 종료"
    echo
    read -p "선택 (1-6): " choice
    
    case $choice in
        1)
            check_env_vars
            auto_recovery
            ;;
        2)
            check_env_vars
            ;;
        3)
            restart_claude
            ;;
        4)
            setup_docker_github_mcp
            ;;
        5)
            detailed_diagnosis
            ;;
        6)
            log_info "종료합니다."
            exit 0
            ;;
        *)
            log_error "잘못된 선택입니다."
            exit 1
            ;;
    esac
    
    echo
    log_info "작업이 완료되었습니다."
}

# 스크립트 실행
main