/**
 * Supabase 클라이언트 - 싱글톤 사용
 *
 * supabase-singleton.ts의 싱글톤 인스턴스를 사용하여
 * GoTrueClient 중복 생성을 방지합니다.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
// 싱글톤 클라이언트 import
import { getSupabaseClient as getSingletonClient } from '../supabase-singleton';

/**
 * Supabase 클라이언트 가져오기 (싱글톤 사용)
 *
 * @returns SupabaseClient 인스턴스 (싱글톤)
 */
export function getSupabaseClient(): SupabaseClient {
  console.log('🌐 실제 Supabase 사용 중');
  return getSingletonClient();
}

/**
 * Proxy를 사용한 Lazy Loading Supabase 클라이언트 (싱글톤 기반)
 *
 * 🎯 장점:
 * - 싱글톤 패턴으로 GoTrueClient 중복 생성 방지
 * - 모듈 최상위에서 환경변수를 읽지 않아 빌드 시점 에러 방지
 * - 실제 사용 시점까지 초기화 지연 (GitHub Actions 빌드 성공)
 * - 일반 Supabase 클라이언트처럼 사용 가능
 *
 * 🔧 작동 원리:
 * - Proxy가 속성 접근을 가로채서 싱글톤 클라이언트로 전달
 * - 첫 사용 시 getSingletonClient() 호출로 초기화
 * - 메서드는 this 바인딩 유지를 위해 bind() 처리
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, _receiver) {
    const client = getSingletonClient();
    const value = client[prop as keyof SupabaseClient];

    // 메서드인 경우 this 바인딩 유지
    if (typeof value === 'function') {
      return value.bind(client);
    }

    return value;
  },
});

// 브라우저 전용 클라이언트
export const browserSupabase =
  typeof window !== 'undefined' ? supabase : undefined;

// Helper functions (싱글톤 기반)
export async function getSupabaseUser() {
  if (typeof window === 'undefined') return null;

  try {
    const client = getSingletonClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    return user;
  } catch (error) {
    console.warn('Failed to get Supabase user:', error);
    return null;
  }
}

// GitHub OAuth 함수는 supabase-auth.ts에서 제공
// 중복 제거: 상태 토큰 충돌 방지

export async function signOut() {
  try {
    const client = getSingletonClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('로그아웃 실패:', error);
    throw error;
  }
}

// 환경 정보 로깅
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
  const isValidUrl = supabaseUrl && supabaseUrl !== 'https://dummy.supabase.co';

  console.log('🔍 Supabase 환경 설정:');
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  - Supabase URL: ${isValidUrl ? '설정됨' : '미설정 (Mock)'}`);
  console.log(`  - 모드: ${isValidUrl ? '실제 Supabase' : 'Mock 모드'}`);
}
