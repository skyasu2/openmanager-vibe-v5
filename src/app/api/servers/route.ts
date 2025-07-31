import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// 이 라우트는 /api/servers/all로 리다이렉트
export const dynamic = 'force-dynamic';

/**
 * 🔄 /api/servers/all로 리다이렉트
 * 모든 서버 데이터는 통합된 엔드포인트 사용
 */
export async function GET(request: NextRequest) {
  console.log('🔄 /api/servers -> /api/servers/all 리다이렉트');

  // /api/servers/all로 영구 리다이렉트
  return NextResponse.redirect(new URL('/api/servers/all', request.url), 308);
}
