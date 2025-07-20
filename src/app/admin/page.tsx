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
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-gray-600'>권한 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* 헤더 */}
      <header className='bg-white shadow-sm border-b border-gray-200'>
        <div className='flex items-center justify-between px-6 py-4'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center'>
              <Crown className='w-4 h-4 text-white' />
            </div>
            <div>
              <h1 className='text-xl font-bold text-gray-900'>관리자 페이지</h1>
              <p className='text-xs text-gray-500'>Administrator Dashboard</p>
            </div>
          </div>

          <UnifiedProfileHeader />
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className='container mx-auto px-6 py-8'>
        <div className='max-w-4xl mx-auto'>
          {/* 환영 메시지 */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center'>
            <div className='w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Shield className='w-8 h-8 text-white' />
            </div>

            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              관리자 모드 활성화됨
            </h2>

            <p className='text-gray-600 mb-6'>
              관리자 권한으로 로그인되었습니다. 모든 기능에 접근할 수 있습니다.
            </p>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-8'>
              <div className='p-4 bg-red-50 rounded-lg border border-red-200'>
                <Crown className='w-6 h-6 text-red-600 mx-auto mb-2' />
                <h3 className='font-semibold text-red-900'>관리자 권한</h3>
                <p className='text-sm text-red-700'>모든 시스템 기능 접근</p>
              </div>

              <div className='p-4 bg-blue-50 rounded-lg border border-blue-200'>
                <Shield className='w-6 h-6 text-blue-600 mx-auto mb-2' />
                <h3 className='font-semibold text-blue-900'>보안 모드</h3>
                <p className='text-sm text-blue-700'>고급 보안 설정 활성화</p>
              </div>

              <div className='p-4 bg-green-50 rounded-lg border border-green-200'>
                <div className='w-6 h-6 bg-green-600 rounded-full mx-auto mb-2 flex items-center justify-center'>
                  <span className='text-white text-xs font-bold'>✓</span>
                </div>
                <h3 className='font-semibold text-green-900'>인증 완료</h3>
                <p className='text-sm text-green-700'>관리자 인증 성공</p>
              </div>
            </div>

            <div className='mt-8 p-4 bg-gray-50 rounded-lg'>
              <p className='text-sm text-gray-600'>
                관리자 기능은 프로필 메뉴에서 접근할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
