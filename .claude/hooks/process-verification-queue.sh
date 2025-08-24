#!/bin/bash

# AI 교차 검증 큐 처리 스크립트
# 사용법: ./process-verification-queue.sh [--auto|--manual] [file_path]

set -e

QUEUE_FILE=".claude/cross-verification-queue.txt"
HIGH_PRIORITY_QUEUE=".claude/high-priority-verification-queue.txt"
LOG_FILE=".claude/cross-verification.log"

# 로그 함수
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 복잡도 분석 함수
analyze_complexity() {
    local file="$1"
    
    if [[ ! -f "$file" ]]; then
        echo "1"  # 파일이 없으면 Level 1
        return
    fi
    
    local line_count=$(wc -l < "$file" 2>/dev/null || echo "0")
    
    # 중요 파일 패턴 체크
    if [[ "$file" =~ (auth|api|security|payment|\.env|config) ]]; then
        echo "3"  # 중요 파일은 무조건 Level 3
        return
    fi
    
    # 줄 수 기반 복잡도
    if [ "$line_count" -lt 50 ]; then
        echo "1"  # Level 1: < 50줄
    elif [ "$line_count" -lt 200 ]; then
        echo "2"  # Level 2: 50-200줄
    else
        echo "3"  # Level 3: > 200줄
    fi
}

# 단일 파일 검증
verify_file() {
    local file="$1"
    local level="$2"
    
    log "🔍 파일 검증 시작: $file (Level $level)"
    
    case $level in
        1)
            log "📝 Level 1: Claude 자체 검증"
            # Claude 자체 검증만 실행
            ;;
        2)
            log "🔄 Level 2: Claude + AI 1개 교차 검증"
            # Claude + 랜덤 AI 1개
            local random_ai=$(shuf -n1 <<< $'gemini-wrapper\ncodex-wrapper\nqwen-wrapper')
            echo "Task $random_ai \"$file 코드 검토 및 10점 만점 평가\"" >> .claude/ai-commands-queue.txt
            ;;
        3)
            log "🚀 Level 3: 4-AI 완전 교차 검증"
            # Claude + 3개 AI 모두
            echo "Task gemini-wrapper \"$file 종합 코드 검토 및 10점 만점 평가\"" >> .claude/ai-commands-queue.txt
            echo "Task codex-wrapper \"$file 종합 코드 검토 및 10점 만점 평가\"" >> .claude/ai-commands-queue.txt  
            echo "Task qwen-wrapper \"$file 종합 코드 검토 및 10점 만점 평가\"" >> .claude/ai-commands-queue.txt
            ;;
    esac
}

# 큐 처리
process_queue() {
    local queue_file="$1"
    
    if [[ ! -f "$queue_file" ]]; then
        log "📄 큐 파일이 존재하지 않습니다: $queue_file"
        return
    fi
    
    log "🔄 큐 처리 시작: $queue_file"
    
    while IFS= read -r line; do
        if [[ -z "$line" ]]; then
            continue
        fi
        
        # High priority queue 형식: file|LEVEL_3|SECURITY
        if [[ "$line" =~ \|LEVEL_3\|SECURITY$ ]]; then
            local file="${line%|*|*}"
            verify_file "$file" "3"
        else
            # 일반 queue: 파일 경로만
            local level=$(analyze_complexity "$line")
            verify_file "$line" "$level"
        fi
    done < "$queue_file"
    
    # 큐 파일 비우기
    > "$queue_file"
    log "✅ 큐 처리 완료"
}

# 메인 실행
case "${1:-auto}" in
    --auto)
        log "🤖 자동 검증 모드 시작"
        process_queue "$QUEUE_FILE"
        process_queue "$HIGH_PRIORITY_QUEUE"
        ;;
    --manual)
        if [[ -z "$2" ]]; then
            echo "사용법: $0 --manual <file_path>"
            exit 1
        fi
        local level=$(analyze_complexity "$2")
        verify_file "$2" "$level"
        ;;
    --status)
        echo "📊 검증 큐 상태:"
        echo "일반 큐: $(wc -l < "$QUEUE_FILE" 2>/dev/null || echo 0) 파일"
        echo "우선순위 큐: $(wc -l < "$HIGH_PRIORITY_QUEUE" 2>/dev/null || echo 0) 파일"
        ;;
    *)
        echo "사용법: $0 [--auto|--manual <file>|--status]"
        exit 1
        ;;
esac