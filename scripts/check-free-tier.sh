#!/bin/bash

echo "=== AI 어시스턴트 무료 티어 검증 ==="
echo ""

# 1. Vercel 제한
echo "1. Vercel Edge Functions (10초 제한)"
grep "GOOGLE_AI_TIMEOUT" .env.local || echo "  ⚠ 타임아웃 미설정"
echo ""

# 2. Supabase 설정
echo "2. Supabase 무료 티어"
grep "SUPABASE_URL" .env.local > /dev/null && echo "  ✓ URL 설정됨" || echo "  ✗ URL 미설정"
grep "SUPABASE_ANON_KEY" .env.local > /dev/null && echo "  ✓ Anon Key 설정됨" || echo "  ✗ Key 미설정"
echo ""

# 3. Google AI 제한
echo "3. Google AI API 무료 티어 (1500/일, 15 RPM)"
grep "GOOGLE_AI_DAILY_LIMIT" .env.local || echo "  ⚠ 일일 제한 미설정"
grep "GOOGLE_AI_MINUTE_LIMIT" .env.local || echo "  ⚠ 분당 제한 미설정"
grep "GOOGLE_AI_QUOTA_PROTECTION" .env.local || echo "  ⚠ 쿼터 보호 미설정"
echo ""

# 4. 핵심 파일 존재 확인
echo "4. 핵심 구현 파일"
[ -f "src/services/ai/SimplifiedQueryEngine.ts" ] && echo "  ✓ Query Engine" || echo "  ✗ Query Engine 없음"
[ -f "src/services/ai/GoogleAIUsageTracker.ts" ] && echo "  ✓ Usage Tracker" || echo "  ✗ Tracker 없음"
[ -f "src/lib/google-ai-manager.ts" ] && echo "  ✓ AI Manager" || echo "  ✗ Manager 없음"
echo ""

# 5. API 라우트 확인
echo "5. API 라우트"
ls -1 src/app/api/ai/*/route.ts 2>/dev/null | wc -l | xargs echo "  API 엔드포인트 수:"
echo ""

echo "=== 검증 완료 ==="
