#!/bin/bash
# cleanup-ports.sh - 개발/테스트 서버 포트 정리 및 관리
# 작성일: 2025-11-29
# 목적: 좀비 프로세스 방지 및 포트 충돌 해결

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 포트 대역 정의 (표준화)
DEV_PORTS=(3000 3001 3002)      # 개발 서버
TEST_PORTS=(5173 5174 5175)     # 테스트 서버 (Vite, Playwright)
API_PORTS=(8080 8081 9090)      # API/Mock 서버

ALL_PORTS=("${DEV_PORTS[@]}" "${TEST_PORTS[@]}" "${API_PORTS[@]}")

# 함수: 포트 사용 프로세스 확인
check_port_usage() {
    echo -e "${YELLOW}=== 포트 사용 현황 ===${NC}"

    local found_processes=false

    for port in "${ALL_PORTS[@]}"; do
        local pids=$(lsof -ti:"$port" 2>/dev/null || true)

        if [ -n "$pids" ]; then
            found_processes=true
            echo -e "${RED}포트 $port 사용 중:${NC}"

            for pid in $pids; do
                ps -p "$pid" -o pid,comm,args --no-headers 2>/dev/null || true
            done
            echo ""
        fi
    done

    if [ "$found_processes" = false ]; then
        echo -e "${GREEN}모든 포트가 비어있습니다.${NC}"
    fi
}

# 함수: 특정 포트 정리
cleanup_port() {
    local port=$1
    local pids=$(lsof -ti:"$port" 2>/dev/null || true)

    if [ -n "$pids" ]; then
        echo -e "${YELLOW}포트 $port 정리 중...${NC}"

        for pid in $pids; do
            local process_name=$(ps -p "$pid" -o comm --no-headers 2>/dev/null || echo "unknown")
            echo "  - PID $pid ($process_name) 종료 중..."
            kill -15 "$pid" 2>/dev/null || true
        done

        sleep 1

        # 강제 종료 확인
        pids=$(lsof -ti:"$port" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo -e "${RED}  강제 종료 필요 (SIGKILL)${NC}"
            for pid in $pids; do
                kill -9 "$pid" 2>/dev/null || true
            done
        fi

        echo -e "${GREEN}  포트 $port 정리 완료${NC}"
    fi
}

# 함수: 개발 서버만 정리
cleanup_dev_servers() {
    echo -e "${YELLOW}=== 개발 서버 정리 ===${NC}"

    # Next.js dev 서버 종료
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "next-server" 2>/dev/null || true

    # 개발 포트 정리
    for port in "${DEV_PORTS[@]}"; do
        cleanup_port "$port"
    done

    echo -e "${GREEN}개발 서버 정리 완료${NC}"
}

# 함수: 테스트 서버만 정리
cleanup_test_servers() {
    echo -e "${YELLOW}=== 테스트 서버 정리 ===${NC}"

    # Vite, Playwright 서버 종료
    pkill -f "vite" 2>/dev/null || true
    pkill -f "playwright" 2>/dev/null || true

    # 테스트 포트 정리
    for port in "${TEST_PORTS[@]}"; do
        cleanup_port "$port"
    done

    echo -e "${GREEN}테스트 서버 정리 완료${NC}"
}

# 함수: 모든 서버 정리
cleanup_all() {
    echo -e "${YELLOW}=== 전체 서버 정리 ===${NC}"

    cleanup_dev_servers
    cleanup_test_servers

    # API 포트 정리
    for port in "${API_PORTS[@]}"; do
        cleanup_port "$port"
    done

    echo -e "${GREEN}전체 정리 완료${NC}"
}

# 사용법 출력
usage() {
    cat <<EOF
사용법: $0 [옵션]

옵션:
  check       - 현재 포트 사용 현황만 확인
  dev         - 개발 서버만 정리 (포트 ${DEV_PORTS[*]})
  test        - 테스트 서버만 정리 (포트 ${TEST_PORTS[*]})
  all         - 모든 서버 정리 (기본값)
  -h, --help  - 사용법 출력

예시:
  $0 check          # 포트 현황만 확인
  $0 dev            # 개발 서버만 정리
  $0 all            # 모든 서버 정리
EOF
}

# 메인 로직
main() {
    local action="${1:-all}"

    case "$action" in
        check)
            check_port_usage
            ;;
        dev)
            cleanup_dev_servers
            check_port_usage
            ;;
        test)
            cleanup_test_servers
            check_port_usage
            ;;
        all)
            cleanup_all
            check_port_usage
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}오류: 알 수 없는 옵션 '$action'${NC}"
            usage
            exit 1
            ;;
    esac
}

main "$@"
