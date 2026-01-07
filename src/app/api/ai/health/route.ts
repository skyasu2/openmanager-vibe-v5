/**
 * @deprecated Use /api/health?service=cloudrun instead
 *
 * 🤖 AI Health API - DEPRECATED
 * 이 엔드포인트는 /api/health?service=cloudrun 으로 통합되었습니다.
 * 하위 호환성을 위해 동일한 응답을 반환하지만, 곧 제거될 예정입니다.
 *
 * Migration: /api/ai/health → /api/health?service=cloudrun
 */
import { NextResponse } from 'next/server';
import { checkCloudRunHealth } from '@/lib/ai-proxy/proxy';

export const runtime = 'edge';

export async function GET() {
  // 콘솔 경고 (서버 로그)
  console.warn(
    '[DEPRECATED] /api/ai/health is deprecated. Use /api/health?service=cloudrun instead.'
  );

  const result = await checkCloudRunHealth();

  if (result.healthy) {
    return NextResponse.json(
      {
        status: 'ok',
        backend: 'cloud-run',
        latency: result.latency,
        deprecated: true,
        migration: '/api/health?service=cloudrun',
      },
      {
        headers: {
          'X-Deprecated': 'true',
          'X-Migration-Path': '/api/health?service=cloudrun',
        },
      }
    );
  }

  return NextResponse.json(
    {
      status: 'error',
      backend: 'cloud-run',
      error: result.error,
      deprecated: true,
      migration: '/api/health?service=cloudrun',
    },
    {
      status: 503,
      headers: {
        'X-Deprecated': 'true',
        'X-Migration-Path': '/api/health?service=cloudrun',
      },
    }
  );
}
