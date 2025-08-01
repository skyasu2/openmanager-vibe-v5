#!/bin/bash
# Claude Code 메모리 증가 스크립트

echo "🔧 Claude Code 메모리 최적화 설정..."

# Node.js 메모리 제한 증가 (8GB)
export NODE_OPTIONS="--max-old-space-size=8192"

# 가비지 컬렉션 최적화
export NODE_OPTIONS="$NODE_OPTIONS --optimize-for-size --gc-interval=100"

echo "✅ 메모리 설정 완료: 8GB heap size"
echo "📌 현재 설정: $NODE_OPTIONS"

# Claude Code 재시작 권장
echo ""
echo "⚠️  Claude Code를 재시작하세요:"
echo "   1. 현재 세션 종료"
echo "   2. 터미널에서: export NODE_OPTIONS=\"--max-old-space-size=8192\""
echo "   3. Claude Code 다시 시작"