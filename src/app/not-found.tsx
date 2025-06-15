'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-white p-8">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-md text-center">
        <div className="text-6xl mb-4">404</div>
        <h1 className="text-2xl mb-4">페이지를 찾을 수 없습니다</h1>
        <p className="mb-6 opacity-90">
          요청하신 페이지가 존재하지 않습니다.
        </p>
        <Link 
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          홈으로 이동
        </Link>
      </div>
    </div>
  );
} 