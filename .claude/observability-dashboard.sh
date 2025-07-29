#!/bin/bash

# Observability Dashboard: 통합 관측성 대시보드
# 파일: .claude/observability-dashboard.sh

set -euo pipefail

# 로그 설정
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
FORMATTED_DATE=$(date '+%Y-%m-%d')
DASHBOARD_FILE=".claude/observability-dashboard-${FORMATTED_DATE}.md"

# 로그 함수
log() {
    echo "[$TIMESTAMP] OBSERVABILITY: $1"
}

log "통합 관측성 대시보드 생성 시작"

# 전체 대시보드 생성
create_main_dashboard() {
    cat > "$DASHBOARD_FILE" << EOF
# 🔍 OpenManager VIBE v5 - 통합 관측성 대시보드

**생성 시간**: $TIMESTAMP  
**기준 날짜**: $FORMATTED_DATE  

---

## 📊 시스템 개요

### 🎯 핵심 메트릭 요약
EOF

    # 메트릭 수집 실행
    if [ -x ".claude/metrics/metrics-collector.sh" ]; then
        log "메트릭 수집 실행 중..."
        ./.claude/metrics/metrics-collector.sh >/dev/null 2>&1 || log "WARNING: 메트릭 수집 실패"
        
        # 최신 메트릭 파일 읽기
        local latest_metrics=$(ls -t .claude/metrics/system-metrics-*.json 2>/dev/null | head -1)
        
        if [ -f "$latest_metrics" ] && command -v jq >/dev/null 2>&1; then
            cat >> "$DASHBOARD_FILE" << EOF

| 메트릭 | 현재 값 | 상태 |
|--------|---------|------|
| CPU 사용률 | $(jq -r '.system.cpu' "$latest_metrics")% | $([ $(jq -r '.system.cpu' "$latest_metrics" | cut -d. -f1) -lt 80 ] && echo "✅ 정상" || echo "⚠️ 높음") |
| 메모리 사용률 | $(jq -r '.system.memory' "$latest_metrics")% | $([ $(jq -r '.system.memory' "$latest_metrics" | cut -d. -f1) -lt 80 ] && echo "✅ 정상" || echo "⚠️ 높음") |
| Redis 사용량 | $(jq -r '.free_tier.redis_memory' "$latest_metrics")% | $([ $(jq -r '.free_tier.redis_memory' "$latest_metrics") -lt 80 ] && echo "✅ 정상" || echo "🚨 임계값 초과") |
| Supabase 사용량 | $(jq -r '.free_tier.supabase_storage' "$latest_metrics")% | $([ $(jq -r '.free_tier.supabase_storage' "$latest_metrics") -lt 90 ] && echo "✅ 정상" || echo "🚨 임계값 초과") |
| SLA 가동률 | $(jq -r '.sla.uptime_percent' "$latest_metrics")% | $([ $(echo "$(jq -r '.sla.uptime_percent' "$latest_metrics") > 99.9" | bc -l) -eq 1 ] && echo "✅ 목표 달성" || echo "⚠️ 목표 미달") |
| 평균 응답시간 | $(jq -r '.sla.avg_response_time' "$latest_metrics")ms | $([ $(jq -r '.sla.avg_response_time' "$latest_metrics") -lt 200 ] && echo "✅ 정상" || echo "⚠️ 느림") |

EOF
        else
            echo "메트릭 데이터를 읽을 수 없습니다. (jq 또는 메트릭 파일 없음)" >> "$DASHBOARD_FILE"
        fi
    else
        echo "메트릭 수집기를 찾을 수 없습니다." >> "$DASHBOARD_FILE"
    fi
    
    # 감사 로그 대시보드 실행
    if [ -x ".claude/audit/audit-dashboard.sh" ]; then
        log "감사 로그 대시보드 생성 중..."
        ./.claude/audit/audit-dashboard.sh >/dev/null 2>&1 || log "WARNING: 감사 대시보드 생성 실패"
        
        # 감사 대시보드 요약 추가
        local audit_dashboard=$(ls -t .claude/audit/dashboard-*.md 2>/dev/null | head -1)
        
        if [ -f "$audit_dashboard" ]; then
            cat >> "$DASHBOARD_FILE" << EOF

## 🔐 보안 및 거버넌스 현황

$(grep -A 10 "전체 통계" "$audit_dashboard" | tail -10 || echo "감사 로그 요약을 읽을 수 없습니다.")

EOF
        fi
    fi
    
    # Hook 성능 분석
    cat >> "$DASHBOARD_FILE" << EOF

## ⚡ Hook 성능 분석

### 자동화 트리거 현황
EOF

    local audit_log=".claude/audit/audit.log"
    if [ -f "$audit_log" ]; then
        local today_hooks=$(grep "$(date '+%Y-%m-%d')" "$audit_log" | wc -l || echo "0")
        local successful_hooks=$(grep "$(date '+%Y-%m-%d')" "$audit_log" | grep -c '"action": "APPROVED"' || echo "0")
        local blocked_hooks=$(grep "$(date '+%Y-%m-%d')" "$audit_log" | grep -c '"action": "BLOCKED"' || echo "0")
        local delegated_hooks=$(grep "$(date '+%Y-%m-%d')" "$audit_log" | grep -c '"action": "DELEGATED"' || echo "0")
        
        cat >> "$DASHBOARD_FILE" << EOF

| Hook 결과 | 오늘 횟수 | 비율 |
|-----------|-----------|------|
| 승인됨 | $successful_hooks | $([ $today_hooks -gt 0 ] && echo "scale=1; $successful_hooks * 100 / $today_hooks" | bc || echo "0")% |
| 차단됨 | $blocked_hooks | $([ $today_hooks -gt 0 ] && echo "scale=1; $blocked_hooks * 100 / $today_hooks" | bc || echo "0")% |
| 위임됨 | $delegated_hooks | $([ $today_hooks -gt 0 ] && echo "scale=1; $delegated_hooks * 100 / $today_hooks" | bc || echo "0")% |
| **총계** | **$today_hooks** | **100%** |

EOF
    else
        echo "감사 로그 파일이 없습니다." >> "$DASHBOARD_FILE"
    fi
    
    # 에이전트 활동 분석
    cat >> "$DASHBOARD_FILE" << EOF

## 🤖 에이전트 활동 분석

### 오늘의 에이전트 호출 현황
EOF

    if [ -f "$audit_log" ]; then
        local code_review_calls=$(grep "$(date '+%Y-%m-%d')" "$audit_log" | grep -c '"agent": "code-review-specialist"' || echo "0")
        local db_admin_calls=$(grep "$(date '+%Y-%m-%d')" "$audit_log" | grep -c '"agent": "database-administrator"' || echo "0")
        local issue_summary_calls=$(grep "$(date '+%Y-%m-%d')" "$audit_log" | grep -c '"agent": "issue-summary"' || echo "0")
        
        cat >> "$DASHBOARD_FILE" << EOF

- **code-review-specialist**: $code_review_calls 회 호출
- **database-administrator**: $db_admin_calls 회 호출  
- **issue-summary**: $issue_summary_calls 회 호출

### 자동 트리거 효과성
EOF

        if [ $code_review_calls -gt 0 ]; then
            echo "✅ 코드 리뷰 자동화가 활성화되어 있습니다." >> "$DASHBOARD_FILE"
        else
            echo "⚠️ 코드 리뷰 자동화가 작동하지 않고 있습니다." >> "$DASHBOARD_FILE"
        fi
        
        if [ $db_admin_calls -gt 0 ]; then
            echo "✅ 데이터베이스 관리 자동화가 활성화되어 있습니다." >> "$DASHBOARD_FILE"
        fi
    fi
    
    # 무료 티어 사용량 경고
    cat >> "$DASHBOARD_FILE" << EOF

## 💰 무료 티어 사용량 모니터링

### 현재 사용량 및 경고
EOF

    # 최근 이슈 파일에서 알림 확인
    local alert_count=$(ls .claude/issues/ALERT-*${FORMATTED_DATE}* 2>/dev/null | wc -l || echo "0")
    local critical_count=$(ls .claude/issues/CRITICAL-*${FORMATTED_DATE}* 2>/dev/null | wc -l || echo "0")
    
    if [ $alert_count -gt 0 ] || [ $critical_count -gt 0 ]; then
        cat >> "$DASHBOARD_FILE" << EOF

🚨 **활성 알림**: $alert_count 개  
🔴 **긴급 알림**: $critical_count 개  

최근 알림:
EOF
        ls .claude/issues/ALERT-*${FORMATTED_DATE}* .claude/issues/CRITICAL-*${FORMATTED_DATE}* 2>/dev/null | head -5 | while read file; do
            echo "- $(basename "$file")" >> "$DASHBOARD_FILE"
        done
    else
        echo "✅ 현재 활성 알림이 없습니다." >> "$DASHBOARD_FILE"
    fi
    
    # 시스템 상태 요약
    cat >> "$DASHBOARD_FILE" << EOF

## 📈 성능 트렌드

### 일주일간 활동 패턴
EOF

    # 최근 7일간 이벤트 수 분석
    for i in {6..0}; do
        local check_date=$(date -d "$i days ago" '+%Y-%m-%d')
        local day_events=$(grep "$check_date" "$audit_log" 2>/dev/null | wc -l || echo "0")
        local day_name=$(date -d "$i days ago" '+%a')
        
        echo "- $check_date ($day_name): $day_events 이벤트" >> "$DASHBOARD_FILE"
    done
    
    # 권장 조치
    cat >> "$DASHBOARD_FILE" << EOF

## 🎯 권장 조치

### 즉시 조치 필요
EOF

    local immediate_actions=()
    
    # 조건부 권장사항 생성
    if [ $critical_count -gt 0 ]; then
        immediate_actions+=("🔴 긴급 알림 $critical_count 개 확인 및 처리")
    fi
    
    if [ $blocked_hooks -gt 5 ]; then
        immediate_actions+=("🚫 차단된 작업이 많습니다 ($blocked_hooks 개) - 정책 검토 필요")
    fi
    
    if [ $today_hooks -eq 0 ]; then
        immediate_actions+=("⚠️ Hook 시스템이 작동하지 않고 있습니다 - 설정 확인 필요")
    fi
    
    if [ ${#immediate_actions[@]} -eq 0 ]; then
        echo "✅ 현재 즉시 조치가 필요한 항목이 없습니다." >> "$DASHBOARD_FILE"
    else
        for action in "${immediate_actions[@]}"; do
            echo "- $action" >> "$DASHBOARD_FILE"
        done
    fi
    
    # 대시보드 완료
    cat >> "$DASHBOARD_FILE" << EOF

---

## 📋 대시보드 정보

**자동 생성**: observability-dashboard.sh  
**마지막 업데이트**: $TIMESTAMP  
**다음 자동 업데이트**: $(date -d '+4 hours' '+%Y-%m-%d %H:%M:%S')  

### 관련 파일
- 감사 로그: \`.claude/audit/audit.log\`
- 메트릭 데이터: \`.claude/metrics/\`
- 이슈 트래킹: \`.claude/issues/\`
- Hook 설정: \`.claude/settings.local.json\`

### 수동 명령어
\`\`\`bash
# 메트릭 수집
.claude/metrics/metrics-collector.sh

# 감사 대시보드 생성  
.claude/audit/audit-dashboard.sh

# 통합 대시보드 생성
.claude/observability-dashboard.sh
\`\`\`

**전체 시스템 상태**: $([ $critical_count -eq 0 ] && [ $alert_count -lt 3 ] && echo "🟢 정상" || echo "🟡 주의필요")
EOF
}

# 메인 대시보드 생성
create_main_dashboard

log "통합 관측성 대시보드 생성 완료: $DASHBOARD_FILE"

# 요약 출력
echo ""
echo "=== 통합 관측성 대시보드 요약 ==="
echo "생성 시간: $TIMESTAMP"
echo "대시보드 파일: $DASHBOARD_FILE"
echo ""

# 상태 요약
local alert_count=$(ls .claude/issues/ALERT-*${FORMATTED_DATE}* 2>/dev/null | wc -l || echo "0")
local critical_count=$(ls .claude/issues/CRITICAL-*${FORMATTED_DATE}* 2>/dev/null | wc -l || echo "0")

if [ $critical_count -gt 0 ]; then
    echo "🔴 시스템 상태: 긴급 주의 ($critical_count 개 긴급 알림)"
elif [ $alert_count -gt 0 ]; then
    echo "🟡 시스템 상태: 주의 ($alert_count 개 알림)"
else
    echo "🟢 시스템 상태: 정상"
fi

echo ""
echo "대시보드를 확인하세요: $DASHBOARD_FILE"

# 성공 상태 반환
exit 0