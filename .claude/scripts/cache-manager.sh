#!/bin/bash

# 🗄️ AI 교차 검증 캐시 매니저
# 캐시 정리, 통계, 유지보수를 담당하는 종합 관리 도구
#
# 사용법:
#   ./cache-manager.sh stats      # 캐시 통계 정보
#   ./cache-manager.sh cleanup    # 만료된 캐시 정리
#   ./cache-manager.sh clear      # 모든 캐시 삭제
#   ./cache-manager.sh optimize   # 캐시 최적화
#   ./cache-manager.sh monitor    # 실시간 캐시 모니터링

set -e

# === 설정 ===
CLAUDE_DIR="/mnt/d/cursor/openmanager-vibe-v5/.claude"
CACHE_DIR="$CLAUDE_DIR/cache"
QUEUE_DIR="$CLAUDE_DIR/queues"
LOG_FILE="$CLAUDE_DIR/cache-manager.log"

# 캐시 TTL 설정 (초)
CACHE_TTL=3600              # 1시간 (3600초)
RECENT_VERIFICATION_TTL=300 # 5분 (300초)
PARALLEL_LOCK_TTL=1800     # 30분 (1800초)

# === 색상 코드 ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# === 유틸리티 함수 ===

log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message" >> "$LOG_FILE"
    echo -e "$message"
}

# 파일 크기를 읽기 쉬운 형태로 변환
human_readable_size() {
    local bytes="$1"
    if [ "$bytes" -gt 1073741824 ]; then
        echo "$(echo "scale=2; $bytes / 1073741824" | bc)GB"
    elif [ "$bytes" -gt 1048576 ]; then
        echo "$(echo "scale=2; $bytes / 1048576" | bc)MB"
    elif [ "$bytes" -gt 1024 ]; then
        echo "$(echo "scale=2; $bytes / 1024" | bc)KB"
    else
        echo "${bytes}B"
    fi
}

# 경과 시간을 읽기 쉬운 형태로 변환
human_readable_time() {
    local seconds="$1"
    if [ "$seconds" -gt 3600 ]; then
        echo "$(echo "scale=1; $seconds / 3600" | bc)시간"
    elif [ "$seconds" -gt 60 ]; then
        echo "$(echo "scale=1; $seconds / 60" | bc)분"
    else
        echo "${seconds}초"
    fi
}

# === 캐시 통계 ===

show_cache_stats() {
    log_message "${BLUE}📊 AI 교차 검증 캐시 통계${NC}"
    
    # 디렉토리 존재 확인
    if [ ! -d "$CACHE_DIR" ]; then
        log_message "${RED}❌ 캐시 디렉토리가 존재하지 않습니다: $CACHE_DIR${NC}"
        return 1
    fi
    
    local current_time=$(date +%s)
    local total_files=0
    local valid_files=0
    local expired_files=0
    local total_size=0
    local oldest_cache=0
    local newest_cache=0
    
    # 캐시 파일 분석
    if ls "$CACHE_DIR"/*.json >/dev/null 2>&1; then
        for cache_file in "$CACHE_DIR"/*.json; do
            if [ -f "$cache_file" ]; then
                total_files=$((total_files + 1))
                
                # 파일 크기 계산
                local file_size=$(stat -c%s "$cache_file" 2>/dev/null || echo 0)
                total_size=$((total_size + file_size))
                
                # 파일 나이 계산
                local file_mtime=$(stat -c%Y "$cache_file" 2>/dev/null || echo 0)
                local file_age=$((current_time - file_mtime))
                
                # 가장 오래된/최신 파일 추적
                if [ $oldest_cache -eq 0 ] || [ $file_age -gt $oldest_cache ]; then
                    oldest_cache=$file_age
                fi
                if [ $newest_cache -eq 0 ] || [ $file_age -lt $newest_cache ]; then
                    newest_cache=$file_age
                fi
                
                # 만료 여부 확인
                if [ $file_age -gt $CACHE_TTL ]; then
                    expired_files=$((expired_files + 1))
                else
                    valid_files=$((valid_files + 1))
                fi
            fi
        done
    fi
    
    # 최근 검증 통계
    local recent_verifications=0
    if [ -f "$QUEUE_DIR/recent-verifications.txt" ]; then
        recent_verifications=$(wc -l < "$QUEUE_DIR/recent-verifications.txt" 2>/dev/null || echo 0)
    fi
    
    # 대기 중인 검증
    local pending_verifications=0
    if [ -f "$QUEUE_DIR/verification-queue.txt" ]; then
        pending_verifications=$(wc -l < "$QUEUE_DIR/verification-queue.txt" 2>/dev/null || echo 0)
    fi
    
    # 활성 병렬 프로세스
    local active_parallel=0
    if [ -f "$QUEUE_DIR/parallel-locks.txt" ]; then
        while IFS=':' read -r pid timestamp; do
            if kill -0 "$pid" 2>/dev/null; then
                active_parallel=$((active_parallel + 1))
            fi
        done < "$QUEUE_DIR/parallel-locks.txt" 2>/dev/null || true
    fi
    
    # 통계 출력
    echo
    log_message "${GREEN}📁 캐시 디렉토리: $CACHE_DIR${NC}"
    log_message "${GREEN}📊 총 캐시 파일 수: $total_files개${NC}"
    log_message "${GREEN}✅ 유효한 캐시: $valid_files개${NC}"
    log_message "${YELLOW}⚠️ 만료된 캐시: $expired_files개${NC}"
    log_message "${GREEN}💾 총 캐시 크기: $(human_readable_size $total_size)${NC}"
    
    if [ $total_files -gt 0 ]; then
        log_message "${BLUE}🕒 가장 오래된 캐시: $(human_readable_time $oldest_cache) 전${NC}"
        log_message "${BLUE}🕐 가장 최신 캐시: $(human_readable_time $newest_cache) 전${NC}"
        
        # 캐시 적중률 추정 (유효 캐시 비율)
        local hit_rate=$(echo "scale=1; $valid_files * 100 / $total_files" | bc)
        log_message "${CYAN}🎯 추정 캐시 적중률: ${hit_rate}%${NC}"
    fi
    
    echo
    log_message "${PURPLE}🔄 최근 검증 기록: $recent_verifications개${NC}"
    log_message "${PURPLE}⏳ 대기 중인 검증: $pending_verifications개${NC}"
    log_message "${PURPLE}🚀 활성 병렬 프로세스: $active_parallel개${NC}"
    
    # 디스크 사용량 경고
    if [ $total_size -gt 104857600 ]; then  # 100MB
        log_message "${RED}⚠️ 캐시 크기가 100MB를 초과했습니다. cleanup 실행을 권장합니다.${NC}"
    fi
}

# === 캐시 정리 ===

cleanup_expired_cache() {
    log_message "${YELLOW}🧹 만료된 캐시 정리 시작${NC}"
    
    if [ ! -d "$CACHE_DIR" ]; then
        log_message "${RED}❌ 캐시 디렉토리가 존재하지 않습니다${NC}"
        return 1
    fi
    
    local current_time=$(date +%s)
    local deleted_files=0
    local reclaimed_space=0
    
    # 만료된 캐시 파일 삭제
    if ls "$CACHE_DIR"/*.json >/dev/null 2>&1; then
        for cache_file in "$CACHE_DIR"/*.json; do
            if [ -f "$cache_file" ]; then
                local file_mtime=$(stat -c%Y "$cache_file" 2>/dev/null || echo 0)
                local file_age=$((current_time - file_mtime))
                
                if [ $file_age -gt $CACHE_TTL ]; then
                    local file_size=$(stat -c%s "$cache_file" 2>/dev/null || echo 0)
                    rm -f "$cache_file"
                    deleted_files=$((deleted_files + 1))
                    reclaimed_space=$((reclaimed_space + file_size))
                    log_message "${GREEN}🗑️ 삭제: $(basename "$cache_file") ($(human_readable_time $file_age) 전)${NC}"
                fi
            fi
        done
    fi
    
    # 오래된 최근 검증 기록 정리
    if [ -f "$QUEUE_DIR/recent-verifications.txt" ]; then
        local cutoff_time=$((current_time - 86400))  # 24시간
        awk -F: -v cutoff=$cutoff_time '$2 > cutoff' "$QUEUE_DIR/recent-verifications.txt" > "$QUEUE_DIR/recent-verifications.txt.tmp" 2>/dev/null || true
        if [ -f "$QUEUE_DIR/recent-verifications.txt.tmp" ]; then
            mv "$QUEUE_DIR/recent-verifications.txt.tmp" "$QUEUE_DIR/recent-verifications.txt"
            log_message "${GREEN}🧹 오래된 검증 기록 정리 완료${NC}"
        fi
    fi
    
    # 죽은 병렬 프로세스 락 정리
    if [ -f "$QUEUE_DIR/parallel-locks.txt" ]; then
        local temp_file="$QUEUE_DIR/parallel-locks.txt.tmp"
        local cleaned_locks=0
        while IFS=':' read -r lock_pid lock_timestamp; do
            if kill -0 "$lock_pid" 2>/dev/null; then
                echo "${lock_pid}:${lock_timestamp}" >> "$temp_file"
            else
                cleaned_locks=$((cleaned_locks + 1))
            fi
        done < "$QUEUE_DIR/parallel-locks.txt" 2>/dev/null || true
        
        if [ -f "$temp_file" ]; then
            mv "$temp_file" "$QUEUE_DIR/parallel-locks.txt"
            if [ $cleaned_locks -gt 0 ]; then
                log_message "${GREEN}🔓 죽은 병렬 락 $cleaned_locks개 정리${NC}"
            fi
        fi
    fi
    
    # 결과 요약
    log_message "${GREEN}✅ 정리 완료${NC}"
    log_message "${GREEN}📦 삭제된 파일: $deleted_files개${NC}"
    log_message "${GREEN}💾 회수된 공간: $(human_readable_size $reclaimed_space)${NC}"
}

# === 전체 캐시 삭제 ===

clear_all_cache() {
    log_message "${RED}🚨 모든 캐시 삭제 시작${NC}"
    
    read -p "정말로 모든 캐시를 삭제하시겠습니까? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_message "${YELLOW}❌ 취소됨${NC}"
        return 0
    fi
    
    local deleted_files=0
    local reclaimed_space=0
    
    # 캐시 파일 삭제
    if [ -d "$CACHE_DIR" ]; then
        for cache_file in "$CACHE_DIR"/*.json; do
            if [ -f "$cache_file" ]; then
                local file_size=$(stat -c%s "$cache_file" 2>/dev/null || echo 0)
                rm -f "$cache_file"
                deleted_files=$((deleted_files + 1))
                reclaimed_space=$((reclaimed_space + file_size))
            fi
        done
    fi
    
    # 큐 파일들 초기화
    > "$QUEUE_DIR/recent-verifications.txt" 2>/dev/null || true
    > "$QUEUE_DIR/verification-queue.txt" 2>/dev/null || true
    > "$QUEUE_DIR/parallel-locks.txt" 2>/dev/null || true
    
    log_message "${GREEN}✅ 전체 삭제 완료${NC}"
    log_message "${GREEN}📦 삭제된 파일: $deleted_files개${NC}"
    log_message "${GREEN}💾 회수된 공간: $(human_readable_size $reclaimed_space)${NC}"
}

# === 캐시 최적화 ===

optimize_cache() {
    log_message "${PURPLE}⚡ 캐시 최적화 시작${NC}"
    
    # 1. 만료된 캐시 정리
    cleanup_expired_cache
    
    # 2. 중복 제거 (같은 파일 해시의 경우 최신 것만 유지)
    if [ -d "$CACHE_DIR" ]; then
        declare -A file_hashes
        local duplicates_removed=0
        
        for cache_file in "$CACHE_DIR"/*.json; do
            if [ -f "$cache_file" ]; then
                local file_hash=$(basename "$cache_file" .json)
                local file_mtime=$(stat -c%Y "$cache_file" 2>/dev/null || echo 0)
                
                if [ -n "${file_hashes[$file_hash]}" ]; then
                    local existing_mtime="${file_hashes[$file_hash]}"
                    local existing_file="$CACHE_DIR/${file_hash}.json"
                    
                    # 더 오래된 파일 삭제
                    if [ $file_mtime -gt $existing_mtime ]; then
                        rm -f "$existing_file" 2>/dev/null || true
                        file_hashes[$file_hash]=$file_mtime
                        duplicates_removed=$((duplicates_removed + 1))
                    else
                        rm -f "$cache_file" 2>/dev/null || true
                        duplicates_removed=$((duplicates_removed + 1))
                    fi
                else
                    file_hashes[$file_hash]=$file_mtime
                fi
            fi
        done
        
        if [ $duplicates_removed -gt 0 ]; then
            log_message "${GREEN}🔄 중복 캐시 $duplicates_removed개 제거${NC}"
        fi
    fi
    
    # 3. 디렉토리 권한 최적화
    chmod 755 "$CACHE_DIR" 2>/dev/null || true
    chmod 755 "$QUEUE_DIR" 2>/dev/null || true
    
    log_message "${GREEN}✅ 캐시 최적화 완료${NC}"
}

# === 실시간 모니터링 ===

monitor_cache() {
    log_message "${CYAN}📡 실시간 캐시 모니터링 시작 (Ctrl+C로 종료)${NC}"
    
    trap 'echo; log_message "${YELLOW}👋 모니터링 종료${NC}"; exit 0' INT
    
    while true; do
        clear
        echo -e "${CYAN}🕒 $(date '+%Y-%m-%d %H:%M:%S') - AI 교차 검증 캐시 실시간 모니터링${NC}"
        echo "=================================================="
        
        # 간단한 통계 표시
        local cache_count=$(ls "$CACHE_DIR"/*.json 2>/dev/null | wc -l)
        local queue_count=$(wc -l < "$QUEUE_DIR/verification-queue.txt" 2>/dev/null || echo 0)
        local recent_count=$(wc -l < "$QUEUE_DIR/recent-verifications.txt" 2>/dev/null || echo 0)
        
        echo -e "${GREEN}📁 캐시 파일: $cache_count개${NC}"
        echo -e "${YELLOW}⏳ 검증 대기: $queue_count개${NC}"
        echo -e "${BLUE}📋 최근 검증: $recent_count개${NC}"
        
        # 최근 5개 캐시 파일
        echo
        echo -e "${PURPLE}🕐 최근 캐시 파일 (5개):${NC}"
        if ls "$CACHE_DIR"/*.json >/dev/null 2>&1; then
            ls -lt "$CACHE_DIR"/*.json | head -5 | while read -r line; do
                local file_info=$(echo "$line" | awk '{print $9, $6, $7, $8}')
                echo -e "${CYAN}  • $file_info${NC}"
            done
        else
            echo -e "${GRAY}  (캐시 없음)${NC}"
        fi
        
        echo
        echo -e "${YELLOW}다음 업데이트까지 5초... (Ctrl+C로 종료)${NC}"
        sleep 5
    done
}

# === 메인 함수 ===

show_usage() {
    echo -e "${BLUE}AI 교차 검증 캐시 매니저${NC}"
    echo
    echo "사용법: $0 [명령어]"
    echo
    echo "명령어:"
    echo -e "  ${GREEN}stats${NC}      캐시 통계 정보 표시"
    echo -e "  ${YELLOW}cleanup${NC}    만료된 캐시 정리"
    echo -e "  ${RED}clear${NC}      모든 캐시 삭제 (주의)"
    echo -e "  ${PURPLE}optimize${NC}   캐시 최적화 (정리 + 중복 제거)"
    echo -e "  ${CYAN}monitor${NC}    실시간 캐시 모니터링"
    echo -e "  ${BLUE}help${NC}       이 도움말 표시"
    echo
}

# 메인 로직
case "${1:-help}" in
    stats)
        show_cache_stats
        ;;
    cleanup)
        cleanup_expired_cache
        ;;
    clear)
        clear_all_cache
        ;;
    optimize)
        optimize_cache
        ;;
    monitor)
        monitor_cache
        ;;
    help|*)
        show_usage
        ;;
esac