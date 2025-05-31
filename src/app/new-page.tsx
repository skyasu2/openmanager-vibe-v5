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

export default function NewHomePage() {
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

  // 렌더링 조건부 처리
  const renderContent = () => {
    if (!isSystemStarted) {
      // 시스템 시작 전 - 랜딩페이지
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <Header isDark={isDark} onThemeToggle={() => setIsDark(!isDark)} />
          
          <main>
            <HeroSection onStartSystem={handleStartSystem} isLoading={isLoading} />
            <FeatureCards />
          </main>
        </div>
      );
    }

    // 시스템 시작 후 - 상태 화면
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        
        {/* 우측 상단 헤더 */}
        <header className="fixed top-0 right-0 z-40 p-4">
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
        </header>

        <div className="max-w-2xl mx-auto text-center">
          <div className="text-center space-y-4">
            {/* 시스템 활성화 상태 표시 */}
            <div className="mb-4 p-3 bg-green-500/20 border border-green-400/30 rounded-xl backdrop-blur-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-200 font-semibold">시스템 실행 중</span>
              </div>
              <div className="text-green-100 text-sm">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <span>⏰ 남은 시간: <strong>{formattedTime}</strong></span>
                </div>
                <p>
                  {isAIAdminMode 
                    ? '시스템 전체 활성화: AI 에이전트 + 서버 모니터링 + 데이터 생성'
                    : '기본 모드: 서버 모니터링 + 데이터 생성'
                  }
                </p>
              </div>
            </div>
            
            {/* 대시보드 이동 선택 UI */}
            {showDashboardChoice && autoRedirectCountdown > 0 ? (
              <div className="mb-4 p-4 bg-blue-500/20 border border-blue-400/30 rounded-xl backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-blue-200 font-semibold mb-2">
                    🚀 시스템이 성공적으로 시작되었습니다!
                  </div>
                  <div className="text-blue-100 text-sm mb-4">
                    <span className="text-yellow-300 font-bold text-lg">{autoRedirectCountdown}</span>초 후 대시보드로 자동 이동합니다
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button 
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      onClick={() => router.push('/dashboard')}
                    >
                      지금 이동
                    </button>
                    <button 
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                      onClick={() => {
                        setShowDashboardChoice(false);
                        setAutoRedirectCountdown(10);
                      }}
                    >
                      여기서 대기
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <motion.button
              onClick={handleStopSystem}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              시스템 중지
            </motion.button>

            <div className="mt-8 space-y-2">
              <Link href="/dashboard" className="block">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors border border-white/20"
                >
                  📊 대시보드로 이동
                </motion.button>
              </Link>
              
              {isAIAdminMode && (
                <Link href="/admin/ai-agent" className="block">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    className="w-full px-6 py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 rounded-lg font-medium transition-colors border border-purple-400/50"
                  >
                    🤖 AI 에이전트 관리
                  </motion.button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      
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