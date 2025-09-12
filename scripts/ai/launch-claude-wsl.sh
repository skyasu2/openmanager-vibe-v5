#!/usr/bin/env bash
set -euo pipefail

# Enforce UTF-8 locale to avoid invalid surrogate issues
export LANG="ko_KR.UTF-8"
export LC_ALL="ko_KR.UTF-8"
export LC_CTYPE="ko_KR.UTF-8"
export PYTHONIOENCODING="UTF-8"

# Favor predictable TTY behavior
export TERM="xterm-256color"

# Optional: keep Node from inheriting odd encodings
export NODE_OPTIONS="${NODE_OPTIONS:-}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../" && pwd)"

echo "[launch-claude-wsl] Sanitizing local .claude JSON files..."
node "$PROJECT_ROOT/scripts/diagnostics/claude-json-sanitize.js" --write || true

echo "[launch-claude-wsl] Starting Claude Code with UTF-8 locale..."
exec claude "$@"

