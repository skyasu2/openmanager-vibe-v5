#!/bin/bash

# GitHub Token 안전한 설정 스크립트

echo "🔐 GitHub Token 안전 설정 도구"
echo "================================"
echo ""
echo "이 스크립트는 GitHub Personal Access Token을 안전하게 설정합니다."
echo ""

# 현재 토큰 확인
if [ ! -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  경고: GITHUB_TOKEN이 이미 설정되어 있습니다."
    echo "   현재 토큰: ${GITHUB_TOKEN:0:10}...${GITHUB_TOKEN: -4}"
    echo ""
fi

# 토큰 입력 받기
echo "새 GitHub Personal Access Token을 입력하세요:"
echo "(입력 시 화면에 표시되지 않습니다)"
read -s GITHUB_TOKEN_INPUT

if [ -z "$GITHUB_TOKEN_INPUT" ]; then
    echo "❌ 토큰이 입력되지 않았습니다."
    exit 1
fi

# 토큰 검증
echo ""
echo "🔍 토큰 검증 중..."
VALIDATION=$(curl -s -H "Authorization: token $GITHUB_TOKEN_INPUT" https://api.github.com/user)

if [[ $VALIDATION == *"Bad credentials"* ]]; then
    echo "❌ 유효하지 않은 토큰입니다."
    exit 1
fi

USERNAME=$(echo $VALIDATION | grep -o '"login":"[^"]*"' | cut -d'"' -f4)
echo "✅ 토큰 검증 성공! GitHub 사용자: $USERNAME"

# .bashrc에서 기존 토큰 제거
echo ""
echo "📝 기존 설정 정리 중..."
sed -i '/export GITHUB_TOKEN=/d' ~/.bashrc

# 안전한 방식으로 토큰 저장
echo ""
echo "💾 토큰을 어떻게 저장하시겠습니까?"
echo "1) 환경 변수로 저장 (.bashrc에 추가)"
echo "2) 보안 파일로 저장 (~/.github_token)"
echo "3) 둘 다 설정"
read -p "선택 (1-3): " CHOICE

case $CHOICE in
    1)
        echo "export GITHUB_TOKEN=\"$GITHUB_TOKEN_INPUT\"" >> ~/.bashrc
        echo "✅ .bashrc에 추가되었습니다."
        ;;
    2)
        echo "$GITHUB_TOKEN_INPUT" > ~/.github_token
        chmod 600 ~/.github_token
        echo 'export GITHUB_TOKEN=$(cat ~/.github_token 2>/dev/null)' >> ~/.bashrc
        echo "✅ ~/.github_token 파일에 저장되었습니다."
        ;;
    3)
        echo "$GITHUB_TOKEN_INPUT" > ~/.github_token
        chmod 600 ~/.github_token
        echo "export GITHUB_TOKEN=\"$GITHUB_TOKEN_INPUT\"" >> ~/.bashrc
        echo "✅ 두 가지 방식 모두 설정되었습니다."
        ;;
    *)
        echo "❌ 잘못된 선택입니다."
        exit 1
        ;;
esac

# Claude settings.json 업데이트 확인
echo ""
echo "🔧 Claude MCP 설정 업데이트..."
if [ -f ~/.claude/settings.json ]; then
    # 환경 변수 참조 확인
    if grep -q '"GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"' ~/.claude/settings.json; then
        echo "✅ Claude 설정이 이미 환경 변수를 참조하고 있습니다."
    else
        echo "⚠️  Claude 설정에서 직접 토큰을 사용하고 있습니다."
        echo "   환경 변수 참조로 변경하는 것을 권장합니다."
    fi
fi

echo ""
echo "🎉 설정 완료!"
echo ""
echo "다음 명령으로 설정을 적용하세요:"
echo "  source ~/.bashrc"
echo ""
echo "또는 새 터미널을 열어주세요."