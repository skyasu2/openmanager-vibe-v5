'use client';

import React from 'react';
import { AIEngineTest } from '@/components/ai/AIEngineTest';

export default function TestAIRealPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            AI 엔진 테스트 대시보드
          </h1>
          <p className="text-gray-400">
            새로운 AI 엔진 도입 후 프론트엔드 연동 상태를 확인합니다.
          </p>
        </div>
        
        <AIEngineTest />
      </div>
    </div>
  );
} 