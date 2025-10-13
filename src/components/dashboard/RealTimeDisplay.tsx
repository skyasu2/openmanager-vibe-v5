'use client';

import { Clock } from 'lucide-react';
import React, { useEffect, useState, memo } from 'react';

/**
 * 실시간 시간 표시 컴포넌트
 *
 * @description
 * - 현재 시간과 날짜를 1초마다 업데이트
 * - 순수 UI 컴포넌트 (외부 상태 없음)
 * - memo로 최적화 (props 없음)
 *
 * @example
 * ```tsx
 * <RealTimeDisplay />
 * ```
 */
export const RealTimeDisplay = memo(function RealTimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Clock className="h-4 w-4 text-blue-500" />
      <span>
        {currentTime.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </span>
      <span className="text-gray-700">|</span>
      <span>
        {currentTime.toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric',
          weekday: 'short',
        })}
      </span>
    </div>
  );
});

RealTimeDisplay.displayName = 'RealTimeDisplay';
