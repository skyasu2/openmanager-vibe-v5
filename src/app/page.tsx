'use client';

import UnifiedProfileComponent from '@/components/UnifiedProfileComponent';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Bot,
  Loader2,
  Play,
  StopCircle,
  X,
  Zap,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
// 토스트 알림과 인라인 피드백 시스템 제거됨

const FeatureCardsGrid = dynamic(
  () => import('@/components/home/FeatureCardsGrid'),
  {
    ssr: false,
    loading: () => (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12'>
        {[...Array(6)].map((_, i) => (
          <div key={i} className='h-32 bg-white/10 rounded-lg animate-pulse' />
        ))}
      </div>
    ),
  }
);

// 토스트 알림 훅 제거됨

export default function Home() {
  const router = useRouter();
  const {
    isSystemStarted,
    aiAgent,
    adminMode,
    startSystem,
    stopSystem,
    logout,
    getSystemRemainingTime,
  } = useUnifiedAdminStore();
  // 토스트 알림 기능 제거됨
  const [isLoading, setIsLoading] = useState(false);
  const [systemTimeRemaining, setSystemTimeRemaining] = useState(0);

  // 🚀 시스템 시작 카운트다운 상태
  const [systemStartCountdown, setSystemStartCountdown] = useState(0);
  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // 🔄 클라이언트 마운트 상태 (hydration 문제 방지)
  const [isMounted, setIsMounted] = useState(false);

  // 🔄 클라이언트 마운트 감지
  useEffect(() => {
    setIsMounted(true);

    // 🔥 홈페이지 접속 시 Render 웜업만 실행 (시스템 시작과 무관)
    const performRenderWarmup = async () => {
      try {
        console.log('🔥 Render 서버 웜업 시작 (백그라운드)');

        // 캐시 확인 - 세션당 한 번만 실행
        const warmupKey = 'render-warmup-session';
        const lastWarmup = sessionStorage.getItem(warmupKey);
        const now = Date.now();

        if (lastWarmup && now - parseInt(lastWarmup) < 10 * 60 * 1000) {
          console.log('📦 Render 웜업 캐시 사용 (10분 이내)');
          return;
        }

        // 백그라운드에서 조용히 웜업 실행
        const response = await fetch('/api/mcp/warmup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ forceRefresh: false }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Render 웜업 완료: ${data.responseTime}ms`);
          sessionStorage.setItem(warmupKey, now.toString());
        } else {
          console.warn(`⚠️ Render 웜업 실패: ${response.status}`);
        }
      } catch (error) {
        console.warn('⚠️ Render 웜업 오류 (무시됨):', error);
      }
    };

    // 페이지 로드 3초 후 웜업 실행 (UI 렌더링 완료 후)
    const warmupTimer = setTimeout(performRenderWarmup, 3000);

    return () => clearTimeout(warmupTimer);
  }, []);

  // 🔧 상태 변화 디버깅 (클라이언트에서만)
  useEffect(() => {
    if (!isMounted) return;

    console.log('🔍 Home - 시스템 상태 변화:', {
      isSystemStarted,
      aiAgentEnabled: aiAgent.isEnabled,
      aiAgentState: aiAgent.state,
      timeRemaining: systemTimeRemaining,
    });
  }, [
    isMounted,
    isSystemStarted,
    aiAgent.isEnabled,
    aiAgent.state,
    systemTimeRemaining,
  ]);

  // 🛡️ 상태 불일치 방지 - AI 에이전트가 시스템 중지 시 비활성화되는지 확인 (클라이언트에서만)
  useEffect(() => {
    if (!isMounted) return;

    // 🚨 시스템이 시작된 후에만 상태 불일치 감지
    if (isSystemStarted && !aiAgent.isEnabled) {
      console.warn(
        '⚠️ 상태 불일치 감지: 시스템이 활성화되었지만 AI 에이전트가 비활성화됨'
      );
    }
  }, [isMounted, isSystemStarted, aiAgent.isEnabled]);

  // 시스템 타이머 업데이트 (클라이언트에서만)
  useEffect(() => {
    if (!isMounted) return;

    if (isSystemStarted) {
      const updateTimer = () => {
        const remaining = getSystemRemainingTime();
        setSystemTimeRemaining(remaining);
      };

      updateTimer(); // 즉시 실행
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    } else {
      setSystemTimeRemaining(0);
    }
  }, [isMounted, isSystemStarted, getSystemRemainingTime]);

  // 컴포넌트 언마운트 시 카운트다운 정리
  useEffect(() => {
    return () => {
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    };
  }, [countdownTimer]);

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
            className='bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-bold'
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              backgroundSize: '200% 200%',
            }}
          >
            {part}
          </motion.span>
        );
      }
      return part;
    });
  };

  // 🚀 시스템 시작 카운트다운 함수
  const startSystemCountdown = () => {
    console.log('🚀 시스템 시작 카운트다운 시작 (3초)');
    console.log('🚀 3초 후 시스템이 시작되고 로딩 페이지로 이동합니다!');

    setSystemStartCountdown(3);

    const timer = setInterval(() => {
      setSystemStartCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // 3초 후 시스템 시작 및 로딩 페이지로 이동
          handleSystemStart();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setCountdownTimer(timer);
  };

  // 🛑 카운트다운 중지 함수
  const stopSystemCountdown = () => {
    console.log('🛑 시스템 시작 카운트다운 취소');
    if (countdownTimer) {
      clearInterval(countdownTimer);
    }
    setSystemStartCountdown(0);
    setCountdownTimer(null);
    console.log('⏹️ 시스템 시작이 취소되었습니다.');
  };

  // 🚀 통합 시스템 시작 함수
  const handleSystemStart = async () => {
    try {
      console.log('🚀 시스템 시작 실행');
      setIsLoading(true);
      await startSystem();
      console.log('✅ 시스템이 성공적으로 시작되었습니다.');
      // 로딩 페이지로 이동
      router.push('/system-boot');
    } catch (error) {
      console.error('❌ 시스템 시작 실패:', error);
      console.error('❌ 시스템 시작에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 시스템 토글 함수 (카운트다운 포함)
  const handleSystemToggle = async () => {
    if (isLoading) return;

    if (isSystemStarted) {
      // 시스템이 실행 중이면 즉시 중지
      setIsLoading(true);
      try {
        console.log('🛑 시스템 중지 요청');
        await stopSystem();
        console.log('✅ 시스템이 성공적으로 중지되었습니다.');
      } catch (error) {
        console.error('❌ 시스템 중지 실패:', error);
        console.error('❌ 시스템 중지에 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    } else if (systemStartCountdown > 0) {
      // 카운트다운 중이면 카운트다운 중지
      stopSystemCountdown();
    } else {
      // 시스템이 중지 상태면 3초 카운트다운 시작
      startSystemCountdown();
    }
  };

  // 📊 대시보드 이동 함수 (항상 접속 가능)
  const handleDashboardClick = () => {
    console.log('📊 대시보드로 바로 이동');
    router.push('/dashboard');
  };

  // 🔄 클라이언트 마운트 전에는 기본 상태로 렌더링 (hydration 문제 방지)
  if (!isMounted) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900'>
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <Loader2 className='w-8 h-8 animate-spin text-white mx-auto mb-4' />
            <p className='text-white/80'>시스템 초기화 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900'>
      {/* 웨이브 파티클 배경 효과 */}
      <div className='wave-particles'></div>

      {/* 헤더 */}
      <header className='relative z-10 flex justify-between items-center p-6'>
        <div className='flex items-center space-x-3'>
          {/* AI 컨셉 아이콘 - 통합 AI 카드 스타일 애니메이션 적용 */}
          <motion.div
            className='w-10 h-10 rounded-lg flex items-center justify-center relative shadow-lg'
            animate={
              aiAgent.isEnabled
                ? {
                    background: [
                      'linear-gradient(135deg, #a855f7, #ec4899)',
                      'linear-gradient(135deg, #ec4899, #06b6d4)',
                      'linear-gradient(135deg, #06b6d4, #a855f7)',
                    ],
                    scale: [1, 1.1, 1],
                    rotate: [0, 360],
                    boxShadow: [
                      '0 4px 15px rgba(168, 85, 247, 0.3)',
                      '0 6px 20px rgba(236, 72, 153, 0.4)',
                      '0 4px 15px rgba(6, 182, 212, 0.3)',
                      '0 6px 20px rgba(168, 85, 247, 0.4)',
                    ],
                  }
                : isSystemStarted
                  ? {
                      background: [
                        'linear-gradient(135deg, #10b981, #059669)',
                        'linear-gradient(135deg, #059669, #047857)',
                        'linear-gradient(135deg, #047857, #10b981)',
                      ],
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        '0 4px 15px rgba(16, 185, 129, 0.3)',
                        '0 6px 20px rgba(5, 150, 105, 0.4)',
                        '0 4px 15px rgba(16, 185, 129, 0.3)',
                      ],
                    }
                  : {
                      background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                      scale: 1,
                      rotate: 0,
                    }
            }
            transition={{
              duration: aiAgent.isEnabled ? 2 : 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileHover={{
              scale: 1.15,
              transition: { duration: 0.3 },
            }}
          >
            {/* AI 활성화 시 회전 아이콘 */}
            {aiAgent.isEnabled ? (
              <motion.i
                className='fas fa-server text-white text-lg'
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
                  scale: {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                }}
                aria-hidden='true'
              />
            ) : (
              <i
                className='fas fa-server text-white text-lg'
                aria-hidden='true'
              />
            )}
          </motion.div>

          {/* 브랜드 텍스트 */}
          <div>
            <h1 className='text-xl font-bold text-white'>OpenManager</h1>
            <p className='text-xs text-white/70'>
              {aiAgent.isEnabled && !isSystemStarted
                ? 'AI 독립 모드'
                : aiAgent.isEnabled && isSystemStarted
                  ? 'AI + 시스템 통합 모드'
                  : isSystemStarted
                    ? '기본 모니터링'
                    : '시스템 정지'}
            </p>
          </div>
        </div>

        {/* 오른쪽 헤더 컨트롤 */}
        <div className='flex items-center gap-3'>
          {/* 프로필 컴포넌트 */}
          <UnifiedProfileComponent userName='사용자' />
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className='relative z-10 container mx-auto px-6 pt-8'>
        {/* 타이틀 섹션 */}
        <motion.div
          className='text-center mb-12'
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className='text-3xl md:text-5xl font-bold mb-4'>
            <span className='bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent'>
              {renderTextWithAIGradient('AI')}
            </span>{' '}
            <span className='font-semibold text-white'>기반</span>{' '}
            <span className='text-white'>서버 모니터링</span>
          </h1>
          <p className='text-lg md:text-xl max-w-3xl mx-auto leading-relaxed text-white/80'>
            <span className='text-sm text-white/60'>
              완전 독립 동작 AI 엔진 | 향후 개발: 선택적 LLM API 연동 확장
            </span>
          </p>
        </motion.div>

        {/* 제어 패널 */}
        <motion.div
          className='mb-12'
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {!isSystemStarted ? (
            /* 시스템 중지 상태 - 대시보드 버튼 중심으로 변경 */
            <div className='max-w-2xl mx-auto text-center'>
              {/* 시스템 종료 상태 안내 */}
              <div className='mb-6 p-4 rounded-xl border bg-red-500/20 border-red-400/30'>
                <div className='flex items-center justify-center gap-2 mb-2'>
                  <div className='w-3 h-3 bg-red-500 rounded-full animate-pulse'></div>
                  <span className='font-semibold text-red-200'>
                    시스템 종료됨
                  </span>
                </div>
                <p className='text-sm text-red-100'>
                  모든 서비스가 중지되었습니다.
                  <br />
                  <strong>
                    대시보드는 언제든지 접속 가능하며, 시스템 시작 버튼으로 전체
                    서비스를 활성화할 수 있습니다.
                  </strong>
                </p>
              </div>

              {/* 메인 제어 버튼들 */}
              <div className='flex flex-col items-center mb-6 space-y-4'>
                {/* 대시보드 바로가기 버튼 */}
                <motion.button
                  onClick={handleDashboardClick}
                  className='w-64 h-16 flex items-center justify-center gap-3 rounded-xl font-semibold transition-all duration-200 border shadow-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white border-blue-400/50 hover:shadow-2xl'
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(59, 130, 246, 0.5)',
                      '0 0 0 10px rgba(59, 130, 246, 0)',
                      '0 0 0 0 rgba(59, 130, 246, 0)',
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <BarChart3 className='w-6 h-6' />
                  <span className='text-lg'>📊 대시보드 바로가기</span>
                </motion.button>

                {/* 시스템 시작 버튼 */}
                <motion.button
                  onClick={handleSystemToggle}
                  disabled={isLoading}
                  className={`w-64 h-16 flex items-center justify-center gap-3 rounded-xl font-semibold transition-all duration-200 border shadow-xl ${
                    isLoading
                      ? 'bg-gray-500 text-white border-gray-400/50 cursor-not-allowed'
                      : systemStartCountdown > 0
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-orange-400/50 shadow-lg shadow-orange-500/50'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-green-400/50 hover:shadow-2xl'
                  }`}
                  whileHover={!isLoading ? { scale: 1.05, y: -2 } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                  animate={
                    systemStartCountdown > 0
                      ? {
                          scale: [1, 1.08, 1],
                          boxShadow: [
                            '0 0 0 0 rgba(255, 165, 0, 0.8)',
                            '0 0 0 15px rgba(255, 165, 0, 0)',
                            '0 0 0 0 rgba(255, 165, 0, 0)',
                          ],
                        }
                      : {
                          boxShadow: [
                            '0 0 0 0 rgba(34, 197, 94, 0.5)',
                            '0 0 0 10px rgba(34, 197, 94, 0)',
                            '0 0 0 0 rgba(34, 197, 94, 0)',
                          ],
                        }
                  }
                  transition={{
                    duration: systemStartCountdown > 0 ? 1 : 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {isLoading ? (
                    <Loader2 className='w-6 h-6 animate-spin' />
                  ) : systemStartCountdown > 0 ? (
                    <div className='flex items-center gap-2'>
                      <X className='w-6 h-6' />
                      <span>🛑 시작 취소</span>
                      <div className='bg-white/20 rounded-full w-8 h-8 flex items-center justify-center'>
                        <span className='text-lg font-bold text-yellow-300'>
                          {systemStartCountdown}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Play className='w-6 h-6' />
                      <span className='text-lg'>🚀 시스템 시작</span>
                    </>
                  )}
                </motion.button>

                {/* 상태 안내 */}
                <div className='mt-3 flex justify-center'>
                  <span
                    className={`text-2xl ${systemStartCountdown > 0 ? 'animate-bounce text-orange-400' : 'animate-wiggle text-yellow-400'}`}
                  >
                    {systemStartCountdown > 0 ? '⏰' : '👆'}
                  </span>
                </div>
                <div className='mt-2 flex justify-center'>
                  <span
                    className={`text-sm font-medium opacity-80 ${
                      systemStartCountdown > 0
                        ? 'text-orange-300 animate-pulse'
                        : 'animate-point-bounce text-white'
                    }`}
                  >
                    {systemStartCountdown > 0
                      ? '시스템 시작 중... (취소하려면 버튼 클릭)'
                      : '대시보드 바로가기 또는 시스템 시작을 선택하세요'}
                  </span>
                </div>
              </div>

              {/* 추가 설명 */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                <div className='p-3 rounded-lg bg-white/5'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Zap className='w-4 h-4 text-blue-400' />
                    <span className='font-semibold'>시스템 시작 과정</span>
                  </div>
                  <p className='text-white/70'>
                    MCP 서버 Wake-up → 서버 시딩 → 시뮬레이션 → 대시보드 이동
                  </p>
                </div>
                <div className='p-3 rounded-lg bg-white/5'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Bot className='w-4 h-4 text-purple-400' />
                    <span className='font-semibold'>AI 어시스턴트</span>
                  </div>
                  <p className='text-white/70'>
                    시스템 시작 후 대시보드에서 AI 사이드바 이용 가능
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* 시스템 활성 상태 */
            <motion.div
              className='max-w-4xl mx-auto text-center'
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* 시스템 활성 상태 안내 */}
              <div className='mb-6 p-4 rounded-xl border bg-green-500/20 border-green-400/30'>
                <div className='flex items-center justify-center gap-2 mb-2'>
                  <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse'></div>
                  <span className='font-semibold text-green-200'>
                    시스템 활성 - 남은 시간: {formatTime(systemTimeRemaining)}
                  </span>
                </div>
                <p className='text-sm text-green-100'>
                  모든 서비스가 정상 동작 중입니다. 대시보드에서 상세 정보를
                  확인하세요.
                </p>
              </div>

              {/* 제어 버튼들 - 3개를 가로로 배치 */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
                {/* AI 엔진 상태 표시 */}
                <div className='flex flex-col items-center'>
                  <motion.div
                    className='w-52 h-14 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold border border-green-400/50 shadow-lg shadow-green-500/30'
                    animate={{
                      scale: [1, 1.02, 1],
                      boxShadow: [
                        '0 0 0 0 rgba(34, 197, 94, 0.6)',
                        '0 0 0 8px rgba(34, 197, 94, 0)',
                        '0 0 0 0 rgba(34, 197, 94, 0)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      <Bot className='w-5 h-5' />
                    </motion.div>
                    <span className='text-white font-bold drop-shadow-lg'>
                      🧠 AI 엔진 활성
                    </span>
                  </motion.div>

                  {/* 상태 표시 */}
                  <div className='mt-2 flex justify-center'>
                    <span className='text-green-400 text-xl animate-pulse'>
                      ✅
                    </span>
                  </div>
                  <div className='mt-1 flex justify-center'>
                    <span className='text-green-300 text-xs opacity-70'>
                      시스템 준비 완료
                    </span>
                  </div>
                </div>

                {/* 대시보드 버튼 */}
                <div className='flex flex-col items-center'>
                  <motion.button
                    onClick={handleDashboardClick}
                    className='w-52 h-14 flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 border bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500/50'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <BarChart3 className='w-5 h-5' />
                    <span>📊 대시보드 열기</span>
                  </motion.button>

                  {/* 안내 아이콘 */}
                  <div className='mt-2 flex justify-center'>
                    <span className='text-xl animate-wiggle text-yellow-400'>
                      👆
                    </span>
                  </div>
                  <div className='mt-1 flex justify-center'>
                    <span className='text-xs opacity-70 text-white animate-point-bounce'>
                      클릭하세요
                    </span>
                  </div>
                </div>

                {/* 시스템 중지 버튼 */}
                <div className='flex flex-col items-center'>
                  <motion.button
                    onClick={handleSystemToggle}
                    disabled={isLoading}
                    className='w-52 h-14 flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 border disabled:opacity-75 bg-red-600 hover:bg-red-700 text-white border-red-500/50'
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isLoading ? (
                      <Loader2 className='w-5 h-5 animate-spin' />
                    ) : (
                      <StopCircle className='w-5 h-5' />
                    )}
                    <span>{isLoading ? '중지 중...' : '⏹️ 시스템 중지'}</span>
                  </motion.button>
                </div>
              </div>

              <p className='text-white/60 text-xs mt-4 text-center'>
                시스템이 활성화되어 있습니다. 대시보드에서 상세 모니터링을
                확인하세요.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* 기능 카드 그리드 */}
        <div className='mb-12'>
          <FeatureCardsGrid />
        </div>

        {/* 푸터 */}
        <div className='mt-8 pt-6 border-t text-center border-white/20'>
          <p className='text-white/70'>
            Copyright(c) OpenManager. All rights reserved.
          </p>
        </div>
      </div>

      {/* 왼쪽 하단 실행중 기능들과 토스트 알람 제거됨 */}
    </div>
  );
}
