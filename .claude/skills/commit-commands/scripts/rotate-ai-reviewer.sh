#!/bin/bash
# AI 코드 리뷰 엔진 선택
# Usage: ./rotate-ai-reviewer.sh
# Returns: "claude" (default) or rotated "codex"/"gemini" for codex-gemini mode

set -e

REVIEW_MODE="${REVIEW_MODE:-claude}"
STATE_FILE="reports/ai-review/.last-engine"

# Ensure directory exists
mkdir -p "$(dirname "$STATE_FILE")"

# Claude 기본 모드: 로테이션 불필요
if [ "$REVIEW_MODE" = "claude" ]; then
  echo "claude"
  exit 0
fi

# codex-gemini 모드: 기존 로테이션 로직
LAST_ENGINE=$(cat "$STATE_FILE" 2>/dev/null || echo "gemini")

if [ "$LAST_ENGINE" = "codex" ]; then
  NEXT_ENGINE="gemini"
else
  NEXT_ENGINE="codex"
fi

echo "$NEXT_ENGINE"
