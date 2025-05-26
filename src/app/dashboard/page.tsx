'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // 메인 대시보드를 server-dashboard로 리다이렉트
    console.log('📊 메인 대시보드에서 server-dashboard로 자동 이동');
    
    // 자동 인증 설정
    localStorage.setItem('dashboard_auth_token', `redirect_${Date.now()}`);
    sessionStorage.setItem('dashboard_authorized', 'true');
    localStorage.setItem('dashboard_access_time', Date.now().toString());
    localStorage.setItem('authorized_from_index', 'true');
    
    // server-dashboard로 리다이렉트
    router.replace('/dashboard/server-dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
          <i className="fas fa-server text-white text-2xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          대시보드 로딩 중...
        </h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          최적화된 서버 대시보드로 자동 이동합니다.
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
} 