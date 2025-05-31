'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSystemControl } from '../hooks/useSystemControl';
import FeatureCardsGrid from '@/components/home/FeatureCardsGrid';
import UnifiedProfileComponent from '@/components/UnifiedProfileComponent';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
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
  X,
  BarChart3,
  PlayCircle,
  Bot,
  Clock
} from 'lucide-react';
import { ToastContainer, useToast } from '@/components/ui/ToastNotification';
import { motion, AnimatePresence } from 'framer-motion';

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
  const router = useRouter();
  const { isSystemStarted, aiAgent, startSystem, stopSystem, getSystemRemainingTime } = useUnifiedAdminStore();
  const { success, error, info, warning } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [systemTimeRemaining, setSystemTimeRemaining] = useState(0);
  
  // 시스템 타이머 업데이트
  useEffect(() => {
    if (isSystemStarted) {
      const updateTimer = () => {
        const remaining = getSystemRemainingTime();
        setSystemTimeRemaining(remaining);
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      
      return () => clearInterval(interval);
    } else {
      setSystemTimeRemaining(0);
    }
  }, [isSystemStarted, getSystemRemainingTime]);
  
  // 시간 포맷 함수
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
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

  const handleSystemToggle = async () => {
    setIsLoading(true);
    try {
      if (isSystemStarted) {
        stopSystem();
        success('시스템이 정지되었습니다. 모든 서비스가 비활성화됩니다.');
      } else {
        startSystem();
        success('시스템이 시작되었습니다. 30분간 운영되며 모든 서비스가 활성화됩니다.');
      }
    } catch (err) {
      console.error('시스템 제어 오류:', err);
      error('시스템 제어 중 오류가 발생했습니다.');
    } finally {
      // 약간의 지연 후 로딩 해제 (시각적 피드백)
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const handleDashboardClick = () => {
    if (!isSystemStarted) {
      warning('시스템을 먼저 시작해주세요.');
      return;
    }
    router.push('/dashboard');
  };

  const handleAIAgentToggle = () => {
    if (!isSystemStarted) {
      warning('시스템을 먼저 시작해주세요.');
      return;
    }
    
    // 프로필 컴포넌트에서 처리하도록 안내
    info('우측 상단 프로필 메뉴에서 AI 에이전트를 활성화할 수 있습니다.');
  };

  // 배경 클래스 결정
  const getBackgroundClass = () => {
    if (!isSystemStarted) {
      return 'enhanced-dark-background';
    } else if (aiAgent.isEnabled) {
      return 'dark-gradient-ai';
    } else {
      return 'dark-gradient-active';
    }
  };

  return (
    <div className={`min-h-screen ${getBackgroundClass()}`}>
      {/* 웨이브 파티클 배경 효과 */}
      <div className="wave-particles"></div>
      
      {/* 기본 헤더 */}
      <header className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center space-x-3">
          {/* AI 컨셉 아이콘 */}
          <motion.div 
            className="w-10 h-10 rounded-lg flex items-center justify-center relative"
            animate={aiAgent.isEnabled ? {
              background: [
                'linear-gradient(135deg, #a855f7, #ec4899)',
                'linear-gradient(135deg, #ec4899, #06b6d4)',
                'linear-gradient(135deg, #06b6d4, #a855f7)'
              ]
            } : isSystemStarted ? {
              background: [
                'linear-gradient(135deg, #10b981, #059669)',
                'linear-gradient(135deg, #059669, #047857)',
                'linear-gradient(135deg, #047857, #10b981)'
              ]
            } : {
              background: 'linear-gradient(135deg, #6b7280, #4b5563)'
            }}
            transition={{
              duration: aiAgent.isEnabled ? 2 : 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {aiAgent.isEnabled ? (
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <Bot className="w-6 h-6 text-white" />
              </motion.div>
            ) : (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </motion.div>
          
          <div>
            <h1 className="text-xl font-bold text-white">OpenManager</h1>
            <p className="text-sm text-white">
              {renderTextWithAIGradient('AI-Powered Server Monitoring')}
            </p>
            
            {/* 시스템 타이머 표시 */}
            {isSystemStarted && (
              <motion.div 
                className="flex items-center gap-1 text-xs text-white/70 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Clock className="w-3 h-3" />
                <span>남은시간: {formatTime(systemTimeRemaining)}</span>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* 통합 프로필 컴포넌트 */}
        <UnifiedProfileComponent userName="사용자" />
      </header>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-6 pb-12 relative z-10">
        {/* 메인 타이틀 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            <span className="text-white">
              {renderTextWithAIGradient('AI 기반')}
            </span>
            <br />
            서버 모니터링
          </h1>
          <p className="text-lg md:text-xl text-white max-w-3xl mx-auto leading-relaxed">
            차세대 서버 관리 솔루션으로
            <br />
            <strong className="text-white">스마트한 모니터링을 경험하세요</strong>
          </p>
          
          {/* 시스템 상태 표시 */}
          {isSystemStarted && (
            <motion.div 
              className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg max-w-md mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center gap-3 text-white/90">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">
                  시스템 운영 중 ({formatTime(systemTimeRemaining)} 남음)
                </span>
                {aiAgent.isEnabled && (
                  <>
                    <div className="w-1 h-4 bg-white/30"></div>
                    <span className="text-sm text-purple-300">AI 활성</span>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* 시스템 제어 섹션 */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {!isSystemStarted ? (
            /* 시스템 중지 상태 */
            <div className="max-w-md mx-auto text-center">
              {/* 시스템 종료 상태 안내 */}
              <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-200 font-semibold">시스템 종료됨</span>
                </div>
                <p className="text-red-100 text-sm">
                  모든 서비스가 중지되었습니다.<br />
                  <strong>아래 버튼을 눌러 시스템을 다시 시작하세요.</strong>
                </p>
              </div>
              
              {/* 손가락 표시 애니메이션 */}
              <div className="relative mb-6">
                <motion.div
                  className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-2xl"
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  👇
                </motion.div>
                
                <motion.button
                  onClick={handleSystemToggle}
                  disabled={isLoading}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-75"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Power className="w-6 h-6" />
                  )}
                  <span>{isLoading ? '시작 중...' : '🚀 시스템 시작 (30분)'}</span>
                </motion.button>
              </div>
              
                  <p className="text-white/80 text-sm">
                <strong>통합 시스템 시작:</strong> 서버 시딩 → 시뮬레이션 → 데이터 생성<br />
                30분간 모든 서비스가 자동으로 순차 시작됩니다
              </p>
            </div>
          ) : (
            /* 시스템 활성 상태 */
            <div className="max-w-2xl mx-auto">
              {/* 시스템 활성 상태 안내 */}
              <div className="mb-6 p-4 bg-green-500/20 border border-green-400/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-200 font-semibold">시스템 실행 중</span>
                  <div className="w-1 h-4 bg-green-300/30"></div>
                  <span className="text-green-300 text-sm">{formatTime(systemTimeRemaining)} 남음</span>
                </div>
                <p className="text-green-100 text-sm text-center">
                  {aiAgent.isEnabled 
                    ? 'AI 에이전트가 활성화되어 지능형 분석이 가능합니다.'
                    : '기본 서버 모니터링이 실행되고 있습니다.'}
                </p>
              </div>

              {/* 제어 버튼들 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* AI 에이전트 버튼 */}
                <motion.button
                  onClick={handleAIAgentToggle}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 border ${
                    aiAgent.isEnabled
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 border-purple-500/50'
                      : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border-orange-500/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={aiAgent.isEnabled ? {
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    } : {}}
                    transition={{
                      rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                  >
                    <Bot className="w-5 h-5" />
                  </motion.div>
                  {aiAgent.isEnabled ? (
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-bold">
                      🤖 AI 에이전트 활성
                    </span>
                  ) : (
                    '🤖 AI 에이전트 설정'
                  )}
                </motion.button>

                {/* 대시보드 버튼 */}
                <div className="relative">
                  {/* 손가락 애니메이션 - 대시보드 들어가기 버튼 가이드 */}
                  <motion.div
                    className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-2xl pointer-events-none z-10"
                    animate={{
                      y: [0, -8, 0],
                      rotate: [0, 15, -15, 0]
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    👆
                  </motion.div>

                  <motion.button
                    onClick={handleDashboardClick}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/50 rounded-xl font-medium transition-all duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <BarChart3 className="w-5 h-5" />
                    📊 대시보드 들어가기
                  </motion.button>
                </div>
                
                {/* 시스템 중지 버튼 */}
                <motion.button
                  onClick={handleSystemToggle}
                    disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 rounded-xl font-medium transition-all duration-200 disabled:opacity-75"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <StopCircle className="w-5 h-5" />
                    )}
                    <span>{isLoading ? '중지 중...' : '⏹️ 시스템 중지'}</span>
                </motion.button>
              </div>

              <p className="text-white/60 text-xs mt-4 text-center">
                시스템이 활성화되어 있습니다. 대시보드에서 상세 모니터링을 확인하세요.
              </p>
            </div>
          )}
        </motion.div>

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