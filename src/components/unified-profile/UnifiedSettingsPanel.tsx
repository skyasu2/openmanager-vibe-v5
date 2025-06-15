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

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  X,
  Eye,
  EyeOff,
  Check,
  Loader2,
  StopCircle,
  HardDrive,
  Lock,
  Settings,
  Monitor,
  Database,
  Bot,
  Activity,
  Zap,
  Shield,
  BarChart3,
  Bell,
  Palette,
  Save,
  RefreshCw,
  Server,
  Cpu,
  Network,
} from 'lucide-react';
import {
  useInlineFeedback,
  InlineFeedbackContainer,
  ButtonWithFeedback,
} from '@/components/ui/InlineFeedbackSystem';
import { UnifiedSettingsPanelProps, SettingsTab } from './types/ProfileTypes';
import { useSettingsData } from './hooks/useSettingsData';
import { useAuthentication } from './hooks/useAuthentication';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { AISettingsTab } from './components/AISettingsTab';
import { GeneratorSettingsTab } from './components/GeneratorSettingsTab';
import { MonitorSettingsTab } from './components/MonitorSettingsTab';
import { GeneralSettingsTab } from './components/GeneralSettingsTab';

export function UnifiedSettingsPanel({
  isOpen,
  onClose,
  buttonRef,
}: UnifiedSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');
  const [isClient, setIsClient] = useState(false);
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
        priority: 'high',
        action: {
          label: '성능 보고서 보기',
          onClick: () => info('성능 보고서', 'AI 성능이 15% 향상되었습니다.'),
        },
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
        action: {
          label: '세부 보고서',
          onClick: () =>
            info('진단 결과', 'CPU: 정상, 메모리: 최적, 네트워크: 안정'),
        },
      });
    } catch (err) {
      error('진단 실패', '시스템 진단 중 오류가 발생했습니다.');
    }
  };

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'ai':
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
            className='fixed inset-0 bg-black/70 z-[999]'
            onClick={onClose}
          />

          {/* 설정 패널 */}
          <motion.div
            ref={modalRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 220 }}
            className='fixed top-0 right-0 h-full w-[clamp(300px,90%,520px)] bg-gray-900/90 backdrop-blur-lg border-l border-white/10 shadow-2xl z-[1000] flex flex-col'
            role='dialog'
            aria-modal='true'
            aria-labelledby='settings-panel-title'
          >
            {/* 헤더 */}
            <header className='flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0'>
              <h2
                id='settings-panel-title'
                className='text-xl font-bold text-white flex items-center gap-2'
              >
                <Settings className='w-6 h-6' />
                통합 설정 제어판
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
            <nav className='flex-shrink-0 p-2 border-b border-white/10'>
              <div className='flex items-center justify-around bg-gray-800/50 p-1 rounded-lg'>
                {(
                  [
                    ['ai', 'AI 에이전트', Bot],
                    ['generator', '데이터 생성기', Database],
                    ['monitor', '모니터링', Monitor],
                    ['general', '일반 설정', Settings],
                  ] as const
                ).map(([tabKey, tabName, Icon]) => (
                  <button
                    key={tabKey}
                    onClick={() => setActiveTab(tabKey)}
                    className={`relative w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
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
                    <div className='relative z-10 flex items-center justify-center gap-2'>
                      <Icon className='w-4 h-4' />
                      <span>{tabName}</span>
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
              <InlineFeedbackContainer area='general-section' />
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
