#!/bin/bash

# MCP Conflict Detection & Auto-Resolution Script
# For Claude Code OpenManager VIBE v5 Project
# Version: 2.0.0 - Enhanced with PROACTIVE CONFLICT DETECTION

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
GLOBAL_CLAUDE_CONFIG="$HOME/.claude.json"
PROJECT_MCP_CONFIG="$PROJECT_ROOT/.claude/mcp.json"
PROJECT_SETTINGS="$PROJECT_ROOT/.claude/settings.local.json"

# Enhanced logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

info() {
    echo -e "${CYAN}[INFO] $1${NC}"
}

debug() {
    echo -e "${MAGENTA}[DEBUG] $1${NC}"
}

# Enhanced file checking with WSL compatibility
check_file() {
    local file="$1"
    if [[ ! -f "$file" ]]; then
        error "File not found: $file"
        return 1
    fi
    if [[ ! -r "$file" ]]; then
        error "File not readable: $file"
        return 1
    fi
    return 0
}

# Atomic backup function with verification
create_backup() {
    local file="$1"
    local backup_file="${file}.backup_$(date +%Y%m%d_%H%M%S)"
    
    if check_file "$file"; then
        # Create atomic backup
        if cp "$file" "$backup_file" && [[ -f "$backup_file" ]]; then
            log "Backup created: $backup_file"
            return 0
        else
            error "Failed to create backup: $backup_file"
            return 1
        fi
    fi
    return 1
}

# PROACTIVE CONFLICT DETECTION: Count MCP servers in project config
count_project_mcp_servers() {
    if check_file "$PROJECT_MCP_CONFIG"; then
        local count
        count=$(jq '.mcpServers | keys | length' "$PROJECT_MCP_CONFIG" 2>/dev/null || echo "0")
        echo "$count"
    else
        echo "0"
    fi
}

# Count enabled servers in project settings
count_enabled_servers() {
    if check_file "$PROJECT_SETTINGS"; then
        local count
        count=$(jq '.enabledMcpjsonServers | length' "$PROJECT_SETTINGS" 2>/dev/null || echo "0")
        echo "$count"
    else
        echo "0"
    fi
}

# ENHANCED GLOBAL CONFLICT DETECTION
check_global_conflicts() {
    log "🔍 Checking for global MCP configuration conflicts..."
    
    if ! check_file "$GLOBAL_CLAUDE_CONFIG"; then
        warning "Global Claude config not found: $GLOBAL_CLAUDE_CONFIG"
        return 1
    fi
    
    local conflicts_found=false
    
    # Check global mcpServers section
    local global_mcp_servers
    global_mcp_servers=$(jq -r '.mcpServers // {} | keys | length' "$GLOBAL_CLAUDE_CONFIG" 2>/dev/null || echo "0")
    
    if [[ "$global_mcp_servers" -gt 0 ]]; then
        warning "Global MCP configuration detected with $global_mcp_servers servers"
        warning "This WILL conflict with project-specific configuration"
        conflicts_found=true
    fi
    
    # Check project-specific settings in global config
    local project_mcp_servers
    project_mcp_servers=$(jq -r ".projects[\"$PROJECT_ROOT\"].mcpServers // {} | keys | length" "$GLOBAL_CLAUDE_CONFIG" 2>/dev/null || echo "0")
    
    if [[ "$project_mcp_servers" -gt 0 ]]; then
        warning "Project-specific MCP servers found in global config: $project_mcp_servers"
        debug "These will override local project settings"
        conflicts_found=true
    fi
    
    # Check enabled servers in global config
    local global_enabled_servers
    global_enabled_servers=$(jq -r ".projects[\"$PROJECT_ROOT\"].enabledMcpjsonServers // [] | length" "$GLOBAL_CLAUDE_CONFIG" 2>/dev/null || echo "0")
    
    if [[ "$global_enabled_servers" -gt 0 ]]; then
        warning "Global enabled MCP servers detected: $global_enabled_servers"
        conflicts_found=true
    fi
    
    if [[ "$conflicts_found" == "true" ]]; then
        error "🚨 CRITICAL: Global MCP conflicts detected!"
        info "This explains why /mcp shows 'No MCP servers configured'"
        return 1
    else
        success "✅ No global MCP conflicts detected"
        return 0
    fi
}

# COMPREHENSIVE PROJECT CONFIGURATION VALIDATION
validate_project_config() {
    log "🔧 Validating project MCP configuration..."
    
    local project_servers
    project_servers=$(count_project_mcp_servers)
    
    local enabled_servers
    enabled_servers=$(count_enabled_servers)
    
    info "Project MCP servers defined: $project_servers"
    info "Enabled MCP servers: $enabled_servers"
    
    # Expected 10 servers for OpenManager VIBE v5
    local expected_servers=10
    
    if [[ "$project_servers" -ne "$expected_servers" ]]; then
        error "❌ Expected $expected_servers MCP servers, found $project_servers"
        return 1
    fi
    
    if [[ "$enabled_servers" -ne "$expected_servers" ]]; then
        warning "⚠️ Not all servers are enabled ($enabled_servers/$expected_servers)"
        info "Consider enabling all servers in $PROJECT_SETTINGS"
    fi
    
    # Validate enableAllProjectMcpServers setting
    if check_file "$PROJECT_SETTINGS"; then
        local enable_all
        enable_all=$(jq -r '.enableAllProjectMcpServers // false' "$PROJECT_SETTINGS" 2>/dev/null)
        
        if [[ "$enable_all" != "true" ]]; then
            warning "enableAllProjectMcpServers is not set to true"
            info "This may prevent automatic loading of all MCP servers"
        fi
    fi
    
    success "✅ Project MCP configuration validated"
    return 0
}

# COMMAND FORMAT VALIDATION WITH WSL COMPATIBILITY
validate_command_formats() {
    log "⚙️ Validating MCP server command formats..."
    
    if ! check_file "$PROJECT_MCP_CONFIG"; then
        return 1
    fi
    
    # Expected command distribution for OpenManager VIBE v5
    local expected_npx_servers=8
    local expected_uvx_servers=2
    
    # Count actual distribution
    local npx_servers
    npx_servers=$(jq -r '.mcpServers | to_entries[] | select(.value.command == "npx") | .key' "$PROJECT_MCP_CONFIG" 2>/dev/null | wc -l)
    
    local uvx_servers
    uvx_servers=$(jq -r '.mcpServers | to_entries[] | select(.value.command == "uvx") | .key' "$PROJECT_MCP_CONFIG" 2>/dev/null | wc -l)
    
    info "npx-based servers: $npx_servers (expected: $expected_npx_servers)"
    info "uvx-based servers: $uvx_servers (expected: $expected_uvx_servers)"
    
    # Validate distribution
    if [[ "$npx_servers" -ne "$expected_npx_servers" ]] || [[ "$uvx_servers" -ne "$expected_uvx_servers" ]]; then
        error "❌ Invalid command format distribution"
        error "Expected: $expected_npx_servers npx, $expected_uvx_servers uvx"
        error "Found: $npx_servers npx, $uvx_servers uvx"
        return 1
    fi
    
    # Validate specific server commands
    local validation_errors=false
    
    # NPX servers (Node.js based)
    local npx_server_list=("filesystem" "github" "memory" "supabase" "context7" "tavily-mcp" "sequential-thinking" "playwright")
    for server in "${npx_server_list[@]}"; do
        local cmd
        cmd=$(jq -r ".mcpServers.$server.command // \"missing\"" "$PROJECT_MCP_CONFIG" 2>/dev/null)
        if [[ "$cmd" != "npx" ]]; then
            error "❌ $server: expected 'npx', found '$cmd'"
            validation_errors=true
        fi
    done
    
    # UVX servers (Python based)
    local uvx_server_list=("serena" "time")
    for server in "${uvx_server_list[@]}"; do
        local cmd
        cmd=$(jq -r ".mcpServers.$server.command // \"missing\"" "$PROJECT_MCP_CONFIG" 2>/dev/null)
        if [[ "$cmd" != "uvx" ]]; then
            error "❌ $server: expected 'uvx', found '$cmd'"
            validation_errors=true
        fi
    done
    
    if [[ "$validation_errors" == "true" ]]; then
        error "❌ Command format validation failed"
        return 1
    fi
    
    success "✅ All command formats validated"
    return 0
}

# AUTOMATIC CONFLICT RESOLUTION
auto_resolve_conflicts() {
    log "🔧 Attempting to auto-resolve MCP conflicts..."
    
    # Create backup first
    if ! create_backup "$GLOBAL_CLAUDE_CONFIG"; then
        error "Failed to create backup, aborting auto-resolution"
        return 1
    fi
    
    # Remove conflicting global MCP settings
    local temp_config
    temp_config=$(mktemp)
    
    # Clear all potential conflict sources
    jq "
    # Remove global mcpServers
    .mcpServers = {} |
    # Clear project-specific MCP settings in global config
    .projects[\"$PROJECT_ROOT\"].mcpServers = {} |
    .projects[\"$PROJECT_ROOT\"].enabledMcpjsonServers = [] |
    .projects[\"$PROJECT_ROOT\"].disabledMcpjsonServers = []
    " "$GLOBAL_CLAUDE_CONFIG" > "$temp_config"
    
    if [[ $? -eq 0 ]] && [[ -s "$temp_config" ]]; then
        mv "$temp_config" "$GLOBAL_CLAUDE_CONFIG"
        success "✅ Global MCP conflicts resolved"
        info "Project settings will now take precedence"
    else
        error "❌ Failed to resolve global conflicts"
        rm -f "$temp_config"
        return 1
    fi
    
    return 0
}

# MCP SERVER CONNECTIVITY TEST
test_mcp_connectivity() {
    log "🌐 Testing MCP server connectivity..."
    
    # Test Claude CLI availability
    if ! command -v claude >/dev/null 2>&1; then
        warning "Claude CLI not available for connectivity test"
        info "Install Claude CLI to enable full connectivity testing"
        return 1
    fi
    
    # Test MCP server recognition
    local mcp_output
    mcp_output=$(timeout 10 claude mcp list 2>&1 || echo "timeout_or_error")
    
    if echo "$mcp_output" | grep -q "No MCP servers configured"; then
        error "❌ MCP servers not recognized by Claude CLI"
        warning "This confirms the configuration conflict issue"
        return 1
    elif echo "$mcp_output" | grep -q "timeout_or_error"; then
        warning "⚠️ Claude CLI timeout or error during MCP test"
        return 1
    else
        success "✅ MCP servers detected by Claude CLI"
        debug "Claude mcp list output preview:"
        echo "$mcp_output" | head -5
    fi
    
    return 0
}

# ENVIRONMENT VALIDATION
validate_environment() {
    log "🔐 Validating environment variables..."
    
    local missing_vars=()
    local critical_vars=("GITHUB_TOKEN" "SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "UPSTASH_REDIS_REST_URL" "UPSTASH_REDIS_REST_TOKEN")
    
    for var in "${critical_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        warning "⚠️ Missing environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        warning "Some MCP servers may not function properly"
        info "Add missing variables to .env.local file"
        return 1
    else
        success "✅ All critical environment variables are set"
        return 0
    fi
}

# COMPREHENSIVE HEALTH REPORT
generate_comprehensive_report() {
    log "📊 Generating comprehensive MCP health report..."
    
    local report_dir="$PROJECT_ROOT/reports"
    mkdir -p "$report_dir"
    
    local report_file="$report_dir/mcp-health-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# 🔧 MCP Infrastructure Health Report

**Generated:** $(date '+%Y-%m-%d %H:%M:%S')  
**Project:** OpenManager VIBE v5  
**Environment:** WSL Ubuntu on Windows 11  
**Script Version:** mcp-conflict-detector v2.0.0

## 📋 Executive Summary

| Component | Status | Details |
|-----------|---------|---------|
| Project MCP Servers | $(count_project_mcp_servers)/10 | $(validate_project_config >/dev/null 2>&1 && echo "✅ Valid" || echo "❌ Issues") |
| Global Conflicts | $(check_global_conflicts >/dev/null 2>&1 && echo "✅ None" || echo "🚨 Detected") | $(check_global_conflicts >/dev/null 2>&1 && echo "No conflicts" || echo "Requires resolution") |
| Command Formats | $(validate_command_formats >/dev/null 2>&1 && echo "✅ Valid" || echo "❌ Invalid") | npx: 8 servers, uvx: 2 servers |
| Environment | $(validate_environment >/dev/null 2>&1 && echo "✅ Complete" || echo "⚠️ Missing vars") | Critical variables check |
| Connectivity | $(test_mcp_connectivity >/dev/null 2>&1 && echo "✅ Working" || echo "❌ Failed") | Claude CLI integration |

## 🔍 Detailed Analysis

### MCP Server Configuration

**Expected Servers (10 total):**

#### NPX-based Servers (8):
$(jq -r '.mcpServers | to_entries[] | select(.value.command == "npx") | "- **\(.key)**: \(.value.description // "No description")"' "$PROJECT_MCP_CONFIG" 2>/dev/null || echo "- Error reading configuration")

#### UVX-based Servers (2):
$(jq -r '.mcpServers | to_entries[] | select(.value.command == "uvx") | "- **\(.key)**: \(.value.description // "No description")"' "$PROJECT_MCP_CONFIG" 2>/dev/null || echo "- Error reading configuration")

### Configuration Files

- **Project MCP Config**: \`$PROJECT_MCP_CONFIG\` $(check_file "$PROJECT_MCP_CONFIG" && echo "✅" || echo "❌")
- **Project Settings**: \`$PROJECT_SETTINGS\` $(check_file "$PROJECT_SETTINGS" && echo "✅" || echo "❌")
- **Global Config**: \`$GLOBAL_CLAUDE_CONFIG\` $(check_file "$GLOBAL_CLAUDE_CONFIG" && echo "✅" || echo "❌")

## 🚨 Issues & Recommendations

$(if ! check_global_conflicts >/dev/null 2>&1; then
    echo "### 🔥 CRITICAL: Global Configuration Conflicts"
    echo ""
    echo "**Issue**: Global Claude configuration is overriding project settings."
    echo "**Impact**: \`/mcp\` command shows 'No MCP servers configured'"
    echo "**Solution**: Run \`./scripts/mcp/mcp-conflict-detector.sh --auto-resolve\`"
    echo ""
fi)

$(if ! validate_project_config >/dev/null 2>&1; then
    echo "### ⚠️ Project Configuration Issues"
    echo ""
    echo "**Issue**: Project MCP configuration validation failed"
    echo "**Check**: Verify all 10 servers are properly defined"
    echo "**Action**: Review \`$PROJECT_MCP_CONFIG\`"
    echo ""
fi)

$(if ! validate_environment >/dev/null 2>&1; then
    echo "### 🔐 Environment Variables"
    echo ""
    echo "**Issue**: Missing critical environment variables"
    echo "**Impact**: Some MCP servers will fail to authenticate"
    echo "**Action**: Add missing variables to \`.env.local\`"
    echo ""
fi)

## 🎯 Next Steps

1. **Immediate Actions:**
   - Run auto-resolution if conflicts detected
   - Restart Claude Code after configuration changes
   - Test with \`/mcp\` command to verify 10 servers

2. **Preventive Measures:**
   - Schedule weekly MCP health checks
   - Monitor backup files and clean old ones
   - Keep environment variables updated

3. **Validation:**
   - Verify all 10 MCP servers appear in \`/mcp\` output
   - Test individual server functionality
   - Monitor for performance issues

## 🔧 Troubleshooting Commands

\`\`\`bash
# Check current status
./scripts/mcp/mcp-conflict-detector.sh

# Auto-resolve conflicts
./scripts/mcp/mcp-conflict-detector.sh --auto-resolve

# Test MCP connectivity
claude mcp list

# Verify project settings
jq '.enableAllProjectMcpServers' .claude/settings.local.json
\`\`\`

## 📞 Support

For persistent issues, contact the MCP Infrastructure Engineer:

\`\`\`bash
# Use MCP Server Admin sub-agent
Task(
  subagent_type="mcp-server-admin",
  description="Resolve MCP infrastructure issues",
  prompt="Current MCP health report shows issues. Please investigate and resolve."
)
\`\`\`

---
*Report generated by MCP Infrastructure Engineer v2.0.0*  
*Project: OpenManager VIBE v5 - 100% Free Tier Architecture*
EOF

    success "✅ Comprehensive health report generated: $report_file"
    return 0
}

# USAGE INFORMATION
usage() {
    cat << EOF
🔧 MCP Conflict Detection & Auto-Resolution Tool v2.0.0

DESCRIPTION:
    Proactively detects and resolves MCP server configuration conflicts
    for OpenManager VIBE v5 running on Claude Code.

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --auto-resolve      Automatically resolve detected conflicts
    --check-only        Run checks without any modifications
    --generate-report   Generate health report only
    --help, -h          Show this help message

EXAMPLES:
    # Full diagnostic with manual confirmation
    $0

    # Automatic conflict resolution
    $0 --auto-resolve

    # Quick status check
    $0 --check-only

    # Generate health report
    $0 --generate-report

EXPECTED RESULTS:
    - 10 MCP servers properly configured
    - No global configuration conflicts
    - All environment variables present
    - '/mcp' command shows all servers

For support, use the mcp-server-admin sub-agent.
EOF
}

# MAIN EXECUTION FUNCTION
main() {
    local auto_resolve=false
    local check_only=false
    local report_only=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --auto-resolve)
                auto_resolve=true
                shift
                ;;
            --check-only)
                check_only=true
                shift
                ;;
            --generate-report)
                report_only=true
                shift
                ;;
            --help|-h)
                usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    # Header
    echo "=================================================================="
    echo "🔧 MCP INFRASTRUCTURE HEALTH CHECK - OpenManager VIBE v5"
    echo "=================================================================="
    echo "🎯 Target: 10 MCP servers (8 npx + 2 uvx)"
    echo "📍 Environment: WSL Ubuntu + Claude Code"
    echo "🕒 Started: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=================================================================="
    echo
    
    # Generate report only if requested
    if [[ "$report_only" == "true" ]]; then
        generate_comprehensive_report
        exit 0
    fi
    
    local exit_code=0
    local conflicts_detected=false
    
    # 1. Global Conflict Detection (CRITICAL)
    if ! check_global_conflicts; then
        conflicts_detected=true
        exit_code=1
        
        if [[ "$auto_resolve" == "true" ]]; then
            info "🔧 Auto-resolving global conflicts..."
            if auto_resolve_conflicts; then
                log "✅ Conflicts resolved, re-checking..."
                if check_global_conflicts; then
                    conflicts_detected=false
                    exit_code=0
                fi
            else
                error "❌ Auto-resolution failed"
            fi
        elif [[ "$check_only" == "false" ]]; then
            echo
            warning "🚨 CRITICAL CONFLICTS DETECTED!"
            info "These conflicts prevent MCP servers from loading properly."
            echo
            read -p "❓ Auto-resolve conflicts now? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                if auto_resolve_conflicts; then
                    log "✅ Conflicts resolved, re-checking..."
                    if check_global_conflicts; then
                        conflicts_detected=false
                        exit_code=0
                    fi
                fi
            fi
        fi
    fi
    echo
    
    # 2. Project Configuration Validation
    if ! validate_project_config; then
        warning "Project configuration issues detected"
        exit_code=1
    fi
    echo
    
    # 3. Command Format Validation
    if ! validate_command_formats; then
        warning "Command format issues detected"
        exit_code=1
    fi
    echo
    
    # 4. Environment Validation
    if ! validate_environment; then
        warning "Environment variable issues detected"
        # Don't fail on missing env vars, just warn
    fi
    echo
    
    # 5. Connectivity Test (if no critical issues)
    if [[ "$conflicts_detected" == "false" ]]; then
        if ! test_mcp_connectivity; then
            warning "MCP connectivity test failed"
        fi
    else
        warning "⏭️ Skipping connectivity test due to configuration conflicts"
    fi
    echo
    
    # 6. Generate Comprehensive Report
    if [[ "$check_only" == "false" ]]; then
        generate_comprehensive_report
    fi
    echo
    
    # Final Summary
    echo "=================================================================="
    if [[ $exit_code -eq 0 ]]; then
        success "🎉 MCP INFRASTRUCTURE HEALTH CHECK PASSED!"
        echo "✅ All 10 MCP servers should be available in Claude Code"
        echo "✅ Use '/mcp' command to verify server visibility"
    else
        error "🚨 MCP INFRASTRUCTURE ISSUES DETECTED!"
        echo "❌ Some problems require attention"
        echo "📋 Review the generated health report for details"
        if [[ "$conflicts_detected" == "true" ]]; then
            echo "🔧 Run with --auto-resolve to fix critical conflicts"
        fi
    fi
    echo "=================================================================="
    
    return $exit_code
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi