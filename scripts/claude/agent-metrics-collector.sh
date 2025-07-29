#!/bin/bash

# Agent Metrics Collector
# 서브 에이전트 실행 메트릭 수집 및 분석 스크립트

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
LOGS_DIR="$CLAUDE_DIR/execution-logs"
METRICS_DIR="$LOGS_DIR/metrics"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 디렉토리 생성
mkdir -p "$LOGS_DIR" "$METRICS_DIR"

# 현재 날짜
TODAY=$(date +%Y-%m-%d)
NOW=$(date +%Y-%m-%dT%H:%M:%S)

# 함수: 에이전트 실행 기록
record_execution() {
    local agent_type="$1"
    local status="$2"
    local duration="$3"
    local tools_used="$4"
    
    local log_file="$LOGS_DIR/$TODAY/executions.jsonl"
    mkdir -p "$(dirname "$log_file")"
    
    cat >> "$log_file" << EOF
{"timestamp":"$NOW","agent":"$agent_type","status":"$status","duration":$duration,"tools":[$tools_used]}
EOF
    
    echo -e "${GREEN}✓${NC} Recorded execution: $agent_type ($status) - ${duration}ms"
}

# 함수: 일일 요약 생성
generate_daily_summary() {
    local date="${1:-$TODAY}"
    local log_dir="$LOGS_DIR/$date"
    local summary_file="$log_dir/summary.json"
    
    if [ ! -d "$log_dir" ]; then
        echo -e "${YELLOW}⚠${NC} No logs found for $date"
        return 1
    fi
    
    echo -e "${BLUE}📊 Generating daily summary for $date...${NC}"
    
    # 실행 통계 계산
    local total_executions=$(grep -c . "$log_dir/executions.jsonl" 2>/dev/null || echo 0)
    local successful=$(grep -c '"status":"success"' "$log_dir/executions.jsonl" 2>/dev/null || echo 0)
    local failed=$(grep -c '"status":"failed"' "$log_dir/executions.jsonl" 2>/dev/null || echo 0)
    
    # 에이전트별 통계
    cat > "$summary_file" << EOF
{
  "date": "$date",
  "summary": {
    "totalExecutions": $total_executions,
    "successful": $successful,
    "failed": $failed,
    "successRate": $(awk "BEGIN {printf \"%.2f\", $successful/$total_executions*100}")
  },
  "agentStats": $(analyze_agent_stats "$log_dir"),
  "toolUsage": $(analyze_tool_usage "$log_dir"),
  "generatedAt": "$NOW"
}
EOF
    
    echo -e "${GREEN}✓${NC} Daily summary generated: $summary_file"
}

# 함수: 에이전트별 통계 분석
analyze_agent_stats() {
    local log_dir="$1"
    local executions_file="$log_dir/executions.jsonl"
    
    if [ ! -f "$executions_file" ]; then
        echo "[]"
        return
    fi
    
    # jq를 사용한 에이전트별 집계
    jq -s '
        group_by(.agent) |
        map({
            agent: .[0].agent,
            count: length,
            avgDuration: (map(.duration) | add / length),
            successRate: ((map(select(.status == "success")) | length) / length * 100)
        })
    ' "$executions_file" 2>/dev/null || echo "[]"
}

# 함수: 도구 사용 분석
analyze_tool_usage() {
    local log_dir="$1"
    local executions_file="$log_dir/executions.jsonl"
    
    if [ ! -f "$executions_file" ]; then
        echo "{}"
        return
    fi
    
    # 도구별 사용 횟수 집계
    jq -s '
        map(.tools[]) |
        group_by(.) |
        map({(.[0]): length}) |
        add
    ' "$executions_file" 2>/dev/null || echo "{}"
}

# 함수: 주간 보고서 생성
generate_weekly_report() {
    local end_date="${1:-$TODAY}"
    local start_date=$(date -d "$end_date -6 days" +%Y-%m-%d)
    local report_file="$METRICS_DIR/weekly-report-$end_date.json"
    
    echo -e "${BLUE}📊 Generating weekly report ($start_date to $end_date)...${NC}"
    
    # 주간 데이터 수집
    local weekly_data="[]"
    for i in {0..6}; do
        local check_date=$(date -d "$end_date -$i days" +%Y-%m-%d)
        local summary_file="$LOGS_DIR/$check_date/summary.json"
        
        if [ -f "$summary_file" ]; then
            weekly_data=$(echo "$weekly_data" | jq ". + [$(cat "$summary_file")]")
        fi
    done
    
    # 주간 보고서 생성
    cat > "$report_file" << EOF
{
  "period": {
    "start": "$start_date",
    "end": "$end_date"
  },
  "summary": $(calculate_weekly_summary "$weekly_data"),
  "dailyBreakdown": $weekly_data,
  "trends": $(analyze_trends "$weekly_data"),
  "recommendations": $(generate_recommendations "$weekly_data"),
  "generatedAt": "$NOW"
}
EOF
    
    echo -e "${GREEN}✓${NC} Weekly report generated: $report_file"
}

# 함수: 주간 요약 계산
calculate_weekly_summary() {
    local data="$1"
    
    echo "$data" | jq '
        {
            totalExecutions: (map(.summary.totalExecutions) | add),
            avgDailyExecutions: (map(.summary.totalExecutions) | add / length),
            overallSuccessRate: (
                (map(.summary.successful) | add) / 
                (map(.summary.totalExecutions) | add) * 100
            ),
            mostActiveAgent: (
                map(.agentStats[]) | 
                group_by(.agent) | 
                map({agent: .[0].agent, total: (map(.count) | add)}) | 
                sort_by(.total) | 
                reverse | 
                .[0]
            )
        }
    '
}

# 함수: 트렌드 분석
analyze_trends() {
    local data="$1"
    
    echo "$data" | jq '
        {
            executionTrend: (
                if (.[0].summary.totalExecutions < .[-1].summary.totalExecutions) 
                then "increasing" 
                else "decreasing" 
                end
            ),
            successRateTrend: (
                if (.[0].summary.successRate < .[-1].summary.successRate) 
                then "improving" 
                else "declining" 
                end
            )
        }
    '
}

# 함수: 추천사항 생성
generate_recommendations() {
    local data="$1"
    
    # 간단한 규칙 기반 추천 (실제로는 더 복잡한 로직 필요)
    echo '[
        "Consider load balancing if certain agents are overutilized",
        "Review failed executions for common patterns",
        "Optimize frequently used agent combinations"
    ]'
}

# 함수: 실시간 모니터링
monitor_realtime() {
    echo -e "${BLUE}🔍 Real-time Agent Monitoring${NC}"
    echo "Press Ctrl+C to stop"
    echo ""
    
    local executions_file="$LOGS_DIR/$TODAY/executions.jsonl"
    
    # tail -f로 실시간 모니터링
    tail -f "$executions_file" 2>/dev/null | while read line; do
        local agent=$(echo "$line" | jq -r '.agent')
        local status=$(echo "$line" | jq -r '.status')
        local duration=$(echo "$line" | jq -r '.duration')
        
        if [ "$status" = "success" ]; then
            echo -e "${GREEN}✓${NC} $agent completed in ${duration}ms"
        else
            echo -e "${RED}✗${NC} $agent failed after ${duration}ms"
        fi
    done
}

# 함수: 성능 벤치마크
benchmark_agents() {
    echo -e "${BLUE}🏁 Agent Performance Benchmark${NC}"
    
    # 최근 7일간의 데이터로 벤치마크
    local benchmark_data="{}"
    
    for agent in "central-supervisor" "code-review-specialist" "test-automation-specialist" \
                 "database-administrator" "ai-systems-engineer" "doc-writer-researcher" \
                 "security-auditor" "ux-performance-optimizer" "debugger-specialist" \
                 "issue-summary" "mcp-server-admin" "gemini-cli-collaborator" \
                 "backend-gcp-specialist"; do
        
        local avg_duration=$(find "$LOGS_DIR" -name "executions.jsonl" -mtime -7 \
            -exec grep "\"agent\":\"$agent\"" {} \; | \
            jq -s 'map(.duration) | add / length' 2>/dev/null || echo 0)
        
        benchmark_data=$(echo "$benchmark_data" | jq ". + {\"$agent\": $avg_duration}")
    done
    
    echo "$benchmark_data" | jq -r '
        to_entries | 
        sort_by(.value) | 
        .[] | 
        "\(.key): \(.value)ms"
    '
}

# 메인 명령어 처리
case "${1:-help}" in
    record)
        record_execution "$2" "$3" "$4" "$5"
        ;;
    
    daily-summary)
        generate_daily_summary "$2"
        ;;
    
    weekly-report)
        generate_weekly_report "$2"
        ;;
    
    monitor)
        monitor_realtime
        ;;
    
    benchmark)
        benchmark_agents
        ;;
    
    analyze)
        echo -e "${BLUE}📊 Agent Performance Analysis${NC}"
        generate_daily_summary
        benchmark_agents
        ;;
    
    help|*)
        cat << EOF
${BLUE}Agent Metrics Collector${NC}

Usage: $0 <command> [options]

Commands:
  record <agent> <status> <duration> <tools>
    Record an agent execution
    
  daily-summary [date]
    Generate daily summary (default: today)
    
  weekly-report [end-date]
    Generate weekly report
    
  monitor
    Real-time monitoring mode
    
  benchmark
    Show agent performance benchmark
    
  analyze
    Full analysis (summary + benchmark)

Examples:
  $0 record "code-review-specialist" "success" 3500 '"Read","Write"'
  $0 daily-summary 2025-07-29
  $0 weekly-report
  $0 monitor

EOF
        ;;
esac