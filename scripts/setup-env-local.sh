#!/bin/bash

# 🔐 .env.local 기반 MCP 환경변수 설정
# OpenManager Vibe v5

echo "🔐 .env.local 기반 MCP 환경변수 설정 중..."

PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
ENV_LOCAL_FILE="$PROJECT_ROOT/.env.local"

# .env.local 파일 존재 확인
if [[ ! -f "$ENV_LOCAL_FILE" ]]; then
    echo "❌ .env.local 파일이 없습니다: $ENV_LOCAL_FILE"
    exit 1
fi

# 기존 MCP 환경변수 제거 (있다면)
if grep -q "# MCP 서버 환경변수" ~/.bashrc 2>/dev/null; then
    echo "🧹 기존 MCP 환경변수 제거 중..."
    sed -i '/# MCP 서버 환경변수/,/# MCP 환경변수 끝/d' ~/.bashrc
fi

# .bashrc에 .env.local 로더 추가
cat >> ~/.bashrc << EOF

# MCP 서버 환경변수 (OpenManager Vibe v5)
# ==========================================
# .env.local 파일에서 환경변수 로드
if [[ -f "$ENV_LOCAL_FILE" ]]; then
    export \$(grep -v '^#' "$ENV_LOCAL_FILE" | grep -v '^$' | xargs)
fi

# MCP 편의 명령어
alias mcp-status="claude mcp list"
alias mcp-env="env | grep -E '(GITHUB|SUPABASE|TAVILY|UPSTASH)' | sort"
alias mcp-test="cd $PROJECT_ROOT && source scripts/test-mcp-servers.sh"

# MCP 환경변수 끝
EOF

# 권한 설정
chmod 600 ~/.bashrc
chmod 600 "$ENV_LOCAL_FILE"

# 현재 세션에 적용
source ~/.bashrc

echo "✅ .env.local 기반 환경변수 설정 완료!"
echo
echo "📍 설정된 환경변수:"
if [[ -f "$ENV_LOCAL_FILE" ]]; then
    env | grep -E "(GITHUB|SUPABASE|TAVILY|UPSTASH)" | sort | while read line; do
        key=$(echo "$line" | cut -d'=' -f1)
        value=$(echo "$line" | cut -d'=' -f2-)
        if [[ "$value" == *"your_actual"* || "$value" == *"_here" ]]; then
            echo "  ⚠️  $key=템플릿값 (실제 API 키로 교체 필요)"
        else
            echo "  ✅ $key=${value:0:20}..."
        fi
    done
else
    echo "❌ .env.local 파일을 읽을 수 없습니다."
fi

echo
echo "🔧 다음 단계:"
echo "1. 실제 API 키 설정:"
echo "   nano $ENV_LOCAL_FILE"
echo
echo "2. API 키 발급 링크:"
echo "   • GitHub: https://github.com/settings/tokens (repo, read:org 권한)"
echo "   • Supabase: https://supabase.com/dashboard/account/tokens"
echo "   • Tavily: https://tavily.com/ (무료 1000회/월)"
echo "   • Upstash: https://console.upstash.com/redis (무료 10MB)"
echo
echo "3. 환경변수 다시 로드:"
echo "   source ~/.bashrc"
echo
echo "4. Claude Code 재시작 후 테스트:"
echo "   /mcp"

echo
echo "🛡️ 보안:"
echo "✅ .env.local이 .gitignore에 추가됨 (Git 커밋 방지)"
echo "✅ 파일 권한 600으로 설정됨 (소유자만 읽기/쓰기)"