#!/bin/bash

# 커밋 후 알림 및 정리 Hook
# CHANGELOG 업데이트는 이제 pre-commit에서 처리됨

COMMIT_MSG=$(git log -1 --pretty=%B)
COMMIT_HASH=$(git rev-parse --short HEAD)

echo "✅ Commit completed: $COMMIT_HASH"
echo "📝 Message: $(echo "$COMMIT_MSG" | head -1)"

# 무시할 커밋 패턴 확인
IGNORE_PATTERNS="chore\\(changelog\\)|docs\\(changelog\\)|Merge|merge|update changelog"
if [[ "$COMMIT_MSG" =~ $IGNORE_PATTERNS ]]; then
    echo "ℹ️ Maintenance commit - no additional processing needed"
    exit 0
fi

# Documentation Manager 서브에이전트 호출로 추가 문서 관리 (선택적)
echo "🤖 Ready for documentation-manager if needed..."

# 자동 문서 업데이트 스크립트 실행 (있는 경우만)
if [ -f "scripts/auto-documentation-update.sh" ]; then
    echo "📋 Auto-documentation script available"
    echo "💡 Run manually if needed: bash scripts/auto-documentation-update.sh"
fi

# 임시 파일 정리
rm -f /tmp/changelog_*.md
rm -f /tmp/doc_update_*.md

echo "🎉 Post-commit processing completed!"