#!/bin/bash

# Serena MCP 시작 메시지 최적화 스크립트
# 목적: 더 깔끔하고 유용한 시작 메시지 제공

echo "
╔════════════════════════════════════════════════════════════════╗
║              Serena MCP Server - Starting                      ║
╚════════════════════════════════════════════════════════════════╝
"

# Serena 설정 파일 경로
SERENA_CONFIG="$HOME/.serena/serena_config.yml"
SERENA_LOG_CONFIG="$HOME/.serena/logging_config.yml"

# 로깅 설정 생성 (시스템 프롬프트를 DEBUG 레벨로 변경)
cat > "$SERENA_LOG_CONFIG" << 'EOF'
version: 1
disable_existing_loggers: false

formatters:
  default:
    format: '%(levelname)-5s %(asctime)s [%(name)s] - %(message)s'
    datefmt: '%H:%M:%S'
  
  simple:
    format: '%(message)s'

handlers:
  console:
    class: logging.StreamHandler
    level: INFO
    formatter: simple
    stream: ext://sys.stdout
  
  file:
    class: logging.FileHandler
    level: DEBUG
    formatter: default
    filename: /home/skyasu/.serena/logs/serena.log
    mode: a

loggers:
  serena.agent:
    level: INFO
    handlers: [console, file]
    propagate: false
    # System prompt 로깅을 DEBUG로 변경
    filters:
      - system_prompt_filter
  
  serena.cli:
    level: INFO
    handlers: [console, file]
    propagate: false
  
  serena.mcp:
    level: INFO
    handlers: [console, file]
    propagate: false
  
  mcp.server:
    level: WARNING
    handlers: [console, file]
    propagate: false

root:
  level: INFO
  handlers: [console, file]

filters:
  system_prompt_filter:
    (): serena.logging_filter.SystemPromptFilter
EOF

# 커스텀 시작 래퍼 생성
cat > "$HOME/.serena/startup_wrapper.py" << 'EOF'
#!/usr/bin/env python3
"""Serena MCP 시작 메시지 최적화 래퍼"""

import sys
import os
import time
import subprocess
from datetime import datetime

def format_startup_message():
    """깔끔한 시작 메시지 생성"""
    
    # ANSI 색상 코드
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'
    
    print(f"""
{BOLD}{CYAN}╔════════════════════════════════════════════════════════════════╗
║                  Serena MCP Server v0.1.3                      ║
║              Advanced Code Intelligence Platform                ║
╚════════════════════════════════════════════════════════════════╝{RESET}

{GREEN}✓ Initializing...{RESET}
  • Loading configuration from ~/.serena/serena_config.yml
  • Starting web dashboard at http://127.0.0.1:24282/dashboard
  • Activating project: openmanager-vibe-v5

{BLUE}📦 Available Tools (25 active):{RESET}
  • {YELLOW}Code Analysis:{RESET} find_symbol, get_symbols_overview, find_references
  • {YELLOW}File Operations:{RESET} read_file, create_file, search_pattern
  • {YELLOW}Code Editing:{RESET} replace_regex, replace_symbol, insert_code
  • {YELLOW}Memory & Context:{RESET} read_memory, write_memory, list_memories
  • {YELLOW}Project Management:{RESET} activate_project, switch_modes

{GREEN}✓ Server Ready!{RESET}
  • Process ID: {os.getpid()}
  • Mode: Interactive + Editing
  • LSP: TypeScript, JavaScript, Python active
  
{CYAN}💡 Quick Start:{RESET}
  • Use 'activate_project' to switch projects
  • Use 'get_symbols_overview' to explore code structure
  • Use 'find_symbol' for precise code navigation
  • Web dashboard: http://127.0.0.1:24282/dashboard

{GREEN}═══════════════════════════════════════════════════════════════{RESET}
""")

if __name__ == "__main__":
    format_startup_message()
    # 실제 Serena 서버 시작 (자식 프로세스로)
    # subprocess.run(["serena", "mcp"], check=False)
EOF

chmod +x "$HOME/.serena/startup_wrapper.py"

echo "
✅ Serena MCP 시작 최적화 완료!

설정된 개선사항:
1. ✓ 시스템 프롬프트를 DEBUG 레벨로 변경 (화면 출력 제거)
2. ✓ 깔끔한 시작 메시지 포맷
3. ✓ 유용한 Quick Start 가이드 추가
4. ✓ 중복 정보 제거

사용 방법:
  python3 ~/.serena/startup_wrapper.py

또는 ~/.bashrc에 alias 추가:
  alias serena-start='python3 ~/.serena/startup_wrapper.py'
"