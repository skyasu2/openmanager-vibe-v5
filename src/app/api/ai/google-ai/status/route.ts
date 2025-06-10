/**
 * 📊 Google AI Studio 상태 조회 API
 */

import { NextResponse } from 'next/server';
import { GoogleAIService } from '@/services/ai/GoogleAIService';

export async function GET() {
  try {
    // Google AI 서비스가 활성화되어 있는지 확인
    if (process.env.GOOGLE_AI_ENABLED !== 'true') {
      return NextResponse.json({
        connected: false,
        model: 'gemini-1.5-flash',
        currentUsage: { minute: 0, day: 0 },
        rateLimits: { rpm: 15, daily: 1500 },
        message: 'Google AI 베타 모드가 비활성화되어 있습니다.',
      });
    }

    const googleAI = new GoogleAIService();

    if (!googleAI.isAvailable()) {
      return NextResponse.json({
        connected: false,
        model: process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash',
        currentUsage: { minute: 0, day: 0 },
        rateLimits: { rpm: 15, daily: 1500 },
        message: 'Google AI 서비스를 사용할 수 없습니다.',
      });
    }

    // 서비스 상태 조회
    const status = googleAI.getStatus();

    return NextResponse.json({
      connected: status.enabled && status.initialized,
      model: status.model,
      currentUsage: status.currentUsage,
      rateLimits: status.rateLimits,
      cacheSize: status.cacheSize,
      message: status.enabled
        ? 'Google AI Studio 정상 연결됨'
        : 'Google AI Studio 연결 오류',
    });
  } catch (error: any) {
    console.error('Google AI 상태 조회 실패:', error);

    return NextResponse.json(
      {
        connected: false,
        model: 'gemini-1.5-flash',
        currentUsage: { minute: 0, day: 0 },
        rateLimits: { rpm: 15, daily: 1500 },
        error: error.message,
        message: 'Google AI 상태 조회 중 오류 발생',
      },
      { status: 500 }
    );
  }
}
