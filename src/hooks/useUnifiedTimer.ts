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
  // 🚀 Phase 3 개선: 고급 타이머 옵션
  priority?: 'low' | 'normal' | 'high'; // 작업 우선순위
  maxRetries?: number; // 실패 시 최대 재시도 횟수
  retryCount?: number; // 현재 재시도 횟수
}

interface UseUnifiedTimerReturn {
  registerTask: (task: TimerTask) => void;
  unregisterTask: (taskId: string) => void;
  enableTask: (taskId: string) => void;
  disableTask: (taskId: string) => void;
  getAllTasks: () => TimerTask[];
  getTaskStatus: (taskId: string) => boolean;
  // 🚀 Phase 3 개선: BF-Cache 및 페이지 생명주기 관리
  pauseAllTasks: () => void;
  resumeAllTasks: () => void;
  getTimerStats: () => { activeTasks: number; totalTasks: number; isRunning: boolean; };
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
  const [isPaused, setIsPaused] = useState(false); // 🚀 Phase 3: 일시정지 상태 관리

  // 메인 타이머 실행기 (성능 최적화 + 재시도 로직)
  const runTimer = useCallback(() => {
    // 🚀 Phase 3: 일시정지 상태에서는 실행하지 않음
    if (isPaused) return;
    
    const now = Date.now();
    const activeTasks: TimerTask[] = [];
    
    // 🎯 Phase 2 개선: 활성 작업만 필터링하여 순회 최적화 + 우선순위 정렬
    tasksRef.current.forEach((task) => {
      if (task.enabled && (!task.lastRun || (now - task.lastRun >= task.interval))) {
        activeTasks.push(task);
      }
    });
    
    // 🚀 Phase 3: 우선순위별 정렬 (high > normal > low)
    activeTasks.sort((a, b) => {
      const priorityMap = { high: 3, normal: 2, low: 1 };
      return (priorityMap[b.priority || 'normal'] || 2) - (priorityMap[a.priority || 'normal'] || 2);
    });
    
    // 🔄 우선순위별 순차 실행으로 안정성 향상
    activeTasks.forEach(async (task) => {
      try {
        await task.callback();
        task.lastRun = now;
        task.retryCount = 0; // 성공 시 재시도 카운트 초기화
      } catch (error) {
        console.warn(`⚠️ Timer task ${task.id} failed:`, error);
        
        // 🔄 Phase 3: 재시도 로직
        if (task.maxRetries && (task.retryCount || 0) < task.maxRetries) {
          task.retryCount = (task.retryCount || 0) + 1;
          console.log(`🔄 Retrying task ${task.id} (${task.retryCount}/${task.maxRetries})`);
        } else if (task.maxRetries) {
          console.error(`❌ Task ${task.id} failed after ${task.maxRetries} retries, disabling`);
          task.enabled = false; // 최대 재시도 후 자동 비활성화
        }
      }
    });
  }, [isPaused]);

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

  // 🚀 Phase 3: 모든 작업 일시정지
  const pauseAllTasks = useCallback(() => {
    setIsPaused(true);
    console.log('⏸️ All timer tasks paused');
  }, []);

  // 🚀 Phase 3: 모든 작업 재개
  const resumeAllTasks = useCallback(() => {
    setIsPaused(false);
    console.log('▶️ All timer tasks resumed');
  }, []);

  // 🚀 Phase 3: 타이머 통계 조회
  const getTimerStats = useCallback(() => {
    const taskArray = Array.from(tasks.values());
    return {
      activeTasks: taskArray.filter(t => t.enabled).length,
      totalTasks: taskArray.length,
      isRunning: !!timerRef.current && !isPaused
    };
  }, [tasks, isPaused]);

  // 메인 타이머 시작/정지 (BF-Cache 호환성 개선 + 페이지 생명주기 관리)
  useEffect(() => {
    const hasActiveTasks = Array.from(tasks.values()).some(task => task.enabled);
    
    if (hasActiveTasks && !isPaused) {
      // ⚡ Phase 2 개선: 활성 작업 존재하고 일시정지 상태가 아닐 때만 타이머 시작
      if (!timerRef.current) {
        timerRef.current = setInterval(runTimer, baseInterval);
        console.log(`🕒 Unified timer started (${baseInterval}ms) with ${tasks.size} total tasks`);
      }
    } else {
      // 🔄 모든 작업이 비활성화되거나 일시정지 상태면 타이머 정지
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        const reason = isPaused ? 'paused' : 'no active tasks';
        console.log(`⏹️ Unified timer stopped - ${reason}`);
      }
    }

    // 🚀 Phase 3: BF-Cache 호환성을 위한 페이지 생명주기 이벤트 리스너
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('🔄 Page hidden - pausing timer tasks for BF-Cache compatibility');
        setIsPaused(true);
      } else {
        console.log('👀 Page visible - resuming timer tasks');
        setIsPaused(false);
      }
    };

    // 🛡️ BF-Cache 호환성: 페이지 숨김/표시 이벤트 감지
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 정리 함수
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tasks, baseInterval, isPaused, runTimer]); // isPaused 추가로 완전한 상태 감지

  return {
    registerTask,
    unregisterTask,
    enableTask,
    disableTask,
    getAllTasks,
    getTaskStatus,
    // 🚀 Phase 3: 새로운 고급 기능들
    pauseAllTasks,
    resumeAllTasks,
    getTimerStats,
  };
}

/**
 * 🎯 자주 사용되는 타이머 작업들을 위한 헬퍼 (Phase 3 개선)
 */
export const createTimerTask = {
  authCheck: (callback: () => void): TimerTask => ({
    id: 'auth-check',
    interval: 10000, // 10초
    callback,
    enabled: true,
    priority: 'high', // 🚀 Phase 3: 인증은 높은 우선순위
    maxRetries: 3
  }),
  
  systemStatus: (callback: () => void): TimerTask => ({
    id: 'system-status',
    interval: 300000, // 5분
    callback,
    enabled: true,
    priority: 'normal', // 🚀 Phase 3: 일반 우선순위
    maxRetries: 2
  }),
  
  systemShutdown: (callback: () => void): TimerTask => ({
    id: 'system-shutdown',
    interval: 5000, // 5초
    callback,
    enabled: true,
    priority: 'high', // 🚀 Phase 3: 자동종료는 높은 우선순위
    maxRetries: 1
  }),
  
  systemIntegration: (callback: () => void): TimerTask => ({
    id: 'system-integration',
    interval: 5000, // 5초
    callback,
    enabled: true,
    priority: 'normal', // 🚀 Phase 3: 일반 우선순위
    maxRetries: 2
  }),

  customTask: (id: string, interval: number, callback: () => void, options?: { 
    priority?: 'low' | 'normal' | 'high'; 
    maxRetries?: number; 
  }): TimerTask => ({
    id,
    interval,
    callback,
    enabled: true,
    priority: options?.priority || 'normal', // 🚀 Phase 3: 사용자 정의 우선순위
    maxRetries: options?.maxRetries || 1
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