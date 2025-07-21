/**
 * 🔐 직접 GitHub OAuth 처리 (Supabase 우회)
 * Supabase 설정 문제 시 임시 사용
 */

export async function directGitHubAuth() {
  const clientId =
    process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || 'Ov23liFnUsRO0ttNegju';
  const redirectUri = `${window.location.origin}/auth/callback`;

  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', clientId);
  githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
  githubAuthUrl.searchParams.set('scope', 'read:user user:email');
  githubAuthUrl.searchParams.set('state', Math.random().toString(36));

  console.log('🔗 직접 GitHub OAuth URL:', githubAuthUrl.toString());

  // GitHub으로 리다이렉트
  window.location.href = githubAuthUrl.toString();
}
