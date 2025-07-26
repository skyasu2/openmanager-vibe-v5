#!/bin/bash

# 🔒 통합 시크릿 검사 스크립트
# 모든 파일에서 실제 토큰 패턴을 검사

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 통합 시크릿 검사 시작...${NC}"

FOUND_SECRETS=0

# 실제 토큰 패턴들 (GitHub이 차단하는 패턴과 동일)
declare -A PATTERNS=(
    ["GitHub Personal Access Token"]="ghp_[A-Za-z0-9]{36}"
    ["GitHub Server Token"]="ghs_[A-Za-z0-9]{36}"
    ["GitHub OAuth Token"]="gho_[A-Za-z0-9]{36}"
    ["New GitHub PAT"]="github_pat_[A-Za-z0-9_]{82}"
    ["Supabase PAT"]="sbp_[a-f0-9]{48}"
    ["Google AI API Key"]="AIza[A-Za-z0-9-_]{35}"
    ["OpenAI API Key"]="sk-[A-Za-z0-9]{48}"
    ["Anthropic API Key"]="sk-ant-[A-Za-z0-9-]{95}"
    ["Slack Token"]="xoxb-[0-9]{11}-[0-9]{13}-[a-zA-Z0-9]{24}"
    ["Tavily API Key"]="tvly-[A-Za-z0-9-]{36}"
    ["JWT Token"]="eyJ[a-zA-Z0-9_-]+\\.eyJ[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+"
)

# 제외 디렉토리
EXCLUDE_DIRS=(
    "./node_modules"
    "./.next"
    "./dist"
    "./build"
    "./.git"
    "./coverage"
    "./config/env-backups"
    "./config"
)

# 검사할 파일 확장자
FILE_EXTENSIONS=(
    "*.ts"
    "*.tsx"
    "*.js"
    "*.jsx"
    "*.json"
    "*.md"
    "*.env*"
    "*.yml"
    "*.yaml"
    "*.sh"
    "*.cjs"
    "*.mjs"
)

# 제외 옵션 생성
EXCLUDE_OPTS=""
for dir in "${EXCLUDE_DIRS[@]}"; do
    EXCLUDE_OPTS="$EXCLUDE_OPTS --exclude-dir=$(basename "$dir")"
done

# 패턴별 검사
for pattern_name in "${!PATTERNS[@]}"; do
    pattern="${PATTERNS[$pattern_name]}"
    echo -n "검사 중: $pattern_name... "
    
    # grep 명령 실행
    temp_file=$(mktemp)
    grep -r -E "$pattern" . $EXCLUDE_OPTS \
        --exclude="*.log" \
        --exclude="package-lock.json" \
        --exclude="yarn.lock" \
        --exclude=".env*" \
        --exclude="*.backup" \
        --exclude="*backup*.json" 2>/dev/null > "$temp_file" || true
    
    # 결과 필터링 (예외 처리)
    while IFS= read -r line; do
        # 예외 패턴 확인
        skip=0
        
        # [REDACTED] 또는 플레이스홀더 패턴 제외
        if echo "$line" | grep -E '\[REDACTED\]|YOUR_.*_PLACEHOLDER|MOCK_|example|template' > /dev/null; then
            skip=1
        fi
        
        # 주석 라인 제외
        if echo "$line" | grep -E '^\s*(#|//|\*)' > /dev/null; then
            skip=1
        fi
        
        # 문서의 예시 코드 블록 제외
        if echo "$line" | grep -E '```|docs/examples/' > /dev/null; then
            skip=1
        fi
        
        if [ $skip -eq 0 ]; then
            echo -e "\n${RED}발견!${NC} $line"
            FOUND_SECRETS=1
        fi
    done < "$temp_file"
    
    if [ $FOUND_SECRETS -eq 0 ]; then
        echo -e "${GREEN}[안전]${NC}"
    fi
    
    rm -f "$temp_file"
done

echo ""

# 결과 출력
if [ $FOUND_SECRETS -eq 1 ]; then
    echo -e "${RED}❌ 실제 시크릿이 발견되었습니다!${NC}"
    echo -e "${YELLOW}해결 방법:${NC}"
    echo "1. 환경변수로 이동: .env.local 파일 사용"
    echo "2. 문서에서는 [REDACTED] 사용"
    echo "3. 예시에서는 YOUR_SERVICE_PLACEHOLDER 형식 사용"
    echo "4. 테스트에서는 MOCK_ 접두사 사용"
    exit 1
else
    echo -e "${GREEN}✅ 모든 파일이 안전합니다!${NC}"
    echo "실제 시크릿이 발견되지 않았습니다."
fi