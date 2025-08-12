#!/bin/bash
# MCP 서버 환경변수 설정 스크립트

echo "🔍 환경변수 확인 중..."

# .env.local 파일 경로
ENV_FILE="$(pwd)/.env.local"

if [ -f "$ENV_FILE" ]; then
    echo "✅ .env.local 파일 발견"
    
    # .env.local 파일 로드 (export 없는 변수들을 처리)
    set -a
    source <(grep -v '^#' "$ENV_FILE" | grep -v '^$')
    set +a
    
    # 필수 환경변수 확인
    echo ""
    echo "📋 MCP 필수 환경변수 상태:"
    
    # GitHub 확인
    if [ ! -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
        echo "✅ GITHUB_PERSONAL_ACCESS_TOKEN: 설정됨"
    else
        echo "❌ GITHUB_PERSONAL_ACCESS_TOKEN: 미설정"
    fi
    
    # Supabase 확인
    if [ ! -z "$SUPABASE_SERVICE_ROLE_KEY" ] && [ ! -z "$SUPABASE_URL" ]; then
        echo "✅ SUPABASE_SERVICE_ROLE_KEY: 설정됨"
        echo "✅ SUPABASE_URL: 설정됨"
    else
        echo "❌ Supabase 환경변수: 미설정"
    fi
    
    # Tavily 확인
    if [ ! -z "$TAVILY_API_KEY" ]; then
        echo "✅ TAVILY_API_KEY: 설정됨"
    else
        echo "❌ TAVILY_API_KEY: 미설정"
    fi
    
else
    echo "⚠️  .env.local 파일을 찾을 수 없습니다: $ENV_FILE"
fi

# WSL GUI 지원 (Playwright용)
if [ -z "$DISPLAY" ]; then
    export DISPLAY=:0
    echo ""
    echo "✅ DISPLAY 환경변수 설정됨: $DISPLAY (Playwright GUI 지원)"
fi

echo ""
echo "💡 팁: .env.local 파일에서 환경변수가 자동으로 로드됩니다."
echo "🔄 변경사항이 있다면 새 터미널을 열거나 'source .claude/setup-mcp-env.sh'를 실행하세요."