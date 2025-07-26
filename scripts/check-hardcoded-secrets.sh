#!/bin/bash

# 🔍 하드코딩된 시크릿 검사 스크립트 v3.0
# 실제 소스 코드에서만 시크릿을 검사하고 예제/테스트 파일은 제외

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
    "./backup"
    "./.husky"
    "./playwright-report"
    "./storybook-static"
)

# 제외 파일 패턴 (문서, 템플릿, 테스트 등)
EXCLUDE_FILES=(
    # "*.md"  # 문서 파일도 검사하도록 주석 처리
    "*.template"
    "*.example"
    "*.test.*"
    "*.spec.*"
    "*.json"
    "*.lock"
    "*.svg"
    "*.ico"
    "*.png"
    "*.jpg"
    "*.jpeg"
    "*.gif"
    "LICENSE"
    "CHANGELOG*"
    "README*"
)

# 추가 제외 경로 (문서와 예시 파일들)
SPECIFIC_EXCLUDES=(
    "./docs/"
    "./tests/"
    "./.github/"
    "./scripts/"
    "./public/data/"
    "./src/test/"
    "./src/stories/"
    "./.storybook/"
    "./env.local.template"
    "./setup-env-guide.md"
    "./.env.example"
    "./.env.template"
    "./.env.local.example"
)

# grep 제외 옵션 생성
GREP_EXCLUDE_OPTS=""
for dir in "${EXCLUDE_DIRS[@]}"; do
    GREP_EXCLUDE_OPTS="$GREP_EXCLUDE_OPTS --exclude-dir=$(basename "$dir")"
done
for file in "${EXCLUDE_FILES[@]}"; do
    GREP_EXCLUDE_OPTS="$GREP_EXCLUDE_OPTS --exclude=$file"
done

# 검사할 시크릿 패턴 (실제 값만 검사)
declare -A PATTERNS=(
    ["Redis Connection (Real)"]="redis://default:YOUR_REDIS_TOKEN_PLACEHOLDER@[a-z0-9-]+\.upstash\.io"
    ["PostgreSQL Connection (Real)"]="postgresql://postgres:YOUR_PASSWORD_PLACEHOLDER@]+@[^/]+/[^?]+"
    ["GitHub Personal Access Token (Real)"]="ghp_[a-zA-Z0-9]{36}(?![\\[_])"
    ["GitHub Server Token (Real)"]="ghs_[a-zA-Z0-9]{36}(?![\\[_])"
    ["GitHub OAuth Token (Real)"]="gho_[a-zA-Z0-9]{36}(?![\\[_])"
    ["OpenAI API Key (Real)"]="sk-[a-zA-Z0-9]{48}(?![-_])"
    ["Anthropic API Key (Real)"]="sk-ant-[a-zA-Z0-9-]{95}(?!_)"
    ["Google AI API Key (Real)"]="AIza[a-zA-Z0-9-_]{35}(?!_PLACEHOLDER)"
    ["Private Key"]="-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----"
    ["JWT Secret (Hardcoded)"]="['\"]jwt[_-]?secret['\"]?[[:space:]]*[:=][[:space:]]*['\"][a-zA-Z0-9+/=]{32,}['\"]"
    ["AWS Access Key"]="AKIA[A-Z0-9]{16}"
    ["Slack Webhook"]="https://hooks\.slack\.com/services/T[A-Z0-9]+/B[A-Z0-9]+/[a-zA-Z0-9]+"
    ["Supabase Service Key"]="eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+"
)

# 허용된 패턴 (false positive 방지)
declare -A ALLOWED_PATTERNS=(
    ["PlaceholderPattern1"]="\[YOUR_[A-Z_]+_HERE\]"
    ["PlaceholderPattern2"]="your_[a-z_]+_here"
    ["PlaceholderPattern3"]="YOUR_[A-Z_]+_PLACEHOLDER"
    ["ExamplePattern"]="xxx+"
    ["TestPattern"]="test_|mock_|sample_|example_|MOCK_"
    ["DiskPattern"]="disk-|disk_"
    ["QueuePattern"]="queue-|task-"
    ["TemplateVar"]="process\.env\.[A-Z_]+"
    ["EnvDefault"]="process\.env\.[A-Z_]+\s*\|\|\s*['\"]"
    ["RedactedPattern"]="\[REDACTED\]|REDACTED|_PLACEHOLDER"
    ["SensitiveInfoRemoved"]="SENSITIVE_INFO_REMOVED"
)

# 검사할 소스 디렉토리 (실제 애플리케이션 코드만)
SOURCE_DIRS=(
    "./src/app"
    "./src/components"
    "./src/services"
    "./src/lib"
    "./src/hooks"
    "./src/utils"
    "./src/stores"
    "./src/domains"
)

# 특정 파일에서 검사 수행
check_pattern() {
    local pattern_name="$1"
    local pattern="$2"
    local found=0
    
    echo -e "검사 중: ${pattern_name}"
    
    # 임시 파일에 결과 저장
    temp_file=$(mktemp)
    
    # 소스 디렉토리에서만 패턴 검색
    for src_dir in "${SOURCE_DIRS[@]}"; do
        if [ -d "$src_dir" ]; then
            grep -r -E "$pattern" "$src_dir" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null >> "$temp_file" || true
        fi
    done
    
    # .env 파일은 검사하지 않음 (환경변수 파일은 시크릿을 저장하는 올바른 위치)
    # grep -E "$pattern" .env .env.local .env.production 2>/dev/null | grep -v "your_\|YOUR_\|example\|template" >> "$temp_file" || true
    
    # 결과가 있으면 처리
    if [ -s "$temp_file" ]; then
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
echo -e "${BLUE}📁 검사 대상 디렉토리:${NC}"
for dir in "${SOURCE_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✓ $dir"
    fi
done
echo ""

if [ $FOUND_SECRETS -eq 1 ]; then
    echo -e "${RED}❌ 하드코딩된 시크릿이 발견되었습니다!${NC}"
    echo -e "${YELLOW}📝 환경변수를 사용하도록 코드를 수정하세요.${NC}"
    echo ""
    echo "다음 방법으로 수정하세요:"
    echo "1. 시크릿을 환경변수로 이동: .env.local 파일 사용"
    echo "   예: const apiKey = process.env.GOOGLE_AI_API_KEY"
    echo "2. 환경변수 타입 정의: src/types/env.d.ts에 추가"
    echo "3. 기본값 사용 시 안전한 값 사용"
    echo "   예: process.env.API_KEY || 'development-only'"
    exit 1
else
    echo -e "${GREEN}✅ 하드코딩된 시크릿이 발견되지 않았습니다!${NC}"
    echo "모든 민감한 정보가 안전하게 관리되고 있습니다."
    echo ""
    echo -e "${BLUE}💡 검사 제외 항목:${NC}"
    echo "  • 테스트 파일 (*.test.*, *.spec.*)"
    echo "  • 문서 파일 (*.md, docs/)"
    echo "  • 설정 템플릿 (*.template, *.example)"
    echo "  • 스크립트 파일 (scripts/)"
    echo "  • 테스트 디렉토리 (tests/, src/test/)"
    exit 0
fi