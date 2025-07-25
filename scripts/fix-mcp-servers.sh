#!/bin/bash

echo "🔧 MCP 서버 설정을 수정합니다..."

# 진단 모드 확인
if [ "$1" == "--diagnose" ]; then
    echo "🔍 MCP 서버 상태 진단 중..."
    echo ""
    echo "1. 현재 설정된 MCP 서버:"
    claude mcp list
    echo ""
    echo "2. 환경 변수 확인:"
    echo "TAVILY_API_KEY 설정 여부: $([ -n "$TAVILY_API_KEY" ] && echo "✓" || echo "✗")"
    echo "SUPABASE_URL 설정 여부: $([ -n "$SUPABASE_URL" ] && echo "✓" || echo "✗")"
    echo ""
    echo "3. 서버 직접 테스트:"
    echo "- Tavily MCP 테스트..."
    TAVILY_API_KEY="${TAVILY_API_KEY:-미설정}" timeout 2s npx -y tavily-mcp 2>&1 | head -n 5
    echo ""
    exit 0
fi

# 환경변수에서 가져오기
SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF:-your_supabase_project_id_here}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-SENSITIVE_INFO_REMOVED}"
TAVILY_API_KEY="${TAVILY_API_KEY:-YOUR_TAVILY_API_KEY_PLACEHOLDER}"

# MCP 서버 제거
echo "기존 서버 제거 중..."
claude mcp remove supabase 2>/dev/null
claude mcp remove tavily 2>/dev/null
claude mcp remove tavily-mcp 2>/dev/null

# Supabase MCP 추가 (Service Role Key를 Access Token으로 사용)
echo "Supabase MCP 추가 중..."
claude mcp add supabase \
  -e SUPABASE_ACCESS_TOKEN="$SUPABASE_SERVICE_KEY" \
  -- npx -y @supabase/mcp-server-supabase \
  --project-ref="$SUPABASE_PROJECT_REF"

# Tavily MCP 추가 (올바른 패키지명 사용)
echo "Tavily MCP 추가 중..."
claude mcp add tavily \
  -e TAVILY_API_KEY="$TAVILY_API_KEY" \
  -- npx -y tavily-mcp

echo ""
echo "✅ MCP 서버 설정 완료!"
echo ""
echo "🚨 중요: Claude Code를 재시작해야 변경사항이 적용됩니다!"
echo "   터미널에서 'claude' 종료 후 다시 실행하세요."
echo ""
echo "현재 설정된 서버:"
claude mcp list
echo ""
echo "💡 테스트 방법:"
echo "   1. Claude Code 재시작"
echo "   2. /mcp 명령으로 상태 확인"
echo "   3. mcp__tavily__search 도구 사용 테스트"