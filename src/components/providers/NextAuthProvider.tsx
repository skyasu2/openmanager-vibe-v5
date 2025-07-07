/**
 * 🔐 NextAuth Session Provider
 *
 * NextAuth 기반 GitHub OAuth 세션 관리를 위한 Provider 컴포넌트
 */

'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface NextAuthProviderProps {
  children: ReactNode;
  session?: any;
}

/**
 * NextAuth 세션 Provider
 *
 * @description
 * GitHub OAuth 세션 관리를 위한 NextAuth SessionProvider 래퍼
 * 클라이언트 컴포넌트에서 useSession 훅을 사용할 수 있게 해줍니다.
 *
 * @param children - 자식 컴포넌트들
 * @param session - 서버에서 전달받은 초기 세션 (선택적)
 */
export default function NextAuthProvider({
  children,
  session,
}: NextAuthProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
