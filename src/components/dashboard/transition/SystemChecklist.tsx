/**
 * 🔧 SystemChecklist Component v3.0
 *
 * 미니멀하고 시각적인 시스템 체크리스트 + 강화된 개발자 도구
 * - 텍스트 최소화, 아이콘 중심 디자인
 * - 화면 깜박임 방지
 * - 실제 검증 실패 시 대기
 * - 강화된 실패 디버깅 시스템
 * - 개발자 도구 통합
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useSystemChecklist,
  type SystemComponent,
  type ComponentStatus,
} from '../../../hooks/useSystemChecklist';
import { safeErrorLog } from '../../../lib/error-handler';

interface SystemChecklistProps {
  onComplete: () => void;
  skipCondition?: boolean;
}

// 🔍 디버깅 정보 타입
interface DebugInfo {
  timestamp: string;
  componentStates: Record<string, ComponentStatus>;
  networkRequests: NetworkRequest[];
  errors: ErrorInfo[];
  performance: PerformanceInfo;
  userAgent: string;
  url: string;
}

interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  responseTime: number;
  timestamp: string;
  success: boolean;
  error?: string;
}

interface ErrorInfo {
  component: string;
  error: string;
  stack?: string;
  timestamp: string;
  retryCount: number;
}

interface PerformanceInfo {
  startTime: number;
  checklistDuration: number;
  slowestComponent: string;
  fastestComponent: string;
  averageResponseTime: number;
}

// 컴포넌트 아이콘 매핑 (텍스트 대신 시각적 아이콘)
const getComponentIcon = (name: string) => {
  switch (name) {
    case 'API 서버 연결':
      return '🌐';
    case '메트릭 데이터베이스':
      return '📊';
    case 'AI 분석 엔진':
      return '🧠';
    case 'Prometheus 허브':
      return '📈';
    case '서버 생성기':
      return '🖥️';
    case '캐시 시스템':
      return '⚡';
    case '보안 검증':
      return '🔒';
    case 'UI 컴포넌트':
      return '🎨';
    default:
      return '⚙️';
  }
};

// 상태별 아이콘
const getStatusIcon = (status: ComponentStatus) => {
  if (status.status === 'loading') {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className='w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full'
      />
    );
  }

  switch (status.status) {
    case 'completed':
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className='w-4 h-4 bg-green-500 rounded-full flex items-center justify-center'
        >
          <svg
            className='w-3 h-3 text-white'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={3}
              d='M5 13l4 4L19 7'
            />
          </svg>
        </motion.div>
      );
    case 'failed':
      return (
        <div className='w-4 h-4 bg-red-500 rounded-full flex items-center justify-center'>
          <svg
            className='w-3 h-3 text-white'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={3}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </div>
      );
    case 'pending':
      return <div className='w-4 h-4 bg-gray-600 rounded-full opacity-50' />;
    default:
      return <div className='w-4 h-4 bg-gray-600 rounded-full opacity-50' />;
  }
};

// 우선순위별 테두리 색상
const getPriorityBorder = (priority: SystemComponent['priority']) => {
  switch (priority) {
    case 'critical':
      return 'border-red-500/50';
    case 'high':
      return 'border-orange-500/50';
    case 'medium':
      return 'border-yellow-500/50';
    case 'low':
      return 'border-gray-500/50';
  }
};

export default function SystemChecklist({
  onComplete,
  skipCondition = false,
}: SystemChecklistProps) {
  const {
    components,
    componentDefinitions,
    isCompleted,
    totalProgress,
    completedCount,
    failedCount,
    loadingCount,
    canSkip,
  } = useSystemChecklist({
    onComplete,
    skipCondition,
    autoStart: true,
  });

  const [showCompleted, setShowCompleted] = useState(false);
  const [shouldProceed, setShouldProceed] = useState(false);

  // 🔍 디버깅 정보 상태
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    timestamp: new Date().toISOString(),
    componentStates: {},
    networkRequests: [],
    errors: [],
    performance: {
      startTime: Date.now(),
      checklistDuration: 0,
      slowestComponent: '',
      fastestComponent: '',
      averageResponseTime: 0,
    },
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
    url: typeof window !== 'undefined' ? window.location.href : '',
  });

  const [showDebugPanel, setShowDebugPanel] = useState(
    process.env.NODE_ENV === 'development'
  );

  // 🔍 네트워크 요청 모니터링
  const trackNetworkRequest = (
    url: string,
    method: string,
    startTime: number,
    success: boolean,
    status?: number,
    error?: string
  ) => {
    const request: NetworkRequest = {
      url,
      method,
      status: status || (success ? 200 : 500),
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      success,
      error,
    };

    setDebugInfo(prev => ({
      ...prev,
      networkRequests: [...prev.networkRequests.slice(-9), request], // 최근 10개만 유지
    }));
  };

  // 🔍 에러 추적
  const trackError = (component: string, error: string, stack?: string) => {
    const errorInfo: ErrorInfo = {
      component,
      error,
      stack,
      timestamp: new Date().toISOString(),
      retryCount: (window as any)[`retry_${component}`] || 0,
    };

    setDebugInfo(prev => ({
      ...prev,
      errors: [...prev.errors.slice(-4), errorInfo], // 최근 5개만 유지
    }));

    // 콘솔에 상세 에러 로그
    console.group(`🚨 SystemChecklist 에러: ${component}`);
    console.error('에러 메시지:', error);
    console.error('타임스탬프:', errorInfo.timestamp);
    console.error('재시도 횟수:', errorInfo.retryCount);
    if (stack) console.error('스택 트레이스:', stack);
    console.error('컴포넌트 상태:', components[component] || 'unknown');
    console.groupEnd();
  };

  // 🔍 성능 정보 업데이트
  const updatePerformanceInfo = () => {
    const responseTimes: number[] = [];
    let slowestComponent = '';
    let fastestComponent = '';
    let slowestTime = 0;
    let fastestTime = Infinity;

    Object.entries(components).forEach(([id, status]) => {
      if (status.startTime && status.completedTime) {
        const responseTime = status.completedTime - status.startTime;
        responseTimes.push(responseTime);

        const component = componentDefinitions.find(c => c.id === id);
        const componentName = component?.name || id;

        if (responseTime > slowestTime) {
          slowestTime = responseTime;
          slowestComponent = componentName;
        }

        if (responseTime < fastestTime) {
          fastestTime = responseTime;
          fastestComponent = componentName;
        }
      }
    });

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    setDebugInfo(prev => ({
      ...prev,
      performance: {
        ...prev.performance,
        checklistDuration: Date.now() - prev.performance.startTime,
        slowestComponent,
        fastestComponent,
        averageResponseTime,
      },
    }));
  };

  // 🔍 디버깅 정보 실시간 업데이트
  useEffect(() => {
    setDebugInfo(prev => ({
      ...prev,
      timestamp: new Date().toISOString(),
      componentStates: { ...components },
    }));

    updatePerformanceInfo();
  }, [components, componentDefinitions]);

  // ✅ 완료 상태 모니터링 및 자동 전환
  useEffect(() => {
    if (isCompleted && !showCompleted) {
      setShowCompleted(true);

      // 2초 후 자동 전환 (사용자가 클릭 안 할 경우)
      const autoCompleteTimer = setTimeout(() => {
        setShouldProceed(true);
        setTimeout(onComplete, 500); // 애니메이션 완료 후
      }, 2000);

      return () => clearTimeout(autoCompleteTimer);
    }
  }, [isCompleted, showCompleted, onComplete]);

  // 키보드 단축키 (이미 훅에서 처리되고 있지만 추가 재시도 기능)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        console.log('🔄 SystemChecklist 재시도 실행');
        window.location.reload();
      }

      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setShowDebugPanel(!showDebugPanel);
        // 디버그 패널 토글 (개발 환경에서만 로그)
        if (process.env.NODE_ENV === 'development') {
          console.log('🛠️ 디버그 패널 토글:', !showDebugPanel);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showDebugPanel]);

  // 🛠️ 강화된 전역 개발자 도구 등록
  useEffect(() => {
    const advancedDebugTools = {
      // 기본 상태 정보
      getState: () => ({
        components,
        debugInfo,
        isCompleted,
        canSkip,
        showCompleted,
        shouldProceed,
        totalProgress,
      }),

      // 컴포넌트별 상세 분석
      analyzeComponent: (componentId: string) => {
        const component = componentDefinitions.find(c => c.id === componentId);
        const status = components[componentId];

        console.group(`🔍 컴포넌트 분석: ${component?.name || componentId}`);
        console.log('컴포넌트 정의:', component);
        console.log('현재 상태:', status);
        console.log(
          '에러 히스토리:',
          debugInfo.errors.filter(e => e.component === componentId)
        );
        console.log(
          '네트워크 요청:',
          debugInfo.networkRequests.filter(r => r.url.includes(componentId))
        );
        console.groupEnd();

        return {
          component,
          status,
          errors: debugInfo.errors.filter(e => e.component === componentId),
        };
      },

      // 실패한 컴포넌트만 재시도
      retryFailedComponents: () => {
        const failedComponents = Object.entries(components)
          .filter(([_, status]) => status.status === 'failed')
          .map(([id]) => id);

        console.log('🔄 실패한 컴포넌트 재시도:', failedComponents);

        if (failedComponents.length === 0) {
          console.log('✅ 실패한 컴포넌트 없음');
          return;
        }

        window.location.reload();
      },

      // 네트워크 진단
      diagnoseNetwork: () => {
        const networkStats = {
          totalRequests: debugInfo.networkRequests.length,
          successRate:
            debugInfo.networkRequests.filter(r => r.success).length /
            debugInfo.networkRequests.length,
          averageResponseTime:
            debugInfo.networkRequests.reduce(
              (sum, r) => sum + r.responseTime,
              0
            ) / debugInfo.networkRequests.length,
          slowestRequest: debugInfo.networkRequests.reduce(
            (slowest, current) =>
              current.responseTime > slowest.responseTime ? current : slowest,
            debugInfo.networkRequests[0]
          ),
          failedRequests: debugInfo.networkRequests.filter(r => !r.success),
        };

        if (process.env.NODE_ENV === 'development') {
          console.group('🌐 네트워크 진단');
          console.log('통계:', networkStats);
          console.log('모든 요청:', debugInfo.networkRequests);
          console.groupEnd();
        }

        return networkStats;
      },

      // 성능 분석
      analyzePerformance: () => {
        if (process.env.NODE_ENV === 'development') {
          console.group('⚡ 성능 분석');
          console.log(
            '체크리스트 총 시간:',
            debugInfo.performance.checklistDuration + 'ms'
          );
          console.log(
            '가장 느린 컴포넌트:',
            debugInfo.performance.slowestComponent
          );
          console.log(
            '가장 빠른 컴포넌트:',
            debugInfo.performance.fastestComponent
          );
          console.log(
            '평균 응답 시간:',
            debugInfo.performance.averageResponseTime + 'ms'
          );
          console.groupEnd();
        }

        return debugInfo.performance;
      },

      // 디버그 정보 내보내기
      exportDebugInfo: () => {
        const exportData = {
          ...debugInfo,
          timestamp: new Date().toISOString(),
          components,
          isCompleted,
          totalProgress,
        };

        console.log('📤 디버그 정보 내보내기:', exportData);

        // 클립보드에 복사 (브라우저에서만)
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard
            .writeText(JSON.stringify(exportData, null, 2))
            .then(() => console.log('📋 클립보드에 복사 완료'))
            .catch(err => console.error('📋 클립보드 복사 실패:', err));
        }

        return exportData;
      },

      // 강제 완료 (안전 장치)
      forceComplete: () => {
        console.log('🚨 SystemChecklist 강제 완료 실행');
        setShouldProceed(true);
        onComplete();
      },

      // 디버그 패널 토글
      toggleDebugPanel: () => {
        setShowDebugPanel(!showDebugPanel);
        return !showDebugPanel;
      },
    };

    // 전역 등록
    (window as any).debugSystemChecklistAdvanced = advancedDebugTools;
    (window as any).systemChecklistDebug = advancedDebugTools; // 짧은 별칭

    // 기존 함수들도 유지
    (window as any).debugSystemChecklist = {
      components,
      componentDefinitions,
      isCompleted,
      canSkip,
      totalProgress,
      debugInfo,
    };

    (window as any).emergencyCompleteChecklist =
      advancedDebugTools.forceComplete;

    // 개발 환경에서만 디버그 정보 출력
    if (process.env.NODE_ENV === 'development') {
      console.group('🛠️ SystemChecklist 개발자 도구 사용 가능');
      console.log('기본 정보:', 'debugSystemChecklist');
      console.log('고급 도구:', 'systemChecklistDebug.*');
      console.log('강제 완료:', 'emergencyCompleteChecklist()');
      console.log(
        '디버그 패널:',
        'D키 또는 systemChecklistDebug.toggleDebugPanel()'
      );
      console.groupEnd();
    }
  }, [
    components,
    componentDefinitions,
    isCompleted,
    canSkip,
    totalProgress,
    debugInfo,
    showCompleted,
    shouldProceed,
    onComplete,
    showDebugPanel,
  ]);

  // 스킵된 경우 즉시 완료 처리
  if (isCompleted && skipCondition) {
    return null;
  }

  return (
    <div
      className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 
                    flex items-center justify-center p-4 relative overflow-hidden'
    >
      {/* 배경 애니메이션 */}
      <div className='absolute inset-0 opacity-10'>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse' />
        <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse delay-1000' />
      </div>

      {/* 🛠️ 개발자 디버그 패널 */}
      {showDebugPanel && (
        <div className='fixed top-4 right-4 bg-black/90 backdrop-blur-lg text-white text-xs p-4 rounded-lg border border-cyan-500/50 max-w-md z-50'>
          <div className='flex items-center justify-between mb-3'>
            <span className='font-semibold text-cyan-400'>
              🛠️ 시스템 체크리스트 디버그
            </span>
            <button
              onClick={() => setShowDebugPanel(false)}
              className='text-gray-400 hover:text-white'
            >
              ✕
            </button>
          </div>

          <div className='space-y-2 text-xs'>
            <div className='grid grid-cols-2 gap-2'>
              <div>진행률: {totalProgress}%</div>
              <div>완료: {completedCount}</div>
              <div>실패: {failedCount}</div>
              <div>로딩: {loadingCount}</div>
            </div>

            <div className='border-t border-gray-600 pt-2'>
              <div className='text-yellow-300 mb-1'>⚡ 성능:</div>
              <div>
                소요시간:{' '}
                {Math.round(debugInfo.performance.checklistDuration / 1000)}s
              </div>
              <div>
                평균 응답:{' '}
                {Math.round(debugInfo.performance.averageResponseTime)}ms
              </div>
            </div>

            {debugInfo.errors.length > 0 && (
              <div className='border-t border-gray-600 pt-2'>
                <div className='text-red-300 mb-1'>
                  🚨 에러 ({debugInfo.errors.length}):
                </div>
                {debugInfo.errors.slice(-2).map((error, idx) => (
                  <div key={idx} className='text-red-200 text-xs'>
                    {error.component}: {error.error.substring(0, 30)}...
                  </div>
                ))}
              </div>
            )}

            <div className='border-t border-gray-600 pt-2'>
              <div className='text-green-300 mb-1'>🔧 도구:</div>
              <div>• D: 패널 토글</div>
              <div>• R: 재시도</div>
              <div>• systemChecklistDebug.*</div>
            </div>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: shouldProceed ? 0 : 1,
          scale: shouldProceed ? 0.9 : 1,
        }}
        transition={{ duration: 0.3 }}
        className='relative z-10 w-full max-w-md'
      >
        {/* 로고 섹션 */}
        <motion.div
          className='text-center mb-8'
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div
            className='inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r 
                          from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-2xl'
          >
            <span className='text-2xl font-bold text-white'>OM</span>
          </div>
          <h1 className='text-2xl font-bold text-white mb-2'>OpenManager</h1>
          <p className='text-sm text-gray-300'>시스템 초기화 중...</p>
        </motion.div>

        {/* 전체 진행률 */}
        <div className='mb-6'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm font-medium text-gray-300'>
              전체 진행률
            </span>
            <span className='text-sm font-bold text-white'>
              {totalProgress}%
            </span>
          </div>
          <div className='w-full bg-gray-700/50 rounded-full h-2 overflow-hidden'>
            <motion.div
              className='h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full'
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* 컴팩트한 체크리스트 */}
        <div className='space-y-2'>
          {componentDefinitions.map((component, index) => {
            const status = components[component.id];
            if (!status) return null;

            return (
              <motion.div
                key={component.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  flex items-center p-3 rounded-xl border backdrop-blur-sm
                  ${getPriorityBorder(component.priority)}
                  ${
                    status.status === 'completed'
                      ? 'bg-green-500/10'
                      : status.status === 'failed'
                        ? 'bg-red-500/10'
                        : status.status === 'loading'
                          ? 'bg-blue-500/10'
                          : 'bg-gray-500/10'
                  }
                  transition-all duration-300
                  ${status.status === 'failed' ? 'cursor-pointer hover:bg-red-500/20' : ''}
                `}
                onClick={() => {
                  if (
                    status.status === 'failed' &&
                    process.env.NODE_ENV === 'development'
                  ) {
                    (window as any).systemChecklistDebug?.analyzeComponent(
                      component.id
                    );
                  }
                }}
                title={
                  status.status === 'failed'
                    ? `클릭하여 에러 분석 (에러: ${status.error})`
                    : component.description
                }
              >
                {/* 컴포넌트 아이콘 */}
                <span className='text-2xl mr-3'>
                  {getComponentIcon(component.name)}
                </span>

                {/* 상태 정보 */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-white truncate'>
                      {component.name}
                    </span>
                    {getStatusIcon(status)}
                  </div>

                  {/* 진행률 바 (로딩 중일 때만) */}
                  {status.status === 'loading' && (
                    <div className='w-full bg-gray-600/30 rounded-full h-1 mt-2 overflow-hidden'>
                      <motion.div
                        className='h-full bg-blue-400 rounded-full'
                        initial={{ width: 0 }}
                        animate={{ width: `${status.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}

                  {/* 에러 메시지 (실패 시) */}
                  {status.status === 'failed' && status.error && (
                    <div className='mt-1 text-xs text-red-300 truncate'>
                      {status.error}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 상태 정보 */}
        <div className='mt-6 flex items-center justify-center space-x-6 text-sm'>
          <div className='flex items-center space-x-2'>
            <div className='w-2 h-2 bg-green-500 rounded-full' />
            <span className='text-gray-300'>완료 {completedCount}</span>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='w-2 h-2 bg-red-500 rounded-full' />
            <span className='text-gray-300'>실패 {failedCount}</span>
          </div>
        </div>

        {/* 에러 시 재시도 버튼 */}
        {failedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className='mt-4 text-center space-y-2'
          >
            <button
              onClick={() =>
                (window as any).systemChecklistDebug?.retryFailedComponents()
              }
              className='px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/50 
                         hover:bg-red-500/30 transition-colors text-sm mr-2'
            >
              재시도 (R)
            </button>

            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() =>
                  (window as any).systemChecklistDebug?.diagnoseNetwork()
                }
                className='px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg border border-yellow-500/50 
                           hover:bg-yellow-500/30 transition-colors text-sm'
              >
                네트워크 진단
              </button>
            )}
          </motion.div>
        )}

        {/* 완료 상태 표시 */}
        <AnimatePresence>
          {showCompleted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className='absolute inset-0 flex items-center justify-center 
                         bg-green-500/20 backdrop-blur-sm rounded-2xl border border-green-500/50'
              onAnimationComplete={() => {
                // 애니메이션 완료 즉시 다음 단계로 진행
                setShouldProceed(true);
                setTimeout(onComplete, 100);
              }}
            >
              <div className='text-center'>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className='w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4'
                >
                  <svg
                    className='w-8 h-8 text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={3}
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                </motion.div>
                <h3 className='text-xl font-bold text-white mb-2'>
                  시스템 초기화 완료
                </h3>
                <p className='text-sm text-gray-300 mb-3'>
                  다음 단계로 진행합니다...
                </p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className='inline-flex items-center space-x-2 px-4 py-2 bg-green-500/30 rounded-lg border border-green-400/50'
                >
                  <span className='text-sm text-green-200'>클릭하여 계속</span>
                  <svg
                    className='w-4 h-4 text-green-200'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13 7l5 5m0 0l-5 5m5-5H6'
                    />
                  </svg>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 스킵 버튼 (3초 후 표시) */}
        <AnimatePresence>
          {canSkip && !showCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className='mt-4 text-center'
            >
              <button
                onClick={onComplete}
                className='px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/50 
                           hover:bg-blue-500/30 transition-colors text-sm'
              >
                건너뛰기 (ESC)
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 단축키 안내 */}
        <div className='mt-6 text-center text-xs text-gray-500'>
          <p>ESC/Space: 건너뛰기 • R: 재시도 • D: 디버그 패널</p>
        </div>
      </motion.div>

      {/* 돌아가기 버튼 (왼쪽 아래 고정) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className='absolute bottom-6 left-6 z-20'
      >
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.history.back();
            }
          }}
          className='flex items-center space-x-2 px-4 py-2 bg-gray-700/80 backdrop-blur-sm 
                     text-gray-300 rounded-lg border border-gray-600/50 
                     hover:bg-gray-600/80 hover:text-white transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-blue-500/50'
          title='이전 페이지로 돌아가기'
        >
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M10 19l-7-7m0 0l7-7m-7 7h18'
            />
          </svg>
          <span className='text-sm'>돌아가기</span>
        </button>
      </motion.div>
    </div>
  );
}
