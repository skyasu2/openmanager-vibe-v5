/**
 * @deprecated Use /api/health?simple=true instead
 *
 * 🏓 Ping API - DEPRECATED
 * 이 엔드포인트는 /api/health?simple=true 로 통합되었습니다.
 * 하위 호환성을 위해 동일한 응답을 반환하지만, 곧 제거될 예정입니다.
 *
 * Migration: /api/ping → /api/health?simple=true
 */
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export function GET() {
  // 콘솔 경고 (서버 로그)
  console.warn(
    '[DEPRECATED] /api/ping is deprecated. Use /api/health?simple=true instead.'
  );

  // 동일한 응답 반환 (하위 호환성)
  return NextResponse.json(
    {
      ping: 'pong',
      timestamp: new Date().toISOString(),
      deprecated: true,
      migration: '/api/health?simple=true',
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-Deprecated': 'true',
        'X-Migration-Path': '/api/health?simple=true',
      },
    }
  );
}
