#!/bin/bash

# 커밋 후 CHANGELOG 자동 업데이트 및 amend Hook
# 커밋 완료 후 CHANGELOG를 업데이트하고 즉시 해당 커밋에 amend

COMMIT_MSG=$(git log -1 --pretty=%B)
COMMIT_HASH=$(git rev-parse --short HEAD)

echo "✅ Commit completed: $COMMIT_HASH"
echo "📝 Message: $(echo "$COMMIT_MSG" | head -1)"

# 설정 로드
if [ -f ".claude/changelog.config.sh" ]; then
    source .claude/changelog.config.sh
fi

# 무시할 커밋 패턴 확인
IGNORE_PATTERNS="${IGNORE_COMMIT_PATTERNS:-chore\\(changelog\\)|docs\\(changelog\\)|Merge|merge|update changelog}"
if [[ "$COMMIT_MSG" =~ $IGNORE_PATTERNS ]]; then
    echo "ℹ️ Maintenance commit - no CHANGELOG update needed"
    exit 0
fi

CHANGELOG_FILE="CHANGELOG.md"
TIMESTAMP=$(date "${DATE_FORMAT:-+%Y-%m-%d}")
VERSION_INCREMENT=0

# 디버그 모드
if [ "${DEBUG_CHANGELOG:-false}" = "true" ]; then
    echo "🔍 Debug: Processing commit message: $COMMIT_MSG"
fi

# 현재 버전 파싱
CURRENT_VERSION=$(grep -E "^## \[5\." "$CHANGELOG_FILE" | head -1 | sed -E 's/^## \[([0-9]+\.[0-9]+\.[0-9]+)\].*/\1/')

if [ -z "$CURRENT_VERSION" ]; then
    echo "⚠️ Warning: Could not find current version in CHANGELOG"
    exit 0
fi

MAJOR=$(echo "$CURRENT_VERSION" | cut -d. -f1)
MINOR=$(echo "$CURRENT_VERSION" | cut -d. -f2) 
PATCH=$(echo "$CURRENT_VERSION" | cut -d. -f3)

echo "📋 Current version: $CURRENT_VERSION"

# 버전 증가 로직 (환경변수 기반)
MAJOR_KEYWORDS="${VERSION_MAJOR_KEYWORDS:-breaking|major|BREAKING}"
MINOR_KEYWORDS="${VERSION_MINOR_KEYWORDS:-feat|✨|🚀|feature}"
PATCH_KEYWORDS="${VERSION_PATCH_KEYWORDS:-fix|🐛|🔧|⚡|docs|📚|refactor|♻️|style|🎨|perf|test|🧪}"

if [[ "$COMMIT_MSG" =~ ^($MAJOR_KEYWORDS) ]]; then
    # Major 버전 증가 (Breaking Changes)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    VERSION_INCREMENT=1
    echo "📈 Major version increment detected"
elif [[ "$COMMIT_MSG" =~ ^($MINOR_KEYWORDS) ]]; then
    # Minor 버전 증가 (새 기능)
    MINOR=$((MINOR + 1))
    PATCH=0
    VERSION_INCREMENT=1
    echo "📈 Minor version increment detected"
elif [[ "$COMMIT_MSG" =~ ^($PATCH_KEYWORDS) ]]; then
    # Patch 버전 증가 (버그 수정, 개선)
    PATCH=$((PATCH + 1))
    VERSION_INCREMENT=1
    echo "📈 Patch version increment detected"
fi

NEW_VERSION="$MAJOR.$MINOR.$PATCH"

# 새 버전이 필요한 경우에만 업데이트
if [ "$VERSION_INCREMENT" -eq 1 ]; then
    echo "🔄 Updating CHANGELOG from $CURRENT_VERSION to $NEW_VERSION"
    
    # 커밋 메시지에서 이모지와 타입 파싱
    EMOJI_TYPE=$(echo "$COMMIT_MSG" | sed -E 's/^([🚀✨🐛🔧⚡📚♻️🎨📊🏆🔒🗑️🧹🎯⏪🔄🎉]+)\s*([a-zA-Z]+):.*/\1 \2/')
    DESCRIPTION=$(echo "$COMMIT_MSG" | sed -E 's/^[🚀✨🐛🔧⚡📚♻️🎨📊🏆🔒🗑️🧹🎯⏪🔄🎉]+\s*[a-zA-Z]+:\s*(.*)/\1/')
    
    # CHANGELOG 카테고리 결정
    ADDED_KEYWORDS="${CATEGORY_ADDED:-feat|✨|🚀|feature}"
    FIXED_KEYWORDS="${CATEGORY_FIXED:-fix|🐛|🔧}"
    PERFORMANCE_KEYWORDS="${CATEGORY_PERFORMANCE:-perf|⚡}"
    DOCS_KEYWORDS="${CATEGORY_DOCS:-docs|📚}"
    REFACTORED_KEYWORDS="${CATEGORY_REFACTORED:-refactor|♻️}"
    
    CATEGORY=""
    if [[ "$COMMIT_MSG" =~ ^($ADDED_KEYWORDS) ]]; then
        CATEGORY="#### ✨ Added"
    elif [[ "$COMMIT_MSG" =~ ^($FIXED_KEYWORDS) ]]; then
        CATEGORY="#### 🐛 Fixed"
    elif [[ "$COMMIT_MSG" =~ ^($PERFORMANCE_KEYWORDS) ]]; then
        CATEGORY="#### ⚡ Performance"
    elif [[ "$COMMIT_MSG" =~ ^($DOCS_KEYWORDS) ]]; then
        CATEGORY="#### 📚 Documentation" 
    elif [[ "$COMMIT_MSG" =~ ^($REFACTORED_KEYWORDS) ]]; then
        CATEGORY="#### 🔄 Refactored"
    else
        CATEGORY="#### 🔧 Changed"
    fi

    echo "📝 Category: $CATEGORY"
    echo "📝 Description: $DESCRIPTION"

    # 임시 파일에 새 섹션 작성
    cat > /tmp/changelog_new.md << EOF
## [$NEW_VERSION] - $TIMESTAMP

### $EMOJI_TYPE

$CATEGORY

- **$DESCRIPTION**

EOF

    # 기존 CHANGELOG와 합병
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

    echo "✅ CHANGELOG.md updated to version $NEW_VERSION"
    
    # CHANGELOG를 현재 커밋에 amend
    git add "$CHANGELOG_FILE"
    git commit --amend --no-edit
    echo "📄 CHANGELOG.md added to commit via amend"
    
    # 새 commit hash 표시
    NEW_COMMIT_HASH=$(git rev-parse --short HEAD)
    echo "🔄 Updated commit hash: $NEW_COMMIT_HASH"
else
    echo "ℹ️ No version increment needed for commit type: $(echo "$COMMIT_MSG" | head -1)"
fi

# 임시 파일 정리
rm -f /tmp/changelog_*.md

echo "🎉 Post-commit processing completed!"