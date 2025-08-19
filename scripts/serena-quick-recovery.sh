#!/bin/bash

# =============================================================================
# Serena MCP Quick Recovery Script
# 빠른 진단 및 복구를 위한 경량화 스크립트
# =============================================================================

set -euo pipefail

PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
LOG_FILE="$PROJECT_ROOT/logs/serena-quick.log"

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

# 빠른 상태 체크 (5초 타임아웃)
quick_check() {
    log "${YELLOW}🔍 Serena MCP 빠른 상태 체크...${NC}"
    
    if timeout 5s claude mcp list 2>/dev/null | grep -q "serena:.*✓ Connected"; then
        log "${GREEN}✅ Serena MCP 정상 연결됨${NC}"
        return 0
    else
        log "${RED}❌ Serena MCP 연결 실패${NC}"
        return 1
    fi
}

# 빠른 복구 시도
quick_recovery() {
    log "${YELLOW}🔧 빠른 복구 시작...${NC}"
    
    # 1. 간단한 재시작 시도
    log "1️⃣ MCP 연결 리셋..."
    if timeout 10s claude mcp restart 2>/dev/null || timeout 15s claude api restart 2>/dev/null; then
        log "${GREEN}✅ 재시작 완료${NC}"
        sleep 3
        
        if quick_check; then
            log "${GREEN}🎉 빠른 복구 성공!${NC}"
            return 0
        fi
    fi
    
    # 2. .mcp.json 구성 확인
    log "2️⃣ MCP 설정 확인..."
    if [[ -f "$PROJECT_ROOT/.mcp.json" ]]; then
        if grep -q "serena" "$PROJECT_ROOT/.mcp.json"; then
            log "${GREEN}✅ Serena 설정 발견${NC}"
        else
            log "${RED}❌ Serena 설정 누락${NC}"
            return 1
        fi
    else
        log "${RED}❌ .mcp.json 파일 없음${NC}"
        return 1
    fi
    
    # 3. 환경 체크
    log "3️⃣ 환경 체크..."
    if command -v /home/skyasu/.local/bin/uvx >/dev/null; then
        log "${GREEN}✅ uvx 사용 가능${NC}"
    else
        log "${RED}❌ uvx 없음${NC}"
        return 1
    fi
    
    log "${RED}💥 빠른 복구 실패${NC}"
    return 1
}

# Serena 설정 수정 도구
fix_serena_config() {
    log "${YELLOW}🔧 Serena 설정 수정 중...${NC}"
    
    local mcp_config="$PROJECT_ROOT/.mcp.json"
    if [[ ! -f "$mcp_config" ]]; then
        log "${RED}❌ .mcp.json 파일이 없습니다${NC}"
        return 1
    fi
    
    # 백업 생성
    cp "$mcp_config" "$mcp_config.backup.$(date +%s)"
    
    # Serena 설정을 stdio 모드로 수정
    if command -v jq >/dev/null 2>&1; then
        jq '.mcpServers.serena = {
            "command": "/home/skyasu/.local/bin/uvx",
            "args": [
                "--from", "git+https://github.com/oraios/serena",
                "serena-mcp-server", 
                "--project", "/mnt/d/cursor/openmanager-vibe-v5"
            ]
        }' "$mcp_config" > "$mcp_config.tmp" && mv "$mcp_config.tmp" "$mcp_config"
        log "${GREEN}✅ Serena 설정 수정 완료${NC}"
    else
        log "${YELLOW}⚠️ jq가 없어 수동 설정 필요${NC}"
    fi
}

# 상태 리포트
status_report() {
    log "${YELLOW}📊 Serena MCP 상태 리포트${NC}"
    
    echo "=== 시스템 정보 ==="
    echo "메모리: $(free -h | grep Mem: | awk '{print $3"/"$2}')"
    echo "Claude Code: $(claude --version 2>/dev/null | head -1 || echo 'ERROR')"
    echo "uvx: $(/home/skyasu/.local/bin/uvx --version 2>/dev/null || echo 'ERROR')"
    
    echo ""
    echo "=== MCP 상태 ==="
    if timeout 5s claude mcp list 2>/dev/null; then
        echo "MCP 목록 조회 성공"
    else
        echo "❌ MCP 목록 조회 실패"
    fi
    
    echo ""
    echo "=== 로그 (최근 5줄) ==="
    if [[ -f "$LOG_FILE" ]]; then
        tail -5 "$LOG_FILE"
    else
        echo "로그 파일 없음"
    fi
}

# 메인 실행
case "${1:-check}" in
    "check")
        quick_check
        ;;
    "recover")
        if ! quick_check; then
            quick_recovery
        fi
        ;;
    "fix-config")
        fix_serena_config
        ;;
    "status")
        status_report
        ;;
    "logs")
        tail -20 "$LOG_FILE" 2>/dev/null || echo "로그 없음"
        ;;
    *)
        echo "사용법: $0 {check|recover|fix-config|status|logs}"
        exit 1
        ;;
esac