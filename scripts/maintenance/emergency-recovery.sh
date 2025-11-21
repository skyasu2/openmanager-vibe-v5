#!/bin/bash
# WSL 응급 복구 스크립트
# OpenManager VIBE 개발 환경 전용
# 사용법: ./scripts/maintenance/emergency-recovery.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%H:%M:%S') $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%H:%M:%S') $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%H:%M:%S') $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') $1"
}

echo -e "${RED}🚨 WSL 응급 복구 시작...${NC}"
echo "=============================="

# 1. 현재 상태 진단
log_info "시스템 상태 진단 중..."
EMERGENCY_LOG="/tmp/emergency-status-$(date +%Y%m%d-%H%M%S).log"

if [[ -f "./scripts/wsl-monitor/wsl-monitor.sh" ]]; then
    ./scripts/wsl-monitor/wsl-monitor.sh --once > "$EMERGENCY_LOG" 2>&1
    log_success "시스템 상태 저장: $EMERGENCY_LOG"
else
    log_warning "모니터링 도구를 찾을 수 없습니다. 기본 진단으로 진행..."
fi

# 2. 메모리 상태 체크 및 정리
log_info "메모리 상태 체크 중..."
if command -v free >/dev/null 2>&1; then
    MEMORY_USAGE=$(free | awk '/^Mem:/{printf "%.0f", $3/$2 * 100}')
    log_info "현재 메모리 사용률: ${MEMORY_USAGE}%"
    
    if [[ $MEMORY_USAGE -gt 85 ]]; then
        log_warning "높은 메모리 사용률 감지! 캐시 정리 중..."
        
        # 동기화 후 캐시 정리
        sync
        if echo 1 | sudo tee /proc/sys/vm/drop_caches >/dev/null 2>&1; then
            log_success "페이지 캐시 정리 완료"
        fi
        
        if echo 2 | sudo tee /proc/sys/vm/drop_caches >/dev/null 2>&1; then
            log_success "덴트리/아이노드 캐시 정리 완료"
        fi
        
        # 정리 후 메모리 사용률 재체크
        sleep 2
        MEMORY_USAGE_AFTER=$(free | awk '/^Mem:/{printf "%.0f", $3/$2 * 100}')
        log_info "정리 후 메모리 사용률: ${MEMORY_USAGE_AFTER}%"
        
        if [[ $MEMORY_USAGE_AFTER -lt $MEMORY_USAGE ]]; then
            log_success "메모리 정리 효과: $((MEMORY_USAGE - MEMORY_USAGE_AFTER))% 감소"
        fi
    else
        log_success "메모리 사용률 정상 범위"
    fi
else
    log_error "메모리 정보를 읽을 수 없습니다"
fi

# 3. 좀비 프로세스 정리
log_info "좀비 프로세스 체크 중..."
if command -v ps >/dev/null 2>&1; then
    ZOMBIES=$(ps aux | awk '$8 ~ /^Z/ {count++} END {print count+0}')
    
    if [[ $ZOMBIES -gt 0 ]]; then
        log_warning "좀비 프로세스 $ZOMBIES 개 발견! 정리 중..."
        
        # 좀비 프로세스 목록 기록
        ps aux | awk '$8 ~ /^Z/ {print $2":"$11}' > "/tmp/zombies-$(date +%Y%m%d-%H%M%S).log"
        
        # 좀비 프로세스의 부모 프로세스에 SIGCHLD 신호 전송
        ps aux | awk '$8 ~ /^Z/ {print $3}' | sort -u | while read -r ppid; do
            if [[ $ppid -gt 1 ]]; then
                log_info "부모 프로세스 $ppid에 SIGCHLD 전송"
                kill -CHLD "$ppid" 2>/dev/null || true
            fi
        done
        
        sleep 2
        ZOMBIES_AFTER=$(ps aux | awk '$8 ~ /^Z/ {count++} END {print count+0}')
        
        if [[ $ZOMBIES_AFTER -lt $ZOMBIES ]]; then
            log_success "좀비 프로세스 $((ZOMBIES - ZOMBIES_AFTER))개 정리됨"
        else
            log_warning "좀비 프로세스 정리 실패. 시스템 재시작이 필요할 수 있습니다"
        fi
    else
        log_success "좀비 프로세스 없음"
    fi
fi

# 4. 대용량 프로세스 체크
log_info "대용량 프로세스 체크 중..."
if command -v ps >/dev/null 2>&1; then
    # 메모리 사용량 상위 5개 프로세스
    HIGH_MEM_PROCS=$(ps aux --sort=-%mem | head -n 6 | tail -n 5)
    echo "$HIGH_MEM_PROCS" > "/tmp/high-memory-procs-$(date +%Y%m%d-%H%M%S).log"
    
    # 500MB 이상 사용하는 프로세스 체크
    LARGE_PROCS=$(ps aux | awk '$6 > 512000 {count++} END {print count+0}')
    
    if [[ $LARGE_PROCS -gt 0 ]]; then
        log_warning "$LARGE_PROCS 개의 대용량 프로세스(500MB+) 발견"
        ps aux | awk '$6 > 512000 {printf "  PID %s: %sMB - %s\n", $2, int($6/1024), $11}'
        
        # Claude 프로세스 특별 체크
        CLAUDE_MEM=$(ps aux | grep claude | grep -v grep | awk '{print int($6/1024)}' | head -n 1)
        if [[ $CLAUDE_MEM -gt 1000 ]]; then
            log_warning "Claude 프로세스 높은 메모리 사용: ${CLAUDE_MEM}MB"
            echo "Claude 재시작을 고려해보세요: pkill claude && sleep 3 && claude"
        fi
    else
        log_success "대용량 프로세스 없음"
    fi
fi

# 5. Claude MCP 서버 상태 체크
log_info "Claude MCP 서버 상태 체크 중..."
if command -v claude >/dev/null 2>&1; then
    if timeout 15 claude mcp list >/dev/null 2>&1; then
        log_success "Claude MCP 서버 응답 정상"
        
        # 간단한 MCP 서버 개수 체크
        MCP_COUNT=$(timeout 10 claude mcp list 2>/dev/null | grep -c "Connected" || echo 0)
        log_info "연결된 MCP 서버: ${MCP_COUNT}개"
        
        if [[ $MCP_COUNT -lt 5 ]]; then
            log_warning "일부 MCP 서버 연결 실패. 상세 진단 권장"
        fi
    else
        log_error "Claude MCP 서버 응답 실패 (15초 타임아웃)"
        log_info "MCP 서버 재시작을 고려해보세요"
    fi
else
    log_error "Claude 명령어를 찾을 수 없습니다"
fi

# 6. 디스크 공간 체크
log_info "디스크 공간 체크 중..."
if command -v df >/dev/null 2>&1; then
    DISK_USAGE=$(df / | awk 'NR==2 {print int($5)}')
    log_info "루트 디스크 사용률: ${DISK_USAGE}%"
    
    if [[ $DISK_USAGE -gt 90 ]]; then
        log_error "디스크 공간 부족! 파일 정리 필요"
        log_info "임시 파일 정리 시도 중..."
        
        # 임시 파일 정리
        rm -f /tmp/core.* /tmp/*.tmp /tmp/*.log 2>/dev/null || true
        
        # 로그 파일 정리 (7일 이상 된 것)
        find ./logs -name "*.log" -mtime +7 -delete 2>/dev/null || true
        find ./scripts/wsl-monitor/logs -name "*.log" -mtime +7 -delete 2>/dev/null || true
        
        log_success "임시 파일 정리 완료"
    elif [[ $DISK_USAGE -gt 80 ]]; then
        log_warning "디스크 공간 주의 (${DISK_USAGE}%)"
    else
        log_success "디스크 공간 정상"
    fi
fi

# 7. 네트워크 연결 체크
log_info "네트워크 연결 체크 중..."
if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
    log_success "외부 네트워크 연결 정상"
else
    log_warning "외부 네트워크 연결 실패"
fi

# 8. WSL 특화 체크
log_info "WSL 환경 체크 중..."
if grep -qi microsoft /proc/version 2>/dev/null; then
    log_success "WSL 환경 확인됨"
    
    # WSL 버전 확인
    if grep -qi "WSL2" /proc/version 2>/dev/null; then
        log_info "WSL2 환경"
    else
        log_info "WSL1 환경"
    fi
    
    # Windows 호스트와의 연결 체크
    if timeout 3 ping -c 1 $(ip route | grep default | awk '{print $3}') >/dev/null 2>&1; then
        log_success "Windows 호스트 연결 정상"
    else
        log_warning "Windows 호스트 연결 실패"
    fi
else
    log_warning "WSL 환경이 아닙니다"
fi

# 9. 요약 및 권장사항
echo ""
echo -e "${GREEN}📋 복구 요약${NC}"
echo "===================="

# 복구 상태 파일 생성
RECOVERY_SUMMARY="/tmp/recovery-summary-$(date +%Y%m%d-%H%M%S).txt"

cat > "$RECOVERY_SUMMARY" << EOF
WSL 응급 복구 요약 - $(date)
================================

진단 결과:
- 메모리 사용률: ${MEMORY_USAGE:-N/A}%
- 좀비 프로세스: ${ZOMBIES:-N/A}개
- 대용량 프로세스: ${LARGE_PROCS:-N/A}개 (500MB+)
- MCP 서버 연결: ${MCP_COUNT:-N/A}개
- 디스크 사용률: ${DISK_USAGE:-N/A}%

로그 파일:
- 상세 진단: $EMERGENCY_LOG
- 복구 요약: $RECOVERY_SUMMARY

권장 후속 조치:
EOF

echo "상세 로그: $RECOVERY_SUMMARY"

# 권장사항 출력
echo ""
echo -e "${YELLOW}🔧 권장 후속 조치:${NC}"

if [[ $MEMORY_USAGE -gt 80 ]]; then
    echo "  1. 메모리 사용률 높음 - 불필요한 프로세스 종료 권장"
fi

if [[ $ZOMBIES -gt 0 ]]; then
    echo "  2. 좀비 프로세스 잔존 - 시스템 재시작 고려"
fi

if [[ $MCP_COUNT -lt 5 ]]; then
    echo "  3. MCP 서버 일부 실패 - 상세 진단 필요:"
    echo "     ./scripts/wsl-monitor/wsl-monitor.sh --check-mcp"
fi

if [[ $DISK_USAGE -gt 85 ]]; then
    echo "  4. 디스크 공간 부족 - 파일 정리 필요"
fi

echo "  5. 지속적 모니터링 권장:"
echo "     ./scripts/wsl-monitor/wsl-monitor.sh --daemon"

echo ""
echo -e "${GREEN}✅ 응급 복구 완료${NC}"
echo ""
echo "📞 추가 도움이 필요하시면:"
echo "   - 모니터링 가이드: docs/troubleshooting/wsl-monitoring-guide.md"
echo "   - 상세 진단: ./scripts/wsl-monitor/wsl-monitor.sh --once"
echo "   - MCP 상태: ./scripts/wsl-monitor/wsl-monitor.sh --check-mcp"