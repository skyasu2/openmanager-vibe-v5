/**
 * 🔐 Supabase Auth Fallback
 *
 * GitHub OAuth가 실패할 경우의 대체 인증 방법
 */

import { supabase } from './supabase';

/**
 * Magic Link 로그인 (이메일 인증)
 */
export async function signInWithMagicLink(email: string) {
  try {
    const { data: _data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    console.log('✅ Magic Link 발송 완료:', email);
    return { success: true, message: '이메일을 확인해주세요!' };
  } catch (error) {
    console.error('❌ Magic Link 오류:', error);
    return { success: false, error };
  }
}

/**
 * 익명 로그인 (임시 계정)
 */
export async function signInAnonymously() {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) throw error;

    console.log('✅ 익명 로그인 성공');
    return { success: true, user: data.user };
  } catch (error) {
    console.error('❌ 익명 로그인 오류:', error);
    return { success: false, error };
  }
}

/**
 * 개발자 모드 로그인 (로컬 개발용)
 */
export async function signInDevMode() {
  if (process.env.NODE_ENV !== 'development') {
    return { success: false, error: '개발 환경에서만 사용 가능합니다.' };
  }

  try {
    // 개발용 테스트 계정으로 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'dev@openmanager.local',
      password: 'dev-password-2025',
    });

    if (error) {
      // 계정이 없으면 생성
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: 'dev@openmanager.local',
          password: 'dev-password-2025',
          options: {
            data: {
              name: 'Dev User',
              role: 'developer',
            },
          },
        });

      if (signUpError) throw signUpError;
      return { success: true, user: signUpData.user };
    }

    return { success: true, user: data.user };
  } catch (error) {
    console.error('❌ 개발자 모드 오류:', error);
    return { success: false, error };
  }
}
