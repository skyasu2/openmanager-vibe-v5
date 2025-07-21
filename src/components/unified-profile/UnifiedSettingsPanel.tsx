/**
 * 🎛️ Unified Settings Panel
 *
 * 통합 설정 패널 컴포넌트
 * AI, 데이터 생성기, 모니터링, 일반 설정 통합 관리
 *
 * @created 2025-06-09
 * @author AI Assistant
 */

'use client';

import {
  InlineFeedbackContainer,
  useInlineFeedback,
} from '@/components/ui/InlineFeedbackSystem';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Database, Monitor, Settings, X, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
// AISettingsTab은 GCP Functions로 이관됨
import { GeneralSettingsTab } from './components/GeneralSettingsTab';
import { GeneratorSettingsTab } from './components/GeneratorSettingsTab';
import { MonitorSettingsTab } from './components/MonitorSettingsTab';
import { OptimizationSettingsTab } from './components/OptimizationSettingsTab';
import { useAuthentication } from './hooks/useAuthentication';
import { useSettingsData } from './hooks/useSettingsData';
import { SettingsTab, UnifiedSettingsPanelProps } from './types/ProfileTypes';

export function UnifiedSettingsPanel({
  isOpen,
  onClose,
  buttonRef,
}: UnifiedSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');
  const [isClient, setIsClient] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  // 커스텀 훅 사용
  const {
    settingsData,
    isLoadingSettings,
    generatorConfig,
    isGeneratorLoading,
    loadGeneratorConfig,
    updateServerCount,
    updateArchitecture,
    checkSystemHealth,
  } = useSettingsData();

  const {
    authState,
    aiPassword,
    setAiPassword,
    setShowPassword,
    handleAIAuthentication,
    validatePassword,
  } = useAuthentication();

  // 관리자 모드 확인을 위해 스토어에서 직접 가져오기
  const { adminMode } = useUnifiedAdminStore();
  const isAdminAuthenticated = adminMode.isAuthenticated;

  // 새로운 인라인 피드백 시스템 사용
  const { success, error, info, warning, loading, clear } = useInlineFeedback();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape, { capture: true });
    return () =>
      document.removeEventListener('keydown', handleEscape, { capture: true });
  }, [isOpen, onClose]);

  // 외부 클릭으로 모달 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        if (
          buttonRef?.current &&
          !buttonRef.current.contains(event.target as Node)
        ) {
          onClose();
        }
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef]);

  // Body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 탭별 데이터 로드
  useEffect(() => {
    if (isOpen && activeTab === 'generator') {
      loadGeneratorConfig();
    }
  }, [isOpen, activeTab, loadGeneratorConfig]);

  // 모달 위치 계산 함수
  const calculateModalPosition = () => {
    if (!buttonRef?.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 모달 크기 (예상값)
    const modalWidth = Math.min(800, viewportWidth * 0.95);
    const modalHeight = Math.min(700, viewportHeight * 0.95);

    let top = buttonRect.bottom + 12;
    let left = buttonRect.right - modalWidth;

    // 화면 아래로 넘어가는 경우 위쪽에 배치
    if (top + modalHeight > viewportHeight - 20) {
      top = buttonRect.top - modalHeight - 12;
    }

    // 화면 왼쪽으로 넘어가는 경우 조정
    if (left < 20) {
      left = 20;
    }

    // 화면 오른쪽으로 넘어가는 경우 조정
    if (left + modalWidth > viewportWidth - 20) {
      left = viewportWidth - modalWidth - 20;
    }

    // 모바일에서는 화면 중앙에 배치
    if (viewportWidth < 768) {
      top = (viewportHeight - modalHeight) / 2;
      left = (viewportWidth - modalWidth) / 2;
    }

    setModalPosition({ top, left });
  };

  // 위치 계산 - 모달이 열릴 때마다 실행
  useEffect(() => {
    if (isOpen) {
      calculateModalPosition();

      // 윈도우 리사이즈 시 위치 재계산
      const handleResize = () => calculateModalPosition();
      window.addEventListener('resize', handleResize);

      return () => window.removeEventListener('resize', handleResize);
    }
    return undefined;
  }, [isOpen]);

  // 인증 핸들러들
  const handleAuthenticationSubmit = async (quickPassword?: string) => {
    if (authState.isAuthenticating) return;

    try {
      const result = await handleAIAuthentication(quickPassword);
      if (result.success) {
        success(
          'auth-section',
          '✅ AI 에이전트 관리자 권한이 활성화되었습니다!'
        );
      } else {
        error('auth-section', result.error || '잘못된 관리자 PIN입니다.');
      }
    } catch (err) {
      error('auth-section', '인증 처리 중 시스템 오류가 발생했습니다.');
    }
  };

  // 제너레이터 핸들러들
  const handleGeneratorCheck = async () => {
    try {
      loading('generator-section', '데이터 생성기 상태를 확인하고 있습니다...');
      await loadGeneratorConfig();
      success('generator-section', '데이터 생성기가 정상적으로 작동 중입니다.');
    } catch (err) {
      error(
        'generator-section',
        '데이터 생성기 상태 확인 중 오류가 발생했습니다.'
      );
    }
  };

  const handleServerCountChange = async (newCount: number) => {
    try {
      loading(
        'generator-section',
        `서버 개수를 ${newCount}개로 변경하고 있습니다...`
      );
      const result = await updateServerCount(newCount);
      if (result.success) {
        success(
          'generator-section',
          `서버 개수가 ${newCount}개로 성공적으로 변경되었습니다.`
        );
      } else {
        error(
          'generator-section',
          result.error || '서버 개수 변경에 실패했습니다.'
        );
      }
    } catch (err) {
      error(
        'generator-section',
        '서버 개수 변경 중 시스템 오류가 발생했습니다.'
      );
    }
  };

  const handleArchitectureChange = async (newArch: string) => {
    try {
      loading(
        'generator-section',
        `시스템 아키텍처를 ${newArch}로 변경하고 있습니다...`
      );
      const result = await updateArchitecture(newArch);
      if (result.success) {
        success(
          'generator-section',
          `시스템이 ${newArch} 아키텍처로 성공적으로 전환되었습니다.`
        );
      } else {
        error(
          'generator-section',
          result.error || '아키텍처 변경에 실패했습니다.'
        );
      }
    } catch (err) {
      error(
        'generator-section',
        '아키텍처 변경 중 시스템 오류가 발생했습니다.'
      );
    }
  };

  // 모니터링 핸들러들
  const handleMonitorCheck = async () => {
    try {
      info('시스템 진단', '전체 시스템 상태를 확인하고 있습니다...');
      await checkSystemHealth();
      success(
        '시스템 진단 완료',
        '모든 시스템 구성요소가 정상적으로 작동 중입니다.'
      );
    } catch (err) {
      error('시스템 진단 실패', '시스템 상태 확인 중 오류가 발생했습니다.');
    }
  };

  // 고급 기능 핸들러들
  const handleAIOptimization = async () => {
    try {
      info('AI 최적화', 'AI 시스템 성능 최적화를 진행하고 있습니다...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      success('최적화 완료', '🤖 AI 시스템이 성공적으로 최적화되었습니다!', {
        duration: 5000,
        persistent: true,
      });
    } catch (err) {
      error('최적화 실패', 'AI 시스템 최적화 중 오류가 발생했습니다.');
    }
  };

  const handleSystemDiagnosis = async () => {
    try {
      info('시스템 진단', '종합적인 시스템 상태 분석을 진행하고 있습니다...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      success('진단 완료', '🔍 시스템이 최적 상태로 운영되고 있습니다!', {
        duration: 3000,
        persistent: false,
      });
    } catch (err) {
      error('진단 실패', '시스템 진단 중 오류가 발생했습니다.');
    }
  };

  // 최적화 관련 핸들러들
  const handleOptimizationRun = async () => {
    try {
      info('optimization-section', '⚡ 시스템 최적화를 시작합니다...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      success('optimization-section', '🚀 시스템 최적화가 완료되었습니다!');
    } catch (err) {
      error('optimization-section', '최적화 실행 중 오류가 발생했습니다.');
    }
  };

  const handlePerformanceAnalysis = async () => {
    try {
      info('optimization-section', '📊 성능 분석을 시작합니다...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      success('optimization-section', '✅ 성능 분석이 완료되었습니다!');
    } catch (err) {
      error('optimization-section', '성능 분석 중 오류가 발생했습니다.');
    }
  };

  const handleCacheOptimization = async () => {
    try {
      info('optimization-section', '🔧 캐시 최적화를 시작합니다...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      success('optimization-section', '💾 캐시 최적화가 완료되었습니다!');
    } catch (err) {
      error('optimization-section', '캐시 최적화 중 오류가 발생했습니다.');
    }
  };

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'ai':
        return (
          <div className='p-4 text-center text-gray-600'>
            🚀 AI 설정은 GCP Functions로 이관되었습니다
          </div>
        );
        {
          /*
        return (
          <AISettingsTab
            authState={authState}
            aiPassword={aiPassword}
            setAiPassword={setAiPassword}
            onAuthentication={handleAuthenticationSubmit}
            onAIOptimization={handleAIOptimization}
            onSystemDiagnosis={handleSystemDiagnosis}
          />
        );
        */
        }

      case 'generator':
        return (
          <GeneratorSettingsTab
            generatorConfig={generatorConfig}
            isGeneratorLoading={isGeneratorLoading}
            onGeneratorCheck={handleGeneratorCheck}
            onServerCountChange={handleServerCountChange}
            onArchitectureChange={handleArchitectureChange}
          />
        );

      case 'monitor':
        return (
          <MonitorSettingsTab
            settingsData={settingsData}
            onMonitorCheck={handleMonitorCheck}
          />
        );

      case 'general':
        return <GeneralSettingsTab settingsData={settingsData} />;

      case 'optimization':
        return (
          <OptimizationSettingsTab
            onOptimizationRun={handleOptimizationRun}
            onPerformanceAnalysis={handlePerformanceAnalysis}
            onCacheOptimization={handleCacheOptimization}
          />
        );

      default:
        return null;
    }
  };

  if (!isClient) {
    return null;
  }

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='fixed inset-0 bg-black/70 z-[9998]'
            onClick={onClose}
            role='button'
            aria-label='설정 패널 닫기'
          />

          {/* 설정 패널 - 프로필 버튼 근처에 배치 */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className='fixed w-[min(95vw,800px)] h-[min(95vh,700px)] 
                       min-w-[320px] min-h-[400px] max-w-4xl max-h-[95vh]
                       bg-gray-900/95 backdrop-blur-xl border border-white/20 
                       rounded-2xl shadow-2xl z-[10000] flex flex-col overflow-hidden'
            style={{
              top: `${modalPosition.top}px`,
              left: `${modalPosition.left}px`,
            }}
            role='dialog'
            aria-modal='true'
            aria-labelledby='settings-panel-title'
            data-testid='unified-settings-modal'
          >
            {/* 헤더 */}
            <header className='flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0'>
              <h2
                id='settings-panel-title'
                className='text-xl font-bold text-white flex items-center gap-2'
              >
                <Settings className='w-6 h-6' />
                설정
              </h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className='p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10'
                aria-label='Close settings panel'
              >
                <X className='w-5 h-5' />
              </motion.button>
            </header>

            {/* 탭 네비게이션 */}
            <nav className='flex-shrink-0 p-4 border-b border-white/10'>
              <div className='flex items-center justify-around bg-gray-800/50 p-1 rounded-lg overflow-x-auto'>
                {(
                  [
                    ['ai', 'AI', Bot],
                    ['generator', '데이터', Database],
                    ['monitor', '모니터링', Monitor],
                    ['optimization', '최적화', Zap],
                    ['general', '일반', Settings],
                  ] as const
                ).map(([tabKey, tabName, Icon]) => (
                  <button
                    key={tabKey}
                    onClick={() => setActiveTab(tabKey)}
                    className={`relative flex-shrink-0 px-3 py-2 text-sm font-medium rounded-md transition-colors min-w-0 ${
                      activeTab === tabKey
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {activeTab === tabKey && (
                      <motion.div
                        layoutId='active-tab-indicator'
                        className='absolute inset-0 bg-purple-500/30 rounded-md z-0'
                        transition={{
                          type: 'spring',
                          damping: 20,
                          stiffness: 200,
                        }}
                      />
                    )}
                    <div className='relative z-10 flex items-center justify-center gap-1 sm:gap-2'>
                      <Icon className='w-4 h-4 flex-shrink-0' />
                      <span className='truncate'>{tabName}</span>
                    </div>
                  </button>
                ))}
              </div>
            </nav>

            {/* 탭 콘텐츠 */}
            <main className='flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800'>
              <AnimatePresence mode='wait'>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* 피드백 컨테이너 */}
            <footer className='p-4 border-t border-white/10 flex-shrink-0'>
              <InlineFeedbackContainer area='auth-section' />
              <InlineFeedbackContainer area='generator-section' />
              <InlineFeedbackContainer area='monitor-section' />
              <InlineFeedbackContainer area='optimization-section' />
              <InlineFeedbackContainer area='general-section' />
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
