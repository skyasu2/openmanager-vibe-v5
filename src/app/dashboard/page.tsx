/**
 * 🚀 Dashboard Page - 서버 컴포넌트
 *
 * 인증이 필요한 페이지이므로 정적 생성 비활성화
 * 클라이언트 로직은 DashboardClient 컴포넌트에서 처리
 */

// 서버 사이드 설정 - 서버 컴포넌트에서만 사용 가능
export const dynamic = 'force-dynamic';
export const revalidate = false;

import DashboardClient from './DashboardClient';

// 🎯 대시보드 페이지 - 서버 컴포넌트
export default function DashboardPage() {
  // 서버 컴포넌트에서 필요한 데이터 페칭이나 인증 확인 등을 수행할 수 있습니다
  // 현재는 클라이언트 컴포넌트를 렌더링만 합니다

  return <DashboardClient />;
}
