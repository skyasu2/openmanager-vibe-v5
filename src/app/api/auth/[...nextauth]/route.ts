/**
 * 🔐 NextAuth Configuration (GitHub OAuth)
 *
 * OpenManager Vibe v5 - NextAuth 기반 GitHub OAuth 인증
 * 모든 로그인 성공 시 루트 페이지(/)로 리다이렉트
 */

import type { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';

// 환경변수 체크
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

// 환경변수 디버깅 (배포 환경에서 확인용)
console.log('🔍 NextAuth 환경변수 상태:', {
  hasGithubClientId: !!githubClientId,
  hasGithubClientSecret: !!githubClientSecret,
  hasNextAuthSecret: !!nextAuthSecret,
  nodeEnv: process.env.NODE_ENV,
  nextAuthUrl: process.env.NEXTAUTH_URL || 'not set'
});

// GitHub OAuth가 구성되지 않은 경우 빈 provider 배열 사용
const providers = [];
if (githubClientId && githubClientSecret) {
  providers.push(
    GitHubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    })
  );
  console.log('✅ GitHub OAuth Provider 활성화됨');
} else {
  console.warn('⚠️ GitHub OAuth 환경변수가 설정되지 않았습니다. GitHub 로그인이 비활성화됩니다.');
}

export const authOptions: NextAuthOptions = {
  // 🔐 GitHub OAuth Provider 설정
  providers,

  // 🔧 NextAuth 설정
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24시간
  },

  // 🔑 JWT 설정
  jwt: {
    maxAge: 24 * 60 * 60, // 24시간
  },

  // 📄 사용자 정의 페이지
  pages: {
    signIn: '/login', // 기본 로그인 페이지를 우리 커스텀 페이지로
    error: '/auth/error',
  },

  // 🔄 콜백 함수
  callbacks: {
    async signIn({ user, account, profile }) {
      // GitHub OAuth 로그인 성공 시 처리
      if (account?.provider === 'github') {
        console.log('✅ GitHub OAuth 로그인 성공:', {
          id: user.id,
          name: user.name,
          email: user.email,
          provider: account.provider,
        });

        // 추가적인 사용자 검증 로직을 여기에 추가할 수 있습니다
        return true;
      }

      return true;
    },

    async jwt({ token, account, profile }) {
      // JWT 토큰에 추가 정보 저장
      if (account?.provider === 'github') {
        token.provider = 'github';
        token.githubId = (profile as any)?.id;
        token.accessToken = account.access_token;
      }

      return token;
    },

    async session({ session, token }) {
      // 세션에 추가 정보 포함
      if (token) {
        session.user.provider = token.provider as string;
        session.user.githubId = token.githubId as string;
        session.user.accessToken = token.accessToken as string;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // 로그인 성공 후 리다이렉트 URL 결정
      console.log('🔄 NextAuth 리다이렉트:', { url, baseUrl });

      // 항상 루트 페이지로 리다이렉트
      return baseUrl + '/';
    },
  },

  // 🔐 보안 설정 - 기본값 제공으로 빌드 오류 방지
  secret: nextAuthSecret || 'default-secret-for-development',

  // 🐛 디버그 모드 (개발 환경에서만)
  debug: process.env.NODE_ENV === 'development',

  // 📊 이벤트 핸들러
  events: {
    async signIn({ user, account, profile }) {
      console.log('🔐 NextAuth Sign In Event:', {
        user: user.email,
        provider: account?.provider,
        timestamp: new Date().toISOString(),
      });
    },

    async signOut({ session, token }) {
      console.log('🔐 NextAuth Sign Out Event:', {
        user: session?.user?.email,
        timestamp: new Date().toISOString(),
      });
    },
  },
};

// Next.js 13+ App Router용 핸들러
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
