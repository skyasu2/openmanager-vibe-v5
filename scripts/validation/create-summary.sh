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
SUMMARY_FILE="/tmp/validation-complete-${TIMESTAMP}.md"

echo "📊 Creating validation summary..."

# 최신 리포트 파일 찾기
LATEST_LINT=$(ls -t logs/lint-reports/lint-*.md 2>/dev/null | head -1 || echo "")
LATEST_TYPECHECK=$(ls -t logs/typecheck-reports/typecheck-*.md 2>/dev/null | head -1 || echo "")
LATEST_REVIEW=$(ls -t logs/code-reviews/review-*.md 2>/dev/null | head -1 || echo "")

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
    echo "### 🔍 ESLint 검사"
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
    echo "### 🔍 ESLint 검사"
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
    echo "cat $LATEST_LINT  # ESLint 결과"
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

# 터미널에 알림 출력
echo ""
echo "✅ 검증 요약 생성 완료!"
echo "📄 파일: $SUMMARY_FILE"
echo ""
echo "💡 Claude Code에게 다음과 같이 요청하세요:"
echo "   \"$SUMMARY_FILE 파일을 읽고 분석해줘\""
echo ""

# 심볼릭 링크 생성 (최신 요약)
ln -sf "$SUMMARY_FILE" "/tmp/validation-complete-latest.md"

exit 0
