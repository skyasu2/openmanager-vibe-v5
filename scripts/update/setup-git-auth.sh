#!/bin/bash
# Git 인증 설정 스크립트

echo "Git 인증을 위한 설정을 시작합니다..."

# 사용자로부터 토큰 입력받기 (화면에 표시되지 않음)
read -s -p "GitHub Personal Access Token을 입력하세요: " TOKEN
echo

# 환경변수 설정
export GITHUB_PERSONAL_ACCESS_TOKEN="$TOKEN"

# Git credential helper 설정
git config --global credential.helper store

# 원격 URL을 HTTPS로 설정 (토큰 포함)
REPO_URL="https://${TOKEN}@github.com/skyasu2/openmanager-vibe-v5.git"
git remote set-url origin "$REPO_URL"

echo "✅ Git 인증 설정이 완료되었습니다."
echo "이제 'git push' 명령을 사용할 수 있습니다."