#!/bin/bash
# WSL 내부 스왑 최적화 스크립트

set -e

echo "=== WSL 스왑 최적화 도구 ==="

# 현재 메모리 및 스왑 상태 확인
show_status() {
    echo ""
    echo "📊 현재 시스템 상태:"
    echo "   $(free -h)"
    echo ""
    echo "💾 스왑 상세 정보:"
    echo "   $(swapon --show 2>/dev/null || echo '스왑이 설정되지 않음')"
    echo ""
    echo "🔧 스왑 사용률:"
    echo "   $(cat /proc/swaps 2>/dev/null || echo '스왑 정보 없음')"
    echo ""
    echo "⚙️  VM 설정:"
    echo "   swappiness: $(cat /proc/sys/vm/swappiness)"
    echo "   vfs_cache_pressure: $(cat /proc/sys/vm/vfs_cache_pressure)"
}

# 스왑 최적화 설정
optimize_swap() {
    echo ""
    echo "🔧 스왑 최적화 설정 중..."
    
    # swappiness 설정 (기본 60 → 10으로 변경)
    # 값이 낮을수록 RAM을 더 많이 사용하고 스왑 사용을 줄임
    echo "   swappiness를 10으로 설정 (메모리 우선 사용)"
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf > /dev/null
    sudo sysctl vm.swappiness=10
    
    # vfs_cache_pressure 설정 (기본 100 → 50으로 변경)
    # 파일 시스템 캐시 압력 조절
    echo "   vfs_cache_pressure를 50으로 설정 (캐시 최적화)"
    echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf > /dev/null
    sudo sysctl vm.vfs_cache_pressure=50
    
    # dirty ratio 설정 (메모리 쓰기 최적화)
    echo "   dirty_ratio 최적화 설정"
    echo 'vm.dirty_ratio=15' | sudo tee -a /etc/sysctl.conf > /dev/null
    echo 'vm.dirty_background_ratio=5' | sudo tee -a /etc/sysctl.conf > /dev/null
    sudo sysctl vm.dirty_ratio=15
    sudo sysctl vm.dirty_background_ratio=5
    
    echo "✅ 스왑 최적화 설정 완료!"
}

# 메모리 사용량 모니터링
monitor_memory() {
    echo ""
    echo "📈 실시간 메모리 모니터링 (Ctrl+C로 종료):"
    echo ""
    
    while true; do
        clear
        echo "=== WSL 메모리 모니터링 ==="
        echo "시간: $(date)"
        echo ""
        
        # 메모리 사용량
        free -h
        echo ""
        
        # 프로세스별 메모리 사용량 (상위 10개)
        echo "🔝 메모리 사용량 상위 프로세스:"
        ps aux --sort=-%mem | head -11
        echo ""
        
        # 스왑 사용량
        echo "💾 스왑 상태:"
        swapon --show 2>/dev/null || echo "스왑 없음"
        echo ""
        
        sleep 5
    done
}

# 메모리 정리
clean_memory() {
    echo ""
    echo "🧹 메모리 정리 중..."
    
    # 페이지 캐시, dentries, inodes 정리
    echo "   시스템 캐시 정리"
    sync
    sudo sh -c 'echo 3 > /proc/sys/vm/drop_caches'
    
    # 스왑 정리 (스왑이 있는 경우)
    if [ -f /proc/swaps ] && [ "$(wc -l < /proc/swaps)" -gt 1 ]; then
        echo "   스왑 정리"
        sudo swapoff -a && sudo swapon -a
    fi
    
    echo "✅ 메모리 정리 완료!"
}

# 도움말
show_help() {
    echo ""
    echo "📖 사용법:"
    echo "   $0 status     # 현재 상태 확인"
    echo "   $0 optimize   # 스왑 최적화 설정"
    echo "   $0 monitor    # 실시간 모니터링"
    echo "   $0 clean      # 메모리 정리"
    echo "   $0 help       # 도움말"
    echo ""
    echo "🎯 권장 사용 순서:"
    echo "   1. $0 status     # 현재 상태 확인"
    echo "   2. $0 optimize   # 최적화 설정 적용"
    echo "   3. $0 clean      # 메모리 정리"
    echo "   4. $0 monitor    # 모니터링 (선택사항)"
}

# 메인 로직
case "${1:-help}" in
    "status")
        show_status
        ;;
    "optimize")
        optimize_swap
        show_status
        ;;
    "monitor")
        monitor_memory
        ;;
    "clean")
        clean_memory
        show_status
        ;;
    "help"|*)
        show_help
        ;;
esac