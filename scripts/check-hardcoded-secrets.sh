#!/bin/bash

# 🔍 하드코딩된 시크릿 검사 스크립트 v2.0
# false positive를 줄이고 문서/템플릿을 제외하는 개선된 버전

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 하드코딩된 시크릿 검사 중...${NC}"

# 검사 결과 추적
FOUND_SECRETS=0

# 제외 디렉토리 및 파일 패턴
EXCLUDE_DIRS=(
    "./node_modules"
    "./dist"
    "./.next"
    "./coverage"
    "./.git"
    "./build"
    "./out"
)

# 제외 파일 패턴 (문서, 템플릿, 테스트 등)
EXCLUDE_FILES=(
    "*.md"
    "*.template"
    "*.example"
    "*.test.*"
    "*.spec.*"
    "*.json"
    "*.lock"
    "*.svg"
    "LICENSE"
)

# 추가 제외 경로 (문서와 예시 파일들)
SPECIFIC_EXCLUDES=(
    "./docs/"
    "./tests/"
    "./.github/"
    "./scripts/archived-windows/"
    "./scripts/check-hardcoded-secrets.sh"
    "./public/data/"
    "./env.local.template"
    "./setup-env-guide.md"
)

# grep 제외 옵션 생성
GREP_EXCLUDE_OPTS=""
for dir in "${EXCLUDE_DIRS[@]}"; do
    GREP_EXCLUDE_OPTS="$GREP_EXCLUDE_OPTS --exclude-dir=$(basename "$dir")"
done
for file in "${EXCLUDE_FILES[@]}"; do
    GREP_EXCLUDE_OPTS="$GREP_EXCLUDE_OPTS --exclude=$file"
done

# 검사할 시크릿 패턴
declare -A PATTERNS=(
    ["Redis Token Pattern"]="your_specific_redis_token_pattern_here"
    ["Redis Host Pattern"]="your-specific-redis-host.upstash.io"
    ["Redis Connection String"]="redis://default:[a-zA-Z0-9]{32,}"
    ["PostgreSQL Connection"]="postgresql://postgres:[a-zA-Z0-9]+"
    ["GitHub Personal Access Token"]="ghp_[a-zA-Z0-9]{36}"
    ["GitHub Server Token"]="ghs_[a-zA-Z0-9]{36}"
    ["OpenAI API Key"]="sk-[a-zA-Z0-9]{48}"
    ["Private Key"]="-----BEGIN (RSA |EC )?PRIVATE KEY-----"
    ["API Key Pattern"]="['\"]?api[_-]?key['\"]?[[:space:]]*[:=][[:space:]]*['\"][a-zA-Z0-9]{16,}['\"]"
    ["Secret Key Pattern"]="['\"]?secret[_-]?key['\"]?[[:space:]]*[:=][[:space:]]*['\"][a-zA-Z0-9]{16,}['\"]"
    ["Bearer Token"]="Bearer [a-zA-Z0-9\._\-]{20,}"
    ["Slack Webhook"]="https://hooks.slack.com/services/[A-Z0-9]+/[A-Z0-9]+/[a-zA-Z0-9]+"
)

# 허용된 패턴 (false positive 방지)
declare -A ALLOWED_PATTERNS=(
    ["PlaceholderPattern1"]="\[YOUR_[A-Z_]+_HERE\]"
    ["PlaceholderPattern2"]="your_[a-z_]+_here"
    ["ExamplePattern"]="xxx+"
    ["TestPattern"]="test_|mock_|sample_|example_"
    ["DiskPattern"]="disk-|disk_"
    ["QueuePattern"]="queue-|task-"
)

# 특정 파일에서 검사 수행
check_pattern() {
    local pattern_name="$1"
    local pattern="$2"
    local found=0
    
    echo -e "검사 중: ${pattern_name}"
    
    # 임시 파일에 결과 저장
    temp_file=$(mktemp)
    
    # grep으로 패턴 검색 (제외 옵션 적용)
    if grep -r -E "$pattern" . $GREP_EXCLUDE_OPTS --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.env*" 2>/dev/null > "$temp_file"; then
        # 결과가 있으면 각 줄을 검사
        while IFS= read -r line; do
            # 특정 제외 경로 확인
            skip=0
            for exclude in "${SPECIFIC_EXCLUDES[@]}"; do
                if [[ "$line" == *"$exclude"* ]]; then
                    skip=1
                    break
                fi
            done
            
            # 허용된 패턴 확인
            if [ $skip -eq 0 ]; then
                for allowed_name in "${!ALLOWED_PATTERNS[@]}"; do
                    allowed="${ALLOWED_PATTERNS[$allowed_name]}"
                    if echo "$line" | grep -E -q "$allowed"; then
                        skip=1
                        break
                    fi
                done
            fi
            
            # 플레이스홀더 패턴 추가 확인
            if [ $skip -eq 0 ]; then
                if echo "$line" | grep -E -q "\[YOUR_|your_.*_here|YOUR_.*_HERE\]|<.*>|\.\.\.|xxx|example|sample|test|mock"; then
                    skip=1
                fi
            fi
            
            # 제외되지 않은 경우 출력
            if [ $skip -eq 0 ]; then
                echo "$line"
                found=1
            fi
        done < "$temp_file"
    fi
    
    rm -f "$temp_file"
    
    if [ $found -eq 1 ]; then
        echo -e "${YELLOW}⚠️ 경고: '${pattern_name}' 패턴이 발견되었습니다!${NC}"
        FOUND_SECRETS=1
    fi
}

# 모든 패턴 검사
for pattern_name in "${!PATTERNS[@]}"; do
    pattern="${PATTERNS[$pattern_name]}"
    check_pattern "$pattern_name" "$pattern"
done

# 결과 출력
echo ""
if [ $FOUND_SECRETS -eq 1 ]; then
    echo -e "${RED}❌ 하드코딩된 시크릿이 발견되었습니다!${NC}"
    echo -e "${YELLOW}📝 환경변수를 사용하도록 코드를 수정하세요.${NC}"
    echo ""
    echo "다음 방법으로 수정하세요:"
    echo "1. 시크릿을 환경변수로 이동: .env.local 파일 사용"
    echo "2. 플레이스홀더 사용: [YOUR_API_KEY_HERE] 형식"
    echo "3. 테스트 데이터는 mock 또는 test 접두사 사용"
    exit 1
else
    echo -e "${GREEN}✅ 하드코딩된 시크릿이 발견되지 않았습니다!${NC}"
    echo "모든 민감한 정보가 안전하게 관리되고 있습니다."
    exit 0
fi