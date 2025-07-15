#!/bin/bash
# MCP 환경변수 설정

# .env.local 파일에서 환경변수 읽기
if [ -f "$PROJECT_PATH/.env.local" ]; then
    export $(cat "$PROJECT_PATH/.env.local" | grep -E '^(GITHUB_TOKEN|SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|TAVILY_API_KEY)=' | xargs)
fi

# 환경변수 확인
echo "환경변수 상태:"
echo "GITHUB_TOKEN: ${GITHUB_TOKEN:+설정됨}"
echo "SUPABASE_URL: ${SUPABASE_URL:+설정됨}"
echo "SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:+설정됨}"
echo "TAVILY_API_KEY: ${TAVILY_API_KEY:+설정됨}"
