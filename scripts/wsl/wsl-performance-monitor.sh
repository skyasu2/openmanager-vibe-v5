#!/bin/bash
# WSL 성능 모니터링 스크립트
# OpenManager VIBE v5 - WSL 최적화 프로젝트
# 생성일: 2025-08-17

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 헤더 출력
print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}  WSL 성능 모니터링 도구 v1.0${NC}"
    echo -e "${CYAN}  OpenManager VIBE v5${NC}"
    echo -e "${CYAN}================================${NC}"
    echo
}

# 시스템 정보 표시
show_system_info() {
    echo -e "${BLUE}📊 시스템 정보${NC}"
    echo "─────────────────────────────────"
    echo -e "• WSL 버전: $(wsl.exe --version 2>/dev/null | head -1 || echo 'WSL 2')"
    echo -e "• 호스트 OS: $(lsb_release -d 2>/dev/null | cut -f2 || echo 'Ubuntu (WSL)')"
    echo -e "• 커널: $(uname -r)"
    echo -e "• 아키텍처: $(uname -m)"
    echo
}

# CPU 성능 모니터링
monitor_cpu() {
    echo -e "${GREEN}🖥️  CPU 성능${NC}"
    echo "─────────────────────────────────"
    
    # CPU 정보
    echo -e "• CPU 모델: $(cat /proc/cpuinfo | grep 'model name' | head -1 | cut -d':' -f2 | xargs)"
    echo -e "• 할당된 코어: $(nproc)개"
    echo -e "• 최대 코어: $(cat /proc/cpuinfo | grep processor | wc -l)개"
    
    # CPU 사용률
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    echo -e "• 현재 사용률: ${cpu_usage}%"
    
    # Load Average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}')
    echo -e "• Load Average:${load_avg}"
    
    # CPU 성능 벤치마크 (간단한 테스트)
    echo -e "• 성능 벤치마크 (π 계산):"
    local start_time=$(date +%s.%N)
    echo "scale=1000; 4*a(1)" | bc -l >/dev/null 2>&1
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc)
    echo -e "  ⏱️  ${duration}초 (낮을수록 좋음)"
    echo
}

# 메모리 모니터링
monitor_memory() {
    echo -e "${YELLOW}🧠 메모리 상태${NC}"
    echo "─────────────────────────────────"
    
    # 메모리 정보 파싱
    local mem_info=$(free -h)
    local total_mem=$(echo "$mem_info" | grep Mem | awk '{print $2}')
    local used_mem=$(echo "$mem_info" | grep Mem | awk '{print $3}')
    local free_mem=$(echo "$mem_info" | grep Mem | awk '{print $4}')
    local available_mem=$(echo "$mem_info" | grep Mem | awk '{print $7}')
    
    local swap_total=$(echo "$mem_info" | grep Swap | awk '{print $2}')
    local swap_used=$(echo "$mem_info" | grep Swap | awk '{print $3}')
    
    echo -e "• 총 메모리: ${total_mem}"
    echo -e "• 사용 중: ${used_mem}"
    echo -e "• 사용 가능: ${available_mem}"
    echo -e "• 스왑 총량: ${swap_total}"
    echo -e "• 스왑 사용: ${swap_used}"
    
    # 메모리 사용률 계산
    local mem_usage_percent=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    echo -e "• 메모리 사용률: ${mem_usage_percent}%"
    
    # 메모리 집약적 프로세스 top 5
    echo -e "• 메모리 사용량 상위 5개 프로세스:"
    ps aux --sort=-%mem | head -6 | tail -5 | awk '{printf "  %s: %.1f%%\n", $11, $4}'
    echo
}

# 디스크 I/O 성능 모니터링
monitor_disk() {
    echo -e "${PURPLE}💾 디스크 성능${NC}"
    echo "─────────────────────────────────"
    
    # 디스크 사용량
    echo -e "• 디스크 사용량:"
    df -h / | tail -1 | awk '{printf "  루트: %s 사용 중 / %s 총량 (사용률: %s)\n", $3, $2, $5}'
    
    # Windows 마운트 포인트 확인
    if [ -d "/mnt/d" ]; then
        df -h /mnt/d | tail -1 | awk '{printf "  D 드라이브: %s 사용 중 / %s 총량 (사용률: %s)\n", $3, $2, $5}'
    fi
    
    # 디스크 I/O 성능 테스트 (작은 파일로 빠른 테스트)
    echo -e "• I/O 성능 테스트:"
    
    # WSL 네이티브 성능
    local wsl_start=$(date +%s.%N)
    dd if=/dev/zero of=/tmp/test_wsl bs=1M count=50 oflag=direct 2>/dev/null
    local wsl_end=$(date +%s.%N)
    local wsl_duration=$(echo "$wsl_end - $wsl_start" | bc)
    local wsl_speed=$(echo "scale=1; 50 / $wsl_duration" | bc)
    rm -f /tmp/test_wsl
    echo -e "  WSL 네이티브: ${wsl_speed} MB/s"
    
    # Windows 마운트 성능 (있는 경우)
    if [ -d "/mnt/d" ]; then
        local win_start=$(date +%s.%N)
        dd if=/dev/zero of=/mnt/d/test_win bs=1M count=50 oflag=direct 2>/dev/null
        local win_end=$(date +%s.%N)
        local win_duration=$(echo "$win_end - $win_start" | bc)
        local win_speed=$(echo "scale=1; 50 / $win_duration" | bc)
        rm -f /mnt/d/test_win
        echo -e "  Windows 마운트: ${win_speed} MB/s"
        
        # 성능 비교
        local ratio=$(echo "scale=1; $wsl_speed / $win_speed" | bc)
        echo -e "  📈 WSL이 Windows 마운트보다 ${ratio}배 빠름"
    fi
    echo
}

# 네트워크 성능 모니터링
monitor_network() {
    echo -e "${CYAN}🌐 네트워크 성능${NC}"
    echo "─────────────────────────────────"
    
    # 네트워크 인터페이스
    echo -e "• 활성 네트워크 인터페이스:"
    ip addr show | grep -E "^[0-9]" | awk '{print "  " $2}' | sed 's/://'
    
    # 인터넷 연결 테스트
    echo -e "• 인터넷 연결 테스트:"
    local ping_result=$(ping -c 3 8.8.8.8 2>/dev/null | grep 'avg' | awk -F'/' '{print $5}' || echo "연결 실패")
    if [ "$ping_result" != "연결 실패" ]; then
        echo -e "  🌍 Google DNS 응답시간: ${ping_result}ms"
    else
        echo -e "  ❌ 인터넷 연결 실패"
    fi
    
    # GitHub 연결 테스트 (개발용)
    local github_test=$(curl -s -w "%{time_total}" -o /dev/null https://api.github.com/zen || echo "0")
    if [ "$github_test" != "0" ]; then
        local github_ms=$(echo "$github_test * 1000" | bc | cut -d'.' -f1)
        echo -e "  🐙 GitHub API 응답시간: ${github_ms}ms"
    fi
    echo
}

# AI CLI 도구 성능 테스트
monitor_ai_tools() {
    echo -e "${GREEN}🤖 AI CLI 도구 성능${NC}"
    echo "─────────────────────────────────"
    
    # Claude Code
    if command -v claude >/dev/null 2>&1; then
        local claude_start=$(date +%s.%N)
        claude --version >/dev/null 2>&1
        local claude_end=$(date +%s.%N)
        local claude_duration=$(echo "($claude_end - $claude_start) * 1000" | bc | cut -d'.' -f1)
        echo -e "• Claude Code: ${claude_duration}ms"
    else
        echo -e "• Claude Code: ❌ 설치되지 않음"
    fi
    
    # Gemini CLI
    if command -v gemini >/dev/null 2>&1; then
        local gemini_start=$(date +%s.%N)
        gemini --version >/dev/null 2>&1
        local gemini_end=$(date +%s.%N)
        local gemini_duration=$(echo "($gemini_end - $gemini_start) * 1000" | bc | cut -d'.' -f1)
        echo -e "• Gemini CLI: ${gemini_duration}ms"
    else
        echo -e "• Gemini CLI: ❌ 설치되지 않음"
    fi
    
    # Qwen CLI
    if command -v qwen >/dev/null 2>&1; then
        local qwen_start=$(date +%s.%N)
        qwen --version >/dev/null 2>&1
        local qwen_end=$(date +%s.%N)
        local qwen_duration=$(echo "($qwen_end - $qwen_start) * 1000" | bc | cut -d'.' -f1)
        echo -e "• Qwen CLI: ${qwen_duration}ms"
    else
        echo -e "• Qwen CLI: ❌ 설치되지 않음"
    fi
    
    # ccusage
    if command -v ccusage >/dev/null 2>&1; then
        local ccusage_start=$(date +%s.%N)
        ccusage --version >/dev/null 2>&1
        local ccusage_end=$(date +%s.%N)
        local ccusage_duration=$(echo "($ccusage_end - $ccusage_start) * 1000" | bc | cut -d'.' -f1)
        echo -e "• ccusage: ${ccusage_duration}ms"
    else
        echo -e "• ccusage: ❌ 설치되지 않음"
    fi
    echo
}

# 성능 점수 계산
calculate_performance_score() {
    echo -e "${BLUE}📊 종합 성능 점수${NC}"
    echo "─────────────────────────────────"
    
    # 기본 점수 (100점 만점)
    local score=100
    
    # CPU 사용률 체크 (높으면 감점)
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        score=$((score - 20))
        echo -e "• CPU 사용률 높음 (-20점): ${cpu_usage}%"
    elif (( $(echo "$cpu_usage > 50" | bc -l) )); then
        score=$((score - 10))
        echo -e "• CPU 사용률 보통 (-10점): ${cpu_usage}%"
    else
        echo -e "• CPU 사용률 양호 (+0점): ${cpu_usage}%"
    fi
    
    # 메모리 사용률 체크
    local mem_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    if (( $(echo "$mem_usage > 90" | bc -l) )); then
        score=$((score - 20))
        echo -e "• 메모리 사용률 높음 (-20점): ${mem_usage}%"
    elif (( $(echo "$mem_usage > 70" | bc -l) )); then
        score=$((score - 10))
        echo -e "• 메모리 사용률 보통 (-10점): ${mem_usage}%"
    else
        echo -e "• 메모리 사용률 양호 (+0점): ${mem_usage}%"
    fi
    
    # 스왑 사용 체크
    local swap_used=$(free | grep Swap | awk '{print $3}')
    if [ "$swap_used" -gt 0 ]; then
        score=$((score - 5))
        echo -e "• 스왑 사용 중 (-5점)"
    else
        echo -e "• 스왑 미사용 (+0점)"
    fi
    
    # 성능 등급 결정
    if [ "$score" -ge 90 ]; then
        echo -e "• 종합 점수: ${GREEN}${score}/100 (S급 - 최적화됨)${NC}"
    elif [ "$score" -ge 80 ]; then
        echo -e "• 종합 점수: ${YELLOW}${score}/100 (A급 - 우수함)${NC}"
    elif [ "$score" -ge 70 ]; then
        echo -e "• 종합 점수: ${YELLOW}${score}/100 (B급 - 양호함)${NC}"
    elif [ "$score" -ge 60 ]; then
        echo -e "• 종합 점수: ${RED}${score}/100 (C급 - 개선 필요)${NC}"
    else
        echo -e "• 종합 점수: ${RED}${score}/100 (D급 - 최적화 급요)${NC}"
    fi
    echo
}

# 최적화 권장사항
show_recommendations() {
    echo -e "${PURPLE}💡 최적화 권장사항${NC}"
    echo "─────────────────────────────────"
    
    # 메모리 사용률 체크
    local mem_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    if (( $(echo "$mem_usage > 85" | bc -l) )); then
        echo -e "• 메모리 사용률이 높습니다. 불필요한 프로세스를 종료하세요."
    fi
    
    # 스왑 사용 체크
    local swap_used=$(free | grep Swap | awk '{print $3}')
    if [ "$swap_used" -gt 0 ]; then
        echo -e "• 스왑이 사용 중입니다. 메모리 부족 상태일 수 있습니다."
    fi
    
    # .wslconfig 파일 체크
    if [ -f "/mnt/c/Users/skyas/.wslconfig" ]; then
        echo -e "• .wslconfig 파일이 존재합니다. 적절히 설정되었는지 확인하세요."
    else
        echo -e "• .wslconfig 파일을 생성하여 메모리와 CPU를 최적화하세요."
    fi
    
    # 디스크 공간 체크
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        echo -e "• 디스크 사용률이 높습니다. 불필요한 파일을 정리하세요."
    fi
    
    echo -e "• 정기적인 모니터링을 통해 성능을 추적하세요."
    echo -e "• WSL 재시작 후 설정 변경사항이 적용됩니다: ${CYAN}wsl --shutdown${NC}"
    echo
}

# 메인 함수
main() {
    print_header
    show_system_info
    monitor_cpu
    monitor_memory
    monitor_disk
    monitor_network
    monitor_ai_tools
    calculate_performance_score
    show_recommendations
    
    echo -e "${CYAN}모니터링 완료! $(date)${NC}"
}

# 스크립트 실행 옵션 처리
case "${1:-}" in
    --help|-h)
        echo "WSL 성능 모니터링 도구"
        echo "사용법: $0 [옵션]"
        echo "옵션:"
        echo "  --help, -h     도움말 표시"
        echo "  --cpu          CPU 성능만 모니터링"
        echo "  --memory       메모리 상태만 모니터링"
        echo "  --disk         디스크 성능만 모니터링"
        echo "  --network      네트워크 성능만 모니터링"
        echo "  --ai-tools     AI 도구 성능만 모니터링"
        exit 0
        ;;
    --cpu)
        print_header
        monitor_cpu
        ;;
    --memory)
        print_header
        monitor_memory
        ;;
    --disk)
        print_header
        monitor_disk
        ;;
    --network)
        print_header
        monitor_network
        ;;
    --ai-tools)
        print_header
        monitor_ai_tools
        ;;
    *)
        main
        ;;
esac