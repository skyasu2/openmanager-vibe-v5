'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAIAnalysisPage() {
  const router = useRouter();

  useEffect(() => {
    // AI 분석 기능이 통합 관리 페이지로 이동됨을 안내하고 리다이렉트
    console.log('🔄 AI 분석 기능이 통합 관리 페이지로 이동되었습니다.');
    router.replace('/admin/ai-agent');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
          <i className="fas fa-robot text-white text-2xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          AI 분석 기능 통합 이동
        </h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          AI 분석 기능이 AI 에이전트 통합 관리 페이지로 이동되었습니다. 
          잠시 후 자동으로 이동합니다...
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
} 