#!/bin/bash

echo "🔧 MCP 설정 리셋 스크립트"
echo "========================"

# 1. 기존 설정 백업
echo "📋 기존 설정 백업 중..."
if [ -f "$HOME/.claude/settings.json" ]; then
    cp "$HOME/.claude/settings.json" "$HOME/.claude/settings.json.backup.$(date +%Y%m%d_%H%M%S)"
fi

# 2. 최소한의 MCP 설정 생성
echo "📝 최소 MCP 설정 생성 중..."
cat > "$HOME/.claude/settings.json" << 'EOF'
{
  "mcpServers": {}
}
EOF

echo "✅ MCP 설정이 리셋되었습니다."
echo ""
echo "📋 다음 단계:"
echo "1. Claude Code를 완전히 종료하고 재시작하세요"
echo "2. 다시 /mcp 명령을 실행해보세요"
echo ""
echo "💡 이제 MCP 서버 없이 Claude Code가 정상 작동해야 합니다."