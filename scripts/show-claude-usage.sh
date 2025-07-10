#!/bin/bash
# Claude token usage display script

echo ""
echo "🎯 Claude Token Usage Status"
echo "============================"

# Run claude-monitor with a 10-second timeout
# Using system-installed version
timeout 10s claude-monitor --plan max20 2>/dev/null || {
    echo "📊 Quick status check completed."
}

echo ""