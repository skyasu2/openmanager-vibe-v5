'use client';

/**
 * 🚀 Dashboard Page - Phase 2-5 복원
 *
 * OptimizedDashboard 컴포넌트를 사용하여
 * DashboardHeader + DashboardContent 통합 구조로 복원
 */

import OptimizedDashboard from '@/components/dashboard/OptimizedDashboard';
import { Suspense } from 'react';

// 로딩 컴포넌트
function DashboardLoading() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-violet-900 flex items-center justify-center'>
      <div className='text-center text-white'>
        <div className='w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
        <p className='text-lg'>시스템 초기화 중...</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <OptimizedDashboard />
    </Suspense>
  );
}
