'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import {
  Power,
  Bot,
  BarChart3,
  Shield,
  Loader2,
  StopCircle,
  X,
  Sun,
  Moon,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import UnifiedProfileComponent from '@/components/UnifiedProfileComponent';
import { InlineFeedbackContainer } from '@/components/ui/InlineFeedbackSystem';
import { SlackToastContainer } from '@/components/ui/SlackOnlyToastSystem';

// 🔔 Dynamic Import로 성능 최적화
const ToastContainer = dynamic(
  () =>
    import('@/components/ui/ToastNotification').then(mod => ({
      default: mod.ToastContainer,
    })),
  {
    ssr: false,
  }
);

// 고급 알림 시스템 추가
const AdvancedNotificationContainer = dynamic(
  () =>
    import('@/components/ui/AdvancedNotificationSystem').then(mod => ({
      default: mod.AdvancedNotificationContainer,
    })),
  {
    ssr: false,
  }
);

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

// 🎨 Toast Hook 직접 import
import { useToast } from '@/components/ui/ToastNotification';

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
  const { success, error, info, warning } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [systemTimeRemaining, setSystemTimeRemaining] = useState(0);

  // 🚀 자동 대시보드 이동 카운트다운 상태
  const [autoNavigateCountdown, setAutoNavigateCountdown] = useState(0);
  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // 🌙 다크모드 상태 (기본값: true - 다크모드)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // 🔧 상태 변화 디버깅
  useEffect(() => {
    console.log('🔍 Home - 시스템 상태 변화:', {
      isSystemStarted,
      aiAgentEnabled: aiAgent.isEnabled,
      aiAgentState: aiAgent.state,
      timeRemaining: systemTimeRemaining,
    });
  }, [isSystemStarted, aiAgent.isEnabled, aiAgent.state, systemTimeRemaining]);

  // 🛡️ 상태 불일치 방지 - AI 에이전트가 시스템 중지 시 비활성화되는지 확인
  useEffect(() => {
    if (!isSystemStarted && aiAgent.isEnabled) {
      console.warn(
        '⚠️ 상태 불일치 감지: 시스템이 중지되었지만 AI 에이전트가 여전히 활성 상태'
      );
    }
  }, [isSystemStarted, aiAgent.isEnabled]);

  // 시스템 타이머 업데이트
  useEffect(() => {
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
  }, [isSystemStarted, getSystemRemainingTime]);

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

  // 🚀 카운트다운 시작 함수
  const startCountdown = () => {
    console.log('🚀 자동 시스템 부팅 페이지 이동 카운트다운 시작');
    success('🚀 5초 후 다음 단계로 자동 이동합니다!');

    setAutoNavigateCountdown(5);

    const timer = setInterval(() => {
      setAutoNavigateCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          const target = isSystemStarted ? '/dashboard' : '/system-boot';
          router.push(target);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setCountdownTimer(timer);
  };

  // 🛑 카운트다운 중지 함수
  const stopCountdown = () => {
    console.log('🛑 자동 대시보드 이동 카운트다운 취소');
    if (countdownTimer) {
      clearInterval(countdownTimer);
    }
    setAutoNavigateCountdown(0);
    setCountdownTimer(null);
    info('⏹️ 자동 이동이 취소되었습니다.');
  };

  const handleSystemToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isSystemStarted) {
        console.log('🛑 시스템 중지 시작');
        stopCountdown(); // 카운트다운 중지
        await stopSystem();
        success('⏹️ 시스템이 안전하게 중지되었습니다.');
      } else {
        console.log('🚀 시스템 시작 - 로딩 페이지로 이동');
        const target = isSystemStarted ? '/dashboard' : '/system-boot';
        console.log(`🚀 ${target} 페이지로 이동`);
        router.push(target);
      }
    } catch (error) {
      console.error('시스템 토글 중 오류:', error);
      error('시스템 조작 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDashboardClick = async () => {
    try {
      console.log('🚀 로딩 페이지로 이동');
      const target = isSystemStarted ? '/dashboard' : '/system-boot';
      console.log(`🚀 ${target} 페이지로 이동`);
      router.push(target);
    } catch (error) {
      console.error('로딩 페이지 접근 중 오류:', error);
      error('로딩 페이지에 접근할 수 없습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleBootAnimationClick = async () => {
    if (!isSystemStarted) {
      warning('🚨 시스템을 먼저 시작해야 합니다!');
      return;
    }

    try {
      console.log('🚀 시스템 부팅 애니메이션 페이지로 이동');
      router.push('/system-boot');
    } catch (error) {
      console.error('시스템 부팅 페이지 접근 중 오류:', error);
      error(
        '시스템 부팅 페이지에 접근할 수 없습니다. 잠시 후 다시 시도해주세요.'
      );
    }
  };

  const handleAIAgentInfo = () => {
    info(
      `🧠 AI 에이전트 상태: ${aiAgent.isEnabled ? '활성' : '비활성'}\n` +
        `상태: ${aiAgent.state}\n` +
        `시스템 연동: ${isSystemStarted ? '연결됨' : '대기 중'}`
    );
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // 다크모드에 따른 배경 스타일
  const getBackgroundClass = () => {
    return isDarkMode
      ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900'
      : 'bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50';
  };

  // 다크모드에 따른 텍스트 스타일
  const getTextClass = () => {
    return isDarkMode ? 'text-white' : 'text-gray-900';
  };

  // 다크모드에 따른 카드 스타일
  const getCardClass = () => {
    return isDarkMode
      ? 'bg-white/10 border border-white/20'
      : 'bg-white/80 border border-gray-200';
  };

  return (
    <div className={`min-h-screen ${getBackgroundClass()}`}>
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
            <h1 className={`text-xl font-bold ${getTextClass()}`}>
              OpenManager
            </h1>
            <p
              className={`text-xs ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}
            >
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
          {/* 다크모드 토글 버튼 */}
          <motion.button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDarkMode
                ? 'text-white/80 hover:text-white hover:bg-white/5'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={`${isDarkMode ? '라이트' : '다크'} 모드로 전환`}
          >
            {isDarkMode ? (
              <Sun className='w-5 h-5' />
            ) : (
              <Moon className='w-5 h-5' />
            )}
          </motion.button>

          {/* AI 관리자 페이지 버튼 - 관리자 로그인 시에만 표시 */}
          {adminMode.isAuthenticated && (
            <Link href='/admin/ai-agent'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300 hover:bg-purple-500/30'
                    : 'bg-purple-100 border border-purple-300 text-purple-700 hover:bg-purple-200'
                }`}
              >
                <Shield className='w-4 h-4' />
                <span className='text-sm font-medium'>🧠 AI 엔진 관리</span>
              </motion.button>
            </Link>
          )}

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
            <span className={`font-semibold ${getTextClass()}`}>기반</span>{' '}
            <span className={getTextClass()}>서버 모니터링</span>
          </h1>
          <p
            className={`text-lg md:text-xl max-w-3xl mx-auto leading-relaxed ${
              isDarkMode ? 'text-white/80' : 'text-gray-700'
            }`}
          >
            <span
              className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-gray-600'}`}
            >
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
            /* 시스템 중지 상태 */
            <div className='max-w-md mx-auto text-center'>
              {/* 시스템 종료 상태 안내 */}
              <div
                className={`mb-6 p-4 rounded-xl border ${
                  isDarkMode
                    ? 'bg-red-500/20 border-red-400/30'
                    : 'bg-red-100 border-red-300'
                }`}
              >
                <div className='flex items-center justify-center gap-2 mb-2'>
                  <div className='w-3 h-3 bg-red-500 rounded-full animate-pulse'></div>
                  <span
                    className={`font-semibold ${
                      isDarkMode ? 'text-red-200' : 'text-red-800'
                    }`}
                  >
                    시스템 종료됨
                  </span>
                </div>
                <p
                  className={`text-sm ${
                    isDarkMode ? 'text-red-100' : 'text-red-700'
                  }`}
                >
                  모든 서비스가 중지되었습니다.
                  <br />
                  <strong>아래 버튼을 눌러 시스템을 다시 시작하세요.</strong>
                </p>
              </div>

              {/* 손가락 표시 애니메이션 */}
              <div className='flex flex-col items-center'>
                <motion.button
                  onClick={handleSystemToggle}
                  disabled={isLoading}
                  className='inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-75'
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <Loader2 className='w-6 h-6 animate-spin' />
                  ) : (
                    <Power className='w-6 h-6' />
                  )}
                  <span>
                    {isLoading ? '시작 중...' : '🚀 시스템 시작 (30분)'}
                  </span>
                </motion.button>

                {/* 손가락 아이콘 - 버튼 아래에서 위로 가리키도록 수정 */}
                <div className='mt-2 flex justify-center'>
                  <span className='animate-wiggle text-yellow-400 text-2xl'>
                    👆
                  </span>
                </div>
                <div className='mt-1 flex justify-center'>
                  <span
                    className={`text-xs opacity-70 animate-point-bounce ${getTextClass()}`}
                  >
                    클릭하세요
                  </span>
                </div>
              </div>

              <p
                className={`text-sm ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}
              >
                <strong>통합 시스템 시작:</strong> 서버 시딩 → 시뮬레이션 →
                데이터 생성
                <br />
                <strong>AI 에이전트:</strong> 독립 모드 가능 (시스템 연동
                선택사항)
              </p>
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
              <div
                className={`mb-6 p-4 rounded-xl border ${
                  isDarkMode
                    ? 'bg-green-500/20 border-green-400/30'
                    : 'bg-green-100 border-green-300'
                }`}
              >
                <div className='flex items-center justify-center gap-2 mb-2'>
                  <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse'></div>
                  <span
                    className={`font-semibold ${
                      isDarkMode ? 'text-green-200' : 'text-green-800'
                    }`}
                  >
                    시스템 활성 - 남은 시간: {formatTime(systemTimeRemaining)}
                  </span>
                </div>
                <p
                  className={`text-sm ${
                    isDarkMode ? 'text-green-100' : 'text-green-700'
                  }`}
                >
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
                  <div className='space-y-2'>
                    <motion.button
                      onClick={handleDashboardClick}
                      className={`w-52 h-14 flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 border ${
                        autoNavigateCountdown > 0
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-orange-400/50 shadow-lg shadow-orange-500/50'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500/50'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={
                        autoNavigateCountdown > 0
                          ? {
                              scale: [1, 1.08, 1],
                              boxShadow: [
                                '0 0 0 0 rgba(255, 165, 0, 0.8)',
                                '0 0 0 15px rgba(255, 165, 0, 0)',
                                '0 0 0 0 rgba(255, 165, 0, 0)',
                              ],
                            }
                          : {}
                      }
                      transition={{
                        duration: 1,
                        repeat: autoNavigateCountdown > 0 ? Infinity : 0,
                        ease: 'easeInOut',
                      }}
                    >
                      <BarChart3 className='w-5 h-5' />
                      {autoNavigateCountdown > 0 ? (
                        <div className='flex items-center gap-2'>
                          <span>🚀 자동 이동</span>
                          <div className='bg-white/20 rounded-full w-6 h-6 flex items-center justify-center'>
                            <span className='text-sm font-bold text-yellow-300'>
                              {autoNavigateCountdown}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>📊 대시보드 바로 열기</>
                      )}
                    </motion.button>
                  </div>

                  {/* 손가락 아이콘 + 클릭 문구 - 카운트다운 상태에 따라 변경 */}
                  <div className='mt-2 flex justify-center'>
                    <span
                      className={`text-xl ${
                        autoNavigateCountdown > 0
                          ? 'animate-bounce text-orange-400'
                          : 'animate-wiggle text-yellow-400'
                      }`}
                    >
                      {autoNavigateCountdown > 0 ? '⏰' : '👆'}
                    </span>
                  </div>
                  <div className='mt-1 flex justify-center'>
                    <span
                      className={`text-xs opacity-70 ${
                        autoNavigateCountdown > 0
                          ? 'text-orange-300 animate-pulse'
                          : 'text-white animate-point-bounce'
                      }`}
                    >
                      {autoNavigateCountdown > 0
                        ? '자동 이동 중...'
                        : '클릭하세요'}
                    </span>
                  </div>
                </div>

                {/* 시스템 중지 / 카운트다운 취소 버튼 */}
                <div className='flex flex-col items-center'>
                  <motion.button
                    onClick={
                      autoNavigateCountdown > 0
                        ? stopCountdown
                        : handleSystemToggle
                    }
                    disabled={isLoading}
                    className={`w-52 h-14 flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 border disabled:opacity-75 ${
                      autoNavigateCountdown > 0
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-500/50'
                        : 'bg-red-600 hover:bg-red-700 text-white border-red-500/50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={
                      autoNavigateCountdown > 0
                        ? {
                            scale: [1, 1.02, 1],
                          }
                        : {}
                    }
                    transition={{
                      duration: 0.5,
                      repeat: autoNavigateCountdown > 0 ? Infinity : 0,
                      ease: 'easeInOut',
                    }}
                  >
                    {isLoading ? (
                      <Loader2 className='w-5 h-5 animate-spin' />
                    ) : autoNavigateCountdown > 0 ? (
                      <X className='w-5 h-5' />
                    ) : (
                      <StopCircle className='w-5 h-5' />
                    )}
                    <span>
                      {isLoading
                        ? '중지 중...'
                        : autoNavigateCountdown > 0
                          ? '🛑 취소하기'
                          : '⏹️ 시스템 중지'}
                    </span>
                  </motion.button>

                  {/* 카운트다운 상태에 따른 안내 */}
                  <div className='mt-2 flex justify-center'>
                    <span
                      className={`text-xl ${
                        autoNavigateCountdown > 0
                          ? 'animate-bounce text-yellow-400'
                          : 'text-transparent'
                      }`}
                    >
                      {autoNavigateCountdown > 0 ? '✋' : '👆'}
                    </span>
                  </div>
                  <div className='mt-1 flex justify-center'>
                    <span
                      className={`text-xs ${
                        autoNavigateCountdown > 0
                          ? 'text-yellow-300 opacity-70 animate-pulse'
                          : 'text-transparent opacity-0'
                      }`}
                    >
                      {autoNavigateCountdown > 0
                        ? '자동 이동 취소'
                        : '클릭하세요'}
                    </span>
                  </div>
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
        <div
          className={`mt-8 pt-6 border-t text-center ${
            isDarkMode ? 'border-white/20' : 'border-gray-300'
          }`}
        >
          <p className={isDarkMode ? 'text-white/70' : 'text-gray-600'}>
            Copyright(c) OpenManager. All rights reserved.
          </p>
        </div>
      </div>

      {/* 인라인 피드백 컨테이너들 */}
      <InlineFeedbackContainer
        area='system-control'
        className='fixed bottom-4 left-4 z-50'
      />
      <InlineFeedbackContainer
        area='ai-agent'
        className='fixed bottom-4 center-4 z-50'
      />

      {/* Slack 전용 토스트 컨테이너 */}
      <SlackToastContainer />

      {/* 토스트 알림 컨테이너 */}
      <ToastContainer />

      {/* 고급 알림 시스템 컨테이너 */}
      <AdvancedNotificationContainer />
    </div>
  );
}
