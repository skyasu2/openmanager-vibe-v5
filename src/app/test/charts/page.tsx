'use client';

/**
 * 🧪 차트 라이브러리 테스트 페이지
 * 
 * 동적 import를 통한 번들 최적화 - 차트 라이브러리들은 필요할 때만 로드
 */

import { Suspense, lazy } from 'react';

// 동적 import로 번들 크기 최적화
const ChartComparison = lazy(() => 
  import('@/components/charts/prototypes/ChartComparison').then(module => ({
    default: module.ChartComparison
  }))
);

export default function ChartsTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Suspense 
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">차트 라이브러리 로딩 중...</p>
              </div>
            </div>
          }
        >
          <ChartComparison />
        </Suspense>
      </div>
    </div>
  );
}