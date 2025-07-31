#!/bin/bash
# MCP 서버 안전한 재설정 스크립트
# 2025-07-30 생성

echo "🔧 MCP 서버 안전한 재설정 시작..."
echo ""

# 환경변수 확인
check_env_vars() {
    local missing=0
    
    if [ -z "$GITHUB_TOKEN" ]; then
        echo "❌ GITHUB_TOKEN이 설정되지 않았습니다."
        echo "   export GITHUB_TOKEN='ghp_your_personal_access_token' 실행 필요"
        missing=1
    fi
    
    if [ -z "$TAVILY_API_KEY" ]; then
        echo "❌ TAVILY_API_KEY가 설정되지 않았습니다."
        echo "   export TAVILY_API_KEY='tvly_your_api_key' 실행 필요"
        missing=1
    fi
    
    # .env.local에서 환경변수 로드
    if [ -f "/mnt/d/cursor/openmanager-vibe-v5/.env.local" ]; then
        export $(grep -v '^#' /mnt/d/cursor/openmanager-vibe-v5/.env.local | xargs)
    fi
    
    if [ $missing -eq 1 ]; then
        echo ""
        echo "⚠️  필수 환경변수가 누락되었습니다. 설정 후 다시 실행하세요."
        exit 1
    fi
    
    echo "✅ 환경변수 확인 완료"
}

# MCP 서버 제거
remove_servers() {
    echo ""
    echo "🗑️  기존 MCP 서버 제거 중..."
    
    claude mcp remove github 2>/dev/null
    claude mcp remove tavily-mcp 2>/dev/null
    claude mcp remove supabase 2>/dev/null
    claude mcp remove context7 2>/dev/null
    
    echo "✅ 기존 서버 제거 완료"
}

# MCP 서버 추가 (환경변수 사용)
add_servers() {
    echo ""
    echo "📦 새 MCP 서버 추가 중..."
    
    # filesystem
    echo "- filesystem 추가 중..."
    claude mcp add filesystem npx -- -y @modelcontextprotocol/server-filesystem@latest /mnt/d/cursor/openmanager-vibe-v5
    
    # memory
    echo "- memory 추가 중..."
    claude mcp add memory npx -- -y @modelcontextprotocol/server-memory@latest
    
    # github (환경변수 사용)
    echo "- github 추가 중..."
    claude mcp add github npx -e GITHUB_PERSONAL_ACCESS_TOKEN=$GITHUB_TOKEN -- -y @modelcontextprotocol/server-github@latest
    
    # tavily-mcp (환경변수 사용)
    echo "- tavily-mcp 추가 중..."
    claude mcp add tavily-mcp npx -e TAVILY_API_KEY=$TAVILY_API_KEY -- -y tavily-mcp@0.2.9
    
    # sequential-thinking
    echo "- sequential-thinking 추가 중..."
    claude mcp add sequential-thinking npx -- -y @modelcontextprotocol/server-sequential-thinking@latest
    
    # playwright
    echo "- playwright 추가 중..."
    claude mcp add playwright npx -- -y @playwright/mcp@latest
    
    # supabase (환경변수 사용)
    echo "- supabase 추가 중..."
    claude mcp add supabase npx -e SUPABASE_URL=$SUPABASE_URL -e SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY -- -y @supabase/mcp-server-supabase@latest --project-ref=vnswjnltnhpsueosfhmw
    
    # context7 (환경변수 사용)
    echo "- context7 추가 중..."
    claude mcp add context7 npx -e UPSTASH_REDIS_REST_URL=$UPSTASH_REDIS_REST_URL -e UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REDIS_REST_TOKEN -- -y @upstash/context7-mcp@latest
    
    # time (Python)
    echo "- time 추가 중..."
    claude mcp add time uvx -- mcp-server-time
    
    # serena (Python)
    echo "- serena 추가 중..."
    claude mcp add serena uvx -- --from git+https://github.com/oraios/serena serena-mcp-server --context ide-assistant --project /mnt/d/cursor/openmanager-vibe-v5
    
    echo "✅ MCP 서버 추가 완료"
}

# 메인 실행
main() {
    check_env_vars
    remove_servers
    add_servers
    
    echo ""
    echo "🔄 Claude API 재시작 중..."
    claude api restart
    
    echo ""
    echo "✨ MCP 서버 재설정 완료!"
    echo ""
    echo "다음 명령어로 상태를 확인하세요:"
    echo "  claude mcp list"
    echo "  claude /doctor"
}

# 스크립트 실행
main