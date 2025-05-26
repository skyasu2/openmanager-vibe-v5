'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, ArrowRight } from 'lucide-react';

export default function TestAdminPage() {
  const router = useRouter();

  const testRouterPush = () => {
    console.log('🧪 router.push 테스트 시작');
    router.push('/admin/ai-agent');
  };

  const testWindowLocation = () => {
    console.log('🧪 window.location 테스트 시작');
    window.location.href = '/admin/ai-agent';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
          <Shield className="h-6 w-6 text-red-600" />
          관리자 페이지 접근 테스트
        </h1>
        
        <div className="space-y-4">
          {/* Next.js Link */}
          <Link 
            href="/admin/ai-agent"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            Link 컴포넌트로 이동
          </Link>

          {/* router.push */}
          <button
            onClick={testRouterPush}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            router.push로 이동
          </button>

          {/* window.location */}
          <button
            onClick={testWindowLocation}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            window.location으로 이동
          </button>

          {/* 직접 URL */}
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 mb-2">직접 URL 접근:</p>
            <div className="space-y-1 text-xs">
              <p><code>http://localhost:3000/admin/ai-agent</code></p>
              <p><code>http://localhost:3000/admin/ai-analysis</code></p>
            </div>
          </div>
        </div>

        <Link 
          href="/"
          className="block text-center text-blue-600 hover:text-blue-800 mt-6 text-sm"
        >
          ← 홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
} 