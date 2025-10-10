#!/bin/bash
# AI 도구 업데이트 확인만 (설치 안 함)
# 빠른 체크용: ./scripts/check-ai-tools-updates.sh

set -euo pipefail

# NVM 환경 로드
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "🔍 AI 도구 최신 버전 확인"
echo "=================================="

check_version() {
    local package=$1
    local name=$2

    # 현재 버전
    local current=$($name --version 2>&1 | grep -oP '\d+\.\d+\.\d+' | head -1 || echo "unknown")

    # 최신 버전
    local latest=$(npm view "$package" version 2>/dev/null || echo "unknown")

    if [[ "$current" == "$latest" ]]; then
        echo "✅ $name: $current (최신)"
    else
        echo "⚠️  $name: $current → $latest (업데이트 가능)"
    fi
}

check_version "@anthropic-ai/claude-code" "claude"
check_version "@openai/codex" "codex"
check_version "@google/gemini-cli" "gemini"
check_version "@qwen-code/qwen-code" "qwen"

echo ""
echo "💡 업데이트 실행:"
echo "   ./scripts/ai-tools-auto-update.sh"
