#!/bin/bash

# AI 교차검증 결과 저장 스크립트
# 사용법: ./save-verification-result.sh "쿼리 요약" /tmp/codex.txt /tmp/gemini.txt /tmp/qwen.txt

set -euo pipefail

# 색상 정의
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 인자 확인
if [ $# -lt 4 ]; then
  echo "사용법: $0 \"쿼리 요약\" <codex_file> <gemini_file> <qwen_file>"
  exit 1
fi

QUERY_SUMMARY="$1"
CODEX_FILE="$2"
GEMINI_FILE="$3"
QWEN_FILE="$4"

# 타임스탬프 생성
TIMESTAMP=$(date +"%Y-%m-%d")
TIME_ONLY=$(date +"%H%M%S")

# 쿼리 요약을 파일명에 사용 (특수문자 제거, 공백은 하이픈으로)
SAFE_QUERY=$(echo "$QUERY_SUMMARY" | tr -cd '[:alnum:][:space:]' | tr ' ' '-' | cut -c1-50)

# 디렉토리 생성
BASE_DIR="logs/ai-cross-verification/${TIMESTAMP}"
SESSION_DIR="${BASE_DIR}/${TIME_ONLY}-${SAFE_QUERY}"
mkdir -p "$SESSION_DIR"

echo -e "${BLUE}ℹ️  📁 결과 저장 디렉토리: ${SESSION_DIR}${NC}"

# 파일 복사
cp "$CODEX_FILE" "$SESSION_DIR/codex-output.txt" 2>/dev/null || echo "⚠️  Codex 파일 없음"
cp "$GEMINI_FILE" "$SESSION_DIR/gemini-output.txt" 2>/dev/null || echo "⚠️  Gemini 파일 없음"
cp "$QWEN_FILE" "$SESSION_DIR/qwen-output.txt" 2>/dev/null || echo "⚠️  Qwen 파일 없음"

# 메타데이터 생성
cat > "$SESSION_DIR/metadata.json" <<EOF
{
  "query": "$QUERY_SUMMARY",
  "timestamp": "$(date -Iseconds)",
  "date": "$TIMESTAMP",
  "time": "$TIME_ONLY",
  "files": {
    "codex": "codex-output.txt",
    "gemini": "gemini-output.txt",
    "qwen": "qwen-output.txt"
  },
  "results": {
    "codex": {
      "exists": $([ -f "$CODEX_FILE" ] && echo "true" || echo "false"),
      "size": $(stat -c%s "$CODEX_FILE" 2>/dev/null || echo "0")
    },
    "gemini": {
      "exists": $([ -f "$GEMINI_FILE" ] && echo "true" || echo "false"),
      "size": $(stat -c%s "$GEMINI_FILE" 2>/dev/null || echo "0")
    },
    "qwen": {
      "exists": $([ -f "$QWEN_FILE" ] && echo "true" || echo "false"),
      "size": $(stat -c%s "$QWEN_FILE" 2>/dev/null || echo "0")
    }
  }
}
EOF

# 간단한 요약 마크다운 생성
cat > "$SESSION_DIR/summary.md" <<EOF
# AI 교차검증 결과

**날짜**: $TIMESTAMP $TIME_ONLY
**쿼리**: $QUERY_SUMMARY

---

## 📊 Codex (실무 관점)

$([ -f "$CODEX_FILE" ] && tail -30 "$CODEX_FILE" | grep -v "^\[" || echo "결과 없음")

---

## 📐 Gemini (아키텍처 관점)

$([ -f "$GEMINI_FILE" ] && tail -30 "$GEMINI_FILE" | grep -v "^\[" || echo "결과 없음")

---

## ⚡ Qwen (성능 관점)

$([ -f "$QWEN_FILE" ] && tail -30 "$QWEN_FILE" | grep -v "^\[" || echo "결과 없음")

---

**저장 위치**: \`$SESSION_DIR\`
EOF

echo -e "${GREEN}✅ 저장 완료!${NC}"
echo ""
echo -e "${YELLOW}📁 저장 위치:${NC}"
echo "   - 원본: $SESSION_DIR/"
echo "   - 요약: $SESSION_DIR/summary.md"
echo "   - 메타: $SESSION_DIR/metadata.json"
echo ""

# 최근 10개만 유지 (오래된 것 자동 삭제)
if [ -d "$BASE_DIR" ]; then
  SESSION_COUNT=$(find "$BASE_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l)
  if [ "$SESSION_COUNT" -gt 10 ]; then
    echo -e "${YELLOW}⚠️  세션이 10개를 초과하여 오래된 세션 삭제 중...${NC}"
    find "$BASE_DIR" -mindepth 1 -maxdepth 1 -type d | sort | head -n -10 | xargs rm -rf
    echo -e "${GREEN}✅ 정리 완료 (최근 10개 유지)${NC}"
  fi
fi

echo -e "${BLUE}ℹ️  요약 보기: cat $SESSION_DIR/summary.md${NC}"
