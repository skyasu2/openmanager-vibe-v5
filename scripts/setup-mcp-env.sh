#!/bin/bash

# MCP 환경 변수 설정 스크립트
# .env.local 파일에서 환경변수를 읽어옵니다

echo "🔧 MCP 환경 변수 설정 중..."

# .env.local 파일 확인
if [ -f ".env.local" ]; then
    echo "📄 .env.local 파일에서 환경변수 로드 중..."
    # .env.local 파일에서 환경변수 읽기 (export 없는 라인도 처리)
    set -a
    source .env.local
    set +a
    echo "✅ 환경변수 로드 완료"
else
    echo "⚠️  .env.local 파일이 없습니다."
    echo "💡 .env.local.template을 복사하여 설정하세요:"
    echo "   cp .env.local.template .env.local"
    exit 1
fi

# 필수 환경변수 확인
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ 필수 Supabase 환경변수가 설정되지 않았습니다."
    echo "💡 .env.local 파일에 다음 변수를 설정하세요:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

# 환경변수 export (이미 source로 로드되었지만 명시적으로 export)
export SUPABASE_URL
export SUPABASE_SERVICE_ROLE_KEY

# 선택적 환경변수 export (존재하는 경우만)
[ -n "$GITHUB_TOKEN" ] && export GITHUB_TOKEN
[ -n "$BRAVE_API_KEY" ] && export BRAVE_API_KEY

echo "✅ MCP 환경 변수 설정 완료"
echo ""
echo "📌 Claude Code에서 MCP를 활성화하려면:"
echo "1. Claude Code를 완전히 종료"
echo "2. 터미널에서: source scripts/setup-mcp-env.sh"
echo "3. 같은 터미널에서: claude"
echo "4. /mcp 명령어로 확인"