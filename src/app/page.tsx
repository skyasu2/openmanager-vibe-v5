'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSystemControl } from '../hooks/useSystemControl';
import FeatureCardsGrid from '@/components/home/FeatureCardsGrid';
import UnifiedProfileComponent from '@/components/UnifiedProfileComponent';
import { 
  Server, 
  MessageCircle, 
  SearchCheck, 
  FileText, 
  Brain, 
  Code, 
  Play, 
  Loader2, 
  Gauge, 
  StopCircle,
  Power,
  CheckCircle,
  Lightbulb,
  Cpu,
  X
} from 'lucide-react';
import { ToastContainer } from '@/components/ui/ToastNotification';
import { motion } from 'framer-motion';

// 동적 렌더링 강제 (HTML 파일 생성 방지)
export const dynamic = 'force-dynamic';

// 토스트 알림 타입 정의
interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
}

export default function Home() {
  // AI 단어에 그라데이션 애니메이션 적용하는 함수
  const renderTextWithAIGradient = (text: string) => {
    if (!text.includes('AI')) return text;
    
    return text.split(/(AI)/g).map((part, index) => {
      if (part === 'AI') {
        return (
          <motion.span
            key={index}
            className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-bold"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              backgroundSize: '200% 200%'
            }}
          >
            {part}
          </motion.span>
        );
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      {/* 기본 헤더 */}
      <header className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-cyan-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">OpenManager</h1>
            <p className="text-sm text-green-300">
              {renderTextWithAIGradient('AI-Powered Server Monitoring')}
            </p>
          </div>
        </div>
        
        {/* 통합 프로필 컴포넌트 */}
        <UnifiedProfileComponent userName="사용자" />
      </header>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-6 pb-12">
        {/* 메인 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {renderTextWithAIGradient('AI 기반')}
            </span>
            <br />
            서버 모니터링
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            차세대 서버 관리 솔루션으로
            <br />
            <strong className="text-cyan-300">스마트한 모니터링을 경험하세요</strong>
          </p>
        </div>

        {/* 기능 카드 그리드 */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              핵심 <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">기능</span>
            </h2>
            <p className="text-white/70 text-base max-w-2xl mx-auto">
              {renderTextWithAIGradient('AI 기반 서버 모니터링의 모든 것을 경험해보세요')}
            </p>
          </div>
          
          <FeatureCardsGrid />
        </div>

        {/* 푸터 */}
        <div className="mt-8 pt-6 border-t border-white/20 text-center">
          <p className="text-white/70">
            Copyright(c) OpenManager. All rights reserved.
          </p>
        </div>
      </div>
      
      {/* 토스트 알림 컨테이너 */}
      <ToastContainer />
    </div>
  );
} 