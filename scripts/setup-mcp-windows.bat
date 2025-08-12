@echo off
REM Windows MCP Server Setup Script
REM Last updated: 2025-08-12
REM Only configures working MCP servers

echo ========================================
echo Windows MCP Server Setup (Working Only)
echo ========================================
echo.

REM Remove all existing MCP servers first
echo Removing existing MCP configurations...
claude mcp remove filesystem 2>NUL
claude mcp remove memory 2>NUL
claude mcp remove github 2>NUL
claude mcp remove sequential-thinking 2>NUL
claude mcp remove time 2>NUL
claude mcp remove context7 2>NUL
claude mcp remove shadcn-ui 2>NUL
claude mcp remove playwright 2>NUL
claude mcp remove serena 2>NUL
claude mcp remove supabase 2>NUL
claude mcp remove tavily-mcp 2>NUL
echo.

REM Add working NPX servers
echo Adding NPX-based MCP servers...
claude mcp add filesystem "cmd /c npx -y @modelcontextprotocol/server-filesystem D:\cursor\openmanager-vibe-v5"
claude mcp add memory "cmd /c npx -y @modelcontextprotocol/server-memory"
claude mcp add github "cmd /c npx -y @modelcontextprotocol/server-github"
claude mcp add sequential-thinking "cmd /c npx -y @modelcontextprotocol/server-sequential-thinking"
echo.

REM Add Python time server
echo Adding Python-based time server...
claude mcp add time "C:\Users\skyas\AppData\Local\Programs\Python\Python311\Scripts\uvx.exe mcp-server-time"
echo.

REM Install and add npm global servers
echo Installing npm global packages...
call npm install -g context7-mcp-server shadcn-ui-mcp-server --silent
echo.

echo Adding npm global servers...
claude mcp add context7 "npx -y context7-mcp-server"
claude mcp add shadcn-ui "npx -y shadcn-ui-mcp-server"
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Working servers configured:
echo - filesystem (File system operations)
echo - memory (Knowledge graph)
echo - github (GitHub repository management)
echo - sequential-thinking (Complex problem solving)
echo - time (Time/timezone conversion)
echo - context7 (Library documentation)
echo - shadcn-ui (UI components)
echo.
echo Please run: claude api restart
echo Then verify with: claude mcp list
echo.
pause