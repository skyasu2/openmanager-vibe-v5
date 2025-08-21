#!/bin/bash

# 📊 AI 교차 검증 대시보드
#
# 용도: 실시간 검증 상태를 시각적으로 표시
# 실행: ./show-verification-dashboard.sh [--watch]

set -e

# === 설정 ===
STATUS_FILE="/mnt/d/cursor/openmanager-vibe-v5/.claude/verification-status.json"
QUEUE_FILE="/mnt/d/cursor/openmanager-vibe-v5/.claude/cross-verification-queue.txt"
LOG_FILE="/mnt/d/cursor/openmanager-vibe-v5/.claude/cross-verification.log"
UPDATE_SCRIPT="/mnt/d/cursor/openmanager-vibe-v5/.claude/scripts/update-verification-status.sh"

# === 색상 코드 ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# === 함수 정의 ===

# 헤더 표시
show_header() {
    clear
    echo -e "${PURPLE}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}${BOLD}║     🤖 AI 교차 검증 시스템 모니터링 대시보드 v2.0        ║${NC}"
    echo -e "${PURPLE}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo
}

# 통계 표시
show_statistics() {
    if [ -f "$STATUS_FILE" ]; then
        local total_reviews=$(jq -r '.statistics.totalReviews' "$STATUS_FILE")
        local security_issues=$(jq -r '.statistics.securityIssuesFound' "$STATUS_FILE")
        local pending_count=$(jq -r '.pending | length' "$STATUS_FILE")
        
        echo -e "${CYAN}${BOLD}📊 전체 통계${NC}"
        echo -e "├─ 총 검증 수행: ${GREEN}$total_reviews${NC}회"
        echo -e "├─ 보안 이슈 발견: ${RED}$security_issues${NC}개"
        echo -e "└─ 대기 중인 파일: ${YELLOW}$pending_count${NC}개"
        echo
    fi
}

# 레벨별 통계
show_level_stats() {
    if [ -f "$STATUS_FILE" ]; then
        local level1=$(jq -r '.byLevel.LEVEL_1.count' "$STATUS_FILE")
        local level2=$(jq -r '.byLevel.LEVEL_2.count' "$STATUS_FILE")
        local level3=$(jq -r '.byLevel.LEVEL_3.count' "$STATUS_FILE")
        
        echo -e "${CYAN}${BOLD}🎯 레벨별 검증 현황${NC}"
        echo -e "├─ Level 1 (빠른 검증): ${GREEN}$level1${NC}회"
        echo -e "├─ Level 2 (표준 검증): ${YELLOW}$level2${NC}회"
        echo -e "└─ Level 3 (완전 검증): ${RED}$level3${NC}회"
        echo
    fi
}

# 수정 상태 표시
show_fix_status() {
    if [ -f "$STATUS_FILE" ]; then
        local auto_applied=$(jq -r '.fixes.auto_applied | length' "$STATUS_FILE" 2>/dev/null || echo "0")
        local pending_confirm=$(jq -r '.fixes.pending_confirmation | length' "$STATUS_FILE" 2>/dev/null || echo "0")
        local manual_required=$(jq -r '.fixes.manual_required | length' "$STATUS_FILE" 2>/dev/null || echo "0")
        local total_fixes=$(jq -r '.fixes.statistics.total_fixes_applied' "$STATUS_FILE" 2>/dev/null || echo "0")
        local success_rate=$(jq -r '.fixes.statistics.auto_fix_success_rate' "$STATUS_FILE" 2>/dev/null || echo "0")
        
        echo -e "${CYAN}${BOLD}🔧 수정 현황${NC}"
        echo -e "├─ 자동 수정 완료: ${GREEN}$auto_applied${NC}개"
        echo -e "├─ 확인 대기 중: ${YELLOW}$pending_confirm${NC}개"
        echo -e "├─ 수동 수정 필요: ${RED}$manual_required${NC}개"
        echo -e "├─ 총 수정 적용: ${BLUE}$total_fixes${NC}개"
        echo -e "└─ 자동 수정 성공률: ${PURPLE}${success_rate}%${NC}"
        echo
        
        # 대기 중인 확인 항목 표시
        if [ "$pending_confirm" -gt 0 ]; then
            echo -e "${YELLOW}⚠️ 확인이 필요한 수정사항:${NC}"
            jq -r '.fixes.pending_confirmation[]' "$STATUS_FILE" 2>/dev/null | head -3 | while IFS= read -r item; do
                echo -e "  • $item"
            done
            if [ "$pending_confirm" -gt 3 ]; then
                echo -e "  ... 외 $((pending_confirm - 3))개"
            fi
            echo
        fi
    fi
}

# AI 할당 통계 표시
show_ai_assignments() {
    if [ -f "$STATUS_FILE" ]; then
        # AI별 할당 통계
        local gemini_assigned=$(jq -r '.ai_assignments.gemini.assigned_count' "$STATUS_FILE" 2>/dev/null || echo "0")
        local gemini_completed=$(jq -r '.ai_assignments.gemini.completed_count' "$STATUS_FILE" 2>/dev/null || echo "0")
        local codex_assigned=$(jq -r '.ai_assignments.codex.assigned_count' "$STATUS_FILE" 2>/dev/null || echo "0")
        local codex_completed=$(jq -r '.ai_assignments.codex.completed_count' "$STATUS_FILE" 2>/dev/null || echo "0")
        local qwen_assigned=$(jq -r '.ai_assignments.qwen.assigned_count' "$STATUS_FILE" 2>/dev/null || echo "0")
        local qwen_completed=$(jq -r '.ai_assignments.qwen.completed_count' "$STATUS_FILE" 2>/dev/null || echo "0")
        
        echo -e "${CYAN}${BOLD}🤖 AI 할당 현황 (라운드 로빈)${NC}"
        
        # 할당 비율 계산
        local total_assigned=$((gemini_assigned + codex_assigned + qwen_assigned))
        if [ "$total_assigned" -gt 0 ]; then
            local gemini_percent=$((gemini_assigned * 100 / total_assigned))
            local codex_percent=$((codex_assigned * 100 / total_assigned))
            local qwen_percent=$((qwen_assigned * 100 / total_assigned))
            
            echo -e "├─ ${GREEN}Gemini${NC}: $gemini_assigned/$gemini_completed (${gemini_percent}%)"
            echo -e "├─ ${YELLOW}Codex${NC}: $codex_assigned/$codex_completed (${codex_percent}%)"
            echo -e "├─ ${BLUE}Qwen${NC}: $qwen_assigned/$qwen_completed (${qwen_percent}%)"
            echo -e "└─ 총 할당: ${PURPLE}$total_assigned${NC}개 작업"
            
            # 균등 분배 확인
            local variance=$((gemini_percent > codex_percent ? gemini_percent - codex_percent : codex_percent - gemini_percent))
            local variance2=$((codex_percent > qwen_percent ? codex_percent - qwen_percent : qwen_percent - codex_percent))
            local max_variance=$((variance > variance2 ? variance : variance2))
            
            if [ "$max_variance" -le 10 ]; then
                echo -e "   ${GREEN}✅ 균등 분배 양호 (편차 ${max_variance}%)${NC}"
            else
                echo -e "   ${YELLOW}⚠️ 분배 불균형 감지 (편차 ${max_variance}%)${NC}"
            fi
        else
            echo -e "├─ Gemini: -/-"
            echo -e "├─ Codex: -/-"
            echo -e "├─ Qwen: -/-"
            echo -e "└─ ${YELLOW}아직 할당된 작업 없음${NC}"
        fi
        echo
    fi
}

# 대기 큐 표시
show_pending_queue() {
    echo -e "${CYAN}${BOLD}📋 검증 대기 큐${NC}"
    
    if [ -f "$QUEUE_FILE" ] && [ -s "$QUEUE_FILE" ]; then
        local count=0
        while IFS=: read -r file level timestamp tool; do
            if [ -n "$file" ]; then
                count=$((count + 1))
                # 파일명만 추출 (경로 제거)
                local filename=$(basename "$file" 2>/dev/null || echo "$file")
                
                # 레벨에 따른 색상
                local level_color=""
                case "$level" in
                    "LEVEL_1") level_color="${GREEN}" ;;
                    "LEVEL_2") level_color="${YELLOW}" ;;
                    "LEVEL_3"|"LEVEL_3_CRITICAL") level_color="${RED}" ;;
                    *) level_color="${NC}" ;;
                esac
                
                echo -e "├─ $count. ${filename} ${level_color}[$level]${NC} (도구: $tool)"
            fi
        done < "$QUEUE_FILE"
        echo -e "└─ 총 ${YELLOW}$count${NC}개 파일 대기 중"
    else
        echo -e "└─ ${GREEN}대기 중인 파일 없음${NC}"
    fi
    echo
}

# 최근 활동 표시
show_recent_activity() {
    echo -e "${CYAN}${BOLD}🔄 최근 활동${NC}"
    
    if [ -f "$LOG_FILE" ]; then
        # 최근 5개 항목만 표시
        tail -5 "$LOG_FILE" | while IFS= read -r line; do
            # ANSI 색상 코드 제거하고 표시
            clean_line=$(echo "$line" | sed 's/\\033\[[0-9;]*m//g')
            
            # 타임스탬프 추출
            if [[ "$clean_line" =~ \[([^\]]+)\] ]]; then
                timestamp="${BASH_REMATCH[1]}"
                message="${clean_line#*] }"
                
                # 메시지 타입에 따른 아이콘
                icon="•"
                if [[ "$message" == *"보안"* ]]; then
                    icon="🔐"
                elif [[ "$message" == *"완료"* ]]; then
                    icon="✅"
                elif [[ "$message" == *"대기"* ]]; then
                    icon="📋"
                elif [[ "$message" == *"활성화"* ]]; then
                    icon="🔄"
                fi
                
                echo -e "├─ $icon ${BLUE}[$timestamp]${NC} $message"
            fi
        done
        echo -e "└─ ${GREEN}실시간 업데이트 중...${NC}"
    else
        echo -e "└─ ${YELLOW}로그 파일 없음${NC}"
    fi
    echo
}

# 실행 가능한 명령어 표시
show_commands() {
    echo -e "${CYAN}${BOLD}🚀 실행 가능한 명령어${NC}"
    echo -e "├─ ${GREEN}Task verification-specialist \"파일명 Level 1\"${NC} - 빠른 검증"
    echo -e "├─ ${YELLOW}Task ai-verification-coordinator \"Level 2 검증\"${NC} - 표준 검증"
    echo -e "├─ ${RED}Task external-ai-orchestrator \"4-AI 교차 검증\"${NC} - 완전 검증"
    echo -e "├─ ${PURPLE}./auto-fix-from-verification.sh${NC} - 자동 수정 실행"
    echo -e "├─ ${CYAN}./auto-fix-from-verification.sh --dry-run${NC} - 수정 미리보기"
    echo -e "├─ ${BLUE}./auto-fix-from-verification.sh --auto${NC} - 무인 자동 수정"
    echo -e "└─ ${BLUE}./show-verification-dashboard.sh --watch${NC} - 실시간 모니터링"
    echo
}

# 업데이트 시간 표시
show_update_time() {
    if [ -f "$STATUS_FILE" ]; then
        local last_updated=$(jq -r '.lastUpdated' "$STATUS_FILE")
        echo -e "${BLUE}마지막 업데이트: $last_updated${NC}"
    fi
}

# === 메인 로직 ===

# 상태 파일 업데이트
if [ -f "$UPDATE_SCRIPT" ]; then
    bash "$UPDATE_SCRIPT" 2>/dev/null || true
fi

# Watch 모드 확인
if [ "$1" == "--watch" ]; then
    # 실시간 모니터링 모드
    while true; do
        show_header
        show_statistics
        show_level_stats
        show_ai_assignments
        show_fix_status
        show_pending_queue
        show_recent_activity
        show_commands
        show_update_time
        
        echo
        echo -e "${YELLOW}5초마다 자동 새로고침... (Ctrl+C로 종료)${NC}"
        
        # 상태 업데이트
        if [ -f "$UPDATE_SCRIPT" ]; then
            bash "$UPDATE_SCRIPT" 2>/dev/null || true
        fi
        
        sleep 5
    done
else
    # 단일 실행 모드
    show_header
    show_statistics
    show_level_stats
    show_ai_assignments
    show_fix_status
    show_pending_queue
    show_recent_activity
    show_commands
    show_update_time
fi