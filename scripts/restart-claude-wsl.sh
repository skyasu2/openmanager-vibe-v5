#!/bin/bash

# restart-claude-wsl.sh
# WSL에서 Claude Code 재시작 스크립트

echo "🔄 Claude Code 재시작 중..."

# Claude 프로세스 종료
echo "⏹️  Claude Code 종료 중..."
pkill -f "claude" 2>/dev/null || true
sleep 2

# 환경 변수 다시 로드
echo "🔄 환경 변수 다시 로드..."
source ~/.bashrc

# 환경 변수 확인
echo "✅ 환경 변수 확인:"
env | grep -E "(GITHUB_TOKEN|SUPABASE|TAVILY|GOOGLE_AI)" | while read line; do
    var_name=$(echo $line | cut -d'=' -f1)
    var_value=$(echo $line | cut -d'=' -f2)
    echo "  $var_name = ${var_value:0:10}..."
done

# Claude Code 시작
echo -e "\n🚀 Claude Code 시작 중..."
nohup claude > /dev/null 2>&1 &

echo "✅ Claude Code가 백그라운드에서 시작되었습니다!"
echo ""
echo "💡 프로젝트 열기:"
echo "  cd /mnt/d/cursor/openmanager-vibe-v5"
echo "  claude"