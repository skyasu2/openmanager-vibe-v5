/**
 * 🔐 루트 페이지 - 단순 메인 페이지 리다이렉트
 *
 * 모든 사용자를 메인 페이지(/main)로 보냅니다.
 * 인증 체크는 메인 페이지에서 담당합니다.
 */

'use client';

// React Hook SSR 오류 방지: 정적 생성 비활성화
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    // SSR 방지: 클라이언트에서만 리다이렉트 실행
    if (typeof window !== 'undefined') {
      // 인증 체크 없이 바로 메인 페이지로 리다이렉트
      // 인증 체크는 /main 페이지의 useInitialAuth에서 담당
      router.replace('/main');
    }
  }, [router]);

  // 리다이렉션 중 로딩 화면 표시
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="flex items-center space-x-2 text-white">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        <span>페이지 이동 중...</span>
      </div>
    </div>
  );
}
