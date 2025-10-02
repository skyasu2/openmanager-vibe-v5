#!/bin/bash
# AI 교차검증 결과 자동 저장 스크립트
# Usage: ./verification-recorder.sh <json_data>

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
VERIFICATIONS_DIR="$PROJECT_ROOT/reports/quality/ai-verifications"
INDEX_FILE="$VERIFICATIONS_DIR/verification-index.json"

# jq 설치 확인
if ! command -v jq &> /dev/null; then
    echo -e "${RED}오류: jq가 설치되어 있지 않습니다.${NC}"
    echo "설치: sudo apt-get install jq"
    exit 1
fi

# 도움말 출력
show_help() {
    echo -e "${GREEN}AI 교차검증 결과 자동 저장 스크립트${NC}"
    echo ""
    echo "사용법:"
    echo "  $0 <json_data>"
    echo ""
    echo "JSON 데이터 형식:"
    echo '  {'
    echo '    "target": "파일 경로 또는 대상",'
    echo '    "description": "간단한 설명",'
    echo '    "codex_score": 82,'
    echo '    "gemini_score": 91.3,'
    echo '    "qwen_score": 88,'
    echo '    "average_score": 87.1,'
    echo '    "decision": "approved_with_improvements",'
    echo '    "tags": ["tag1", "tag2"]'
    echo '  }'
    echo ""
    echo "예시:"
    echo "  $0 '{\"target\":\"test.ts\",\"codex_score\":85,\"gemini_score\":90,\"qwen_score\":87,\"average_score\":87.3,\"decision\":\"approved\",\"tags\":[\"test\"]}'"
}

# 인자 확인
if [ $# -eq 0 ] || [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    show_help
    exit 0
fi

JSON_DATA="$1"

# JSON 데이터 검증
if ! echo "$JSON_DATA" | jq . >/dev/null 2>&1; then
    echo -e "${RED}오류: 유효하지 않은 JSON 형식입니다.${NC}"
    exit 1
fi

# 필수 필드 확인
REQUIRED_FIELDS=("target" "codex_score" "gemini_score" "qwen_score" "average_score" "decision")
for field in "${REQUIRED_FIELDS[@]}"; do
    if ! echo "$JSON_DATA" | jq -e ".$field" >/dev/null 2>&1; then
        echo -e "${RED}오류: 필수 필드 '$field'가 없습니다.${NC}"
        exit 1
    fi
done

# 메타데이터 추출
TARGET=$(echo "$JSON_DATA" | jq -r '.target')
DESCRIPTION=$(echo "$JSON_DATA" | jq -r '.description // ""')
CODEX_SCORE=$(echo "$JSON_DATA" | jq -r '.codex_score')
GEMINI_SCORE=$(echo "$JSON_DATA" | jq -r '.gemini_score')
QWEN_SCORE=$(echo "$JSON_DATA" | jq -r '.qwen_score')
AVERAGE_SCORE=$(echo "$JSON_DATA" | jq -r '.average_score')
DECISION=$(echo "$JSON_DATA" | jq -r '.decision')
TAGS=$(echo "$JSON_DATA" | jq -r '.tags // [] | @json')
ACTIONS_TAKEN=$(echo "$JSON_DATA" | jq -r '.actions_taken // [] | @json')
KEY_FINDINGS=$(echo "$JSON_DATA" | jq -r '.key_findings // [] | @json')
COMMIT=$(echo "$JSON_DATA" | jq -r '.commit // ""')

# 타임스탬프 생성
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
FILENAME_DATE=$(date -u +"%Y-%m-%d-%H-%M")

# 파일명 안전성 처리 (공백 → 하이픈, 특수문자 제거)
SAFE_DESCRIPTION=$(echo "$DESCRIPTION" | tr ' ' '-' | tr -cd '[:alnum:]-')
FILENAME="${FILENAME_DATE}-${SAFE_DESCRIPTION}.md"
FILEPATH="$VERIFICATIONS_DIR/$FILENAME"

# ID 생성
ID="${FILENAME_DATE}-${SAFE_DESCRIPTION}"

echo -e "${BLUE}AI 교차검증 결과 저장 중...${NC}"
echo -e "${BLUE}대상:${NC} $TARGET"
echo -e "${BLUE}파일:${NC} $FILENAME"

# Markdown 리포트 생성
cat > "$FILEPATH" << EOF
# AI 교차검증 리포트 - $DESCRIPTION

**검증일**: $TIMESTAMP
**대상**: $TARGET

---

## 🤖 3-AI 교차검증 결과

| AI | 점수 | 전문 분야 |
|---|---|---|
| **Codex** | ${CODEX_SCORE}/100 | 실무 |
| **Gemini** | ${GEMINI_SCORE}/100 | 설계 |
| **Qwen** | ${QWEN_SCORE}/100 | 성능 |

**평균**: ${AVERAGE_SCORE}/100

---

## 🎯 Claude 최종 판단

### 종합 평가: ${AVERAGE_SCORE}/100

**결정**: $DECISION

EOF

# 주요 발견사항 추가 (있는 경우)
if [ "$KEY_FINDINGS" != "[]" ] && [ "$KEY_FINDINGS" != "null" ]; then
    echo "**주요 발견사항**:" >> "$FILEPATH"
    echo "$KEY_FINDINGS" | jq -r '.[]' | while read -r finding; do
        echo "- $finding" >> "$FILEPATH"
    done
    echo "" >> "$FILEPATH"
fi

# 개선 조치 추가 (있는 경우)
if [ "$ACTIONS_TAKEN" != "[]" ] && [ "$ACTIONS_TAKEN" != "null" ]; then
    echo "---" >> "$FILEPATH"
    echo "" >> "$FILEPATH"
    echo "## ✅ 적용된 개선 조치" >> "$FILEPATH"
    echo "" >> "$FILEPATH"
    echo "$ACTIONS_TAKEN" | jq -r '.[]' | while read -r action; do
        echo "- $action" >> "$FILEPATH"
    done
    echo "" >> "$FILEPATH"
fi

# 커밋 정보 추가 (있는 경우)
if [ -n "$COMMIT" ] && [ "$COMMIT" != "null" ]; then
    echo "---" >> "$FILEPATH"
    echo "" >> "$FILEPATH"
    echo "## 🔗 관련 커밋" >> "$FILEPATH"
    echo "" >> "$FILEPATH"
    echo "**커밋**: \`$COMMIT\`" >> "$FILEPATH"
    echo "" >> "$FILEPATH"
fi

# 푸터 추가
cat >> "$FILEPATH" << EOF
---

**Generated**: $TIMESTAMP by verification-recorder
**Status**: ✅ 히스토리 자동 저장 완료
EOF

echo -e "${GREEN}✅ Markdown 리포트 생성 완료${NC}"

# verification-index.json 업데이트
echo -e "${BLUE}verification-index.json 업데이트 중...${NC}"

# 임시 파일에 업데이트된 JSON 생성
TMP_INDEX=$(mktemp)

jq --arg id "$ID" \
   --arg date "$TIMESTAMP" \
   --arg target "$TARGET" \
   --arg desc "$DESCRIPTION" \
   --argjson codex "$CODEX_SCORE" \
   --argjson gemini "$GEMINI_SCORE" \
   --argjson qwen "$QWEN_SCORE" \
   --argjson avg "$AVERAGE_SCORE" \
   --arg decision "$DECISION" \
   --argjson tags "$TAGS" \
   --arg commit "$COMMIT" \
   '.verifications += [{
      "id": $id,
      "date": $date,
      "target": $target,
      "description": $desc,
      "ai_scores": {
        "codex": $codex,
        "gemini": $gemini,
        "qwen": $qwen,
        "average": $avg
      },
      "decision": $decision,
      "tags": $tags,
      "commit": ($commit | if . == "" then null else . end)
   }] |
   .metadata.last_updated = $date |
   .statistics.total_verifications = (.verifications | length) |
   .statistics.average_score = ([.verifications[].ai_scores.average] | add / length) |
   .statistics.ai_performance.codex.count = (.verifications | length) |
   .statistics.ai_performance.codex.average = ([.verifications[].ai_scores.codex] | add / length) |
   .statistics.ai_performance.gemini.count = (.verifications | length) |
   .statistics.ai_performance.gemini.average = ([.verifications[].ai_scores.gemini] | add / length) |
   .statistics.ai_performance.qwen.count = (.verifications | length) |
   .statistics.ai_performance.qwen.average = ([.verifications[].ai_scores.qwen] | add / length)' \
   "$INDEX_FILE" > "$TMP_INDEX"

# 원자적 업데이트
mv "$TMP_INDEX" "$INDEX_FILE"

echo -e "${GREEN}✅ verification-index.json 업데이트 완료${NC}"

# 최종 통계 출력
TOTAL=$(jq '.statistics.total_verifications' "$INDEX_FILE")
AVG_SCORE=$(jq '.statistics.average_score' "$INDEX_FILE")
CODEX_AVG=$(jq '.statistics.ai_performance.codex.average' "$INDEX_FILE")
GEMINI_AVG=$(jq '.statistics.ai_performance.gemini.average' "$INDEX_FILE")
QWEN_AVG=$(jq '.statistics.ai_performance.qwen.average' "$INDEX_FILE")

echo ""
echo -e "${GREEN}✅ AI 교차검증 히스토리 저장 완료${NC}"
echo ""
echo -e "${BLUE}📄 생성된 파일:${NC}"
echo "- $FILEPATH"
echo ""
echo -e "${BLUE}📊 업데이트된 통계:${NC}"
echo "- 총 검증 횟수: $TOTAL"
echo "- 평균 점수: $AVG_SCORE/100"
echo "- Codex 평균: $CODEX_AVG/100"
echo "- Gemini 평균: $GEMINI_AVG/100"
echo "- Qwen 평균: $QWEN_AVG/100"
echo ""
echo -e "${BLUE}🔍 검색 방법:${NC}"
echo "./scripts/ai-verification/search-history.sh latest 1"
echo "./scripts/ai-verification/search-history.sh target \"${TARGET}\""
