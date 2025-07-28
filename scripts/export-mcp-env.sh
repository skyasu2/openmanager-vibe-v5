#!/bin/bash
# MCP 서버용 환경변수 export 스크립트
# 사용법: source ./scripts/export-mcp-env.sh

echo "🔄 MCP 환경변수 export 중..."

# .env.local 파일 확인
if [ ! -f ".env.local" ]; then
    echo "❌ 오류: .env.local 파일이 없습니다!"
    echo "📝 다음 환경변수들을 .env.local에 설정해주세요:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - SUPABASE_ACCESS_TOKEN"
    echo "   - GITHUB_PERSONAL_ACCESS_TOKEN"
    echo "   - TAVILY_API_KEY"
    exit 1
fi

# .env.local에서 환경변수 로드
set -a
source .env.local
set +a

# Supabase 환경변수
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "⚠️  경고: Supabase 환경변수가 설정되지 않았습니다."
else
    export SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
    export SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
    export SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-$SUPABASE_SERVICE_ROLE_KEY}"
fi

# GitHub 환경변수  
if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    echo "⚠️  경고: GITHUB_PERSONAL_ACCESS_TOKEN이 설정되지 않았습니다."
else
    export GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_PERSONAL_ACCESS_TOKEN"
    export GITHUB_TOKEN="$GITHUB_PERSONAL_ACCESS_TOKEN"
fi

# Tavily 환경변수
if [ -z "$TAVILY_API_KEY" ]; then
    echo "⚠️  경고: TAVILY_API_KEY가 설정되지 않았습니다."
else
    export TAVILY_API_KEY="$TAVILY_API_KEY"
fi

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
echo "🔒 보안: 절대로 API 키를 하드코딩하지 마세요!"