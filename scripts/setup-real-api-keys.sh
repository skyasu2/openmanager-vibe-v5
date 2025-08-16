#!/bin/bash

# 🔑 실제 API 키 설정 도우미 스크립트
# OpenManager Vibe v5

echo "🔑 실제 API 키 설정을 시작합니다..."
echo

# GitHub Token 입력
echo "📱 1. GitHub Personal Access Token 설정"
echo "   발급 링크: https://github.com/settings/tokens"
echo "   필요 권한: repo, read:org, read:user"
echo
read -p "GitHub Personal Access Token 입력: " GITHUB_TOKEN

# Tavily API Key 입력
echo
echo "🔍 2. Tavily API Key 설정 (웹 검색용)"
echo "   발급 링크: https://tavily.com"
echo "   무료 한도: 1,000회/월"
echo
read -p "Tavily API Key 입력 (선택사항, Enter로 건너뛰기): " TAVILY_KEY

# Upstash Redis 설정
echo
echo "🗄️ 3. Upstash Redis 설정 (AI 문서 검색용)"
echo "   발급 링크: https://console.upstash.com/redis"
echo "   무료 한도: 10MB"
echo
read -p "Upstash Redis REST URL 입력 (선택사항, Enter로 건너뛰기): " UPSTASH_URL
read -p "Upstash Redis REST Token 입력 (선택사항, Enter로 건너뛰기): " UPSTASH_TOKEN

# .env.local 파일 업데이트
echo
echo "🔧 .env.local 파일을 업데이트합니다..."

# GitHub Token 설정 (필수)
if [[ -n "$GITHUB_TOKEN" ]]; then
    sed -i "s/GITHUB_PERSONAL_ACCESS_TOKEN=.*/GITHUB_PERSONAL_ACCESS_TOKEN=$GITHUB_TOKEN/" .env.local
    echo "✅ GitHub Token 설정 완료"
else
    echo "❌ GitHub Token이 설정되지 않았습니다 (필수)"
    exit 1
fi

# Tavily API Key 설정 (선택사항)
if [[ -n "$TAVILY_KEY" ]]; then
    sed -i "s/TAVILY_API_KEY=.*/TAVILY_API_KEY=$TAVILY_KEY/" .env.local
    echo "✅ Tavily API Key 설정 완료"
fi

# Upstash Redis 설정 (선택사항)
if [[ -n "$UPSTASH_URL" ]] && [[ -n "$UPSTASH_TOKEN" ]]; then
    sed -i "s|UPSTASH_REDIS_REST_URL=.*|UPSTASH_REDIS_REST_URL=$UPSTASH_URL|" .env.local
    sed -i "s/UPSTASH_REDIS_REST_TOKEN=.*/UPSTASH_REDIS_REST_TOKEN=$UPSTASH_TOKEN/" .env.local
    echo "✅ Upstash Redis 설정 완료"
fi

# 환경변수 리로드
echo
echo "♻️ 환경변수를 리로드합니다..."
source ~/.bashrc

echo
echo "✅ API 키 설정이 완료되었습니다!"
echo
echo "🔄 다음 단계:"
echo "1. Claude Code를 완전히 재시작하세요"
echo "2. /mcp 명령어로 MCP 서버 상태를 확인하세요"
echo "3. 테스트 명령어를 실행하세요:"
echo "   - GitHub: claude에서 mcp__github__search_repositories 사용"
echo "   - Tavily: claude에서 mcp__tavily__tavily-search 사용"
echo "   - Context7: claude에서 mcp__context7__resolve-library-id 사용"