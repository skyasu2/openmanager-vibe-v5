#!/bin/bash
# Claude Code에서 안전하게 git push하는 스크립트

# 환경변수 확인
if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
    echo "❌ 에러: GITHUB_PERSONAL_ACCESS_TOKEN 환경변수가 설정되지 않았습니다."
    echo "먼저 scripts/setup-git-auth.sh를 실행하세요."
    exit 1
fi

# 현재 브랜치 확인
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "🚀 $BRANCH 브랜치를 푸시합니다..."

# 임시로 원격 URL 설정 (토큰 포함)
ORIGINAL_URL=$(git remote get-url origin)
TEMP_URL="https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/skyasu2/openmanager-vibe-v5.git"

# URL 변경, push, 원래대로 복원
git remote set-url origin "$TEMP_URL"
git push origin "$BRANCH"
PUSH_RESULT=$?
git remote set-url origin "$ORIGINAL_URL"

if [ $PUSH_RESULT -eq 0 ]; then
    echo "✅ 푸시가 성공적으로 완료되었습니다!"
else
    echo "❌ 푸시 실패. 토큰을 다시 확인해주세요."
fi

exit $PUSH_RESULT