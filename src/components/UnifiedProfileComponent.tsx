'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  User,
  Bot,
  Monitor,
  AlertTriangle,
  Power,
  Settings,
  LogOut,
  ChevronDown,
  Database,
  X,
  Eye,
  EyeOff,
  Check,
  Loader2,
  Shield,
  StopCircle,
  HardDrive,
  Lock,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useToast } from '@/components/ui/ToastNotification';

interface UnifiedProfileComponentProps {
  userName?: string;
  userAvatar?: string;
}

// 🔓 개발 환경 설정 (로컬 개발에서는 항상 우회 허용)
const DEVELOPMENT_MODE =
  process.env.NODE_ENV === 'development' || typeof window !== 'undefined';
const BYPASS_PASSWORD = true; // 항상 비밀번호 우회 허용

// 통합 설정 패널 컴포넌트
const UnifiedSettingsPanel = ({
  isOpen,
  onClose,
  buttonRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}) => {
  const [activeTab, setActiveTab] = useState<
    'ai' | 'generator' | 'monitor' | 'general'
  >('ai');
  const [aiPassword, setAiPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // 설정 값들을 상시 표시하기 위한 상태 추가
  const [settingsData, setSettingsData] = useState({
    metrics: { interval: 5, realistic: false },
    scenarios: { active: 0, total: 0 },
    thresholds: { cpu: 80, memory: 85, disk: 90 },
    dashboard: { layout: 'grid', widgets: 0 },
    notifications: { slack: false, email: false, webhook: false },
    backup: { lastBackup: '없음', autoBackup: false },
    theme: 'dark',
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const {
    aiAgent,
    isSystemStarted,
    authenticateAIAgent,
    disableAIAgent,
    attempts,
    isLocked,
    getRemainingLockTime,
  } = useUnifiedAdminStore();

  const { success, error, info, warning } = useToast();

  // 모든 설정 값을 자동으로 로드하는 함수
  const loadAllSettings = async () => {
    setIsLoadingSettings(true);
    try {
      // 모든 설정을 병렬로 로드
      const [
        metricsRes,
        scenariosRes,
        thresholdsRes,
        dashboardRes,
        notificationRes,
        backupRes,
      ] = await Promise.allSettled([
        fetch('/api/admin/metrics-config'),
        fetch('/api/admin/scenarios'),
        fetch('/api/admin/thresholds'),
        fetch('/api/admin/dashboard-config'),
        fetch('/api/admin/notification-config'),
        fetch('/api/admin/backup-status'),
      ]);

      const newSettings = { ...settingsData };

      if (metricsRes.status === 'fulfilled') {
        const metrics = await metricsRes.value.json();
        newSettings.metrics = {
          interval: metrics.interval || 5,
          realistic: metrics.realistic || false,
        };
      }

      if (scenariosRes.status === 'fulfilled') {
        const scenarios = await scenariosRes.value.json();
        newSettings.scenarios = {
          active: scenarios.active || 0,
          total: scenarios.total || 0,
        };
      }

      if (thresholdsRes.status === 'fulfilled') {
        const thresholds = await thresholdsRes.value.json();
        newSettings.thresholds = {
          cpu: thresholds.cpu || 80,
          memory: thresholds.memory || 85,
          disk: thresholds.disk || 90,
        };
      }

      if (dashboardRes.status === 'fulfilled') {
        const dashboard = await dashboardRes.value.json();
        newSettings.dashboard = {
          layout: dashboard.layout || 'grid',
          widgets: dashboard.widgets || 0,
        };
      }

      if (notificationRes.status === 'fulfilled') {
        const notification = await notificationRes.value.json();
        newSettings.notifications = {
          slack: notification.slack || false,
          email: notification.email || false,
          webhook: notification.webhook || false,
        };
      }

      if (backupRes.status === 'fulfilled') {
        const backup = await backupRes.value.json();
        newSettings.backup = {
          lastBackup: backup.lastBackup || '없음',
          autoBackup: backup.autoBackup || false,
        };
      }

      // 테마 정보는 localStorage에서 로드
      newSettings.theme = localStorage.getItem('theme') || 'dark';

      setSettingsData(newSettings);
    } catch (error) {
      console.log('설정 로드 실패:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

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
      // 모달 영역 밖 클릭 시에만 닫기
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        // 드롭다운 버튼 클릭이 아닌 경우에만 닫기
        if (
          buttonRef?.current &&
          !buttonRef.current.contains(event.target as Node)
        ) {
          onClose();
        }
      }
    };

    // 약간의 지연을 두어 드롭다운 버튼 클릭과 충돌 방지
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

  // 모달이 열릴 때 설정 자동 로드
  useEffect(() => {
    if (isOpen) {
      loadAllSettings();
      if (activeTab === 'generator') {
        loadGeneratorConfig();
      }
    }
  }, [isOpen, activeTab]);

  // AI 에이전트 인증 처리
  const handleAIAuthentication = async () => {
    if (!aiPassword.trim()) {
      warning('비밀번호를 입력해주세요.');
      return;
    }

    if (isAuthenticating) return; // 중복 클릭 방지

    setIsAuthenticating(true);

    try {
      // 약간의 지연으로 UI 안정화
      await new Promise(resolve => setTimeout(resolve, 100));

      // 실제 인증 처리
      const result = await authenticateAIAgent(aiPassword);

      if (result.success) {
        // 성공 시 순차적 상태 업데이트
        setAiPassword('');
        await new Promise(resolve => setTimeout(resolve, 50));

        success('🤖 AI 에이전트 모드가 활성화되었습니다!');

        // 탭 전환을 지연시켜 안정화
        setTimeout(() => {
          setActiveTab('general');
        }, 200);
      } else {
        error(result.message);
        if (isLocked) {
          const remainingTime = getRemainingLockTime();
          error(
            `계정이 잠겼습니다. ${Math.ceil(remainingTime / 1000)}초 후 다시 시도하세요.`
          );
        }
      }
    } catch (err: any) {
      error('인증 처리 중 오류가 발생했습니다.');
      console.error('AI 인증 오류:', err);
    } finally {
      // 로딩 상태 해제를 지연시켜 버튼 깜빡임 방지
      setTimeout(() => {
        setIsAuthenticating(false);
      }, 300);
    }
  };

  // AI 에이전트 비활성화
  const handleAIDisable = () => {
    try {
      disableAIAgent();
      success('AI 에이전트가 비활성화되었습니다.');

      // 탭 전환을 지연시켜 안정화
      setTimeout(() => {
        setActiveTab('general');
      }, 200);
    } catch (err: any) {
      error('AI 에이전트 비활성화 중 오류가 발생했습니다.');
      console.error('AI 비활성화 오류:', err);
    }
  };

  // 서버 데이터 생성기 설정 상태
  const [generatorConfig, setGeneratorConfig] = useState<any>(null);
  const [isGeneratorLoading, setIsGeneratorLoading] = useState(false);

  // 서버 데이터 생성기 설정 로드
  const loadGeneratorConfig = async () => {
    try {
      setIsGeneratorLoading(true);
      const response = await fetch('/api/admin/generator-config');
      if (response.ok) {
        const data = await response.json();
        setGeneratorConfig(data.data);
      }
    } catch (error) {
      console.error('생성기 설정 로드 실패:', error);
    } finally {
      setIsGeneratorLoading(false);
    }
  };

  // 서버 데이터 생성기 상태 확인
  const handleGeneratorCheck = async () => {
    try {
      info('서버 데이터 생성기 설정을 확인하고 있습니다...');
      await loadGeneratorConfig();
      success('서버 데이터 생성기 설정을 성공적으로 로드했습니다.');
    } catch (err: any) {
      error(
        `서버 데이터 생성기 설정 로드에 실패했습니다: ${err.message || '알 수 없는 오류'}`
      );
      console.error('🔍 Generator Check Error:', err);
    }
  };

  // 서버 수 조절
  const handleServerCountChange = async (newCount: number) => {
    try {
      setIsGeneratorLoading(true);
      info(`서버 수를 ${newCount}개로 변경하고 있습니다...`);

      const response = await fetch('/api/admin/generator-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxServers: newCount }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratorConfig(data.data);
        success(`서버 수가 ${newCount}개로 성공적으로 변경되었습니다.`);
      } else {
        const errorData = await response.json();
        error(errorData.error || '서버 수 변경에 실패했습니다.');
      }
    } catch (error) {
      error('서버 수 변경 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratorLoading(false);
    }
  };

  // 서버 아키텍처 변경
  const handleArchitectureChange = async (newArch: string) => {
    try {
      setIsGeneratorLoading(true);
      info(`서버 아키텍처를 ${newArch}로 변경하고 있습니다...`);

      const response = await fetch('/api/admin/generator-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultArchitecture: newArch }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratorConfig(data.data);
        success(`서버 아키텍처가 ${newArch}로 성공적으로 변경되었습니다.`);
      } else {
        const errorData = await response.json();
        error(errorData.error || '서버 아키텍처 변경에 실패했습니다.');
      }
    } catch (error) {
      error('서버 아키텍처 변경 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratorLoading(false);
    }
  };

  // 서버 모니터링 상태 확인
  const handleMonitorCheck = async () => {
    try {
      info('서버 모니터링 시스템을 확인하고 있습니다...');

      // 🛡️ API 호출 시간 제한 설정
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 제한

      const response = await fetch('/api/health', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        success(
          `서버 모니터링 시스템이 정상 동작중입니다. ${data?.uptime ? `(업타임: ${data.uptime})` : ''}`
        );
      } else if (response.status === 404) {
        warning('서버 모니터링 엔드포인트를 찾을 수 없습니다.');
      } else {
        const errorData = await response.json().catch(() => null);
        warning(
          `서버 모니터링 상태 확인에 실패했습니다. (${response.status}${errorData?.message ? `: ${errorData.message}` : ''})`
        );
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        error('서버 모니터링 상태 확인이 시간 초과되었습니다.');
      } else if (err.code === 'ENOTFOUND' || err.message?.includes('fetch')) {
        error('네트워크 연결을 확인해주세요.');
      } else {
        error(
          `서버 모니터링 시스템 연결에 실패했습니다: ${err.message || '알 수 없는 오류'}`
        );
      }
      console.error('🔍 Monitor Check Error:', err);
    }
  };

  // 메트릭 생성 설정 처리
  const handleMetricsConfig = async () => {
    try {
      success('메트릭 생성 설정을 확인합니다...');

      // 메트릭 설정 API 호출
      const response = await fetch('/api/admin/metrics-config');
      const config = await response.json();

      info(
        `현재 메트릭 설정: 간격 ${config.interval || 5}초, 패턴 ${config.realistic ? '현실적' : '기본'}`
      );
    } catch (err: any) {
      error('메트릭 설정 확인 실패');
    }
  };

  // 시나리오 관리 처리
  const handleScenarioManager = async () => {
    try {
      success('시나리오 관리자를 실행합니다...');

      // 시나리오 목록 조회
      const response = await fetch('/api/admin/scenarios');
      const scenarios = await response.json();

      info(
        `현재 시나리오: ${scenarios.active || 0}개 활성, ${scenarios.total || 0}개 총`
      );
    } catch (err: any) {
      error('시나리오 관리 실패');
    }
  };

  // 알림 임계값 설정 처리
  const handleThresholdConfig = async () => {
    try {
      success('알림 임계값 설정을 확인합니다...');

      // 임계값 설정 조회
      const response = await fetch('/api/admin/thresholds');
      const thresholds = await response.json();

      info(
        `현재 임계값: CPU ${thresholds.cpu || 80}%, 메모리 ${thresholds.memory || 85}%, 디스크 ${thresholds.disk || 90}%`
      );
    } catch (err: any) {
      error('임계값 설정 확인 실패');
    }
  };

  // 대시보드 커스터마이징 처리
  const handleDashboardCustomize = async () => {
    try {
      success('대시보드 설정을 확인합니다...');

      // 대시보드 설정 조회
      const response = await fetch('/api/admin/dashboard-config');
      const config = await response.json();

      info(
        `현재 대시보드: ${config.layout || 'grid'} 레이아웃, ${config.widgets || 0}개 위젯`
      );
    } catch (err: any) {
      error('대시보드 설정 확인 실패');
    }
  };

  // 알림 설정 처리
  const handleNotificationConfig = async () => {
    try {
      success('알림 설정을 확인합니다...');

      // 알림 설정 조회
      const response = await fetch('/api/admin/notification-config');
      const config = await response.json();

      info(
        `알림 설정: ${config.slack ? '슬랙 ' : ''}${config.email ? '이메일 ' : ''}${config.webhook ? '웹훅 ' : ''}활성화됨`
      );
    } catch (err: any) {
      error('알림 설정 확인 실패');
    }
  };

  // 테마 설정 처리
  const handleThemeConfig = async () => {
    try {
      success('테마 설정을 변경합니다...');

      // 현재 테마 토글 (다크 ↔ 라이트)
      const currentTheme = localStorage.getItem('theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);

      success(
        `테마가 ${newTheme === 'dark' ? '다크' : '라이트'} 모드로 변경되었습니다!`
      );
    } catch (err: any) {
      error('테마 설정 변경 실패');
    }
  };

  // 백업 설정 처리
  const handleBackupConfig = async () => {
    try {
      success('백업 설정을 확인합니다...');

      // 백업 상태 조회
      const response = await fetch('/api/admin/backup-status');
      const status = await response.json();

      info(
        `백업 상태: 마지막 백업 ${status.lastBackup || '없음'}, 자동 백업 ${status.autoBackup ? '활성' : '비활성'}`
      );
    } catch (err: any) {
      error('백업 설정 확인 실패');
    }
  };

  if (!isOpen) return null;

  // Portal을 사용하여 모달을 body에 직접 렌더링
  return createPortal(
    <div
      className='fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4'
      role='dialog'
      aria-modal='true'
      aria-labelledby='settings-modal-title'
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className='w-full max-w-2xl bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden relative'
        style={{ zIndex: 100000 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className='p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center'>
                <Settings className='w-6 h-6 text-white' />
              </div>
              <div>
                <h2
                  id='settings-modal-title'
                  className='text-xl font-bold text-white'
                >
                  시스템 설정
                </h2>
                <p className='text-gray-400'>
                  AI 모드, 데이터 생성기, 모니터링 제어
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className='p-2 hover:bg-gray-700/50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500'
              aria-label='설정 창 닫기'
            >
              <X className='w-5 h-5 text-gray-400' />
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className='flex border-b border-gray-700/50'>
          {[
            { id: 'ai', label: 'AI 모드', icon: Bot },
            { id: 'generator', label: '데이터 생성기', icon: Database },
            { id: 'monitor', label: '모니터링', icon: Monitor },
            { id: 'general', label: '일반 설정', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              role='tab'
              aria-selected={activeTab === tab.id}
              aria-controls={`tab-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 p-4 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-300 border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
              }`}
            >
              <tab.icon className='w-4 h-4' />
              <span className='text-sm font-medium'>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className='p-6 max-h-[70vh] overflow-y-auto'>
          {/* AI 모드 탭 */}
          {activeTab === 'ai' && (
            <div
              id='tab-panel-ai'
              role='tabpanel'
              aria-labelledby='tab-ai'
              className='space-y-6'
            >
              <div className='text-center'>
                <div
                  className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    aiAgent.isEnabled
                      ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                      : 'bg-gray-600'
                  }`}
                >
                  <Bot className='w-8 h-8 text-white' />
                </div>
                <h3 className='text-lg font-bold text-white mb-2'>
                  AI 에이전트 모드
                </h3>
                <p className='text-gray-400 text-sm mb-4'>
                  {aiAgent.isEnabled
                    ? 'AI 에이전트가 활성화되어 고급 분석 기능을 사용할 수 있습니다.'
                    : 'AI 에이전트를 활성화하여 지능형 서버 분석 기능을 사용하세요.'}
                </p>
              </div>

              {!aiAgent.isEnabled ? (
                // AI 활성화 폼
                <div className='space-y-4'>
                  {/* 개발 모드 빠른 활성화 */}
                  {BYPASS_PASSWORD && (
                    <div className='p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Shield className='w-4 h-4 text-yellow-400' />
                        <span className='text-yellow-300 text-sm font-medium'>
                          개발 모드 활성화됨
                        </span>
                      </div>
                      <button
                        onClick={() => handleAIAuthentication()}
                        disabled={isAuthenticating}
                        className='w-full p-2 bg-yellow-500/30 border border-yellow-500/50 text-yellow-200 rounded hover:bg-yellow-500/40 transition-colors text-sm'
                      >
                        {isAuthenticating ? (
                          <div className='flex items-center justify-center gap-2'>
                            <Loader2 className='w-3 h-3 animate-spin' />
                            <span>활성화 중...</span>
                          </div>
                        ) : (
                          '🚀 즉시 활성화 (비밀번호 우회)'
                        )}
                      </button>
                    </div>
                  )}

                  {/* 일반 비밀번호 입력 */}
                  <div className='relative'>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={aiPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setAiPassword(e.target.value)
                      }
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAIAuthentication();
                        }
                      }}
                      placeholder={
                        BYPASS_PASSWORD
                          ? 'AI 에이전트 인증 비밀번호 (선택사항)'
                          : 'AI 에이전트 인증 비밀번호'
                      }
                      disabled={isLocked || isAuthenticating}
                      className='w-full p-3 pr-12 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none'
                      disabled={isLocked || isAuthenticating}
                    >
                      {showPassword ? (
                        <EyeOff className='w-4 h-4' />
                      ) : (
                        <Eye className='w-4 h-4' />
                      )}
                    </button>
                  </div>

                  {attempts > 0 && !isLocked && (
                    <p className='text-orange-400 text-sm'>
                      인증 실패: {attempts}/5 시도
                    </p>
                  )}

                  {isLocked && (
                    <div className='p-3 bg-red-500/20 border border-red-500/50 rounded-lg'>
                      <p className='text-red-300 text-sm'>
                        5번의 실패로 인해 계정이 잠겼습니다. 잠시 후 다시
                        시도하세요.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleAIAuthentication}
                    disabled={isLocked || isAuthenticating}
                    className='w-full p-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900'
                  >
                    {isAuthenticating ? (
                      <div className='flex items-center justify-center gap-2'>
                        <Loader2 className='w-4 h-4 animate-spin' />
                        <span>인증 중...</span>
                      </div>
                    ) : (
                      '🤖 AI 에이전트 활성화'
                    )}
                  </button>

                  {/* AI 독립 모드 지원 - 시스템 시작 불필요 */}
                  <p className='text-blue-400 text-sm text-center'>
                    💡 AI 에이전트는 시스템과 독립적으로 실행됩니다
                    {BYPASS_PASSWORD && (
                      <span className='block text-yellow-400 mt-1'>
                        🔧 개발 모드: 비밀번호 우회 가능
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                // AI 비활성화 버튼
                <div className='space-y-4'>
                  <div className='p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg'>
                    <div className='flex items-center gap-3 mb-2'>
                      <Check className='w-5 h-5 text-green-400' />
                      <span className='text-white font-medium'>
                        AI 에이전트 활성화됨
                      </span>
                    </div>
                    <p className='text-purple-200 text-sm'>
                      지능형 서버 분석, 예측 모니터링, 고도화된 알림 시스템을
                      사용할 수 있습니다.
                    </p>
                  </div>

                  <button
                    onClick={handleAIDisable}
                    className='w-full p-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg font-medium hover:bg-red-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900'
                  >
                    AI 에이전트 비활성화
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 데이터 생성기 탭 */}
          {activeTab === 'generator' && (
            <div
              id='tab-panel-generator'
              role='tabpanel'
              aria-labelledby='tab-generator'
              className='space-y-6'
            >
              <div className='text-center'>
                <div className='w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4'>
                  <Database className='w-8 h-8 text-white' />
                </div>
                <h3 className='text-lg font-bold text-white mb-2'>
                  서버 데이터 생성기
                </h3>
                <p className='text-gray-400 text-sm mb-4'>
                  실시간 메트릭 시뮬레이션 및 테스트 데이터를 생성합니다.
                </p>
              </div>

              {/* 환경별 서버 수 조절 섹션 */}
              {generatorConfig && (
                <div className='bg-gray-800/50 border border-gray-600/50 rounded-lg p-4 space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h4 className='text-white font-medium flex items-center gap-2'>
                      <Settings className='w-4 h-4 text-cyan-400' />
                      환경별 서버 수 조절
                    </h4>
                    <div className='text-xs px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded'>
                      {generatorConfig.environment.isVercel ? 'Vercel' : '로컬'}{' '}
                      환경
                    </div>
                  </div>

                  {/* 현재 설정 표시 */}
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div className='space-y-2'>
                      <div className='text-gray-400'>현재 서버 수</div>
                      <div className='text-2xl font-bold text-cyan-400'>
                        {generatorConfig.maxServers}개
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <div className='text-gray-400'>서버 아키텍처</div>
                      <div className='text-sm font-medium text-white'>
                        {generatorConfig.defaultArchitecture === 'single' &&
                          '🔧 단일 서버'}
                        {generatorConfig.defaultArchitecture ===
                          'master-slave' && '🔗 마스터-슬레이브'}
                        {generatorConfig.defaultArchitecture ===
                          'load-balanced' && '⚖️ 로드밸런싱'}
                        {generatorConfig.defaultArchitecture ===
                          'microservices' && '🏗️ 마이크로서비스'}
                      </div>
                    </div>
                  </div>

                  {/* 서버 수 조절 슬라이더 */}
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-400'>서버 수 조절</span>
                      <span className='text-cyan-400'>
                        {generatorConfig.maxServers}개
                      </span>
                    </div>
                    <input
                      type='range'
                      min='1'
                      max={generatorConfig.environment.isVercel ? '50' : '100'}
                      value={generatorConfig.maxServers}
                      onChange={e =>
                        handleServerCountChange(Number(e.target.value))
                      }
                      disabled={isGeneratorLoading}
                      className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider'
                    />
                    <div className='flex justify-between text-xs text-gray-500'>
                      <span>1개</span>
                      <span className='text-yellow-400'>
                        권장:{' '}
                        {generatorConfig.environment.isVercel
                          ? '8-16개'
                          : '16-30개'}
                      </span>
                      <span>
                        {generatorConfig.environment.isVercel
                          ? '50개'
                          : '100개'}
                      </span>
                    </div>
                  </div>

                  {/* 아키텍처 선택 */}
                  <div className='space-y-2'>
                    <div className='text-sm text-gray-400'>서버 아키텍처</div>
                    <div className='grid grid-cols-2 gap-2'>
                      {[
                        {
                          key: 'single',
                          label: '단일 서버',
                          icon: '🔧',
                          desc: '1개 서버',
                        },
                        {
                          key: 'master-slave',
                          label: '마스터-슬레이브',
                          icon: '🔗',
                          desc: '6개 서버',
                        },
                        {
                          key: 'load-balanced',
                          label: '로드밸런싱',
                          icon: '⚖️',
                          desc: '15-25개 서버',
                        },
                        {
                          key: 'microservices',
                          label: '마이크로서비스',
                          icon: '🏗️',
                          desc: '20-30개 서버',
                        },
                      ].map(arch => (
                        <button
                          key={arch.key}
                          onClick={() => handleArchitectureChange(arch.key)}
                          disabled={isGeneratorLoading}
                          className={`p-2 rounded-lg text-xs transition-colors ${
                            generatorConfig.defaultArchitecture === arch.key
                              ? 'bg-cyan-500/30 border border-cyan-500/50 text-cyan-300'
                              : 'bg-gray-700/50 border border-gray-600/50 text-gray-400 hover:bg-gray-600/50'
                          }`}
                        >
                          <div className='font-medium'>
                            {arch.icon} {arch.label}
                          </div>
                          <div className='text-gray-500'>{arch.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-3'>
                  <button
                    onClick={handleGeneratorCheck}
                    disabled={isGeneratorLoading}
                    className='p-3 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm disabled:opacity-50'
                  >
                    {isGeneratorLoading ? '🔄 로딩 중...' : '🔍 설정 확인'}
                  </button>
                  <button
                    onClick={handleMetricsConfig}
                    className='p-3 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm'
                  >
                    ⚙️ 메트릭 설정
                  </button>
                </div>

                {/* 메트릭 설정 정보 카드 */}
                <div className='w-full p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg'>
                  <div className='flex items-center justify-between mb-2'>
                    <h4 className='text-white font-medium'>메트릭 생성 설정</h4>
                    {isLoadingSettings ? (
                      <div className='w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin'></div>
                    ) : (
                      <div className='text-blue-300 text-xs bg-blue-500/20 px-2 py-1 rounded'>
                        실시간
                      </div>
                    )}
                  </div>
                  <p className='text-blue-200 text-sm mb-3'>
                    CPU, 메모리, 네트워크 등의 메트릭 생성 패턴 설정
                  </p>
                  <div className='space-y-1 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-300'>생성 간격:</span>
                      <span className='text-blue-200'>
                        {settingsData.metrics.interval}초
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-300'>패턴 모드:</span>
                      <span className='text-blue-200'>
                        {settingsData.metrics.realistic ? '현실적' : '기본'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 시나리오 관리 정보 카드 */}
                <div className='w-full p-4 bg-cyan-500/20 border border-cyan-500/30 rounded-lg'>
                  <div className='flex items-center justify-between mb-2'>
                    <h4 className='text-white font-medium'>시나리오 관리</h4>
                    {isLoadingSettings ? (
                      <div className='w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin'></div>
                    ) : (
                      <div className='text-cyan-300 text-xs bg-cyan-500/20 px-2 py-1 rounded'>
                        활성
                      </div>
                    )}
                  </div>
                  <p className='text-cyan-200 text-sm mb-3'>
                    서버 장애 및 이벤트 시나리오 시뮬레이션 관리
                  </p>
                  <div className='space-y-1 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-300'>활성 시나리오:</span>
                      <span className='text-cyan-200'>
                        {settingsData.scenarios.active}개
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-300'>전체 시나리오:</span>
                      <span className='text-cyan-200'>
                        {settingsData.scenarios.total}개
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 모니터링 탭 */}
          {activeTab === 'monitor' && (
            <div
              id='tab-panel-monitor'
              role='tabpanel'
              aria-labelledby='tab-monitor'
              className='space-y-6'
            >
              <div className='text-center'>
                <div className='w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4'>
                  <Monitor className='w-8 h-8 text-white' />
                </div>
                <h3 className='text-lg font-bold text-white mb-2'>
                  서버 모니터링
                </h3>
                <p className='text-gray-400 text-sm mb-4'>
                  실시간 서버 상태 모니터링 및 알림 시스템을 관리합니다.
                </p>
              </div>

              <div className='space-y-4'>
                {/* 알림 임계값 설정 카드 */}
                <div className='w-full p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg'>
                  <div className='flex items-center justify-between mb-2'>
                    <h4 className='text-white font-medium'>알림 임계값 설정</h4>
                    {isLoadingSettings ? (
                      <div className='w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin'></div>
                    ) : (
                      <div className='text-yellow-300 text-xs bg-yellow-500/20 px-2 py-1 rounded'>
                        구성됨
                      </div>
                    )}
                  </div>
                  <p className='text-yellow-200 text-sm mb-3'>
                    CPU, 메모리, 디스크 사용률 등의 알림 임계값 설정
                  </p>
                  <div className='space-y-1 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-300'>CPU 임계값:</span>
                      <span className='text-yellow-200'>
                        {settingsData.thresholds.cpu}%
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-300'>메모리 임계값:</span>
                      <span className='text-yellow-200'>
                        {settingsData.thresholds.memory}%
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-300'>디스크 임계값:</span>
                      <span className='text-yellow-200'>
                        {settingsData.thresholds.disk}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 대시보드 설정 카드 */}
                <div className='w-full p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg'>
                  <div className='flex items-center justify-between mb-2'>
                    <h4 className='text-white font-medium'>대시보드 설정</h4>
                    {isLoadingSettings ? (
                      <div className='w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin'></div>
                    ) : (
                      <div className='text-purple-300 text-xs bg-purple-500/20 px-2 py-1 rounded'>
                        활성
                      </div>
                    )}
                  </div>
                  <p className='text-purple-200 text-sm mb-3'>
                    모니터링 대시보드의 레이아웃과 위젯 구성
                  </p>
                  <div className='space-y-1 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-300'>레이아웃:</span>
                      <span className='text-purple-200 capitalize'>
                        {settingsData.dashboard.layout}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-300'>활성 위젯:</span>
                      <span className='text-purple-200'>
                        {settingsData.dashboard.widgets}개
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 일반 설정 탭 */}
          {activeTab === 'general' && (
            <div
              id='tab-panel-general'
              role='tabpanel'
              aria-labelledby='tab-general'
              className='space-y-6'
            >
              <div className='text-center'>
                <div className='w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center mb-4'>
                  <Settings className='w-8 h-8 text-white' />
                </div>
                <h3 className='text-lg font-bold text-white mb-2'>일반 설정</h3>
                <p className='text-gray-400 text-sm mb-4'>
                  시스템 환경 설정 및 기타 옵션을 관리합니다.
                </p>
              </div>

              <div className='space-y-4'>
                {/* 알림 설정 카드 */}
                <div className='w-full p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg'>
                  <div className='flex items-center justify-between mb-2'>
                    <h4 className='text-white font-medium'>알림 설정</h4>
                    {isLoadingSettings ? (
                      <div className='w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin'></div>
                    ) : (
                      <div className='text-orange-300 text-xs bg-orange-500/20 px-2 py-1 rounded'>
                        {settingsData.notifications.slack ||
                        settingsData.notifications.email ||
                        settingsData.notifications.webhook
                          ? '활성'
                          : '비활성'}
                      </div>
                    )}
                  </div>
                  <p className='text-orange-200 text-sm mb-3'>
                    시스템 알림 및 경고 메시지 설정 관리
                  </p>
                  <div className='space-y-1 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-300'>슬랙 알림:</span>
                      <span
                        className={`${settingsData.notifications.slack ? 'text-green-200' : 'text-red-200'}`}
                      >
                        {settingsData.notifications.slack ? '활성' : '비활성'}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-300'>이메일 알림:</span>
                      <span
                        className={`${settingsData.notifications.email ? 'text-green-200' : 'text-red-200'}`}
                      >
                        {settingsData.notifications.email ? '활성' : '비활성'}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-300'>웹훅 알림:</span>
                      <span
                        className={`${settingsData.notifications.webhook ? 'text-green-200' : 'text-red-200'}`}
                      >
                        {settingsData.notifications.webhook ? '활성' : '비활성'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 테마 설정 카드 */}
                <div className='w-full p-4 bg-indigo-500/20 border border-indigo-500/30 rounded-lg'>
                  <div className='flex items-center justify-between mb-2'>
                    <h4 className='text-white font-medium'>테마 설정</h4>
                    <div className='text-indigo-300 text-xs bg-indigo-500/20 px-2 py-1 rounded capitalize'>
                      {settingsData.theme}
                    </div>
                  </div>
                  <p className='text-indigo-200 text-sm mb-3'>
                    다크/라이트 모드 및 색상 테마 설정
                  </p>
                  <div className='space-y-1 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-300'>현재 테마:</span>
                      <span className='text-indigo-200 capitalize'>
                        {settingsData.theme === 'dark'
                          ? '다크 모드'
                          : '라이트 모드'}
                      </span>
                    </div>
                    <button
                      onClick={handleThemeConfig}
                      className='w-full mt-2 px-3 py-1 bg-indigo-500/30 hover:bg-indigo-500/40 border border-indigo-500/30 rounded text-xs text-indigo-200 transition-colors'
                    >
                      테마 변경
                    </button>
                  </div>
                </div>

                {/* 백업 설정 카드 */}
                <div className='w-full p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg'>
                  <div className='flex items-center justify-between mb-2'>
                    <h4 className='text-white font-medium'>백업 설정</h4>
                    {isLoadingSettings ? (
                      <div className='w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin'></div>
                    ) : (
                      <div className='text-purple-300 text-xs bg-purple-500/20 px-2 py-1 rounded'>
                        {settingsData.backup.autoBackup ? '자동' : '수동'}
                      </div>
                    )}
                  </div>
                  <p className='text-purple-200 text-sm mb-3'>
                    데이터 백업 주기 및 복원 설정 관리
                  </p>
                  <div className='space-y-1 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-300'>마지막 백업:</span>
                      <span className='text-purple-200'>
                        {settingsData.backup.lastBackup}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-300'>자동 백업:</span>
                      <span
                        className={`${settingsData.backup.autoBackup ? 'text-green-200' : 'text-red-200'}`}
                      >
                        {settingsData.backup.autoBackup ? '활성' : '비활성'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default function UnifiedProfileComponent({
  userName = '사용자',
  userAvatar,
}: UnifiedProfileComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  const {
    isSystemStarted,
    aiAgent,
    isLocked,
    startSystem,
    stopSystem,
    disableAIAgent,
    logout,
  } = useUnifiedAdminStore();

  const { success, info } = useToast();

  // 드롭다운 위치 계산
  const calculateDropdownPosition = () => {
    if (!profileButtonRef.current) return;

    const buttonRect = profileButtonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 기본 위치: 버튼 아래, 오른쪽 정렬
    let top = buttonRect.bottom + 8;
    let right = viewportWidth - buttonRect.right;

    // 드롭다운이 화면 아래로 넘어가는 경우 위쪽에 표시
    const dropdownHeight = 400; // 예상 드롭다운 높이
    if (top + dropdownHeight > viewportHeight) {
      top = buttonRect.top - dropdownHeight - 8;
    }

    // 모바일에서는 중앙 정렬
    if (viewportWidth < 640) {
      right = (viewportWidth - 320) / 2; // 드롭다운 너비 320px 기준
      if (right < 16) right = 16; // 최소 여백
    }

    setDropdownPosition({ top, right });
  };

  // 외부 클릭 감지 (강화된 버전)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;

      // 프로필 버튼 클릭은 제외
      if (profileButtonRef.current?.contains(target)) {
        return;
      }

      // 드롭다운 외부 클릭 시 닫기
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    // 단일 이벤트 리스너로 수정 (중복 방지)
    document.addEventListener('mousedown', handleClickOutside, {
      passive: true,
      capture: false,
    });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ESC 키로 드롭다운 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape, { passive: false });
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // 스크롤 시 드롭다운 닫기 (디바운스 적용)
  useEffect(() => {
    if (!isOpen) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setIsOpen(false), 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [isOpen]);

  // 윈도우 리사이즈 시 위치 재계산 (디바운스 적용)
  useEffect(() => {
    if (!isOpen) return;

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        calculateDropdownPosition();
      }, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [isOpen]);

  // 설정 패널이 열릴 때 드롭다운 자동 닫기
  useEffect(() => {
    if (showSettingsPanel && isOpen) {
      setIsOpen(false);
    }
  }, [showSettingsPanel, isOpen]);

  // 드롭다운 열기/닫기 핸들러 (개선된 버전)
  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 설정 패널이 열려있으면 먼저 닫기
    if (showSettingsPanel) {
      setShowSettingsPanel(false);
      return;
    }

    if (!isOpen) {
      calculateDropdownPosition();
      // 약간의 지연으로 위치 계산 후 열기
      requestAnimationFrame(() => {
        setIsOpen(true);
      });
    } else {
      setIsOpen(false);
    }
  };

  const handleSystemToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSystemStarted) {
      stopSystem();
    } else {
      startSystem();
    }
    setIsOpen(false);
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSettingsPanel(true);
    setIsOpen(false);
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logout();
    info('로그아웃되었습니다.');
    setIsOpen(false);
  };

  const handleAIDisable = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    disableAIAgent();
    info('AI 에이전트가 비활성화되었습니다.');
    setIsOpen(false);
  };

  const getModeDisplayText = () => {
    return aiAgent.isEnabled ? 'AI 에이전트 모드' : '기본 모니터링 모드';
  };

  const getModeStatusColor = () => {
    return aiAgent.isEnabled ? 'text-purple-400' : 'text-cyan-400';
  };

  const getSystemStatusColor = () => {
    if (isLocked) return 'text-red-400';
    if (!isSystemStarted) return 'text-gray-400';
    return aiAgent.isEnabled ? 'text-purple-400' : 'text-cyan-400';
  };

  // 드롭다운 컴포넌트 (Portal로 렌더링)
  const DropdownPortal = () => {
    if (typeof window === 'undefined') return null;

    return createPortal(
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 오버레이 (모바일용) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className='fixed inset-0 bg-black/20 backdrop-blur-sm z-[9990] sm:hidden'
              onClick={() => setIsOpen(false)}
            />

            {/* 드롭다운 메뉴 */}
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{
                duration: 0.2,
                ease: [0.4, 0.0, 0.2, 1], // cubic-bezier 이징
                layout: { duration: 0.2 },
              }}
              className='fixed bg-gray-900/95 backdrop-blur-lg border border-gray-700/50 rounded-xl shadow-2xl z-[9999] min-w-[280px] max-w-[320px]'
              style={{
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`,
                maxHeight: 'calc(100vh - 100px)',
                overflowY: 'auto',
                willChange: 'transform, opacity', // GPU 가속
              }}
              role='menu'
              aria-orientation='vertical'
              onClick={e => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className='p-4 border-b border-gray-700/50'>
                <div className='flex items-center gap-3 mb-3'>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isLocked
                        ? 'bg-gradient-to-br from-red-500 to-orange-600'
                        : aiAgent.isEnabled
                          ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                          : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                    }`}
                  >
                    {userAvatar ? (
                      <Image
                        src={userAvatar}
                        alt='Avatar'
                        width={40}
                        height={40}
                        className='w-full h-full rounded-full object-cover'
                      />
                    ) : (
                      <User className='w-5 h-5 text-white' />
                    )}
                  </div>
                  <div>
                    <div className='text-white font-medium'>{userName}</div>
                    <div className={`text-sm ${getModeStatusColor()}`}>
                      {getModeDisplayText()}
                    </div>
                  </div>
                </div>

                {/* 시스템 상태 */}
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-gray-400 text-sm'>시스템 상태</span>
                    <span
                      className={`text-sm font-medium ${getSystemStatusColor()}`}
                    >
                      {isLocked
                        ? '🔒 잠김'
                        : isSystemStarted
                          ? '🟢 실행 중'
                          : '🔴 중지됨'}
                    </span>
                  </div>

                  {/* 시스템 토글 버튼 */}
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSystemToggle}
                    disabled={isLocked}
                    className='w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500'
                    role='menuitem'
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isSystemStarted ? 'bg-red-500/20' : 'bg-green-500/20'
                      }`}
                    >
                      {isSystemStarted ? (
                        <StopCircle className='w-4 h-4 text-red-400' />
                      ) : (
                        <Power className='w-4 h-4 text-green-400' />
                      )}
                    </div>
                    <div>
                      <div className='text-white font-medium'>
                        {isSystemStarted ? '시스템 종료' : '시스템 시작'}
                      </div>
                      <div className='text-gray-400 text-xs'>
                        {isSystemStarted
                          ? '모든 기능을 중지합니다'
                          : '모니터링을 시작합니다'}
                      </div>
                    </div>
                  </motion.button>

                  {/* AI 에이전트 상태 */}
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div
                        className={`p-2 rounded-lg ${
                          aiAgent.isEnabled
                            ? 'bg-purple-500/20'
                            : 'bg-gray-500/20'
                        }`}
                      >
                        <Bot
                          className={`w-4 h-4 ${
                            aiAgent.isEnabled
                              ? 'text-purple-400'
                              : 'text-gray-400'
                          }`}
                        />
                      </div>
                      <div>
                        <div className='text-white text-sm font-medium'>
                          AI 에이전트
                        </div>
                        <div
                          className={`text-xs ${
                            aiAgent.isEnabled
                              ? 'text-purple-400'
                              : 'text-gray-400'
                          }`}
                        >
                          {aiAgent.isEnabled ? '활성화됨' : '비활성화됨'}
                        </div>
                      </div>
                    </div>
                    {aiAgent.isEnabled && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAIDisable}
                        className='px-3 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500'
                      >
                        비활성화
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>

              {/* 메뉴 아이템들 */}
              <div className='p-2'>
                {/* AI 엔진 관리 페이지 버튼 - AI 모드 활성화 시에만 표시 */}
                {aiAgent.isEnabled && aiAgent.isAuthenticated && (
                  <Link href='/admin/ai-agent'>
                    <motion.button
                      whileHover={{
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsOpen(false)}
                      className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500'
                      role='menuitem'
                    >
                      <div className='p-2 rounded-lg bg-purple-500/20'>
                        <Shield className='w-4 h-4 text-purple-400' />
                      </div>
                      <div>
                        <div className='text-white font-medium'>
                          🧠 AI 엔진 관리 페이지
                        </div>
                        <div className='text-gray-400 text-xs'>
                          AI 로그, 컨텍스트, A/B 테스트 관리
                        </div>
                      </div>
                    </motion.button>
                  </Link>
                )}

                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSettingsClick}
                  className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500'
                  role='menuitem'
                >
                  <div className='p-2 rounded-lg bg-purple-500/20'>
                    <Settings className='w-4 h-4 text-purple-400' />
                  </div>
                  <div>
                    <div className='text-white font-medium'>통합 설정</div>
                    <div className='text-gray-400 text-xs'>
                      AI 모드, 데이터 생성기, 모니터링 제어
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className='w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-red-500'
                  role='menuitem'
                >
                  <div className='p-2 rounded-lg bg-red-500/20'>
                    <LogOut className='w-4 h-4 text-red-400' />
                  </div>
                  <div>
                    <div className='text-white font-medium'>로그아웃</div>
                    <div className='text-gray-400 text-xs'>
                      현재 세션을 종료합니다
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  return (
    <>
      <div className='relative'>
        {/* 프로필 버튼 */}
        <motion.button
          ref={profileButtonRef}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleToggleDropdown}
          className={`flex items-center gap-3 p-2 rounded-xl backdrop-blur-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${
            isLocked
              ? 'bg-red-500/20 border-red-500/50 shadow-red-500/20 shadow-lg focus:ring-red-500'
              : aiAgent.isEnabled
                ? 'bg-purple-500/20 border-purple-500/50 shadow-purple-500/20 shadow-lg focus:ring-purple-500'
                : 'bg-white/10 border-white/20 hover:bg-white/20 focus:ring-white/50'
          }`}
          aria-label='프로필 메뉴 열기'
          aria-expanded={isOpen}
          aria-haspopup='true'
        >
          {/* 아바타 */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isLocked
                ? 'bg-gradient-to-br from-red-500 to-orange-600'
                : aiAgent.isEnabled
                  ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                  : 'bg-gradient-to-br from-cyan-500 to-blue-600'
            }`}
          >
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt='Avatar'
                width={32}
                height={32}
                className='w-full h-full rounded-full object-cover'
              />
            ) : (
              <User className='w-4 h-4 text-white' />
            )}
          </div>

          {/* 사용자 정보 */}
          <div className='text-left hidden sm:block'>
            <div className='text-white text-sm font-medium'>{userName}</div>
            <div className={`text-xs ${getModeStatusColor()}`}>
              {getModeDisplayText()}
            </div>
          </div>

          {/* 상태 인디케이터 */}
          <div className='flex items-center gap-1'>
            {/* AI 에이전트 상태 */}
            {aiAgent.isEnabled && aiAgent.state === 'processing' && (
              <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
            )}

            {/* 잠금 상태 */}
            {isLocked && <AlertTriangle className='w-3 h-3 text-red-400' />}

            {/* 드롭다운 아이콘 */}
            <ChevronDown
              className={`w-3 h-3 text-white/70 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </motion.button>
      </div>

      {/* 드롭다운 메뉴 (Portal로 렌더링) */}
      <DropdownPortal />

      {/* 통합 설정 패널 */}
      <AnimatePresence>
        {showSettingsPanel && (
          <UnifiedSettingsPanel
            isOpen={showSettingsPanel}
            onClose={() => setShowSettingsPanel(false)}
            buttonRef={profileButtonRef}
          />
        )}
      </AnimatePresence>
    </>
  );
}
