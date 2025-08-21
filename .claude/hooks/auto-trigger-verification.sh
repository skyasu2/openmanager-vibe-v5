#!/bin/bash

# 🚀 AI 교차 검증 자동 트리거
# 사용자 프롬프트에서 검증 요청을 감지하고 자동으로 적절한 서브에이전트 실행
#
# 인자:
# $1: 사용자 프롬프트

set -e

# === 설정 ===
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
VERIFICATION_LOG="$CLAUDE_DIR/verification.log"
QUEUE_FILE="$CLAUDE_DIR/cross-verification-queue.txt"

# === 색상 코드 ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# === 함수 정의 ===

# 로그 기록
log_message() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $message" >> "$VERIFICATION_LOG"
    echo -e "$message"
}

# 프롬프트 분석 및 검증 레벨 결정
analyze_prompt() {
    local prompt="$1"
    
    # Level 3 트리거 키워드
    if echo "$prompt" | grep -qiE "(전체|완전|full|complete|교차.*검증|cross.*verif|4.*AI|보안|security|critical)"; then
        echo "LEVEL_3"
        return
    fi
    
    # Level 2 트리거 키워드
    if echo "$prompt" | grep -qiE "(표준|standard|병렬|parallel|2.*AI)"; then
        echo "LEVEL_2"
        return
    fi
    
    # Level 1 (기본값)
    echo "LEVEL_1"
}

# 대기 중인 파일 가져오기
get_pending_files() {
    if [ -f "$QUEUE_FILE" ]; then
        # 최근 5개 파일만 처리
        tail -5 "$QUEUE_FILE" | cut -d':' -f1 | sort -u
    fi
}

# === 메인 로직 ===

PROMPT="${1:-}"

log_message "${PURPLE}🚀 AI 교차 검증 자동 트리거 활성화${NC}"
log_message "${BLUE}📝 프롬프트: $PROMPT${NC}"

# 1. 검증 레벨 결정
VERIFY_LEVEL=$(analyze_prompt "$PROMPT")
log_message "📊 결정된 검증 레벨: $VERIFY_LEVEL"

# 2. 대기 중인 파일 확인
PENDING_FILES=$(get_pending_files)
FILE_COUNT=$(echo "$PENDING_FILES" | wc -l)

if [ -z "$PENDING_FILES" ]; then
    log_message "${YELLOW}⚠️ 검증 대기 중인 파일이 없습니다.${NC}"
    
    # 최근 수정된 파일 찾기
    RECENT_FILES=$(find "$PROJECT_ROOT/src" -type f \( -name "*.ts" -o -name "*.tsx" \) -mmin -10 2>/dev/null | head -5)
    
    if [ -n "$RECENT_FILES" ]; then
        log_message "${GREEN}📂 최근 10분 내 수정된 파일 발견:${NC}"
        echo "$RECENT_FILES" | while read -r file; do
            echo "  - $file"
        done
        PENDING_FILES="$RECENT_FILES"
    fi
fi

# 3. 검증 레벨별 처리
case "$VERIFY_LEVEL" in
    LEVEL_1)
        log_message "${GREEN}✅ Level 1: 단일 AI 빠른 검증${NC}"
        cat << EOF

💡 다음 Task 명령어를 실행하세요:
Task verification-specialist "다음 파일들 빠른 검증:
$PENDING_FILES"

또는 개별 실행:
Task unified-ai-wrapper "gemini로 코드 검토"
EOF
        ;;
        
    LEVEL_2)
        log_message "${YELLOW}⚠️ Level 2: 2-AI 병렬 검증${NC}"
        cat << EOF

💡 다음 Task 명령어들을 병렬로 실행하세요:

# Claude + Gemini 교차 검증
Task verification-specialist "Level 2 검증 시작: $PENDING_FILES"
Task unified-ai-wrapper "
  gemini '아키텍처 관점 검토'
  codex-cli '실무 관점 검토'
"

# 결과 종합
Task external-ai-orchestrator "2-AI 교차 검증 결과 종합"
EOF
        ;;
        
    LEVEL_3)
        log_message "${RED}🚨 Level 3: 4-AI 완전 교차 검증${NC}"
        cat << EOF

🔄 완전 교차 검증 프로세스를 시작합니다:

# Phase 1: Claude 초기 검증
Task verification-specialist "Level 3 초기 검증: $PENDING_FILES"

# Phase 2: 외부 AI 독립 검증 (병렬 실행)
Task unified-ai-wrapper "
  병렬 실행:
  1. gemini '${PENDING_FILES}' - 아키텍처 문제 발견
  2. codex-cli '${PENDING_FILES}' - 보안 취약점 검토
  3. qwen '${PENDING_FILES}' - 알고리즘 최적화
"

# Phase 3: 교차 발견사항 분석
Task external-ai-orchestrator "
  교차 검증 분석:
  - Claude가 놓친 문제들
  - 각 AI의 고유 발견사항
  - 공통 지적사항
  - 상충되는 의견들
"

# Phase 4: 최종 보고서
Task verification-specialist "교차 검증 최종 보고서 생성"
EOF
        
        # 보안 패턴 추가 검사
        if echo "$PROMPT" | grep -qiE "(보안|security|auth|api|key)"; then
            log_message "${RED}🔐 보안 중점 검토 모드 활성화${NC}"
            echo "⚠️ 보안 패턴 중점 검사가 포함됩니다."
        fi
        ;;
esac

# 4. 검증 통계 출력
log_message "${BLUE}📊 검증 통계:${NC}"
echo "  - 대기 파일: $FILE_COUNT개"
echo "  - 검증 레벨: $VERIFY_LEVEL"
echo "  - 예상 시간: $([ "$VERIFY_LEVEL" = "LEVEL_3" ] && echo "4-5분" || echo "1-2분")"

# 5. 자동 실행 힌트
cat << EOF

🎯 자동 실행 팁:
1. 위 Task 명령어들을 순서대로 실행
2. 병렬 실행 가능한 부분은 동시에 실행
3. 결과는 .claude/verification.log에 자동 기록

💡 간편 명령어:
- 빠른 검증: Task verification-specialist "빠른 검증"
- 표준 검증: Task external-ai-orchestrator "Level 2"
- 완전 검증: Task external-ai-orchestrator "Level 3 교차 검증"
EOF

log_message "${GREEN}✅ 자동 트리거 완료${NC}"

exit 0