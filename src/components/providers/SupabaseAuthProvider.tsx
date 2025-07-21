/**
 * 🔐 Supabase Auth Provider
 *
 * Supabase 기반 GitHub OAuth 세션 관리를 위한 Provider 컴포넌트
 */

'use client';

import { ReactNode, useEffect } from 'react';
import { onAuthStateChange } from '@/lib/supabase-auth';

interface SupabaseAuthProviderProps {
  children: ReactNode;
}

/**
 * Supabase Auth Provider
 *
 * @description
 * GitHub OAuth 세션 관리를 위한 Supabase Auth Provider
 * 인증 상태 변경을 감지하고 전역적으로 관리합니다.
 *
 * @param children - 자식 컴포넌트들
 */
export default function SupabaseAuthProvider({
  children,
}: SupabaseAuthProviderProps) {
  useEffect(() => {
    // 인증 상태 변경 리스너 설정
    const authListener = onAuthStateChange(session => {
      // 전역 인증 상태 업데이트는 각 컴포넌트에서 처리
      console.log(
        '🔐 Auth state changed:',
        session ? 'Authenticated' : 'Not authenticated'
      );
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
