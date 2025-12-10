#!/bin/bash

# ============================================================================
# Claude Subagent Pre-Push Checks
# ============================================================================
# 설명: Pre-Push Hook에서 Claude 서브에이전트 검사 실행
#       Claude Code 세션 외부에서 독립 프로세스로 실행
# 버전: 1.0.0
# 작성일: 2025-12-10
# ============================================================================

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 프로젝트 루트 경로
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
LOG_DIR="${PROJECT_ROOT}/logs/subagent-checks"

# 로그 디렉토리 생성
mkdir -p "$LOG_DIR"

# 타임스탬프
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")

# ============================================================================
# 유틸리티 함수
# ============================================================================

log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# ============================================================================
# 변경된 파일 감지
# ============================================================================

get_changed_files() {
  # origin/main과 현재 HEAD 사이의 변경된 파일
  git diff --name-only origin/main...HEAD 2>/dev/null || \
    git diff --name-only HEAD~1 --diff-filter=d 2>/dev/null || \
    echo ""
}

# ============================================================================
# 보안 검사 (security-specialist)
# ============================================================================

run_security_check() {
  log_info "보안 검사 시작 (Portfolio-Appropriate)..."

  local CHANGED_FILES=$(get_changed_files)
  local SRC_FILES=$(echo "$CHANGED_FILES" | grep -E "^src/.*\.(ts|tsx|js|jsx)$" || true)

  if [ -z "$SRC_FILES" ]; then
    log_success "보안 검사: 소스 파일 변경 없음 - PASS"
    return 0
  fi

  local SECURITY_LOG="${LOG_DIR}/security-${TIMESTAMP}.log"
  local BLOCKING_ISSUES=""
  local ADVISORY_ISSUES=""

  echo "=== Security Check Report ===" > "$SECURITY_LOG"
  echo "Timestamp: $TIMESTAMP" >> "$SECURITY_LOG"
  echo "Files Checked: $(echo "$SRC_FILES" | wc -l)" >> "$SECURITY_LOG"
  echo "" >> "$SECURITY_LOG"

  # Blocking Check 1: 하드코딩된 API 키/시크릿 (PUBLIC_ 제외)
  log_info "  체크: 하드코딩된 시크릿..."
  local SECRET_PATTERNS='(api[_-]?key|secret|password|token|credential).*=.*["\x27][a-zA-Z0-9]{20,}["\x27]'
  for file in $SRC_FILES; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
      local matches=$(grep -inE "$SECRET_PATTERNS" "$PROJECT_ROOT/$file" 2>/dev/null | grep -v "NEXT_PUBLIC_" | grep -v "PUBLIC_" || true)
      if [ -n "$matches" ]; then
        BLOCKING_ISSUES="${BLOCKING_ISSUES}\n⛔ 하드코딩된 시크릿 발견: $file\n$matches"
      fi
    fi
  done

  # Blocking Check 2: 민감 파일 커밋
  log_info "  체크: 민감 파일 커밋..."
  local SENSITIVE_FILES=$(echo "$CHANGED_FILES" | grep -E '\.(env|key|pem|credentials)$' || true)
  if [ -n "$SENSITIVE_FILES" ]; then
    BLOCKING_ISSUES="${BLOCKING_ISSUES}\n⛔ 민감 파일 커밋됨:\n$SENSITIVE_FILES"
  fi

  # Advisory Check 1: innerHTML 사용 (XSS 잠재적 위험)
  log_info "  체크: innerHTML 사용..."
  for file in $SRC_FILES; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
      local matches=$(grep -n "innerHTML" "$PROJECT_ROOT/$file" 2>/dev/null || true)
      if [ -n "$matches" ]; then
        ADVISORY_ISSUES="${ADVISORY_ISSUES}\n💡 innerHTML 사용 (XSS 주의): $file"
      fi
    fi
  done

  # Advisory Check 2: NEXT_PUBLIC_ 환경변수 (의도적 노출 확인)
  log_info "  체크: 환경변수 노출..."
  for file in $SRC_FILES; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
      local matches=$(grep -n "process\.env\." "$PROJECT_ROOT/$file" 2>/dev/null | grep -v "NEXT_PUBLIC_" || true)
      if [ -n "$matches" ]; then
        # 서버 컴포넌트가 아닌 경우만 경고
        if ! grep -q "'use server'" "$PROJECT_ROOT/$file" 2>/dev/null; then
          ADVISORY_ISSUES="${ADVISORY_ISSUES}\n💡 환경변수 사용 확인 필요: $file"
        fi
      fi
    fi
  done

  # 결과 판정
  echo "=== Results ===" >> "$SECURITY_LOG"

  if [ -n "$BLOCKING_ISSUES" ]; then
    echo -e "Blocking Issues:$BLOCKING_ISSUES" >> "$SECURITY_LOG"
    log_error "보안 검사 실패 - BLOCK"
    echo -e "$BLOCKING_ISSUES"
    return 1
  fi

  if [ -n "$ADVISORY_ISSUES" ]; then
    echo -e "Advisory Issues:$ADVISORY_ISSUES" >> "$SECURITY_LOG"
    log_warn "보안 검사 완료 - WARN (권장사항 있음)"
    echo -e "$ADVISORY_ISSUES"
    echo ""
    echo "상세 로그: $SECURITY_LOG"
    return 0  # Advisory는 차단하지 않음
  fi

  echo "Status: PASS" >> "$SECURITY_LOG"
  log_success "보안 검사 완료 - PASS"
  return 0
}

# ============================================================================
# 테스트 검토 (test-automation-specialist)
# ============================================================================

run_test_review() {
  log_info "테스트 검토 시작..."

  local CHANGED_FILES=$(get_changed_files)
  local SRC_FILES=$(echo "$CHANGED_FILES" | grep -E "^src/.*\.(ts|tsx)$" || true)
  local TEST_FILES=$(echo "$CHANGED_FILES" | grep -E "^tests/.*\.(test|spec)\.(ts|tsx)$" || true)

  if [ -z "$SRC_FILES" ]; then
    log_success "테스트 검토: 소스 파일 변경 없음 - PASS"
    return 0
  fi

  local TEST_LOG="${LOG_DIR}/test-review-${TIMESTAMP}.log"
  local MISSING_TESTS=""
  local ORPHANED_TESTS=""

  echo "=== Test Review Report ===" > "$TEST_LOG"
  echo "Timestamp: $TIMESTAMP" >> "$TEST_LOG"
  echo "Source Files Changed: $(echo "$SRC_FILES" | wc -l)" >> "$TEST_LOG"
  echo "Test Files Changed: $(echo "$TEST_FILES" | wc -l)" >> "$TEST_LOG"
  echo "" >> "$TEST_LOG"

  # 소스 파일에 대한 테스트 존재 여부 확인
  log_info "  체크: 테스트 파일 매핑..."
  for src_file in $SRC_FILES; do
    # src/foo/bar.ts -> tests/unit/foo/bar.test.ts
    local test_file=$(echo "$src_file" | sed 's|^src/|tests/unit/|' | sed 's|\.tsx\?$|.test.ts|')

    if [ ! -f "$PROJECT_ROOT/$test_file" ]; then
      # 대안 경로 확인
      local alt_test_file=$(echo "$src_file" | sed 's|^src/|tests/unit/|' | sed 's|\.tsx\?$|.test.tsx|')
      if [ ! -f "$PROJECT_ROOT/$alt_test_file" ]; then
        MISSING_TESTS="${MISSING_TESTS}\n❌ 테스트 없음: $src_file"
      fi
    fi
  done

  # 결과 판정
  echo "=== Results ===" >> "$TEST_LOG"

  if [ -n "$MISSING_TESTS" ]; then
    echo -e "Missing Tests:$MISSING_TESTS" >> "$TEST_LOG"
    log_warn "테스트 검토 완료 - WARN (테스트 누락)"
    echo -e "$MISSING_TESTS"
    echo ""
    echo "💡 권장: test-automation-specialist 서브에이전트로 테스트 자동 생성"
    echo "   claude -p \"Task test-automation-specialist 변경된 파일의 테스트를 검토하고 생성해주세요\""
    echo ""
    echo "상세 로그: $TEST_LOG"
    return 0  # 테스트 누락은 차단하지 않음 (포트폴리오 프로젝트)
  fi

  echo "Status: PASS" >> "$TEST_LOG"
  log_success "테스트 검토 완료 - PASS"
  return 0
}

# ============================================================================
# 메인 실행
# ============================================================================

main() {
  local QUICK_MODE=false

  # 인자 파싱
  while [[ $# -gt 0 ]]; do
    case $1 in
      --quick|-q)
        QUICK_MODE=true
        shift
        ;;
      *)
        shift
        ;;
    esac
  done

  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  if [ "$QUICK_MODE" = true ]; then
    echo -e "${BLUE}🔍 Claude Subagent Quick Check (Security Only)${NC}"
  else
    echo -e "${BLUE}🔍 Claude Subagent Pre-Push Checks${NC}"
  fi
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  local START_TIME=$(date +%s)
  local SECURITY_RESULT=0
  local TEST_RESULT=0

  # 1. 보안 검사 (항상 실행)
  run_security_check || SECURITY_RESULT=$?
  echo ""

  # 2. 테스트 검토 (--quick 모드에서는 스킵)
  if [ "$QUICK_MODE" = true ]; then
    log_info "테스트 검토 스킵 (--quick 모드)"
  else
    run_test_review || TEST_RESULT=$?
  fi
  echo ""

  local END_TIME=$(date +%s)
  local DURATION=$((END_TIME - START_TIME))

  # 최종 결과
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}📊 검사 결과 요약 (${DURATION}초)${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  if [ $SECURITY_RESULT -eq 0 ]; then
    echo -e "  ✅ 보안 검사: PASS"
  else
    echo -e "  ❌ 보안 검사: BLOCK"
  fi

  if [ $TEST_RESULT -eq 0 ]; then
    echo -e "  ✅ 테스트 검토: PASS"
  else
    echo -e "  ⚠️  테스트 검토: WARN"
  fi

  echo ""

  # 보안 검사 실패 시에만 차단
  if [ $SECURITY_RESULT -ne 0 ]; then
    log_error "Push 차단됨 - 보안 이슈 해결 필요"
    echo ""
    echo "💡 보안 이슈 해결 후 다시 push 하세요"
    echo "   또는: SKIP_SUBAGENT_CHECKS=true git push"
    exit 1
  fi

  log_success "Subagent checks 완료 - Push 허용"
  exit 0
}

# 스크립트 실행
main "$@"
