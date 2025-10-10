#!/bin/bash
# AI 도구 크론 제거 스크립트
# 실행: ./scripts/setup-ai-tools-cron.sh

set -euo pipefail

echo "🗑️  AI 도구 자동 업데이트 크론 제거"
echo "===================================="

# 기존 크론 백업
echo "📦 기존 크론탭 백업 중..."
crontab -l > /tmp/crontab-backup-$(date +%Y%m%d).txt 2>/dev/null || echo "기존 크론탭 없음"

# 크론 항목 제거
if crontab -l 2>/dev/null | grep -q "ai-tools-auto-update.sh"; then
    echo "🗑️  크론 항목 제거 중..."
    crontab -l 2>/dev/null | grep -v "ai-tools-auto-update.sh" | crontab -
    echo "✅ 크론 제거 완료!"
else
    echo "ℹ️  설정된 크론 항목 없음"
fi

echo ""
echo "📋 현재 크론탭:"
crontab -l 2>/dev/null || echo "크론탭 비어있음"

echo ""
echo "💡 수동 사용 방법:"
echo ""
echo "  1️⃣ 버전 확인만:"
echo "     npm run ai-tools:check"
echo ""
echo "  2️⃣ 업데이트 실행:"
echo "     npm run ai-tools:update"
echo ""
echo "  3️⃣ 직접 실행:"
echo "     ./scripts/check-ai-tools-updates.sh"
echo "     ./scripts/ai-tools-auto-update.sh"
echo ""
echo "📊 로그 확인:"
echo "   cat logs/ai-tools-updates/update-\$(date +%Y-%m-%d).log"
