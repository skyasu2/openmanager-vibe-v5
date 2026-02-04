#!/bin/bash

# Validation Summary Creator
# 목적: 모든 검증 결과를 통합하여 Claude Code가 분석할 수 있는 요약 생성
# 버전: 1.0.0
# 날짜: 2025-11-27

set -euo pipefail

# 작업 디렉토리 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# 타임스탬프 생성
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# 저장 디렉토리 (프로젝트 내부로 변경)
VALIDATION_DIR="$PROJECT_ROOT/logs/validation"
mkdir -p "$VALIDATION_DIR"

SUMMARY_FILE="$VALIDATION_DIR/validation-complete-${TIMESTAMP}.md"

echo "📊 Creating validation summary..."

# 최신 리포트 파일 찾기
LATEST_LINT=$(ls -t logs/lint-reports/lint-*.md 2>/dev/null | head -1 || echo "")
LATEST_TYPECHECK=$(ls -t logs/typecheck-reports/typecheck-*.md 2>/dev/null | head -1 || echo "")
LATEST_REVIEW=$(ls -t reports/ai-review/pending/review-*.md reports/ai-review/history/*/review-*.md 2>/dev/null | head -1 || echo "")

# 요약 파일 생성
{
  echo "# 🤖 검증 완료 알림"
  echo ""
  echo "**날짜**: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "**커밋**: $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
  echo ""
  echo "---"
  echo ""
  echo "## 📋 생성된 리포트"
  echo ""

  # ESLint 리포트
  if [ -n "$LATEST_LINT" ] && [ -f "$LATEST_LINT" ]; then
    echo "### 🔍 Biome Lint 검사"
    echo ""
    echo "**파일**: \`$LATEST_LINT\`"
    echo ""
    echo "<details>"
    echo "<summary>결과 미리보기</summary>"
    echo ""
    echo '```'
    tail -20 "$LATEST_LINT"
    echo '```'
    echo ""
    echo "</details>"
    echo ""
  else
    echo "### 🔍 Biome Lint 검사"
    echo ""
    echo "⚠️  리포트 파일을 찾을 수 없습니다."
    echo ""
  fi

  # TypeScript 리포트
  if [ -n "$LATEST_TYPECHECK" ] && [ -f "$LATEST_TYPECHECK" ]; then
    echo "### 📝 TypeScript 타입 체크"
    echo ""
    echo "**파일**: \`$LATEST_TYPECHECK\`"
    echo ""
    echo "<details>"
    echo "<summary>결과 미리보기</summary>"
    echo ""
    echo '```'
    tail -20 "$LATEST_TYPECHECK"
    echo '```'
    echo ""
    echo "</details>"
    echo ""
  else
    echo "### 📝 TypeScript 타입 체크"
    echo ""
    echo "⚠️  리포트 파일을 찾을 수 없습니다."
    echo ""
  fi

  # AI 리뷰 리포트
  if [ -n "$LATEST_REVIEW" ] && [ -f "$LATEST_REVIEW" ]; then
    echo "### 🤖 AI 코드 리뷰"
    echo ""
    echo "**파일**: \`$LATEST_REVIEW\`"
    echo ""
    echo "<details>"
    echo "<summary>결과 미리보기</summary>"
    echo ""
    echo '```'
    head -30 "$LATEST_REVIEW"
    echo '```'
    echo ""
    echo "</details>"
    echo ""
  else
    echo "### 🤖 AI 코드 리뷰"
    echo ""
    echo "⚠️  리포트 파일을 찾을 수 없습니다."
    echo ""
  fi

  echo "---"
  echo ""
  echo "## 💡 Claude Code 분석 요청"
  echo ""
  echo "다음 명령어로 Claude Code에게 분석을 요청하세요:"
  echo ""
  echo '```bash'
  echo "# 통합 요약 분석"
  echo "cat $SUMMARY_FILE"
  echo ""
  echo "# 또는 개별 리포트 분석"
  if [ -n "$LATEST_LINT" ]; then
    echo "cat $LATEST_LINT  # Biome Lint 결과"
  fi
  if [ -n "$LATEST_TYPECHECK" ]; then
    echo "cat $LATEST_TYPECHECK  # TypeScript 결과"
  fi
  if [ -n "$LATEST_REVIEW" ]; then
    echo "cat $LATEST_REVIEW  # AI 리뷰 결과"
  fi
  echo '```'
  echo ""
  echo "---"
  echo ""
  echo "**생성 시간**: $(date '+%Y-%m-%d %H:%M:%S')"

} > "$SUMMARY_FILE"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎉 터미널 알림 (사용자 친화적 메시지)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  ✅ 백그라운드 검증 완료!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 생성된 리포트:"
echo ""
echo "  1️⃣  통합 요약: logs/validation/validation-complete-latest.md"
echo "  2️⃣  리뷰 요청: logs/validation/claude_code_review_request_latest.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Claude Code에게 다음과 같이 요청하세요:"
echo ""
echo '  📝 간단: "검증 결과 분석해줘"'
echo ""
echo '  📖 상세: "cat logs/validation/claude_code_review_request_latest.md"'
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🤖 역할 분담:"
echo "  • Claude Code: AI 리뷰 + 리뷰 결과 분석 및 코드 개선 ⏳ (당신 차례!)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 심볼릭 링크 생성 (최신 요약)
ln -sf "$SUMMARY_FILE" "$VALIDATION_DIR/validation-complete-latest.md"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🤖 Claude Code 자동 리뷰 요청 파일 생성
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REVIEW_REQUEST_FILE="$VALIDATION_DIR/claude_code_review_request_${TIMESTAMP}.md"

echo "🤖 Creating Claude Code review request..."

{
  echo "# 🤖 Claude Code 리뷰 요청"
  echo ""
  echo "**생성 시간**: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "**커밋**: $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
  echo "**브랜치**: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'N/A')"
  echo ""
  echo "---"
  echo ""
  echo "## 📋 검증 결과 요약"
  echo ""
  echo "**역할 분담**:"
  echo "- 🤖 **Claude Code**: AI 리뷰 실행 (기본 엔진)"
  echo "- 🧠 **Claude Code**: 리뷰 결과 분석 및 코드 개선 적용 (당신의 역할)"
  echo ""

  # Biome Lint 결과 요약
  if [ -n "$LATEST_LINT" ] && [ -f "$LATEST_LINT" ]; then
    echo "### 🔍 Biome Lint"
    if grep -q "✅" "$LATEST_LINT"; then
      echo "- ✅ 통과"
    else
      echo "- ⚠️ 경고/오류 발견"
    fi
    echo "- 📄 상세: \`$LATEST_LINT\`"
    echo ""
  fi

  # TypeScript 결과 요약
  if [ -n "$LATEST_TYPECHECK" ] && [ -f "$LATEST_TYPECHECK" ]; then
    echo "### 📝 TypeScript"
    if grep -q "✅" "$LATEST_TYPECHECK"; then
      echo "- ✅ 타입 체크 통과"
    else
      echo "- ❌ 타입 오류 발견"
    fi
    echo "- 📄 상세: \`$LATEST_TYPECHECK\`"
    echo ""
  fi

  # AI 리뷰 결과 요약
  if [ -n "$LATEST_REVIEW" ] && [ -f "$LATEST_REVIEW" ]; then
    echo "### 🤖 AI 코드 리뷰 (Claude)"
    echo "- 📄 리뷰 파일: \`$LATEST_REVIEW\`"

    # 점수 추출 시도
    SCORE=$(grep -oP "점수.*?(\d+)/10" "$LATEST_REVIEW" | head -1 || echo "")
    if [ -n "$SCORE" ]; then
      echo "- 📊 $SCORE"
    fi

    # Critical 이슈 확인
    if grep -qi "critical\|심각\|보안" "$LATEST_REVIEW"; then
      echo "- 🔴 **Critical 이슈 발견됨**"
    fi
    echo ""
  fi

  echo "---"
  echo ""
  echo "## 💡 Claude Code 액션 아이템"
  echo ""
  echo "**당신의 역할**:"
  echo "1. 📖 위 리뷰 결과 파일들을 읽고 분석"
  echo "2. 🔍 Critical 이슈 우선 확인"
  echo "3. ✏️ 코드에 개선사항 적용"
  echo "4. ✅ 재검증 (필요 시)"
  echo ""
  echo "**권장 명령어**:"
  echo '```bash'
  echo "# 통합 분석 (Skill 활용)"
  echo '"검증 결과 분석해줘"'
  echo ""
  echo "# 또는 직접 읽기"
  echo "cat logs/validation/validation-complete-latest.md"
  echo '```'
  echo ""
  echo "---"
  echo ""
  echo "**전체 요약 파일**: \`$SUMMARY_FILE\`"
  echo ""
  echo "🚀 **준비 완료!** 위 명령어를 실행하여 분석을 시작하세요."

} > "$REVIEW_REQUEST_FILE"

# 심볼릭 링크 생성 (최신 리뷰 요청)
ln -sf "$REVIEW_REQUEST_FILE" "$VALIDATION_DIR/claude_code_review_request_latest.md"

exit 0
