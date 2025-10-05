#!/bin/bash

###############################################################################
# AI 교차검증 실행 스크립트 (실제 외부 AI CLI)
#
# 용도: Codex, Gemini, Qwen CLI를 병렬 실행하여 실제 AI 교차검증 수행
# 환경: WSL Ubuntu
# 버전: 1.0.0
###############################################################################

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
TIMEOUT=90
TIMESTAMP=$(date +%Y-%m-%d-%H-%M)
OUTPUT_DIR="/tmp/ai-verification-$TIMESTAMP"
RESULT_FILE="$OUTPUT_DIR/result.json"

# 사용법
usage() {
  echo "사용법: $0 <query>"
  echo ""
  echo "예시:"
  echo "  $0 \"LoginClient.tsx 코드 검증\""
  echo "  $0 \"이 함수의 성능 분석\""
  echo ""
  echo "옵션:"
  echo "  -t, --timeout SECONDS    타임아웃 (기본: 60초)"
  echo "  -o, --output DIR         출력 디렉토리 (기본: /tmp/ai-verification-<timestamp>)"
  echo "  -h, --help               도움말 표시"
  exit 1
}

# 인자 파싱
QUERY=""
while [[ $# -gt 0 ]]; do
  case $1 in
    -t|--timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    -o|--output)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    *)
      QUERY="$1"
      shift
      ;;
  esac
done

if [[ -z "$QUERY" ]]; then
  echo -e "${RED}❌ 에러: 검증할 쿼리를 입력하세요${NC}"
  usage
fi

# 출력 디렉토리 생성
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}🤖 AI 교차검증 시작${NC}"
echo -e "${BLUE}📋 Query: $QUERY${NC}"
echo -e "${BLUE}⏱️  Timeout: ${TIMEOUT}초${NC}"
echo -e "${BLUE}📁 Output: $OUTPUT_DIR${NC}"
echo ""

# 시작 시간
START_TIME=$(date +%s)

# 1. Codex (ChatGPT Plus)
echo -e "${YELLOW}🔵 Codex 실행 중...${NC}"
{
  timeout "$TIMEOUT" codex exec "$QUERY" > "$OUTPUT_DIR/codex.txt" 2>&1 && \
    echo -e "${GREEN}✅ Codex 완료${NC}" || \
    echo -e "${RED}❌ Codex 실패 (timeout/error)${NC}"
} &
CODEX_PID=$!

# 2. Gemini (Google OAuth)
echo -e "${YELLOW}🟢 Gemini 실행 중...${NC}"
{
  timeout "$TIMEOUT" gemini "$QUERY" > "$OUTPUT_DIR/gemini.txt" 2>&1 && \
    echo -e "${GREEN}✅ Gemini 완료${NC}" || \
    echo -e "${RED}❌ Gemini 실패 (timeout/error)${NC}"
} &
GEMINI_PID=$!

# 3. Qwen (Plan Mode)
echo -e "${YELLOW}🟠 Qwen 실행 중...${NC}"
{
  timeout "$TIMEOUT" qwen -p "$QUERY" > "$OUTPUT_DIR/qwen.txt" 2>&1 && \
    echo -e "${GREEN}✅ Qwen 완료${NC}" || \
    echo -e "${RED}❌ Qwen 실패 (timeout/error)${NC}"
} &
QWEN_PID=$!

# 병렬 실행 대기
echo ""
echo -e "${BLUE}⏳ 3개 AI 병렬 실행 중... (최대 ${TIMEOUT}초)${NC}"
wait $CODEX_PID $GEMINI_PID $QWEN_PID

# 종료 시간
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${GREEN}✅ 모든 AI 실행 완료 (${DURATION}초)${NC}"
echo ""

# 결과 읽기
CODEX_RESULT=$(cat "$OUTPUT_DIR/codex.txt" 2>/dev/null || echo "ERROR: Codex failed")
GEMINI_RESULT=$(cat "$OUTPUT_DIR/gemini.txt" 2>/dev/null || echo "ERROR: Gemini failed")
QWEN_RESULT=$(cat "$OUTPUT_DIR/qwen.txt" 2>/dev/null || echo "ERROR: Qwen failed")

# JSON 결과 생성
cat > "$RESULT_FILE" << EOF
{
  "timestamp": "$TIMESTAMP",
  "query": "$QUERY",
  "duration": $DURATION,
  "results": {
    "codex": {
      "status": "$(grep -q '^ERROR:' "$OUTPUT_DIR/codex.txt" 2>/dev/null && echo 'failed' || echo 'success')",
      "response": $(echo "$CODEX_RESULT" | jq -Rs .)
    },
    "gemini": {
      "status": "$(grep -q '^ERROR:' "$OUTPUT_DIR/gemini.txt" 2>/dev/null && echo 'failed' || echo 'success')",
      "response": $(echo "$GEMINI_RESULT" | jq -Rs .)
    },
    "qwen": {
      "status": "$(grep -q '^ERROR:' "$OUTPUT_DIR/qwen.txt" 2>/dev/null && echo 'failed' || echo 'success')",
      "response": $(echo "$QWEN_RESULT" | jq -Rs .)
    }
  }
}
EOF

# 마크다운 결과 생성
cat > "$OUTPUT_DIR/result.md" << EOF
# AI 교차검증 결과

**날짜**: $TIMESTAMP
**쿼리**: $QUERY
**소요 시간**: ${DURATION}초

---

## 🔵 Codex (실무 관점)

\`\`\`
$CODEX_RESULT
\`\`\`

---

## 🟢 Gemini (아키텍처 관점)

\`\`\`
$GEMINI_RESULT
\`\`\`

---

## 🟠 Qwen (성능 관점)

\`\`\`
$QWEN_RESULT
\`\`\`

---

## 📊 실행 정보

- **Timeout**: ${TIMEOUT}초
- **실제 소요 시간**: ${DURATION}초
- **출력 디렉토리**: $OUTPUT_DIR
- **JSON 결과**: $RESULT_FILE
EOF

echo -e "${BLUE}📁 결과 파일:${NC}"
echo -e "  - JSON: $RESULT_FILE"
echo -e "  - Markdown: $OUTPUT_DIR/result.md"
echo -e "  - Codex: $OUTPUT_DIR/codex.txt"
echo -e "  - Gemini: $OUTPUT_DIR/gemini.txt"
echo -e "  - Qwen: $OUTPUT_DIR/qwen.txt"
echo ""

# 간단한 요약 출력
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 AI 교차검증 완료${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}💡 다음 단계: Claude에게 결과를 전달하여 종합 분석 요청${NC}"
echo -e "${BLUE}   예: \"$OUTPUT_DIR/result.md 파일을 읽고 종합 판단해줘\"${NC}"
echo ""

# 결과 파일 경로 반환 (스크립트 호출자용)
echo "$RESULT_FILE"
