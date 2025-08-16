#!/bin/bash
# WSL 환경변수 빠른 로딩 스크립트
# 사용법: source scripts/wsl-env.sh 또는 . scripts/wsl-env.sh

PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"

# 프로젝트 루트로 이동
if [ -d "$PROJECT_ROOT" ]; then
    cd "$PROJECT_ROOT"
fi

# WSL 전용 환경변수 파일이 있으면 사용
if [ -f ".env.wsl" ]; then
    echo "🚀 WSL 환경변수 로딩 중..."
    set -a
    source .env.wsl
    set +a
    echo "✅ 환경변수 로드 완료!"
    echo "📊 로드된 변수: $(env | grep -E '^(SUPABASE|GOOGLE|GITHUB|TAVILY|NOTION|BRAVE|KV_|VM_|GCP_|NEXTAUTH|NODE_ENV)' | wc -l)개"
else
    echo "❌ .env.wsl 파일을 찾을 수 없습니다"
    echo "💡 scripts/load-env-wsl.sh를 실행해보세요"
fi