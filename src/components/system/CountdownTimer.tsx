/**
 * ⏱️ 30분 카운트다운 타이머 컴포넌트
 *
 * @description
 * 시스템 세션의 남은 시간을 실시간으로 표시합니다.
 * 클라이언트 사이드에서 완전히 처리되어 서버 부하를 최소화합니다.
 *
 * @features
 * - 실시간 카운트다운 (1초 간격)
 * - 시간 만료 시 자동 콜백 실행
 * - 시각적 상태 표시 (정상/주의/위험)
 * - 접근성 지원 (aria-label)
 */

import { AlertCircle, AlertTriangle, Clock } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface CountdownTimerProps {
  endTime: number; // 종료 시간 (Unix timestamp)
  onExpired?: () => void; // 시간 만료 시 콜백
  onWarning?: (minutesLeft: number) => void; // 경고 시 콜백 (5분, 1분 남았을 때)
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
}

interface TimeLeft {
  minutes: number;
  seconds: number;
  total: number;
}

export const CountdownTimer: FC<CountdownTimerProps> = ({
  endTime,
  onExpired,
  onWarning,
  className = '',
  size = 'md',
  showIcon = true,
  showLabel = true,
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    minutes: 0,
    seconds: 0,
    total: 0,
  });
  const [isExpired, setIsExpired] = useState(false);
  const [hasWarned5min, setHasWarned5min] = useState(false);
  const [hasWarned1min, setHasWarned1min] = useState(false);

  // 시간 계산 함수
  const calculateTimeLeft = useCallback((): TimeLeft => {
    const remaining = Math.max(0, endTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return {
      minutes,
      seconds,
      total: remaining,
    };
  }, [endTime]);

  // 타이머 업데이트
  useEffect(() => {
    if (isExpired) return;

    const updateTimer = () => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      // 시간 만료 체크
      if (newTimeLeft.total <= 0 && !isExpired) {
        setIsExpired(true);
        console.log('⏰ 시스템 세션 시간 만료');
        onExpired?.();
        return;
      }

      // 경고 알림 체크
      if (onWarning) {
        // 5분 경고
        if (
          newTimeLeft.minutes <= 5 &&
          newTimeLeft.minutes > 1 &&
          !hasWarned5min
        ) {
          setHasWarned5min(true);
          onWarning(newTimeLeft.minutes);
          console.log(`⚠️ 시스템 세션 ${newTimeLeft.minutes}분 남음`);
        }

        // 1분 경고
        if (newTimeLeft.minutes <= 1 && !hasWarned1min) {
          setHasWarned1min(true);
          onWarning(newTimeLeft.minutes);
          console.log('🚨 시스템 세션 1분 남음');
        }
      }
    };

    // 즉시 실행
    updateTimer();

    // 1초 간격으로 업데이트
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [
    endTime,
    isExpired,
    hasWarned5min,
    hasWarned1min,
    calculateTimeLeft,
    onExpired,
    onWarning,
  ]);

  // 스타일 설정
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-xl';
      default:
        return 'text-base';
    }
  };

  const getStatusColor = () => {
    if (isExpired) return 'text-red-600 bg-red-50 border-red-200';
    if (timeLeft.minutes <= 1) return 'text-red-600 bg-red-50 border-red-200';
    if (timeLeft.minutes <= 5)
      return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getIcon = () => {
    if (isExpired) return <AlertCircle className="h-4 w-4" />;
    if (timeLeft.minutes <= 1) return <AlertCircle className="h-4 w-4" />;
    if (timeLeft.minutes <= 5) return <AlertTriangle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  // 포맷된 시간 문자열
  const formatTime = () => {
    if (isExpired) return '00:00';
    return `${timeLeft.minutes.toString().padStart(2, '0')}:${timeLeft.seconds.toString().padStart(2, '0')}`;
  };

  // 상태 텍스트
  const getStatusText = () => {
    if (isExpired) return '시간 만료';
    if (timeLeft.minutes <= 1) return '곧 만료';
    if (timeLeft.minutes <= 5) return '주의';
    return '정상';
  };

  // 접근성 레이블
  const getAriaLabel = () => {
    if (isExpired) return '시스템 세션이 만료되었습니다';
    return `시스템 세션 남은 시간: ${timeLeft.minutes}분 ${timeLeft.seconds}초`;
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${getStatusColor()} ${getSizeClasses()} ${className} `}
      role="timer"
      aria-label={getAriaLabel()}
      aria-live="polite"
    >
      {showIcon && getIcon()}

      <div className="flex flex-col items-center">
        <div className="font-mono font-semibold tracking-wider">
          {formatTime()}
        </div>

        {showLabel && (
          <div className="text-xs opacity-75">{getStatusText()}</div>
        )}
      </div>
    </div>
  );
};

// 시간 포맷팅 유틸리티 함수들
export const formatTimeRemaining = (endTime: number): string => {
  const remaining = Math.max(0, endTime - Date.now());
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const getTimeRemainingInMinutes = (endTime: number): number => {
  const remaining = Math.max(0, endTime - Date.now());
  return Math.floor(remaining / 60000);
};

export const isTimeExpired = (endTime: number): boolean => {
  return Date.now() >= endTime;
};
