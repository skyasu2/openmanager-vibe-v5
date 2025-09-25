#!/bin/bash

# 🛡️ WSL2 안전한 개발서버 시작 스크립트
# Codex + Gemini + Qwen AI 교차검증 기반 포트 충돌 해결 솔루션

set -e

echo "🧹 WSL2 포트 정리 및 안전한 개발서버 시작"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 포트 정리 함수
cleanup_port() {
    local PORT=$1
    local SERVICE_NAME=$2

    echo -e "${BLUE}🔍 포트 ${PORT} (${SERVICE_NAME}) 정리 중...${NC}"

    # WSL 측 포트 정리
    local WSL_PIDS=$(lsof -ti:$PORT 2>/dev/null || true)
    if [ ! -z "$WSL_PIDS" ]; then
        echo -e "${YELLOW}⚠️  WSL에서 포트 ${PORT}을 사용하는 프로세스 발견: ${WSL_PIDS}${NC}"
        echo "$WSL_PIDS" | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✅ WSL 포트 ${PORT} 정리 완료${NC}"
    else
        echo -e "${GREEN}✅ WSL 포트 ${PORT} 이미 사용 가능${NC}"
    fi

    # Windows 측 포트 확인 및 정리
    local WIN_PROCESSES=$(cmd.exe /c "netstat -ano | findstr :${PORT}" 2>/dev/null || true)
    if [ ! -z "$WIN_PROCESSES" ]; then
        echo -e "${YELLOW}⚠️  Windows에서 포트 ${PORT} 사용 중:${NC}"
        echo "$WIN_PROCESSES"

        # Windows 프로세스 ID 추출 및 종료 (조심스럽게)
        local WIN_PIDS=$(echo "$WIN_PROCESSES" | awk '{print $NF}' | sort -u)
        for pid in $WIN_PIDS; do
            if [ "$pid" -gt 1000 ] 2>/dev/null; then  # 시스템 프로세스 제외
                echo -e "${YELLOW}🔄 Windows PID ${pid} 종료 시도...${NC}"
                cmd.exe /c "taskkill /PID ${pid} /F" 2>/dev/null || true
            fi
        done
    fi

    # 포트 사용 가능 여부 최종 확인
    if nc -z localhost $PORT 2>/dev/null; then
        echo -e "${RED}❌ 포트 ${PORT} 여전히 사용 중${NC}"
        return 1
    else
        echo -e "${GREEN}✅ 포트 ${PORT} 완전히 해제됨${NC}"
        return 0
    fi
}

# 포트 대기 함수
wait_for_port_ready() {
    local PORT=$1
    local SERVICE_NAME=$2
    local TIMEOUT=30
    local COUNT=0

    echo -e "${BLUE}⏳ ${SERVICE_NAME} 포트 ${PORT} 준비 대기...${NC}"

    while [ $COUNT -lt $TIMEOUT ]; do
        if nc -z localhost $PORT 2>/dev/null; then
            echo -e "${GREEN}🎉 ${SERVICE_NAME} 포트 ${PORT} 준비 완료! (${COUNT}초)${NC}"
            return 0
        fi
        COUNT=$((COUNT + 1))
        sleep 1
    done

    echo -e "${RED}⏰ ${SERVICE_NAME} 포트 ${PORT} 준비 시간 초과${NC}"
    return 1
}

# 메인 실행
main() {
    echo -e "${BLUE}🚀 WSL2 포트 충돌 해결 시스템 v1.0 - AI 교차검증 기반${NC}"
    echo -e "${BLUE}📊 분석: Codex(실무) + Gemini(아키텍처) + Qwen(성능최적화)${NC}"
    echo ""

    # 기본 포트들 정리
    cleanup_port 3000 "Next.js Main"
    cleanup_port 3001 "API Server"
    cleanup_port 3002 "Admin Portal"

    # 추가 포트 범위 정리 (필요시)
    for port in 3003 3004 3005; do
        if nc -z localhost $port 2>/dev/null; then
            cleanup_port $port "Additional Service"
        fi
    done

    echo ""
    echo -e "${GREEN}🎯 모든 포트 정리 완료!${NC}"
    echo -e "${BLUE}📡 네트워크 상태 확인...${NC}"

    # 네트워크 상태 표시
    echo "현재 사용 중인 포트:"
    ss -tlnp | grep -E ':(300[0-9])' || echo "3000번대 포트 모두 사용 가능"

    echo ""
    echo -e "${GREEN}✨ 안전한 개발서버 시작 준비 완료!${NC}"

    # 인자가 있으면 해당 명령어 실행
    if [ $# -gt 0 ]; then
        echo -e "${BLUE}🏃 명령어 실행: $@${NC}"
        exec "$@"
    else
        echo -e "${YELLOW}💡 이제 다음 명령어로 안전하게 시작하세요:${NC}"
        echo "   npm run dev"
        echo "   또는"
        echo "   npm run dev:safe"
    fi
}

# 에러 핸들링
trap 'echo -e "${RED}❌ 스크립트 실행 중 오류 발생${NC}"; exit 1' ERR

# 스크립트 실행 권한 확인
if [ ! -x "$0" ]; then
    chmod +x "$0"
    echo -e "${GREEN}✅ 실행 권한 설정됨${NC}"
fi

# 필수 도구 확인
command -v lsof >/dev/null 2>&1 || { echo -e "${RED}❌ lsof가 설치되지 않음. sudo apt install lsof${NC}"; exit 1; }
command -v nc >/dev/null 2>&1 || { echo -e "${RED}❌ netcat이 설치되지 않음. sudo apt install netcat-openbsd${NC}"; exit 1; }

# 메인 함수 실행
main "$@"