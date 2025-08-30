'use client';

/**
 * 🚀 Dashboard Page - 클라이언트 컴포넌트로 전환 (SSR bailout 해결)
 *
 * SSR bailout 문제를 해결하기 위해 전체 페이지를 클라이언트 렌더링으로 전환
 */

import React, { useEffect, useState } from 'react';
import DashboardClient from './DashboardClient';

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
