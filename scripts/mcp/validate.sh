#!/bin/bash
# scripts/validate-mcp-setup.sh
# MCP 설정 검증 자동화 스크립트

echo "🔍 MCP 설정 검증 시작..."

# 1. 필수 파일 존재 확인
echo "📁 필수 파일 확인..."
[ -f ".mcp.json" ] && echo "✅ .mcp.json 존재" || echo "❌ .mcp.json 누락"
[ -f ".claude/settings.local.json" ] && echo "✅ settings.local.json 존재" || echo "❌ settings.local.json 누락"

# 2. JSON 문법 검증
echo "📝 JSON 문법 검증..."
npx jsonlint .mcp.json > /dev/null 2>&1 && echo "✅ .mcp.json 문법 올바름" || echo "❌ .mcp.json 문법 오류"
npx jsonlint .claude/settings.local.json > /dev/null 2>&1 && echo "✅ settings.local.json 문법 올바름" || echo "❌ settings.local.json 문법 오류"

# 3. MCP 서버 일치성 검사 (jq 없는 환경을 위한 대안)
echo "🔗 MCP 서버 일치성 검사..."

# .mcp.json에서 정의된 서버 목록 추출
echo "정의된 서버:"
grep -o '"[^"]*"[[:space:]]*:' .mcp.json | grep -v mcpServers | sed 's/"//g' | sed 's/://g' | sort

# settings.local.json에서 활성화된 서버 목록 추출  
echo "활성화된 서버:"
grep -A 20 "enabledMcpjsonServers" .claude/settings.local.json | grep -o '"[^"]*"' | grep -v enabledMcpjsonServers | sed 's/"//g' | sort

# 4. 환경변수 확인
echo "🌍 환경변수 확인..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local 파일 존재"
    ENV_COUNT=$(grep -E "(API_KEY|TOKEN|URL)" .env.local | wc -l)
    echo "설정된 환경변수 개수: $ENV_COUNT"
else
    echo "❌ .env.local 파일 누락"
fi

# 5. 주요 MCP 패키지 설치 확인
echo "📦 MCP 패키지 설치 확인..."
npm ls @gongrzhe/server-redis-mcp > /dev/null 2>&1 && echo "✅ Redis MCP 설치됨" || echo "❌ Redis MCP 누락"
npm ls @supabase/mcp-server-supabase > /dev/null 2>&1 && echo "✅ Supabase MCP 설치됨" || echo "❌ Supabase MCP 누락"
npm ls @upstash/context7-mcp > /dev/null 2>&1 && echo "✅ Context7 MCP 설치됨" || echo "❌ Context7 MCP 누락"

echo "✅ MCP 설정 검증 완료!"