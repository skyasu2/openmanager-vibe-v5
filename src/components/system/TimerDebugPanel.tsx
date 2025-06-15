/**
 * 🕒 타이머 디버그 패널
 * 
 * 시스템 전체의 타이머 상태를 실시간으로 모니터링
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { timerManager } from '../../utils/TimerManager';

interface TimerStatus {
  id: string;
  interval: number;
  priority: string;
  lastRun?: number;
  errorCount?: number;
  nextRun: number;
}

export const TimerDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [timerStatus, setTimerStatus] = useState<{
    totalTimers: number;
    activeTimers: number;
    timers: TimerStatus[];
  }>({ totalTimers: 0, activeTimers: 0, timers: [] });

  // 🔄 10초마다 타이머 상태 업데이트 (성능 최적화)
  useEffect(() => {
    const updateStatus = () => {
      const status = timerManager.getStatus();
      setTimerStatus(status);
    };

    updateStatus(); // 초기 로드
          const interval = setInterval(updateStatus, 20000); // 20초로 통일 (3초 → 20초로 최적화)

    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - timestamp;
    if (diff < 1000) return 'Just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    return `${Math.floor(diff / 60000)}m ago`;
  };

  const formatNextRun = (nextRun: number) => {
    const diff = nextRun - Date.now();
    if (diff <= 0) return 'Now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
    return `${Math.floor(diff / 60000)}m`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 bg-gray-800 text-white p-2 rounded-lg shadow-lg hover:bg-gray-700"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        🕒 Timers ({timerStatus.activeTimers})
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 z-50 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl p-4 w-96 max-h-96 overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Timer Monitor
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
          <div className="text-blue-600 dark:text-blue-400 font-medium">Total</div>
          <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
            {timerStatus.totalTimers}
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
          <div className="text-green-600 dark:text-green-400 font-medium">Active</div>
          <div className="text-lg font-bold text-green-800 dark:text-green-200">
            {timerStatus.activeTimers}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {timerStatus.timers.map((timer) => (
          <motion.div
            key={timer.id}
            className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
            layout
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-900 dark:text-white text-sm">
                {timer.id}
              </span>
              <span className={`text-xs font-medium ${getPriorityColor(timer.priority)}`}>
                {timer.priority}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div>
                <div className="font-medium">Interval</div>
                <div>{timer.interval / 1000}s</div>
              </div>
              <div>
                <div className="font-medium">Last Run</div>
                <div>{formatTime(timer.lastRun || 0)}</div>
              </div>
              <div>
                <div className="font-medium">Next Run</div>
                <div>{formatNextRun(timer.nextRun)}</div>
              </div>
            </div>

            {timer.errorCount && timer.errorCount > 0 && (
              <div className="mt-2 text-xs text-red-500">
                ⚠️ Errors: {timer.errorCount}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex space-x-2">
        <button
          onClick={() => timerManager.toggleByPriority('low', false)}
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
        >
          Pause Low
        </button>
        <button
          onClick={() => timerManager.cleanup()}
          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
        >
          Cleanup All
        </button>
      </div>
    </motion.div>
  );
}; 