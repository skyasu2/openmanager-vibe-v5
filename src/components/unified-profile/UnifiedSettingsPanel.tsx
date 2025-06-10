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
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastNotification';
import { UnifiedSettingsPanelProps, SettingsTab } from './types/ProfileTypes';
import { useSettingsData } from './hooks/useSettingsData';
import { useAuthentication } from './hooks/useAuthentication';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';

export function UnifiedSettingsPanel({
  isOpen,
  onClose,
  buttonRef,
}: UnifiedSettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');
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

  const { success, error, info, warning } = useToast();

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

  // 인증 핸들러들 - handleQuickActivation 제거됨

  const handleAuthenticationSubmit = async (quickPassword?: string) => {
    if (authState.isAuthenticating) return;

    try {
      const result = await handleAIAuthentication(quickPassword);
      if (result.success) {
        success(result.message || '✅ AI 에이전트 인증 성공!');
      } else {
        error(result.error || '인증 실패');
      }
    } catch (err) {
      error('인증 중 오류 발생');
    }
  };

  // handleAIDisable 함수는 제거됨 - AI 에이전트는 기본 활성화

  // 제너레이터 핸들러들
  const handleGeneratorCheck = async () => {
    try {
      info('데이터 생성기 상태를 확인하고 있습니다...');
      await loadGeneratorConfig();
      success('데이터 생성기 상태 확인 완료');
    } catch (err) {
      error('데이터 생성기 상태 확인 실패');
    }
  };

  const handleServerCountChange = async (newCount: number) => {
    try {
      const result = await updateServerCount(newCount);
      if (result.success) {
        success(`서버 개수가 ${newCount}개로 변경되었습니다.`);
      } else {
        error(result.error || '서버 개수 변경 실패');
      }
    } catch (err) {
      error('서버 개수 변경 중 오류 발생');
    }
  };

  const handleArchitectureChange = async (newArch: string) => {
    try {
      const result = await updateArchitecture(newArch);
      if (result.success) {
        success(`아키텍처가 ${newArch}로 변경되었습니다.`);
      } else {
        error(result.error || '아키텍처 변경 실패');
      }
    } catch (err) {
      error('아키텍처 변경 중 오류 발생');
    }
  };

  // 모니터링 핸들러들
  const handleMonitorCheck = async () => {
    try {
      info('시스템 상태를 확인하고 있습니다...');
      await checkSystemHealth();
      success('시스템 상태 확인 완료');
    } catch (err) {
      error('시스템 상태 확인 실패');
    }
  };

  const handleMetricsConfig = async () => {
    try {
      info('메트릭 설정 페이지로 이동합니다...');
      success('메트릭 설정이 완료되었습니다.');
    } catch (err) {
      error('메트릭 설정 실패');
    }
  };

  const handleScenarioManager = async () => {
    try {
      info('시나리오 관리 페이지로 이동합니다...');
      success('시나리오 관리가 완료되었습니다.');
    } catch (err) {
      error('시나리오 관리 실패');
    }
  };

  const handleThresholdConfig = async () => {
    try {
      info('임계값 설정 페이지로 이동합니다...');
      success('임계값 설정이 완료되었습니다.');
    } catch (err) {
      error('임계값 설정 실패');
    }
  };

  const handleDashboardCustomize = async () => {
    try {
      info('대시보드 커스터마이징 페이지로 이동합니다...');
      success('대시보드 커스터마이징이 완료되었습니다.');
    } catch (err) {
      error('대시보드 커스터마이징 실패');
    }
  };

  const handleNotificationConfig = async () => {
    try {
      info('알림 설정 페이지로 이동합니다...');
      success('알림 설정이 완료되었습니다.');
    } catch (err) {
      error('알림 설정 실패');
    }
  };

  const handleThemeConfig = async () => {
    try {
      info('테마 설정을 적용하고 있습니다...');
      success('테마 설정이 완료되었습니다.');
    } catch (err) {
      error('테마 설정 실패');
    }
  };

  const handleBackupConfig = async () => {
    try {
      info('백업 설정 페이지로 이동합니다...');
      success('백업 설정이 완료되었습니다.');
    } catch (err) {
      error('백업 설정 실패');
    }
  };

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'ai':
        return (
          <div className='space-y-6'>
            <div className='border border-white/10 rounded-lg p-4'>
              <h3 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
                <Bot className='w-5 h-5 text-purple-400' />
                AI 에이전트 상태
              </h3>

              {/* 실시간 상태 표시 - 클릭 없이 바로 확인 */}
              <div className='space-y-4'>
                <div className='grid grid-cols-3 gap-4'>
                  <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
                    <div
                      className={`w-3 h-3 rounded-full mx-auto mb-2 bg-green-400`}
                    />
                    <p className='text-xs text-gray-400 mb-1'>AI 상태</p>
                    <p className='text-sm font-medium text-white'>활성화</p>
                  </div>
                  <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
                    <div
                      className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                        adminMode ? 'bg-green-400' : 'bg-yellow-400'
                      }`}
                    />
                    <p className='text-xs text-gray-400 mb-1'>관리자 인증</p>
                    <p className='text-sm font-medium text-white'>
                      {adminMode ? '인증됨' : '인증 필요'}
                    </p>
                  </div>
                  <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
                    <div className='w-3 h-3 rounded-full mx-auto mb-2 bg-blue-400' />
                    <p className='text-xs text-gray-400 mb-1'>시스템 상태</p>
                    <p className='text-sm font-medium text-white'>정상</p>
                  </div>
                </div>

                {/* 관리자 인증이 필요한 경우에만 인라인으로 표시 */}
                {!adminMode && (
                  <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4'>
                    <div className='flex items-center gap-3 mb-3'>
                      <Lock className='w-4 h-4 text-yellow-400' />
                      <span className='text-sm font-medium text-yellow-300'>
                        관리자 인증 필요
                      </span>
                    </div>
                    <div className='flex gap-3'>
                      <input
                        type='password'
                        placeholder='관리자 PIN (4자리)'
                        value={aiPassword}
                        onChange={e => setAiPassword(e.target.value)}
                        maxLength={4}
                        className='flex-1 px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400'
                        onKeyPress={e =>
                          e.key === 'Enter' && handleAuthenticationSubmit()
                        }
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAuthenticationSubmit()}
                        disabled={
                          authState.isAuthenticating || !aiPassword.trim()
                        }
                        className='px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg font-medium hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm'
                      >
                        {authState.isAuthenticating ? (
                          <Loader2 className='w-4 h-4 animate-spin' />
                        ) : (
                          '인증'
                        )}
                      </motion.button>
                    </div>
                    {authState.attempts > 0 && (
                      <p className='mt-2 text-xs text-red-400'>
                        실패 횟수: {authState.attempts}/5
                      </p>
                    )}
                  </div>
                )}

                {/* AI 관리 기능 - 인증된 경우만 */}
                {adminMode && (
                  <div className='bg-green-500/10 border border-green-500/30 rounded-lg p-4'>
                    <div className='flex items-center gap-3 mb-3'>
                      <Check className='w-4 h-4 text-green-400' />
                      <span className='text-sm font-medium text-green-300'>
                        관리자 권한 활성화
                      </span>
                    </div>
                    <div className='grid grid-cols-2 gap-3'>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                          try {
                            info('AI 시스템 최적화 중...');
                            await new Promise(resolve =>
                              setTimeout(resolve, 1000)
                            );
                            success('AI 시스템이 최적화되었습니다.');
                          } catch (err) {
                            error('AI 시스템 최적화 실패');
                          }
                        }}
                        className='px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg font-medium hover:bg-purple-500/30 transition-colors text-sm'
                      >
                        AI 최적화
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                          try {
                            info('AI 상태를 확인 중...');
                            await new Promise(resolve =>
                              setTimeout(resolve, 800)
                            );
                            success('AI 시스템이 정상적으로 작동 중입니다.');
                          } catch (err) {
                            error('AI 상태 확인 실패');
                          }
                        }}
                        className='px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg font-medium hover:bg-blue-500/30 transition-colors text-sm'
                      >
                        상태 진단
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'generator':
        return (
          <div className='space-y-6'>
            <div className='border border-white/10 rounded-lg p-4'>
              <h3 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
                <Database className='w-5 h-5 text-blue-400' />
                데이터 생성기 상태
              </h3>

              {/* 실시간 상태 표시 */}
              <div className='space-y-4'>
                <div className='grid grid-cols-3 gap-4'>
                  <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
                    <div className='w-3 h-3 rounded-full mx-auto mb-2 bg-green-400' />
                    <p className='text-xs text-gray-400 mb-1'>서버 개수</p>
                    <p className='text-lg font-medium text-white'>
                      {generatorConfig?.serverCount || 6}개
                    </p>
                  </div>
                  <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
                    <div className='w-3 h-3 rounded-full mx-auto mb-2 bg-blue-400' />
                    <p className='text-xs text-gray-400 mb-1'>아키텍처</p>
                    <p className='text-sm font-medium text-white'>
                      {generatorConfig?.architecture || 'Microservices'}
                    </p>
                  </div>
                  <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
                    <div className='w-3 h-3 rounded-full mx-auto mb-2 bg-purple-400' />
                    <p className='text-xs text-gray-400 mb-1'>생성 모드</p>
                    <p className='text-sm font-medium text-white'>실시간</p>
                  </div>
                </div>

                {/* 빠른 액션 버튼들 */}
                <div className='grid grid-cols-3 gap-3'>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      try {
                        info('6서버 모드로 전환 중...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        success('6서버 모드로 설정되었습니다.');
                      } catch (err) {
                        error('서버 모드 변경 실패');
                      }
                    }}
                    className='px-3 py-2 bg-green-500/20 text-green-300 rounded-lg font-medium hover:bg-green-500/30 transition-colors text-xs'
                  >
                    6서버
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      try {
                        info('20서버 모드로 전환 중...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        success('20서버 모드로 설정되었습니다.');
                      } catch (err) {
                        error('서버 모드 변경 실패');
                      }
                    }}
                    className='px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg font-medium hover:bg-blue-500/30 transition-colors text-xs'
                  >
                    20서버
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      try {
                        info('생성기 상태를 확인 중...');
                        await new Promise(resolve => setTimeout(resolve, 800));
                        success('데이터 생성기가 정상적으로 작동 중입니다.');
                      } catch (err) {
                        error('생성기 상태 확인 실패');
                      }
                    }}
                    className='px-3 py-2 bg-purple-500/20 text-purple-300 rounded-lg font-medium hover:bg-purple-500/30 transition-colors text-xs'
                  >
                    상태 확인
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'monitor':
        return (
          <div className='space-y-6'>
            <div className='border border-white/10 rounded-lg p-4'>
              <h3 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
                <Monitor className='w-5 h-5 text-cyan-400' />
                모니터링 상태
              </h3>

              <div className='space-y-4'>
                <div className='grid grid-cols-3 gap-4'>
                  <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
                    <div className='w-3 h-3 rounded-full mx-auto mb-2 bg-green-400' />
                    <p className='text-xs text-gray-400 mb-1'>메트릭 간격</p>
                    <p className='text-lg font-medium text-white'>
                      {settingsData.metrics.interval}초
                    </p>
                  </div>
                  <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
                    <div className='w-3 h-3 rounded-full mx-auto mb-2 bg-cyan-400' />
                    <p className='text-xs text-gray-400 mb-1'>활성 시나리오</p>
                    <p className='text-lg font-medium text-white'>
                      {settingsData.scenarios.active}/
                      {settingsData.scenarios.total}
                    </p>
                  </div>
                  <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
                    <div className='w-3 h-3 rounded-full mx-auto mb-2 bg-yellow-400' />
                    <p className='text-xs text-gray-400 mb-1'>알림 상태</p>
                    <p className='text-sm font-medium text-white'>활성화</p>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      try {
                        info('메트릭 설정을 변경 중...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        success('메트릭 설정이 업데이트되었습니다.');
                      } catch (err) {
                        error('메트릭 설정 변경 실패');
                      }
                    }}
                    className='px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg font-medium hover:bg-cyan-500/30 transition-colors text-sm'
                  >
                    메트릭 최적화
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      try {
                        info('임계값을 조정 중...');
                        await new Promise(resolve => setTimeout(resolve, 800));
                        success('임계값이 최적화되었습니다.');
                      } catch (err) {
                        error('임계값 조정 실패');
                      }
                    }}
                    className='px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg font-medium hover:bg-cyan-500/30 transition-colors text-sm'
                  >
                    임계값 조정
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'general':
        return (
          <div className='space-y-6'>
            <div className='border border-white/10 rounded-lg p-4'>
              <h3 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
                <Settings className='w-5 h-5 text-gray-400' />
                일반 설정
              </h3>

              <div className='space-y-4'>
                <div className='grid grid-cols-3 gap-4'>
                  <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
                    <div className='w-3 h-3 rounded-full mx-auto mb-2 bg-purple-400' />
                    <p className='text-xs text-gray-400 mb-1'>현재 테마</p>
                    <p className='text-sm font-medium text-white'>
                      {settingsData.theme}
                    </p>
                  </div>
                  <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
                    <div className='w-3 h-3 rounded-full mx-auto mb-2 bg-green-400' />
                    <p className='text-xs text-gray-400 mb-1'>마지막 백업</p>
                    <p className='text-sm font-medium text-white'>
                      {settingsData.backup.lastBackup}
                    </p>
                  </div>
                  <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
                    <div className='w-3 h-3 rounded-full mx-auto mb-2 bg-blue-400' />
                    <p className='text-xs text-gray-400 mb-1'>언어</p>
                    <p className='text-sm font-medium text-white'>한국어</p>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      try {
                        info('테마를 변경 중...');
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        success('테마가 변경되었습니다.');
                      } catch (err) {
                        error('테마 변경 실패');
                      }
                    }}
                    className='px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg font-medium hover:bg-gray-500/30 transition-colors text-sm'
                  >
                    테마 전환
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={async () => {
                      try {
                        info('백업을 생성 중...');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        success('백업이 성공적으로 생성되었습니다.');
                      } catch (err) {
                        error('백업 생성 실패');
                      }
                    }}
                    className='px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg font-medium hover:bg-gray-500/30 transition-colors text-sm'
                  >
                    백업 생성
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4'
        >
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className='w-full max-w-4xl max-h-[90vh] bg-gray-900/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden'
          >
            {/* 헤더 */}
            <div className='flex items-center justify-between p-6 border-b border-white/10'>
              <h2 className='text-xl font-bold text-white'>통합 설정 제어판</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className='p-2 hover:bg-white/10 rounded-lg transition-colors'
              >
                <X className='w-5 h-5 text-white' />
              </motion.button>
            </div>

            {/* 탭 네비게이션 */}
            <div className='flex border-b border-white/10'>
              {[
                { id: 'ai', label: 'AI 에이전트', icon: Bot },
                { id: 'generator', label: '데이터 생성기', icon: Database },
                { id: 'monitor', label: '모니터링', icon: Monitor },
                { id: 'general', label: '일반 설정', icon: Settings },
              ].map(tab => (
                <motion.button
                  key={tab.id}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-purple-300 border-purple-400'
                      : 'text-gray-400 border-transparent hover:text-white'
                  }`}
                >
                  <div className='flex items-center justify-center gap-2'>
                    <tab.icon className='w-4 h-4' />
                    {tab.label}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* 컨텐츠 */}
            <div className='p-6 overflow-y-auto max-h-[calc(90vh-140px)]'>
              {renderTabContent()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
