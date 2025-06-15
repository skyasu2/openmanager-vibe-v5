/**
 * 💡 AI 추천사항 엔드포인트 v5.43.0 - 경량 ML 엔진 기반
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateRecommendations } from '@/lib/ml/lightweight-ml-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'AI Recommendations API v5.43.0',
    engine: 'lightweight-ml-v5.43.0',
  });
}
