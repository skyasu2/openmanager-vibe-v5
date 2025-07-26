#!/usr/bin/env python3
"""Launcher script for serena MCP server"""
import subprocess
import sys

# Launch serena-mcp-server using uvx
subprocess.run([
    "uvx",
    "--from", "git+https://github.com/oraios/serena",
    "serena-mcp-server"
] + sys.argv[1:])