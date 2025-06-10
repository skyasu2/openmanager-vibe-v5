/**
 * 🧪 Google AI Studio 연결 테스트 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleAIService } from '@/services/ai/GoogleAIService';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, model } = await request.json();

    if (!apiKey || !apiKey.startsWith('AIza')) {
      return NextResponse.json({
        success: false,
        message: '유효한 Google AI Studio API 키를 입력해주세요.',
      });
    }

    // 임시로 환경변수 설정
    const originalApiKey = process.env.GOOGLE_AI_API_KEY;
    const originalModel = process.env.GOOGLE_AI_MODEL;
    const originalEnabled = process.env.GOOGLE_AI_ENABLED;

    process.env.GOOGLE_AI_API_KEY = apiKey;
    process.env.GOOGLE_AI_MODEL = model || 'gemini-1.5-flash';
    process.env.GOOGLE_AI_ENABLED = 'true';

    try {
      // Google AI 서비스 테스트
      const googleAI = new GoogleAIService();
      const result = await googleAI.testConnection();

      return NextResponse.json(result);
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
