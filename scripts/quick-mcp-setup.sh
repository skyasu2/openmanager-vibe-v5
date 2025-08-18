#!/bin/bash

# 🚀 빠른 MCP 환경변수 설정 (테스트용)
# OpenManager Vibe v5

echo "🔧 빠른 MCP 환경변수 설정 중..."

# 기존 MCP 환경변수 제거 (있다면)
if grep -q "# MCP 서버 환경변수" ~/.bashrc 2>/dev/null; then
    echo "기존 MCP 환경변수 제거 중..."
    sed -i '/# MCP 서버 환경변수/,/# MCP 환경변수 끝/d' ~/.bashrc
fi

# 새 환경변수 추가
cat >> ~/.bashrc << 'EOF'

# MCP 서버 환경변수 (OpenManager Vibe v5)
# ==========================================
# 🔑 실제 API 키로 교체 필요 - 아래 링크에서 발급:
# GitHub: https://github.com/settings/tokens (repo, read:org 권한)
# Supabase: https://supabase.com/dashboard/account/tokens
# Tavily: https://tavily.com/ (무료 1000회/월)
# Upstash: https://console.upstash.com/redis (무료 10MB)

export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_test_token_replace_with_real"
export SUPABASE_PROJECT_ID="your-project-id"  # 실제 Supabase 프로젝트 ID로 교체
export SUPABASE_ACCESS_TOKEN="sbp_test_token_replace_with_real"
export TAVILY_API_KEY="tvly-test_key_replace_with_real"
export UPSTASH_REDIS_REST_URL="https://test-redis.upstash.io"
export UPSTASH_REDIS_REST_TOKEN="test_token_replace_with_real"

# MCP 편의 명령어
alias mcp-status="claude mcp list"
alias mcp-env="env | grep -E '(GITHUB|SUPABASE|TAVILY|UPSTASH)' | sort"

# MCP 환경변수 끝
EOF

# 권한 설정
chmod 600 ~/.bashrc

# 현재 세션에 적용
source ~/.bashrc

echo "✅ MCP 환경변수 설정 완료!"
echo
echo "설정된 환경변수:"
env | grep -E "(GITHUB|SUPABASE|TAVILY|UPSTASH)" | sort

echo
echo "🚀 다음 단계:"
echo "1. 실제 API 키로 교체: nano ~/.bashrc"
echo "2. Claude Code 재시작 (새 터미널)"
echo "3. 연결 확인: /mcp"

echo
echo "📋 API 키 발급 링크:"
echo "• GitHub: https://github.com/settings/tokens"
echo "• Supabase: https://supabase.com/dashboard/account/tokens"  
echo "• Tavily: https://tavily.com/"
echo "• Upstash: https://console.upstash.com/redis"