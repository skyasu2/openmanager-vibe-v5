/**
 * 🎯 관리자 페이지 v3.0
 *
 * 관리자 모드 전용 빈 페이지
 * 비밀번호 4231로 접근 가능
 */

'use client';

import UnifiedProfileHeader from '@/components/shared/UnifiedProfileHeader';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Crown } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 관리자 모드 확인
    const adminMode = localStorage.getItem('admin_mode') === 'true';

    if (!adminMode) {
      console.log('❌ 관리자 권한 없음 - 메인 페이지로 리다이렉트');
      router.replace('/main');
      return;
    }

    setIsAuthorized(true);
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-600">
              <Crown className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">관리자 페이지</h1>
              <p className="text-xs text-gray-500">Administrator Dashboard</p>
            </div>
          </div>

          <UnifiedProfileHeader />
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-6 py-8">
        <div className="mx-auto max-w-4xl">
          {/* 환영 메시지 */}
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-600">
              <Shield className="h-8 w-8 text-white" />
            </div>

            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              관리자 모드 활성화됨
            </h2>

            <p className="mb-6 text-gray-600">
              관리자 권한으로 로그인되었습니다. 모든 기능에 접근할 수 있습니다.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <Crown className="mx-auto mb-2 h-6 w-6 text-red-600" />
                <h3 className="font-semibold text-red-900">관리자 권한</h3>
                <p className="text-sm text-red-700">모든 시스템 기능 접근</p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <Shield className="mx-auto mb-2 h-6 w-6 text-blue-600" />
                <h3 className="font-semibold text-blue-900">보안 모드</h3>
                <p className="text-sm text-blue-700">고급 보안 설정 활성화</p>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="mx-auto mb-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-600">
                  <span className="text-xs font-bold text-white">✓</span>
                </div>
                <h3 className="font-semibold text-green-900">인증 완료</h3>
                <p className="text-sm text-green-700">관리자 인증 성공</p>
              </div>
            </div>

            <div className="mt-8 rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                관리자 기능은 프로필 메뉴에서 접근할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
