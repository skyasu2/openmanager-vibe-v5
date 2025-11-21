#!/bin/bash
# 서브에이전트 사용량 분석 스크립트
# 작성일: 2025-11-15
# 목적: 12개 서브에이전트의 월간 사용량 추적 및 ROI 분석

set -euo pipefail

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 현재 월 계산
CURRENT_MONTH=$(date +%Y-%m)
CURRENT_YEAR_MONTH=$(date +%Y-%m)

# Decision Logs 디렉토리
LOGS_DIR="logs/ai-decisions"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 서브에이전트 사용량 분석 (${CURRENT_MONTH})${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 서브에이전트 목록 (12개)
AGENTS=(
  "multi-ai-verification"
  "code-review"
  "debugger"
  "security"
  "test-automation"
  "vercel-platform"
  "database-administrator"
  "dev-environment"
  "documentation-manager"
  "structure-refactor"
  "ui-ux"
  "gcp-cloud-functions"
)

# 전체 통계 변수
TOTAL_CALLS=0
TOTAL_LOGS=0
HIGH_USAGE=0    # 5회 이상
MEDIUM_USAGE=0  # 2-4회
LOW_USAGE=0     # 1회
NO_USAGE=0      # 0회

echo -e "${GREEN}## 개별 에이전트 사용량${NC}"
echo ""

# 결과를 저장할 배열
declare -A AGENT_COUNTS

for agent in "${AGENTS[@]}"; do
  # Task 호출 패턴 검색
  count=$(grep -r "Task ${agent}-specialist" "${LOGS_DIR}" 2>/dev/null | wc -l || echo "0")
  
  # 통계 업데이트
  AGENT_COUNTS[$agent]=$count
  TOTAL_CALLS=$((TOTAL_CALLS + count))
  
  # Decision Log 포함 여부 확인
  logs_count=$(grep -l "${agent}" "${LOGS_DIR}"/*.md 2>/dev/null | wc -l || echo "0")
  TOTAL_LOGS=$((TOTAL_LOGS + logs_count))
  
  # 활용도 분류
  if [ "$count" -ge 5 ]; then
    HIGH_USAGE=$((HIGH_USAGE + 1))
    status="${GREEN}⭐⭐⭐⭐⭐ 고활용${NC}"
  elif [ "$count" -ge 2 ]; then
    MEDIUM_USAGE=$((MEDIUM_USAGE + 1))
    status="${YELLOW}⭐⭐⭐⭐ 중활용${NC}"
  elif [ "$count" -eq 1 ]; then
    LOW_USAGE=$((LOW_USAGE + 1))
    status="${YELLOW}⭐⭐⭐ 저활용${NC}"
  else
    NO_USAGE=$((NO_USAGE + 1))
    status="${RED}⚠️  미사용${NC}"
  fi
  
  echo -e "- ${agent}: ${count}회 (Decision Logs: ${logs_count}개) - ${status}"
done

echo ""
echo -e "${GREEN}## 활용도 순위 (Top 5)${NC}"
echo ""

# 활용도 순위 계산
for agent in "${!AGENT_COUNTS[@]}"; do
  echo "${AGENT_COUNTS[$agent]} ${agent}"
done | sort -rn | head -5 | while read count agent; do
  echo -e "  ${count}회 - ${agent}-specialist"
done

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📈 종합 통계 (${CURRENT_MONTH})${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "  총 서브에이전트 수: ${GREEN}12개${NC}"
echo -e "  총 호출 횟수: ${GREEN}${TOTAL_CALLS}회${NC}"
echo -e "  Decision Logs 언급: ${GREEN}${TOTAL_LOGS}개${NC}"
echo ""

echo -e "${GREEN}## 활용도 분류${NC}"
echo ""
echo -e "  고활용 (5회 이상): ${GREEN}${HIGH_USAGE}개${NC}"
echo -e "  중활용 (2-4회): ${YELLOW}${MEDIUM_USAGE}개${NC}"
echo -e "  저활용 (1회): ${YELLOW}${LOW_USAGE}개${NC}"
echo -e "  미사용 (0회): ${RED}${NO_USAGE}개 ⚠️${NC}"
echo ""

# ROI 평가
if [ "$TOTAL_CALLS" -eq 0 ]; then
  ROI_STATUS="${RED}측정 불가 (사용 기록 없음)${NC}"
elif [ "$TOTAL_CALLS" -ge 15 ]; then
  ROI_STATUS="${GREEN}우수 (목표 달성)${NC}"
elif [ "$TOTAL_CALLS" -ge 10 ]; then
  ROI_STATUS="${YELLOW}양호 (목표 근접)${NC}"
else
  ROI_STATUS="${RED}개선 필요 (목표 미달)${NC}"
fi

echo -e "${GREEN}## ROI 평가${NC}"
echo ""
echo -e "  현재 상태: ${ROI_STATUS}"
echo -e "  목표: ${GREEN}월 10-15건${NC}"
echo -e "  달성률: ${GREEN}$(( TOTAL_CALLS * 100 / 15 ))%${NC}"
echo ""

# 개선 권장사항
if [ "$NO_USAGE" -gt 0 ]; then
  echo -e "${YELLOW}## 💡 개선 권장사항${NC}"
  echo ""
  echo -e "  미사용 ${NO_USAGE}개 에이전트 활용 시나리오 검토 필요:"
  echo ""
  for agent in "${!AGENT_COUNTS[@]}"; do
    if [ "${AGENT_COUNTS[$agent]}" -eq 0 ]; then
      case "$agent" in
        "debugger")
          echo -e "    - ${agent}: 버그 근본 원인 분석 시 활용"
          ;;
        "vercel-platform")
          echo -e "    - ${agent}: 배포 최적화, 환경변수 관리 시 활용"
          ;;
        "database-administrator")
          echo -e "    - ${agent}: Supabase RLS, 쿼리 최적화 시 활용"
          ;;
        "test-automation")
          echo -e "    - ${agent}: 테스트 실패 진단, E2E 자동화 시 활용"
          ;;
        *)
          echo -e "    - ${agent}: 전문 분야 작업 시 활용 권장"
          ;;
      esac
    fi
  done
  echo ""
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📅 월간 트렌드 비교${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 이전 월 비교 (10월 vs 11월)
OCT_LOGS=$(find "${LOGS_DIR}" -name "2025-10-*.md" 2>/dev/null | wc -l || echo "0")
NOV_LOGS=$(find "${LOGS_DIR}" -name "2025-11-*.md" 2>/dev/null | wc -l || echo "0")

echo -e "  2025-10: ${OCT_LOGS}개 Decision Logs (월간)"
echo -e "  2025-11: ${NOV_LOGS}개 Decision Logs (현재까지)"
echo ""

# 일평균 계산
OCT_DAILY=$(echo "scale=1; $OCT_LOGS / 31" | bc)
NOV_DAYS=$(date +%d)
NOV_DAILY=$(echo "scale=1; $NOV_LOGS / $NOV_DAYS" | bc)

echo -e "  일평균 (10월): ${OCT_DAILY}개/일"
echo -e "  일평균 (11월): ${NOV_DAILY}개/일"
echo ""

# 변화율 계산
if [ "$OCT_DAILY" != "0" ]; then
  CHANGE=$(echo "scale=1; ($NOV_DAILY - $OCT_DAILY) / $OCT_DAILY * 100" | bc)
  if (( $(echo "$CHANGE > 0" | bc -l) )); then
    echo -e "  변화: ${GREEN}+${CHANGE}% 증가 ✅${NC}"
  else
    echo -e "  변화: ${RED}${CHANGE}% 감소${NC}"
  fi
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 분석 완료!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
