#!/bin/bash
# Claude token usage display script

echo ""
echo "🎯 Claude Token Usage Status"
echo "============================"

# Run claude-monitor with a 5-second timeout
timeout 5s claude-monitor --plan max20 2>/dev/null || {
    echo "📊 Quick status check completed."
}

echo ""