#!/bin/bash

# 🧪 실제 API 키로 MCP 서버 테스트
# OpenManager Vibe v5

echo "🧪 실제 API 키로 MCP 서버를 테스트합니다..."
echo

# 환경변수 로드
source .env.local

# GitHub MCP 테스트
echo "📱 1. GitHub MCP 테스트"
if [[ "$GITHUB_PERSONAL_ACCESS_TOKEN" == *"ghp_"* ]]; then
    echo "✅ GitHub Token 형식 확인: 올바름"
    echo "💡 Claude Code에서 다음 명령어로 테스트하세요:"
    echo "   mcp__github__search_repositories({\"query\": \"anthropic claude\", \"perPage\": 3})"
else
    echo "❌ GitHub Token 형식 확인: 잘못됨 (ghp_로 시작해야 함)"
fi
echo

# Tavily MCP 테스트
echo "🔍 2. Tavily MCP 테스트"
if [[ "$TAVILY_API_KEY" == *"tvly-"* ]]; then
    echo "✅ Tavily API Key 형식 확인: 올바름"
    echo "💡 Claude Code에서 다음 명령어로 테스트하세요:"
    echo "   mcp__tavily__tavily-search({\"query\": \"Model Context Protocol\", \"max_results\": 3})"
elif [[ "$TAVILY_API_KEY" == *"dummy"* ]]; then
    echo "⚠️ Tavily API Key: 더미값 사용 중 (실제 키로 교체 필요)"
else
    echo "❌ Tavily API Key 형식 확인: 잘못됨"
fi
echo

# Upstash MCP 테스트  
echo "🗄️ 3. Upstash Context7 MCP 테스트"
if [[ "$UPSTASH_REDIS_REST_URL" == *"upstash.io"* ]] && [[ "$UPSTASH_REDIS_REST_TOKEN" != *"dummy"* ]]; then
    echo "✅ Upstash Redis 설정 확인: 올바름"
    echo "💡 Claude Code에서 다음 명령어로 테스트하세요:"
    echo "   mcp__context7__resolve-library-id({\"libraryName\": \"react\"})"
elif [[ "$UPSTASH_REDIS_REST_URL" == *"dummy"* ]]; then
    echo "⚠️ Upstash Redis: 더미값 사용 중 (실제 키로 교체 필요)"
else
    echo "❌ Upstash Redis 설정 확인: 잘못됨"
fi
echo

# Supabase MCP 테스트
echo "🗄️ 4. Supabase MCP 테스트"
if [[ "$SUPABASE_ACCESS_TOKEN" == *"sbp_"* ]]; then
    echo "✅ Supabase Token 형식 확인: 올바름"
    echo "💡 Claude Code에서 다음 명령어로 테스트하세요:"
    echo "   mcp__supabase__list_tables()"
else
    echo "❌ Supabase Token 형식 확인: 잘못됨"
fi
echo

echo "🔄 다음 단계:"
echo "1. Claude Code를 완전히 재시작하세요"
echo "2. 위의 테스트 명령어들을 Claude Code에서 실행하세요"
echo "3. 모든 MCP가 정상 작동하는지 확인하세요"