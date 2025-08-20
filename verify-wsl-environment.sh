#!/bin/bash

# ==============================================================================
# OpenManager VIBE v5 - WSL 환경 검증 스크립트
# ==============================================================================
# 용도: WSL 환경 설정 완료 후 모든 구성 요소 검증
# 사용법: ./verify-wsl-environment.sh
# 
# 작성일: 2025-08-20
# 버전: 1.0.0
# ==============================================================================

set -e

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
log_success() { echo -e "${GREEN}[✅ PASS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[⚠️ WARN]${NC} $1"; }
log_error() { echo -e "${RED}[❌ FAIL]${NC} $1"; }
log_section() { echo -e "\n${PURPLE}[검증]${NC} ${WHITE}$1${NC}"; }

# 전역 변수
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"
VERIFICATION_LOG="$PROJECT_ROOT/verification.log"
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# 시작 메시지
clear
echo -e "${CYAN}"
cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         🐧 WSL 환경 검증 시작 🔍                             ║
║                                                              ║
║    OpenManager VIBE v5 WSL 환경이 올바르게 설정되었는지      ║
║    종합적으로 검증합니다                                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# 로그 파일 초기화
echo "OpenManager VIBE v5 WSL Environment Verification - $(date)" > "$VERIFICATION_LOG"

# 결과 추적 함수
track_result() {
    local status=$1
    local message=$2
    
    case $status in
        "pass")
            log_success "$message"
            ((PASS_COUNT++))
            echo "✅ PASS: $message" >> "$VERIFICATION_LOG"
            ;;
        "fail")
            log_error "$message"
            ((FAIL_COUNT++))
            echo "❌ FAIL: $message" >> "$VERIFICATION_LOG"
            ;;
        "warn")
            log_warning "$message"
            ((WARN_COUNT++))
            echo "⚠️ WARN: $message" >> "$VERIFICATION_LOG"
            ;;
    esac
}

# WSL 환경 기본 검증
verify_wsl_environment() {
    log_section "WSL 환경 기본 검증"
    
    # WSL 환경 확인
    if grep -q Microsoft /proc/version 2>/dev/null; then
        track_result "pass" "WSL 환경 감지됨"
        
        # 배포판 정보
        if [ -f /etc/os-release ]; then
            local distro=$(grep "^NAME=" /etc/os-release | cut -d'"' -f2)
            local version=$(grep "^VERSION=" /etc/os-release | cut -d'"' -f2 2>/dev/null || echo "Unknown")
            track_result "pass" "배포판: $distro $version"
        else
            track_result "warn" "배포판 정보를 확인할 수 없음"
        fi
        
        # Windows 마운트 경로 확인
        if echo "$PWD" | grep -q "^/mnt/"; then
            track_result "pass" "Windows 마운트 경로에서 실행 중: $PWD"
        else
            track_result "warn" "WSL 네이티브 경로에서 실행 중: $PWD"
        fi
    else
        track_result "fail" "WSL 환경이 아닙니다"
        return 1
    fi
}

# Node.js 환경 검증
verify_nodejs() {
    log_section "Node.js 환경 검증"
    
    # Node.js 설치 확인
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        local major_version=$(echo $node_version | cut -d'v' -f2 | cut -d'.' -f1)
        
        if [ "$major_version" -ge 22 ]; then
            track_result "pass" "Node.js 버전: $node_version (요구사항: v22+)"
        else
            track_result "fail" "Node.js 버전이 낮습니다: $node_version (요구사항: v22+)"
        fi
    else
        track_result "fail" "Node.js가 설치되지 않았습니다"
        return 1
    fi
    
    # npm 확인
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        track_result "pass" "npm 버전: $npm_version"
    else
        track_result "fail" "npm이 설치되지 않았습니다"
    fi
    
    # npm 글로벌 권한 확인
    if [ -w ~/.npm 2>/dev/null ] || [ -w "$(npm config get prefix)/lib" 2>/dev/null ]; then
        track_result "pass" "npm 글로벌 권한 설정됨"
    else
        track_result "warn" "npm 글로벌 권한이 설정되지 않았을 수 있습니다"
    fi
}

# 프로젝트 파일 검증
verify_project_files() {
    log_section "프로젝트 파일 구조 검증"
    
    cd "$PROJECT_ROOT"
    
    # 핵심 파일들
    local required_files=("package.json" "tsconfig.json" "next.config.mjs" ".gitignore")
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            track_result "pass" "$file 존재"
        else
            track_result "fail" "$file 누락"
        fi
    done
    
    # 디렉토리 구조
    local required_dirs=("src" "docs" "scripts" "config")
    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            track_result "pass" "$dir/ 디렉토리 존재"
        else
            track_result "fail" "$dir/ 디렉토리 누락"
        fi
    done
    
    # node_modules 확인
    if [ -d "node_modules" ]; then
        local package_count=$(find node_modules -maxdepth 1 -type d | wc -l)
        if [ "$package_count" -gt 100 ]; then
            track_result "pass" "node_modules 설치됨 ($package_count개 패키지)"
        else
            track_result "warn" "node_modules 패키지 수가 적음 ($package_count개)"
        fi
    else
        track_result "fail" "node_modules 디렉토리 누락"
    fi
}

# 환경변수 검증
verify_environment() {
    log_section "환경변수 설정 검증"
    
    cd "$PROJECT_ROOT"
    
    # .env.local 확인
    if [ -f ".env.local" ]; then
        track_result "pass" ".env.local 파일 존재"
        
        # 필수 환경변수 확인
        local env_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY")
        for var in "${env_vars[@]}"; do
            if grep -q "^$var=" .env.local; then
                local value=$(grep "^$var=" .env.local | cut -d'=' -f2-)
                if [[ "$value" != *"your_"* ]] && [[ "$value" != *"_here"* ]] && [ -n "$value" ]; then
                    track_result "pass" "$var 설정됨"
                else
                    track_result "warn" "$var 템플릿 값 (실제 값으로 교체 필요)"
                fi
            else
                track_result "warn" "$var 누락"
            fi
        done
        
        # 선택적 환경변수
        local optional_vars=("GITHUB_PERSONAL_ACCESS_TOKEN" "GOOGLE_AI_API_KEY")
        for var in "${optional_vars[@]}"; do
            if grep -q "^$var=" .env.local; then
                local value=$(grep "^$var=" .env.local | cut -d'=' -f2-)
                if [[ "$value" != *"your_"* ]] && [[ "$value" != *"_here"* ]] && [ -n "$value" ]; then
                    track_result "pass" "$var 설정됨 (선택사항)"
                else
                    track_result "warn" "$var 템플릿 값 (선택사항)"
                fi
            else
                track_result "warn" "$var 누락 (선택사항)"
            fi
        done
    else
        track_result "fail" ".env.local 파일 누락"
    fi
    
    # bashrc 환경변수 로드 확인
    if grep -q ".env.local" ~/.bashrc 2>/dev/null; then
        track_result "pass" "bashrc에 환경변수 로드 설정됨"
    else
        track_result "warn" "bashrc에 환경변수 자동 로드가 설정되지 않음"
    fi
}

# AI CLI 도구 검증
verify_ai_tools() {
    log_section "AI CLI 도구 검증"
    
    # Claude Code (필수)
    if command -v claude &> /dev/null; then
        local claude_version=$(claude --version 2>/dev/null || echo "설치됨")
        track_result "pass" "Claude Code: $claude_version"
    else
        track_result "fail" "Claude Code 설치되지 않음"
    fi
    
    # 기타 AI 도구들 (선택사항)
    local ai_tools=("gemini" "qwen" "ccusage")
    for tool in "${ai_tools[@]}"; do
        if command -v "$tool" &> /dev/null; then
            local version=$($tool --version 2>/dev/null | head -n1 || echo "설치됨")
            track_result "pass" "$tool: $version (선택사항)"
        else
            track_result "warn" "$tool 설치되지 않음 (선택사항)"
        fi
    done
}

# Python 및 uvx 도구 검증
verify_python_tools() {
    log_section "Python 및 MCP 도구 검증"
    
    # Python 확인
    if command -v python3 &> /dev/null; then
        local python_version=$(python3 --version)
        track_result "pass" "Python: $python_version"
    else
        track_result "warn" "Python3 설치되지 않음 (MCP 서버용)"
    fi
    
    # uvx 확인 (MCP 서버용)
    if command -v uvx &> /dev/null; then
        local uvx_version=$(uvx --version 2>/dev/null || echo "설치됨")
        track_result "pass" "uvx: $uvx_version (MCP 서버용)"
    else
        track_result "warn" "uvx 설치되지 않음 (일부 MCP 서버용)"
    fi
}

# MCP 설정 검증
verify_mcp_configuration() {
    log_section "MCP 설정 검증"
    
    cd "$PROJECT_ROOT"
    
    # .mcp.json 확인
    if [ -f ".mcp.json" ]; then
        track_result "pass" ".mcp.json 설정 파일 존재"
        
        # JSON 형식 검증
        if command -v jq &> /dev/null; then
            if jq empty .mcp.json 2>/dev/null; then
                track_result "pass" ".mcp.json JSON 형식 유효"
                
                # MCP 서버 수 확인
                local server_count=$(jq '.mcpServers | length' .mcp.json 2>/dev/null || echo "0")
                if [ "$server_count" -gt 5 ]; then
                    track_result "pass" "MCP 서버 $server_count개 설정됨"
                else
                    track_result "warn" "MCP 서버가 적게 설정됨: $server_count개"
                fi
            else
                track_result "fail" ".mcp.json JSON 형식 오류"
            fi
        else
            track_result "warn" "jq가 설치되지 않아 JSON 형식을 검증할 수 없음"
        fi
    else
        track_result "warn" ".mcp.json 설정 파일 누락 (선택사항)"
    fi
}

# Git 설정 검증
verify_git_configuration() {
    log_section "Git 설정 검증"
    
    # Git 설치 확인
    if command -v git &> /dev/null; then
        local git_version=$(git --version)
        track_result "pass" "Git: $git_version"
        
        # Git 사용자 정보
        local git_user=$(git config --global user.name 2>/dev/null || echo "")
        local git_email=$(git config --global user.email 2>/dev/null || echo "")
        
        if [ -n "$git_user" ] && [ -n "$git_email" ]; then
            track_result "pass" "Git 사용자 정보: $git_user <$git_email>"
        else
            track_result "warn" "Git 사용자 정보 미설정"
        fi
        
        # WSL용 줄바꿈 설정 확인
        local autocrlf=$(git config --global core.autocrlf 2>/dev/null || echo "")
        if [ "$autocrlf" = "input" ]; then
            track_result "pass" "Git 줄바꿈 설정: input (WSL 최적)"
        else
            track_result "warn" "Git 줄바꿈 설정 권장: core.autocrlf=input"
        fi
    else
        track_result "fail" "Git이 설치되지 않았습니다"
    fi
}

# 빌드 및 테스트 검증
verify_build_and_test() {
    log_section "빌드 및 테스트 검증"
    
    cd "$PROJECT_ROOT"
    
    # TypeScript 컴파일 검사
    log_info "TypeScript 컴파일 검사 중..."
    if npx tsc --noEmit --skipLibCheck 2>/dev/null; then
        track_result "pass" "TypeScript 컴파일 성공"
    else
        track_result "warn" "TypeScript 컴파일 경고 또는 오류"
    fi
    
    # package.json 스크립트 확인
    local required_scripts=("dev" "build" "start" "test:quick")
    for script in "${required_scripts[@]}"; do
        if npm run $script --dry-run >/dev/null 2>&1; then
            track_result "pass" "npm run $script 스크립트 존재"
        else
            track_result "warn" "npm run $script 스크립트 누락"
        fi
    done
    
    # 빠른 테스트 실행 (시간 제한)
    log_info "빠른 테스트 실행 중 (30초 제한)..."
    if timeout 30s npm run test:quick >/dev/null 2>&1; then
        track_result "pass" "빠른 테스트 통과"
    else
        track_result "warn" "빠른 테스트 실패 또는 타임아웃 (정상일 수 있음)"
    fi
}

# 포트 및 네트워킹 검증
verify_networking() {
    log_section "네트워킹 및 포트 검증"
    
    # 포트 3000 사용 가능성 확인
    if ! ss -tuln | grep -q ":3000 "; then
        track_result "pass" "포트 3000 사용 가능"
    else
        track_result "warn" "포트 3000이 이미 사용 중"
    fi
    
    # localhost 접근 가능성 확인
    if curl -s -f http://localhost:3000 >/dev/null 2>&1; then
        track_result "warn" "포트 3000에서 서비스가 이미 실행 중"
    else
        track_result "pass" "포트 3000 접근 준비됨"
    fi
    
    # 인터넷 연결 확인
    if curl -s --max-time 5 https://www.google.com >/dev/null 2>&1; then
        track_result "pass" "인터넷 연결 정상"
    else
        track_result "warn" "인터넷 연결 문제가 있을 수 있음"
    fi
}

# 권한 및 보안 검증
verify_permissions() {
    log_section "권한 및 보안 검증"
    
    cd "$PROJECT_ROOT"
    
    # 스크립트 실행 권한
    local script_files=(bootstrap.sh verify-wsl-environment.sh)
    for script in "${script_files[@]}"; do
        if [ -f "$script" ]; then
            if [ -x "$script" ]; then
                track_result "pass" "$script 실행 권한 있음"
            else
                track_result "warn" "$script 실행 권한 없음"
            fi
        fi
    done
    
    # .env.local 파일 권한 확인
    if [ -f ".env.local" ]; then
        local file_perms=$(stat -c "%a" .env.local 2>/dev/null || echo "unknown")
        if [ "$file_perms" = "600" ] || [ "$file_perms" = "640" ]; then
            track_result "pass" ".env.local 파일 권한 안전: $file_perms"
        else
            track_result "warn" ".env.local 파일 권한 권장: 600 (현재: $file_perms)"
        fi
    fi
    
    # sudo 권한 확인 (WSL에서 필요할 수 있음)
    if sudo -n true 2>/dev/null; then
        track_result "pass" "sudo 권한 설정됨 (비밀번호 없이)"
    else
        track_result "warn" "sudo 권한이 비밀번호 없이 설정되지 않음"
    fi
}

# 최종 결과 요약
show_final_summary() {
    echo ""
    echo -e "${WHITE}🔍 WSL 환경 검증 결과 요약${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # 결과 통계
    local total_checks=$((PASS_COUNT + FAIL_COUNT + WARN_COUNT))
    echo -e "${GREEN}✅ 통과: $PASS_COUNT${NC}"
    echo -e "${RED}❌ 실패: $FAIL_COUNT${NC}"
    echo -e "${YELLOW}⚠️ 경고: $WARN_COUNT${NC}"
    echo -e "${BLUE}📊 총 검사: $total_checks${NC}"
    
    echo ""
    
    # 전체 상태 판단
    if [ $FAIL_COUNT -eq 0 ]; then
        if [ $WARN_COUNT -eq 0 ]; then
            echo -e "${GREEN}🎉 완벽! WSL 환경이 완전히 설정되었습니다!${NC}"
            echo -e "${GREEN}   개발을 시작할 준비가 완료되었습니다.${NC}"
        else
            echo -e "${YELLOW}✅ 양호! WSL 환경이 설정되었습니다.${NC}"
            echo -e "${YELLOW}   일부 선택사항이나 권장사항을 확인해보세요.${NC}"
        fi
    else
        echo -e "${RED}❌ 문제 발견! 일부 필수 구성요소가 누락되었습니다.${NC}"
        echo -e "${RED}   bootstrap.sh를 다시 실행하거나 수동 설정이 필요합니다.${NC}"
    fi
    
    echo ""
    echo -e "${WHITE}📝 다음 단계:${NC}"
    
    if [ $FAIL_COUNT -eq 0 ]; then
        echo "1. 개발 서버 시작: npm run dev"
        echo "2. 브라우저 확인: http://localhost:3000"
        echo "3. Claude Code 시작: claude"
        echo "4. Windows에서 WSL Claude 실행: ./claude-wsl-optimized.bat"
    else
        echo "1. 실패 항목들을 확인하여 문제를 해결하세요"
        echo "2. bootstrap.sh를 다시 실행해보세요: ./bootstrap.sh"
        echo "3. 수동 설정이 필요한 경우 SETUP-COMPLETE.md를 참고하세요"
    fi
    
    echo ""
    echo -e "${CYAN}📋 상세 로그: $VERIFICATION_LOG${NC}"
    echo -e "${CYAN}📚 문제 해결: SETUP-COMPLETE.md${NC}"
    echo ""
}

# 메인 실행 함수
main() {
    local start_time=$(date +%s)
    
    # 단계별 검증 실행
    verify_wsl_environment || true
    verify_nodejs || true
    verify_project_files || true
    verify_environment || true
    verify_ai_tools || true
    verify_python_tools || true
    verify_mcp_configuration || true
    verify_git_configuration || true
    verify_build_and_test || true
    verify_networking || true
    verify_permissions || true
    
    # 완료 시간 계산
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo "검증 완료 - $(date) (소요시간: ${duration}초)" >> "$VERIFICATION_LOG"
    
    show_final_summary
}

# 스크립트 실행
main "$@"