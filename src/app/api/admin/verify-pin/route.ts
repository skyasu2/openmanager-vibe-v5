import { NextResponse } from 'next/server';

// 환경변수에서 관리자 PIN 가져오기
const ADMIN_PIN = process.env.ADMIN_PIN || process.env.ADMIN_PASSWORD || '';

/**
 * POST /api/admin/verify-pin
 *
 * 관리자 PIN 검증 (서버 사이드 보안 강화)
 *
 * @param request - { password: string }
 * @returns { success: boolean, message?: string }
 */
export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    // 환경변수 검증
    if (!ADMIN_PIN) {
      console.error('❌ [Admin API] ADMIN_PIN 환경변수가 설정되지 않음');
      return NextResponse.json(
        { success: false, message: '서버 설정 오류: 관리자 PIN이 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 입력값 검증
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, message: '올바른 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // PIN 검증
    if (password === ADMIN_PIN) {
      console.log('✅ [Admin API] PIN 인증 성공');
      return NextResponse.json({ success: true });
    }

    console.warn('❌ [Admin API] PIN 인증 실패 - 잘못된 비밀번호');
    return NextResponse.json(
      { success: false, message: '관리자 비밀번호가 틀렸습니다.' },
      { status: 401 }
    );
  } catch (error) {
    console.error('❌ [Admin API] PIN 검증 중 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
