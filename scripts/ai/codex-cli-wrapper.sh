#!/bin/bash

# 🤖 Codex CLI Wrapper Script
# ChatGPT Codex CLI가 설치되지 않은 경우 Mock 스크립트를 사용하는 래퍼
# 
# @created 2025-08-20
# @version 1.0.0

# 실제 codex-cli가 설치되어 있는지 확인 (이 래퍼를 제외하고)
CODEX_CLI_PATH=$(command -v codex-cli 2>/dev/null)
if [ -n "$CODEX_CLI_PATH" ] && [ "$CODEX_CLI_PATH" != "/home/skyasu/.local/bin/codex-cli" ]; then
    # 실제 codex-cli 실행
    exec "$CODEX_CLI_PATH" "$@"
elif command -v codex &> /dev/null; then
    # codex 명령어로 실행
    exec codex "$@"
else
    # Mock 스크립트 실행
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    exec node "$SCRIPT_DIR/codex-cli-mock.mjs" "$@"
fi