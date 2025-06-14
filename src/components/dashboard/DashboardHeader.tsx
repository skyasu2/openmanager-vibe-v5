'use client';

import { memo, Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Clock,
  Settings,
  Server,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
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
 * 헤더 정보 패널 접기/펼치기 상태 관리
 */
const useHeaderCollapse = () => {
  const [isCollapsed, setIsCollapsed] = useState(true); // 기본적으로 접힌 상태

  useEffect(() => {
    // 로컬 스토리지에서 접힘 상태 로드
    const savedCollapsed = localStorage.getItem('dashboard-header-collapsed');
    if (savedCollapsed !== null) {
      setIsCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem(
      'dashboard-header-collapsed',
      JSON.stringify(newCollapsed)
    );
  };

  return { isCollapsed, toggleCollapse };
};

/**
 * 간단한 요약 정보 컴포넌트 (접힌 상태)
 */
const HeaderSummary = memo(function HeaderSummary({
  serverStats,
  onToggle,
}: {
  serverStats: ServerStats;
  onToggle: () => void;
}) {
  const currentTime = new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className='flex items-center justify-between w-full px-4 py-2 bg-gray-50 border-b border-gray-200'>
      <div className='flex items-center gap-4 text-sm text-gray-600'>
        <span>서버 상태: {serverStats.online > 0 ? '정상' : '점검중'}</span>
        <span>
          온라인: {serverStats.online}/{serverStats.total}
        </span>
        <span>시간: {currentTime}</span>
      </div>
      <button
        onClick={onToggle}
        className='flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors'
        title='상세 정보 보기'
      >
        <ChevronDown className='w-4 h-4' />
        더보기
      </button>
    </div>
  );
});

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
  const { isCollapsed, toggleCollapse } = useHeaderCollapse();

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
        {/* 접힌 상태: 간단한 요약 정보만 표시 */}
        {isCollapsed && (
          <HeaderSummary serverStats={serverStats} onToggle={toggleCollapse} />
        )}

        {/* 펼친 상태: 상세 정보 표시 */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className='overflow-hidden'
            >
              <div className='px-4 py-2 bg-gray-50 border-b border-gray-200'>
                <div className='flex items-center justify-between mb-2'>
                  <h3 className='text-sm font-medium text-gray-700'>
                    시스템 상세 정보
                  </h3>
                  <button
                    onClick={toggleCollapse}
                    className='flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors'
                    title='상세 정보 숨기기'
                  >
                    <ChevronUp className='w-4 h-4' />
                    접기
                  </button>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  {/* 시스템 상태 */}
                  <div className='space-y-2'>{systemStatusDisplay}</div>

                  {/* 실시간 정보 */}
                  <div className='space-y-2'>
                    <RealTimeDisplay />
                  </div>

                  {/* 프로필 설정 */}
                  <div className='space-y-2'>
                    <ProfileSettingsDisplay />
                  </div>
                </div>

                {/* 상세 서버 통계 */}
                <div className='mt-4 pt-4 border-t border-gray-200'>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    <div className='text-center p-2 bg-white rounded border'>
                      <div className='text-lg font-bold text-gray-900'>
                        {serverStats.total}
                      </div>
                      <div className='text-xs text-gray-500'>전체 서버</div>
                    </div>
                    <div className='text-center p-2 bg-green-50 rounded border border-green-200'>
                      <div className='text-lg font-bold text-green-600'>
                        {serverStats.online}
                      </div>
                      <div className='text-xs text-green-600'>온라인</div>
                    </div>
                    {serverStats.warning > 0 && (
                      <div className='text-center p-2 bg-orange-50 rounded border border-orange-200'>
                        <div className='text-lg font-bold text-orange-600'>
                          {serverStats.warning}
                        </div>
                        <div className='text-xs text-orange-600'>경고</div>
                      </div>
                    )}
                    {serverStats.offline > 0 && (
                      <div className='text-center p-2 bg-red-50 rounded border border-red-200'>
                        <div className='text-lg font-bold text-red-600'>
                          {serverStats.offline}
                        </div>
                        <div className='text-xs text-red-600'>오프라인</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 메인 헤더 (항상 표시) */}
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
            {/* AI 에이전트 토글 버튼 */}
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
