#!/bin/bash

# Windows MCP 서버 자동 설치 스크립트 (Git Bash)
# 작성일: 2025-08-12
# Claude Code v1.0.73 용
# 11개 MCP 서버 완전 자동 설치

# 설정
PROJECT_PATH="D:\\cursor\\openmanager-vibe-v5"
SKIP_ENV_SERVERS=false
TEST_ONLY=false

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'  
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 인자 처리
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-env)
            SKIP_ENV_SERVERS=true
            shift
            ;;
        --test-only)
            TEST_ONLY=true
            shift
            ;;
        --project-path)
            PROJECT_PATH="$2"
            shift 2
            ;;
        *)
            echo "사용법: $0 [--skip-env] [--test-only] [--project-path PATH]"
            exit 1
            ;;
    esac
done

# 로그 함수
log() {
    echo -e "🤖 [$(date +'%H:%M:%S')] $1"
}

log_success() {
    log "${GREEN}$1${NC}"
}

log_warning() {
    log "${YELLOW}$1${NC}"
}

log_error() {
    log "${RED}$1${NC}"
}

log_info() {
    log "${CYAN}$1${NC}"
}

log_header() {
    echo
    echo -e "${PURPLE}============================================================${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}============================================================${NC}"
}

# 사전 요구사항 검사
test_prerequisites() {
    log_header "사전 요구사항 검사"
    
    local errors=()
    
    # Node.js 검사
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version | sed 's/v//')
        local major_version=$(echo $node_version | cut -d. -f1)
        if [ "$major_version" -ge 22 ]; then
            log_success "✅ Node.js v$node_version"
        else
            errors+=("Node.js v22+ 필요 (현재: v$node_version)")
        fi
    else
        errors+=("Node.js가 설치되지 않음")
    fi
    
    # Python 검사
    if command -v python >/dev/null 2>&1; then
        local python_version=$(python --version 2>/dev/null)
        log_success "✅ $python_version"
        
        # uvx 검사
        local uvx_path="$USERPROFILE/AppData/Local/Programs/Python/Python311/Scripts/uvx.exe"
        if [ -f "$uvx_path" ]; then
            log_success "✅ uvx 설치됨: $uvx_path"
        else
            log_warning "⚠️  uvx 경로를 찾을 수 없음, pip install uv 실행 중..."
            pip install uv
        fi
    elif command -v py >/dev/null 2>&1; then
        local python_version=$(py --version 2>/dev/null)
        log_success "✅ $python_version"
    else
        errors+=("Python 3.11+ 필요")
    fi
    
    # Claude Code 검사
    if command -v claude >/dev/null 2>&1; then
        local claude_version=$(claude --version 2>/dev/null | head -n1)
        log_success "✅ Claude Code $claude_version"
    else
        errors+=("Claude Code가 설치되지 않음")
    fi
    
    if [ ${#errors[@]} -gt 0 ]; then
        log_error "❌ 사전 요구사항 실패:"
        for error in "${errors[@]}"; do
            log_error "   - $error"
        done
        exit 1
    fi
    
    log_success "✅ 모든 사전 요구사항 통과!"
}

# NPX 기반 서버 설치
install_npx_servers() {
    log_header "1️⃣ NPX 기반 서버 설치 (4개)"
    
    declare -A npx_servers=(
        ["filesystem"]="cmd /c npx -y @modelcontextprotocol/server-filesystem $PROJECT_PATH"
        ["memory"]="cmd /c npx -y @modelcontextprotocol/server-memory"
        ["github"]="cmd /c npx -y @modelcontextprotocol/server-github" 
        ["sequential-thinking"]="cmd /c npx -y @modelcontextprotocol/server-sequential-thinking"
    )
    
    for server in "${!npx_servers[@]}"; do
        log_info "설치 중: $server"
        if claude mcp add "$server" "${npx_servers[$server]}" 2>/dev/null; then
            log_success "✅ $server 설치 완료"
        else
            log_error "❌ $server 설치 실패"
        fi
    done
}

# Python 기반 서버 설치
install_python_servers() {
    log_header "2️⃣ Python 기반 서버 설치 (2개)"
    
    local username=$(whoami)
    local uvx_path="C:\\Users\\$username\\AppData\\Local\\Programs\\Python\\Python311\\Scripts\\uvx.exe"
    
    if [ ! -f "$uvx_path" ]; then
        log_error "❌ uvx 경로를 찾을 수 없습니다: $uvx_path"
        log_info "🔧 다음 명령어로 설치하세요: pip install uv"
        return
    fi
    
    # Time 서버
    log_info "설치 중: time"
    if claude mcp add time "\"$uvx_path\" mcp-server-time" 2>/dev/null; then
        log_success "✅ time 설치 완료"
    else
        log_error "❌ time 설치 실패"
    fi
    
    # Serena 서버 (시간이 오래 걸릴 수 있음)
    if [ "$TEST_ONLY" != "true" ]; then
        log_info "설치 중: serena (GitHub에서 다운로드 중...)"
        local serena_command="\"$uvx_path\" --from git+https://github.com/oraios/serena serena-mcp-server"
        if claude mcp add serena "$serena_command" 2>/dev/null; then
            log_success "✅ serena 설치 완료"
        else
            log_error "❌ serena 설치 실패"
            log_warning "💡 인터넷 연결 확인 또는 나중에 수동 설치 필요"
        fi
    else
        log_warning "⏩ serena 설치 스킵 (테스트 모드)"
    fi
}

# npm 전역 서버 설치
install_npm_global_servers() {
    log_header "3️⃣ npm 전역 서버 설치 (2개)"
    
    # 전역 패키지 설치
    log_info "npm 전역 패키지 설치 중..."
    if npm install -g context7-mcp-server shadcn-ui-mcp-server --silent 2>/dev/null; then
        log_success "✅ 전역 패키지 설치 완료"
    else
        log_error "❌ 전역 패키지 설치 실패"
        return
    fi
    
    # MCP 서버 등록
    declare -A global_servers=(
        ["context7"]="npx -y context7-mcp-server"
        ["shadcn-ui"]="npx -y shadcn-ui-mcp-server"
    )
    
    for server in "${!global_servers[@]}"; do
        log_info "등록 중: $server"
        if claude mcp add "$server" "${global_servers[$server]}" 2>/dev/null; then
            log_success "✅ $server 등록 완료"
        else
            log_error "❌ $server 등록 실패"
        fi
    done
}

# 기본 서버 (환경변수 불필요) 설치
install_basic_servers() {
    log_header "4️⃣ 기본 서버 (환경변수 불필요) 설치"
    
    log_info "설치 중: playwright"
    if claude mcp add playwright "cmd /c npx -y @playwright/mcp@latest" 2>/dev/null; then
        log_success "✅ playwright 설치 완료"
    else
        log_error "❌ playwright 설치 실패"
    fi
}

# 환경변수 필요 서버 안내
show_env_server_guide() {
    log_header "5️⃣ 환경변수 필요 서버 안내"
    
    if [ "$SKIP_ENV_SERVERS" = "true" ]; then
        log_warning "⏩ 환경변수 서버 설치 스킵됨"
        return
    fi
    
    log_info "🔐 다음 서버들은 API 키가 필요합니다:"
    echo
    
    log_info "📊 Supabase MCP (PostgreSQL 데이터베이스)"
    log_warning "   - SUPABASE_URL"
    log_warning "   - SUPABASE_ANON_KEY"
    log_warning "   - SUPABASE_SERVICE_ROLE_KEY"
    log_warning "   - SUPABASE_ACCESS_TOKEN (service_role_key와 동일)"
    echo
    
    log_info "🌐 Tavily MCP (웹 검색)"
    log_warning "   - TAVILY_API_KEY (https://tavily.com에서 발급)"
    echo
    
    log_info "💡 수동 설치 방법은 docs/windows-mcp-complete-installation-guide.md 참조"
}

# 설치 검증
test_installation() {
    log_header "✅ 설치 검증"
    
    log_info "API 재시작 중..."
    if claude api restart >/dev/null 2>&1; then
        sleep 10
        log_success "✅ API 재시작 완료"
    else
        log_error "❌ API 재시작 실패"
    fi
    
    log_info "MCP 서버 상태 확인 중..."
    local mcp_output=$(claude mcp list 2>&1)
    
    local connected_count=$(echo "$mcp_output" | grep -c "✓ Connected" || true)
    local failed_count=$(echo "$mcp_output" | grep -c "✗ Failed" || true)
    
    if [ $failed_count -eq 0 ]; then
        log_success "📊 연결 결과: $connected_count 성공, $failed_count 실패"
    else
        log_warning "📊 연결 결과: $connected_count 성공, $failed_count 실패"
        log_warning "⚠️  실패한 서버가 있습니다. 상세 내용:"
        echo "$mcp_output" | grep "✗ Failed" | while read line; do
            log_error "   $line"
        done
    fi
}

# 메인 실행
main() {
    log_header "🚀 Windows MCP 서버 자동 설치"
    log_info "Claude Code v1.0.73 용 MCP 서버 11개 설치"
    log_info "프로젝트 경로: $PROJECT_PATH"
    
    if [ "$TEST_ONLY" = "true" ]; then
        log_warning "🧪 테스트 모드 실행"
    fi
    
    # 실행
    test_prerequisites
    install_npx_servers
    install_python_servers
    install_npm_global_servers
    install_basic_servers
    show_env_server_guide
    test_installation
    
    log_header "🎉 설치 완료!"
    log_success "✅ 기본 MCP 서버 설치가 완료되었습니다."
    log_info "🔧 환경변수 필요 서버는 수동 설치 필요"
    log_info "📖 상세 가이드: docs/windows-mcp-complete-installation-guide.md"
    echo
    echo -e "${PURPLE}다음 명령어로 최종 확인:${NC}"
    log_info "  claude mcp list"
}

# 스크립트 실행
main "$@"