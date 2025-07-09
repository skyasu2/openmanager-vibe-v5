#!/bin/bash

# 🎯 Claude Code Usage Monitor Setup Script
# Complete installation and configuration for Seoul timezone

set -e

echo "🚀 Claude Code Usage Monitor Setup Starting..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
print_status() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running from correct directory
if [ ! -f "claude_code_monitor.py" ]; then
    print_error "claude_code_monitor.py not found. Please run from the correct directory."
    exit 1
fi

print_status "Found claude_code_monitor.py ✓"

# 1. Setup directory structure
print_status "Setting up directory structure..."
mkdir -p ~/.claude-monitor
mkdir -p ~/.claude-monitor/logs
mkdir -p ~/.claude-monitor/sessions

# 2. Copy monitor to user directory
print_status "Installing monitor to ~/.claude-monitor/..."
cp claude_code_monitor.py ~/.claude-monitor/
chmod +x ~/.claude-monitor/claude_code_monitor.py

# 3. Create wrapper script
print_status "Creating wrapper script..."
cat > ~/.claude-monitor/claude-monitor << 'EOF'
#!/bin/bash
# Claude Code Usage Monitor Wrapper
# Optimized for Seoul timezone

MONITOR_DIR="$HOME/.claude-monitor"
MONITOR_SCRIPT="$MONITOR_DIR/claude_code_monitor.py"
LOG_DIR="$MONITOR_DIR/logs"
SESSION_DIR="$MONITOR_DIR/sessions"

# Create log file with timestamp
LOG_FILE="$LOG_DIR/claude_monitor_$(date +%Y%m%d_%H%M%S).log"

# Function to check if Claude Code is running
check_claude_session() {
    if pgrep -f "claude" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to start monitor
start_monitor() {
    echo "🎯 Starting Claude Code Usage Monitor..."
    echo "📍 Timezone: Seoul (UTC+9)"
    echo "🔄 Auto-detecting Claude plan..."
    echo "📊 Log file: $LOG_FILE"
    echo ""
    
    # Change to session directory
    cd "$SESSION_DIR"
    
    # Run monitor with logging
    python3 "$MONITOR_SCRIPT" --timezone Asia/Seoul --plan auto --reset-hour 9 2>&1 | tee "$LOG_FILE"
}

# Function to show usage
show_usage() {
    echo "Usage: claude-monitor [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --plan PLAN         Claude plan (pro, max5, max20, custom_max, auto)"
    echo "  --reset-hour HOUR   Preferred reset hour in Seoul time (default: 9)"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  claude-monitor                    # Auto-detect plan, 9 AM reset"
    echo "  claude-monitor --plan max5        # Max5 plan with 9 AM reset"
    echo "  claude-monitor --reset-hour 14    # Auto-detect plan, 2 PM reset"
}

# Parse arguments
PLAN="auto"
RESET_HOUR="9"

while [[ $# -gt 0 ]]; do
    case $1 in
        --plan)
            PLAN="$2"
            shift 2
            ;;
        --reset-hour)
            RESET_HOUR="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Check if Claude Code session exists
if ! check_claude_session; then
    echo "⚠️  Warning: No active Claude Code session detected"
    echo "💡 Start Claude Code first, then run the monitor"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Start the monitor
start_monitor
EOF

chmod +x ~/.claude-monitor/claude-monitor

# 4. Create alias setup
print_status "Creating alias configuration..."
cat > ~/.claude-monitor/aliases.sh << 'EOF'
#!/bin/bash
# Claude Monitor Aliases

# Main monitor command
alias claude-monitor='~/.claude-monitor/claude-monitor'

# Quick start with different plans
alias claude-monitor-pro='~/.claude-monitor/claude-monitor --plan pro'
alias claude-monitor-max5='~/.claude-monitor/claude-monitor --plan max5' 
alias claude-monitor-max20='~/.claude-monitor/claude-monitor --plan max20'

# Background monitoring with tmux
alias claude-monitor-bg='tmux new-session -d -s claude-monitor "~/.claude-monitor/claude-monitor"'
alias claude-monitor-attach='tmux attach -t claude-monitor'
alias claude-monitor-stop='tmux kill-session -t claude-monitor 2>/dev/null || echo "No session to stop"'

# Log viewing
alias claude-monitor-logs='ls -la ~/.claude-monitor/logs/'
alias claude-monitor-latest-log='tail -f ~/.claude-monitor/logs/$(ls -t ~/.claude-monitor/logs/ | head -1)'

# Session management
alias claude-monitor-sessions='ls -la ~/.claude-monitor/sessions/'
alias claude-monitor-clean='rm -rf ~/.claude-monitor/sessions/*.json ~/.claude-monitor/logs/*.log'

# Status checking
alias claude-monitor-status='tmux list-sessions | grep claude-monitor || echo "No monitor session running"'
EOF

# 5. Create startup script
print_status "Creating startup script..."
cat > ~/.claude-monitor/startup.sh << 'EOF'
#!/bin/bash
# Claude Monitor Startup Script

# Check for dependencies
check_dependencies() {
    local missing=0
    
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 not found"
        missing=1
    fi
    
    if ! command -v tmux &> /dev/null; then
        echo "⚠️  tmux not found - background monitoring disabled"
    fi
    
    return $missing
}

# Auto-start monitor if Claude Code is running
auto_start() {
    if pgrep -f "claude" > /dev/null; then
        echo "✅ Claude Code session detected"
        echo "🚀 Starting monitor automatically..."
        ~/.claude-monitor/claude-monitor
    else
        echo "💡 No Claude Code session detected"
        echo "   Start Claude Code first, then run: claude-monitor"
    fi
}

# Main startup logic
main() {
    echo "🎯 Claude Code Usage Monitor - Startup Check"
    echo "=============================================="
    
    check_dependencies
    if [ $? -eq 0 ]; then
        echo "✅ All dependencies satisfied"
        auto_start
    else
        echo "❌ Missing dependencies - please install Python 3"
        exit 1
    fi
}

main "$@"
EOF

chmod +x ~/.claude-monitor/startup.sh

# 6. Setup shell integration
print_status "Setting up shell integration..."

# Add to .bashrc if it exists
if [ -f ~/.bashrc ]; then
    if ! grep -q "claude-monitor" ~/.bashrc; then
        echo "" >> ~/.bashrc
        echo "# Claude Code Usage Monitor" >> ~/.bashrc
        echo "source ~/.claude-monitor/aliases.sh" >> ~/.bashrc
        print_success "Added to ~/.bashrc"
    fi
fi

# Add to .zshrc if it exists
if [ -f ~/.zshrc ]; then
    if ! grep -q "claude-monitor" ~/.zshrc; then
        echo "" >> ~/.zshrc
        echo "# Claude Code Usage Monitor" >> ~/.zshrc
        echo "source ~/.claude-monitor/aliases.sh" >> ~/.zshrc
        print_success "Added to ~/.zshrc"
    fi
fi

# 7. Create desktop shortcut (if applicable)
print_status "Creating desktop integration..."
if [ -d ~/.local/share/applications ]; then
    cat > ~/.local/share/applications/claude-monitor.desktop << 'EOF'
[Desktop Entry]
Name=Claude Code Usage Monitor
Comment=Monitor Claude Code token usage in real-time
Exec=gnome-terminal -- bash -c "source ~/.claude-monitor/aliases.sh && claude-monitor; read"
Icon=utilities-system-monitor
Type=Application
Categories=Development;Utility;
Terminal=true
EOF
    print_success "Desktop shortcut created"
fi

# 8. Create troubleshooting script
print_status "Creating troubleshooting tools..."
cat > ~/.claude-monitor/troubleshoot.sh << 'EOF'
#!/bin/bash
# Claude Monitor Troubleshooting

echo "🔧 Claude Code Usage Monitor - Troubleshooting"
echo "=============================================="

echo "📊 System Information:"
echo "  OS: $(uname -s)"
echo "  Python: $(python3 --version 2>/dev/null || echo 'Not found')"
echo "  tmux: $(tmux -V 2>/dev/null || echo 'Not found')"
echo ""

echo "🔍 Claude Code Processes:"
ps aux | grep -i claude | grep -v grep || echo "  No Claude processes found"
echo ""

echo "📁 Monitor Files:"
ls -la ~/.claude-monitor/
echo ""

echo "📝 Recent Logs:"
ls -la ~/.claude-monitor/logs/ | tail -5
echo ""

echo "🔧 Session Files:"
ls -la ~/.claude-monitor/sessions/
echo ""

echo "🎯 tmux Sessions:"
tmux list-sessions 2>/dev/null | grep claude || echo "  No Claude monitor sessions"
echo ""

echo "💾 Disk Usage:"
du -sh ~/.claude-monitor/
echo ""

echo "🌐 Network Connectivity:"
ping -c 1 google.com > /dev/null 2>&1 && echo "  ✅ Internet connected" || echo "  ❌ No internet connection"
EOF

chmod +x ~/.claude-monitor/troubleshoot.sh

# 9. Test the installation
print_status "Testing installation..."
if [ -x ~/.claude-monitor/claude_code_monitor.py ]; then
    print_success "Monitor executable is ready"
else
    print_error "Monitor executable is not ready"
    exit 1
fi

# 10. Final instructions
print_success "🎉 Installation Complete!"
echo ""
echo "📋 Quick Start Guide:"
echo "====================="
echo ""
echo "1. Basic Usage:"
echo "   ${GREEN}claude-monitor${NC}                    # Start with auto-detection"
echo ""
echo "2. Background Monitoring:"
echo "   ${GREEN}claude-monitor-bg${NC}                # Start in background (tmux)"
echo "   ${GREEN}claude-monitor-attach${NC}            # Attach to background session"
echo "   ${GREEN}claude-monitor-stop${NC}              # Stop background session"
echo ""
echo "3. Plan-Specific Monitoring:"
echo "   ${GREEN}claude-monitor-pro${NC}               # Pro plan (7k tokens)"
echo "   ${GREEN}claude-monitor-max5${NC}              # Max5 plan (35k tokens)"
echo "   ${GREEN}claude-monitor-max20${NC}             # Max20 plan (140k tokens)"
echo ""
echo "4. Log Management:"
echo "   ${GREEN}claude-monitor-logs${NC}              # List all logs"
echo "   ${GREEN}claude-monitor-latest-log${NC}        # View latest log"
echo ""
echo "5. Troubleshooting:"
echo "   ${GREEN}~/.claude-monitor/troubleshoot.sh${NC} # Run diagnostics"
echo ""
echo "🔄 To activate aliases in current shell:"
echo "   ${YELLOW}source ~/.claude-monitor/aliases.sh${NC}"
echo ""
echo "🎯 Start monitoring now:"
echo "   ${GREEN}claude-monitor${NC}"
echo ""
print_success "Setup complete! Happy monitoring! 🚀"