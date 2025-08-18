/**
 * 🕐 실시간 시계 컴포넌트
 *
 * 성능 최적화를 위해 분리된 독립 컴포넌트
 * - 매초 업데이트가 다른 컴포넌트에 영향 주지 않음
 * - memo로 불필요한 리렌더링 방지
 * - 자동 정리 기능 포함
 */

import { Clock } from 'lucide-react';
import { memo, useEffect, useState } from 'react';

interface RealtimeClockProps {
  format?: '12h' | '24h';
  showIcon?: boolean;
  className?: string;
  locale?: string;
}

export const RealtimeClock = memo(function RealtimeClock({
  format = '24h',
  showIcon = true,
  className = '',
  locale = 'ko-KR',
}: RealtimeClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // 다음 초가 시작될 때까지의 시간 계산 (정확한 초 단위 업데이트)
    const now = new Date();
    const msUntilNextSecond = 1000 - now.getMilliseconds();

    // 첫 업데이트를 다음 초 시작 시점에 맞춤
    const firstTimeout = setTimeout(() => {
      setCurrentTime(new Date());

      // 이후 정확히 1초마다 업데이트
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      // 정리 함수에서 interval 정리
      return () => clearInterval(interval);
    }, msUntilNextSecond);

    // 정리 함수
    return () => {
      clearTimeout(firstTimeout);
    };
  }, []); // 빈 의존성 배열 - 컴포넌트 마운트 시 한 번만 실행

  const formatTime = () => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: format === '12h',
    };

    return currentTime.toLocaleTimeString(locale, options);
  };

  return (
    <div
      className={`flex items-center space-x-2 text-gray-600 dark:text-gray-300 ${className}`}
    >
      {showIcon && <Clock className="h-5 w-5" />}
      <span className="font-mono text-sm">{formatTime()}</span>
    </div>
  );
});

// 날짜 포함 버전
interface DateTimeClockProps extends RealtimeClockProps {
  showDate?: boolean;
  dateFormat?: 'short' | 'long';
}

export const DateTimeClock = memo(function DateTimeClock({
  showDate = true,
  dateFormat = 'short',
  ...clockProps
}: DateTimeClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions =
      dateFormat === 'short'
        ? { month: 'short', day: 'numeric' }
        : { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    return currentTime.toLocaleDateString(
      clockProps.locale || 'ko-KR',
      options
    );
  };

  return (
    <div className="flex flex-col items-end">
      {showDate && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate()}
        </span>
      )}
      <RealtimeClock {...clockProps} />
    </div>
  );
});
