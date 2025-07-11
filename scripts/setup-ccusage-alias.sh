#!/bin/bash

# setup-ccusage-alias.sh
# ccusage 알리아스 설정 스크립트

echo "🎯 ccusage 알리아스 설정"
echo ""

# 현재 쉘 확인
SHELL_CONFIG=""
if [[ $SHELL == *"zsh"* ]]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [[ $SHELL == *"bash"* ]]; then
    SHELL_CONFIG="$HOME/.bashrc"
else
    echo "❌ 지원하지 않는 쉘입니다: $SHELL"
    exit 1
fi

# 알리아스 추가
echo "📝 $SHELL_CONFIG 파일에 알리아스 추가 중..."

# 이미 알리아스가 있는지 확인
if grep -q "alias ccusage=" "$SHELL_CONFIG"; then
    echo "⚠️  ccusage 알리아스가 이미 존재합니다."
else
    # 프로젝트 경로 가져오기
    PROJECT_DIR=$(cd "$(dirname "$0")/.." && pwd)
    
    echo "" >> "$SHELL_CONFIG"
    echo "# Claude Code Usage Monitor" >> "$SHELL_CONFIG"
    echo "alias ccusage='bash $PROJECT_DIR/scripts/ccusage-wrapper.sh'" >> "$SHELL_CONFIG"
    
    echo "✅ 알리아스가 추가되었습니다!"
fi

echo ""
echo "🔄 설정을 적용하려면 다음 명령어를 실행하세요:"
echo "   source $SHELL_CONFIG"
echo ""
echo "또는 터미널을 새로 열어주세요."
echo ""
echo "📌 사용법: ccusage"