#!/bin/bash
# Serena MCP wrapper using local uv installation

cd /mnt/d/cursor/openmanager-vibe-v5/scripts/serena || exit 1

# Export Python and UV paths
export PATH="/home/skyasu/.local/bin:$PATH"
export PYTHONUNBUFFERED=1

# Run serena using uv run
exec uv run serena-mcp-server \
    --project "/mnt/d/cursor/openmanager-vibe-v5" \
    --context "ide-assistant" \
    --transport "stdio" \
    "$@"