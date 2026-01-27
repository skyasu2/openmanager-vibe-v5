#!/bin/bash
# AI 리뷰 파일을 history로 이동
# Usage: ./move-to-history.sh <review-file-path>
# Example: ./move-to-history.sh reports/ai-review/pending/review-codex-2026-01-15-abc123.md
#
# IMPORTANT: 와일드카드 사용 금지! 반드시 특정 파일명을 지정해야 함

set -e

REVIEW_FILE="$1"

if [ -z "$REVIEW_FILE" ]; then
  echo "Error: Review file path required"
  echo "Usage: ./move-to-history.sh <review-file-path>"
  exit 1
fi

if [ ! -f "$REVIEW_FILE" ]; then
  echo "Error: File not found: $REVIEW_FILE"
  exit 1
fi

# Create history directory with current month
HISTORY_DIR="reports/ai-review/history/$(date +%Y-%m)"
mkdir -p "$HISTORY_DIR"

# Move file to history
FILENAME=$(basename "$REVIEW_FILE")
mv "$REVIEW_FILE" "$HISTORY_DIR/$FILENAME"

echo "Moved: $REVIEW_FILE -> $HISTORY_DIR/$FILENAME"
