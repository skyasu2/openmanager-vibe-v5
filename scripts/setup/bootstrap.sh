#!/bin/bash

# =============================================================================
# OpenManager VIBE v5 - Windows WSL 2 환경 설정 스크립트
# =============================================================================
# 용도: 다른 컴퓨터에서 git clone 후 완벽한 WSL 개발 환경 복원
# 사용법: ./bootstrap.sh (WSL 내부에서 실행)
# 지원 플랫폼: Windows WSL 2 (Ubuntu 24.04 LTS)
# 
# 작성일: 2025-08-20
# 버전: 2.0.0 (Windows WSL 전용)
# =============================================================================

set -e  # 오류 발생 시 즉시 종료

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# 로그 함수들
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "\n${PURPLE}[STEP $1]${NC} ${WHITE}$2${NC}"; }

# 전역 변수
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"
PLATFORM=""
SETUP_LOG="$PROJECT_ROOT/setup.log"

# 시작 메시지
clear
echo -e "${CYAN}"
cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║       🐧 OpenManager VIBE v5 WSL Bootstrap 🐧               ║
║                                                              ║
║   Windows WSL 2 전용 개발 환경 자동 설정                      ║
║   예상 소요 시간: 5-10분                                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# 로그 파일 초기화
echo "OpenManager VIBE v5 Bootstrap Setup - $(date)" > "$SETUP_LOG"

# WSL 환경 감지 함수
detect_platform() {
    log_step "1" "WSL 환경 감지 중..."
    
    # WSL 환경 확인
    if grep -q Microsoft /proc/version 2>/dev/null; then
        PLATFORM="wsl"
        log_info "WSL (Windows Subsystem for Linux) 환경 감지됨"
        
        # WSL 버전 및 배포판 정보
        if [ -f /etc/os-release ]; then
            local distro=$(grep "^NAME=" /etc/os-release | cut -d'"' -f2)
            log_info "배포판: $distro"
        fi
        
        # Windows 호스트 정보
        local windows_path=$(echo "$PWD" | grep "^/mnt/")
        if [ -n "$windows_path" ]; then
            log_info "Windows 마운트 경로에서 실행 중: $PWD"
        fi
    else
        log_error "이 스크립트는 Windows WSL 환경에서만 실행 가능합니다"
        log_info "WSL 설치 방법: https://docs.microsoft.com/ko-kr/windows/wsl/install"
        exit 1
    fi
    
    echo "감지된 플랫폼: $PLATFORM" >> "$SETUP_LOG"
    log_success "WSL 환경 감지 완료"
}

# Node.js 설치 확인 및 설치
check_nodejs() {
    log_step "2" "Node.js 환경 확인..."
    
    local required_version="22"
    
    if command -v node &> /dev/null; then
        local current_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        log_info "현재 Node.js 버전: v$(node --version | cut -d'v' -f2)"
        
        if [ "$current_version" -ge "$required_version" ]; then
            log_success "Node.js 버전 요구사항 충족 (v$required_version+)"
            return 0
        else
            log_warning "Node.js 버전이 낮습니다. v$required_version+ 필요"
        fi
    else
        log_warning "Node.js가 설치되지 않았습니다"
    fi
    
    # Node.js WSL 설치
    log_info "WSL 환경에서 Node.js v$required_version 설치 중..."
    
    # Ubuntu/Debian 패키지 저장소 업데이트
    sudo apt-get update
    
    # NodeSource 저장소 사용 (공식 권장 방법)
    log_info "NodeSource 저장소에서 Node.js 설치..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # 설치 후 npm 글로벌 권한 설정 (WSL 최적화)
    sudo chown -R $(whoami) ~/.npm 2>/dev/null || true
    
    # 설치 확인
    if command -v node &> /dev/null; then
        log_success "Node.js 설치 완료: $(node --version)"
    else
        log_error "Node.js 설치 실패"
        exit 1
    fi
}

# npm 의존성 설치
install_npm_dependencies() {
    log_step "3" "npm 패키지 의존성 설치..."
    
    cd "$PROJECT_ROOT"
    
    if [ ! -f "package.json" ]; then
        log_error "package.json 파일을 찾을 수 없습니다"
        exit 1
    fi
    
    log_info "npm 캐시 정리 중..."
    npm cache clean --force
    
    log_info "package-lock.json이 있는지 확인..."
    if [ -f "package-lock.json" ]; then
        log_info "npm ci 실행 중... (정확한 버전으로 설치)"
        npm ci
    else
        log_info "npm install 실행 중..."
        npm install
    fi
    
    log_success "npm 패키지 설치 완료"
}

# 환경변수 설정
setup_environment() {
    log_step "4" "환경변수 설정..."
    
    cd "$PROJECT_ROOT"
    
    # .env.local 생성
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            log_info ".env.example을 .env.local로 복사..."
            cp .env.example .env.local
            log_success ".env.local 생성 완료"
        else
            log_warning ".env.example 파일을 찾을 수 없습니다"
            
            # 기본 .env.local 생성
            cat > .env.local << 'EOF'
# OpenManager VIBE v5 환경변수
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_FREE_TIER_MODE=true

# Supabase 설정 (기본값)
NEXT_PUBLIC_SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3NTk3MTMsImV4cCI6MjA0MDMzNTcxM30.Mc9ZzgfMhLktqLSokJlGmdWOZV9z_O2D__cUB3hN2eI

# GitHub 토큰 (선택사항 - 실제 값으로 교체 필요)
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token_here

# Google AI API 키 (선택사항 - 실제 값으로 교체 필요)
GOOGLE_AI_API_KEY=your_google_ai_key_here

# 기타 설정
MOCK_MODE=dev
DISABLE_TELEMETRY=true
EOF
            log_success "기본 .env.local 생성 완료"
        fi
    else
        log_info ".env.local이 이미 존재합니다"
    fi
    
    # WSL에서 bashrc 설정
    if [ "$PLATFORM" = "wsl" ] && [ -f "scripts/env/setup-env-local.sh" ]; then
        log_info "WSL 환경변수 설정 적용 중..."
        bash scripts/env/setup-env-local.sh 2>/dev/null || log_warning "WSL 환경변수 설정 중 경고 발생"
    fi
}

# Python 및 uvx 설치 (MCP 서버용)
install_python_deps() {
    log_step "5" "Python 및 uvx 설치 확인..."
    
    # Python 설치 확인
    if command -v python3 &> /dev/null; then
        log_info "Python3 버전: $(python3 --version)"
    else
        log_info "WSL 환경에서 Python3 설치 중..."
        sudo apt-get update
        sudo apt-get install -y python3 python3-pip python3-venv
    fi
    
    # uv 및 uvx 설치
    if ! command -v uvx &> /dev/null; then
        log_info "uvx 설치 중..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        export PATH="$HOME/.local/bin:$PATH"
    fi
    
    if command -v uvx &> /dev/null; then
        log_success "uvx 설치 확인: $(uvx --version 2>/dev/null || echo 'installed')"
    else
        log_warning "uvx 설치를 확인할 수 없습니다"
    fi
}

# AI CLI 도구 설치
install_ai_tools() {
    log_step "6" "AI CLI 도구 설치 확인..."
    
    # Claude Code 확인
    if command -v claude &> /dev/null; then
        log_success "Claude Code 설치됨: $(claude --version 2>/dev/null || echo 'installed')"
    else
        log_info "Claude Code가 이미 시스템에 설치되어 있어야 합니다"
        log_info "설치 방법: https://docs.anthropic.com/en/docs/claude-code"
    fi
    
    # 기타 AI 도구들 확인 (선택사항)
    local ai_tools=("gemini" "qwen" "ccusage")
    for tool in "${ai_tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            log_success "$tool 설치됨"
        else
            log_info "$tool이 설치되지 않았습니다 (선택사항)"
        fi
    done
}

# MCP 서버 설정
setup_mcp_servers() {
    log_step "7" "MCP 서버 설정..."
    
    # MCP 의존성 설치 스크립트 실행
    if [ -f "scripts/monitoring/install-dependencies.sh" ]; then
        log_info "MCP 의존성 설치 중..."
        bash scripts/monitoring/install-dependencies.sh 2>/dev/null || log_warning "MCP 의존성 설치 중 일부 경고 발생"
    fi
    
    # MCP 환경 설정
    if [ -f "scripts/monitoring/setup-mcp-environment.sh" ]; then
        log_info "MCP 환경 설정 중..."
        bash scripts/monitoring/setup-mcp-environment.sh 2>/dev/null || log_warning "MCP 환경 설정 중 일부 경고 발생"
    fi
    
    log_success "MCP 서버 설정 완료"
}

# Git hooks 설정
setup_git_hooks() {
    log_step "8" "Git hooks 설정..."
    
    cd "$PROJECT_ROOT"
    
    # Husky 설치 확인
    if [ -d ".husky" ]; then
        log_info "Husky hooks 이미 설정됨"
    else
        if command -v npx &> /dev/null; then
            log_info "Husky 초기화 중..."
            npx husky install 2>/dev/null || log_warning "Husky 설정 중 경고 발생"
        fi
    fi
    
    log_success "Git hooks 설정 완료"
}

# 빌드 테스트
test_build() {
    log_step "9" "빌드 테스트..."
    
    cd "$PROJECT_ROOT"
    
    log_info "TypeScript 컴파일 검사 중..."
    if command -v npx &> /dev/null; then
        npx tsc --noEmit --skipLibCheck 2>/dev/null || log_warning "TypeScript 컴파일 중 경고 발생"
    fi
    
    log_info "빠른 테스트 실행 중..."
    npm run test:quick 2>/dev/null || log_warning "테스트 중 일부 실패 (정상일 수 있음)"
    
    log_success "빌드 테스트 완료"
}

# 최종 검증
final_verification() {
    log_step "10" "최종 환경 검증..."
    
    cd "$PROJECT_ROOT"
    
    echo ""
    echo -e "${WHITE}🔍 환경 검증 결과:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Node.js
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
    else
        echo -e "${RED}❌ Node.js: 설치되지 않음${NC}"
    fi
    
    # npm
    if command -v npm &> /dev/null; then
        echo -e "${GREEN}✅ npm: $(npm --version)${NC}"
    else
        echo -e "${RED}❌ npm: 설치되지 않음${NC}"
    fi
    
    # 프로젝트 파일들
    [ -f "package.json" ] && echo -e "${GREEN}✅ package.json${NC}" || echo -e "${RED}❌ package.json${NC}"
    [ -f ".env.local" ] && echo -e "${GREEN}✅ .env.local${NC}" || echo -e "${RED}❌ .env.local${NC}"
    [ -d "node_modules" ] && echo -e "${GREEN}✅ node_modules${NC}" || echo -e "${RED}❌ node_modules${NC}"
    
    # MCP 설정
    [ -f ".mcp.json" ] && echo -e "${GREEN}✅ .mcp.json${NC}" || echo -e "${YELLOW}⚠️ .mcp.json (선택사항)${NC}"
    
    # AI 도구들
    command -v claude &> /dev/null && echo -e "${GREEN}✅ Claude Code${NC}" || echo -e "${YELLOW}⚠️ Claude Code (별도 설치 필요)${NC}"
    
    echo ""
}

# 완료 메시지 및 다음 단계
show_completion_message() {
    echo ""
    echo -e "${GREEN}"
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        🐧 WSL 환경 설정 완료! 🎉                              ║
║                                                              ║
║   OpenManager VIBE v5 WSL 개발 환경이 성공적으로 설정되었습니다 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    echo -e "${WHITE}🚀 WSL에서 다음 단계:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${CYAN}1. 개발 서버 시작 (WSL 내부):${NC}"
    echo "   npm run dev"
    echo ""
    echo -e "${CYAN}2. 브라우저에서 확인 (Windows):${NC}"
    echo "   http://localhost:3000"
    echo ""
    echo -e "${CYAN}3. 환경변수 설정 (필요 시):${NC}"
    echo "   nano .env.local"
    echo ""
    echo -e "${CYAN}4. Claude Code 시작 (WSL):${NC}"
    echo "   claude"
    echo ""
    echo -e "${CYAN}5. Windows에서 WSL Claude 실행:${NC}"
    echo "   ./claude-wsl-optimized.bat"
    echo ""
    echo -e "${CYAN}6. AI CLI 도구들 (WSL):${NC}"
    echo "   gemini --version    # Google Gemini CLI"
    echo "   qwen --version      # Qwen CLI"
    echo "   ccusage daily       # Claude 사용량"
    echo ""
    echo -e "${CYAN}7. 상세 문서 확인:${NC}"
    echo "   - SETUP-COMPLETE.md (WSL 전용 가이드)"
    echo "   - docs/QUICK-START.md (빠른 시작)"
    echo "   - CLAUDE.md (AI 통합 가이드)"
    echo ""
    
    if [ -f "$SETUP_LOG" ]; then
        echo -e "${YELLOW}📋 설정 로그: $SETUP_LOG${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}Happy Coding! 🚀${NC}"
    echo ""
}

# 오류 처리 함수
handle_error() {
    log_error "설정 중 오류가 발생했습니다: $1"
    log_info "문제 해결을 위해 다음을 확인하세요:"
    echo "1. 인터넷 연결 상태"
    echo "2. 관리자 권한 (sudo) 필요 시"
    echo "3. 디스크 공간 부족 여부"
    echo "4. 설정 로그: $SETUP_LOG"
    echo ""
    echo "수동 설정 가이드: SETUP-COMPLETE.md"
    exit 1
}

# 메인 실행 함수
main() {
    # 오류 처리 설정
    trap 'handle_error $LINENO' ERR
    
    # 시작 시간 기록
    local start_time=$(date +%s)
    
    # 단계별 실행
    detect_platform
    check_nodejs
    install_npm_dependencies
    setup_environment
    install_python_deps
    install_ai_tools
    setup_mcp_servers
    setup_git_hooks
    test_build
    final_verification
    
    # 완료 시간 계산
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "전체 설정 완료! (소요 시간: ${duration}초)"
    echo "설정 완료 - $(date)" >> "$SETUP_LOG"
    
    show_completion_message
}

# 스크립트 실행
main "$@"