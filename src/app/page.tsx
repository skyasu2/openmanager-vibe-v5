/**
 * 🔐 루트 페이지 - 단순 메인 페이지 리다이렉트
 *
 * 모든 사용자를 메인 페이지(/main)로 보냅니다.
 * 인증 체크는 메인 페이지에서 담당합니다.
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
