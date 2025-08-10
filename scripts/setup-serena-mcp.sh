#!/bin/bash

# ==================================================================
# Serena MCP Server Setup Script for Claude Code
# ==================================================================
# Author: Claude Code + Codex Collaboration
# Date: 2025-08-10
# Description: Comprehensive setup script for serena MCP server
# ==================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
SERENA_CONFIG_DIR="$HOME/.serena"
SERENA_PROJECT_FILE="$PROJECT_ROOT/.serena-project.yml"

# ==================================================================
# PART 1: System Validation
# ==================================================================

echo -e "${BLUE}🔍 Phase 1: System Validation${NC}"

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 not found. Please install Python 3.11+${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo -e "  ✓ Python version: $PYTHON_VERSION"

# Check uvx installation
if ! command -v uvx &> /dev/null; then
    echo -e "${YELLOW}⚠️ uvx not found. Installing...${NC}"
    pip install --user uv || {
        echo -e "${RED}❌ Failed to install uv/uvx${NC}"
        exit 1
    }
fi

UVX_VERSION=$(uvx --version 2>/dev/null || echo "unknown")
echo -e "  ✓ uvx version: $UVX_VERSION"

# Check Claude CLI
if ! command -v claude &> /dev/null; then
    echo -e "${RED}❌ Claude CLI not found${NC}"
    exit 1
fi
echo -e "  ✓ Claude CLI found"

# ==================================================================
# PART 2: Serena Configuration Setup
# ==================================================================

echo -e "\n${BLUE}🔧 Phase 2: Serena Configuration${NC}"

# Create serena config directory if it doesn't exist
if [ ! -d "$SERENA_CONFIG_DIR" ]; then
    echo -e "  Creating serena config directory..."
    mkdir -p "$SERENA_CONFIG_DIR"
    mkdir -p "$SERENA_CONFIG_DIR/logs"
    mkdir -p "$SERENA_CONFIG_DIR/memories"
    mkdir -p "$SERENA_CONFIG_DIR/cache"
fi

# Create serena_config.yml if it doesn't exist
if [ ! -f "$SERENA_CONFIG_DIR/serena_config.yml" ]; then
    echo -e "  Creating serena_config.yml..."
    cat > "$SERENA_CONFIG_DIR/serena_config.yml" << 'EOF'
# Serena MCP Server Configuration
version: "1.0"

# Logging configuration
logging:
  level: INFO
  log_to_file: true
  log_directory: ~/.serena/logs

# Performance settings
performance:
  max_answer_chars: 50000
  tool_timeout: 30.0
  cache_enabled: true
  cache_directory: ~/.serena/cache

# Language Server settings
language_servers:
  typescript:
    enabled: true
    extensions: [.ts, .tsx, .js, .jsx]
  python:
    enabled: false

# UI settings
ui:
  enable_web_dashboard: false
  enable_gui_log_window: false

# Default context
default_context: ide-assistant
EOF
    echo -e "  ✓ serena_config.yml created"
else
    echo -e "  ✓ serena_config.yml exists"
fi

# ==================================================================
# PART 3: Project-Specific Configuration
# ==================================================================

echo -e "\n${BLUE}📁 Phase 3: Project Configuration${NC}"

# Ensure .serena-project.yml exists
if [ ! -f "$SERENA_PROJECT_FILE" ]; then
    echo -e "  Creating .serena-project.yml..."
    cat > "$SERENA_PROJECT_FILE" << 'EOF'
# Serena Project Configuration
project_name: openmanager-vibe-v5
project_root: /mnt/d/cursor/openmanager-vibe-v5

# Exclude large directories from parsing
exclude_paths:
  - node_modules
  - .next
  - out
  - build
  - dist
  - .git
  - coverage
  - test-results
  - playwright-report
  - "**/*.log"
  - "**/.DS_Store"

# Focus on source code
include_paths:
  - src
  - app
  - pages
  - components
  - lib
  - utils
  - services

# Language servers configuration
language_servers:
  typescript:
    enabled: true
    file_extensions:
      - .ts
      - .tsx
      - .js
      - .jsx
  python:
    enabled: false
EOF
    echo -e "  ✓ .serena-project.yml created"
else
    echo -e "  ✓ .serena-project.yml exists"
fi

# ==================================================================
# PART 4: Create Python Launcher Wrapper
# ==================================================================

echo -e "\n${BLUE}🐍 Phase 4: Python Launcher Setup${NC}"

# Create enhanced Python launcher
cat > "$PROJECT_ROOT/scripts/serena-launcher.py" << 'EOF'
#!/usr/bin/env python3
"""
Enhanced Serena MCP Server Launcher
Handles all MCP protocol requirements for Claude Code integration
"""
import subprocess
import sys
import os
import json
import signal
import time
from pathlib import Path

def signal_handler(sig, frame):
    """Graceful shutdown handler"""
    sys.stderr.write("Shutting down serena MCP server...\n")
    sys.exit(0)

def main():
    """Launch serena MCP server with proper configuration"""
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Get project root
    project_root = os.environ.get("PROJECT_ROOT", "/mnt/d/cursor/openmanager-vibe-v5")
    
    # Build command
    cmd = [
        "uvx",
        "--from", "git+https://github.com/oraios/serena",
        "serena-mcp-server",
        "--project", project_root,
        "--context", "ide-assistant",
        "--transport", "stdio"
    ]
    
    # Add any additional arguments passed to launcher
    cmd.extend(sys.argv[1:])
    
    # Set environment variables
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    env["PROJECT_ROOT"] = project_root
    
    try:
        # Run serena MCP server
        process = subprocess.Popen(
            cmd,
            stdin=sys.stdin,
            stdout=sys.stdout,
            stderr=sys.stderr,
            env=env,
            bufsize=0  # Unbuffered I/O for real-time communication
        )
        
        # Wait for process to complete
        process.wait()
        
    except Exception as e:
        sys.stderr.write(f"Error launching serena: {e}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
EOF

chmod +x "$PROJECT_ROOT/scripts/serena-launcher.py"
echo -e "  ✓ serena-launcher.py created"

# ==================================================================
# PART 5: Create Bash Wrapper Script
# ==================================================================

echo -e "\n${BLUE}🚀 Phase 5: Bash Wrapper Setup${NC}"

# Create bash wrapper for easier execution
cat > "$PROJECT_ROOT/scripts/run-serena-mcp.sh" << 'EOF'
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
EOF

chmod +x "$PROJECT_ROOT/scripts/run-serena-mcp.sh"
echo -e "  ✓ run-serena-mcp.sh created"

# ==================================================================
# PART 6: MCP Server Registration
# ==================================================================

echo -e "\n${BLUE}📝 Phase 6: MCP Server Registration${NC}"

# Remove existing serena MCP if exists
echo -e "  Removing existing serena MCP server..."
claude mcp remove serena -s local 2>/dev/null || true

# Register serena MCP server using different methods
echo -e "  Registering serena MCP server..."

# Method 1: Try Python launcher first
echo -e "  Method 1: Python launcher..."
claude mcp add serena python3 -- "$PROJECT_ROOT/scripts/serena-launcher.py" || {
    echo -e "${YELLOW}  Method 1 failed, trying Method 2...${NC}"
    
    # Method 2: Direct uvx command
    echo -e "  Method 2: Direct uvx command..."
    claude mcp add serena uvx -- \
        --from git+https://github.com/oraios/serena \
        serena-mcp-server \
        --project "$PROJECT_ROOT" \
        --context ide-assistant || {
        
        echo -e "${YELLOW}  Method 2 failed, trying Method 3...${NC}"
        
        # Method 3: Bash wrapper
        echo -e "  Method 3: Bash wrapper..."
        claude mcp add serena bash -- "$PROJECT_ROOT/scripts/run-serena-mcp.sh"
    }
}

# ==================================================================
# PART 7: Verification
# ==================================================================

echo -e "\n${BLUE}✅ Phase 7: Verification${NC}"

# Test serena installation
echo -e "  Testing serena installation..."
if timeout 3 uvx --from git+https://github.com/oraios/serena serena-mcp-server --help > /dev/null 2>&1; then
    echo -e "  ✓ Serena binary works"
else
    echo -e "${YELLOW}  ⚠️ Serena binary test failed (may still work in MCP mode)${NC}"
fi

# Check MCP registration
echo -e "  Checking MCP registration..."
if claude mcp list | grep -q "serena"; then
    echo -e "  ✓ Serena registered in MCP"
else
    echo -e "${RED}  ❌ Serena not found in MCP list${NC}"
fi

# ==================================================================
# PART 8: Create Troubleshooting Script
# ==================================================================

echo -e "\n${BLUE}🔧 Phase 8: Troubleshooting Tools${NC}"

cat > "$PROJECT_ROOT/scripts/debug-serena-mcp.sh" << 'EOF'
#!/bin/bash

# Serena MCP Debugging Script

echo "=== Serena MCP Debug Information ==="
echo ""

echo "1. System Check:"
echo "  Python: $(python3 --version)"
echo "  uvx: $(uvx --version 2>/dev/null || echo 'Not found')"
echo "  Claude CLI: $(which claude || echo 'Not found')"
echo ""

echo "2. Serena Test:"
timeout 2 uvx --from git+https://github.com/oraios/serena serena-mcp-server --help 2>&1 | head -5
echo ""

echo "3. MCP Status:"
claude mcp get serena 2>/dev/null || echo "Serena not registered"
echo ""

echo "4. Serena Config:"
ls -la ~/.serena/ 2>/dev/null || echo "No serena config directory"
echo ""

echo "5. Project Files:"
ls -la /mnt/d/cursor/openmanager-vibe-v5/scripts/*serena* 2>/dev/null
echo ""

echo "6. Test Direct Execution:"
echo "Running: python3 /mnt/d/cursor/openmanager-vibe-v5/scripts/serena-launcher.py --help"
timeout 2 python3 /mnt/d/cursor/openmanager-vibe-v5/scripts/serena-launcher.py --help 2>&1 | head -10
EOF

chmod +x "$PROJECT_ROOT/scripts/debug-serena-mcp.sh"
echo -e "  ✓ debug-serena-mcp.sh created"

# ==================================================================
# FINAL STATUS
# ==================================================================

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Serena MCP Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📋 Created Files:"
echo "  - $PROJECT_ROOT/scripts/serena-launcher.py"
echo "  - $PROJECT_ROOT/scripts/run-serena-mcp.sh"
echo "  - $PROJECT_ROOT/scripts/debug-serena-mcp.sh"
echo "  - $PROJECT_ROOT/.serena-project.yml"
echo "  - $SERENA_CONFIG_DIR/serena_config.yml"
echo ""
echo "🔄 Next Steps:"
echo "  1. Run: claude api restart"
echo "  2. Check: claude mcp list"
echo "  3. Debug: ./scripts/debug-serena-mcp.sh"
echo ""
echo "📚 Usage in Claude Code:"
echo "  mcp__serena__get_symbols_overview"
echo "  mcp__serena__find_symbol"
echo "  mcp__serena__search_for_pattern"
echo ""
echo -e "${YELLOW}⚠️ Note: If serena still fails to connect, try:${NC}"
echo "  1. Restart your terminal"
echo "  2. Run: claude api restart"
echo "  3. Check logs: ~/.serena/logs/"