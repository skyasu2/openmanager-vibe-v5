#!/bin/bash

# 🧪 MCP 테스트용 환경변수 설정 스크립트
# 실제 API 키를 얻기 전 임시로 사용할 더미 값들을 설정합니다

echo "🧪 MCP 테스트용 환경변수 설정 중..."

# 현재 터미널 세션에 환경변수 설정
export GITHUB_PERSONAL_ACCESS_TOKEN="dummy_token_replace_later"
export SUPABASE_PROJECT_ID="your-supabase-project-id"  # 실제 프로젝트 ID로 교체 필요
export SUPABASE_ACCESS_TOKEN="dummy_supabase_token" 
export TAVILY_API_KEY="dummy_tavily_key"
export UPSTASH_REDIS_REST_URL="https://dummy-redis.upstash.io"
export UPSTASH_REDIS_REST_TOKEN="dummy_upstash_token"

echo "✅ 테스트용 환경변수 설정 완료"
echo "📝 참고: 실제 API 키로 교체해야 완전한 기능을 사용할 수 있습니다"

# 설정된 환경변수 확인
echo
echo "🔍 설정된 환경변수:"
echo "GITHUB_PERSONAL_ACCESS_TOKEN=$GITHUB_PERSONAL_ACCESS_TOKEN"
echo "SUPABASE_PROJECT_ID=$SUPABASE_PROJECT_ID"
echo "SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN"
echo "TAVILY_API_KEY=$TAVILY_API_KEY"
echo "UPSTASH_REDIS_REST_URL=$UPSTASH_REDIS_REST_URL"
echo "UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REDIS_REST_TOKEN"

echo
echo "🚀 이제 Claude Code를 재시작하고 /mcp 명령으로 상태를 확인하세요"
echo "📖 실제 API 키 설정 방법은 MCP_SETUP_GUIDE.md를 참조하세요"