#!/bin/bash

# ============================================================================
# Test Review Report Generator (Post-Commit Background)
# ============================================================================
# 설명: 변경된 소스 파일에 대한 테스트 커버리지 리포트 생성
#       테스트를 직접 수정하지 않고, 상세 분석 리포트만 출력
# 버전: 1.0.0
# 작성일: 2025-12-10
# ============================================================================

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 프로젝트 루트 경로
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
REPORT_DIR="${PROJECT_ROOT}/logs/test-review-reports"

# 로그 디렉토리 생성
mkdir -p "$REPORT_DIR"

# 오래된 리포트 정리 (7일 이상)
find "$REPORT_DIR" -name "test-review-*.md" -mtime +7 -delete 2>/dev/null || true

# 타임스탬프
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
REPORT_FILE="${REPORT_DIR}/test-review-${TIMESTAMP}.md"

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
# 테스트 파일 매핑
# ============================================================================

get_test_file_path() {
  local src_file="$1"

  # src/foo/bar.ts -> tests/unit/foo/bar.test.ts
  local test_file=$(echo "$src_file" | sed 's|^src/|tests/unit/|' | sed 's|\.tsx\?$|.test.ts|')
  echo "$test_file"
}

get_test_file_path_tsx() {
  local src_file="$1"

  # src/foo/bar.tsx -> tests/unit/foo/bar.test.tsx
  local test_file=$(echo "$src_file" | sed 's|^src/|tests/unit/|' | sed 's|\.tsx\?$|.test.tsx|')
  echo "$test_file"
}

# ============================================================================
# 테스트 커버리지 분석 (간략)
# ============================================================================

analyze_test_coverage() {
  local src_file="$1"
  local test_file="$2"

  if [ ! -f "$PROJECT_ROOT/$test_file" ]; then
    echo "MISSING"
    return
  fi

  # 테스트 파일의 테스트 케이스 수 카운트
  local test_count=$(grep -cE "(it|test)\s*\(" "$PROJECT_ROOT/$test_file" 2>/dev/null || echo "0")

  # 소스 파일의 export된 함수/클래스 수 카운트
  local export_count=$(grep -cE "^export\s+(function|const|class|async function)" "$PROJECT_ROOT/$src_file" 2>/dev/null || echo "0")

  if [ "$export_count" -eq 0 ]; then
    echo "OK"  # export 없으면 OK
    return
  fi

  # 간단한 비율 계산 (테스트 수 / export 수)
  local ratio=$((test_count * 100 / export_count))

  if [ "$ratio" -ge 70 ]; then
    echo "OK"
  elif [ "$ratio" -ge 30 ]; then
    echo "PARTIAL"
  else
    echo "LOW"
  fi
}

# ============================================================================
# 리포트 생성
# ============================================================================

generate_report() {
  log_info "테스트 검토 리포트 생성 시작..."

  local CHANGED_FILES=$(get_changed_files)
  local SRC_FILES=$(echo "$CHANGED_FILES" | grep -E "^src/.*\.(ts|tsx)$" || true)
  local TEST_FILES=$(echo "$CHANGED_FILES" | grep -E "^tests/.*\.(test|spec)\.(ts|tsx)$" || true)

  # 리포트 헤더
  cat > "$REPORT_FILE" << EOF
# 📊 테스트 검토 리포트

**생성 시간**: $(date +"%Y-%m-%d %H:%M:%S")
**커밋**: $(git rev-parse --short HEAD 2>/dev/null || echo "N/A")
**브랜치**: $(git branch --show-current 2>/dev/null || echo "N/A")

---

## 📈 요약

EOF

  local TOTAL_SRC=0
  local MISSING_TESTS=0
  local LOW_COVERAGE=0
  local PARTIAL_COVERAGE=0
  local OK_TESTS=0

  # 파일별 상세 분석
  local DETAILS=""

  if [ -z "$SRC_FILES" ]; then
    cat >> "$REPORT_FILE" << EOF
소스 파일 변경 없음 - 테스트 검토 불필요

---

✅ **결과**: PASS (변경 없음)
EOF
    log_success "테스트 검토 완료 - 소스 파일 변경 없음"
    echo "$REPORT_FILE"
    return
  fi

  for src_file in $SRC_FILES; do
    TOTAL_SRC=$((TOTAL_SRC + 1))

    local test_file=$(get_test_file_path "$src_file")
    local test_file_tsx=$(get_test_file_path_tsx "$src_file")

    local actual_test_file=""
    local status="MISSING"

    # 테스트 파일 존재 여부 확인
    if [ -f "$PROJECT_ROOT/$test_file" ]; then
      actual_test_file="$test_file"
      status=$(analyze_test_coverage "$src_file" "$test_file")
    elif [ -f "$PROJECT_ROOT/$test_file_tsx" ]; then
      actual_test_file="$test_file_tsx"
      status=$(analyze_test_coverage "$src_file" "$test_file_tsx")
    fi

    # 상태별 카운트
    case $status in
      MISSING)
        MISSING_TESTS=$((MISSING_TESTS + 1))
        DETAILS="${DETAILS}\n| ❌ | \`$src_file\` | 테스트 없음 | \`$test_file\` 생성 필요 |"
        ;;
      LOW)
        LOW_COVERAGE=$((LOW_COVERAGE + 1))
        DETAILS="${DETAILS}\n| ⚠️ | \`$src_file\` | 커버리지 낮음 (<30%) | 테스트 케이스 추가 권장 |"
        ;;
      PARTIAL)
        PARTIAL_COVERAGE=$((PARTIAL_COVERAGE + 1))
        DETAILS="${DETAILS}\n| 🔸 | \`$src_file\` | 부분 커버리지 (30-70%) | 추가 테스트 고려 |"
        ;;
      OK)
        OK_TESTS=$((OK_TESTS + 1))
        DETAILS="${DETAILS}\n| ✅ | \`$src_file\` | 충분 (70%+) | - |"
        ;;
    esac
  done

  # 요약 통계
  cat >> "$REPORT_FILE" << EOF
| 항목 | 수 |
|------|-----|
| 변경된 소스 파일 | $TOTAL_SRC |
| ✅ 테스트 충분 | $OK_TESTS |
| 🔸 부분 커버리지 | $PARTIAL_COVERAGE |
| ⚠️ 낮은 커버리지 | $LOW_COVERAGE |
| ❌ 테스트 없음 | $MISSING_TESTS |

---

## 📋 파일별 상세

| 상태 | 소스 파일 | 테스트 상태 | 권장 사항 |
|------|----------|------------|----------|$(echo -e "$DETAILS")

---

## 💡 권장 액션

EOF

  # 권장 액션 생성
  if [ $MISSING_TESTS -gt 0 ]; then
    cat >> "$REPORT_FILE" << EOF
### 테스트 생성 필요 ($MISSING_TESTS개 파일)

\`\`\`bash
# Claude Code에서 테스트 생성:
claude "변경된 파일의 누락된 테스트를 생성해주세요"
\`\`\`

EOF
  fi

  if [ $LOW_COVERAGE -gt 0 ]; then
    cat >> "$REPORT_FILE" << EOF
### 커버리지 개선 필요 ($LOW_COVERAGE개 파일)

기존 테스트 파일에 테스트 케이스 추가 권장

EOF
  fi

  # 최종 결과
  local RESULT="PASS"
  if [ $MISSING_TESTS -gt 0 ] || [ $LOW_COVERAGE -gt 0 ]; then
    RESULT="WARN"
  fi

  cat >> "$REPORT_FILE" << EOF
---

## 🎯 최종 결과

**$RESULT** - $([ "$RESULT" = "PASS" ] && echo "모든 변경사항에 적절한 테스트 존재" || echo "테스트 개선 권장 (차단 없음)")

> 💡 이 리포트는 참고용입니다. push는 차단되지 않습니다.
> 📁 리포트 위치: \`logs/test-review-reports/\`
EOF

  log_success "테스트 검토 리포트 생성 완료"
  echo ""
  echo "📊 리포트: $REPORT_FILE"
  echo ""

  # 콘솔 요약 출력
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}📊 테스트 검토 요약${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "  총 파일: $TOTAL_SRC"
  echo -e "  ✅ 충분: $OK_TESTS"
  echo -e "  🔸 부분: $PARTIAL_COVERAGE"
  echo -e "  ⚠️ 낮음: $LOW_COVERAGE"
  echo -e "  ❌ 없음: $MISSING_TESTS"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  echo "$REPORT_FILE"
}

# ============================================================================
# 메인 실행
# ============================================================================

main() {
  generate_report
}

# 스크립트 실행
main "$@"
