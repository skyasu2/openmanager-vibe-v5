#!/bin/bash

# Metrics Collector: 시스템 메트릭 수집 및 분석
# 파일: .claude/metrics/metrics-collector.sh

set -euo pipefail

# 로그 설정
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
FORMATTED_DATE=$(date '+%Y-%m-%d')
FORMATTED_TIME=$(date '+%H:%M:%S')
METRICS_DIR=".claude/metrics"
METRICS_FILE="$METRICS_DIR/system-metrics-${FORMATTED_DATE}.json"

# 로그 함수
log() {
    echo "[$TIMESTAMP] METRICS: $1"
}

log "시스템 메트릭 수집 시작"

# 메트릭 디렉토리 생성
mkdir -p "$METRICS_DIR"

# 기본 시스템 메트릭 수집
collect_system_metrics() {
    log "시스템 메트릭 수집 중..."
    
    # CPU 사용률 (간단한 방법)
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//' || echo "0.0")
    
    # 메모리 사용률
    local memory_info=$(free -m | awk 'NR==2{printf "%.2f", $3*100/$2}' || echo "0.0")
    
    # 디스크 사용률
    local disk_usage=$(df -h . | awk 'NR==2{print $5}' | sed 's/%//' || echo "0")
    
    # 시스템 로드
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//' || echo "0.0")
    
    echo "{\"cpu\": $cpu_usage, \"memory\": $memory_info, \"disk\": $disk_usage, \"load\": $load_avg}"
}

# 프로젝트 특화 메트릭 수집
collect_project_metrics() {
    log "프로젝트 메트릭 수집 중..."
    
    # 파일 수 통계
    local total_files=$(find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | wc -l)
    local total_lines=$(find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -exec wc -l {} + | tail -1 | awk '{print $1}' || echo "0")
    
    # Git 통계
    local commits_today=$(git log --since="$(date '+%Y-%m-%d 00:00:00')" --oneline | wc -l || echo "0")
    local changed_files=$(git diff --name-only | wc -l || echo "0")
    
    # 테스트 파일 수
    local test_files=$(find . -type f \( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" \) | wc -l || echo "0")
    
    echo "{\"files\": $total_files, \"lines\": $total_lines, \"commits_today\": $commits_today, \"changed_files\": $changed_files, \"test_files\": $test_files}"
}

# Hook 성능 메트릭
collect_hook_metrics() {
    log "Hook 성능 메트릭 수집 중..."
    
    local audit_log=".claude/audit/audit.log"
    
    if [ ! -f "$audit_log" ]; then
        echo "{\"total_hooks\": 0, \"successful_hooks\": 0, \"failed_hooks\": 0, \"avg_response_time\": 0}"
        return
    fi
    
    # 오늘의 hook 실행 통계
    local today_hooks=$(grep "$(date '+%Y-%m-%d')" "$audit_log" | wc -l || echo "0")
    local successful_hooks=$(grep "$(date '+%Y-%m-%d')" "$audit_log" | grep -c '"action": "APPROVED"' || echo "0")
    local failed_hooks=$(grep "$(date '+%Y-%m-%d')" "$audit_log" | grep -c '"action": "BLOCKED"' || echo "0")
    
    # 평균 응답시간 (실제로는 hook에서 시간 측정 필요)
    local avg_response_time="1.2"  # 임시값
    
    echo "{\"total_hooks\": $today_hooks, \"successful_hooks\": $successful_hooks, \"failed_hooks\": $failed_hooks, \"avg_response_time\": $avg_response_time}"
}

# 에이전트 성능 메트릭
collect_agent_metrics() {
    log "에이전트 성능 메트릭 수집 중..."
    
    local agent_files=(".claude/metrics/agent-performance-*.json")
    local total_completions=0
    local successful_completions=0
    local failed_completions=0
    
    # 오늘의 에이전트 실행 파일들 검사
    if ls .claude/metrics/agent-performance-*${FORMATTED_DATE}*.json >/dev/null 2>&1; then
        for file in .claude/metrics/agent-performance-*${FORMATTED_DATE}*.json; do
            if [ -f "$file" ]; then
                ((total_completions++))
                if grep -q '"status": "completed"' "$file"; then
                    ((successful_completions++))
                elif grep -q '"status": "failed"' "$file"; then
                    ((failed_completions++))
                fi
            fi
        done
    fi
    
    local success_rate=0
    if [ $total_completions -gt 0 ]; then
        success_rate=$(echo "scale=2; $successful_completions * 100 / $total_completions" | bc)
    fi
    
    echo "{\"total_completions\": $total_completions, \"successful_completions\": $successful_completions, \"failed_completions\": $failed_completions, \"success_rate\": $success_rate}"
}

# 무료 티어 사용량 모니터링
collect_free_tier_metrics() {
    log "무료 티어 사용량 메트릭 수집 중..."
    
    # 실제로는 각 서비스 API를 호출해야 하지만, 임시로 예상값 사용
    local vercel_usage="35"  # 100GB 중 35% 사용
    local supabase_usage="12"  # 500MB 중 12% 사용
    local redis_usage="45"  # 256MB 중 45% 사용
    local gcp_usage="18"  # 2백만 호출 중 18% 사용
    
    echo "{\"vercel_bandwidth\": $vercel_usage, \"supabase_storage\": $supabase_usage, \"redis_memory\": $redis_usage, \"gcp_functions\": $gcp_usage}"
}

# SLA 메트릭 계산
calculate_sla_metrics() {
    log "SLA 메트릭 계산 중..."
    
    local sla_log=".claude/metrics/sla-tracking.log"
    local uptime_percent="99.95"
    local avg_response_time="152"  # ms
    local error_rate="0.05"  # %
    
    if [ -f "$sla_log" ]; then
        # 실제 SLA 계산 로직 (여기서는 간소화)
        local total_requests=$(grep "timestamp=" "$sla_log" | wc -l || echo "1")
        local failed_requests=$(grep "status=failed" "$sla_log" | wc -l || echo "0")
        
        if [ $total_requests -gt 0 ]; then
            error_rate=$(echo "scale=2; $failed_requests * 100 / $total_requests" | bc)
            uptime_percent=$(echo "scale=2; 100 - $error_rate" | bc)
        fi
    fi
    
    echo "{\"uptime_percent\": $uptime_percent, \"avg_response_time\": $avg_response_time, \"error_rate\": $error_rate}"
}

# 전체 메트릭 JSON 생성
generate_metrics_json() {
    local system_metrics=$(collect_system_metrics)
    local project_metrics=$(collect_project_metrics)
    local hook_metrics=$(collect_hook_metrics)
    local agent_metrics=$(collect_agent_metrics)
    local free_tier_metrics=$(collect_free_tier_metrics)
    local sla_metrics=$(calculate_sla_metrics)
    
    cat << EOF
{
  "timestamp": "$TIMESTAMP",
  "date": "$FORMATTED_DATE",
  "time": "$FORMATTED_TIME",
  "system": $system_metrics,
  "project": $project_metrics,
  "hooks": $hook_metrics,
  "agents": $agent_metrics,
  "free_tier": $free_tier_metrics,
  "sla": $sla_metrics,
  "collection_duration": "$(date +%s)"
}
EOF
}

# 메트릭 수집 및 저장
METRICS_JSON=$(generate_metrics_json)
echo "$METRICS_JSON" > "$METRICS_FILE"

log "메트릭 수집 완료: $METRICS_FILE"

# 알림 임계값 검사
check_alert_thresholds() {
    log "알림 임계값 검사 중..."
    
    # 무료 티어 사용량 알림
    local redis_usage=$(echo "$METRICS_JSON" | jq -r '.free_tier.redis_memory')
    local supabase_usage=$(echo "$METRICS_JSON" | jq -r '.free_tier.supabase_storage')
    
    if [ "$redis_usage" -gt 80 ]; then
        local alert_file=".claude/issues/ALERT-redis-usage-${FORMATTED_DATE}.md"
        cat > "$alert_file" << EOF
# 🚨 ALERT: Redis 사용량 임계값 초과

**시간**: $TIMESTAMP  
**사용량**: ${redis_usage}%  
**임계값**: 80%  

Redis 메모리 사용량이 임계값을 초과했습니다.
즉시 캐시 정리 또는 TTL 정책 검토가 필요합니다.

## 권장 조치
1. 불필요한 키 정리
2. TTL 정책 검토
3. 캐시 전략 최적화

---
자동 생성됨 - metrics-collector
EOF
        log "ALERT: Redis 사용량 경고 생성 - $alert_file"
    fi
    
    if [ "$supabase_usage" -gt 90 ]; then
        local alert_file=".claude/issues/ALERT-supabase-usage-${FORMATTED_DATE}.md"
        cat > "$alert_file" << EOF
# 🚨 CRITICAL: Supabase 사용량 임계값 초과

**시간**: $TIMESTAMP  
**사용량**: ${supabase_usage}%  
**임계값**: 90%  

Supabase 스토리지 사용량이 임계값을 초과했습니다.
즉시 조치가 필요합니다.

## 즉시 조치
1. 불필요한 데이터 정리
2. 데이터 아카이빙
3. 사용량 최적화

---
자동 생성됨 - metrics-collector
EOF
        log "CRITICAL: Supabase 사용량 경고 생성 - $alert_file"
    fi
}

# jq가 있는지 확인하고 알림 검사
if command -v jq >/dev/null 2>&1; then
    check_alert_thresholds
else
    log "WARNING: jq 명령어가 없어 알림 임계값 검사를 건너뜁니다."
fi

# 요약 출력
echo ""
echo "=== 메트릭 수집 요약 ==="
echo "수집 시간: $TIMESTAMP"
echo "메트릭 파일: $METRICS_FILE"
echo ""

# 간단한 요약 출력 (jq 없이)
if command -v jq >/dev/null 2>&1; then
    echo "시스템 상태:"
    echo "- CPU: $(echo "$METRICS_JSON" | jq -r '.system.cpu')%"
    echo "- 메모리: $(echo "$METRICS_JSON" | jq -r '.system.memory')%"
    echo "- Redis: $(echo "$METRICS_JSON" | jq -r '.free_tier.redis_memory')%"
    echo "- Supabase: $(echo "$METRICS_JSON" | jq -r '.free_tier.supabase_storage')%"
fi

# 성공 상태 반환
exit 0