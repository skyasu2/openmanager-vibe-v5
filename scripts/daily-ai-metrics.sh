#!/bin/bash
# Daily AI Metrics Report
# 목적: 일일 AI 도구 사용 현황 자동 집계
# 작성: 2025-10-16
# 사용: ./scripts/daily-ai-metrics.sh
# Cron: 0 23 * * * cd /mnt/d/cursor/openmanager-vibe-v5 && ./scripts/daily-ai-metrics.sh

# set -euo pipefail  # 일시적으로 비활성화하여 디버깅
set -eo pipefail  # pipefail만 제거

# 디버그 모드 (필요 시 활성화)
# set -x

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로그 디렉토리 생성
LOG_DIR="logs/ai-metrics"
mkdir -p "$LOG_DIR"

TODAY=$(date +%Y-%m-%d)
LOG_FILE="$LOG_DIR/$TODAY.log"

# 현재 시간
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo -e "${BLUE}📊 Daily AI Metrics Report${NC}"
echo -e "${BLUE}===========================${NC}"
echo "날짜: $TODAY"
echo "생성 시간: $TIMESTAMP"
echo ""

# 로그 시작
{
  echo "==========================================="
  echo "Daily AI Metrics Report - $TODAY"
  echo "생성 시간: $TIMESTAMP"
  echo "==========================================="
  echo ""
} >> "$LOG_FILE"

# Wrapper 로그 파일 경로
CODEX_LOGS="/tmp/codex-*.txt"
GEMINI_LOGS="/tmp/gemini-*.txt"
QWEN_LOGS="/tmp/qwen-*.txt"

# 오늘 날짜 로그만 필터링 (파일명에 날짜 포함 시)
TODAY_PATTERN=$(date +%Y%m%d)

# ============================================================================
# 함수: AI 도구별 메트릭 추출
# ============================================================================

analyze_ai_logs() {
  local ai_name=$1
  local log_pattern=$2
  local color=$3

  echo -e "${color}📌 $ai_name 사용 현황${NC}"
  # echo "📌 $ai_name 사용 현황" >> "$LOG_FILE"  # 일시적으로 비활성화
  # echo "" >> "$LOG_FILE"  # 일시적으로 비활성화

  # DEBUG
  echo "  [DEBUG] Analyzing $ai_name with pattern: $log_pattern"

  # 로그 파일 개수 (호출 횟수)
  local call_count=0
  local success_count=0
  local timeout_count=0
  local total_time=0
  local total_tokens=0

  # DEBUG
  echo "  [DEBUG] Checking if files exist with pattern: $log_pattern"

  # 로그 파일이 존재하는지 확인
  if compgen -G "$log_pattern" > /dev/null 2>&1; then
    echo "  [DEBUG] Files found, processing..."
    # 오늘 날짜 로그만 처리
    for log_file in $log_pattern; do
      echo "  [DEBUG] Processing file: $log_file"
      # 파일명에서 날짜 추출 (예: codex-20251016_HHMMSS.txt)
      if [[ $log_file =~ $TODAY_PATTERN ]]; then
        echo "  [DEBUG] File matches today's date"
        ((call_count++))

        # 성공/타임아웃 판단
        echo "  [DEBUG] Checking timeout status..."
        if grep -q "타임아웃" "$log_file" 2>/dev/null || grep -q "timeout" "$log_file" 2>/dev/null; then
          ((timeout_count++))
          echo "  [DEBUG] Timeout detected"
        elif grep -q "성공\|✅\|completed" "$log_file" 2>/dev/null; then
          ((success_count++))
          echo "  [DEBUG] Success detected"
        fi
        echo "  [DEBUG] Status check done"

        # 응답 시간 추출 (예: "13초", "70초")
        if grep -qE "[0-9]+초" "$log_file"; then
          time_val=$(grep -oE "[0-9]+초" "$log_file" | head -1 | grep -oE "[0-9]+")
          total_time=$((total_time + time_val))
        fi

        # 토큰 추출 (예: "4,056 토큰", "4056 tokens")
        if grep -qE "[0-9,]+ 토큰|[0-9,]+ tokens" "$log_file"; then
          token_val=$(grep -oE "[0-9,]+ 토큰|[0-9,]+ tokens" "$log_file" | head -1 | grep -oE "[0-9,]+" | tr -d ',')
          total_tokens=$((total_tokens + token_val))
        fi
      fi
    done
  fi

  # DEBUG
  echo "  [DEBUG] call_count=$call_count, success_count=$success_count, timeout_count=$timeout_count"
  echo "  [DEBUG] total_time=$total_time, total_tokens=$total_tokens"

  # 통계 계산
  local avg_time=0
  if [ $call_count -gt 0 ] && [ $total_time -gt 0 ]; then
    avg_time=$((total_time / call_count))
  fi

  local success_rate=0
  if [ $call_count -gt 0 ]; then
    echo "  [DEBUG] Calculating success_rate..."
    success_rate=$(awk "BEGIN {printf \"%.1f\", ($success_count / $call_count) * 100}")
    echo "  [DEBUG] success_rate=$success_rate"
  fi

  # 결과 출력
  if [ $call_count -eq 0 ]; then
    echo -e "  ${YELLOW}호출 없음${NC}"
    echo "  호출 없음" >> "$LOG_FILE"
  else
    echo -e "  호출 횟수: ${GREEN}$call_count${NC}회"
    echo -e "  성공: ${GREEN}$success_count${NC}회 / 타임아웃: ${RED}$timeout_count${NC}회 / 성공률: ${GREEN}$success_rate%${NC}"
    echo -e "  평균 응답 시간: ${CYAN}$avg_time${NC}초"
    echo -e "  총 토큰 사용: ${CYAN}$total_tokens${NC} 토큰"

    echo "  호출 횟수: $call_count회" >> "$LOG_FILE"
    echo "  성공: $success_count회 / 타임아웃: $timeout_count회 / 성공률: $success_rate%" >> "$LOG_FILE"
    echo "  평균 응답 시간: $avg_time초" >> "$LOG_FILE"
    echo "  총 토큰 사용: $total_tokens 토큰" >> "$LOG_FILE"
  fi

  echo ""
  echo "" >> "$LOG_FILE"

  # 전역 변수에 저장 (전체 통계용)
  TOTAL_CALLS=$((TOTAL_CALLS + call_count))
  TOTAL_SUCCESS=$((TOTAL_SUCCESS + success_count))
  TOTAL_TIMEOUT=$((TOTAL_TIMEOUT + timeout_count))
  TOTAL_TIME_ALL=$((TOTAL_TIME_ALL + total_time))
  TOTAL_TOKENS_ALL=$((TOTAL_TOKENS_ALL + total_tokens))
}

# 전역 변수 초기화
TOTAL_CALLS=0
TOTAL_SUCCESS=0
TOTAL_TIMEOUT=0
TOTAL_TIME_ALL=0
TOTAL_TOKENS_ALL=0

# ============================================================================
# AI 도구별 분석 실행
# ============================================================================

analyze_ai_logs "Codex" "$CODEX_LOGS" "$RED"
analyze_ai_logs "Gemini" "$GEMINI_LOGS" "$CYAN"
analyze_ai_logs "Qwen" "$QWEN_LOGS" "$GREEN"

# ============================================================================
# 전체 통계
# ============================================================================

echo -e "${BLUE}📈 전체 요약${NC}"
echo "📈 전체 요약" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

if [ $TOTAL_CALLS -eq 0 ]; then
  echo -e "${YELLOW}오늘 AI 도구 사용 없음${NC}"
  echo "오늘 AI 도구 사용 없음" >> "$LOG_FILE"
else
  OVERALL_SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($TOTAL_SUCCESS / $TOTAL_CALLS) * 100}")
  AVG_TIME_ALL=0
  if [ $TOTAL_TIME_ALL -gt 0 ]; then
    AVG_TIME_ALL=$((TOTAL_TIME_ALL / TOTAL_CALLS))
  fi

  echo -e "  총 호출 횟수: ${GREEN}$TOTAL_CALLS${NC}회"
  echo -e "  총 성공: ${GREEN}$TOTAL_SUCCESS${NC}회 / 총 타임아웃: ${RED}$TOTAL_TIMEOUT${NC}회"
  echo -e "  전체 성공률: ${GREEN}$OVERALL_SUCCESS_RATE%${NC}"
  echo -e "  평균 응답 시간: ${CYAN}$AVG_TIME_ALL${NC}초"
  echo -e "  총 토큰 사용: ${CYAN}$TOTAL_TOKENS_ALL${NC} 토큰"

  echo "  총 호출 횟수: $TOTAL_CALLS회" >> "$LOG_FILE"
  echo "  총 성공: $TOTAL_SUCCESS회 / 총 타임아웃: $TOTAL_TIMEOUT회" >> "$LOG_FILE"
  echo "  전체 성공률: $OVERALL_SUCCESS_RATE%" >> "$LOG_FILE"
  echo "  평균 응답 시간: $AVG_TIME_ALL초" >> "$LOG_FILE"
  echo "  총 토큰 사용: $TOTAL_TOKENS_ALL 토큰" >> "$LOG_FILE"

  echo ""
  echo "" >> "$LOG_FILE"

  # 목표 대비 평가
  echo -e "${BLUE}🎯 목표 대비 평가${NC}"
  echo "🎯 목표 대비 평가" >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"

  # 3-AI 성공률 목표: 100%
  if (( $(echo "$OVERALL_SUCCESS_RATE >= 100" | bc -l) )); then
    echo -e "  3-AI 성공률: ${GREEN}✅ 목표 달성 ($OVERALL_SUCCESS_RATE%)${NC}"
    echo "  3-AI 성공률: ✅ 목표 달성 ($OVERALL_SUCCESS_RATE%)" >> "$LOG_FILE"
  elif (( $(echo "$OVERALL_SUCCESS_RATE >= 90" | bc -l) )); then
    echo -e "  3-AI 성공률: ${YELLOW}⚠️  목표 근접 ($OVERALL_SUCCESS_RATE%, 목표 100%)${NC}"
    echo "  3-AI 성공률: ⚠️  목표 근접 ($OVERALL_SUCCESS_RATE%, 목표 100%)" >> "$LOG_FILE"
  else
    echo -e "  3-AI 성공률: ${RED}❌ 목표 미달 ($OVERALL_SUCCESS_RATE%, 목표 100%)${NC}"
    echo "  3-AI 성공률: ❌ 목표 미달 ($OVERALL_SUCCESS_RATE%, 목표 100%)" >> "$LOG_FILE"
  fi

  # 평균 응답 시간 평가 (Codex 13초, Gemini 70초, Qwen 102초 기준)
  if [ $AVG_TIME_ALL -le 60 ]; then
    echo -e "  평균 응답 시간: ${GREEN}✅ 우수 (${AVG_TIME_ALL}초)${NC}"
    echo "  평균 응답 시간: ✅ 우수 (${AVG_TIME_ALL}초)" >> "$LOG_FILE"
  elif [ $AVG_TIME_ALL -le 120 ]; then
    echo -e "  평균 응답 시간: ${YELLOW}⚠️  양호 (${AVG_TIME_ALL}초)${NC}"
    echo "  평균 응답 시간: ⚠️  양호 (${AVG_TIME_ALL}초)" >> "$LOG_FILE"
  else
    echo -e "  평균 응답 시간: ${RED}❌ 느림 (${AVG_TIME_ALL}초, 쿼리 최적화 필요)${NC}"
    echo "  평균 응답 시간: ❌ 느림 (${AVG_TIME_ALL}초, 쿼리 최적화 필요)" >> "$LOG_FILE"
  fi

  echo ""
  echo "" >> "$LOG_FILE"
fi

# ============================================================================
# 권장 사항
# ============================================================================

if [ $TOTAL_TIMEOUT -gt 0 ]; then
  echo -e "${YELLOW}💡 권장 사항${NC}"
  echo "💡 권장 사항" >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"
  echo -e "  ${YELLOW}⚠️  타임아웃 발생 ($TOTAL_TIMEOUT회)${NC}"
  echo -e "  ${YELLOW}→ docs/ai/3-ai-query-optimization-guide.md 참조${NC}"
  echo -e "  ${YELLOW}→ 쿼리 50% 축소 또는 Executive Summary 방식 사용${NC}"
  echo "  ⚠️  타임아웃 발생 ($TOTAL_TIMEOUT회)" >> "$LOG_FILE"
  echo "  → docs/ai/3-ai-query-optimization-guide.md 참조" >> "$LOG_FILE"
  echo "  → 쿼리 50% 축소 또는 Executive Summary 방식 사용" >> "$LOG_FILE"
  echo ""
  echo "" >> "$LOG_FILE"
fi

# ============================================================================
# 로그 위치 안내
# ============================================================================

echo -e "${BLUE}📁 로그 저장 위치:${NC} $LOG_FILE"
echo "📁 로그 저장 위치: $LOG_FILE" >> "$LOG_FILE"
echo ""
echo "" >> "$LOG_FILE"

# ============================================================================
# 종료 메시지
# ============================================================================

END_TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "생성 완료: $END_TIMESTAMP"
echo "생성 완료: $END_TIMESTAMP" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# ============================================================================
# 주간/월간 요약 (옵션)
# ============================================================================

# 7일치 로그 요약 (선택적)
WEEK_AGO=$(date -d '7 days ago' +%Y-%m-%d 2>/dev/null || date -v-7d +%Y-%m-%d 2>/dev/null || echo "")

if [ -n "$WEEK_AGO" ] && [ -f "$LOG_DIR/$WEEK_AGO.log" ]; then
  echo -e "${CYAN}📅 주간 추세 (최근 7일)${NC}"
  echo ""
  echo "지난 주 로그가 존재합니다. 주간 리포트를 보려면:"
  echo "  cat $LOG_DIR/*.log | grep '전체 성공률'"
  echo ""
fi

exit 0
