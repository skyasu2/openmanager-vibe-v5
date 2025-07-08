import dynamic from 'next/dynamic';

// 🔧 SSR 호환성을 위한 동적 import
export const PerformanceDashboard = dynamic(
  () => import('./PerformanceDashboard'),
  { ssr: false }
);

export const UnifiedAdminDashboard = dynamic(
  () => import('./UnifiedAdminDashboard'),
  { ssr: false }
);

export const LogDashboard = dynamic(() => import('./LogDashboard'), {
  ssr: false,
});
