/**
 * 🧪 Google AI Studio 연결 테스트 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleAIService } from '@/services/ai/GoogleAIService';
import { authManager } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

    const { apiKey, model } = await request.json();

    if (!apiKey || !apiKey.startsWith('AIza')) {
      return NextResponse.json({
        success: false,
        message: '유효한 Google AI Studio API 키를 입력해주세요.',
      });
    }

    // 기존 환경변수 백업
    const originalApiKey = process.env.GOOGLE_AI_API_KEY;
    const originalModel = process.env.GOOGLE_AI_MODEL;
    const originalEnabled = process.env.GOOGLE_AI_ENABLED;

    try {
      // 임시로 환경변수 설정
      process.env.GOOGLE_AI_API_KEY = apiKey;
      process.env.GOOGLE_AI_MODEL = model || 'gemini-1.5-flash';
      process.env.GOOGLE_AI_ENABLED = 'true';

      // GoogleAI 서비스 인스턴스 생성 및 테스트
      const tempGoogleAI = new GoogleAIService();
      const testResult = await tempGoogleAI.testConnection();

      return NextResponse.json({
        success: testResult.success,
        message: testResult.message,
        latency: testResult.latency,
      });
    } finally {
      // 환경변수 복원
      if (originalApiKey) {
        process.env.GOOGLE_AI_API_KEY = originalApiKey;
      } else {
        delete process.env.GOOGLE_AI_API_KEY;
      }

      if (originalModel) {
        process.env.GOOGLE_AI_MODEL = originalModel;
      } else {
        delete process.env.GOOGLE_AI_MODEL;
      }

      if (originalEnabled) {
        process.env.GOOGLE_AI_ENABLED = originalEnabled;
      } else {
        delete process.env.GOOGLE_AI_ENABLED;
      }
    }
  } catch (error: any) {
    console.error('Google AI 연결 테스트 실패:', error);

    return NextResponse.json({
      success: false,
      message: `연결 테스트 오류: ${error.message}`,
    });
  }
}
