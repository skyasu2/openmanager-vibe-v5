#!/bin/bash

# 🧪 MCP 테스트용 환경변수 설정 스크립트
#
# **목적**: MCP 서버 테스트를 위한 더미 환경변수 설정
# **용도**: 실제 API 키 없이 MCP 서버 연결 테스트
# **주의**: 프로덕션 환경에서는 절대 사용하지 말 것!
#
# **사용 시점**:
# - MCP 서버 초기 설정 시
# - .env.local 설정 전 테스트
# - CI/CD 환경에서 더미 값 필요 시
#
# **사용 방법**:
#   1. 현재 터미널에서 실행:
#      source scripts/env/setup-test-env.sh
#
#   2. 또는 서브쉘에서 실행:
#      ./scripts/env/setup-test-env.sh
#
# **주의사항**:
# - 이 스크립트는 실제 API를 호출할 수 없습니다
# - 단순 연결 테스트만 가능합니다
# - 실제 프로젝트에서는 .env.local에 진짜 API 키를 설정해야 합니다
#
# **실제 API 키 설정**:
# - GitHub: https://github.com/settings/tokens
# - Supabase: https://supabase.com/dashboard/project/_/settings/api
# - Tavily: https://tavily.com/
# - Upstash: https://upstash.com/
#
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