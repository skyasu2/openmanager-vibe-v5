#!/bin/bash

# 🔄 하이브리드 AI 교차검증 시스템 v3.0
# Task 시스템 + AI CLI 래퍼 통합 검증 도구

set -e

PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
LOG_FILE="$CLAUDE_DIR/hybrid-verification.log"
RESULTS_DIR="$CLAUDE_DIR/verification-results"

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 결과 디렉토리 생성
mkdir -p "$RESULTS_DIR"

# 로그 함수
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "$message"
    echo "[$timestamp] $(echo -e "$message" | sed 's/\x1b\[[0-9;]*m//g')" >> "$LOG_FILE"
}

# 파일 검증 레벨 결정
determine_verification_level() {
    local file="$1"
    local size=0
    
    if [ -f "$file" ]; then
        size=$(wc -l "$file" 2>/dev/null | awk '{print $1}')
    fi
    
    # 중요 파일 패턴 (항상 Level 3)
    if [[ "$file" =~ /(api|auth|security|payment|middleware)/ ]] || \
       [[ "$file" =~ \.(config|env) ]] || \
       [[ "$file" =~ route\.ts$ ]] || \
       [[ "$file" =~ middleware\.ts$ ]]; then
        echo "3"
        return
    fi
    
    # 파일 크기 기반
    if [ "$size" -lt 50 ]; then
        echo "1"
    elif [ "$size" -lt 200 ]; then
        echo "2"
    else
        echo "3"
    fi
}

# Task 시스템 검증 실행
execute_task_verification() {
    local file="$1"
    local level="$2"
    local start_time=$(date +%s)
    local task_output="$RESULTS_DIR/task_verification_$(basename "$file")_$(date +%s).log"
    
    log_message "${CYAN}🎯 Task 시스템 검증 시작: $(basename "$file") (Level $level)${NC}"
    
    # Task 명령어 생성
    local task_command=""
    case "$level" in
        1)
            task_command="Task external-ai-orchestrator \"Level 1 단일 AI 검증: $file\n- 빠른 코드 품질 검토\n- 기본적인 문제 확인\n- 간단한 개선사항 제안\""
            ;;
        2)
            task_command="Task external-ai-orchestrator \"Level 2 병렬 AI 검증: $file\n- Claude + Gemini 병렬 검토\n- 아키텍처 패턴 검증\n- 타입 안전성 확인\n- 성능 최적화 제안\""
            ;;
        3)
            task_command="Task external-ai-orchestrator \"Level 3 완전 교차 검증: $file\n- 4-AI 완전 교차 검토\n- 보안 취약점 스캔\n- 모든 엣지 케이스 검토\n- 프로덕션 배포 안전성 확인\n- 코드 품질 완전 검증\""
            ;;
    esac
    
    # Task 실행 (Claude Code에게 권장)
    echo -e "${YELLOW}📋 다음 Task 명령어를 Claude Code에서 실행하세요:${NC}"
    echo -e "${PURPLE}$task_command${NC}"
    echo
    
    # 시뮬레이션 결과 (실제 실행은 사용자가 해야 함)
    echo "실행 시간: $(date '+%Y-%m-%d %H:%M:%S')" > "$task_output"
    echo "검증 파일: $file" >> "$task_output"
    echo "검증 레벨: $level" >> "$task_output"
    echo "상태: 사용자 실행 대기" >> "$task_output"
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_message "${GREEN}✅ Task 검증 준비 완료 (${duration}초)${NC}"
    echo "$task_output"
}

# AI CLI 래퍼 검증 실행
execute_cli_verification() {
    local file="$1"
    local level="$2"
    local start_time=$(date +%s)
    local cli_output="$RESULTS_DIR/cli_verification_$(basename "$file")_$(date +%s).log"
    
    log_message "${CYAN}🔧 AI CLI 래퍼 검증 시작: $(basename "$file") (Level $level)${NC}"
    
    # 환경 변수 설정
    export TERM=dumb
    export NO_COLOR=1
    export DISABLE_AUTO_TITLE=true
    
    echo "=== AI CLI 래퍼 검증 결과 ===" > "$cli_output"
    echo "실행 시간: $(date '+%Y-%m-%d %H:%M:%S')" >> "$cli_output"
    echo "검증 파일: $file" >> "$cli_output"
    echo "검증 레벨: $level" >> "$cli_output"
    echo "" >> "$cli_output"
    
    # Gemini CLI 테스트
    if [ -f "$file" ]; then
        echo "=== Gemini CLI 응답 ===" >> "$cli_output"
        {
            echo "이 파일의 코드 품질을 검토해주세요:" | timeout 30s gemini -f "$file" 2>/dev/null | sed 's/\x1b\[[0-9;]*[mGKHR]//g' | head -5
        } >> "$cli_output" 2>&1 || echo "Gemini CLI 실행 실패" >> "$cli_output"
        echo "" >> "$cli_output"
        
        # Qwen CLI 테스트
        echo "=== Qwen CLI 응답 ===" >> "$cli_output"
        {
            echo "이 코드의 성능 최적화 방안을 알려주세요:" | timeout 30s qwen -f "$file" 2>/dev/null | sed 's/\x1b\[[0-9;]*[mGKHR]//g' | head -5
        } >> "$cli_output" 2>&1 || echo "Qwen CLI 실행 실패" >> "$cli_output"
        echo "" >> "$cli_output"
    else
        echo "파일을 찾을 수 없음: $file" >> "$cli_output"
    fi
    
    # Codex CLI는 호환성 문제로 스킵
    echo "=== Codex CLI 응답 ===" >> "$cli_output"
    echo "❌ Codex CLI는 터미널 호환성 문제로 비활성화됨" >> "$cli_output"
    echo "💡 대안: Claude Code Task codex-wrapper 사용 권장" >> "$cli_output"
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_message "${GREEN}✅ CLI 검증 완료 (${duration}초)${NC}"
    echo "$cli_output"
}

# 검증 결과 비교 분석
compare_verification_results() {
    local task_output="$1"
    local cli_output="$2"
    local comparison_file="$RESULTS_DIR/comparison_$(date +%s).md"
    
    log_message "${PURPLE}📊 검증 결과 비교 분석 시작${NC}"
    
    cat > "$comparison_file" << EOF
# AI 교차검증 시스템 비교 분석

## 실행 정보
- **분석 시간**: $(date '+%Y-%m-%d %H:%M:%S')
- **Task 결과**: $(basename "$task_output")
- **CLI 결과**: $(basename "$cli_output")

## Task 시스템 검증
\`\`\`
$(cat "$task_output" 2>/dev/null | head -10)
\`\`\`

## AI CLI 래퍼 검증
\`\`\`
$(cat "$cli_output" 2>/dev/null | head -20)
\`\`\`

## 비교 분석

### Task 시스템
**장점**:
- 🎯 Claude Code 네이티브 통합
- 🔗 MCP 서버 완전 활용
- 📋 체계적인 서브에이전트 활용

**단점**:
- ⚠️ 사용자 수동 실행 필요
- 🔧 복잡한 설정 과정

### AI CLI 래퍼
**장점**:
- 🚀 독립적 자동 실행
- ⚡ 빠른 응답 ($(cat "$cli_output" | grep "검증 완료" | grep -o "[0-9]*초" || echo "N/A"))
- 🛡️ ANSI 필터링 적용

**단점**:
- ❌ Codex CLI 호환성 문제
- 📁 파일 처리 제한적
- 🔍 검증 깊이 제한

## 권장사항
- **복잡한 검증**: Task 시스템 사용
- **빠른 확인**: AI CLI 래퍼 사용
- **하이브리드**: 두 방식 병행 활용
EOF

    log_message "${GREEN}✅ 비교 분석 완료: $(basename "$comparison_file")${NC}"
    echo "$comparison_file"
}

# 하이브리드 검증 실행
execute_hybrid_verification() {
    local file="$1"
    
    if [ ! -f "$file" ]; then
        log_message "${RED}❌ 파일을 찾을 수 없습니다: $file${NC}"
        return 1
    fi
    
    local level=$(determine_verification_level "$file")
    
    log_message "${BLUE}🔄 하이브리드 AI 교차검증 시작${NC}"
    log_message "${YELLOW}📄 대상 파일: $(basename "$file") ($(wc -l "$file" | awk '{print $1}')줄, Level $level)${NC}"
    
    # 양쪽 방식 병렬 실행
    echo -e "${CYAN}=== 방식 1: Task 시스템 ====${NC}"
    local task_result=$(execute_task_verification "$file" "$level")
    
    echo -e "${CYAN}=== 방식 2: AI CLI 래퍼 ====${NC}"
    local cli_result=$(execute_cli_verification "$file" "$level")
    
    echo -e "${CYAN}=== 결과 비교 분석 ====${NC}"
    local comparison_result=$(compare_verification_results "$task_result" "$cli_result")
    
    log_message "${GREEN}🎉 하이브리드 검증 완료${NC}"
    echo -e "${YELLOW}📊 결과 파일들:${NC}"
    echo "  - Task 결과: $task_result"
    echo "  - CLI 결과: $cli_result"
    echo "  - 비교 분석: $comparison_result"
    
    # 요약 출력
    echo -e "${PURPLE}📋 검증 요약:${NC}"
    echo "  - 검증 파일: $(basename "$file")"
    echo "  - 검증 레벨: $level"
    echo "  - Task 시스템: 사용자 실행 대기"
    echo "  - AI CLI 래퍼: 자동 완료"
    echo "  - 비교 분석: 생성 완료"
}

# 사용법
usage() {
    echo -e "${BLUE}🔄 하이브리드 AI 교차검증 시스템 v3.0${NC}"
    echo
    echo -e "${GREEN}사용법:${NC}"
    echo "  $0 <파일경로>                    # 하이브리드 검증 실행"
    echo "  $0 task <파일경로>               # Task 시스템만 실행"
    echo "  $0 cli <파일경로>                # AI CLI 래퍼만 실행"
    echo "  $0 compare <task결과> <cli결과>  # 결과 비교만 실행"
    echo
    echo -e "${GREEN}예시:${NC}"
    echo "  $0 src/app/api/admin/backup-status/route.ts"
    echo "  $0 task src/lib/utils.ts"
    echo "  $0 cli src/components/ui/button.tsx"
    echo
    echo -e "${YELLOW}💡 Task와 AI CLI 래퍼를 모두 활용한 완전한 교차검증${NC}"
}

# 메인 실행 로직
case "$1" in
    "task")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ 파일 경로를 지정해주세요${NC}"
            usage
            exit 1
        fi
        level=$(determine_verification_level "$2")
        execute_task_verification "$2" "$level"
        ;;
    "cli")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ 파일 경로를 지정해주세요${NC}"
            usage
            exit 1
        fi
        level=$(determine_verification_level "$2")
        execute_cli_verification "$2" "$level"
        ;;
    "compare")
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo -e "${RED}❌ Task 결과와 CLI 결과 파일을 모두 지정해주세요${NC}"
            usage
            exit 1
        fi
        compare_verification_results "$2" "$3"
        ;;
    "")
        usage
        ;;
    *)
        # 기본: 하이브리드 검증
        execute_hybrid_verification "$1"
        ;;
esac