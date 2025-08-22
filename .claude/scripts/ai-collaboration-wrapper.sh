#!/bin/bash

# 🤖 AI 협업 래퍼 스크립트 v2.0
# ANSI escape sequence 문제 해결을 위한 안전한 AI CLI 도구 실행

set -e

PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
TEMP_DIR="/tmp/claude-ai-collab"
LOG_FILE="$PROJECT_ROOT/.claude/ai-collaboration.log"

# 색상 코드 (Claude Code 환경용)
RED='\033[0;31m'
GREEN='\033[0;32m' 
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 임시 디렉토리 생성
mkdir -p "$TEMP_DIR"

# 로그 함수
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "$message"
    echo "[$timestamp] $(echo -e "$message" | sed 's/\x1b\[[0-9;]*m//g')" >> "$LOG_FILE"
}

# ANSI 제어 코드 제거 함수
clean_output() {
    sed 's/\x1b\[[0-9;]*[mGKHF]//g' | sed 's/\x1b\[[?][0-9]*[hl]//g' | sed 's/\[[0-9;]*R//g'
}

# 안전한 AI CLI 실행 함수
safe_ai_call() {
    local tool="$1"
    local prompt="$2"
    local input_file="$3"
    local output_file="$TEMP_DIR/${tool}_output.txt"
    
    log_message "${BLUE}🤖 $tool 실행 중...${NC}"
    
    # 환경 변수 설정으로 터미널 제어 비활성화
    export TERM=dumb
    export NO_COLOR=1
    export DISABLE_AUTO_TITLE=true
    export ANSI_COLORS_DISABLED=1
    
    case "$tool" in
        "gemini")
            if [ -n "$input_file" ]; then
                timeout 30s gemini -f "$input_file" -p "$prompt" 2>/dev/null | clean_output > "$output_file" || echo "❌ Gemini 실행 실패" > "$output_file"
            else
                echo "$prompt" | timeout 30s gemini 2>/dev/null | clean_output > "$output_file" || echo "❌ Gemini 실행 실패" > "$output_file"
            fi
            ;;
        "qwen")
            if [ -n "$input_file" ]; then
                timeout 30s qwen -f "$input_file" -p "$prompt" 2>/dev/null | clean_output > "$output_file" || echo "❌ Qwen 실행 실패" > "$output_file"
            else
                echo "$prompt" | timeout 30s qwen -p "$prompt" 2>/dev/null | clean_output > "$output_file" || echo "❌ Qwen 실행 실패" > "$output_file"
            fi
            ;;
        "codex")
            # Codex는 터미널 모드 문제로 비활성화
            echo "❌ Codex CLI는 현재 터미널 호환성 문제로 비활성화됨" > "$output_file"
            echo "💡 대안: Claude Code Task codex-wrapper 사용 권장" >> "$output_file"
            ;;
    esac
    
    # 결과 출력
    if [ -f "$output_file" ] && [ -s "$output_file" ]; then
        echo -e "${GREEN}✅ $tool 응답:${NC}"
        head -10 "$output_file"
        echo "..."
        echo -e "${YELLOW}📄 전체 결과: $output_file${NC}"
    else
        echo -e "${RED}❌ $tool 응답 없음${NC}"
    fi
    echo
}

# 다중 AI 협업 함수
multi_ai_collaboration() {
    local code_file="$1"
    local task_description="$2"
    
    log_message "${BLUE}🚀 다중 AI 협업 시작: $(basename "$code_file")${NC}"
    
    if [ ! -f "$code_file" ]; then
        log_message "${RED}❌ 파일을 찾을 수 없습니다: $code_file${NC}"
        return 1
    fi
    
    # 각 AI에게 같은 파일을 다른 관점으로 검토 요청
    echo -e "${GREEN}🔄 병렬 AI 검토 실행...${NC}"
    
    # Gemini: 아키텍처 관점
    safe_ai_call "gemini" "이 코드를 아키텍처와 설계 패턴 관점에서 검토해주세요. SOLID 원칙 준수 여부와 개선점을 제시해주세요." "$code_file"
    
    # Qwen: 성능 최적화 관점  
    safe_ai_call "qwen" "이 코드의 성능과 알고리즘 효율성을 분석해주세요. 시간/공간 복잡도와 최적화 방안을 제시해주세요." "$code_file"
    
    # Codex: 현재 터미널 호환성 문제로 건너뜀
    safe_ai_call "codex" "실무 관점에서 이 코드의 엣지 케이스와 보안 이슈를 검토해주세요."
    
    log_message "${GREEN}✅ 다중 AI 협업 완료${NC}"
    
    # Claude Code Task 시스템 권장사항 출력
    echo -e "${YELLOW}💡 더 안정적인 AI 협업을 위한 권장사항:${NC}"
    echo "Task external-ai-orchestrator \"$task_description\""
    echo "Task gemini-wrapper \"아키텍처 설계 패턴 검토: $code_file\""
    echo "Task codex-wrapper \"실무 엣지 케이스 검토: $code_file\""
    echo "Task qwen-wrapper \"성능 최적화 분석: $code_file\""
}

# 사용법
usage() {
    echo -e "${BLUE}🤖 AI 협업 래퍼 도구 v2.0${NC}"
    echo
    echo -e "${GREEN}사용법:${NC}"
    echo "  $0 test                          # AI CLI 도구 연결 테스트"
    echo "  $0 review <파일>                 # 다중 AI 코드 리뷰"
    echo "  $0 gemini <프롬프트>             # Gemini 단독 실행"
    echo "  $0 qwen <프롬프트>               # Qwen 단독 실행"
    echo
    echo -e "${GREEN}예시:${NC}"
    echo "  $0 test"
    echo "  $0 review src/app/api/auth/route.ts"
    echo "  $0 gemini '이 코드의 보안 문제점은?'"
    echo
    echo -e "${YELLOW}💡 ANSI escape sequence 문제를 해결한 안전한 AI 협업 도구${NC}"
}

# 메인 실행 로직
case "$1" in
    "test")
        log_message "${BLUE}🧪 AI CLI 도구 연결 테스트${NC}"
        safe_ai_call "gemini" "Hello, 간단한 응답 테스트입니다."
        safe_ai_call "qwen" "Hello, 간단한 응답 테스트입니다."
        safe_ai_call "codex" "Hello, 간단한 응답 테스트입니다."
        ;;
    "review")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ 파일 경로를 지정해주세요${NC}"
            usage
            exit 1
        fi
        multi_ai_collaboration "$2" "다중 AI 코드 리뷰: $(basename "$2")"
        ;;
    "gemini")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ 프롬프트를 지정해주세요${NC}"
            usage
            exit 1
        fi
        safe_ai_call "gemini" "$2"
        ;;
    "qwen")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ 프롬프트를 지정해주세요${NC}"
            usage
            exit 1
        fi
        safe_ai_call "qwen" "$2"
        ;;
    *)
        usage
        ;;
esac

# 정리
rm -rf "$TEMP_DIR"