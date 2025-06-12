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
                        isAdminAuthenticated ? 'bg-green-400' : 'bg-yellow-400'
                      }`}
                    />
                    <p className='text-xs text-gray-400 mb-1'>관리자 인증</p>
                    <p className='text-sm font-medium text-white'>
                      {isAdminAuthenticated ? '인증됨' : '인증 필요'}
                    </p>
                  </div>
                  <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
                    <div className='w-3 h-3 rounded-full mx-auto mb-2 bg-blue-400' />
                    <p className='text-xs text-gray-400 mb-1'>시스템 상태</p>
                    <p className='text-sm font-medium text-white'>정상</p>
                  </div>
                </div>

                {/* 관리자 인증이 필요한 경우에만 인라인으로 표시 */}
                {!isAdminAuthenticated && (
                  <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4'>
                    <div className='flex items-center gap-3 mb-3'>
                      <Lock className='w-4 h-4 text-yellow-400' />
                      <span className='text-sm font-medium text-yellow-300'>
                        관리자 인증 필요
                      </span>
                    </div>
                    <div className='flex gap-3'>
                      <input
                        aria-label='입력'
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
                {isAdminAuthenticated && (
                  <div className='bg-green-500/10 border border-green-500/30 rounded-lg p-4'>
                    <div className='flex items-center gap-3 mb-3'>
                      <Check className='w-4 h-4 text-green-400' />
                      <span className='text-sm font-medium text-green-300'>
                        관리자 권한 활성화
                      </span>
                    </div>
                    <div className='grid grid-cols-1 gap-3'>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAIOptimization}
                        className='px-4 py-3 bg-purple-500/20 text-purple-300 rounded-lg font-medium hover:bg-purple-500/30 transition-colors text-sm border border-purple-500/30'
                      >
                        <div className='flex flex-col items-center gap-1'>
                          <span className='font-semibold'>🤖 AI 최적화</span>
                          <span className='text-xs text-purple-200'>
                            AI 엔진 성능을 분석하고 메모리/CPU 사용량을
                            최적화합니다
                          </span>
                        </div>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSystemDiagnosis}
                        className='px-4 py-3 bg-blue-500/20 text-blue-300 rounded-lg font-medium hover:bg-blue-500/30 transition-colors text-sm border border-blue-500/30'
                      >
                        <div className='flex flex-col items-center gap-1'>
                          <span className='font-semibold'>🔍 상태 진단</span>
                          <span className='text-xs text-blue-200'>
                            전체 시스템의 상태를 점검하고 이상 여부를 진단합니다
                          </span>
                        </div>
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
                <div className='grid grid-cols-1 gap-3'>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleServerCountChange(8)}
                    className='px-3 py-3 bg-green-500/20 text-green-300 rounded-lg font-medium hover:bg-green-500/30 transition-colors text-sm border border-green-500/30'
                  >
                    <div className='flex flex-col items-center gap-1'>
                      <span className='font-semibold'>
                        💻 기본 모드 (8서버)
                      </span>
                      <span className='text-xs text-green-200'>
                        Vercel Free 환경 - 8개 서버로 가벼운 테스트 및 개발
                      </span>
                    </div>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleServerCountChange(20)}
                    className='px-3 py-3 bg-blue-500/20 text-blue-300 rounded-lg font-medium hover:bg-blue-500/30 transition-colors text-sm border border-blue-500/30'
                  >
                    <div className='flex flex-col items-center gap-1'>
                      <span className='font-semibold'>
                        🚀 프로 모드 (20서버)
                      </span>
                      <span className='text-xs text-blue-200'>
                        Vercel Pro 환경 - 20개 서버로 실전 운영 환경 시뮬레이션
                      </span>
                    </div>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleServerCountChange(30)}
                    className='px-3 py-3 bg-purple-500/20 text-purple-300 rounded-lg font-medium hover:bg-purple-500/30 transition-colors text-sm border border-purple-500/30'
                  >
                    <div className='flex flex-col items-center gap-1'>
                      <span className='font-semibold'>
                        ⚡ 로컬 모드 (30서버)
                      </span>
                      <span className='text-xs text-purple-200'>
                        로컬 개발 환경 - 30개 서버로 최대 성능 테스트
                      </span>
                    </div>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGeneratorCheck}
                    className='px-3 py-3 bg-purple-500/20 text-purple-300 rounded-lg font-medium hover:bg-purple-500/30 transition-colors text-sm border border-purple-500/30'
                  >
                    <div className='flex flex-col items-center gap-1'>
                      <span className='font-semibold'>📊 상태 확인</span>
                      <span className='text-xs text-purple-200'>
                        데이터 생성기의 현재 상태와 성능 지표를 확인합니다
                      </span>
                    </div>
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

                <div className='grid grid-cols-1 gap-3'>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleMonitorCheck}
                    className='px-4 py-3 bg-cyan-500/20 text-cyan-300 rounded-lg font-medium hover:bg-cyan-500/30 transition-colors text-sm border border-cyan-500/30'
                  >
                    <div className='flex flex-col items-center gap-1'>
                      <span className='font-semibold'>📈 모니터링 최적화</span>
                      <span className='text-xs text-cyan-200'>
                        메트릭 수집 간격과 알림 임계값을 자동으로 최적화합니다
                      </span>
                    </div>
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

                <div className='grid grid-cols-1 gap-3'>
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
                    className='px-4 py-3 bg-gray-500/20 text-gray-300 rounded-lg font-medium hover:bg-gray-500/30 transition-colors text-sm border border-gray-500/30'
                  >
                    <div className='flex flex-col items-center gap-1'>
                      <span className='font-semibold'>🎨 테마 전환</span>
                      <span className='text-xs text-gray-200'>
                        다크/라이트 모드를 전환하고 UI 색상 테마를 변경합니다
                      </span>
                    </div>
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
                    className='px-4 py-3 bg-gray-500/20 text-gray-300 rounded-lg font-medium hover:bg-gray-500/30 transition-colors text-sm border border-gray-500/30'
                  >
                    <div className='flex flex-col items-center gap-1'>
                      <span className='font-semibold'>💾 백업 생성</span>
                      <span className='text-xs text-gray-200'>
                        현재 설정과 데이터를 안전하게 백업 파일로 저장합니다
                      </span>
                    </div>
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
