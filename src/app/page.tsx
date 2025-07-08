/**
 * 🏠 OpenManager 메인 페이지
 *
 * GitHub OAuth + 게스트 로그인 지원
 * 로그인된 사용자에게 시스템 시작 버튼과 기능 카드들 표시
 */

'use client';

import UnifiedProfileComponent from '@/components/UnifiedProfileComponent';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { motion } from 'framer-motion';
import { BarChart3, Loader2, Play, X, Zap } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [guestUser, setGuestUser] = useState<{
    name: string;
    email?: string;
  } | null>(null);

  const {
    isSystemStarted,
    aiAgent,
    adminMode,
    startSystem,
    stopSystem,
    logout,
    getSystemRemainingTime,
  } = useUnifiedAdminStore();

  // 📊 다중 사용자 시스템 상태 관리
  const {
    status: multiUserStatus,
    isLoading: statusLoading,
    startSystem: startMultiUserSystem,
  } = useSystemStatus();

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
    console.log(
      '🔄 페이지 로드 완료 - Google Cloud 24시간 기동으로 웜업 불필요'
    );
  }, []);

  // NextAuth 및 게스트 로그인 확인
  useEffect(() => {
    if (status === 'loading') return;

    const checkGuestLogin = () => {
      try {
        const authType = localStorage.getItem('auth_type');
        const authUser = localStorage.getItem('auth_user');
        const sessionId = localStorage.getItem('auth_session_id');

        if (authType === 'guest' && authUser && sessionId) {
          setGuestUser(JSON.parse(authUser));
          return true;
        }
        return false;
      } catch (error) {
        console.error('게스트 로그인 확인 실패:', error);
        return false;
      }
    };

    const hasGuestLogin = checkGuestLogin();

    // GitHub OAuth도 없고 게스트 로그인도 없으면 로그인 페이지로
    if (!session && !hasGuestLogin) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

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
      return;
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
    setSystemStartCountdown(5);
    const timer = setInterval(() => {
      setSystemStartCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSystemStart(); // 기존 시스템 시작 함수 호출
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setCountdownTimer(timer);
  };

  const stopSystemCountdown = () => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      setCountdownTimer(null);
    }
    setSystemStartCountdown(0);
  };

  // 🚀 시스템 시작 함수 (다중 사용자 기능 통합)
  const handleSystemStart = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // 1. 다중 사용자 상태 업데이트
      await startMultiUserSystem();

      // 2. 기존 시스템 시작 로직 실행
      await startSystem();

      console.log('✅ 시스템 시작 완료');

      // 3초 후 대시보드로 이동
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('❌ 시스템 시작 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 시스템 토글 함수
  const handleSystemToggle = async () => {
    if (isSystemStarted) {
      await stopSystem();
    } else {
      startSystemCountdown();
    }
  };

  // 대시보드 클릭 핸들러
  const handleDashboardClick = () => {
    router.push('/dashboard');
  };

  // 버튼 설정 가져오기
  const getButtonConfig = () => {
    if (systemStartCountdown > 0) {
      return {
        text: `시스템 시작 중... ${systemStartCountdown}`,
        icon: Loader2,
        className:
          'bg-gradient-to-r from-yellow-500 to-orange-500 animate-pulse',
        disabled: true,
      };
    }

    if (isSystemStarted) {
      return {
        text: `시스템 실행 중 (${formatTime(systemTimeRemaining)})`,
        icon: Zap,
        className: 'bg-gradient-to-r from-green-500 to-emerald-500',
        disabled: false,
      };
    }

    return {
      text: '시스템 시작',
      icon: Play,
      className: 'bg-gradient-to-r from-blue-500 to-purple-500',
      disabled: false,
    };
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    if (session) {
      // GitHub OAuth 로그아웃
      await signOut({ callbackUrl: '/login' });
    } else {
      // 게스트 로그아웃
      localStorage.removeItem('auth_session_id');
      localStorage.removeItem('auth_type');
      localStorage.removeItem('auth_user');
      router.push('/login');
    }
  };

  // 사용자 정보 가져오기
  const getUserInfo = () => {
    if (session?.user) {
      return {
        name: session.user.name || 'GitHub 사용자',
        avatar: session.user.image,
      };
    } else if (guestUser) {
      return {
        name: guestUser.name || '게스트',
        avatar: null,
      };
    }
    return { name: '사용자', avatar: null };
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

  // NextAuth 로딩 중일 때는 별도 처리
  if (status === 'loading') {
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

  const userInfo = getUserInfo();
  const buttonConfig = getButtonConfig();
  const ButtonIcon = buttonConfig.icon;

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white overflow-hidden'>
      {/* 배경 장식 */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000'></div>
        <div className='absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000'></div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className='relative z-10 min-h-screen flex flex-col'>
        {/* 상단 네비게이션 */}
        <nav className='bg-black/20 backdrop-blur-lg border-b border-white/10 px-6 py-4'>
          <div className='flex justify-between items-center'>
            <div className='flex items-center space-x-3'>
              <div className='w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center'>
                <span className='text-white text-lg font-bold'>OM</span>
              </div>
              <div>
                <h1 className='text-xl font-bold text-white'>OpenManager</h1>
                <p className='text-xs text-gray-300'>AI 서버 모니터링 v5</p>
              </div>
            </div>

            {/* 통합 프로필 컴포넌트 */}
            <UnifiedProfileComponent
              userName={userInfo.name}
              userAvatar={userInfo.avatar || undefined}
            />
          </div>
        </nav>

        {/* 메인 콘텐츠 영역 */}
        <main className='flex-1 container mx-auto px-6 py-12'>
          {/* 히어로 섹션 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className='text-center mb-16'
          >
            <motion.h1
              className='text-5xl md:text-7xl font-bold mb-6 leading-tight'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {renderTextWithAIGradient('AI 서버 모니터링')}
              <br />
              <span className='text-4xl md:text-6xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent'>
                차세대 플랫폼
              </span>
            </motion.h1>

            <motion.p
              className='text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {renderTextWithAIGradient(
                '실시간 AI 분석으로 서버 상태를 모니터링하고, 자연어 질의를 통해 시스템을 제어하세요.'
              )}
            </motion.p>

            {/* 시스템 제어 버튼 */}
            <motion.div
              className='flex flex-col sm:flex-row gap-4 justify-center items-center mb-8'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSystemToggle}
                disabled={buttonConfig.disabled}
                className={`
                  ${buttonConfig.className}
                  px-8 py-4 rounded-xl font-semibold text-lg 
                  shadow-lg hover:shadow-xl transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center gap-3
                `}
              >
                <ButtonIcon
                  className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`}
                />
                {buttonConfig.text}
              </motion.button>

              {isSystemStarted && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDashboardClick}
                  className='px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3'
                >
                  <BarChart3 className='w-6 h-6' />
                  대시보드 열기
                </motion.button>
              )}

              {systemStartCountdown > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopSystemCountdown}
                  className='px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-colors flex items-center gap-2'
                >
                  <X className='w-5 h-5' />
                  취소
                </motion.button>
              )}
            </motion.div>

            {/* 시스템 상태 표시 */}
            {isSystemStarted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className='inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-300'
              >
                <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
                <span>시스템 활성화</span>
                {aiAgent.isEnabled && (
                  <span className='ml-2 px-2 py-1 bg-purple-500/30 rounded-full text-xs'>
                    {renderTextWithAIGradient('AI 활성화')}
                  </span>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* 기능 카드 그리드 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <FeatureCardsGrid />
          </motion.div>
        </main>
      </div>

      {/* CSS 애니메이션 */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
