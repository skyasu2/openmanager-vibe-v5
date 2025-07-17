/**
 * 🔐 루트 페이지 - 로그인으로 리다이렉션
 * 
 * 인증이 필요한 시스템이므로 루트 접근 시 
 * 항상 로그인 페이지로 보냅니다.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    // 즉시 로그인 페이지로 리다이렉션
    router.replace('/login');
  }, [router]);

  // 리다이렉션 중 빈 화면 표시
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="text-white">리다이렉션 중...</div>
    </div>
  );
}