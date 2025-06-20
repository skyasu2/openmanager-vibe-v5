'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight } from 'lucide-react';

export default function AboutRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/admin/development-process');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className='bg-gray-900 text-white min-h-screen flex items-center justify-center'>
      <div className='text-center max-w-md mx-auto p-8'>
        <Lock className='w-16 h-16 text-purple-400 mx-auto mb-6 animate-pulse' />
        <h1 className='text-2xl font-bold mb-4'>개발과정 페이지 이동</h1>
        <p className='text-gray-400 mb-6'>
          개발과정 페이지가 관리자 전용으로 이동되었습니다.
        </p>
        <button
          onClick={() => router.push('/admin/development-process')}
          className='inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors'
        >
          개발과정 보기
          <ArrowRight className='w-4 h-4' />
        </button>
        <p className='text-sm text-gray-500 mt-4'>
          5초 후 자동으로 이동합니다...
        </p>
      </div>
    </div>
  );
}