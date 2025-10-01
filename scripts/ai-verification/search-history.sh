#!/bin/bash
# AI 교차검증 히스토리 검색 도구
# Usage: ./search-history.sh {command} [value]

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
INDEX_FILE="$PROJECT_ROOT/reports/quality/ai-verifications/verification-index.json"

# jq 설치 확인
if ! command -v jq &> /dev/null; then
    echo -e "${RED}오류: jq가 설치되어 있지 않습니다.${NC}"
    echo "설치: sudo apt-get install jq"
    exit 1
fi

# 인덱스 파일 존재 확인
if [ ! -f "$INDEX_FILE" ]; then
    echo -e "${RED}오류: verification-index.json을 찾을 수 없습니다.${NC}"
    echo "위치: $INDEX_FILE"
    exit 1
fi

# 도움말 출력
show_help() {
    echo -e "${GREEN}AI 교차검증 히스토리 검색 도구${NC}"
    echo ""
    echo "사용법:"
    echo "  $0 {command} [value]"
    echo ""
    echo "명령어:"
    echo "  ${BLUE}target${NC} <검색어>     - 특정 대상 검증 히스토리 검색"
    echo "  ${BLUE}date${NC} <날짜>         - 날짜 범위 검색 (예: 2025-10-02)"
    echo "  ${BLUE}score${NC} <최소점수>    - 점수 이상 검증 검색 (예: 90)"
    echo "  ${BLUE}tag${NC} <태그>          - 태그 기반 검색 (예: subagent)"
    echo "  ${BLUE}latest${NC} <개수>       - 최근 N개 검증 (예: 3)"
    echo "  ${BLUE}trend${NC}               - 평균 점수 추이 분석"
    echo "  ${BLUE}stats${NC}               - 전체 통계"
    echo "  ${BLUE}help${NC}                - 이 도움말 표시"
    echo ""
    echo "예시:"
    echo "  $0 latest 3"
    echo "  $0 tag subagent"
    echo "  $0 score 90"
    echo "  $0 trend"
}

# 명령어 처리
COMMAND=$1
VALUE=$2

case $COMMAND in
    "target")
        if [ -z "$VALUE" ]; then
            echo -e "${RED}오류: 검색어를 입력하세요.${NC}"
            echo "사용법: $0 target <검색어>"
            exit 1
        fi
        echo -e "${GREEN}대상 '$VALUE' 검증 히스토리:${NC}"
        jq -r ".verifications[] | select(.target | contains(\"$VALUE\")) |
               \"\\n날짜: \\(.date)\\n대상: \\(.target)\\n점수: \\(.ai_scores.average)/100\\n결정: \\(.decision)\\n커밋: \\(.commit)\"" \
               "$INDEX_FILE"
        ;;

    "date")
        if [ -z "$VALUE" ]; then
            echo -e "${RED}오류: 날짜를 입력하세요.${NC}"
            echo "사용법: $0 date <YYYY-MM-DD>"
            exit 1
        fi
        echo -e "${GREEN}날짜 '$VALUE' 검증 히스토리:${NC}"
        jq -r ".verifications[] | select(.date | startswith(\"$VALUE\")) |
               \"\\n날짜: \\(.date)\\n대상: \\(.target)\\n점수: \\(.ai_scores.average)/100\"" \
               "$INDEX_FILE"
        ;;

    "score")
        if [ -z "$VALUE" ]; then
            echo -e "${RED}오류: 최소 점수를 입력하세요.${NC}"
            echo "사용법: $0 score <최소점수>"
            exit 1
        fi
        echo -e "${GREEN}점수 ${VALUE}점 이상 검증 히스토리:${NC}"
        jq -r ".verifications[] | select(.ai_scores.average >= $VALUE) |
               \"\\n날짜: \\(.date)\\n대상: \\(.target)\\n점수: \\(.ai_scores.average)/100 (Codex: \\(.ai_scores.codex), Gemini: \\(.ai_scores.gemini), Qwen: \\(.ai_scores.qwen))\"" \
               "$INDEX_FILE"
        ;;

    "tag")
        if [ -z "$VALUE" ]; then
            echo -e "${RED}오류: 태그를 입력하세요.${NC}"
            echo "사용법: $0 tag <태그>"
            exit 1
        fi
        echo -e "${GREEN}태그 '$VALUE' 검증 히스토리:${NC}"
        jq -r ".verifications[] | select(.tags | contains([\"$VALUE\"])) |
               \"\\n날짜: \\(.date)\\n대상: \\(.target)\\n점수: \\(.ai_scores.average)/100\\n태그: \\(.tags | join(\", \"))\"" \
               "$INDEX_FILE"
        ;;

    "latest")
        if [ -z "$VALUE" ]; then
            VALUE=5  # 기본값 5개
        fi
        echo -e "${GREEN}최근 ${VALUE}개 검증 히스토리:${NC}"
        jq -r ".verifications[-$VALUE:] | .[] |
               \"\\n날짜: \\(.date)\\n대상: \\(.target)\\n점수: \\(.ai_scores.average)/100 (Codex: \\(.ai_scores.codex), Gemini: \\(.ai_scores.gemini), Qwen: \\(.ai_scores.qwen))\\n결정: \\(.decision)\"" \
               "$INDEX_FILE"
        ;;

    "trend")
        echo -e "${GREEN}평균 점수 추이 분석:${NC}"
        echo ""

        # 전체 평균
        OVERALL_AVG=$(jq '[.verifications[] | .ai_scores.average] | add / length' "$INDEX_FILE")
        echo -e "${BLUE}전체 평균:${NC} $OVERALL_AVG/100"

        # AI별 평균
        CODEX_AVG=$(jq '[.verifications[] | .ai_scores.codex] | add / length' "$INDEX_FILE")
        GEMINI_AVG=$(jq '[.verifications[] | .ai_scores.gemini] | add / length' "$INDEX_FILE")
        QWEN_AVG=$(jq '[.verifications[] | .ai_scores.qwen] | add / length' "$INDEX_FILE")

        echo -e "${BLUE}Codex 평균:${NC} $CODEX_AVG/100"
        echo -e "${BLUE}Gemini 평균:${NC} $GEMINI_AVG/100"
        echo -e "${BLUE}Qwen 평균:${NC} $QWEN_AVG/100"

        # 최고/최저 점수
        MAX_SCORE=$(jq '[.verifications[] | .ai_scores.average] | max' "$INDEX_FILE")
        MIN_SCORE=$(jq '[.verifications[] | .ai_scores.average] | min' "$INDEX_FILE")

        echo ""
        echo -e "${BLUE}최고 점수:${NC} $MAX_SCORE/100"
        echo -e "${BLUE}최저 점수:${NC} $MIN_SCORE/100"
        ;;

    "stats")
        echo -e "${GREEN}AI 교차검증 전체 통계:${NC}"
        echo ""

        # 총 검증 횟수
        TOTAL=$(jq '.statistics.total_verifications' "$INDEX_FILE")
        echo -e "${BLUE}총 검증 횟수:${NC} $TOTAL"

        # 평균 점수
        AVG_SCORE=$(jq '.statistics.average_score' "$INDEX_FILE")
        echo -e "${BLUE}평균 점수:${NC} $AVG_SCORE/100"

        # 평균 개선률
        AVG_IMPROVEMENT=$(jq '.statistics.average_improvement' "$INDEX_FILE")
        echo -e "${BLUE}평균 개선률:${NC} +$AVG_IMPROVEMENT점"

        # AI별 성과
        echo ""
        echo -e "${YELLOW}AI별 성과:${NC}"

        CODEX_COUNT=$(jq '.statistics.ai_performance.codex.count' "$INDEX_FILE")
        CODEX_AVG=$(jq '.statistics.ai_performance.codex.average' "$INDEX_FILE")
        echo -e "  Codex: $CODEX_COUNT회, 평균 $CODEX_AVG/100"

        GEMINI_COUNT=$(jq '.statistics.ai_performance.gemini.count' "$INDEX_FILE")
        GEMINI_AVG=$(jq '.statistics.ai_performance.gemini.average' "$INDEX_FILE")
        echo -e "  Gemini: $GEMINI_COUNT회, 평균 $GEMINI_AVG/100"

        QWEN_COUNT=$(jq '.statistics.ai_performance.qwen.count' "$INDEX_FILE")
        QWEN_AVG=$(jq '.statistics.ai_performance.qwen.average' "$INDEX_FILE")
        echo -e "  Qwen: $QWEN_COUNT회, 평균 $QWEN_AVG/100"
        ;;

    "help"|"")
        show_help
        ;;

    *)
        echo -e "${RED}오류: 알 수 없는 명령어 '$COMMAND'${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
