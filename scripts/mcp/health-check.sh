#!/bin/bash

# MCP 서버 건강 상태 확인 스크립트
# Claude Code v1.16.0+ CLI 기반

echo "========================================"
echo "MCP 서버 건강 상태 확인"
echo "시간: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
echo ""

# MCP 서버 목록 및 상태 확인
echo "📊 MCP 서버 연결 상태:"
echo "----------------------------------------"
claude mcp list

echo ""
echo "🔍 환경 변수 확인:"
echo "----------------------------------------"

# 필수 환경 변수 체크
check_env() {
    local var_name=$1
    local var_value="${!var_name}"
    
    if [ -n "$var_value" ]; then
        # 토큰의 처음 10자만 표시
        echo "✅ $var_name: ${var_value:0:10}..."
    else
        echo "❌ $var_name: NOT SET"
    fi
}

# 환경 변수 로드
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

echo "GitHub:"
check_env "GITHUB_PERSONAL_ACCESS_TOKEN"

echo ""
echo "Supabase:"
check_env "SUPABASE_URL"
check_env "SUPABASE_SERVICE_ROLE_KEY"
check_env "SUPABASE_ANON_KEY"

echo ""
echo "Tavily:"
check_env "TAVILY_API_KEY"

echo ""
echo "Upstash Redis:"
check_env "UPSTASH_REDIS_REST_URL"
check_env "UPSTASH_REDIS_REST_TOKEN"

echo ""
echo "📝 권장 사항:"
echo "----------------------------------------"
echo "1. 연결 실패 서버가 있다면:"
echo "   - claude mcp remove <서버명>"
echo "   - claude mcp add <서버명> <명령어>"
echo "   - claude api restart"
echo ""
echo "2. 환경 변수가 누락되었다면:"
echo "   - .env.local 파일 확인"
echo "   - 필요한 토큰 재발급"
echo ""
echo "========================================"