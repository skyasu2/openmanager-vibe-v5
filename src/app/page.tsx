/**
 * 🔐 루트 페이지
 *
 * ✅ 모든 사용자를 /main으로 리다이렉트
 * - 인증 여부와 관계없이 /main 페이지로 이동
 * - 인증 체크는 /main 페이지의 useInitialAuth에서 처리
 * - 비로그인 사용자: 메인 페이지에서 로그인 버튼 표시
 *
 * @updated 2024-12 - 미들웨어 제거, /main 직접 리다이렉트
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
