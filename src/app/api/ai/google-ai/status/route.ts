/**
 * 📊 Google AI Studio 상태 조회 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleAIService } from '@/services/ai/GoogleAIService';
import { authManager } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 🔐 관리자 권한 확인
    const sessionId =
      request.headers.get('x-session-id') ||
      request.cookies.get('admin-session')?.value;

    if (!sessionId || !authManager.hasPermission(sessionId, 'system:admin')) {
      return NextResponse.json(
        {
          success: false,
          error: '관리자 권한이 필요합니다.',
        },
        { status: 403 }
      );
    }

    // Google AI 설정 확인
    const isEnabled = process.env.GOOGLE_AI_BETA_MODE === 'true';
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    const model = process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash';

    if (!isEnabled) {
      return NextResponse.json({
        connected: false,
        model,
        currentUsage: { minute: 0, day: 0 },
        rateLimits: { rpm: 15, daily: 1500 },
        message: 'Google AI 베타 모드가 비활성화되어 있습니다.',
      });
    }

    if (!apiKey) {
      return NextResponse.json({
        connected: false,
        model,
        currentUsage: { minute: 0, day: 0 },
        rateLimits: { rpm: 15, daily: 1500 },
        message: 'Google AI 서비스를 사용할 수 없습니다.',
      });
    }

    // Google AI 서비스 상태 확인
    const googleAI = new GoogleAIService();
    const status = googleAI.getStatus();

    return NextResponse.json({
      connected: status.enabled,
      model: status.model,
      currentUsage: status.currentUsage,
      rateLimits: status.rateLimits,
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
