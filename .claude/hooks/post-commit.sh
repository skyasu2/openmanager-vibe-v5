#!/bin/bash

# 커밋 후 간단한 정리 및 알림
# CHANGELOG 업데이트는 pre-commit에서 처리됨

COMMIT_MSG=$(git log -1 --pretty=%B)
COMMIT_HASH=$(git rev-parse --short HEAD)

echo "✅ Commit completed: $COMMIT_HASH"
echo "📝 Message: $(echo "$COMMIT_MSG" | head -1)"

# 임시 파일 정리
rm -f /tmp/changelog_*.md

echo "🎉 Post-commit processing completed!"