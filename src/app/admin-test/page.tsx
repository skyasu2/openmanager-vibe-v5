'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSystemStore } from '@/stores/useSystemStore';
import { ProfileButton } from '@/components/layout/ProfileButton';
import { PinModal } from '@/components/auth/PinModal';

// 컴포넌트 임포트
import Header from '@/components/landing/Header';
import HeroSection from '@/components/landing/HeroSection';
import FeatureCards from '@/components/landing/FeatureCard';

// 타입 정의
interface ToastType {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export default function AdminTestPage() {
  const router = useRouter();
  
  // 시스템 스토어 사용
  const { 
    isSystemStarted, 
    isAIAdminMode, 
    startSystem,
    stopSystem
  } = useSystemStore();
  
  // 로컬 상태
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [timeLeft, setTimeLeft] = useState(180); // 3분
  const [showDashboardChoice, setShowDashboardChoice] = useState(false);
  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState(10);

  // 시스템 시작 핸들러
  const handleStartSystem = async () => {
    setIsLoading(true);
    
    try {
      // 실제 시스템 시작 로직
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      startSystem();
      
      addToast({
        type: 'success',
        message: '시스템이 성공적으로 시작되었습니다!'
      });

      setShowDashboardChoice(true);
      
      // 자동 리다이렉트 카운트다운
      const countdown = setInterval(() => {
        setAutoRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdown);
            router.push('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 시스템 시간 타이머
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleStopSystem();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      addToast({
        type: 'error',
        message: '시스템 시작 중 오류가 발생했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 시스템 중지 핸들러 (모든 사용자에게 적용)
  const handleStopSystem = () => {
    stopSystem();
    addToast({
      type: 'warning',
      message: '시스템이 중지되었습니다.'
    });
    setShowDashboardChoice(false);
    setAutoRedirectCountdown(10);
    setTimeLeft(180);
  };

  // 토스트 추가
  const addToast = (toast: Omit<ToastType, 'id'>) => {
    const id = Date.now();
    setToasts(prev => [...prev, { ...toast, id }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // 시간 포맷팅
  const formattedTime = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        
        {/* 항상 표시되는 상단 헤더 */}
        <header className="fixed top-0 left-0 right-0 z-40 p-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-white font-bold text-xl">
              ← OpenManager V5
            </Link>
            <div className="flex items-center gap-4">
              {/* 모드 인디케이터 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium border
                  ${isAIAdminMode 
                    ? 'bg-gradient-to-r from-purple-500/20 to-blue-600/20 border-purple-400/50 text-purple-300'
                    : 'bg-white/10 border-white/20 text-gray-300'
                  }
                `}
              >
                {isAIAdminMode ? '🤖 AI 관리자 모드' : '📊 모니터링 모드'}
              </motion.div>
              
              {/* 프로필 버튼 */}
              <ProfileButton />
            </div>
          </div>
        </header>

        {/* 메인 컨텐트 */}
        <main className="pt-20 px-4">
          <div className="max-w-4xl mx-auto">
            
            {/* 제목 */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                🔐 AI 관리자 모드 테스트
              </h1>
              <p className="text-xl text-gray-300">
                PIN 인증과 모드 전환 시스템을 테스트해보세요
              </p>
            </div>

            {/* 상태 표시 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">시스템 상태</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">시스템 활성:</span>
                    <span className={isSystemStarted ? 'text-green-400' : 'text-gray-400'}>
                      {isSystemStarted ? '✅ 활성화' : '❌ 비활성화'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">AI 관리자 모드:</span>
                    <span className={isAIAdminMode ? 'text-purple-400' : 'text-gray-400'}>
                      {isAIAdminMode ? '🤖 활성화' : '📊 기본 모드'}
                    </span>
                  </div>
                  {isSystemStarted && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">남은 시간:</span>
                      <span className="text-yellow-400">{formattedTime}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">테스트 정보</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>• PIN 번호: <code className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">4231</code></p>
                  <p>• 5회 실패 시 30분 차단</p>
                  <p>• 인증 없이 AI 모드 클릭 시 "구현중" 팝업</p>
                  <p>• 시스템 중지는 모든 사용자에게 적용</p>
                </div>
              </div>
            </div>

            {/* 테스트 버튼들 */}
            <div className="text-center space-y-4">
              {!isSystemStarted ? (
                <motion.button
                  onClick={handleStartSystem}
                  disabled={isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-full shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '시스템 시작 중...' : '🚀 시스템 시작하기'}
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleStopSystem}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-full"
                >
                  ⏹️ 시스템 중지
                </motion.button>
              )}
            </div>

            {/* 설명 섹션 */}
            <div className="mt-16 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">🧪 테스트 시나리오</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-3">일반 사용자</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>• 프로필 버튼 클릭</li>
                    <li>• "AI 관리자 모드" 클릭</li>
                    <li>• "구현 중입니다" 팝업 확인</li>
                    <li>• 시스템 중지는 누구나 가능</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-purple-400 mb-3">AI 관리자</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>• PIN 입력: 4231</li>
                    <li>• AI 모드 자동 활성화</li>
                    <li>• 모드 전환 가능</li>
                    <li>• 로그아웃 기능</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* PIN 인증 모달 */}
      <PinModal />

      {/* 토스트 알림 컨테이너 */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className={`
                px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border max-w-sm
                ${toast.type === 'success' ? 'bg-green-500/20 border-green-400/50 text-green-200' :
                  toast.type === 'error' ? 'bg-red-500/20 border-red-400/50 text-red-200' :
                  toast.type === 'warning' ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-200' :
                  'bg-blue-500/20 border-blue-400/50 text-blue-200'
                }
              `}
            >
              <p className="text-sm font-medium">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
} 