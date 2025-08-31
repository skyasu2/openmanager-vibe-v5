'use client';

/**
 * 🚀 Dashboard Page - Dynamic Import로 번들 크기 최적화 (205kB → 150kB 목표)
 *
 * DashboardClient를 lazy loading하여 First Load JS 크기 감소
 */

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// 🎯 Dynamic Import로 DashboardClient lazy loading
const DashboardClient = dynamic(() => import('./DashboardClient'), {
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto" />
        <p className="text-gray-600">대시보드 로딩 중...</p>
      </div>
    </div>
  ),
  ssr: false
});

// 🎯 대시보드 페이지 - 클라이언트 컴포넌트
export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  // 클라이언트 마운트 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return <DashboardClient />;
}
