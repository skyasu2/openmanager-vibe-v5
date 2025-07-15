#!/bin/bash

# 수파베이스 MCP 설정 스크립트

echo "🔧 수파베이스 MCP 설정 가이드"
echo "================================"
echo ""
echo "이 스크립트는 수파베이스 MCP 연결 문제를 해결하는 방법을 안내합니다."
echo ""

# 프로젝트 참조 ID 추출
PROJECT_REF="vnswjnltnhpsueosfhmw"

echo "📌 필요한 작업:"
echo ""
echo "1. 수파베이스 Personal Access Token 생성"
echo "   - https://supabase.com/dashboard/account/tokens 방문"
echo "   - 'Generate new token' 클릭"
echo "   - 토큰 이름: 'Claude MCP Server' 또는 유사한 이름"
echo "   - 생성된 토큰을 복사하여 안전한 곳에 저장"
echo ""
echo "2. Claude Code MCP 설정 파일 생성"
echo "   - 위치: ~/.config/claude-code/mcpServers.json (Windows: %APPDATA%/claude-code/mcpServers.json)"
echo ""

# MCP 설정 JSON 생성
cat << 'EOF' > .claude/supabase-mcp-config.json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=vnswjnltnhpsueosfhmw"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_PERSONAL_ACCESS_TOKEN_HERE"
      }
    }
  }
}
EOF

echo "3. 생성된 설정 파일 확인"
echo "   - 파일 위치: .claude/supabase-mcp-config.json"
echo "   - YOUR_PERSONAL_ACCESS_TOKEN_HERE를 실제 토큰으로 교체"
echo ""
echo "4. Windows 사용자의 경우 cmd 래퍼 추가 필요:"
cat << 'EOF' > .claude/supabase-mcp-config-windows.json
{
  "mcpServers": {
    "supabase": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=vnswjnltnhpsueosfhmw"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_PERSONAL_ACCESS_TOKEN_HERE"
      }
    }
  }
}
EOF

echo ""
echo "5. 권장 보안 설정:"
echo "   - --read-only: 읽기 전용 모드 (권장)"
echo "   - --project-ref: 특정 프로젝트로 제한 (권장)"
echo "   - --features: 필요한 기능만 활성화"
echo ""
echo "   예시: --features=database,docs"
echo ""

# 환경변수 설정 가이드
cat << 'EOF' > .claude/supabase-env-setup.sh
# 수파베이스 환경변수 설정 (선택사항)
# Personal Access Token을 환경변수로 설정하면 설정 파일에서 제외 가능

# Linux/Mac:
export SUPABASE_ACCESS_TOKEN="your-personal-access-token"

# Windows (PowerShell):
# $env:SUPABASE_ACCESS_TOKEN="your-personal-access-token"

# Windows (CMD):
# set SUPABASE_ACCESS_TOKEN=your-personal-access-token
EOF

echo "📁 생성된 파일들:"
echo "   - .claude/supabase-mcp-config.json (기본 설정)"
echo "   - .claude/supabase-mcp-config-windows.json (Windows용)"
echo "   - .claude/supabase-env-setup.sh (환경변수 설정 가이드)"
echo ""
echo "⚠️  중요: Personal Access Token은 절대 커밋하지 마세요!"
echo ""
echo "✅ 설정 완료 후 Claude Code를 재시작하면 mcp__supabase 도구를 사용할 수 있습니다."