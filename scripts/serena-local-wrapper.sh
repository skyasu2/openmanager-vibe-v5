#!/bin/bash
# Serena MCP wrapper using local installation

cd /mnt/d/cursor/openmanager-vibe-v5/scripts/serena
exec uv run serena-mcp-server --project /mnt/d/cursor/openmanager-vibe-v5 --context ide-assistant --transport stdio "$@"