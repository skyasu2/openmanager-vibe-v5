#!/bin/bash

# Agent Completion Hook: 서브 에이전트 완료 시 결과 요약
# 파일: hooks/agent-completion-hook.sh

set -euo pipefail

# 로그 설정
HOOK_LOG=".claude/audit/hook.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
FORMATTED_DATE=$(date '+%Y-%m-%d-%H-%M')

# 로그 함수
log() {
    echo "[$TIMESTAMP] AGENT-COMPLETE: $1" | tee -a "$HOOK_LOG"
}

# 인자 확인
if [ $# -lt 2 ]; then
    log "ERROR: 에이전트명과 상태가 제공되지 않았습니다."
    echo "사용법: $0 <agent_name> <status> [result_summary]"
    exit 1
fi

AGENT_NAME="$1"
STATUS="$2"
RESULT_SUMMARY="${3:-No summary provided}"

log "에이전트 완료 감지: $AGENT_NAME (상태: $STATUS)"

# 결과 분류
PRIORITY="medium"
ISSUE_TYPE="info"

case "$AGENT_NAME" in
    "code-review-specialist")
        if [[ "$STATUS" == "failed" ]] || [[ "$RESULT_SUMMARY" =~ (critical|security|error) ]]; then
            PRIORITY="high"
            ISSUE_TYPE="warning"
        fi
        ;;
    "database-administrator")
        PRIORITY="high"  # DB 작업은 항상 높은 우선순위
        if [[ "$STATUS" == "failed" ]]; then
            ISSUE_TYPE="critical"
        fi
        ;;
    "issue-summary")
        PRIORITY="low"  # 자기 자신은 낮은 우선순위
        ;;
    "central-supervisor")
        PRIORITY="high"  # 슈퍼바이저 결과는 중요
        ;;
    "ai-systems-engineer")
        if [[ "$RESULT_SUMMARY" =~ (timeout|failure|error) ]]; then
            PRIORITY="high"
            ISSUE_TYPE="warning"
        fi
        ;;
esac

# 성능 메트릭 기록
METRICS_FILE=".claude/metrics/agent-performance-${FORMATTED_DATE}.json"
mkdir -p "$(dirname "$METRICS_FILE")"

# 메트릭 JSON 생성
{
    echo "{"
    echo "  \"timestamp\": \"$TIMESTAMP\","
    echo "  \"agent\": \"$AGENT_NAME\","
    echo "  \"status\": \"$STATUS\","
    echo "  \"priority\": \"$PRIORITY\","
    echo "  \"issue_type\": \"$ISSUE_TYPE\","
    echo "  \"completion_time\": \"$(date -Iseconds)\","
    echo "  \"result_length\": ${#RESULT_SUMMARY}"
    echo "}"
} >> "$METRICS_FILE"

# issue-summary 등록을 위한 이슈 파일 생성
ISSUE_FILE=".claude/issues/agent-completion-${AGENT_NAME,,}-${FORMATTED_DATE}.md"
mkdir -p "$(dirname "$ISSUE_FILE")"

# 이슈 리포트 생성
cat > "$ISSUE_FILE" << EOF
# 에이전트 완료 보고서

**생성 시간**: $TIMESTAMP  
**에이전트**: $AGENT_NAME  
**상태**: $STATUS  
**우선순위**: $PRIORITY  
**분류**: $ISSUE_TYPE  

## 실행 결과

$RESULT_SUMMARY

## 메트릭

- **완료 시간**: $(date -Iseconds)
- **결과 길이**: ${#RESULT_SUMMARY} characters
- **우선순위**: $PRIORITY

## 권장 사항

EOF

# 에이전트별 맞춤 권장사항 추가
case "$AGENT_NAME" in
    "code-review-specialist")
        echo "- 코드 품질 이슈가 발견된 경우 즉시 수정 권장" >> "$ISSUE_FILE"
        echo "- 보안 취약점은 높은 우선순위로 처리" >> "$ISSUE_FILE"
        ;;
    "database-administrator")
        echo "- 데이터베이스 변경사항 백업 확인" >> "$ISSUE_FILE"
        echo "- 무료 티어 사용량 모니터링 필요" >> "$ISSUE_FILE"
        echo "- 성능 영향 지속 관찰" >> "$ISSUE_FILE"
        ;;
    "test-automation-specialist")
        echo "- 실패한 테스트는 즉시 수정 필요" >> "$ISSUE_FILE"
        echo "- 커버리지 목표 80% 유지 확인" >> "$ISSUE_FILE"
        ;;
    "ux-performance-optimizer")
        echo "- Core Web Vitals 메트릭 확인" >> "$ISSUE_FILE"
        echo "- Lighthouse 점수 90+ 유지 확인" >> "$ISSUE_FILE"
        ;;
esac

# 실패한 경우 추가 조치
if [ "$STATUS" = "failed" ]; then
    echo "" >> "$ISSUE_FILE"
    echo "## 🚨 실패 처리 필요" >> "$ISSUE_FILE"
    echo "" >> "$ISSUE_FILE"
    echo "이 에이전트가 실패했습니다. 다음 조치를 검토하세요:" >> "$ISSUE_FILE"
    echo "" >> "$ISSUE_FILE"
    echo "1. 에러 로그 확인" >> "$ISSUE_FILE"
    echo "2. 재실행 가능성 검토" >> "$ISSUE_FILE"
    echo "3. 대안 에이전트 고려" >> "$ISSUE_FILE"
    echo "4. 수동 처리 필요성 판단" >> "$ISSUE_FILE"
    
    # 심각한 실패의 경우 즉시 알림
    ALERT_FILE=".claude/issues/CRITICAL-agent-failure-${FORMATTED_DATE}.md"
    cat > "$ALERT_FILE" << EOF
# 🚨 CRITICAL: 에이전트 실행 실패

**시간**: $TIMESTAMP  
**에이전트**: $AGENT_NAME  
**상태**: FAILED  

## 즉시 조치 필요

에이전트 실행이 실패했습니다. 즉시 확인이 필요합니다.

**결과**: $RESULT_SUMMARY

---
자동 생성됨 - agent-completion-hook
EOF
    
    log "CRITICAL: 에이전트 실패 알림 생성됨 - $ALERT_FILE"
fi

# SLA 추적을 위한 성능 로그
SLA_LOG=".claude/metrics/sla-tracking.log"
RESPONSE_TIME="unknown"  # 실제로는 에이전트 시작/종료 시간으로 계산해야 함

{
    echo "timestamp=$TIMESTAMP"
    echo "agent=$AGENT_NAME"
    echo "status=$STATUS"
    echo "priority=$PRIORITY"
    echo "response_time=$RESPONSE_TIME"
    echo "---"
} >> "$SLA_LOG"

# audit 로그에 완료 기록
{
    echo "{"
    echo "  \"timestamp\": \"$TIMESTAMP\","
    echo "  \"hook\": \"agent-completion\","
    echo "  \"agent\": \"$AGENT_NAME\","
    echo "  \"status\": \"$STATUS\","
    echo "  \"priority\": \"$PRIORITY\","
    echo "  \"issue_type\": \"$ISSUE_TYPE\","
    echo "  \"issue_file\": \"$ISSUE_FILE\","
    echo "  \"metrics_file\": \"$METRICS_FILE\""
    echo "}"
} >> ".claude/audit/audit.log"

log "에이전트 완료 처리 완료: $AGENT_NAME -> $ISSUE_FILE"

# 성공적으로 완료된 중요 에이전트의 경우 요약 생성
if [ "$STATUS" = "completed" ] && [[ "$AGENT_NAME" =~ (central-supervisor|database-administrator) ]]; then
    log "중요 에이전트 완료 - 성공 요약 생성"
    
    SUCCESS_SUMMARY=".claude/issues/success-${AGENT_NAME,,}-${FORMATTED_DATE}.md"
    cat > "$SUCCESS_SUMMARY" << EOF
# ✅ 성공: $AGENT_NAME 완료

**시간**: $TIMESTAMP  
**상태**: 성공적으로 완료됨  

## 결과 요약

$RESULT_SUMMARY

## 다음 단계

- 결과 검토 및 적용
- 관련 테스트 실행 권장
- 성능 모니터링 계속

---
자동 생성됨 - agent-completion-hook
EOF
fi

echo "에이전트 완료 처리됨: $AGENT_NAME ($STATUS)"
echo "이슈 파일: $ISSUE_FILE"

# 성공 상태 반환
exit 0