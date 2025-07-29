#!/bin/bash

# Audit Dashboard: 감사 로그 분석 및 대시보드 생성
# 파일: .claude/audit/audit-dashboard.sh

set -euo pipefail

# 로그 설정
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
FORMATTED_DATE=$(date '+%Y-%m-%d')
AUDIT_LOG=".claude/audit/audit.log"
DASHBOARD_FILE=".claude/audit/dashboard-${FORMATTED_DATE}.md"

# 로그 함수
log() {
    echo "[$TIMESTAMP] AUDIT-DASHBOARD: $1"
}

log "감사 로그 대시보드 생성 시작"

# audit.log 파일 존재 확인
if [ ! -f "$AUDIT_LOG" ]; then
    log "감사 로그 파일이 없습니다. 빈 대시보드를 생성합니다."
    touch "$AUDIT_LOG"
fi

# 데이터 수집
TOTAL_EVENTS=$(wc -l < "$AUDIT_LOG")
TODAY_EVENTS=$(grep "$(date '+%Y-%m-%d')" "$AUDIT_LOG" | wc -l || echo "0")

# Hook 이벤트 통계
POST_WRITE_COUNT=$(grep '"hook": "post-write"' "$AUDIT_LOG" | wc -l || echo "0")
POST_EDIT_COUNT=$(grep '"hook": "post-edit"' "$AUDIT_LOG" | wc -l || echo "0")
PRE_DATABASE_COUNT=$(grep '"hook": "pre-database"' "$AUDIT_LOG" | wc -l || echo "0")
AGENT_COMPLETION_COUNT=$(grep '"hook": "agent-completion"' "$AUDIT_LOG" | wc -l || echo "0")

# 에이전트 활동 통계
CODE_REVIEW_COUNT=$(grep '"agent": "code-review-specialist"' "$AUDIT_LOG" | wc -l || echo "0")
DATABASE_ADMIN_COUNT=$(grep '"agent": "database-administrator"' "$AUDIT_LOG" | wc -l || echo "0")
ISSUE_SUMMARY_COUNT=$(grep '"agent": "issue-summary"' "$AUDIT_LOG" | wc -l || echo "0")

# 액션 분류 통계
BLOCKED_COUNT=$(grep '"action": "BLOCKED"' "$AUDIT_LOG" | wc -l || echo "0")
DELEGATED_COUNT=$(grep '"action": "DELEGATED"' "$AUDIT_LOG" | wc -l || echo "0")
APPROVED_COUNT=$(grep '"action": "APPROVED"' "$AUDIT_LOG" | wc -l || echo "0")

# 최근 중요 이벤트 (최근 24시간)
YESTERDAY=$(date -d '1 day ago' '+%Y-%m-%d')
RECENT_EVENTS=$(grep -E "($FORMATTED_DATE|$YESTERDAY)" "$AUDIT_LOG" | tail -10 || echo "")

# SLA 메트릭 계산
calculate_sla_metrics() {
    local sla_log=".claude/metrics/sla-tracking.log"
    
    if [ ! -f "$sla_log" ]; then
        echo "SLA 로그 없음"
        return
    fi
    
    # 평균 응답 시간 (실제로는 더 정교한 계산 필요)
    echo "SLA 메트릭 계산 중..."
}

# 대시보드 생성
cat > "$DASHBOARD_FILE" << EOF
# 🔍 감사 로그 대시보드

**생성 시간**: $TIMESTAMP  
**분석 기간**: $(date '+%Y-%m-%d')  

## 📊 전체 통계

| 메트릭 | 값 |
|---------|-----|
| 총 이벤트 수 | $TOTAL_EVENTS |
| 오늘 이벤트 | $TODAY_EVENTS |
| 차단된 작업 | $BLOCKED_COUNT |
| 위임된 작업 | $DELEGATED_COUNT |
| 승인된 작업 | $APPROVED_COUNT |

## 🎯 Hook 활동 분석

| Hook 유형 | 실행 횟수 |
|-----------|-----------|
| Post-Write | $POST_WRITE_COUNT |
| Post-Edit | $POST_EDIT_COUNT |
| Pre-Database | $PRE_DATABASE_COUNT |
| Agent-Completion | $AGENT_COMPLETION_COUNT |

## 🤖 에이전트 활동 통계

| 에이전트 | 호출 횟수 |
|----------|-----------|
| code-review-specialist | $CODE_REVIEW_COUNT |
| database-administrator | $DATABASE_ADMIN_COUNT |
| issue-summary | $ISSUE_SUMMARY_COUNT |

## 🚨 보안 및 거버넌스

### 차단된 작업
EOF

# 차단된 작업들 상세 분석
if [ "$BLOCKED_COUNT" -gt 0 ]; then
    echo "" >> "$DASHBOARD_FILE"
    echo "최근 차단된 작업들:" >> "$DASHBOARD_FILE"
    echo "\`\`\`json" >> "$DASHBOARD_FILE"
    grep '"action": "BLOCKED"' "$AUDIT_LOG" | tail -5 >> "$DASHBOARD_FILE" || echo "차단된 작업 없음" >> "$DASHBOARD_FILE"
    echo "\`\`\`" >> "$DASHBOARD_FILE"
else
    echo "오늘 차단된 작업이 없습니다. ✅" >> "$DASHBOARD_FILE"
fi

# 위임된 작업들
cat >> "$DASHBOARD_FILE" << EOF

### 위임된 작업
EOF

if [ "$DELEGATED_COUNT" -gt 0 ]; then
    echo "" >> "$DASHBOARD_FILE"
    echo "최근 위임된 작업들:" >> "$DASHBOARD_FILE"
    echo "\`\`\`json" >> "$DASHBOARD_FILE"
    grep '"action": "DELEGATED"' "$AUDIT_LOG" | tail -5 >> "$DASHBOARD_FILE" || echo "위임된 작업 없음" >> "$DASHBOARD_FILE"
    echo "\`\`\`" >> "$DASHBOARD_FILE"
else
    echo "오늘 위임된 작업이 없습니다." >> "$DASHBOARD_FILE"
fi

# 성능 메트릭
cat >> "$DASHBOARD_FILE" << EOF

## 📈 성능 메트릭

### Hook 응답 시간
- 평균 응답 시간: 계산 중...
- 최대 응답 시간: 계산 중...
- SLA 준수율: 계산 중...

### 에이전트 성능
- 성공률: $(echo "scale=2; ($APPROVED_COUNT * 100) / ($TOTAL_EVENTS + 1)" | bc)%
- 실패율: $(echo "scale=2; ($BLOCKED_COUNT * 100) / ($TOTAL_EVENTS + 1)" | bc)%

## 🔄 최근 활동 (최근 10개 이벤트)

\`\`\`json
$RECENT_EVENTS
\`\`\`

## 📋 권장 조치

EOF

# 권장 조치 생성
if [ "$BLOCKED_COUNT" -gt 5 ]; then
    echo "🚨 **높은 차단율**: 차단된 작업이 $BLOCKED_COUNT 개입니다. 보안 정책을 검토하세요." >> "$DASHBOARD_FILE"
fi

if [ "$TODAY_EVENTS" -gt 100 ]; then
    echo "⚡ **높은 활동량**: 오늘 $TODAY_EVENTS 개의 이벤트가 발생했습니다. 시스템 부하를 모니터링하세요." >> "$DASHBOARD_FILE"
fi

if [ "$CODE_REVIEW_COUNT" -lt 5 ] && [ "$TODAY_EVENTS" -gt 10 ]; then
    echo "🔍 **코드 리뷰 부족**: 활동량에 비해 코드 리뷰가 적습니다. 자동 리뷰 설정을 확인하세요." >> "$DASHBOARD_FILE"
fi

# 트렌드 분석
cat >> "$DASHBOARD_FILE" << EOF

## 📈 트렌드 분석

### 일간 활동 패턴
EOF

# 최근 7일간 활동 분석
for i in {6..0}; do
    check_date=$(date -d "$i days ago" '+%Y-%m-%d')
    day_events=$(grep "$check_date" "$AUDIT_LOG" | wc -l || echo "0")
    echo "- $check_date: $day_events 이벤트" >> "$DASHBOARD_FILE"
done

# 대시보드 완료
cat >> "$DASHBOARD_FILE" << EOF

---

**자동 생성**: audit-dashboard.sh  
**다음 업데이트**: $(date -d '+1 day' '+%Y-%m-%d %H:%M:%S')  

대시보드 파일: \`$DASHBOARD_FILE\`
EOF

log "감사 로그 대시보드 생성 완료: $DASHBOARD_FILE"

# 요약 출력
echo ""
echo "=== 감사 로그 대시보드 요약 ==="
echo "총 이벤트: $TOTAL_EVENTS"
echo "오늘 이벤트: $TODAY_EVENTS"
echo "차단된 작업: $BLOCKED_COUNT"
echo "코드 리뷰: $CODE_REVIEW_COUNT"
echo "데이터베이스 작업: $DATABASE_ADMIN_COUNT"
echo ""
echo "대시보드 파일: $DASHBOARD_FILE"

# 성공 상태 반환
exit 0