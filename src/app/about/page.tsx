import { Lock } from 'lucide-react';
import { redirect } from 'next/navigation';

export default function AboutRedirectPage() {
  // 서버 사이드에서 즉시 리다이렉트
  redirect('/admin/development-process');

  // 이 부분은 실행되지 않지만 TypeScript를 위해 유지
  return (
    <div className='bg-gray-900 text-white min-h-screen flex items-center justify-center'>
      <div className='text-center max-w-md mx-auto p-8'>
        <Lock className='w-16 h-16 text-purple-400 mx-auto mb-6' />
        <h1 className='text-2xl font-bold mb-4'>개발과정 페이지 이동</h1>
        <p className='text-gray-400 mb-6'>개발과정 페이지로 이동 중입니다...</p>
      </div>
    </div>
  );
}
