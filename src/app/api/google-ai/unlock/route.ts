import { NextRequest, NextResponse } from 'next/server';
import { googleAIManager } from '@/lib/google-ai-manager';

/**
 * Google AI 키 잠금 해제 API
 *
 * POST /api/google-ai/unlock
 * Body: { password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    // 비밀번호 검증
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: '비밀번호가 필요합니다.',
        },
        { status: 400 }
      );
    }

    // Google AI 키 잠금 해제 시도
    const result = await googleAIManager.unlockTeamKey(password.trim());

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Google AI 키가 성공적으로 잠금 해제되었습니다.',
        status: googleAIManager.getKeyStatus(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || '잠금 해제에 실패했습니다.',
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Google AI 잠금 해제 API 오류:', error);
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
    const status = googleAIManager.getKeyStatus();
    const isAvailable = googleAIManager.isAPIKeyAvailable();

    return NextResponse.json({
      success: true,
      status: {
        ...status,
        isAvailable,
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
 * Google AI 키 잠금 API
 *
 * DELETE /api/google-ai/unlock
 */
export async function DELETE() {
  try {
    googleAIManager.lockTeamKey();

    return NextResponse.json({
      success: true,
      message: 'Google AI 키가 잠금되었습니다.',
      status: googleAIManager.getKeyStatus(),
    });
  } catch (error) {
    console.error('Google AI 잠금 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '잠금 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
