/**
 * 🎯 관리자 페이지 v4.0 - 서버 컴포넌트
 *
 * 동적 렌더링 강제 후 클라이언트 컴포넌트 렌더링
 * 환경변수로 설정된 관리자 비밀번호로 접근 가능
 */

// 서버 컴포넌트 설정 - 정적 생성 방지
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import AdminClient from './AdminClient';

// 서버 컴포넌트 - 클라이언트 컴포넌트 렌더링만 담당

export default function AdminPage() {
  // 서버 컴포넌트에서는 클라이언트 컴포넌트 렌더링만
  return <AdminClient />;
}
