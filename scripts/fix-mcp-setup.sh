#!/bin/bash

echo "🔧 MCP 서버 문제 해결 스크립트"
echo "================================"

# 1. Claude Code 전역 설정 업데이트
echo "1. Claude Code 전역 설정 업데이트 중..."
cat > ~/.claude/settings.json << 'EOF'
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["/mnt/d/cursor/openmanager-vibe-v5/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js"],
      "env": {
        "ALLOWED_DIRECTORIES": "/mnt/d/cursor/openmanager-vibe-v5"
      }
    },
    "github": {
      "command": "node",
      "args": ["/mnt/d/cursor/openmanager-vibe-v5/node_modules/@modelcontextprotocol/server-github/dist/index.js"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "supabase": {
      "command": "node",
      "args": ["/mnt/d/cursor/openmanager-vibe-v5/node_modules/@supabase/mcp-server-supabase/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://vnswjnltnhpsueosfhmw.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8"
      }
    },
    "brave-search": {
      "command": "node",
      "args": ["/mnt/d/cursor/openmanager-vibe-v5/node_modules/@modelcontextprotocol/server-brave-search/dist/index.js"],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      }
    },
    "memory": {
      "command": "node",
      "args": ["/mnt/d/cursor/openmanager-vibe-v5/node_modules/@modelcontextprotocol/server-memory/dist/index.js"]
    }
  }
}
EOF

echo "✅ 전역 설정 파일 업데이트 완료"

# 2. 환경 변수 설정
echo ""
echo "2. 환경 변수 설정 중..."
export SUPABASE_URL="https://vnswjnltnhpsueosfhmw.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8"

# 3. 테스트 스크립트 생성
echo ""
echo "3. MCP 테스트 스크립트 생성 중..."
cat > /mnt/d/cursor/openmanager-vibe-v5/scripts/test-mcp-direct.js << 'EOF'
const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 MCP 서버 직접 테스트');
console.log('========================');

// Filesystem MCP 테스트
const fsServer = spawn('node', [
  path.join(__dirname, '../node_modules/@modelcontextprotocol/server-filesystem/dist/index.js')
], {
  env: {
    ...process.env,
    ALLOWED_DIRECTORIES: '/mnt/d/cursor/openmanager-vibe-v5'
  }
});

fsServer.stdout.on('data', (data) => {
  console.log(`[FS MCP] ${data}`);
});

fsServer.stderr.on('data', (data) => {
  console.error(`[FS MCP Error] ${data}`);
});

// 테스트 메시지 전송
setTimeout(() => {
  const testMessage = JSON.stringify({
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '1.0.0',
      capabilities: {}
    },
    id: 1
  });
  
  console.log('테스트 메시지 전송:', testMessage);
  fsServer.stdin.write(testMessage + '\n');
}, 1000);

// 5초 후 종료
setTimeout(() => {
  fsServer.kill();
  process.exit(0);
}, 5000);
EOF

echo "✅ 테스트 스크립트 생성 완료"

# 4. 대체 방법 안내
echo ""
echo "📋 다음 단계:"
echo "1. Claude Code를 완전히 종료하세요 (모든 프로세스)"
echo "2. 터미널에서 다음 명령 실행:"
echo "   pkill -f claude"
echo "3. 환경 변수가 설정된 터미널에서 Claude Code 재시작:"
echo "   claude"
echo "4. MCP 테스트:"
echo "   /mcp"
echo ""
echo "💡 여전히 작동하지 않는다면:"
echo "   - node scripts/test-mcp-direct.js 로 MCP 서버 직접 테스트"
echo "   - ~/.claude/logs/ 디렉토리의 로그 확인"