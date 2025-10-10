#!/bin/bash

# AI 교차검증 (저장 없는 빠른 실행)
# Claude Code가 결과를 종합해서 Decision Log 작성
# 사용법: ./quick-cross-verify.sh "검증할 질문"

set -euo pipefail

# 색상 정의
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 인자 확인
if [ $# -lt 1 ]; then
  echo "사용법: $0 \"검증할 질문\""
  echo "예시: $0 \"useState vs useReducer 선택 기준\""
  exit 1
fi

QUERY="$1"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🤖 3-AI 교차검증 시작${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📝 질문:${NC} $QUERY"
echo ""

# 임시 파일 (메모리만 사용, 디스크 저장 안 함)
CODEX_TMP="/tmp/codex-${TIMESTAMP}.txt"
GEMINI_TMP="/tmp/gemini-${TIMESTAMP}.txt"
QWEN_TMP="/tmp/qwen-${TIMESTAMP}.txt"

# 병렬 실행
echo -e "${BLUE}⏳ 3-AI 병렬 실행 중...${NC}"
./scripts/ai-subagents/codex-wrapper.sh "$QUERY - 실무 관점에서 간단히" > "$CODEX_TMP" 2>&1 &
./scripts/ai-subagents/gemini-wrapper.sh "$QUERY - 아키텍처 관점에서 간단히" > "$GEMINI_TMP" 2>&1 &
./scripts/ai-subagents/qwen-wrapper.sh -p "$QUERY - 성능 관점에서 간단히" > "$QWEN_TMP" 2>&1 &

wait

# 결과 확인
CODEX_SIZE=$(stat -c%s "$CODEX_TMP" 2>/dev/null || echo "0")
GEMINI_SIZE=$(stat -c%s "$GEMINI_TMP" 2>/dev/null || echo "0")
QWEN_SIZE=$(stat -c%s "$QWEN_TMP" 2>/dev/null || echo "0")

echo ""
echo -e "${GREEN}✅ 실행 완료${NC}"
echo -e "${BLUE}📊 결과 크기: Codex ${CODEX_SIZE}B, Gemini ${GEMINI_SIZE}B, Qwen ${QWEN_SIZE}B${NC}"
echo ""

# 즉시 출력 (Claude가 읽음)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📊 Codex (실무 관점)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cat "$CODEX_TMP"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📐 Gemini (아키텍처 관점)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cat "$GEMINI_TMP"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}⚡ Qwen (성능 관점)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cat "$QWEN_TMP"
echo ""

# 임시 파일 삭제
rm -f "$CODEX_TMP" "$GEMINI_TMP" "$QWEN_TMP"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}💡 다음 단계${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Claude Code가 위 결과를 종합하여"
echo "logs/ai-decisions/YYYY-MM-DD-[주제].md 파일을 작성합니다."
echo ""
echo "포함 내용:"
echo "  - 각 AI 핵심 주장"
echo "  - 합의점과 충돌점"
echo "  - 최종 결정과 근거"
echo "  - 실행 내역"
echo ""
