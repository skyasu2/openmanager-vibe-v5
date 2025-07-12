#!/bin/bash

# Supabase Service Role Key 안전한 설정 스크립트

echo "🔐 Supabase Key 안전 설정 도구"
echo "================================"
echo ""
echo "이 스크립트는 Supabase Service Role Key를 안전하게 설정합니다."
echo ""

# 현재 키 확인
if [ ! -z "$SUPABASE_KEY" ]; then
    echo "⚠️  경고: SUPABASE_KEY가 이미 설정되어 있습니다."
    echo "   현재 키: ${SUPABASE_KEY:0:20}...${SUPABASE_KEY: -10}"
    echo ""
fi

# 키 입력 받기
echo "Supabase Service Role Key를 입력하세요:"
echo "(입력 시 화면에 표시되지 않습니다)"
read -s SUPABASE_KEY_INPUT

if [ -z "$SUPABASE_KEY_INPUT" ]; then
    echo "❌ 키가 입력되지 않았습니다."
    exit 1
fi

# 키 형식 검증 (JWT 형식)
if [[ ! $SUPABASE_KEY_INPUT =~ ^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$ ]]; then
    echo "❌ 유효하지 않은 JWT 형식입니다."
    exit 1
fi

echo ""
echo "✅ 키 형식 검증 성공!"

# .bashrc에서 기존 키 제거
echo ""
echo "📝 기존 설정 정리 중..."
sed -i '/export SUPABASE_KEY=/d' ~/.bashrc
sed -i '/export SUPABASE_SERVICE_ROLE_KEY=/d' ~/.bashrc

# 안전한 방식으로 키 저장
echo ""
echo "💾 키를 어떻게 저장하시겠습니까?"
echo "1) 환경 변수로 저장 (.bashrc에 추가)"
echo "2) 보안 파일로 저장 (~/.supabase_key)"
echo "3) 둘 다 설정"
read -p "선택 (1-3): " CHOICE

case $CHOICE in
    1)
        echo "export SUPABASE_KEY=\"$SUPABASE_KEY_INPUT\"" >> ~/.bashrc
        echo "✅ .bashrc에 추가되었습니다."
        ;;
    2)
        echo "$SUPABASE_KEY_INPUT" > ~/.supabase_key
        chmod 600 ~/.supabase_key
        echo 'export SUPABASE_KEY=$(cat ~/.supabase_key 2>/dev/null)' >> ~/.bashrc
        echo "✅ ~/.supabase_key 파일에 저장되었습니다."
        ;;
    3)
        echo "$SUPABASE_KEY_INPUT" > ~/.supabase_key
        chmod 600 ~/.supabase_key
        echo "export SUPABASE_KEY=\"$SUPABASE_KEY_INPUT\"" >> ~/.bashrc
        echo "✅ 두 가지 방식 모두 설정되었습니다."
        ;;
    *)
        echo "❌ 잘못된 선택입니다."
        exit 1
        ;;
esac

# Claude settings.json 업데이트 안내
echo ""
echo "🔧 Claude MCP 설정 업데이트 안내"
echo ""
echo "~/.claude/settings.json 파일에서 다음과 같이 변경하세요:"
echo ""
echo '변경 전:'
echo '  "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGci..."'
echo ""
echo '변경 후:'
echo '  "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_KEY}"'
echo ""

# Supabase URL 확인
echo "📌 현재 Supabase URL 설정:"
grep -o '"SUPABASE_URL": "[^"]*"' ~/.claude/settings.json 2>/dev/null || echo "설정되지 않음"

echo ""
echo "🎉 설정 완료!"
echo ""
echo "다음 명령으로 설정을 적용하세요:"
echo "  source ~/.bashrc"
echo ""
echo "또는 새 터미널을 열어주세요."
echo ""
echo "⚠️  중요: Claude Code를 재시작해야 새 설정이 적용됩니다."