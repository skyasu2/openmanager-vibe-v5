/**
 * 🏠 Main Page - Redirect to Login
 * 
 * Google OAuth 인증 시스템으로 변경됨
 * 메인 페이지 접속 시 로그인 페이지로 리다이렉트
 */

'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // 이미 로그인된 경우 대시보드로 이동
        router.push('/dashboard');
      } else {
        // 로그인되지 않은 경우 로그인 페이지로 이동
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // 로딩 중 표시
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
          <span className="text-white text-xl font-bold">OM</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">OpenManager Vibe v5</h1>
        <div className="flex items-center space-x-2 justify-center">
          <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">시스템 초기화 중...</span>
        </div>
      </div>
    </div>
  );
}
