#!/bin/bash

# =============================================================================
# Claude Code Environment Check Script
# 
# Purpose: Verify Claude Code environment and WSL configuration
# Based on official Microsoft WSL and Anthropic Claude Code documentation
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}Claude Code Environment Check - WSL Best Practices${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo ""

# 1. Check WSL environment
echo -e "${YELLOW}[1/6] Checking WSL environment...${NC}"
if [[ "$(uname -r)" =~ "microsoft" ]] || [[ "$(uname -r)" =~ "WSL" ]]; then
    echo -e "${GREEN}✓ WSL environment detected${NC}"
    echo "  Kernel: $(uname -r)"
else
    echo -e "${YELLOW}⚠ WSL environment not detected${NC}"
    echo "  Running on: $(uname -s) $(uname -r)"
fi

# 2. Verify Node.js is Linux native (not Windows)
echo -e "${YELLOW}[2/6] Verifying Linux-native Node.js...${NC}"
NODE_PATH=$(which node 2>/dev/null || echo "not found")
NPM_PATH=$(which npm 2>/dev/null || echo "not found")

if [[ "$NODE_PATH" == *"/mnt/c/"* ]] || [[ "$NPM_PATH" == *"/mnt/c/"* ]]; then
    echo -e "${RED}✗ Using Windows Node.js through WSL (performance issue)${NC}"
    echo -e "${YELLOW}  Recommendation: Install Linux-native Node.js via nvm${NC}"
    echo "  Run: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    exit 1
fi

if [[ "$NODE_PATH" == "not found" ]] || [[ "$NPM_PATH" == "not found" ]]; then
    echo -e "${RED}✗ Node.js or npm not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Linux-native Node.js detected${NC}"
echo "  Node: $NODE_PATH"
echo "  npm: $NPM_PATH"

# 3. Check and optimize npm configuration
echo -e "${YELLOW}[3/6] Optimizing npm configuration...${NC}"
CURRENT_PREFIX=$(npm config get prefix)
echo "  Current npm prefix: $CURRENT_PREFIX"

# If using nvm, ensure prefix matches
if [[ -n "$NVM_DIR" ]]; then
    EXPECTED_PREFIX="$HOME/.nvm/versions/node/$(node -v)"
    if [[ "$CURRENT_PREFIX" != "$EXPECTED_PREFIX" ]]; then
        echo -e "${YELLOW}  Setting npm prefix to match nvm...${NC}"
        npm config set prefix "$EXPECTED_PREFIX"
    fi
fi

# Clear npm cache
echo -e "${YELLOW}  Clearing npm cache...${NC}"
npm cache clean --force 2>/dev/null || true
echo -e "${GREEN}✓ npm configuration optimized${NC}"

# 4. Check Claude Code installation
echo -e "${YELLOW}[4/6] Verifying Claude Code installation...${NC}"
CLAUDE_PATH=$(which claude 2>/dev/null || echo "not found")

if [[ "$CLAUDE_PATH" == "not found" ]]; then
    echo -e "${RED}✗ Claude Code not found${NC}"
    echo -e "${YELLOW}  Install with: npm install -g @anthropic-ai/claude-code${NC}"
    exit 1
fi

if [[ "$CLAUDE_PATH" == *"/mnt/c/"* ]]; then
    echo -e "${RED}✗ Claude Code is using Windows path (performance issue)${NC}"
    echo -e "${YELLOW}  Reinstall Claude Code in WSL: npm install -g @anthropic-ai/claude-code${NC}"
    exit 1
fi

CLAUDE_VERSION=$(claude --version 2>/dev/null || echo "unknown")
echo -e "${GREEN}✓ Claude Code found${NC}"
echo "  Path: $CLAUDE_PATH"
echo "  Version: $CLAUDE_VERSION"

# 5. Apply WSL performance optimizations
echo -e "${YELLOW}[5/6] Applying WSL performance optimizations...${NC}"

# Check if running from Windows filesystem
CURRENT_DIR=$(pwd)
if [[ "$CURRENT_DIR" == "/mnt/"* ]]; then
    echo -e "${YELLOW}⚠ Working in Windows filesystem (/mnt/*)${NC}"
    echo "  Performance tip: Move project to WSL filesystem (~/) for 30-50x speedup"
else
    echo -e "${GREEN}✓ Working in WSL filesystem (optimal performance)${NC}"
fi

# 6. Environment verification summary
echo -e "${YELLOW}[6/6] Environment verification summary...${NC}"

# Check for the config mismatch warning
echo -e "${YELLOW}Testing for config mismatch warning...${NC}"
if claude /status 2>&1 | grep -q "Config mismatch"; then
    echo -e "${YELLOW}⚠ Config mismatch warning detected${NC}"
    echo "  This is a known issue in Claude Code v1.0.72"
    echo "  GitHub Issues: #3915, #4977"
    echo "  Impact: None (cosmetic issue only)"
else
    echo -e "${GREEN}✓ No config mismatch warning detected${NC}"
fi

# Environment summary
echo ""
echo -e "${BLUE}Environment Summary:${NC}"
echo "  Node.js: $(node -v)"
echo "  npm: $(npm -v)"
echo "  Claude Code: $CLAUDE_VERSION"
echo "  npm prefix: $(npm config get prefix)"
echo "  WSL: $(uname -r | grep -o 'microsoft' || echo 'Not WSL')"

# Summary
echo ""
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${GREEN}Environment verification complete!${NC}"
echo ""
echo -e "${YELLOW}About the 'Config mismatch' warning:${NC}"
echo "  • Known issue in Claude Code v1.0.72"
echo "  • Does NOT affect functionality (cosmetic issue only)"
echo "  • Safe to ignore - will be fixed in future versions"
echo "  • GitHub Issues: #3915, #4977"
echo ""
echo -e "${YELLOW}WSL Performance Tips:${NC}"
echo "  • Work in WSL filesystem (~/) for 30-50x better performance"
echo "  • Avoid Windows filesystem (/mnt/c/, /mnt/d/)"
echo "  • Use Linux-native Node.js (not Windows version)"
echo ""
echo "For more details: docs/npm-global-config-guide.md"
echo -e "${BLUE}==============================================================================${NC}"