#!/bin/bash

# AI 교차검증 성과 보고서 자동 생성 스크립트

LOG_DIR=".claude/logs"
STATS_FILE=".claude/ai-stats.json"
REPORT_DIR=".claude/reports"
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')

# 보고서 디렉토리 생성
mkdir -p "$REPORT_DIR"

# 통계 계산 함수
calculate_stats() {
    local ai_name="$1"
    local log_file="$LOG_DIR/ai-performance.log"
    
    if [ ! -f "$log_file" ]; then
        echo "0,0,0,0"
        return
    fi
    
    local total_requests=$(grep "AI:$ai_name" "$log_file" | wc -l)
    local successful_requests=$(grep "AI:$ai_name.*Success:true" "$log_file" | wc -l)
    local avg_duration=0
    local avg_score=0
    
    if [ $total_requests -gt 0 ]; then
        # 평균 실행 시간 계산
        local total_duration=$(grep "AI:$ai_name.*Success:true" "$log_file" | sed -E 's/.*Duration:([0-9]+)s.*/\1/' | awk '{sum+=$1} END {print sum}')
        if [ $successful_requests -gt 0 ]; then
            avg_duration=$((total_duration / successful_requests))
        fi
        
        # 평균 점수 계산
        local total_score=$(grep "AI:$ai_name.*Success:true" "$log_file" | sed -E 's/.*Score:([0-9.]+).*/\1/' | awk '{sum+=$1} END {print sum}')
        if [ $successful_requests -gt 0 ]; then
            avg_score=$(echo "scale=1; $total_score / $successful_requests" | bc 2>/dev/null || echo "0")
        fi
    fi
    
    echo "$total_requests,$successful_requests,$avg_duration,$avg_score"
}

# 성과 보고서 생성
generate_performance_report() {
    local report_file="$REPORT_DIR/ai-performance-report-$TIMESTAMP.md"
    
    cat > "$report_file" << EOF
# 🤖 AI 교차검증 성과 보고서

**생성 시간**: $(date '+%Y-%m-%d %H:%M:%S')
**보고 기간**: 최근 30일
**보고서 ID**: $TIMESTAMP

## 📊 AI별 성과 통계

| AI | 총 요청 | 성공 요청 | 성공률 | 평균 응답시간 | 평균 점수 |
|----|---------|-----------|---------|--------------|-----------｜
EOF

    # 각 AI별 통계 추가
    for ai in claude codex gemini qwen; do
        local stats=($(calculate_stats "$ai"))
        local total=${stats[0]}
        local successful=${stats[1]}  
        local avg_duration=${stats[2]}
        local avg_score=${stats[3]}
        
        local success_rate=0
        if [ $total -gt 0 ]; then
            success_rate=$((successful * 100 / total))
        fi
        
        echo "| $ai | $total | $successful | ${success_rate}% | ${avg_duration}초 | ${avg_score}/10 |" >> "$report_file"
    done
    
    cat >> "$report_file" << EOF

## 🎯 최근 검증 결과 (최근 10건)

$(tail -10 "$LOG_DIR/verification-progress.log" 2>/dev/null | while read line; do
    echo "- \`$line\`"
done)

## ⚠️ 사용량 경고 현황

$(tail -5 "$LOG_DIR/usage-warnings.log" 2>/dev/null | while read line; do
    echo "- 🚨 \`$line\`"
done)

## 📈 의사결정 히스토리 (최근 5건)

$(tail -5 ".claude/verification-decisions.log" 2>/dev/null | while read line; do
    echo "- \`$line\`"
done)

## 💡 개선 권장사항

### 성능 최적화
- 평균 응답시간이 60초 이상인 AI: $(grep -E "Duration:[6-9][0-9]s|Duration:[1-9][0-9][0-9]s" "$LOG_DIR/ai-performance.log" 2>/dev/null | cut -d'|' -f3 | cut -d':' -f2 | sort -u | tr '\n' ' ')
- 성공률이 90% 미만인 AI: 별도 분석 필요

### 사용량 관리  
- Gemini 일일 사용량: $(tail -1 "$LOG_DIR/usage-monitoring.log" 2>/dev/null | grep "gemini" | sed -E 's/.*Usage:([0-9]+)\/([0-9]+).*/\1\/\2/' || echo "0/1000")
- Qwen 일일 사용량: $(tail -1 "$LOG_DIR/usage-monitoring.log" 2>/dev/null | grep "qwen" | sed -E 's/.*Usage:([0-9]+)\/([0-9]+).*/\1\/\2/' || echo "0/2000")

---

*이 보고서는 자동 생성되었습니다. 상세한 로그는 \`.claude/logs/\` 디렉토리를 참조하세요.*
EOF

    echo "📊 성과 보고서 생성 완료: $report_file"
}

# JSON 통계 기반 대시보드 생성
generate_stats_dashboard() {
    local dashboard_file="$REPORT_DIR/ai-stats-dashboard-$TIMESTAMP.json"
    
    if [ -f "$STATS_FILE" ]; then
        # JSON 통계 파일을 대시보드용으로 복사 및 메타데이터 추가
        python3 -c "
import json
from datetime import datetime

# 기존 통계 읽기
with open('$STATS_FILE', 'r') as f:
    stats = json.load(f)

# 대시보드 메타데이터 추가
dashboard = {
    'generated_at': '$(date -Iseconds)',
    'report_id': '$TIMESTAMP',
    'summary': {
        'total_ais': len(stats),
        'active_ais': len([ai for ai, data in stats.items() if data.get('total_requests', 0) > 0]),
        'total_verifications': sum(data.get('total_requests', 0) for data in stats.values()),
        'overall_success_rate': round(
            sum(data.get('successful_requests', 0) for data in stats.values()) * 100 / 
            max(sum(data.get('total_requests', 0) for data in stats.values()), 1), 2
        )
    },
    'ai_stats': stats
}

with open('$dashboard_file', 'w') as f:
    json.dump(dashboard, f, indent=2)
"
        echo "📈 통계 대시보드 생성 완료: $dashboard_file"
    else
        echo "⚠️ 통계 파일이 없어 대시보드를 생성할 수 없습니다: $STATS_FILE"
    fi
}

# 메인 실행
echo "🚀 AI 교차검증 보고서 생성 시작..."

# 로그 디렉토리 확인
if [ ! -d "$LOG_DIR" ]; then
    echo "⚠️ 로그 디렉토리가 없습니다. 빈 보고서를 생성합니다."
    mkdir -p "$LOG_DIR"
fi

# 보고서 생성
generate_performance_report
generate_stats_dashboard

echo "✅ 모든 보고서 생성 완료!"
echo "📁 보고서 위치: $REPORT_DIR/"
ls -la "$REPORT_DIR/"*$TIMESTAMP* 2>/dev/null || echo "   (생성된 보고서 없음)"