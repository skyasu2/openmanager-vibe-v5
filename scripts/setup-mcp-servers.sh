#!/bin/bash

echo "🔧 MCP 서버 설정 스크립트"
echo "========================="

# 1. 프로젝트 디렉토리 설정
PROJECT_DIR="/mnt/d/cursor/openmanager-vibe-v5"
CLAUDE_CONFIG_DIR="$HOME/.claude"

# 2. Claude 설정 디렉토리 생성
mkdir -p "$CLAUDE_CONFIG_DIR"

# 3. MCP 서버 설정 파일 생성
echo "📝 MCP 서버 설정 파일 생성 중..."

cat > "$CLAUDE_CONFIG_DIR/claude_config.json" << EOF
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": [
        "$PROJECT_DIR/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js",
        "$PROJECT_DIR"
      ]
    },
    "github": {
      "command": "node",
      "args": [
        "$PROJECT_DIR/node_modules/@modelcontextprotocol/server-github/dist/index.js"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "\${GITHUB_TOKEN}"
      }
    },
    "memory": {
      "command": "node",
      "args": [
        "$PROJECT_DIR/node_modules/@modelcontextprotocol/server-memory/dist/index.js"
      ]
    },
    "brave-search": {
      "command": "node",
      "args": [
        "$PROJECT_DIR/node_modules/@modelcontextprotocol/server-brave-search/dist/index.js"
      ],
      "env": {
        "BRAVE_API_KEY": "\${BRAVE_API_KEY}"
      }
    },
    "playwright": {
      "command": "node",
      "args": [
        "$PROJECT_DIR/node_modules/@playwright/mcp/cli.js"
      ]
    },
    "context7": {
      "command": "node",
      "args": [
        "$PROJECT_DIR/node_modules/@upstash/context7-mcp/dist/index.js"
      ]
    }
  }
}
EOF

# 4. 기존 settings.json 백업 및 업데이트
if [ -f "$CLAUDE_CONFIG_DIR/settings.json" ]; then
    echo "📋 기존 settings.json 백업 중..."
    cp "$CLAUDE_CONFIG_DIR/settings.json" "$CLAUDE_CONFIG_DIR/settings.json.backup"
fi

# 5. settings.json 생성 또는 업데이트
cat > "$CLAUDE_CONFIG_DIR/settings.json" << EOF
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": [
        "$PROJECT_DIR/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js",
        "$PROJECT_DIR"
      ]
    },
    "github": {
      "command": "node",
      "args": [
        "$PROJECT_DIR/node_modules/@modelcontextprotocol/server-github/dist/index.js"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "\${GITHUB_TOKEN}"
      }
    },
    "memory": {
      "command": "node",
      "args": [
        "$PROJECT_DIR/node_modules/@modelcontextprotocol/server-memory/dist/index.js"
      ]
    }
  }
}
EOF

# 6. 환경 변수 설정 안내
echo ""
echo "✅ MCP 서버 설정 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. GitHub 토큰 설정 (없으면 GitHub MCP가 작동하지 않음):"
echo "   export GITHUB_TOKEN='your-github-token'"
echo ""
echo "2. Brave Search API 키 설정 (선택사항):"
echo "   export BRAVE_API_KEY='your-brave-api-key'"
echo ""
echo "3. Claude Code 재시작:"
echo "   - 모든 Claude 프로세스 종료: pkill -f claude"
echo "   - 새 터미널에서 Claude 시작: claude"
echo ""
echo "4. MCP 서버 확인:"
echo "   - Claude에서 /mcp 명령 실행"
echo ""
echo "💡 문제 해결 팁:"
echo "   - ~/.claude/logs/ 디렉토리의 로그 확인"
echo "   - Windows에서는 전체 경로 대신 상대 경로 사용 권장"