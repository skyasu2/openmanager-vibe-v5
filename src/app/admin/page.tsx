'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// 🚀 동적 임포트로 코드 스플리팅 (Next.js 15 호환)
const AdminDashboardCharts = dynamic(() => import('@/components/AdminDashboardCharts'), {
  loading: () => <AdminDashboardSkeleton />,
});

const AIAgentAdminDashboard = dynamic(() => import('@/components/ai/AIAgentAdminDashboard'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
});

// 🎨 스켈레톤 로딩 컴포넌트
function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
          <p className="text-gray-600 mt-2">시스템 전반을 모니터링하고 관리합니다.</p>
        </div>
        
        <Suspense fallback={<AdminDashboardSkeleton />}>
          <AdminDashboardCharts />
        </Suspense>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">AI 에이전트 관리</h2>
          <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg" />}>
            <AIAgentAdminDashboard />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 