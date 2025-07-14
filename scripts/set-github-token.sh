#!/bin/bash

# 🔐 GitHub 토큰 설정 스크립트 (평문 노출 방지)
# 
# 사용법:
# 1. source scripts/set-github-token.sh
# 2. 토큰 입력 (화면에 표시되지 않음)

echo "🔐 GitHub 토큰 설정 (입력 시 화면에 표시되지 않음)"
read -s -p "GitHub Personal Access Token 입력: " GITHUB_TOKEN
echo
export GITHUB_TOKEN

# 설정 확인
if [ -n "$GITHUB_TOKEN" ]; then
    echo "✅ GitHub 토큰이 환경변수로 설정되었습니다."
    echo "📌 이 설정은 현재 세션에서만 유효합니다."
    echo "🔄 Claude Code를 재시작하면 MCP가 이 토큰을 사용합니다."
    
    # .bashrc에 추가 옵션 제공
    echo
    echo "💡 영구 설정을 원하시면 다음 명령을 실행하세요:"
    echo "   echo 'export GITHUB_TOKEN=\"토큰값\"' >> ~/.bashrc"
    echo "   ⚠️  주의: 이 방법은 토큰이 파일에 저장됩니다."
else
    echo "❌ 토큰 설정 실패"
fi