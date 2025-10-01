/**
 * 🔐 루트 페이지 - 미들웨어 폴백
 *
 * ✅ 미들웨어에서 Supabase 세션 검증 및 리다이렉트 처리
 * - Supabase 세션 존재: / → /main (인증 사용자)
 * - Guest 쿠키 존재: / → /main (게스트 모드)
 * - 미인증: / → /login (1단계)
 *
 * ⚠️ 이 페이지는 미들웨어 실패 시 폴백용으로만 실행됨
 */

// SSR 호환성 - 동적 렌더링 강제 (서버 컴포넌트로 변경)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';

export default function RootRedirect() {
  // 서버에서 바로 리다이렉트 (클라이언트 렌더링 없이)
  // 인증 체크는 /main 페이지의 useInitialAuth에서 담당
  redirect('/main');
}
