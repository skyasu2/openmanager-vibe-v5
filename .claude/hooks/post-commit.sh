#!/bin/bash

# CHANGELOG.md 자동 갱신 Hook
# 커밋 후 자동으로 CHANGELOG.md를 업데이트하는 스크립트

# 설정 로드
if [ -f ".claude/changelog.config.sh" ]; then
    source .claude/changelog.config.sh
fi

CHANGELOG_FILE="CHANGELOG.md"
COMMIT_MSG=$(git log -1 --pretty=%B)
COMMIT_HASH=$(git rev-parse --short HEAD)
TIMESTAMP=$(date "${DATE_FORMAT:-+%Y-%m-%d}")
VERSION_INCREMENT=0

# 디버그 모드
if [ "${DEBUG_CHANGELOG:-false}" = "true" ]; then
    echo "🔍 Debug: Processing commit: $COMMIT_MSG"
fi

# 무시할 커밋인지 확인
IGNORE_PATTERNS="${IGNORE_COMMIT_PATTERNS:-chore\\(changelog\\)|docs\\(changelog\\)|Merge|merge|update changelog}"
if [[ "$COMMIT_MSG" =~ $IGNORE_PATTERNS ]]; then
    echo "ℹ️ Ignored commit pattern: $(echo "$COMMIT_MSG" | head -1)"
    exit 0
fi

# 현재 버전 파싱
CURRENT_VERSION=$(grep -E "^## \[5\." "$CHANGELOG_FILE" | head -1 | sed -E 's/^## \[([0-9]+\.[0-9]+\.[0-9]+)\].*/\1/')
MAJOR=$(echo "$CURRENT_VERSION" | cut -d. -f1)
MINOR=$(echo "$CURRENT_VERSION" | cut -d. -f2) 
PATCH=$(echo "$CURRENT_VERSION" | cut -d. -f3)

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
elif [[ "$COMMIT_MSG" =~ ^($MINOR_KEYWORDS) ]]; then
    # Minor 버전 증가 (새 기능)
    MINOR=$((MINOR + 1))
    PATCH=0
    VERSION_INCREMENT=1
elif [[ "$COMMIT_MSG" =~ ^($PATCH_KEYWORDS) ]]; then
    # Patch 버전 증가 (버그 수정, 개선)
    PATCH=$((PATCH + 1))
    VERSION_INCREMENT=1
fi

NEW_VERSION="$MAJOR.$MINOR.$PATCH"

# 새 버전이 필요한 경우에만 업데이트
if [ "$VERSION_INCREMENT" -eq 1 ]; then
    # 커밋 메시지에서 이모지와 타입 파싱
    EMOJI_TYPE=$(echo "$COMMIT_MSG" | sed -E 's/^([🚀✨🐛🔧⚡📚♻️🎨📊🏆🔒🗑️🧹🎯⏪🔄]+)\s*([a-zA-Z]+):.*/\1 \2/')
    DESCRIPTION=$(echo "$COMMIT_MSG" | sed -E 's/^[🚀✨🐛🔧⚡📚♻️🎨📊🏆🔒🗑️🧹🎯⏪🔄]+\s*[a-zA-Z]+:\s*(.*)/\1/')
    
    # CHANGELOG 카테고리 결정 (환경변수 기반)
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

    # 임시 파일에 새 섹션 작성
    cat > /tmp/changelog_new.md << EOF
## [$NEW_VERSION] - $TIMESTAMP

### $EMOJI_TYPE

$CATEGORY

- **$DESCRIPTION** (commit: $COMMIT_HASH)

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
    echo "📝 Added: $DESCRIPTION"
    
    # Documentation Manager 서브에이전트 호출로 추가 문서 관리
    echo "🤖 Calling documentation-manager for comprehensive document update..."
    
    # 자동 문서 업데이트 스크립트 실행
    if [ -f "scripts/auto-documentation-update.sh" ]; then
        echo "📋 Executing auto-documentation-update.sh..."
        bash scripts/auto-documentation-update.sh "$COMMIT_HASH" "$NEW_VERSION" "$DESCRIPTION"
    else
        echo "⚠️ Auto-documentation script not found, creating task manually..."
        
        # 백업: 수동 작업 명세서 생성
        cat > /tmp/doc_update_task.md << EOF
# 📚 커밋 후 문서 관리 작업 (v$NEW_VERSION)

Task documentation-manager "프로젝트 문서 자동 갱신을 수행해주세요:

## 🎯 작업 목표
- 버전 $CURRENT_VERSION → $NEW_VERSION 업데이트에 따른 문서 동기화
- CHANGELOG.md 품질 검증 및 형식 통일
- README.md 버전 정보 최신화
- 관련 문서들의 버전 참조 업데이트
- JBGE 원칙 준수 여부 검증
- 링크 무결성 검사

## 📝 변경 컨텍스트
- 커밋: $COMMIT_HASH
- 변경사항: $DESCRIPTION  
- 날짜: $TIMESTAMP
- 자동 커밋: ${AUTO_COMMIT_CHANGELOG:-false}

위 내용을 바탕으로 종합적인 문서 관리를 수행해주세요."
EOF
        
        echo "📋 Manual task prepared: /tmp/doc_update_task.md"
        echo "💡 Execute: \$(cat /tmp/doc_update_task.md)"
    fi
    
    # CHANGELOG 자체를 커밋에 추가 (옵션)
    if [ "${AUTO_COMMIT_CHANGELOG:-false}" = "true" ]; then
        git add "$CHANGELOG_FILE"
        git commit --amend --no-edit
        echo "📝 CHANGELOG.md automatically included in commit"
        
        # documentation-manager 호출 결과도 커밋에 포함 (if any)
        if [ -f "/tmp/doc_update_results.log" ]; then
            git add . 
            git commit --amend --no-edit
            echo "📚 Additional documentation updates included"
        fi
    fi
else
    echo "ℹ️ No version increment needed for commit type: $(echo "$COMMIT_MSG" | head -1)"
fi

# 정리
rm -f /tmp/changelog_*.md