/**
 * 🕒 타이머 디버그 패널
 *
 * 시스템 전체의 타이머 상태를 실시간으로 모니터링
 */

'use client';

import type React from 'react';

interface TimerStatus {
  id: string;
  interval: number;
  priority: string;
  lastRun?: number;
  errorCount?: number;
  nextRun: number;
}

export const TimerDebugPanel: React.FC = () => {
  // 타이머 디버그 패널 제거됨 (웹 알람 삭제에 따라)
  return null;
};
