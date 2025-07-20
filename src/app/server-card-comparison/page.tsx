/**
 * 🎯 ImprovedServerCard 전용 페이지 - 서버 컴포넌트
 *
 * 정적 생성 완전 비활성화 (동적 렌더링만 사용)
 * 클라이언트 로직은 ServerCardComparisonClient 컴포넌트에서 처리
 */

// 서버 사이드 설정 - 서버 컴포넌트에서만 사용 가능
export const dynamic = 'force-dynamic';

import ServerCardComparisonClient from './ServerCardComparisonClient';

// 🎯 서버 카드 비교 페이지 - 서버 컴포넌트
export default function ServerCardComparisonPage() {
  // 서버 컴포넌트에서 필요한 데이터 페칭이나 설정을 수행할 수 있습니다
  // 현재는 클라이언트 컴포넌트를 렌더링만 합니다

  return <ServerCardComparisonClient />;
}
