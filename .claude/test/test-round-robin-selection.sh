#!/bin/bash

# 🧪 라운드 로빈 AI 선택 테스트 스크립트
#
# 용도: Level 1 검증 시 AI가 균등하게 분배되는지 확인
# 실행: ./test-round-robin-selection.sh

set -e

# === 설정 ===
SCRIPT_DIR="/mnt/d/cursor/openmanager-vibe-v5/.claude/scripts"
SELECT_SCRIPT="$SCRIPT_DIR/select-ai-round-robin.sh"
USAGE_FILE="/mnt/d/cursor/openmanager-vibe-v5/.claude/ai-usage-tracker.json"

# 색상 코드
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║     🧪 라운드 로빈 AI 선택 테스트 (Level 1)              ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
echo

# 사용량 파일 백업
if [ -f "$USAGE_FILE" ]; then
    cp "$USAGE_FILE" "$USAGE_FILE.backup"
    echo -e "${CYAN}기존 사용량 파일 백업 완료${NC}"
fi

# 테스트 실행
echo -e "${BLUE}📊 30번 연속 Level 1 AI 선택 테스트${NC}"
echo

# 카운터 초기화
declare -A ai_count
ai_count[gemini]=0
ai_count[codex]=0
ai_count[qwen]=0

# 30번 테스트 실행
for i in {1..30}; do
    # AI 선택
    selected_ai=$(bash "$SELECT_SCRIPT" "LEVEL_1" 2>/dev/null)
    
    # 카운터 증가
    ((ai_count[$selected_ai]++))
    
    # 진행 표시
    case "$selected_ai" in
        gemini) echo -n -e "${GREEN}G${NC}" ;;
        codex)  echo -n -e "${YELLOW}C${NC}" ;;
        qwen)   echo -n -e "${BLUE}Q${NC}" ;;
    esac
    
    # 10개마다 줄바꿈
    if [ $((i % 10)) -eq 0 ]; then
        echo " ($i/30)"
    fi
done

echo
echo
echo -e "${CYAN}📈 테스트 결과 (30회 실행)${NC}"
echo -e "├─ ${GREEN}Gemini${NC}: ${ai_count[gemini]}회 ($(( ai_count[gemini] * 100 / 30 ))%)"
echo -e "├─ ${YELLOW}Codex${NC}: ${ai_count[codex]}회 ($(( ai_count[codex] * 100 / 30 ))%)"
echo -e "└─ ${BLUE}Qwen${NC}: ${ai_count[qwen]}회 ($(( ai_count[qwen] * 100 / 30 ))%)"

# 균등 분배 확인
max_count=0
min_count=30
for ai in gemini codex qwen; do
    if [ ${ai_count[$ai]} -gt $max_count ]; then
        max_count=${ai_count[$ai]}
    fi
    if [ ${ai_count[$ai]} -lt $min_count ]; then
        min_count=${ai_count[$ai]}
    fi
done

variance=$((max_count - min_count))
echo
if [ $variance -le 5 ]; then
    echo -e "${GREEN}✅ 균등 분배 성공! (최대 편차: $variance)${NC}"
    echo -e "${GREEN}   이상적인 라운드 로빈 동작을 확인했습니다.${NC}"
else
    echo -e "${YELLOW}⚠️ 분배 편차 발생 (최대 편차: $variance)${NC}"
    echo -e "${YELLOW}   더 많은 테스트가 필요할 수 있습니다.${NC}"
fi

# 사용량 통계 표시
echo
echo -e "${PURPLE}📊 누적 사용량 통계${NC}"
if [ -f "$USAGE_FILE" ]; then
    total_selections=$(jq -r '.statistics.total_selections' "$USAGE_FILE")
    echo -e "총 선택 횟수: ${PURPLE}$total_selections${NC}회"
    
    echo -e "\n분포:"
    jq -r '.statistics.selection_distribution | to_entries | .[] | 
        "  • \(.key): \(.value)회"' "$USAGE_FILE"
fi

# 테스트 정리
echo
echo -e "${CYAN}테스트 완료!${NC}"
echo -e "백업 파일: $USAGE_FILE.backup"
echo
echo -e "${BLUE}💡 참고: 실제 운영 시 일일 제한이 적용됩니다:${NC}"
echo -e "  • Gemini: 1,000회/일"
echo -e "  • Codex: 무제한"
echo -e "  • Qwen: 2,000회/일"