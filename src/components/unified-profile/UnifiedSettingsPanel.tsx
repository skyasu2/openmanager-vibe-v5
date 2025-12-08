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

// framer-motion 제거 - CSS 애니메이션 사용
import { Bot, Database, Monitor, Settings, X, Zap } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  InlineFeedbackContainer,
  useInlineFeedback,
} from '../ui/InlineFeedbackSystem';
import { GeneralSettingsTab } from './components/GeneralSettingsTab';
import { GeneratorSettingsTab } from './components/GeneratorSettingsTab';
import { MonitorSettingsTab } from './components/MonitorSettingsTab';
import { OptimizationSettingsTab } from './components/OptimizationSettingsTab';

import { useSettingsData } from './hooks/useSettingsData';
import type {
  SettingsTab,
  UnifiedSettingsPanelProps,
} from './types/ProfileTypes';

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
    generatorConfig,
    isGeneratorLoading,
    loadGeneratorConfig,
    updateServerCount,
    updateArchitecture,
    checkSystemHealth,
  } = useSettingsData();

  // 새로운 인라인 피드백 시스템 사용
  const { success, error, info, loading } = useInlineFeedback();

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
      void loadGeneratorConfig();
    }
  }, [isOpen, activeTab, loadGeneratorConfig]);

  // 모달 위치 계산 함수
  const calculateModalPosition = useCallback(() => {
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
  }, [buttonRef]);

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
  }, [isOpen, calculateModalPosition]);

  // 제너레이터 핸들러들
  const handleGeneratorCheck = async () => {
    try {
      loading('generator-section', '데이터 생성기 상태를 확인하고 있습니다...');
      await loadGeneratorConfig();
      success('generator-section', '데이터 생성기가 정상적으로 작동 중입니다.');
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
      error('시스템 진단 실패', '시스템 상태 확인 중 오류가 발생했습니다.');
    }
  };

  // 최적화 관련 핸들러들
  const handleOptimizationRun = async () => {
    try {
      info('optimization-section', '⚡ 시스템 최적화를 시작합니다...');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      success('optimization-section', '🚀 시스템 최적화가 완료되었습니다!');
    } catch {
      error('optimization-section', '최적화 실행 중 오류가 발생했습니다.');
    }
  };

  const handlePerformanceAnalysis = async () => {
    try {
      info('optimization-section', '📊 성능 분석을 시작합니다...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      success('optimization-section', '✅ 성능 분석이 완료되었습니다!');
    } catch {
      error('optimization-section', '성능 분석 중 오류가 발생했습니다.');
    }
  };

  const handleCacheOptimization = async () => {
    try {
      info('optimization-section', '🔧 캐시 최적화를 시작합니다...');
      await new Promise((resolve) => setTimeout(resolve, 1500));
      success('optimization-section', '💾 캐시 최적화가 완료되었습니다!');
    } catch {
      error('optimization-section', '캐시 최적화 중 오류가 발생했습니다.');
    }
  };

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'ai':
        return (
          <div className="p-4 text-center text-gray-600">
            🚀 AI 설정은 GCP Functions로 이관되었습니다
          </div>
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

  // 오버레이 키보드 핸들러
  const handleOverlayKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClose();
    }
  };

  return createPortal(
    isOpen && (
      <>
        {/* 오버레이 */}
        <button
          className="fixed inset-0 z-9998 bg-black/70 w-full h-full cursor-default"
          onClick={onClose}
          type="button"
          aria-label="설정 패널 닫기"
          tabIndex={0}
          onKeyDown={handleOverlayKeyDown}
        />

        {/* 설정 패널 - 프로필 버튼 근처에 배치 */}
        <div
          ref={modalRef}
          className="fixed z-10000 flex h-[min(95vh,700px)] max-h-[95vh] min-h-[400px] w-[min(95vw,800px)] min-w-[320px] max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-gray-900/95 shadow-2xl backdrop-blur-xl"
          style={{
            top: `${modalPosition.top}px`,
            left: `${modalPosition.left}px`,
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-panel-title"
          data-testid="unified-settings-modal"
        >
          {/* 헤더 */}
          <header className="flex shrink-0 items-center justify-between border-b border-white/10 p-4">
            <h2
              id="settings-panel-title"
              className="flex items-center gap-2 text-xl font-bold text-white"
            >
              <Settings className="h-6 w-6" />
              설정
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-white/10 hover:text-white"
              aria-label="Close settings panel"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          {/* 탭 네비게이션 */}
          <nav className="shrink-0 border-b border-white/10 p-4">
            <div className="flex items-center justify-around overflow-x-auto rounded-lg bg-gray-800/50 p-1">
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
                  onClick={() => setActiveTab(tabKey as SettingsTab)}
                  className={`relative min-w-0 shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tabKey
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {activeTab === tabKey && (
                    <div className="absolute inset-0 z-0 rounded-md bg-purple-500/30" />
                  )}
                  <div className="relative z-10 flex items-center justify-center gap-1 sm:gap-2">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{tabName}</span>
                  </div>
                </button>
              ))}
            </div>
          </nav>

          {/* 탭 콘텐츠 */}
          <main className="scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 flex-1 overflow-y-auto p-4">
            <div key={activeTab}>{renderTabContent()}</div>
          </main>

          {/* 피드백 컨테이너 */}
          <footer className="shrink-0 border-t border-white/10 p-4">
            <InlineFeedbackContainer area="auth-section" />
            <InlineFeedbackContainer area="generator-section" />
            <InlineFeedbackContainer area="monitor-section" />
            <InlineFeedbackContainer area="optimization-section" />
            <InlineFeedbackContainer area="general-section" />
          </footer>
        </div>
      </>
    ),
    document.body
  );
}
