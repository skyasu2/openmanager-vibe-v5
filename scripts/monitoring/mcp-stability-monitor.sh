#!/bin/bash

# MCP 서버 안정성 모니터링 스크립트 (WSL 최적화)
# 작성일: 2025-09-17
# 목적: Playwright 등 리소스 집약적 MCP 서버 안정성 모니터링

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
LOG_FILE="/tmp/mcp-stability-monitor.log"
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
PLAYWRIGHT_CPU_THRESHOLD=50

# 로그 함수
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

print_status() {
    echo -e "${BLUE}🔍 MCP 서버 안정성 모니터링${NC}"
    echo "=================================="
}

# CPU 사용량 확인
check_cpu_usage() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    cpu_usage=${cpu_usage%.*}  # 소수점 제거
    
    if [[ $cpu_usage -gt $CPU_THRESHOLD ]]; then
        echo -e "${RED}⚠️  높은 CPU 사용량: ${cpu_usage}%${NC}"
        log_message "WARNING: High CPU usage detected: ${cpu_usage}%"
        return 1
    else
        echo -e "${GREEN}✅ CPU 사용량 정상: ${cpu_usage}%${NC}"
        return 0
    fi
}

# 메모리 사용량 확인
check_memory_usage() {
    local memory_info=$(free | grep Mem)
    local total=$(echo $memory_info | awk '{print $2}')
    local used=$(echo $memory_info | awk '{print $3}')
    local usage_percent=$((used * 100 / total))
    
    if [[ $usage_percent -gt $MEMORY_THRESHOLD ]]; then
        echo -e "${RED}⚠️  높은 메모리 사용량: ${usage_percent}%${NC}"
        log_message "WARNING: High memory usage detected: ${usage_percent}%"
        return 1
    else
        echo -e "${GREEN}✅ 메모리 사용량 정상: ${usage_percent}%${NC}"
        return 0
    fi
}

# Playwright 프로세스 특별 모니터링
check_playwright_processes() {
    local playwright_processes=$(ps aux | grep -E "(chrome|chromium|playwright)" | grep -v grep || true)
    
    if [[ -n "$playwright_processes" ]]; then
        echo -e "${YELLOW}🎭 Playwright 프로세스 발견:${NC}"
        echo "$playwright_processes" | while read -r line; do
            local cpu=$(echo "$line" | awk '{print $3}')
            local memory=$(echo "$line" | awk '{print $4}')
            local process=$(echo "$line" | awk '{print $11}')
            
            cpu_int=${cpu%.*}
            if [[ $cpu_int -gt $PLAYWRIGHT_CPU_THRESHOLD ]]; then
                echo -e "${RED}⚠️  Playwright 고CPU: $process (CPU: $cpu%, MEM: $memory%)${NC}"
                log_message "WARNING: High Playwright CPU usage: $process (CPU: $cpu%, MEM: $memory%)"
                
                # 자동 종료 옵션 (사용자 확인 후)
                read -p "Playwright 프로세스를 종료하시겠습니까? (y/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    local pid=$(echo "$line" | awk '{print $2}')
                    kill -TERM "$pid" 2>/dev/null || true
                    echo -e "${GREEN}✅ 프로세스 $pid 종료됨${NC}"
                    log_message "INFO: Terminated Playwright process $pid"
                fi
            else
                echo -e "${GREEN}✅ Playwright 정상: $process (CPU: $cpu%, MEM: $memory%)${NC}"
            fi
        done
    else
        echo -e "${GREEN}✅ Playwright 프로세스 없음${NC}"
    fi
}

# MCP 서버 응답성 테스트
check_mcp_responsiveness() {
    echo -e "${BLUE}🔗 MCP 서버 응답성 테스트...${NC}"
    
    local start_time=$(date +%s)
    timeout 30s claude mcp list > /dev/null 2>&1
    local exit_code=$?
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [[ $exit_code -eq 0 ]]; then
        if [[ $duration -lt 10 ]]; then
            echo -e "${GREEN}✅ MCP 서버 응답 정상 (${duration}초)${NC}"
        else
            echo -e "${YELLOW}⚠️  MCP 서버 응답 지연 (${duration}초)${NC}"
            log_message "WARNING: MCP server response delay: ${duration}s"
        fi
    else
        echo -e "${RED}❌ MCP 서버 응답 실패 (타임아웃: 30초)${NC}"
        log_message "ERROR: MCP server timeout after 30 seconds"
        return 1
    fi
}

# 자동 복구 조치
auto_recovery() {
    echo -e "${YELLOW}🔧 자동 복구 조치 시작...${NC}"
    
    # 1. Playwright 프로세스 정리
    pkill -f "chrome\|chromium\|playwright" 2>/dev/null || true
    echo -e "${GREEN}✅ Playwright 프로세스 정리 완료${NC}"
    
    # 2. MCP 서버 재시작 (선택적)
    read -p "MCP 서버를 재시작하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 리소스 집약적 서버만 재시작
        claude mcp remove playwright 2>/dev/null || true
        sleep 3
        claude mcp add playwright "npx -y @executeautomation/playwright-mcp-server" 2>/dev/null || true
        echo -e "${GREEN}✅ Playwright MCP 서버 재시작 완료${NC}"
        log_message "INFO: Playwright MCP server restarted"
    fi
}

# 메인 모니터링 함수
main_monitor() {
    print_status
    
    local issues=0
    
    # CPU 체크
    check_cpu_usage || issues=$((issues + 1))
    
    # 메모리 체크
    check_memory_usage || issues=$((issues + 1))
    
    # Playwright 프로세스 체크
    check_playwright_processes
    
    # MCP 응답성 체크
    check_mcp_responsiveness || issues=$((issues + 1))
    
    echo "=================================="
    
    if [[ $issues -gt 0 ]]; then
        echo -e "${RED}⚠️  $issues 개의 문제 발견${NC}"
        
        read -p "자동 복구를 실행하시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            auto_recovery
        fi
    else
        echo -e "${GREEN}✅ 모든 시스템 정상${NC}"
    fi
}

# 연속 모니터링 모드
continuous_monitor() {
    echo -e "${BLUE}🔄 연속 모니터링 모드 시작 (Ctrl+C로 종료)${NC}"
    
    while true; do
        clear
        main_monitor
        echo -e "\n${BLUE}다음 검사까지 60초 대기...${NC}"
        sleep 60
    done
}

# 도움말
show_help() {
    echo "MCP 서버 안정성 모니터링 도구"
    echo ""
    echo "사용법:"
    echo "  $0 [옵션]"
    echo ""
    echo "옵션:"
    echo "  --once          한 번만 검사"
    echo "  --continuous    연속 모니터링"
    echo "  --help          도움말 표시"
    echo ""
    echo "예시:"
    echo "  $0 --once                # 1회 검사"
    echo "  $0 --continuous          # 연속 모니터링"
}

# 메인 실행 로직
case "${1:-}" in
    --once)
        main_monitor
        ;;
    --continuous)
        continuous_monitor
        ;;
    --help)
        show_help
        ;;
    *)
        echo "사용법: $0 [--once|--continuous|--help]"
        echo "기본적으로 --once 모드로 실행됩니다."
        main_monitor
        ;;
esac