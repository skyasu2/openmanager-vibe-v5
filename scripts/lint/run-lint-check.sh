#!/bin/bash

# Biome Comprehensive Check (Post-Commit Background)
# 목적: 커밋 후 전체 Biome 검사 (타임아웃 없음, 백그라운드)
# 버전: 2.0.0
# 날짜: 2025-11-30

set -euo pipefail

# 작업 디렉토리 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# 로그 디렉토리 생성
LOG_DIR="$PROJECT_ROOT/logs/lint-reports"
mkdir -p "$LOG_DIR"

# 타임스탬프 생성
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
LOG_FILE="$LOG_DIR/lint-$TIMESTAMP.md"

echo "🔍 Biome 전체 검사 시작..."
echo "📂 로그 파일: $LOG_FILE"

# 시작 시간
START_TIME=$(date +%s)

# Biome 실행 (타임아웃 없음, 전체 검사)
{
  echo "# Biome 검사 결과"
  echo ""
  echo "**날짜**: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "**커밋**: $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
  echo ""
  echo "---"
  echo ""

  # 변경된 파일 목록
  CHANGED_FILES=$(git diff --name-only HEAD~1 2>/dev/null | grep -E '\.(ts|tsx|js|jsx|json|css)$' || true)

  if [ -n "$CHANGED_FILES" ]; then
    echo "## 변경된 파일"
    echo ""
    echo '```'
    echo "$CHANGED_FILES"
    echo '```'
    echo ""
  fi

  echo "## Biome 결과"
  echo ""
  echo '```'

  # Biome 실행 (Check & Format)
  if npx @biomejs/biome check . 2>&1; then
    echo "✅ Biome 검사 통과 (경고 없음)"
  else
    echo "⚠️  Biome 경고/오류 발견됨"
  fi

  echo '```'
  echo ""

  # 종료 시간
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))

  echo "---"
  echo ""
  echo "**실행 시간**: ${DURATION}초"

} > "$LOG_FILE" 2>&1

echo "✅ Biome 검사 완료 ($DURATION초)"
echo "📄 리포트: $LOG_FILE"
