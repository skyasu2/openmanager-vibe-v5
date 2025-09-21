#!/bin/bash

# AI Bridge - 서브에이전트 간접 호출 및 병렬 실행 스크립트
# 사용법: ./ai-bridge.sh <command> <file_or_prompt>

set -e

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 작업 디렉토리 설정
WORK_DIR="/tmp/ai-orchestration"
RESULTS_DIR="$WORK_DIR/results"
TASKS_DIR="$WORK_DIR/tasks"
STATUS_FILE="$WORK_DIR/status.json"

# 디렉토리 생성
mkdir -p "$RESULTS_DIR"/{codex,gemini,qwen,security}
mkdir -p "$TASKS_DIR"/{pending,completed}

# 명령어와 대상
COMMAND=$1
TARGET=$2

# 타임스탬프
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 상태 업데이트 함수
update_status() {
    local phase=$1
    local message=$2
    echo "{\"timestamp\":\"$TIMESTAMP\",\"phase\":\"$phase\",\"message\":\"$message\"}" > "$STATUS_FILE"
    echo -e "${BLUE}[$phase]${NC} $message"
}

# AI 실행 함수
run_ai() {
    local ai_type=$1
    local prompt=$2
    local output_file=$3

    case $ai_type in
        "codex")
            echo -e "${GREEN}[Codex]${NC} 논리적 분석 시작..."
            codex exec "$prompt" > "$output_file" 2>&1 &
            ;;
        "gemini")
            echo -e "${GREEN}[Gemini]${NC} 아키텍처 검토 시작..."
            gemini -p "$prompt" > "$output_file" 2>&1 &
            ;;
        "qwen")
            echo -e "${GREEN}[Qwen]${NC} 성능 분석 시작..."
            timeout 60 qwen -p "$prompt" > "$output_file" 2>&1 &
            ;;
        "security")
            echo -e "${GREEN}[Security]${NC} 보안 검토 요청 생성..."
            echo "{\"task\":\"security-auditor\",\"target\":\"$TARGET\",\"timestamp\":\"$TIMESTAMP\"}" > "$TASKS_DIR/pending/security_$TIMESTAMP.json"
            ;;
    esac
}

# 메인 실행 로직
case $COMMAND in
    "parallel-all")
        update_status "start" "4-AI 병렬 교차검증 시작: $TARGET"

        # 공통 프롬프트
        PROMPT="다음 파일/코드를 분석해주세요: $TARGET"

        # 병렬 실행
        run_ai "codex" "$PROMPT - 논리적 버그와 실무 관점 분석" "$RESULTS_DIR/codex/result_$TIMESTAMP.txt"
        run_ai "gemini" "$PROMPT - 아키텍처와 설계 패턴 분석" "$RESULTS_DIR/gemini/result_$TIMESTAMP.txt"
        run_ai "qwen" "$PROMPT - 성능 최적화와 알고리즘 분석" "$RESULTS_DIR/qwen/result_$TIMESTAMP.txt"
        run_ai "security" "$PROMPT" "$RESULTS_DIR/security/request_$TIMESTAMP.json"

        # 모든 백그라운드 작업 대기
        update_status "waiting" "AI 분석 진행 중..."
        wait

        update_status "complete" "모든 AI 분석 완료"

        # 결과 통합
        echo -e "${YELLOW}=== AI 교차검증 결과 통합 ===${NC}"
        echo "타임스탬프: $TIMESTAMP"
        echo "대상: $TARGET"
        echo ""

        # 각 결과 파일 확인
        for ai in codex gemini qwen; do
            result_file="$RESULTS_DIR/$ai/result_$TIMESTAMP.txt"
            if [ -f "$result_file" ]; then
                echo -e "${GREEN}[$ai 결과]${NC}"
                head -20 "$result_file"
                echo "..."
                echo ""
            fi
        done
        ;;

    "parallel-fast")
        update_status "start" "2-AI 빠른 검증: $TARGET"

        PROMPT="빠른 분석: $TARGET"

        # Claude + Codex만 실행
        run_ai "codex" "$PROMPT" "$RESULTS_DIR/codex/result_$TIMESTAMP.txt"
        echo -e "${BLUE}[Claude]${NC} 메인 분석은 현재 컨텍스트에서 진행"

        wait
        update_status "complete" "빠른 검증 완료"
        ;;

    "collect-results")
        update_status "collect" "결과 수집 중..."

        echo -e "${YELLOW}=== 수집된 AI 분석 결과 ===${NC}"

        # 최신 결과 파일들 수집
        for dir in "$RESULTS_DIR"/*; do
            if [ -d "$dir" ]; then
                ai_name=$(basename "$dir")
                latest_file=$(ls -t "$dir"/*.txt 2>/dev/null | head -1)
                if [ -f "$latest_file" ]; then
                    echo -e "${GREEN}[$ai_name]${NC}"
                    echo "파일: $latest_file"
                    echo "크기: $(wc -l < "$latest_file") 줄"
                    echo ""
                fi
            fi
        done
        ;;

    "clean")
        update_status "clean" "임시 파일 정리 중..."
        rm -rf "$WORK_DIR"
        echo -e "${GREEN}정리 완료${NC}"
        ;;

    "status")
        if [ -f "$STATUS_FILE" ]; then
            echo -e "${BLUE}현재 상태:${NC}"
            cat "$STATUS_FILE"
        else
            echo -e "${YELLOW}실행 중인 작업 없음${NC}"
        fi

        # 대기 중인 작업 확인
        pending_count=$(ls "$TASKS_DIR/pending" 2>/dev/null | wc -l)
        if [ "$pending_count" -gt 0 ]; then
            echo -e "${YELLOW}대기 중인 작업: $pending_count개${NC}"
        fi
        ;;

    *)
        echo "AI Bridge - 서브에이전트 간접 호출 도구"
        echo ""
        echo "사용법: $0 <command> [target]"
        echo ""
        echo "Commands:"
        echo "  parallel-all <file>  - 4개 AI 완전 교차검증"
        echo "  parallel-fast <file> - 2개 AI 빠른 검증"
        echo "  collect-results      - 모든 결과 수집"
        echo "  clean               - 임시 파일 정리"
        echo "  status              - 현재 상태 확인"
        echo ""
        echo "예시:"
        echo "  $0 parallel-all src/app/api/auth/route.ts"
        echo "  $0 parallel-fast src/lib/auth.ts"
        ;;
esac

# NEXT_ACTION 생성 (필요시)
if [ "$COMMAND" = "parallel-all" ] || [ "$COMMAND" = "parallel-fast" ]; then
    NEXT_ACTION_FILE="$WORK_DIR/next-action.txt"
    echo "### NEXT_ACTION ###" > "$NEXT_ACTION_FILE"
    echo "결과 통합 완료. 다음 단계:" >> "$NEXT_ACTION_FILE"
    echo "1. code-review-specialist 서브에이전트로 종합 리뷰" >> "$NEXT_ACTION_FILE"
    echo "2. 결과 파일: $RESULTS_DIR" >> "$NEXT_ACTION_FILE"
    echo "3. 실행: Task subagent_type=\"code-review-specialist\" prompt=\"$RESULTS_DIR 결과 종합\"" >> "$NEXT_ACTION_FILE"

    echo -e "${BLUE}[NEXT_ACTION]${NC} 다음 단계 제안이 $NEXT_ACTION_FILE에 저장됨"
fi