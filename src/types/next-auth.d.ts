/**
 * 🔐 NextAuth Type Extensions
 *
 * GitHub OAuth 사용자 정보를 포함한 NextAuth 타입 확장
 */

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      provider?: string;
      githubId?: string;
      accessToken?: string;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    provider?: string;
    githubId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    provider?: string;
    githubId?: string;
    accessToken?: string;
  }
}

/**
 * 🔐 GitHub OAuth 사용자 정보
 */
export interface GitHubUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  provider: 'github';
  githubId: string;
  accessToken: string;
  login: string;
  bio?: string | null;
  location?: string | null;
  company?: string | null;
  blog?: string | null;
  followers?: number;
  following?: number;
  public_repos?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * 🔐 NextAuth 세션 정보
 */
export interface NextAuthSession {
  user: GitHubUser;
  expires: string;
}

/**
 * 🔐 NextAuth 로그인 결과
 */
export interface NextAuthResult {
  success: boolean;
  user?: GitHubUser;
  error?: string;
  provider: 'github';
  sessionId?: string;
}
