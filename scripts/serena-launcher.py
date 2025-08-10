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
