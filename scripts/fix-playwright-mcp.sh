#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# WSL Playwright MCP 서버 복구 스크립트
#
# 용도: WSL 재시작 후 Playwright MCP 서버 안정화
# 작성일: 2025-09-22
# 버전: v1.0
# ═══════════════════════════════════════════════════════════════════════════════

set -e  # 에러 발생 시 스크립트 중단

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

# WSLg 준비 상태 확인
check_wslg_ready() {
    log_info "WSLg 초기화 상태 확인 중..."

    local max_wait=30
    local count=0

    while [ $count -lt $max_wait ]; do
        if [ -e /tmp/.X11-unix/X0 ]; then
            log_success "WSLg X11 소켓 준비 완료"
            return 0
        fi

        log_warning "WSLg 대기 중... ($((count+1))/$max_wait)"
        sleep 1
        ((count++))
    done

    log_error "WSLg 초기화 타임아웃"
    return 1
}

# 환경변수 설정
setup_environment() {
    log_info "환경변수 설정 중..."

    export DISPLAY=:0
    export LIBGL_ALWAYS_INDIRECT=1
    export PLAYWRIGHT_BROWSERS_PATH="$HOME/.cache/ms-playwright"
    export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

    # X11 권한 설정
    if command -v xhost &> /dev/null; then
        xhost +local: 2>/dev/null || true
        log_success "X11 권한 설정 완료"
    fi

    # D-Bus 세션 초기화
    if [ -z "$DBUS_SESSION_BUS_ADDRESS" ]; then
        eval $(dbus-launch --sh-syntax 2>/dev/null) || true
        log_success "D-Bus 세션 초기화 완료"
    fi

    log_success "환경변수 설정 완료"
}

# 잔류 프로세스 정리
cleanup_processes() {
    log_info "잔류 프로세스 정리 중..."

    # Chromium 프로세스 종료
    pkill -f chromium 2>/dev/null || true
    pkill -f playwright 2>/dev/null || true

    # X11 임시 파일 정리
    rm -rf /tmp/.X* 2>/dev/null || true

    # Chrome 락 파일 정리
    rm -rf ~/.cache/ms-playwright/*/SingletonLock 2>/dev/null || true

    log_success "프로세스 정리 완료"
}

# Playwright 브라우저 상태 확인
check_playwright_browsers() {
    log_info "Playwright 브라우저 상태 확인 중..."

    local chromium_path="$HOME/.cache/ms-playwright"

    if [ ! -d "$chromium_path" ]; then
        log_warning "Playwright 브라우저가 설치되지 않음. 설치 중..."
        npx playwright install chromium
        log_success "Playwright 브라우저 설치 완료"
    else
        log_success "Playwright 브라우저 설치 확인됨"
    fi

    # 버전 불일치 심볼릭 링크 제거
    find "$chromium_path" -name "chromium-*" -type l | while read link; do
        if [ ! -e "$link" ]; then
            log_warning "깨진 심볼릭 링크 제거: $link"
            rm -f "$link"
        fi
    done
}

# MCP 서버 연결 테스트
test_mcp_connection() {
    log_info "MCP 서버 연결 테스트 중..."

    # Claude MCP 상태 확인
    if claude mcp list | grep -q "playwright.*Connected"; then
        log_success "Playwright MCP 서버 연결 확인됨"
        return 0
    else
        log_warning "Playwright MCP 서버 연결 실패"
        return 1
    fi
}

# 메인 실행 함수
main() {
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo "              WSL Playwright MCP 서버 복구 스크립트 v1.0"
    echo "═══════════════════════════════════════════════════════════════════════════════"
    echo

    # 1. WSLg 준비 대기
    if ! check_wslg_ready; then
        log_error "WSLg 초기화 실패. 수동으로 WSL을 재시작해주세요."
        exit 1
    fi

    # 2. 환경변수 설정
    setup_environment

    # 3. 잔류 프로세스 정리
    cleanup_processes

    # 4. Playwright 브라우저 확인
    check_playwright_browsers

    # 5. 잠시 대기 (안정화)
    log_info "시스템 안정화 대기 중... (3초)"
    sleep 3

    # 6. MCP 서버 연결 테스트
    if test_mcp_connection; then
        echo
        log_success "🎉 Playwright MCP 서버 복구 완료!"
        echo
        echo "다음 명령어로 테스트할 수 있습니다:"
        echo "  claude mcp list"
        echo
    else
        echo
        log_warning "⚠️  MCP 서버가 아직 준비되지 않았습니다."
        echo "몇 초 후 다시 시도하거나 다음 명령어를 실행하세요:"
        echo "  claude mcp list"
        echo
    fi

    echo "═══════════════════════════════════════════════════════════════════════════════"
}

# 스크립트 실행
main "$@"