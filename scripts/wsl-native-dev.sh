#!/bin/bash

# 🐧 WSL 네이티브 개발 환경 스크립트
# cross-env 대신 WSL 네이티브 환경변수 사용
# Claude Code + MCP 서버와 병행 최적화

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# 로그 함수들
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "${CYAN}${BOLD}$1${NC}"
}

# WSL 환경 최적화 설정
setup_wsl_environment() {
    log_header "🐧 WSL 네이티브 환경변수 설정"

    # Node.js 메모리 최적화 (19GB WSL 환경 최적화)
    export NODE_OPTIONS="--max-old-space-size=4096 --gc-interval=100 --optimize-for-size"

    # Next.js 최적화 설정
    export NEXT_TELEMETRY_DISABLED=1
    export NEXT_DISABLE_DEVTOOLS=1

    # 개발 환경 최적화
    export NODE_ENV=development
    export PORT=3000

    # Claude Code MCP 서버와 충돌 방지
    export FORCE_COLOR=1
    export BROWSER=none

    log_success "환경변수 설정 완료"
    log_info "NODE_OPTIONS: $NODE_OPTIONS"
    log_info "PORT: $PORT"
}

# 포트 충돌 방지
check_and_cleanup_ports() {
    log_header "🔌 포트 충돌 검사 및 정리"

    local ports=(3000 3001 3002)

    for port in "${ports[@]}"; do
        local pid=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$pid" ]; then
            log_warning "포트 $port 사용 중 (PID: $pid)"
            kill -9 $pid 2>/dev/null || true
            log_success "포트 $port 정리 완료"
        else
            log_success "포트 $port 사용 가능"
        fi
    done
}

# Claude Code 호환성 체크
check_claude_compatibility() {
    log_header "🤖 Claude Code 호환성 체크"

    # Claude Code 실행 상태 확인
    if pgrep -f "claude" > /dev/null; then
        log_success "Claude Code 실행 중 - 병행 모드"
        export CLAUDE_CONCURRENT=true
    else
        log_info "Claude Code 미실행 - 독립 모드"
        export CLAUDE_CONCURRENT=false
    fi

    # MCP 서버 상태 체크
    if command -v claude >/dev/null 2>&1; then
        log_success "Claude CLI 사용 가능"
        log_info "MCP 서버 연결 확인..."
        claude mcp list | head -5 || log_warning "일부 MCP 서버 연결 불안정"
    else
        log_warning "Claude CLI 미설치"
    fi
}

# 개발 서버 시작 함수들
start_dev_stable() {
    log_header "🚀 안정화된 개발 서버 시작 (권장)"
    setup_wsl_environment
    check_and_cleanup_ports
    check_claude_compatibility

    log_info "next dev 시작..."
    exec npx next dev -p $PORT
}

start_dev_clean() {
    log_header "🧹 완전 정리된 개발 서버 시작"
    setup_wsl_environment
    export NEXT_TELEMETRY_DISABLED=1
    check_and_cleanup_ports

    log_info "next dev 시작 (텔레메트리 비활성화)..."
    exec npx next dev -p $PORT
}

start_dev_playwright() {
    log_header "🎭 Playwright 테스트 전용 개발 서버"
    setup_wsl_environment
    export PLAYWRIGHT_DEV=true
    check_and_cleanup_ports

    log_info "next dev 시작 (Playwright 모드)..."
    exec npx next dev -p $PORT
}

build_prod() {
    log_header "🏗️ 프로덕션 빌드"
    # 빌드용 메모리 설정 (더 보수적)
    export NODE_OPTIONS="--max-old-space-size=2048"
    export NEXT_DISABLE_DEVTOOLS=1

    log_info "next build 시작..."
    exec npx next build
}

# Claude Code 병행 사용 모드
start_with_claude() {
    log_header "🤖 Claude Code 병행 개발 모드"
    setup_wsl_environment
    check_and_cleanup_ports

    # Claude와의 충돌 최소화 설정
    export NEXT_DISABLE_DEVTOOLS=1
    export NEXT_TELEMETRY_DISABLED=1

    log_success "Claude Code와 병행 사용 최적화 완료"
    log_info "개발 서버를 백그라운드로 시작합니다..."

    # 백그라운드로 개발 서버 시작
    nohup npx next dev -p $PORT > dev-server.log 2>&1 &
    local dev_pid=$!

    log_success "개발 서버 시작됨 (PID: $dev_pid)"
    log_info "로그 확인: tail -f dev-server.log"
    log_info "서버 종료: kill $dev_pid"

    # PID 저장
    echo $dev_pid > .dev-server.pid

    # 서버 준비 대기
    log_info "서버 준비 대기..."
    sleep 5

    if curl -s http://localhost:$PORT > /dev/null; then
        log_success "개발 서버 준비 완료: http://localhost:$PORT"
    else
        log_warning "서버 응답 대기 중... 수동 확인 필요"
    fi
}

# 서버 상태 체크
check_status() {
    log_header "📊 개발 서버 상태"

    if [ -f ".dev-server.pid" ]; then
        local pid=$(cat .dev-server.pid)
        if ps -p $pid > /dev/null; then
            log_success "개발 서버 실행 중 (PID: $pid)"
            if curl -s http://localhost:3000 > /dev/null; then
                log_success "서버 응답 정상: http://localhost:3000"
            else
                log_warning "서버 실행 중이지만 응답 없음"
            fi
        else
            log_warning "PID 파일 존재하지만 프로세스 없음"
            rm -f .dev-server.pid
        fi
    else
        log_info "백그라운드 개발 서버 없음"
    fi

    # 포트 사용 현황
    log_info "포트 사용 현황:"
    ss -tlnp | grep -E ':(300[0-9])' || echo "  3000번대 포트 모두 사용 가능"
}

# 서버 종료
stop_server() {
    log_header "⏹️ 개발 서버 종료"

    if [ -f ".dev-server.pid" ]; then
        local pid=$(cat .dev-server.pid)
        if ps -p $pid > /dev/null; then
            kill $pid
            log_success "개발 서버 종료됨 (PID: $pid)"
        fi
        rm -f .dev-server.pid
    fi

    # 추가 정리
    pkill -f "next-server" 2>/dev/null || true
    check_and_cleanup_ports
    log_success "모든 개발 서버 프로세스 정리 완료"
}

# 도움말
show_help() {
    log_header "🚀 WSL 네이티브 개발 도구 사용법"
    echo ""
    echo "명령어:"
    echo "  stable     - 안정화된 개발 서버 시작 (권장)"
    echo "  clean      - 완전 정리된 개발 서버 시작"
    echo "  playwright - Playwright 테스트 전용 서버"
    echo "  build      - 프로덕션 빌드"
    echo "  claude     - Claude Code와 병행 개발 모드"
    echo "  status     - 서버 상태 확인"
    echo "  stop       - 서버 종료"
    echo "  help       - 이 도움말"
    echo ""
    echo "예시:"
    echo "  ./scripts/wsl-native-dev.sh stable"
    echo "  ./scripts/wsl-native-dev.sh claude"
    echo ""
    echo "특징:"
    echo "  ✅ cross-env 불필요 (WSL 네이티브)"
    echo "  ✅ Claude Code MCP 서버와 호환"
    echo "  ✅ 19GB WSL 환경 최적화"
    echo "  ✅ 포트 충돌 자동 해결"
    echo ""
}

# 메인 함수
main() {
    echo ""
    log_header "🐧 WSL 네이티브 개발 환경 - OpenManager VIBE v5.71.0"
    echo ""

    case "${1:-help}" in
        "stable")
            start_dev_stable
            ;;
        "clean")
            start_dev_clean
            ;;
        "playwright")
            start_dev_playwright
            ;;
        "build")
            build_prod
            ;;
        "claude")
            start_with_claude
            ;;
        "status")
            check_status
            ;;
        "stop")
            stop_server
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 스크립트 실행 권한 확인
if [ ! -x "$0" ]; then
    chmod +x "$0"
    log_success "실행 권한 설정됨"
fi

# 프로젝트 루트로 이동
cd "$(dirname "$0")/.."

# 메인 함수 실행
main "$@"