#!/bin/bash
# WSL에서 환경변수를 안전하게 로드하는 스크립트
# bash export 에러 방지를 위해 WSL 전용 .env.wsl 파일 사용

set -e

ENV_FILE=".env.wsl"
FALLBACK_FILE=".env.local"
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"

echo "=== WSL 환경변수 로딩 스크립트 ==="

# 프로젝트 루트로 이동
if [ -d "$PROJECT_ROOT" ]; then
    cd "$PROJECT_ROOT"
    echo "✅ 프로젝트 루트로 이동: $PROJECT_ROOT"
else
    echo "❌ 프로젝트 루트를 찾을 수 없습니다: $PROJECT_ROOT"
    exit 1
fi

# WSL 전용 환경변수 파일 확인
if [ -f "$ENV_FILE" ]; then
    echo "📁 WSL 전용 환경변수 파일 사용: $ENV_FILE"
elif [ -f "$FALLBACK_FILE" ]; then
    ENV_FILE="$FALLBACK_FILE"
    echo "📁 기본 환경변수 파일 사용: $ENV_FILE"
    echo "⚠️  WSL에서 더 안전한 사용을 위해 .env.wsl 파일을 권장합니다"
else
    echo "❌ 환경변수 파일을 찾을 수 없습니다 (.env.wsl 또는 .env.local)"
    exit 1
fi

# 안전한 환경변수 로딩
if [ "$ENV_FILE" = ".env.wsl" ]; then
    # WSL 전용 파일은 이미 bash-safe하므로 직접 source
    set -a  # 자동 export 활성화
    source "$ENV_FILE"
    set +a  # 자동 export 비활성화
    echo "✅ WSL 전용 환경변수 파일 로드 완료"
else
    # .env.local 파일은 안전하게 파싱
    while IFS= read -r line || [ -n "$line" ]; do
        # 빈 줄 건너뛰기
        if [ -z "$line" ]; then
            continue
        fi
        
        # 주석 라인 건너뛰기
        if [[ "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi
        
        # 환경변수 형식 확인 및 인라인 주석 제거
        if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
            # 인라인 주석 제거 (# 이후 모든 내용 제거)
            clean_line=$(echo "$line" | sed 's/[[:space:]]*#.*$//')
            
            # 환경변수 export
            export "$clean_line"
            
            # 변수명만 추출해서 표시
            var_name=$(echo "$clean_line" | cut -d'=' -f1)
            echo "✅ $var_name"
        fi
    done < "$ENV_FILE"
fi

echo ""
echo "🎉 환경변수 로딩 완료!"
echo "📊 로드된 환경변수 개수: $(env | grep -E '^(SUPABASE|GOOGLE|GITHUB|TAVILY|NOTION|BRAVE|KV_|VM_|GCP_|NEXTAUTH|NODE_ENV)' | wc -l)"

# 주요 환경변수 확인
echo ""
echo "🔍 주요 환경변수 확인:"
[ ! -z "$NODE_ENV" ] && echo "   NODE_ENV: $NODE_ENV"
[ ! -z "$SUPABASE_URL" ] && echo "   SUPABASE_URL: ✅ 설정됨"
[ ! -z "$CLOUD_RUN_AI_URL" ] && echo "   CLOUD_RUN_AI_URL: ✅ 설정됨"
[ ! -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ] && echo "   GITHUB_PAT: ✅ 설정됨"
[ ! -z "$TAVILY_API_KEY" ] && echo "   TAVILY_API_KEY: ✅ 설정됨"

echo ""
echo "💡 사용법: source scripts/load-env-wsl.sh"
echo "💡 또는: . scripts/load-env-wsl.sh"