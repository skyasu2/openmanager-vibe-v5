#!/bin/bash

# Serena MCP Server Runner
# This script ensures proper environment setup before launching

export PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
export PYTHONUNBUFFERED=1

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting Serena MCP Server...${NC}"

# Change to project directory
cd "$PROJECT_ROOT" || exit 1

# Check if running in MCP mode (stdio)
if [ "$1" == "--test" ]; then
    # Test mode: run with visible output
    uvx --from git+https://github.com/oraios/serena \
        serena-mcp-server \
        --project "$PROJECT_ROOT" \
        --context ide-assistant \
        --transport stdio
else
    # Production mode: use Python launcher for proper stdio handling
    python3 "$PROJECT_ROOT/scripts/serena-launcher.py"
fi
