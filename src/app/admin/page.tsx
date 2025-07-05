/**
 * 🎯 관리자 페이지 v2.0
 *
 * ✅ 통합 대시보드 적용
 * ✅ 성능 모니터링 + 로깅 시스템
 * ✅ AI 엔진 관리
 * ✅ 실시간 알림
 */

'use client';

// 🔧 RSC 프리렌더링 오류 방지: 동적 렌더링 강제
export const dynamic = 'force-dynamic';

import UnifiedAdminDashboard from '@/components/admin/UnifiedAdminDashboard';

export default function AdminPage() {
  return <UnifiedAdminDashboard />;
}
