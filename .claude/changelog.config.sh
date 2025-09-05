#!/bin/bash

# CHANGELOG.md 자동 갱신 설정 파일

# 자동 커밋 여부 (true/false)
export AUTO_COMMIT_CHANGELOG=false

# 버전 증가 규칙 설정
export VERSION_MAJOR_KEYWORDS="breaking|major|BREAKING"
export VERSION_MINOR_KEYWORDS="feat|✨|🚀|🤖|feature"
export VERSION_PATCH_KEYWORDS="fix|🐛|🔧|⚡|docs|📚|refactor|♻️|style|🎨|perf|test|🧪"

# 커밋 타입별 카테고리 매핑
export CATEGORY_ADDED="feat|✨|🚀|🤖|feature"
export CATEGORY_FIXED="fix|🐛|🔧"
export CATEGORY_PERFORMANCE="perf|⚡"
export CATEGORY_DOCS="docs|📚"
export CATEGORY_REFACTORED="refactor|♻️"
export CATEGORY_CHANGED="style|🎨|chore|test|🧪"

# 무시할 커밋 패턴 (CHANGELOG 업데이트 안함)
export IGNORE_COMMIT_PATTERNS="chore(changelog)|docs(changelog)|Merge|merge|update changelog"

# 날짜 포맷
export DATE_FORMAT='+%Y-%m-%d'

# 디버그 모드 (true/false)
export DEBUG_CHANGELOG=false

echo "✅ CHANGELOG 설정 로드 완료"
echo "📝 자동 커밋: $AUTO_COMMIT_CHANGELOG"
echo "🔍 디버그 모드: $DEBUG_CHANGELOG"