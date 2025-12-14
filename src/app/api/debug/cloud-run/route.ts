/**
 * Cloud Run Debug API
 * 환경 변수 상태 확인용 (테스트 후 삭제 예정)
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    CLOUD_RUN_ENABLED: process.env.CLOUD_RUN_ENABLED,
    CLOUD_RUN_AI_URL: process.env.CLOUD_RUN_AI_URL ? '✅ SET' : '❌ NOT SET',
    CLOUD_RUN_API_SECRET: process.env.CLOUD_RUN_API_SECRET
      ? '✅ SET'
      : '❌ NOT SET',
    // 조건 체크
    isEnabled: process.env.CLOUD_RUN_ENABLED === 'true',
    hasUrl: !!process.env.CLOUD_RUN_AI_URL,
    hasSecret: !!process.env.CLOUD_RUN_API_SECRET,
    allConditionsMet:
      process.env.CLOUD_RUN_ENABLED === 'true' &&
      !!process.env.CLOUD_RUN_AI_URL &&
      !!process.env.CLOUD_RUN_API_SECRET,
  };

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cloudRunConfig: config,
    message: config.allConditionsMet
      ? '✅ Cloud Run should be enabled'
      : '❌ Cloud Run will be disabled - check conditions above',
  });
}
