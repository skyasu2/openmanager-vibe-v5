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

# 3. Cloud Run AI 설정
echo "3. Cloud Run AI (Mistral via Cloud Run)"
grep "CLOUD_RUN_AI_URL" .env.local || echo "  ⚠ Cloud Run AI URL 미설정"
grep "CLOUD_RUN_AI_ENABLED" .env.local || echo "  ⚠ Cloud Run AI 활성화 미설정"
echo ""

# 4. 핵심 파일 존재 확인
echo "4. 핵심 구현 파일"
[ -f "src/services/ai/SimplifiedQueryEngine.ts" ] && echo "  ✓ Query Engine" || echo "  ✗ Query Engine 없음"
[ -f "src/config/ai-engine.ts" ] && echo "  ✓ AI Engine Config" || echo "  ✗ Config 없음"
echo ""

# 5. API 라우트 확인
echo "5. API 라우트"
ls -1 src/app/api/ai/*/route.ts 2>/dev/null | wc -l | xargs echo "  API 엔드포인트 수:"
echo ""

echo "=== 검증 완료 ==="
