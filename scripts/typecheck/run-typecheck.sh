#!/bin/bash

# TypeScript Type Check (Post-Commit Background)
# 목적: 커밋 후 전체 타입 체크 (타임아웃 없음, 백그라운드)
# 버전: 1.0.0
# 날짜: 2025-11-27

set -euo pipefail

# 작업 디렉토리 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# 로그 디렉토리 생성
LOG_DIR="$PROJECT_ROOT/logs/typecheck-reports"
mkdir -p "$LOG_DIR"

# 타임스탬프 생성
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
LOG_FILE="$LOG_DIR/typecheck-$TIMESTAMP.md"

echo "🔍 TypeScript 타입 체크 시작..."
echo "📂 로그 파일: $LOG_FILE"

# 시작 시간
START_TIME=$(date +%s)

# TypeScript 타입 체크 실행 (타임아웃 없음)
{
  echo "# TypeScript 타입 체크 결과"
  echo ""
  echo "**날짜**: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "**커밋**: $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
  echo ""
  echo "---"
  echo ""

  echo "## TypeScript 결과"
  echo ""
  echo '```'

  # TypeScript 타입 체크 실행
  if npm run type-check 2>&1; then
    echo "✅ TypeScript 타입 체크 통과"
  else
    echo "❌ TypeScript 타입 오류 발견됨"
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

echo "✅ TypeScript 타입 체크 완료 ($DURATION초)"
echo "📄 리포트: $LOG_FILE"
