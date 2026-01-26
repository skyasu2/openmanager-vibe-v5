'use client';

/**
 * Cloud Run Status Indicator
 * AI 엔진의 준비 상태를 표시하고 웜업을 트리거하는 컴포넌트
 *
 * 기능:
 * - Ready/Not Ready 상태 표시
 * - 웜업 버튼 (콜드 스타트 시)
 * - 응답 시간(latency) 표시
 * - Error Boundary로 렌더링 오류 격리
 */

import { Activity, AlertCircle, Loader2, Zap } from 'lucide-react';
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { logger } from '@/lib/logging';

type CloudRunStatus = 'unknown' | 'checking' | 'ready' | 'cold' | 'error';

interface CloudRunStatusIndicatorProps {
  /** 컴팩트 모드 (아이콘만) */
  compact?: boolean;
  /** 자동 체크 간격 (ms), 0이면 비활성화 */
  autoCheckInterval?: number;
  /** 상태 변경 콜백 */
  onStatusChange?: (status: CloudRunStatus, latency?: number) => void;
}

export function CloudRunStatusIndicator({
  compact = false,
  autoCheckInterval = 300000, // 5분 - 포트폴리오 무료 티어 최적화
  onStatusChange,
}: CloudRunStatusIndicatorProps) {
  const [status, setStatus] = useState<CloudRunStatus>('unknown');
  const [latency, setLatency] = useState<number | null>(null);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [warmupTime, setWarmupTime] = useState<number | null>(null);

  // 헬스 체크 함수
  const checkHealth = useCallback(async () => {
    setStatus('checking');
    const startTime = Date.now();

    try {
      const response = await fetch('/api/health?service=ai', {
        method: 'GET',
        cache: 'no-store',
      });

      const elapsed = Date.now() - startTime;
      const data = await response.json();

      if (response.ok && data.status === 'ok') {
        const serverLatency = data.latency || elapsed;
        setLatency(serverLatency);
        // 2초 이하면 Ready, 초과하면 Cold 상태로 판단
        const newStatus = serverLatency < 2000 ? 'ready' : 'cold';
        setStatus(newStatus);
        onStatusChange?.(newStatus, serverLatency);
      } else {
        setStatus('cold');
        setLatency(null);
        onStatusChange?.('cold');
      }
    } catch {
      setStatus('error');
      setLatency(null);
      onStatusChange?.('error');
    }

    setLastCheckTime(new Date());
  }, [onStatusChange]);

  // 웜업 함수
  const triggerWarmup = useCallback(async () => {
    if (isWarmingUp) return;

    setIsWarmingUp(true);
    setWarmupTime(null);
    const startTime = Date.now();

    try {
      // 먼저 wake-up 신호 전송
      await fetch('/api/ai/wake-up', {
        method: 'POST',
      });

      // 실제 준비 완료까지 폴링 (최대 60초)
      const maxWaitTime = 60000;
      const pollInterval = 2000;
      let waited = 0;

      while (waited < maxWaitTime) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        waited += pollInterval;

        try {
          const healthResponse = await fetch('/api/health?service=ai', {
            cache: 'no-store',
          });
          const healthData = await healthResponse.json();

          if (healthResponse.ok && healthData.status === 'ok') {
            const totalTime = Date.now() - startTime;
            setWarmupTime(totalTime);
            setLatency(healthData.latency);
            setStatus('ready');
            onStatusChange?.('ready', healthData.latency);
            break;
          }
        } catch {
          // 계속 폴링
        }
      }

      if (waited >= maxWaitTime) {
        setStatus('error');
        onStatusChange?.('error');
      }
    } catch {
      setStatus('error');
      onStatusChange?.('error');
    } finally {
      setIsWarmingUp(false);
      setLastCheckTime(new Date());
    }
  }, [isWarmingUp, onStatusChange]);

  // 초기 체크 및 자동 갱신
  // 🛡️ 페이지가 보이지 않을 때는 헬스 체크 중지 (과도한 동작 방지)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let isActive = true; // 컴포넌트 마운트 상태 추적

    // 페이지 가시성 체크 함수
    const isPageVisible = () =>
      typeof document !== 'undefined' && document.visibilityState === 'visible';

    // 초기 체크 (페이지가 보일 때만)
    if (isPageVisible()) {
      void checkHealth();
    }

    // 자동 갱신 설정
    if (autoCheckInterval > 0) {
      intervalId = setInterval(() => {
        // 🛡️ 컴포넌트가 활성 상태이고, 웜업 중이 아니고, 페이지가 보일 때만 체크
        if (isActive && !isWarmingUp && isPageVisible()) {
          void checkHealth();
        }
      }, autoCheckInterval);
    }

    // 페이지 가시성 변경 핸들러
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && intervalId) {
        // 페이지가 숨겨지면 interval 일시 중지 (메모리에서는 유지)
        clearInterval(intervalId);
        intervalId = null;
      } else if (
        document.visibilityState === 'visible' &&
        !intervalId &&
        autoCheckInterval > 0
      ) {
        // 페이지가 다시 보이면 interval 재시작 및 즉시 체크
        void checkHealth();
        intervalId = setInterval(() => {
          if (isActive && !isWarmingUp && isPageVisible()) {
            void checkHealth();
          }
        }, autoCheckInterval);
      }
    };

    // 가시성 변경 이벤트 리스너 등록
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // 🛡️ Cleanup: 컴포넌트 언마운트 시 모든 동작 0으로
    return () => {
      isActive = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener(
          'visibilitychange',
          handleVisibilityChange
        );
      }
    };
  }, [autoCheckInterval, checkHealth, isWarmingUp]);

  // 상태별 스타일 및 텍스트
  const getStatusConfig = () => {
    switch (status) {
      case 'ready':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          dotColor: 'bg-green-500',
          label: 'Ready',
          description: latency ? `${latency}ms` : '준비 완료',
        };
      case 'cold':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
          dotColor: 'bg-yellow-500',
          label: 'Cold',
          description: '웜업 필요',
        };
      case 'checking':
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          dotColor: 'bg-blue-500',
          label: '확인 중',
          description: '상태 확인 중...',
        };
      case 'error':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          dotColor: 'bg-red-500',
          label: 'Error',
          description: '연결 실패',
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          dotColor: 'bg-gray-500',
          label: '확인 중',
          description: '상태 미확인',
        };
    }
  };

  const config = getStatusConfig();

  // 컴팩트 모드 (아이콘만)
  if (compact) {
    return (
      <button
        type="button"
        onClick={() =>
          status === 'cold' || status === 'error'
            ? triggerWarmup()
            : checkHealth()
        }
        disabled={isWarmingUp || status === 'checking'}
        className={`group relative flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${config.bgColor} ${config.borderColor} hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50`}
        title={`AI Engine: ${config.label} (${config.description})`}
        aria-label={`AI 엔진 상태: ${config.label}`}
      >
        {isWarmingUp || status === 'checking' ? (
          <Loader2 className={`h-4 w-4 animate-spin ${config.textColor}`} />
        ) : (
          <Activity className={`h-4 w-4 ${config.textColor}`} />
        )}

        {/* 상태 표시 점 */}
        <span
          className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ${config.dotColor} ${status === 'ready' ? 'animate-pulse' : ''}`}
        />
      </button>
    );
  }

  // 풀 모드
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${config.bgColor} ${config.borderColor}`}
    >
      {/* 상태 표시 */}
      <div className="flex items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${config.dotColor} ${status === 'ready' ? 'animate-pulse' : ''}`}
        />
        <span className={`text-xs font-medium ${config.textColor}`}>
          {config.label}
        </span>
      </div>

      {/* 레이턴시 또는 웜업 시간 표시 */}
      {(latency || warmupTime) && (
        <span className="text-xs text-gray-500">
          {warmupTime
            ? `웜업: ${(warmupTime / 1000).toFixed(1)}s`
            : `${latency}ms`}
        </span>
      )}

      {/* 웜업 버튼 (cold/error 상태일 때만) */}
      {(status === 'cold' || status === 'error') && (
        <button
          type="button"
          onClick={triggerWarmup}
          disabled={isWarmingUp}
          className="flex items-center gap-1 rounded bg-yellow-500 px-2 py-0.5 text-xs font-medium text-white transition-colors hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
          title="AI 엔진 웜업 시작"
        >
          {isWarmingUp ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>웜업 중...</span>
            </>
          ) : (
            <>
              <Zap className="h-3 w-3" />
              <span>웜업</span>
            </>
          )}
        </button>
      )}

      {/* 새로고침 버튼 (ready 상태일 때) */}
      {status === 'ready' && (
        <button
          type="button"
          onClick={() => void checkHealth()}
          className="text-xs text-gray-400 hover:text-gray-600"
          title={
            lastCheckTime
              ? `마지막 확인: ${lastCheckTime.toLocaleTimeString()}`
              : '상태 새로고침'
          }
        >
          ↻
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Error Boundary
// =============================================================================

interface CloudRunErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class CloudRunErrorBoundary extends Component<
  { children: ReactNode; compact?: boolean },
  CloudRunErrorBoundaryState
> {
  constructor(props: { children: ReactNode; compact?: boolean }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): CloudRunErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('[CloudRunStatusIndicator] 렌더링 오류:', error);
    logger.error(
      '[CloudRunStatusIndicator] 컴포넌트 스택:',
      errorInfo.componentStack
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const { compact } = this.props;

      if (compact) {
        return (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-100"
            title="상태 표시 오류"
          >
            <AlertCircle className="h-4 w-4 text-gray-400" />
          </div>
        );
      }

      return (
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
          <AlertCircle className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500">상태 확인 불가</span>
        </div>
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// Wrapped Export
// =============================================================================

function CloudRunStatusIndicatorWithBoundary(
  props: CloudRunStatusIndicatorProps
) {
  return (
    <CloudRunErrorBoundary compact={props.compact}>
      <CloudRunStatusIndicator {...props} />
    </CloudRunErrorBoundary>
  );
}

export default CloudRunStatusIndicatorWithBoundary;
