#!/bin/bash
# AI 코드 리뷰 엔진 로테이션 (Codex <-> Gemini)
# Usage: ./rotate-ai-reviewer.sh
# Returns: "codex" or "gemini" (next engine to use)

set -e

STATE_FILE="reports/ai-review/.last-engine"

# Ensure directory exists
mkdir -p "$(dirname "$STATE_FILE")"

# Read last used engine (default to gemini if not set)
LAST_ENGINE=$(cat "$STATE_FILE" 2>/dev/null || echo "gemini")

# Rotate to next engine
if [ "$LAST_ENGINE" = "codex" ]; then
  NEXT_ENGINE="gemini"
else
  NEXT_ENGINE="codex"
fi

echo "$NEXT_ENGINE"
