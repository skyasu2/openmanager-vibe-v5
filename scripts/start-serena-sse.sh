#!/bin/bash

# Serena MCP Server - SSE Mode Launcher
# This runs serena in SSE (Server-Sent Events) mode for HTTP-based communication

echo "Starting Serena MCP Server in SSE mode..."
echo "Server will be available at: http://localhost:9121/sse"
echo ""

# Start serena in SSE mode
uv run --directory /mnt/d/cursor/openmanager-vibe-v5/scripts/serena \
    serena-mcp-server \
    --transport sse \
    --port 9121 \
    --context ide-assistant \
    --project /mnt/d/cursor/openmanager-vibe-v5