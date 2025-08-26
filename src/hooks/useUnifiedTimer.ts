/**
 * 🕒 Unified Timer Manager
 *
 * 다중 setInterval 문제 해결을 위한 통합 타이머 시스템
 * 모든 시간 기반 작업을 단일 타이머로 관리하여 성능 최적화
 * 베르셀 프로덕션 환경에서의 새로고침 문제 해결
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface TimerTask {
  id: string;
  interval: number; // 실행 주기 (밀리초)
  callback: () => void | Promise<void>;
  enabled: boolean;
  lastRun?: number;
}

interface UseUnifiedTimerReturn {
  registerTask: (task: TimerTask) => void;
  unregisterTask: (taskId: string) => void;
  enableTask: (taskId: string) => void;
  disableTask: (taskId: string) => void;
  getAllTasks: () => TimerTask[];
  getTaskStatus: (taskId: string) => boolean;
}

/**
 * 🎯 통합 타이머 매니저 Hook
 * 
 * 사용법:
 * ```typescript
 * const timer = useUnifiedTimer();
 * 
 * useEffect(() => {
 *   timer.registerTask({
 *     id: 'auth-check',
 *     interval: 10000, // 10초
 *     callback: () => checkAuthStatus(),
 *     enabled: true
 *   });
 * }, []);
 * ```
 */
export function useUnifiedTimer(baseInterval = 1000): UseUnifiedTimerReturn {
  const [tasks, setTasks] = useState<Map<string, TimerTask>>(new Map());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tasksRef = useRef<Map<string, TimerTask>>(new Map());

  // 메인 타이머 실행기
  const runTimer = useCallback(() => {
    const now = Date.now();
    
    tasksRef.current.forEach(async (task) => {
      if (!task.enabled) return;
      
      const shouldRun = !task.lastRun || (now - task.lastRun >= task.interval);
      
      if (shouldRun) {
        try {
          await task.callback();
          task.lastRun = now;
        } catch (error) {
          console.warn(`⚠️ Timer task ${task.id} failed:`, error);
        }
      }
    });
  }, []);

  // 작업 등록
  const registerTask = useCallback((task: TimerTask) => {
    const newTask = {
      ...task,
      lastRun: Date.now()
    };
    
    setTasks(prev => {
      const updated = new Map(prev);
      updated.set(task.id, newTask);
      tasksRef.current = updated;
      return updated;
    });
    
    console.log(`✅ Timer task registered: ${task.id} (${task.interval}ms)`);
  }, []);

  // 작업 제거
  const unregisterTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const updated = new Map(prev);
      updated.delete(taskId);
      tasksRef.current = updated;
      return updated;
    });
    
    console.log(`❌ Timer task unregistered: ${taskId}`);
  }, []);

  // 작업 활성화
  const enableTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const updated = new Map(prev);
      const task = updated.get(taskId);
      if (task) {
        task.enabled = true;
        task.lastRun = Date.now(); // 즉시 실행 방지
        tasksRef.current = updated;
      }
      return updated;
    });
  }, []);

  // 작업 비활성화
  const disableTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const updated = new Map(prev);
      const task = updated.get(taskId);
      if (task) {
        task.enabled = false;
        tasksRef.current = updated;
      }
      return updated;
    });
  }, []);

  // 모든 작업 조회
  const getAllTasks = useCallback(() => {
    return Array.from(tasks.values());
  }, [tasks]);

  // 작업 상태 조회
  const getTaskStatus = useCallback((taskId: string) => {
    const task = tasks.get(taskId);
    return task?.enabled || false;
  }, [tasks]);

  // 메인 타이머 시작/정지
  useEffect(() => {
    if (tasks.size > 0) {
      // 활성 작업이 있으면 타이머 시작
      timerRef.current = setInterval(runTimer, baseInterval);
      console.log(`🕒 Unified timer started (${baseInterval}ms) with ${tasks.size} tasks`);
    } else {
      // 활성 작업이 없으면 타이머 정지
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        console.log('⏹️ Unified timer stopped');
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [tasks.size, runTimer, baseInterval]);

  return {
    registerTask,
    unregisterTask,
    enableTask,
    disableTask,
    getAllTasks,
    getTaskStatus,
  };
}

/**
 * 🎯 자주 사용되는 타이머 작업들을 위한 헬퍼
 */
export const createTimerTask = {
  authCheck: (callback: () => void): TimerTask => ({
    id: 'auth-check',
    interval: 10000, // 10초
    callback,
    enabled: true
  }),
  
  systemStatus: (callback: () => void): TimerTask => ({
    id: 'system-status',
    interval: 300000, // 5분
    callback,
    enabled: true
  }),
  
  systemShutdown: (callback: () => void): TimerTask => ({
    id: 'system-shutdown',
    interval: 5000, // 5초
    callback,
    enabled: true
  }),
  
  systemIntegration: (callback: () => void): TimerTask => ({
    id: 'system-integration',
    interval: 5000, // 5초
    callback,
    enabled: true
  }),

  customTask: (id: string, interval: number, callback: () => void): TimerTask => ({
    id,
    interval,
    callback,
    enabled: true
  })
};

/**
 * 🎨 디버깅용 타이머 통계
 */
export function useTimerStats() {
  const [stats, setStats] = useState({
    totalTasks: 0,
    activeTasks: 0,
    totalExecutions: 0,
    lastUpdate: new Date()
  });

  const updateStats = useCallback((tasks: TimerTask[]) => {
    const activeTasks = tasks.filter(t => t.enabled).length;
    setStats(prev => ({
      totalTasks: tasks.length,
      activeTasks,
      totalExecutions: prev.totalExecutions + activeTasks,
      lastUpdate: new Date()
    }));
  }, []);

  return { stats, updateStats };
}