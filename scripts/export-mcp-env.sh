#!/bin/bash
# MCP 서버용 환경변수 export 스크립트
# 사용법: source ./scripts/export-mcp-env.sh

echo "🔄 MCP 환경변수 export 중..."

# Supabase 환경변수
export SUPABASE_URL="https://vnswjnltnhpsueosfhmw.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8"
export SUPABASE_ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8"

# GitHub 환경변수  
export GITHUB_PERSONAL_ACCESS_TOKEN="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"
export GITHUB_TOKEN="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"

# Tavily 환경변수
export TAVILY_API_KEY="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"

echo "✅ MCP 환경변수 export 완료!"
echo "📝 사용 가능한 MCP 서버 (9개):"
echo "   - filesystem (환경변수 불필요)"
echo "   - memory (환경변수 불필요)" 
echo "   - sequential-thinking (환경변수 불필요)"
echo "   - context7 (환경변수 불필요)"
echo "   - playwright (환경변수 불필요)"
echo "   - serena (환경변수 불필요)"
echo "   - github (GITHUB_PERSONAL_ACCESS_TOKEN)"
echo "   - tavily-mcp (TAVILY_API_KEY)" 
echo "   - supabase (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ACCESS_TOKEN)"
echo ""
echo "⚠️  주의: 새로운 환경변수가 MCP 서버에 반영되려면 Claude Code를 재시작해야 할 수 있습니다."