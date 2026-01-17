/**
 * 🚀 Next.js Instrumentation
 *
 * 이 파일은 Next.js 앱이 시작될 때 자동으로 실행됩니다.
 * 환경 정보를 로깅합니다.
 */

import { logger } from '@/lib/logging';

export async function register() {
  // 서버 사이드에서만 실행
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    logger.info('🚀 Next.js 서버 초기화 중...');

    // 환경 정보 로깅
    logger.info('📊 환경 정보:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL ? 'true' : 'false',
      VERCEL_ENV: process.env.VERCEL_ENV || 'N/A',
      RUNTIME: process.env.NEXT_RUNTIME,
    });
  }
}
