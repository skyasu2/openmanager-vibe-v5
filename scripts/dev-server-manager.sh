#!/bin/bash

# 🚀 개발 서버 관리 스크립트
# 중복 실행 방지 및 안전한 서버 시작/중지

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 현재 실행 중인 개발 서버 확인
check_existing_servers() {
    log_info "현재 실행 중인 개발 서버 확인..."
    
    local npm_processes=$(ps aux | grep -E "npm.*dev" | grep -v grep | wc -l)
    local next_processes=$(ps aux | grep -E "next-server" | grep -v grep | wc -l)
    
    if [ "$npm_processes" -gt 0 ] || [ "$next_processes" -gt 0 ]; then
        log_warning "발견된 개발 서버: npm 프로세스 $npm_processes개, next-server 프로세스 $next_processes개"
        
        echo ""
        echo "📋 실행 중인 프로세스 목록:"
        ps aux | grep -E "(npm.*dev|next-server)" | grep -v grep | while read line; do
            echo "   $line"
        done
        echo ""
        
        return 1
    else
        log_success "실행 중인 개발 서버 없음"
        return 0
    fi
}

# 포트 사용 상황 확인
check_ports() {
    log_info "포트 3000-3010 사용 상황 확인..."
    
    local used_ports=$(ss -tlnp | grep -E ":300[0-9]" | wc -l)
    
    if [ "$used_ports" -gt 0 ]; then
        log_warning "사용 중인 포트 발견:"
        ss -tlnp | grep -E ":300[0-9]" | while read line; do
            echo "   $line"
        done
        echo ""
        return 1
    else
        log_success "포트 3000-3010 모두 사용 가능"
        return 0
    fi
}

# 기존 서버 안전하게 종료
stop_existing_servers() {
    log_info "기존 개발 서버 종료 중..."
    
    # npm 프로세스 종료
    local npm_pids=$(ps aux | grep -E "npm.*dev" | grep -v grep | awk '{print $2}')
    for pid in $npm_pids; do
        if [ ! -z "$pid" ]; then
            log_info "npm 프로세스 종료: PID $pid"
            kill -TERM "$pid" 2>/dev/null || true
        fi
    done
    
    # next-server 프로세스 종료
    local next_pids=$(ps aux | grep -E "next-server" | grep -v grep | awk '{print $2}')
    for pid in $next_pids; do
        if [ ! -z "$pid" ]; then
            log_info "next-server 프로세스 종료: PID $pid"
            kill -TERM "$pid" 2>/dev/null || true
        fi
    done
    
    # 3초 대기 후 강제 종료 체크
    sleep 3
    
    local remaining_npm=$(ps aux | grep -E "npm.*dev" | grep -v grep | wc -l)
    local remaining_next=$(ps aux | grep -E "next-server" | grep -v grep | wc -l)
    
    if [ "$remaining_npm" -gt 0 ] || [ "$remaining_next" -gt 0 ]; then
        log_warning "일부 프로세스가 남아있음, 강제 종료 실행..."
        
        # 강제 종료
        local force_pids=$(ps aux | grep -E "(npm.*dev|next-server)" | grep -v grep | awk '{print $2}')
        for pid in $force_pids; do
            if [ ! -z "$pid" ]; then
                log_info "강제 종료: PID $pid"
                kill -9 "$pid" 2>/dev/null || true
            fi
        done
        
        sleep 2
    fi
    
    log_success "모든 개발 서버 종료 완료"
}

# 개발 서버 시작
start_dev_server() {
    log_info "새로운 개발 서버 시작..."
    
    # 프로젝트 루트 디렉토리로 이동
    cd "$(dirname "$0")/.."
    
    # 환경 체크
    if [ ! -f "package.json" ]; then
        log_error "package.json 파일을 찾을 수 없습니다. 프로젝트 루트에서 실행하세요."
        exit 1
    fi
    
    log_info "프로젝트 디렉토리: $(pwd)"
    log_info "Node.js 버전: $(node --version)"
    log_info "npm 버전: $(npm --version)"
    
    # 개발 서버 시작
    log_success "npm run dev 시작..."
    exec npm run dev
}

# 메인 함수
main() {
    echo "🚀 OpenManager 개발 서버 관리자"
    echo "================================="
    echo ""
    
    case "${1:-start}" in
        "check")
            check_existing_servers
            check_ports
            ;;
        "stop")
            stop_existing_servers
            ;;
        "start")
            if ! check_existing_servers; then
                log_warning "기존 서버가 실행 중입니다."
                read -p "기존 서버를 종료하고 새로 시작하시겠습니까? (y/N): " -n 1 -r
                echo ""
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    stop_existing_servers
                else
                    log_info "작업이 취소되었습니다."
                    exit 0
                fi
            fi
            
            start_dev_server
            ;;
        "restart")
            stop_existing_servers
            start_dev_server
            ;;
        "status")
            echo "📊 개발 서버 상태:"
            echo ""
            check_existing_servers || true
            echo ""
            check_ports || true
            ;;
        *)
            echo "사용법: $0 [check|start|stop|restart|status]"
            echo ""
            echo "명령어:"
            echo "  check    - 현재 실행 중인 서버 확인"
            echo "  start    - 개발 서버 시작 (중복 체크 포함)"
            echo "  stop     - 모든 개발 서버 종료"
            echo "  restart  - 서버 재시작"
            echo "  status   - 상태 확인"
            echo ""
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@"