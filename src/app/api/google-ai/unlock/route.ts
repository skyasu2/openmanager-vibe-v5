import { googleAIManager } from '@/lib/google-ai-manager';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Google AI 키 초기화 API
 *
 * POST /api/google-ai/unlock
 * Body: { password?: string } (레거시 호환성, 현재는 자동 초기화)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Google AI 초기화 API 요청 시작...');

    // Google AI 매니저 자동 초기화 시도
    const initResult = await googleAIManager.initialize();

    if (initResult) {
      const status = googleAIManager.getStatus();

      return NextResponse.json({
        success: true,
        message: 'Google AI가 성공적으로 초기화되었습니다.',
        status: {
          ...status,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Google AI 초기화에 실패했습니다. 환경변수를 확인해주세요.',
          status: googleAIManager.getStatus(),
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Google AI 초기화 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

/**
 * Google AI 키 상태 확인 API
 *
 * GET /api/google-ai/unlock
 */
export async function GET() {
  try {
    const status = googleAIManager.getStatus();
    const apiKey = googleAIManager.getAPIKey();

    return NextResponse.json({
      success: true,
      status: {
        ...status,
        isAvailable: status.hasApiKey && status.isValid,
        apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Google AI 상태 확인 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '상태 확인 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

/**
 * Google AI 재초기화 API
 *
 * DELETE /api/google-ai/unlock
 */
export async function DELETE() {
  try {
    console.log('🔄 Google AI 재초기화 API 요청...');

    const reinitResult = await googleAIManager.reinitialize();
    const status = googleAIManager.getStatus();

    return NextResponse.json({
      success: reinitResult,
      message: reinitResult
        ? 'Google AI가 재초기화되었습니다.'
        : 'Google AI 재초기화에 실패했습니다.',
      status: {
        ...status,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Google AI 재초기화 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '재초기화 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
