#!/bin/bash

# 🔄 AI 검증 큐 프로세서
# 
# 스마트 검증 Hook에 의해 생성된 검증 큐를 처리하는 사용자 도구
# 사용자가 원하는 시점에 AI 검증을 실행할 수 있도록 함
#
# 사용법:
#   ./scripts/ai/queue-processor.sh                # 전체 큐 처리
#   ./scripts/ai/queue-processor.sh --show         # 큐 상태만 확인
#   ./scripts/ai/queue-processor.sh --interactive  # 대화형 모드
#   ./scripts/ai/queue-processor.sh --clear        # 큐 비우기

set -e

# === 설정 ===
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
QUEUE_DIR="$CLAUDE_DIR/queues"
VERIFICATION_QUEUE="$QUEUE_DIR/verification-queue.txt"
PROCESSED_LOG="$QUEUE_DIR/processed-queue.log"

# 터미널 환경 설정 (Hook과 동일)
export TERM=dumb
export NO_COLOR=1  
export NONINTERACTIVE=1

# === 색상 코드 ===
if [ -z "$NO_COLOR" ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    PURPLE='\033[0;35m'
    CYAN='\033[0;36m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    PURPLE=''
    CYAN=''
    NC=''
fi

# === 유틸리티 함수 ===

log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] $message"
    echo "[$timestamp] $(echo -e "$message" | sed 's/\x1b\[[0-9;]*[mGKHRJF]//g')" >> "$PROCESSED_LOG" 2>/dev/null || true
}

# 큐 상태 표시
show_queue_status() {
    echo -e "${CYAN}📋 AI 검증 큐 상태${NC}"
    echo "================================"
    
    if [ ! -f "$VERIFICATION_QUEUE" ] || [ ! -s "$VERIFICATION_QUEUE" ]; then
        echo -e "${GREEN}✨ 큐가 비어있습니다${NC}"
        return 0
    fi
    
    local total_count=$(wc -l < "$VERIFICATION_QUEUE" 2>/dev/null || echo "0")
    echo -e "${BLUE}📊 총 $total_count개 파일 대기 중${NC}"
    echo
    
    local level1_count=$(grep ":1:" "$VERIFICATION_QUEUE" 2>/dev/null | wc -l || echo "0")
    local level2_count=$(grep ":2:" "$VERIFICATION_QUEUE" 2>/dev/null | wc -l || echo "0") 
    local level3_count=$(grep ":3:" "$VERIFICATION_QUEUE" 2>/dev/null | wc -l || echo "0")
    
    echo -e "${GREEN}✨ Level 1: $level1_count개 파일 (단일 AI 검증)${NC}"
    echo -e "${YELLOW}⚡ Level 2: $level2_count개 파일 (2-AI 병렬 검증)${NC}"
    echo -e "${RED}🔥 Level 3: $level3_count개 파일 (4-AI 완전 교차 검증)${NC}"
    echo
    
    echo -e "${PURPLE}📄 대기 중인 파일들:${NC}"
    local line_num=1
    while IFS=':' read -r hash file level timestamp; do
        if [ -n "$file" ] && [ -n "$level" ]; then
            local file_basename=$(basename "$file")
            local age_seconds=$(($(date +%s) - timestamp))
            local age_minutes=$((age_seconds / 60))
            
            case "$level" in
                1) echo -e "  ${GREEN}$line_num. Level $level | $file_basename (${age_minutes}분 전)${NC}" ;;
                2) echo -e "  ${YELLOW}$line_num. Level $level | $file_basename (${age_minutes}분 전)${NC}" ;;  
                3) echo -e "  ${RED}$line_num. Level $level | $file_basename (${age_minutes}분 전)${NC}" ;;
            esac
            line_num=$((line_num + 1))
        fi
    done < "$VERIFICATION_QUEUE" 2>/dev/null || true
}

# 단일 파일 처리
process_single_file() {
    local hash="$1"
    local file="$2" 
    local level="$3"
    local timestamp="$4"
    
    local file_basename=$(basename "$file")
    log_message "${BLUE}🔍 처리 시작: $file_basename (Level $level)${NC}"
    
    # 파일 존재 확인
    if [ ! -f "$file" ]; then
        log_message "${YELLOW}⚠️ 파일이 존재하지 않습니다: $file${NC}"
        return 1
    fi
    
    # Safe Task Wrapper 사용
    local wrapper_prompt
    case "$level" in
        1)
            wrapper_prompt="Level 1 단일 AI 검증: $file"
            ;;
        2)
            wrapper_prompt="Level 2 병렬 검증: $file"
            ;;
        3)
            wrapper_prompt="Level 3 완전 교차 검증: $file"
            ;;
        *)
            log_message "${RED}❌ 알 수 없는 검증 레벨: $level${NC}"
            return 1
            ;;
    esac
    
    log_message "${PURPLE}🛡️ Safe Task Wrapper 실행${NC}"
    
    # Safe Task Wrapper로 터미널 제어 시퀀스 차단
    echo
    echo -e "${CYAN}🔒 터미널 제어 시퀀스 차단 모드로 실행${NC}"
    "$PROJECT_ROOT/.claude/scripts/safe-task-wrapper.sh" "verification-specialist" "$wrapper_prompt"
    echo
    
    # 대화형 모드에서는 사용자 확인 대기
    if [ "$INTERACTIVE_MODE" = "true" ]; then
        read -p "처리 완료 후 Enter를 누르세요..." -r
    fi
    
    log_message "${GREEN}✅ 처리 완료: $file_basename${NC}"
    return 0
}

# 전체 큐 처리
process_entire_queue() {
    if [ ! -f "$VERIFICATION_QUEUE" ] || [ ! -s "$VERIFICATION_QUEUE" ]; then
        log_message "${GREEN}✨ 처리할 큐가 없습니다${NC}"
        return 0
    fi
    
    local total_count=$(wc -l < "$VERIFICATION_QUEUE")
    log_message "${BLUE}🔄 총 $total_count개 파일 처리 시작${NC}"
    
    local processed=0
    local failed=0
    
    # 임시 파일로 큐 복사 (처리 중 수정 방지)
    local temp_queue="$VERIFICATION_QUEUE.processing"
    cp "$VERIFICATION_QUEUE" "$temp_queue"
    
    while IFS=':' read -r hash file level timestamp; do
        if [ -n "$hash" ] && [ -n "$file" ] && [ -n "$level" ]; then
            if process_single_file "$hash" "$file" "$level" "$timestamp"; then
                processed=$((processed + 1))
                
                # 처리된 항목을 큐에서 제거
                grep -v "^${hash}:" "$VERIFICATION_QUEUE" > "$VERIFICATION_QUEUE.tmp" 2>/dev/null || true
                mv "$VERIFICATION_QUEUE.tmp" "$VERIFICATION_QUEUE" 2>/dev/null
            else
                failed=$((failed + 1))
            fi
            
            # 진행 상황 표시
            local current=$((processed + failed))
            log_message "${CYAN}📊 진행률: $current/$total_count (성공: $processed, 실패: $failed)${NC}"
        fi
    done < "$temp_queue"
    
    # 임시 파일 정리
    rm -f "$temp_queue"
    
    echo
    log_message "${GREEN}🎉 큐 처리 완료!${NC}"
    log_message "${BLUE}📈 통계: 성공 $processed개, 실패 $failed개${NC}"
}

# 큐 비우기
clear_queue() {
    if [ ! -f "$VERIFICATION_QUEUE" ] || [ ! -s "$VERIFICATION_QUEUE" ]; then
        log_message "${GREEN}✨ 큐가 이미 비어있습니다${NC}"
        return 0
    fi
    
    local count=$(wc -l < "$VERIFICATION_QUEUE")
    
    # 백업 생성
    local backup_file="$QUEUE_DIR/verification-queue-backup-$(date +%Y%m%d-%H%M%S).txt"
    cp "$VERIFICATION_QUEUE" "$backup_file"
    
    # 큐 비우기
    > "$VERIFICATION_QUEUE"
    
    log_message "${GREEN}🗑️ 큐를 비웠습니다 ($count개 항목 제거)${NC}"
    log_message "${BLUE}💾 백업 저장: $backup_file${NC}"
}

# 대화형 메뉴
interactive_menu() {
    while true; do
        echo
        echo -e "${CYAN}🤖 AI 검증 큐 프로세서${NC}"
        echo "================================"
        echo "1. 큐 상태 확인"
        echo "2. 전체 큐 처리"
        echo "3. 큐 비우기"
        echo "4. 종료"
        echo
        
        read -p "선택하세요 (1-4): " -r choice
        
        case "$choice" in
            1)
                show_queue_status
                ;;
            2)
                INTERACTIVE_MODE="true"
                process_entire_queue
                ;;
            3)
                read -p "정말로 큐를 비우시겠습니까? (y/N): " -r confirm
                if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
                    clear_queue
                fi
                ;;
            4)
                echo -e "${GREEN}👋 안녕히 가세요!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ 잘못된 선택입니다${NC}"
                ;;
        esac
    done
}

# 도움말 표시
show_help() {
    echo -e "${CYAN}🤖 AI 검증 큐 프로세서${NC}"
    echo "================================"
    echo
    echo "사용법:"
    echo "  $0                # 전체 큐 처리"
    echo "  $0 --show         # 큐 상태만 확인"
    echo "  $0 --interactive  # 대화형 모드"
    echo "  $0 --clear        # 큐 비우기"
    echo "  $0 --help         # 도움말"
    echo
    echo "설명:"
    echo "  스마트 검증 Hook에 의해 생성된 AI 검증 큐를 처리합니다."
    echo "  사용자가 원하는 시점에 AI 검증을 실행할 수 있습니다."
    echo
    echo "예시:"
    echo "  # 현재 대기 중인 검증 작업들 확인"
    echo "  $0 --show"
    echo
    echo "  # 대화형 모드에서 차근차근 처리"
    echo "  $0 --interactive"
}

# === 메인 실행 ===

# 디렉토리 생성
mkdir -p "$QUEUE_DIR"

# 인자 파싱
case "${1:-}" in
    --show|-s)
        show_queue_status
        ;;
    --interactive|-i)
        INTERACTIVE_MODE="true"
        interactive_menu
        ;;
    --clear|-c)
        clear_queue
        ;;
    --help|-h)
        show_help
        ;;
    "")
        # 기본 동작: 전체 큐 처리
        process_entire_queue
        ;;
    *)
        echo -e "${RED}❌ 알 수 없는 옵션: $1${NC}"
        echo
        show_help
        exit 1
        ;;
esac