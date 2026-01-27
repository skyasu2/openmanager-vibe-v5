#!/bin/bash
# AI 리뷰 결과 저장
# Usage: ./save-review-result.sh <engine>
# Example: ./save-review-result.sh codex

set -e

ENGINE="${1:-unknown}"
STATE_FILE="reports/ai-review/.last-engine"

# Ensure directory exists
mkdir -p "$(dirname "$STATE_FILE")"

# Save last used engine
echo "$ENGINE" > "$STATE_FILE"

echo "Saved: $ENGINE as last review engine"
