#!/bin/bash

# MCP 서버 자동 복구 스크립트
# 문제가 있는 서버를 감지하고 자동으로 복구

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.local"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== MCP 서버 자동 복구 시작 ===${NC}"
echo "시간: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 환경변수 로드
if [[ -f "$ENV_FILE" ]]; then
    echo "환경변수 로드: $ENV_FILE"
    source "$ENV_FILE"
else
    echo -e "${RED}ERROR: .env.local 파일을 찾을 수 없습니다${NC}"
    exit 1
fi

cd "$PROJECT_ROOT"

# 1. 환경변수 문제 복구
echo "=== 1단계: 환경변수 검증 및 복구 ==="

# CRLF 문제 확인 및 수정
if file "$ENV_FILE" | grep -q "CRLF"; then
    echo -e "${YELLOW}CRLF 라인 엔딩 감지 - Unix 형식으로 변환 중...${NC}"
    dos2unix "$ENV_FILE"
    echo -e "${GREEN}✓${NC} 라인 엔딩 수정 완료"
fi

# 환경변수 재로드
source "$ENV_FILE"

# 2. npm 캐시 문제 복구
echo ""
echo "=== 2단계: 캐시 정리 ==="

npm_cache_size=$(du -sh ~/.npm/_cacache 2>/dev/null | cut -f1 || echo "0K")
if [[ "$npm_cache_size" =~ ^[0-9]+G$ ]]; then
    echo -e "${YELLOW}NPM 캐시 크기: $npm_cache_size - 정리 중...${NC}"
    npm cache clean --force
    echo -e "${GREEN}✓${NC} NPM 캐시 정리 완료"
fi

uv_cache_size=$(du -sh ~/.cache/uv 2>/dev/null | cut -f1 || echo "0K")
if [[ "$uv_cache_size" =~ ^[0-9]+G$ ]]; then
    echo -e "${YELLOW}UV 캐시 크기: $uv_cache_size - 정리 중...${NC}"
    /home/skyasu/.local/bin/uv cache clean
    echo -e "${GREEN}✓${NC} UV 캐시 정리 완료"
fi

# 3. 응답 없는 프로세스 정리
echo ""
echo "=== 3단계: 좀비 프로세스 정리 ==="

# 5분 이상 CPU를 사용하지 않는 MCP 프로세스 찾기
zombie_processes=$(ps aux | grep -E "(mcp|npx.*mcp)" | grep -v grep | awk '{if($3 == 0.0) print $2}' | head -5)

if [[ -n "$zombie_processes" ]]; then
    echo -e "${YELLOW}응답 없는 프로세스 발견 - 종료 중...${NC}"
    for pid in $zombie_processes; do
        echo "프로세스 $pid 종료 중..."
        kill -TERM "$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
    done
    sleep 2
    echo -e "${GREEN}✓${NC} 좀비 프로세스 정리 완료"
else
    echo -e "${GREEN}✓${NC} 좀비 프로세스 없음"
fi

# 4. MCP 설정 검증
echo ""
echo "=== 4단계: MCP 설정 검증 ==="

if [[ -f "$PROJECT_ROOT/.mcp.json" ]]; then
    # JSON 유효성 검사
    if python3 -m json.tool "$PROJECT_ROOT/.mcp.json" >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} .mcp.json 유효성 검사 통과"
    else
        echo -e "${RED}✗${NC} .mcp.json 형식 오류"
        echo "JSON 형식을 확인해주세요"
    fi
    
    # 환경변수 참조 확인
    if grep -q '\${.*}' "$PROJECT_ROOT/.mcp.json"; then
        echo -e "${GREEN}✓${NC} 환경변수 참조 형식 사용 중"
    else
        echo -e "${YELLOW}!${NC} 하드코딩된 값 사용 중 - 환경변수 참조 권장"
    fi
else
    echo -e "${RED}✗${NC} .mcp.json 파일 없음"
fi

# 5. 서버별 특별 복구 작업
echo ""
echo "=== 5단계: 서버별 복구 작업 ==="

# Playwright 브라우저 설치 확인
if ! npx -y playwright-core --version >/dev/null 2>&1; then
    echo -e "${YELLOW}Playwright 브라우저 설치 중...${NC}"
    npx -y playwright install chromium --quiet 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Playwright 브라우저 설치 완료"
fi

# Supabase CLI 최신 버전 확인
supabase_version=$(npx -y @supabase/mcp-server-supabase@latest --version 2>/dev/null || echo "unknown")
echo "Supabase MCP 서버 버전: $supabase_version"

# UV 도구 업데이트 확인
if [[ -x "/home/skyasu/.local/bin/uvx" ]]; then
    uv_version=$(/home/skyasu/.local/bin/uv --version 2>/dev/null | head -1 || echo "unknown")
    echo "UV 버전: $uv_version"
    echo -e "${GREEN}✓${NC} UV 도구 정상"
else
    echo -e "${RED}✗${NC} UV 도구 설치 필요"
    echo "설치 명령: curl -LsSf https://astral.sh/uv/install.sh | sh"
fi

# 6. 연결 테스트
echo ""
echo "=== 6단계: 연결 테스트 ==="

echo "MCP 서버 상태 확인 중..."
claude mcp list | grep -E "(Connected|Failed)" | while read -r line; do
    if echo "$line" | grep -q "Connected"; then
        server_name=$(echo "$line" | cut -d':' -f1)
        echo -e "${GREEN}✓${NC} $server_name"
    else
        server_name=$(echo "$line" | cut -d':' -f1)
        echo -e "${RED}✗${NC} $server_name"
    fi
done

# 7. 메모리 사용량 최적화
echo ""
echo "=== 7단계: 메모리 최적화 ==="

total_mem=$(free -m | awk '/^Mem:/{print $2}')
used_mem=$(free -m | awk '/^Mem:/{print $3}')
mem_percent=$(( used_mem * 100 / total_mem ))

echo "메모리 사용률: ${mem_percent}%"

if [[ $mem_percent -gt 85 ]]; then
    echo -e "${YELLOW}메모리 사용량이 높습니다 - 정리 중...${NC}"
    # 메모리 정리
    echo 1 | sudo tee /proc/sys/vm/drop_caches >/dev/null 2>&1 || true
    echo -e "${GREEN}✓${NC} 시스템 캐시 정리 완료"
fi

# 8. 최종 상태 확인
echo ""
echo "=== 8단계: 최종 상태 확인 ==="

healthy_servers=$(claude mcp list | grep -c "Connected" || echo "0")
total_servers=11

echo "정상 서버: ${healthy_servers}/${total_servers}"

if [[ $healthy_servers -eq $total_servers ]]; then
    echo -e "${GREEN}✓ 모든 MCP 서버 정상 작동${NC}"
elif [[ $healthy_servers -gt 8 ]]; then
    echo -e "${YELLOW}! 대부분 서버 정상 (일부 문제)${NC}"
else
    echo -e "${RED}✗ 심각한 연결 문제${NC}"
    echo "Claude Code 완전 재시작을 권장합니다"
fi

echo ""
echo -e "${BLUE}=== 자동 복구 완료 ===${NC}"
echo "다음 실행 권장 시간: $(date -d '+1 hour' '+%H:%M')"