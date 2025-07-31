#!/bin/bash
# MCP 서버 환경변수 설정 스크립트
# 2025-07-30 생성

# .env.local 파일 로드
if [ -f "/mnt/d/cursor/openmanager-vibe-v5/.env.local" ]; then
    export $(grep -v '^#' /mnt/d/cursor/openmanager-vibe-v5/.env.local | xargs)
fi

# MCP 서버에 필요한 환경변수 설정
export GITHUB_TOKEN="${GITHUB_CLIENT_ID}" # 실제 GitHub Personal Access Token으로 교체 필요
export TAVILY_API_KEY="${TAVILY_API_KEY:-your_tavily_api_key}"
export SUPABASE_PROJECT_ID="vnswjnltnhpsueosfhmw"

echo "MCP 환경변수 설정 완료:"
echo "- SUPABASE_URL: ${SUPABASE_URL}"
echo "- UPSTASH_REDIS_REST_URL: ${UPSTASH_REDIS_REST_URL}"
echo "- GOOGLE_AI_API_KEY: ${GOOGLE_AI_API_KEY}"
echo ""
echo "⚠️  주의: GitHub Personal Access Token을 GITHUB_TOKEN 환경변수로 설정해야 합니다."
echo "⚠️  주의: Tavily API Key를 TAVILY_API_KEY 환경변수로 설정해야 합니다."