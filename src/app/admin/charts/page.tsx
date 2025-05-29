import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// 🚀 차트 컴포넌트 동적 로딩
const AdminDashboardCharts = dynamic(() => import('@/components/AdminDashboardCharts'), {
  loading: () => <ChartsSkeleton />,
  ssr: false,
});

// 🎨 차트 전용 스켈레톤
function ChartsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-10 bg-gray-200 rounded animate-pulse mb-6" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 차트 스켈레톤들 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function ChartsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📊 시스템 차트</h1>
          <p className="text-gray-600 mt-2">실시간 시스템 메트릭과 AI 예측 차트를 확인합니다.</p>
        </div>
        
        <Suspense fallback={<ChartsSkeleton />}>
          <AdminDashboardCharts />
        </Suspense>
      </div>
    </div>
  );
} 