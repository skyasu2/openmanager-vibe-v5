#!/bin/bash

# CHANGELOG.md 수동 업데이트 스크립트
# Usage: ./scripts/update-changelog.sh [version] [message]

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정 로드
CONFIG_FILE="scripts/utils/misc/changelog.config.sh"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
    echo -e "${GREEN}✅ 설정 로드: $CONFIG_FILE${NC}"
else
    echo -e "${YELLOW}⚠️ 설정 파일 없음, 기본값 사용${NC}"
fi

CHANGELOG_FILE="CHANGELOG.md"

# 함수: 사용법 출력
usage() {
    echo -e "${BLUE}🔧 CHANGELOG.md 수동 업데이트 도구${NC}"
    echo ""
    echo "사용법:"
    echo "  $0 [version] [message]"
    echo ""
    echo "예시:"
    echo "  $0 5.70.11 '✨ feat: 새로운 기능 추가'"
    echo "  $0 auto '🐛 fix: 버그 수정'"
    echo ""
    echo "옵션:"
    echo "  version: 버전 번호 (auto = 자동 증가)"
    echo "  message: 커밋 메시지 또는 변경 내용"
    echo ""
    echo "환경변수:"
    echo "  AUTO_COMMIT_CHANGELOG=true  : 자동 커밋 활성화"
    echo "  DEBUG_CHANGELOG=true        : 디버그 모드"
    exit 1
}

# 함수: 현재 버전 파싱
get_current_version() {
    local version=$(grep -E "^## \[5\." "$CHANGELOG_FILE" | head -1 | sed -E 's/^## \[([0-9]+\.[0-9]+\.[0-9]+)\].*/\1/')
    echo "$version"
}

# 함수: 버전 증가
increment_version() {
    local version="$1"
    local type="$2"
    local major minor patch
    
    IFS='.' read -r major minor patch <<< "$version"
    
    case "$type" in
        "major"|"MAJOR")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        "minor"|"MINOR"|"feat"|"feature")
            minor=$((minor + 1))
            patch=0
            ;;
        "patch"|"PATCH"|"fix"|"docs"|"refactor"|*)
            patch=$((patch + 1))
            ;;
    esac
    
    echo "$major.$minor.$patch"
}

# 함수: 커밋 타입 감지
detect_commit_type() {
    local message="$1"
    
    if [[ "$message" =~ ^(breaking|major|BREAKING) ]]; then
        echo "major"
    elif [[ "$message" =~ ^(feat|✨|🚀|feature) ]]; then
        echo "minor"
    else
        echo "patch"
    fi
}

# 함수: 카테고리 결정
get_category() {
    local message="$1"
    
    if [[ "$message" =~ ^(feat|✨|🚀|feature) ]]; then
        echo "#### ✨ Added"
    elif [[ "$message" =~ ^(fix|🐛|🔧) ]]; then
        echo "#### 🐛 Fixed"
    elif [[ "$message" =~ ^(perf|⚡) ]]; then
        echo "#### ⚡ Performance"
    elif [[ "$message" =~ ^(docs|📚) ]]; then
        echo "#### 📚 Documentation"
    elif [[ "$message" =~ ^(refactor|♻️) ]]; then
        echo "#### 🔄 Refactored"
    else
        echo "#### 🔧 Changed"
    fi
}

# 인자 확인
if [ $# -lt 2 ]; then
    usage
fi

VERSION_INPUT="$1"
MESSAGE="$2"
TIMESTAMP=$(date "${DATE_FORMAT:-+%Y-%m-%d}")

# 현재 버전 가져오기
CURRENT_VERSION=$(get_current_version)
if [ -z "$CURRENT_VERSION" ]; then
    echo -e "${RED}❌ Error: CHANGELOG에서 현재 버전을 찾을 수 없습니다${NC}"
    exit 1
fi

echo -e "${BLUE}📋 현재 버전: $CURRENT_VERSION${NC}"

# 새 버전 결정
if [ "$VERSION_INPUT" = "auto" ]; then
    COMMIT_TYPE=$(detect_commit_type "$MESSAGE")
    NEW_VERSION=$(increment_version "$CURRENT_VERSION" "$COMMIT_TYPE")
    echo -e "${YELLOW}🔄 자동 버전 증가: $COMMIT_TYPE -> $NEW_VERSION${NC}"
else
    NEW_VERSION="$VERSION_INPUT"
    echo -e "${YELLOW}📌 수동 버전 설정: $NEW_VERSION${NC}"
fi

# 버전 중복 체크
if grep -q "## \[$NEW_VERSION\]" "$CHANGELOG_FILE"; then
    echo -e "${RED}❌ Error: 버전 $NEW_VERSION은 이미 존재합니다${NC}"
    exit 1
fi

# 카테고리 결정
CATEGORY=$(get_category "$MESSAGE")
DESCRIPTION=$(echo "$MESSAGE" | sed -E 's/^[🚀✨🐛🔧⚡📚♻️🎨📊🏆🔒🗑️🧹🎯⏪🔄]+\s*[a-zA-Z]+:\s*(.*)/\1/')

if [ "${DEBUG_CHANGELOG:-false}" = "true" ]; then
    echo -e "${BLUE}🔍 Debug Info:${NC}"
    echo "  Message: $MESSAGE"
    echo "  Category: $CATEGORY"
    echo "  Description: $DESCRIPTION"
    echo "  Timestamp: $TIMESTAMP"
fi

# 확인 메시지
echo -e "${YELLOW}📝 CHANGELOG 업데이트 준비:${NC}"
echo "  버전: $CURRENT_VERSION -> $NEW_VERSION"
echo "  내용: $DESCRIPTION"
echo "  카테고리: $CATEGORY"
echo ""
read -p "업데이트를 진행하시겠습니까? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏹️ 업데이트 취소${NC}"
    exit 0
fi

# 백업 생성
cp "$CHANGELOG_FILE" "${CHANGELOG_FILE}.bak"
echo -e "${GREEN}💾 백업 생성: ${CHANGELOG_FILE}.bak${NC}"

# 새 섹션 작성
cat > /tmp/changelog_new.md << EOF
## [$NEW_VERSION] - $TIMESTAMP

### $MESSAGE

$CATEGORY

- **$DESCRIPTION**

EOF

# CHANGELOG 업데이트
{
    # 헤더 부분 (첫 8줄)
    head -8 "$CHANGELOG_FILE"
    echo ""
    # 새 버전 섹션  
    cat /tmp/changelog_new.md
    # 기존 버전들 (9번째 줄부터)
    tail -n +9 "$CHANGELOG_FILE"
} > /tmp/changelog_merged.md

# 원본 파일 업데이트
mv /tmp/changelog_merged.md "$CHANGELOG_FILE"
rm -f /tmp/changelog_new.md

echo -e "${GREEN}✅ CHANGELOG.md 업데이트 완료: $NEW_VERSION${NC}"

# 자동 커밋 (옵션)
if [ "${AUTO_COMMIT_CHANGELOG:-false}" = "true" ]; then
    git add "$CHANGELOG_FILE"
    git commit -m "📚 docs: CHANGELOG.md 업데이트 v$NEW_VERSION"
    echo -e "${GREEN}📝 자동 커밋 완료${NC}"
else
    echo -e "${YELLOW}💡 Tip: 변경사항을 커밋하려면 다음 명령어를 실행하세요:${NC}"
    echo "  git add $CHANGELOG_FILE"
    echo "  git commit -m '📚 docs: CHANGELOG.md 업데이트 v$NEW_VERSION'"
fi

# 정리
rm -f /tmp/changelog_*.md

echo -e "${GREEN}🎉 작업 완료!${NC}"