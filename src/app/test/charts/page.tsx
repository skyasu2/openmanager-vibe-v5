'use client';

/**
 * 🧪 차트 라이브러리 테스트 페이지
 * 
 * 3가지 실시간 차트 라이브러리의 프로토타입을 테스트하고 
 * 성능을 비교할 수 있는 통합 테스트 페이지
 */

import { ChartComparison } from '@/components/charts/prototypes/ChartComparison';

export default function ChartsTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ChartComparison />
      </div>
    </div>
  );
}