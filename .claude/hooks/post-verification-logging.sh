#!/bin/bash

# AI 교차검증 후 자동 로깅 스크립트
# Hook: Task verification-specialist, external-ai-orchestrator 실행 후 자동 호출

VERIFICATION_ID="${1:-$(date +%Y%m%d-%H%M%S)}"
TARGET_FILE="${2:-unknown}"
VERIFICATION_LEVEL="${3:-1}"
LOG_DIR=".claude/logs"
STATS_FILE=".claude/ai-stats.json"
DECISIONS_LOG=".claude/verification-decisions.log"

# 로그 디렉토리 생성
mkdir -p "$LOG_DIR"

# 현재 시간
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# AI별 성과 추적 로그
log_ai_performance() {
    local ai_name="$1"
    local duration="$2"
    local success="$3"
    local score="$4"
    
    echo "[$TIMESTAMP] ID:$VERIFICATION_ID | AI:$ai_name | Duration:${duration}s | Success:$success | Score:$score | File:$TARGET_FILE" >> "$LOG_DIR/ai-performance.log"
}

# 검증 의사결정 로그
log_verification_decision() {
    local decision="$1"    # APPROVE/REJECT/CONDITIONAL
    local final_score="$2"
    local reasoning="$3"
    
    echo "[$TIMESTAMP] ID:$VERIFICATION_ID | Decision:$decision | Score:$final_score | Level:$VERIFICATION_LEVEL | File:$TARGET_FILE | Reasoning:$reasoning" >> "$DECISIONS_LOG"
}

# 실시간 검증 진행 로그
log_verification_progress() {
    local status="$1"  # STARTED/IN_PROGRESS/COMPLETED/FAILED
    local progress="$2"  # 0-100
    local message="$3"
    
    echo "[$TIMESTAMP] ID:$VERIFICATION_ID | Status:$status | Progress:${progress}% | Message:$message | File:$TARGET_FILE" >> "$LOG_DIR/verification-progress.log"
}

# JSON 통계 업데이트 함수
update_ai_stats() {
    local ai_name="$1"
    local duration="$2"
    local success="$3"
    local score="$4"
    
    # 기존 통계 파일이 없으면 초기화
    if [ ! -f "$STATS_FILE" ]; then
        echo '{}' > "$STATS_FILE"
    fi
    
    # Python을 사용하여 JSON 통계 업데이트
    python3 -c "
import json
import sys
from datetime import datetime

# JSON 파일 읽기
try:
    with open('$STATS_FILE', 'r') as f:
        stats = json.load(f)
except:
    stats = {}

# AI별 통계 초기화
if '$ai_name' not in stats:
    stats['$ai_name'] = {
        'total_requests': 0,
        'successful_requests': 0,
        'failed_requests': 0,
        'total_duration': 0,
        'total_score': 0,
        'last_updated': ''
    }

# 통계 업데이트
ai_stats = stats['$ai_name']
ai_stats['total_requests'] += 1
ai_stats['total_duration'] += $duration

if '$success' == 'true':
    ai_stats['successful_requests'] += 1
    ai_stats['total_score'] += $score
else:
    ai_stats['failed_requests'] += 1

ai_stats['last_updated'] = '$TIMESTAMP'

# 평균 계산
if ai_stats['successful_requests'] > 0:
    ai_stats['avg_duration'] = round(ai_stats['total_duration'] / ai_stats['total_requests'], 2)
    ai_stats['avg_score'] = round(ai_stats['total_score'] / ai_stats['successful_requests'], 2)
    ai_stats['success_rate'] = round(ai_stats['successful_requests'] * 100 / ai_stats['total_requests'], 2)

# 파일 저장
with open('$STATS_FILE', 'w') as f:
    json.dump(stats, f, indent=2)
"
}

# 사용량 모니터링 로그
log_usage_monitoring() {
    local ai_name="$1"
    local current_usage="$2"
    local daily_limit="$3"
    
    local usage_percent=$((current_usage * 100 / daily_limit))
    
    echo "[$TIMESTAMP] AI:$ai_name | Usage:$current_usage/$daily_limit (${usage_percent}%) | File:$TARGET_FILE" >> "$LOG_DIR/usage-monitoring.log"
    
    # 80% 초과 시 경고 로그
    if [ $usage_percent -gt 80 ]; then
        echo "[$TIMESTAMP] WARNING: $ai_name usage exceeded 80% (${usage_percent}%)" >> "$LOG_DIR/usage-warnings.log"
    fi
}

# 메인 로깅 함수 (다른 스크립트에서 호출)
main_logging() {
    # 검증 시작 로그
    log_verification_progress "STARTED" "0" "AI 교차검증 시작"
    
    # 예시 데이터 (실제로는 AI 결과에서 파싱)
    # 이 부분은 실제 AI 결과를 파싱하여 동적으로 생성되어야 함
    
    # Claude 결과 로깅 (예시)
    log_ai_performance "claude" "45" "true" "8.5"
    log_verification_progress "IN_PROGRESS" "25" "Claude 검증 완료"
    
    # 외부 AI 결과들 (병렬 처리 시)
    log_ai_performance "codex" "38" "true" "8.0"
    log_ai_performance "gemini" "52" "true" "7.8"
    log_ai_performance "qwen" "41" "false" "0"  # 실패 시
    
    log_verification_progress "IN_PROGRESS" "75" "3/4 AI 검증 완료"
    
    # 최종 의사결정 로깅
    local final_score="8.1"
    local decision="CONDITIONAL"
    local reasoning="8.1/10 점수로 조건부 승인, 3개 개선사항 적용 필요"
    
    log_verification_decision "$decision" "$final_score" "$reasoning"
    log_verification_progress "COMPLETED" "100" "교차검증 완료: $decision ($final_score/10)"
    
    # AI별 통계 업데이트
    update_ai_stats "claude" "45" "true" "8.5"
    update_ai_stats "codex" "38" "true" "8.0"
    update_ai_stats "gemini" "52" "true" "7.8"
    update_ai_stats "qwen" "41" "false" "0"
    
    # 사용량 모니터링 (예시)
    log_usage_monitoring "gemini" "234" "1000"
    log_usage_monitoring "qwen" "567" "2000"
}

# 스크립트가 직접 실행될 때
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main_logging "$@"
fi

echo "✅ AI 교차검증 로깅 완료: ID=$VERIFICATION_ID, File=$TARGET_FILE"