#!/bin/bash
# Simple serena MCP launcher
exec uvx --from git+https://github.com/oraios/serena serena-mcp-server --project /mnt/d/cursor/openmanager-vibe-v5 "$@"