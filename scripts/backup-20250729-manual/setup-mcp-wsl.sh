#!/bin/bash

# setup-mcp-wsl.sh
# WSL에서 Claude Code를 위한 MCP 설정 스크립트

echo "🚀 WSL MCP 설정 스크립트"
echo "========================="

# 프로젝트 경로
PROJECT_PATH="/mnt/d/cursor/openmanager-vibe-v5"
cd "$PROJECT_PATH"

# 1단계: 환경 변수 설정
echo -e "\n[1/4] 환경 변수 설정 중..."

# .env.local 파일에서 환경 변수 읽기
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local 파일을 찾을 수 없습니다!"
    exit 1
fi

# 환경 변수 export
export GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" .env.local | cut -d'=' -f2)
export SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d'=' -f2)
export SUPABASE_SERVICE_ROLE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env.local | cut -d'=' -f2)
export GOOGLE_AI_API_KEY=$(grep "^GOOGLE_AI_API_KEY=" .env.local | cut -d'=' -f2)
export TAVILY_API_KEY=$(grep "^TAVILY_API_KEY=" .env.local | cut -d'=' -f2)

echo "✅ 환경 변수 export 완료"

# 2단계: ~/.bashrc에 환경 변수 추가
echo -e "\n[2/4] ~/.bashrc에 환경 변수 추가 중..."

# 백업 생성
cp ~/.bashrc ~/.bashrc.backup.$(date +%Y%m%d_%H%M%S)

# 기존 MCP 환경 변수 제거
sed -i '/# MCP Environment Variables/,/# End MCP Environment Variables/d' ~/.bashrc

# 새로운 환경 변수 추가
cat >> ~/.bashrc << 'EOF'

# MCP Environment Variables
export GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" /mnt/d/cursor/openmanager-vibe-v5/.env.local 2>/dev/null | cut -d'=' -f2)
export SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" /mnt/d/cursor/openmanager-vibe-v5/.env.local 2>/dev/null | cut -d'=' -f2)
export SUPABASE_SERVICE_ROLE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" /mnt/d/cursor/openmanager-vibe-v5/.env.local 2>/dev/null | cut -d'=' -f2)
export GOOGLE_AI_API_KEY=$(grep "^GOOGLE_AI_API_KEY=" /mnt/d/cursor/openmanager-vibe-v5/.env.local 2>/dev/null | cut -d'=' -f2)
export TAVILY_API_KEY=$(grep "^TAVILY_API_KEY=" /mnt/d/cursor/openmanager-vibe-v5/.env.local 2>/dev/null | cut -d'=' -f2)
# End MCP Environment Variables
EOF

echo "✅ ~/.bashrc 업데이트 완료"

# 3단계: MCP 설정 파일 수정
echo -e "\n[3/4] MCP 설정 파일 수정 중..."

# 백업 생성
cp .claude/mcp.json .claude/mcp.json.backup.$(date +%Y%m%d_%H%M%S)

# Python을 사용하여 JSON 수정
python3 << EOF
import json

with open('.claude/mcp.json', 'r') as f:
    config = json.load(f)

# filesystem 경로를 WSL 형식으로
if 'filesystem' in config['mcpServers']:
    config['mcpServers']['filesystem']['args'][3] = '/mnt/d/cursor/openmanager-vibe-v5'

# tavily 경로 수정
if 'tavily' in config['mcpServers']:
    config['mcpServers']['tavily']['args'][0] = '/mnt/d/cursor/openmanager-vibe-v5/scripts/tavily-mcp-wrapper.mjs'

# gemini-cli-bridge 제거 (MCP 지원 중단)
# 대신 ./tools/g 사용 권장
if 'gemini-cli-bridge' in config['mcpServers']:
    del config['mcpServers']['gemini-cli-bridge']
    print("  - gemini-cli-bridge 제거됨 (MCP 지원 중단)")

with open('.claude/mcp.json', 'w') as f:
    json.dump(config, f, indent=2)

print("✅ MCP 설정 파일 수정 완료")
EOF

# 4단계: brave-search 제거
echo -e "\n[4/4] brave-search 제거 중..."

# 로컬 settings 파일에서 brave-search 제거
if [ -f ".claude/settings.local.json" ]; then
    python3 << EOF
import json

try:
    with open('.claude/settings.local.json', 'r') as f:
        settings = json.load(f)
    
    if 'enabledMcpjsonServers' in settings:
        settings['enabledMcpjsonServers'] = [s for s in settings['enabledMcpjsonServers'] if s != 'brave-search']
    
    with open('.claude/settings.local.json', 'w') as f:
        json.dump(settings, f, indent=2)
    
    print("✅ brave-search 제거 완료")
except Exception as e:
    print(f"⚠️  설정 파일 수정 중 오류: {e}")
EOF
fi

# 환경 변수 확인
echo -e "\n📊 환경 변수 설정 확인:"
echo "  GITHUB_TOKEN = ${GITHUB_TOKEN:0:10}..."
echo "  SUPABASE_URL = ${SUPABASE_URL}"
echo "  SUPABASE_SERVICE_ROLE_KEY = ${SUPABASE_SERVICE_ROLE_KEY:0:10}..."
echo "  GOOGLE_AI_API_KEY = ${GOOGLE_AI_API_KEY:0:10}..."
echo "  TAVILY_API_KEY = ${TAVILY_API_KEY:0:10}..."

# Tavily 테스트
echo -e "\n🧪 Tavily MCP 테스트..."
if [ -f "scripts/test-tavily-mcp.mjs" ]; then
    node scripts/test-tavily-mcp.mjs
fi

echo -e "\n✅ WSL MCP 설정 완료!"
echo -e "\n📋 다음 단계:"
echo "1. 새 터미널 열기 또는 'source ~/.bashrc' 실행"
echo "2. Claude Code 재시작: 'pkill -f claude && claude'"
echo "3. 프로젝트 열기"
echo "4. /mcp 명령으로 상태 확인"

echo -e "\n💡 현재 터미널에서 바로 적용하려면:"
echo "source ~/.bashrc"