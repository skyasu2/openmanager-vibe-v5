#!/bin/bash

# 🚀 WSL 성능 모니터링 스크립트
# CPU, 메모리, 디스크 I/O를 실시간으로 모니터링합니다.

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 경고 임계값
MEMORY_WARNING=80  # 메모리 사용률 %
CPU_WARNING=80     # CPU 사용률 %
DISK_WARNING=90    # 디스크 사용률 %

# 모니터링 함수
monitor_performance() {
    clear
    
    while true; do
        # 헤더
        echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${BLUE}║            🚀 WSL 성능 모니터 - $(date +"%Y-%m-%d %H:%M:%S")          ║${NC}"
        echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        
        # CPU 정보
        echo -e "${CYAN}📊 CPU 사용률${NC}"
        cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
        cpu_int=${cpu_usage%.*}
        
        if [ "$cpu_int" -gt "$CPU_WARNING" ]; then
            echo -e "   ${RED}⚠️  CPU: ${cpu_usage}% (경고: 높은 사용률)${NC}"
        else
            echo -e "   ${GREEN}✓ CPU: ${cpu_usage}%${NC}"
        fi
        
        # 프로세스별 CPU 사용률 (상위 5개)
        echo -e "   ${YELLOW}상위 프로세스:${NC}"
        ps aux --sort=-%cpu | head -6 | tail -5 | awk '{printf "      %-20s %5s%%\n", substr($11,1,20), $3}'
        echo ""
        
        # 메모리 정보
        echo -e "${CYAN}💾 메모리 사용량${NC}"
        mem_info=$(free -h | grep Mem)
        mem_total=$(echo $mem_info | awk '{print $2}')
        mem_used=$(echo $mem_info | awk '{print $3}')
        mem_free=$(echo $mem_info | awk '{print $4}')
        mem_percent=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
        
        if [ "$mem_percent" -gt "$MEMORY_WARNING" ]; then
            echo -e "   ${RED}⚠️  사용: $mem_used / $mem_total ($mem_percent%) - 여유: $mem_free${NC}"
        else
            echo -e "   ${GREEN}✓ 사용: $mem_used / $mem_total ($mem_percent%) - 여유: $mem_free${NC}"
        fi
        
        # Node.js 프로세스 메모리
        echo -e "   ${YELLOW}Node.js 프로세스:${NC}"
        node_processes=$(ps aux | grep -E "node|npm" | grep -v grep | awk '{print $2, $11}' | head -5)
        if [ -n "$node_processes" ]; then
            while IFS= read -r proc; do
                pid=$(echo $proc | awk '{print $1}')
                cmd=$(echo $proc | awk '{$1=""; print substr($0,2,30)}')
                mem=$(ps -p $pid -o rss= 2>/dev/null | awk '{print int($1/1024)"MB"}')
                [ -n "$mem" ] && echo "      PID $pid: $cmd... ($mem)"
            done <<< "$node_processes"
        else
            echo "      실행 중인 Node.js 프로세스 없음"
        fi
        echo ""
        
        # 디스크 I/O
        echo -e "${CYAN}💿 디스크 사용량${NC}"
        disk_info=$(df -h /mnt/d | tail -1)
        disk_used=$(echo $disk_info | awk '{print $3}')
        disk_total=$(echo $disk_info | awk '{print $2}')
        disk_percent=$(echo $disk_info | awk '{print $5}' | sed 's/%//')
        
        if [ "$disk_percent" -gt "$DISK_WARNING" ]; then
            echo -e "   ${RED}⚠️  /mnt/d: $disk_used / $disk_total ($disk_percent% 사용)${NC}"
        else
            echo -e "   ${GREEN}✓ /mnt/d: $disk_used / $disk_total ($disk_percent% 사용)${NC}"
        fi
        
        # 네트워크 (localhost 포트)
        echo ""
        echo -e "${CYAN}🌐 활성 포트${NC}"
        active_ports=$(ss -tulpn 2>/dev/null | grep LISTEN | grep -E "3000|3001|5173|8000" | awk '{print $5}' | cut -d':' -f2 | sort -u)
        if [ -n "$active_ports" ]; then
            echo -e "   ${GREEN}활성 포트: $(echo $active_ports | tr '\n' ' ')${NC}"
        else
            echo -e "   ${YELLOW}활성 개발 서버 없음${NC}"
        fi
        
        # WSL 특정 정보
        echo ""
        echo -e "${CYAN}🐧 WSL 정보${NC}"
        echo -e "   배포판: $WSL_DISTRO_NAME"
        echo -e "   WSL 버전: $(wsl.exe -l -v 2>/dev/null | grep -E "$WSL_DISTRO_NAME" | awk '{print $4}')"
        
        # 성능 팁
        echo ""
        echo -e "${BLUE}💡 성능 팁${NC}"
        if [ "$mem_percent" -gt "$MEMORY_WARNING" ]; then
            echo -e "   ${YELLOW}• 메모리 부족: 불필요한 프로세스 종료 권장${NC}"
        fi
        if [ "$cpu_int" -gt "$CPU_WARNING" ]; then
            echo -e "   ${YELLOW}• CPU 과부하: 빌드/테스트 프로세스 확인${NC}"
        fi
        if [ "$disk_percent" -gt 70 ]; then
            echo -e "   ${YELLOW}• node_modules 정리: npm cache clean --force${NC}"
        fi
        
        echo ""
        
        # 적응형 모니터링 간격
        if [ "$cpu_int" -gt "$CPU_WARNING" ] || [ "$mem_percent" -gt "$MEMORY_WARNING" ]; then
            INTERVAL=2  # 경고 상태에서는 더 자주 업데이트
            echo -e "${YELLOW}[Ctrl+C로 종료, ${INTERVAL}초마다 갱신 - 경고 모드]${NC}"
        else
            INTERVAL=5  # 정상 상태
            echo -e "${YELLOW}[Ctrl+C로 종료, ${INTERVAL}초마다 갱신]${NC}"
        fi
        
        sleep $INTERVAL
        clear
    done
}

# 메인 실행
echo -e "${BLUE}WSL 성능 모니터를 시작합니다...${NC}"
monitor_performance