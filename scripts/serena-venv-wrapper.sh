#!/bin/bash
# Serena MCP wrapper using local venv

export PYTHONUNBUFFERED=1

# Run serena directly from venv
exec /mnt/d/cursor/openmanager-vibe-v5/scripts/serena/.venv/bin/serena-mcp-server \
    --project "/mnt/d/cursor/openmanager-vibe-v5" \
    --context "ide-assistant" \
    --transport "stdio" \
    "$@"