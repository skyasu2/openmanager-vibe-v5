'use client';

import { memo, Suspense, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Clock, Settings, Server } from 'lucide-react';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useToast } from '../ui/ToastNotification';

// 추가된 임포트
import UnifiedProfileComponent from '../UnifiedProfileComponent';
import { useAISidebarStore } from '@/stores/useAISidebarStore';

// 기존 VercelOptimizedAISidebar 제거 - 새로운 도메인 분리 아키텍처로 대체됨

/**
 * 서버 통계 인터페이스
 */
interface ServerStats {
  /** 전체 서버 수 */
  total: number;
  /** 온라인 서버 수 */
  online: number;
  /** 경고 상태 서버 수 */
  warning: number;
  /** 오프라인 서버 수 */
  offline: number;
}

/**
 * 프로필 설정 인터페이스
 */
interface ProfileSettings {
  serverCount: number;
  architecture: string;
  environment: string;
  theme: string;
}

/**
 * 대시보드 헤더 컴포넌트 Props
 */
interface DashboardHeaderProps {
  /** 서버 통계 데이터 */
  serverStats: ServerStats;
  /** 홈으로 이동 핸들러 */
  onNavigateHome: () => void;
  /** AI 에이전트 토글 핸들러 - 기존 호환성을 위해 유지하지만 새로운 사이드바에서는 내부적으로 처리 */
  onToggleAgent?: () => void;
  /** AI 에이전트 열림 상태 - 기존 호환성을 위해 유지 */
  isAgentOpen?: boolean;
  /** 시스템 상태 표시 컴포넌트 */
  systemStatusDisplay: React.ReactNode;
}

/**
 * 실시간 시간 표시 컴포넌트
 */
const RealTimeDisplay = memo(function RealTimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showTime, setShowTime] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const updateTimer = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // 30초마다 업데이트 시간 갱신

    // 로컬 스토리지에서 시간 표시 설정 로드
    const savedShowTime = localStorage.getItem('dashboard-show-time');
    if (savedShowTime !== null) {
      setShowTime(JSON.parse(savedShowTime));
    }

    return () => {
      clearInterval(timer);
      clearInterval(updateTimer);
    };
  }, []);

  const toggleTime = () => {
    const newShowTime = !showTime;
    setShowTime(newShowTime);
    localStorage.setItem('dashboard-show-time', JSON.stringify(newShowTime));
  };

  if (!showTime) {
    return (
      <button
        onClick={toggleTime}
        className='text-center px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-500'
        title='시간 표시'
      >
        <Clock className='w-3 h-3 mx-auto' />
      </button>
    );
  }

  return (
    <div className='text-center relative group'>
      <div className='flex items-center gap-1 text-sm font-medium text-gray-900'>
        <Clock className='w-3 h-3 text-blue-500' />
        {currentTime.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </div>
      <div className='text-xs text-gray-500'>
        {currentTime.toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric',
          weekday: 'short',
        })}
      </div>
      <button
        onClick={toggleTime}
        className='absolute -top-1 -right-1 w-4 h-4 bg-gray-200 hover:bg-gray-300 rounded-full text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity'
        title='시간 숨기기'
      >
        ×
      </button>
    </div>
  );
});

/**
 * 프로필 설정 표시 컴포넌트
 */
const ProfileSettingsDisplay = memo(function ProfileSettingsDisplay() {
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    serverCount: 8,
    architecture: 'Microservices',
    environment: 'Vercel Free',
    theme: 'Dark',
  });
  const [showDetails, setShowDetails] = useState(true);

  useEffect(() => {
    // 프로필 설정 로드
    const loadProfileSettings = async () => {
      try {
        const response = await fetch('/api/admin/generator-config');
        if (response.ok) {
          const data = await response.json();
          setProfileSettings({
            serverCount: data.serverCount || 8,
            architecture: data.architecture || 'Microservices',
            environment:
              data.serverCount <= 8
                ? 'Vercel Free'
                : data.serverCount <= 20
                  ? 'Vercel Pro'
                  : 'Local Dev',
            theme: 'Dark',
          });
        }
      } catch (error) {
        console.log('프로필 설정 로드 실패:', error);
      }
    };

    loadProfileSettings();

    // 로컬 스토리지에서 표시 설정 로드
    const savedShowDetails = localStorage.getItem('dashboard-show-details');
    if (savedShowDetails !== null) {
      setShowDetails(JSON.parse(savedShowDetails));
    }
  }, []);

  const toggleDetails = () => {
    const newShowDetails = !showDetails;
    setShowDetails(newShowDetails);
    localStorage.setItem(
      'dashboard-show-details',
      JSON.stringify(newShowDetails)
    );
  };

  if (!showDetails) {
    return (
      <button
        onClick={toggleDetails}
        className='hidden lg:flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg border text-xs text-gray-500'
        title='설정 정보 표시'
      >
        <Settings className='w-3 h-3' />
        설정
      </button>
    );
  }

  return (
    <div className='hidden lg:flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border'>
      <div className='flex items-center gap-1'>
        <Server className='w-3 h-3 text-green-600' />
        <span className='text-xs text-gray-600'>
          {profileSettings.serverCount}개 서버
        </span>
      </div>
      <div className='w-px h-4 bg-gray-300'></div>
      <div className='flex items-center gap-1'>
        <Settings className='w-3 h-3 text-blue-600' />
        <span className='text-xs text-gray-600'>
          {profileSettings.environment}
        </span>
      </div>
      <button
        onClick={toggleDetails}
        className='ml-1 text-gray-400 hover:text-gray-600'
        title='설정 정보 숨기기'
      >
        ×
      </button>
    </div>
  );
});

/**
 * 대시보드 메인 헤더 컴포넌트
 *
 * @description
 * - 브랜드 로고 및 네비게이션
 * - 실시간 서버 통계 표시
 * - AI 에이전트 토글 버튼 (새로운 사이드바 연동)
 * - 시스템 상태 표시
 * - 실시간 시간 표시
 * - 프로필 설정값 표시
 *
 * @example
 * ```tsx
 * <DashboardHeader
 *   serverStats={{ total: 10, online: 8, warning: 1, offline: 1 }}
 *   onNavigateHome={() => router.push('/')}
 *   systemStatusDisplay={<SystemStatusDisplay />}
 * />
 * ```
 */
const DashboardHeader = memo(function DashboardHeader({
  serverStats,
  onNavigateHome,
  onToggleAgent, // 기존 호환성을 위해 유지
  isAgentOpen = false, // 기존 호환성을 위해 유지
  systemStatusDisplay,
}: DashboardHeaderProps) {
  const { aiAgent, ui } = useUnifiedAdminStore();
  const { warning } = useToast();

  // 새로운 AI 사이드바 상태
  const { isOpen: isSidebarOpen, setOpen: setSidebarOpen } =
    useAISidebarStore();

  // AI 에이전트 토글 핸들러 (새로운 사이드바 연동) - 인증 제한 제거
  const handleAIAgentToggle = () => {
    // 인증 체크 제거 - 누구나 AI 에이전트 사용 가능
    console.log('🤖 AI 에이전트 토글 - 인증 제한 없음');

    // 새로운 사이드바 토글
    setSidebarOpen(!isSidebarOpen);

    // 기존 호환성을 위한 콜백 호출
    onToggleAgent?.();
  };

  return (
    <>
      <header className='bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40'>
        <div className='flex items-center justify-between px-6 py-4'>
          <div className='flex items-center gap-4'>
            <button
              onClick={onNavigateHome}
              className='flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer'
              aria-label='홈으로 이동'
            >
              <div className='w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center'>
                <i
                  className='fas fa-server text-white text-sm'
                  aria-hidden='true'
                ></i>
              </div>
              <div>
                <h1 className='text-xl font-bold text-gray-900'>OpenManager</h1>
                <p className='text-xs text-gray-500'>AI 서버 모니터링</p>
              </div>
            </button>
          </div>

          <div className='flex items-center gap-4'>
            {/* 시스템 상태 표시 */}
            {systemStatusDisplay}

            {/* 실시간 시간 표시 */}
            <RealTimeDisplay />

            {/* 프로필 설정 표시 */}
            <ProfileSettingsDisplay />

            {/* 모바일용 간단한 통계 */}
            <div className='md:hidden flex items-center gap-2'>
              <div className='flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg'>
                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                <span className='text-xs text-gray-600'>
                  {serverStats.total}대
                </span>
              </div>
              {(serverStats.warning > 0 || serverStats.offline > 0) && (
                <div className='flex items-center gap-1 px-2 py-1 bg-red-50 rounded-lg'>
                  <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                  <span className='text-xs text-red-600'>
                    {serverStats.warning + serverStats.offline}
                  </span>
                </div>
              )}
            </div>

            {/* 빠른 통계 - 실시간 데이터 (데스크톱) */}
            <div
              className='hidden md:flex items-center gap-6'
              role='status'
              aria-label='서버 통계'
            >
              {/* 서버데이터 생성기 상태 표시 */}
              <div
                className='flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-lg'
                title='실제 서버데이터 생성기 연동'
              >
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                <span className='text-xs text-green-700 font-medium'>LIVE</span>
              </div>

              <div className='text-center'>
                <div className='text-sm font-medium text-gray-900'>
                  {serverStats.total}대
                </div>
                <div className='text-xs text-gray-500'>전체 서버</div>
              </div>
              <div className='text-center'>
                <div className='text-sm font-medium text-green-600'>
                  {serverStats.online}대
                </div>
                <div className='text-xs text-gray-500'>온라인</div>
              </div>
              {serverStats.warning > 0 && (
                <div className='text-center'>
                  <div className='text-sm font-medium text-orange-600'>
                    {serverStats.warning}대
                  </div>
                  <div className='text-xs text-gray-500'>경고</div>
                </div>
              )}
              {serverStats.offline > 0 && (
                <div className='text-center'>
                  <div className='text-sm font-medium text-red-600'>
                    {serverStats.offline}대
                  </div>
                  <div className='text-xs text-gray-500'>오프라인</div>
                </div>
              )}

              {/* 서버 상태 요약 */}
              <div className='text-center'>
                <div className='text-xs text-gray-500'>상태</div>
                <div className='text-xs font-medium'>
                  {serverStats.offline > 0 ? (
                    <span className='text-red-600'>위험</span>
                  ) : serverStats.warning > 0 ? (
                    <span className='text-orange-600'>주의</span>
                  ) : (
                    <span className='text-green-600'>정상</span>
                  )}
                </div>
              </div>
            </div>

            {/* AI 에이전트 토글 버튼 - 프로필 바로 왼쪽에 배치 */}
            <div className='relative'>
              <motion.button
                onClick={handleAIAgentToggle}
                className={`
                  relative p-3 rounded-xl transition-all duration-300 transform
                  ${
                    isSidebarOpen || aiAgent.isEnabled
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                  }
                `}
                title={isSidebarOpen ? 'AI 에이전트 닫기' : 'AI 에이전트 열기'}
                aria-label={
                  isSidebarOpen ? 'AI 에이전트 닫기' : 'AI 에이전트 열기'
                }
                aria-pressed={isSidebarOpen}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* AI 활성화 시 그라데이션 테두리 애니메이션 */}
                {aiAgent.isEnabled && (
                  <motion.div
                    className='absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 opacity-75'
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    style={{
                      background:
                        'conic-gradient(from 0deg, #a855f7, #ec4899, #06b6d4, #a855f7)',
                      padding: '2px',
                      borderRadius: '0.75rem',
                    }}
                  >
                    <div className='w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl' />
                  </motion.div>
                )}

                <div className='relative flex items-center gap-2'>
                  <motion.div
                    className={`w-5 h-5 ${isSidebarOpen || aiAgent.isEnabled ? 'text-white' : 'text-gray-600'}`}
                    animate={
                      aiAgent.isEnabled
                        ? {
                            rotate: [0, 360],
                            scale: [1, 1.2, 1],
                          }
                        : {}
                    }
                    transition={{
                      rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                      scale: {
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      },
                    }}
                  >
                    <Bot className='w-5 h-5' />
                  </motion.div>
                  <span className='hidden sm:inline text-sm font-medium'>
                    {aiAgent.isEnabled ? (
                      <motion.span
                        className='bg-gradient-to-r from-purple-100 via-pink-100 to-cyan-100 bg-clip-text text-transparent font-bold'
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        AI 에이전트
                      </motion.span>
                    ) : (
                      'AI 에이전트'
                    )}
                  </span>
                </div>

                {/* 활성화 상태 표시 */}
                {(isSidebarOpen || aiAgent.isEnabled) && (
                  <motion.div
                    className='absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white'
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.7, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    aria-hidden='true'
                  />
                )}
              </motion.button>

              {/* 손가락 아이콘 - AI 비활성화 시에만 표시, 모달이나 사이드바 열릴 때 숨김 */}
              {!aiAgent.isEnabled &&
                !isSidebarOpen &&
                !ui.isSettingsPanelOpen && (
                  <motion.div
                    className='finger-pointer-ai'
                    style={{
                      zIndex: isSidebarOpen || ui.isSettingsPanelOpen ? 10 : 45, // 사이드바나 설정 패널 열릴 때 z-index 낮춤
                    }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    👆
                  </motion.div>
                )}
            </div>

            {/* 프로필 컴포넌트 - 가장 오른쪽에 배치 */}
            <UnifiedProfileComponent userName='사용자' />
          </div>
        </div>
      </header>

      {/* 기존 VercelOptimizedAISidebar 제거 - 새로운 도메인 분리 아키텍처의 AISidebar가 dashboard/page.tsx에서 렌더링됨 */}
    </>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;
