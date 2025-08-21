#!/bin/bash

# 🧪 AI 교차 검증 시스템 테스트 실행
#
# 테스트 시나리오:
# 1. 테스트 파일 생성 트리거
# 2. 자동 검증 실행
# 3. 결과 수집 및 분석

set -e

# === 설정 ===
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
TEST_FILE="$CLAUDE_DIR/test/verification-test.ts"
LOG_FILE="$CLAUDE_DIR/verification.log"
REPORT_DIR="$CLAUDE_DIR/reports"

# === 색상 코드 ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# === 함수 정의 ===

# 로그 출력
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

# 성공 메시지
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 경고 메시지
warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# 에러 메시지
error() {
    echo -e "${RED}❌ $1${NC}"
}

# === 메인 테스트 로직 ===

log "${PURPLE}🧪 AI 교차 검증 시스템 테스트 시작${NC}"
echo "================================================"

# 1. 테스트 환경 준비
log "1️⃣ 테스트 환경 준비 중..."

# 로그 디렉토리 생성
mkdir -p "$REPORT_DIR"

# 이전 로그 백업
if [ -f "$LOG_FILE" ]; then
    mv "$LOG_FILE" "$LOG_FILE.$(date +%Y%m%d_%H%M%S).backup"
fi

success "테스트 환경 준비 완료"

# 2. Hook 트리거 시뮬레이션
log "2️⃣ Hook 트리거 시뮬레이션..."

# cross-verification.sh 직접 실행
bash "$CLAUDE_DIR/hooks/cross-verification.sh" "$TEST_FILE" "Write" "Test file created"

success "Hook 트리거 완료"

# 3. 검증 큐 확인
log "3️⃣ 검증 큐 상태 확인..."

if [ -f "$CLAUDE_DIR/cross-verification-queue.txt" ]; then
    QUEUE_COUNT=$(wc -l < "$CLAUDE_DIR/cross-verification-queue.txt")
    log "대기 중인 파일: $QUEUE_COUNT개"
    cat "$CLAUDE_DIR/cross-verification-queue.txt"
else
    warning "검증 큐 파일이 없습니다"
fi

# 4. 각 AI별 테스트 (시뮬레이션)
log "4️⃣ AI별 검증 시뮬레이션..."

echo ""
echo "🤖 Claude 검증 (Task 명령어):"
echo "Task verification-specialist '$TEST_FILE 검증'"
echo ""

echo "🌟 Gemini 검증 (외부 CLI):"
echo "Task unified-ai-wrapper \"gemini '$TEST_FILE' 아키텍처 분석\""
echo ""

echo "🤖 Codex 검증 (외부 CLI):"
echo "Task unified-ai-wrapper \"codex-cli '$TEST_FILE' 보안 검토\""
echo ""

echo "⚡ Qwen 검증 (외부 CLI):"
echo "Task unified-ai-wrapper \"qwen '$TEST_FILE' 알고리즘 최적화\""
echo ""

# 5. 예상 결과 출력
log "5️⃣ 예상 검증 결과..."

cat << EOF

${YELLOW}📊 예상 발견 문제:${NC}

${GREEN}Claude가 찾을 문제:${NC}
  ✓ any 타입 사용 (3곳)
  ✓ useEffect 의존성 배열 누락
  ✓ TypeScript strict 모드 위반

${GREEN}Gemini가 찾을 문제:${NC}
  ✓ 단일 책임 원칙 위반 (UserManagerAndEmailSenderAndLogger)
  ✓ 클래스 설계 문제
  ✓ 아키텍처 복잡도

${GREEN}Codex가 찾을 문제:${NC}
  ✓ eval() 사용 (XSS 위험)
  ✓ dangerouslySetInnerHTML 사용
  ✓ 하드코딩된 API 키
  ✓ 메모리 누수 (이벤트 리스너)
  ✓ 환경변수 노출

${GREEN}Qwen이 찾을 문제:${NC}
  ✓ O(n^3) 복잡도 알고리즘
  ✓ 비효율적인 정렬 (Bubble sort)
  ✓ 중복 제거 알고리즘 최적화 필요

${PURPLE}🔄 교차 검증 예상:${NC}
  • 하드코딩된 API 키: 모든 AI가 발견
  • eval() 사용: Codex, Claude가 발견
  • 타입 문제: Claude 전용
  • 아키텍처: Gemini 전용
  • 알고리즘: Qwen 전용

EOF

# 6. 실제 검증 실행 제안
log "6️⃣ 실제 검증 실행 방법..."

cat << EOF

${PURPLE}🚀 실제 검증 실행하기:${NC}

1. ${YELLOW}Level 1 (빠른 검증):${NC}
   Task auto-verification-trigger "Level 1"

2. ${YELLOW}Level 2 (표준 검증):${NC}
   Task auto-verification-trigger "Level 2"

3. ${YELLOW}Level 3 (완전 교차 검증):${NC}
   Task auto-verification-trigger "Level 3 교차 검증"

4. ${YELLOW}수동 교차 검증:${NC}
   Task external-ai-orchestrator "
     $TEST_FILE에 대해 4-AI 교차 검증:
     1. Claude 초기 검증
     2. Gemini, Codex, Qwen 병렬 검증
     3. 교차 발견사항 분석
     4. 최종 보고서 생성
   "

EOF

# 7. 로그 확인
log "7️⃣ 로그 파일 확인..."

if [ -f "$CLAUDE_DIR/cross-verification.log" ]; then
    echo "최근 로그 (마지막 10줄):"
    tail -10 "$CLAUDE_DIR/cross-verification.log"
else
    warning "cross-verification.log 파일이 없습니다"
fi

echo ""
echo "================================================"
success "${PURPLE}🧪 테스트 설정 완료!${NC}"
echo ""
echo "이제 위의 Task 명령어들을 실행하여 실제 검증을 수행하세요."
echo "결과는 $LOG_FILE 에 기록됩니다."

exit 0