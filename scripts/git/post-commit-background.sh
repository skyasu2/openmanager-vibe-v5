#!/bin/bash

# Post-commit Background Orchestrator
# Runs AI review, Lint, and Typecheck in parallel, then creates a summary.

echo "🚀 Post-commit background tasks started..."
LOG_DIR="logs/background-tasks"
mkdir -p "$LOG_DIR"

# Cleanup old logs (older than 7 days)
find "logs/code-reviews" -name "review-*.md" -mtime +7 -delete 2>/dev/null || true
find "$LOG_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null || true

# PIDs array
pids=()

# 1. AI Code Review (Unique value of post-commit)
if [ -f "scripts/code-review/auto-ai-review.sh" ]; then
    echo "  🤖 Starting AI Code Review..."
    bash scripts/code-review/auto-ai-review.sh > "$LOG_DIR/ai-review.log" 2>&1 &
    pids+=($!)
fi

# 2. Test Review Report (Non-blocking, informational only)
if [ -f "scripts/dev/generate-test-review-report.sh" ]; then
    echo "  📊 Generating Test Review Report..."
    bash scripts/dev/generate-test-review-report.sh > "$LOG_DIR/test-review.log" 2>&1 &
    pids+=($!)
fi

# Wait for all tasks to complete
if [ ${#pids[@]} -gt 0 ]; then
    echo "⏳ Waiting for ${#pids[@]} background tasks..."
    wait "${pids[@]}"
else
    echo "⚠️  No background tasks found to run."
fi

# 4. Create Summary
if [ -f "scripts/validation/create-summary.sh" ]; then
    echo "📊 Creating validation summary..."
    bash scripts/validation/create-summary.sh
fi

echo "✅ All post-commit background tasks completed."
