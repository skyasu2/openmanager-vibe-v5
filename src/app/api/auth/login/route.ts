import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '사용자명과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 더미 인증 (시연용)
    if (username === 'admin' && password === 'admin123!') {
      return NextResponse.json(
        {
          success: true,
          token: 'demo-token-' + Date.now(),
          user: {
            id: 'admin-1',
            username: 'admin',
            role: 'admin',
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, error: '잘못된 사용자명 또는 비밀번호입니다.' },
      { status: 401 }
    );
  } catch (error) {
    console.error('로그인 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
