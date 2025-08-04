/**
 * 🔄 Edge AI API Route (리다이렉트)
 * 
 * v2 엔드포인트로 자동 리다이렉트
 * - 하위 호환성 유지
 * - Redis → Supabase 마이그레이션 완료
 */

import { NextRequest, NextResponse } from 'next/server';

// v2 엔드포인트로 POST와 OPTIONS 리다이렉트
export { POST, OPTIONS } from '../edge-v2/route';

// GET 요청: API 상태 및 사용법 안내
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'active',
    version: 'v1 (redirects to v2)',
    description: 'Edge AI API - 자동으로 v2 엔드포인트로 리다이렉트됩니다',
    endpoints: {
      POST: '/api/ai/edge',
      'POST (v2)': '/api/ai/edge-v2',
    },
    usage: {
      method: 'POST',
      body: {
        query: 'string (required)',
        userId: 'string (optional)',
        sessionId: 'string (optional)',
        services: 'array (optional)',
        parallel: 'boolean (optional)',
      },
    },
    migration: {
      status: 'completed',
      from: 'Redis Streams',
      to: 'Supabase Realtime',
      date: '2025-08-04',
    },
    timestamp: new Date().toISOString(),
  });
}