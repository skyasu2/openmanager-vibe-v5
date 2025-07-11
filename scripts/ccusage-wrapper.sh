#!/bin/bash

# ccusage 실행
echo "🎯 Claude Code 토큰 사용량 확인 중..."
echo ""
npx ccusage@latest

# 명령어 안내
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 추가 명령어 사용법"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔥 npx ccusage@latest blocks --live"
echo "   → 🆕 실시간 대시보드로 라이브 모니터링"
echo ""
echo "📈 npx ccusage@latest blocks --active"
echo "   → 현재 과금 블록과 예상 사용량 확인"
echo ""
echo "📊 npx ccusage@latest daily"
echo "   → 일별 사용량 세부 분석"
echo ""
echo "💬 npx ccusage@latest session"
echo "   → 현재 세션 분석"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 팁: 특정 날짜 범위 조회"
echo "   npx ccusage@latest blocks --since 20250701 --until 20250731"
echo ""