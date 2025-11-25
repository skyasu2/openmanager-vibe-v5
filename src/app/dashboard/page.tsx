/**
 * 🎯 Dashboard Page - Performance Score 최적화 (Dynamic Import 롤백)
 *
 * ssr: false로 인한 성능 악화 해결 (50% → 16.67% 문제)
 * 직접 import로 SSR 활성화하여 First Load 성능 개선
 * 
 * NOTE: Dynamic rendering은 layout.tsx에서 설정됨
 */

import React from 'react';
import DashboardClient from './DashboardClient';

// 🎯 대시보드 페이지 - Server Component
export default function DashboardPage() {
  return <DashboardClient />;
}
