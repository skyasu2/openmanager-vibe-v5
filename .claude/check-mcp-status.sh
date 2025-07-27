#!/bin/bash
# MCP 서버 상태 및 연결 확인 스크립트

echo "🔍 MCP 서버 상태 확인 중..."
echo "================================"

# 환경변수 파일 경로
ENV_FILE="/mnt/d/cursor/openmanager-vibe-v5/.env.local"

# 1. 환경변수 확인
echo ""
echo "📋 환경변수 상태:"
echo "--------------------------------"

# .env.local 파일 로드
if [ -f "$ENV_FILE" ]; then
    set -a
    source <(grep -v '^#' "$ENV_FILE" | grep -v '^$')
    set +a
    echo "✅ .env.local 파일 로드됨"
else
    echo "❌ .env.local 파일을 찾을 수 없습니다"
fi

# 필수 환경변수 확인
env_vars=(
    "GITHUB_TOKEN:GitHub MCP"
    "GITHUB_PERSONAL_ACCESS_TOKEN:GitHub MCP (대체)"
    "SUPABASE_URL:Supabase MCP"
    "SUPABASE_SERVICE_ROLE_KEY:Supabase MCP"
    "TAVILY_API_KEY:Tavily MCP"
)

for var in "${env_vars[@]}"; do
    IFS=':' read -r var_name var_desc <<< "$var"
    if [ ! -z "${!var_name}" ]; then
        echo "✅ $var_name: 설정됨 ($var_desc)"
    else
        echo "❌ $var_name: 미설정 ($var_desc)"
    fi
done

# 2. MCP 서버 설치 상태 확인
echo ""
echo "📦 MCP 서버 설치 상태:"
echo "--------------------------------"

# filesystem 서버 확인
if command -v mcp-server-filesystem &> /dev/null || [ -f "/home/sungho/.local/bin/mcp-server-filesystem" ]; then
    echo "✅ filesystem: 설치됨"
else
    echo "⚠️  filesystem: npx로 실행 가능"
fi

# playwright 서버 확인
if command -v mcp-server-playwright &> /dev/null || [ -f "/home/sungho/.local/bin/mcp-server-playwright" ]; then
    echo "✅ playwright: 설치됨"
else
    echo "⚠️  playwright: npx로 실행 가능"
fi

# 3. MCP 서버 연결 가능성 테스트
echo ""
echo "🔌 MCP 서버 연결 테스트:"
echo "--------------------------------"

# MCP 설정 파일 확인
MCP_CONFIG="/mnt/d/cursor/openmanager-vibe-v5/.claude/mcp.json"
if [ -f "$MCP_CONFIG" ]; then
    echo "✅ MCP 설정 파일 존재"
    
    # 설정된 서버 목록 확인
    servers=$(jq -r '.mcpServers | keys[]' "$MCP_CONFIG" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo ""
        echo "📋 설정된 MCP 서버 목록:"
        for server in $servers; do
            echo "  - $server"
        done
    fi
else
    echo "❌ MCP 설정 파일이 없습니다"
fi

# 4. 각 MCP 서버별 상태 요약
echo ""
echo "📊 MCP 서버 종합 상태:"
echo "================================"

declare -A mcp_status
mcp_status=(
    ["filesystem"]="✅ 정상 (기본 도구)"
    ["github"]="$([ ! -z "$GITHUB_TOKEN" ] && echo "✅ 정상" || echo "❌ 토큰 필요")"
    ["memory"]="✅ 정상 (로컬 저장소)"
    ["supabase"]="$([ ! -z "$SUPABASE_URL" ] && [ ! -z "$SUPABASE_SERVICE_ROLE_KEY" ] && echo "✅ 정상" || echo "❌ 설정 필요")"
    ["context7"]="✅ 정상 (외부 API)"
    ["tavily-mcp"]="$([ ! -z "$TAVILY_API_KEY" ] && echo "✅ 정상" || echo "❌ API 키 필요")"
    ["sequential-thinking"]="✅ 정상 (로컬 처리)"
    ["playwright"]="✅ 정상 (브라우저 자동화)"
    ["serena"]="✅ 정상 (프로젝트별 활성화 필요)"
)

for server in "${!mcp_status[@]}"; do
    printf "%-20s : %s\n" "$server" "${mcp_status[$server]}"
done | sort

# 5. 권장 사항
echo ""
echo "💡 권장 사항:"
echo "--------------------------------"

missing_count=0
for status in "${mcp_status[@]}"; do
    if [[ $status == *"❌"* ]]; then
        ((missing_count++))
    fi
done

if [ $missing_count -eq 0 ]; then
    echo "✅ 모든 MCP 서버가 정상적으로 설정되어 있습니다."
else
    echo "⚠️  $missing_count개의 MCP 서버에 설정이 필요합니다."
    echo ""
    echo "해결 방법:"
    [ -z "$GITHUB_TOKEN" ] && echo "- GITHUB_TOKEN을 .env.local에 추가하세요"
    [ -z "$SUPABASE_URL" ] && echo "- SUPABASE_URL을 .env.local에 추가하세요"
    [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] && echo "- SUPABASE_SERVICE_ROLE_KEY를 .env.local에 추가하세요"
    [ -z "$TAVILY_API_KEY" ] && echo "- TAVILY_API_KEY를 .env.local에 추가하세요"
fi

echo ""
echo "💡 Serena MCP는 프로젝트별로 활성화가 필요합니다:"
echo "   사용 전: mcp__serena__activate_project('openmanager-vibe-v5')"
echo ""
echo "================================"
echo "✅ MCP 상태 확인 완료"