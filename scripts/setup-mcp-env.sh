#!/bin/bash

# MCP 환경 변수 설정 스크립트

echo "🔧 MCP 환경 변수 설정 중..."

# Supabase 환경 변수
export SUPABASE_URL="your_supabase_url_here"
export SUPABASE_SERVICE_ROLE_KEY="SENSITIVE_INFO_REMOVED"

# GitHub 토큰 (이미 설정되어 있음)
# export GITHUB_TOKEN="your-github-token"

# Brave API Key (이미 설정되어 있음)  
# export BRAVE_API_KEY="your-brave-api-key"

echo "✅ MCP 환경 변수 설정 완료"
echo ""
echo "📌 Claude Code에서 MCP를 활성화하려면:"
echo "1. Claude Code를 완전히 종료"
echo "2. 터미널에서: source scripts/setup-mcp-env.sh"
echo "3. 같은 터미널에서: claude"
echo "4. /mcp 명령어로 확인"