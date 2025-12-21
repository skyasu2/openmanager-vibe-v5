#!/bin/bash

# 성능 로그 분석 스크립트
# 버전: 1.0.0
# 날짜: 2025-11-08
# 목적: AI wrapper 성능 로그 분석 및 리포트 생성

set -euo pipefail

# 프로젝트 루트 자동 결정 (포터블)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로그 디렉토리
LOG_DIR="${PROJECT_ROOT}/logs/ai-perf"
REPORT_DIR="${PROJECT_ROOT}/logs/ai-reports"
mkdir -p "$REPORT_DIR"

# 리포트 파일 경로
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
REPORT_FILE="$REPORT_DIR/perf-report-${TIMESTAMP}.md"

# 도움말
usage() {
    cat << EOF
${CYAN}📊 AI Performance Log Analyzer v1.0.0${NC}

성능 로그 분석 및 리포트 생성 도구

사용법:
  $0 [옵션]

옵션:
  -p, --period <days>    분석 기간 (기본: 7일)
  -w, --wrapper <name>   특정 wrapper만 분석 (codex/gemini/qwen)
  -f, --format <format>  출력 형식 (markdown/json, 기본: markdown)
  -o, --output <file>    출력 파일 경로 (기본: auto)
  -h, --help             도움말 표시

예시:
  $0                              # 최근 7일 전체 분석
  $0 -p 30                        # 최근 30일 전체 분석
  $0 -w codex -p 7                # Codex만 7일간 분석
  $0 -f json -o report.json       # JSON 형식으로 출력

출력:
  $REPORT_DIR/perf-report-<timestamp>.md
EOF
    exit 1
}

# 로그 함수
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 기본 설정
PERIOD_DAYS=7
WRAPPER_FILTER=""
OUTPUT_FORMAT="markdown"
OUTPUT_FILE="$REPORT_FILE"

# 파라미터 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--period)
            PERIOD_DAYS="$2"
            shift 2
            ;;
        -w|--wrapper)
            WRAPPER_FILTER="$2"
            shift 2
            ;;
        -f|--format)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage
            ;;
    esac
done

# 로그 파일 찾기 (기간 필터링)
find_logs() {
    local wrapper="$1"
    local cutoff_date=$(date -d "$PERIOD_DAYS days ago" +%Y-%m-%d)
    
    find "$LOG_DIR" -name "${wrapper}-perf-*.log" -type f | while read -r logfile; do
        local log_date=$(basename "$logfile" | sed -E "s/${wrapper}-perf-([0-9-]+)\\.log/\\1/")
        if [[ "$log_date" > "$cutoff_date" || "$log_date" == "$cutoff_date" ]]; then
            echo "$logfile"
        fi
    done | sort
}

# 통계 계산
calculate_stats() {
    local wrapper="$1"
    local logfiles="$2"
    
    if [[ -z "$logfiles" ]]; then
        echo "0|0|0|0|0"
        return
    fi
    
    local total_runs=0
    local total_duration=0
    local timeout_count=0
    local success_count=0
    local error_count=0
    
    while IFS= read -r logfile; do
        # 성공 횟수
        local successes=$(grep -c "SUCCESS: .*실행 성공" "$logfile" 2>/dev/null || echo "0")
        success_count=$((success_count + successes))
        
        # 타임아웃 횟수
        local timeouts=$(grep -c "ERROR:.*타임아웃" "$logfile" 2>/dev/null || echo "0")
        timeout_count=$((timeout_count + timeouts))
        
        # 에러 횟수 (타임아웃 제외)
        local errors=$(grep -c "ERROR:" "$logfile" 2>/dev/null || echo "0")
        error_count=$((error_count + errors - timeouts))
        
        # 실행 시간 추출
        local durations=$(grep "DURATION:" "$logfile" 2>/dev/null | sed -E 's/.*DURATION: ([0-9]+)s/\1/' || echo "")
        if [[ -n "$durations" ]]; then
            while IFS= read -r duration; do
                total_duration=$((total_duration + duration))
                total_runs=$((total_runs + 1))
            done <<< "$durations"
        fi
    done <<< "$logfiles"
    
    local avg_duration=0
    if [[ $total_runs -gt 0 ]]; then
        avg_duration=$((total_duration / total_runs))
    fi
    
    echo "$total_runs|$avg_duration|$timeout_count|$success_count|$error_count"
}

# Markdown 리포트 생성
generate_markdown_report() {
    cat > "$OUTPUT_FILE" << 'EOF'
# AI Performance Analysis Report

**생성 시간**: 
EOF
    echo "$(date '+%Y-%m-%d %H:%M:%S')" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "**분석 기간**: 최근 ${PERIOD_DAYS}일" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    # 전체 통계
    echo "## 📊 전체 통계" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "| Wrapper | 실행 횟수 | 평균 시간 | 타임아웃 | 성공률 | 에러율 |" >> "$OUTPUT_FILE"
    echo "|---------|-----------|-----------|----------|--------|--------|" >> "$OUTPUT_FILE"
    
    for wrapper in codex gemini qwen; do
        # Wrapper 필터링
        if [[ -n "$WRAPPER_FILTER" && "$WRAPPER_FILTER" != "$wrapper" ]]; then
            continue
        fi
        
        local logfiles=$(find_logs "$wrapper")
        local stats=$(calculate_stats "$wrapper" "$logfiles")
        
        IFS='|' read -r total_runs avg_duration timeout_count success_count error_count <<< "$stats"
        
        local success_rate=0
        local error_rate=0
        if [[ $total_runs -gt 0 ]]; then
            success_rate=$(awk "BEGIN {printf \"%.1f\", ($success_count / $total_runs) * 100}")
            error_rate=$(awk "BEGIN {printf \"%.1f\", ($error_count / $total_runs) * 100}")
        fi
        
        echo "| $wrapper | $total_runs | ${avg_duration}s | $timeout_count | ${success_rate}% | ${error_rate}% |" >> "$OUTPUT_FILE"
    done
    
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    # 상세 분석
    for wrapper in codex gemini qwen; do
        if [[ -n "$WRAPPER_FILTER" && "$WRAPPER_FILTER" != "$wrapper" ]]; then
            continue
        fi
        
        echo "## 🔍 ${wrapper^} 상세 분석" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        
        local logfiles=$(find_logs "$wrapper")
        
        if [[ -z "$logfiles" ]]; then
            echo "⚠️  분석 기간 내 로그 파일 없음" >> "$OUTPUT_FILE"
            echo "" >> "$OUTPUT_FILE"
            continue
        fi
        
        local stats=$(calculate_stats "$wrapper" "$logfiles")
        IFS='|' read -r total_runs avg_duration timeout_count success_count error_count <<< "$stats"
        
        echo "**실행 통계**:" >> "$OUTPUT_FILE"
        echo "- 총 실행 횟수: $total_runs" >> "$OUTPUT_FILE"
        echo "- 평균 실행 시간: ${avg_duration}초" >> "$OUTPUT_FILE"
        echo "- 성공: $success_count" >> "$OUTPUT_FILE"
        echo "- 타임아웃: $timeout_count" >> "$OUTPUT_FILE"
        echo "- 에러: $error_count" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        
        # 최근 5개 로그 파일 상세
        echo "**최근 로그 파일**:" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        
        local recent_logs=$(echo "$logfiles" | tail -5)
        while IFS= read -r logfile; do
            local log_date=$(basename "$logfile" | sed -E "s/${wrapper}-perf-([0-9-]+)\\.log/\\1/")
            local log_stats=$(calculate_stats "$wrapper" "$logfile")
            IFS='|' read -r runs duration timeouts successes errors <<< "$log_stats"
            
            echo "- **${log_date}**: ${runs}회 실행, 평균 ${duration}초" >> "$OUTPUT_FILE"
        done <<< "$recent_logs"
        
        echo "" >> "$OUTPUT_FILE"
    done
    
    # 권장 사항
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "## 💡 권장 사항" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    for wrapper in codex gemini qwen; do
        if [[ -n "$WRAPPER_FILTER" && "$WRAPPER_FILTER" != "$wrapper" ]]; then
            continue
        fi
        
        local logfiles=$(find_logs "$wrapper")
        local stats=$(calculate_stats "$wrapper" "$logfiles")
        IFS='|' read -r total_runs avg_duration timeout_count success_count error_count <<< "$stats"
        
        if [[ $timeout_count -gt 0 ]]; then
            echo "- ⚠️  **${wrapper^}**: ${timeout_count}건 타임아웃 발생 → 타임아웃 값 증가 또는 쿼리 분할 고려" >> "$OUTPUT_FILE"
        fi
        
        if [[ $total_runs -eq 0 ]]; then
            echo "- 📝 **${wrapper^}**: 사용 기록 없음 → 활용도 점검 필요" >> "$OUTPUT_FILE"
        fi
        
        if [[ $avg_duration -gt 300 && $wrapper != "gemini" ]]; then
            echo "- ⏱️  **${wrapper^}**: 평균 실행 시간 ${avg_duration}초 → 쿼리 최적화 고려" >> "$OUTPUT_FILE"
        fi
    done
    
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "*Report generated by analyze-perf-logs.sh v1.0.0*" >> "$OUTPUT_FILE"
}

# JSON 리포트 생성
generate_json_report() {
    cat > "$OUTPUT_FILE" << 'EOF'
{
  "metadata": {
    "generated_at": "
EOF
    echo -n "$(date -Iseconds)" >> "$OUTPUT_FILE"
    cat >> "$OUTPUT_FILE" << EOF
",
    "period_days": $PERIOD_DAYS,
    "wrapper_filter": "$WRAPPER_FILTER"
  },
  "statistics": {
EOF
    
    local first=true
    for wrapper in codex gemini qwen; do
        if [[ -n "$WRAPPER_FILTER" && "$WRAPPER_FILTER" != "$wrapper" ]]; then
            continue
        fi
        
        if [[ "$first" == false ]]; then
            echo "," >> "$OUTPUT_FILE"
        fi
        first=false
        
        local logfiles=$(find_logs "$wrapper")
        local stats=$(calculate_stats "$wrapper" "$logfiles")
        IFS='|' read -r total_runs avg_duration timeout_count success_count error_count <<< "$stats"
        
        local success_rate=0
        local error_rate=0
        if [[ $total_runs -gt 0 ]]; then
            success_rate=$(awk "BEGIN {printf \"%.1f\", ($success_count / $total_runs) * 100}")
            error_rate=$(awk "BEGIN {printf \"%.1f\", ($error_count / $total_runs) * 100}")
        fi
        
        cat >> "$OUTPUT_FILE" << EOF
    "$wrapper": {
      "total_runs": $total_runs,
      "avg_duration_seconds": $avg_duration,
      "timeout_count": $timeout_count,
      "success_count": $success_count,
      "error_count": $error_count,
      "success_rate_percent": $success_rate,
      "error_rate_percent": $error_rate
    }
EOF
    done
    
    cat >> "$OUTPUT_FILE" << 'EOF'
  }
}
EOF
}

# 메인 실행
main() {
    log_info "📊 성능 로그 분석 시작 (기간: ${PERIOD_DAYS}일)"
    
    if [[ ! -d "$LOG_DIR" ]]; then
        log_error "로그 디렉토리 없음: $LOG_DIR"
        exit 1
    fi
    
    # 리포트 생성
    if [[ "$OUTPUT_FORMAT" == "markdown" ]]; then
        generate_markdown_report
        log_success "Markdown 리포트 생성: $OUTPUT_FILE"
    elif [[ "$OUTPUT_FORMAT" == "json" ]]; then
        generate_json_report
        log_success "JSON 리포트 생성: $OUTPUT_FILE"
    else
        log_error "지원하지 않는 형식: $OUTPUT_FORMAT"
        exit 1
    fi
    
    # 요약 출력
    echo ""
    log_info "📋 요약"
    
    for wrapper in codex gemini qwen; do
        if [[ -n "$WRAPPER_FILTER" && "$WRAPPER_FILTER" != "$wrapper" ]]; then
            continue
        fi
        
        local logfiles=$(find_logs "$wrapper")
        local log_count=$(echo "$logfiles" | grep -c "." || echo "0")
        local stats=$(calculate_stats "$wrapper" "$logfiles")
        IFS='|' read -r total_runs avg_duration timeout_count success_count error_count <<< "$stats"
        
        echo -e "${CYAN}${wrapper^}${NC}: ${total_runs}회 실행, 평균 ${avg_duration}초, ${log_count}개 로그 파일"
    done
    
    echo ""
    log_success "✅ 분석 완료"
}

# 실행
main
