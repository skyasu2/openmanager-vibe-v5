/**
 * AI Job 폴링 훅
 *
 * @description Job 상태를 주기적으로 확인하고 완료 시 결과 반환
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { JobStatusResponse, JobStatus } from '@/types/ai-jobs';

// ============================================
// 타입 정의
// ============================================

export interface UseJobPollingOptions {
  /** 폴링 간격 (ms), 기본값: 2000 */
  interval?: number;
  /** 최대 폴링 횟수, 기본값: 무제한 */
  maxAttempts?: number;
  /** 완료 시 콜백 */
  onComplete?: (result: JobStatusResponse) => void;
  /** 실패 시 콜백 */
  onError?: (error: string) => void;
  /** 진행률 변경 시 콜백 */
  onProgress?: (progress: number, step: string | null) => void;
  /** 자동 시작 여부, 기본값: true */
  autoStart?: boolean;
}

export interface UseJobPollingReturn {
  /** 현재 Job 상태 */
  job: JobStatusResponse | null;
  /** 폴링 중 여부 */
  isPolling: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 폴링 시작 */
  startPolling: () => void;
  /** 폴링 중지 */
  stopPolling: () => void;
  /** Job 취소 */
  cancelJob: () => Promise<void>;
}

// ============================================
// 상수
// ============================================

const DEFAULT_INTERVAL = 2000;
const TERMINAL_STATUSES: JobStatus[] = ['completed', 'failed', 'cancelled'];

// ============================================
// 훅 구현
// ============================================

/**
 * AI Job 상태 폴링 훅
 *
 * @param jobId - 폴링할 Job ID
 * @param options - 폴링 옵션
 * @returns 폴링 상태 및 제어 함수
 *
 * @example
 * ```tsx
 * const { job, isPolling, error, cancelJob } = useJobPolling(jobId, {
 *   onComplete: (result) => console.log('완료:', result),
 *   onProgress: (progress, step) => console.log(`${progress}%: ${step}`),
 * });
 * ```
 */
export function useJobPolling(
  jobId: string | null,
  options: UseJobPollingOptions = {}
): UseJobPollingReturn {
  const {
    interval = DEFAULT_INTERVAL,
    maxAttempts,
    onComplete,
    onError,
    onProgress,
    autoStart = true,
  } = options;

  const [job, setJob] = useState<JobStatusResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attemptCountRef = useRef(0);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressRef = useRef<number>(-1);

  /**
   * Job 상태 조회
   */
  const fetchJobStatus = useCallback(async (): Promise<JobStatusResponse | null> => {
    if (!jobId) return null;

    try {
      const response = await fetch(`/api/ai/jobs/${jobId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch job status';
      throw new Error(message);
    }
  }, [jobId]);

  /**
   * 단일 폴링 실행
   */
  const poll = useCallback(async () => {
    try {
      const jobData = await fetchJobStatus();
      if (!jobData) return;

      setJob(jobData);
      setError(null);

      // 진행률 변경 콜백
      if (onProgress && jobData.progress !== lastProgressRef.current) {
        lastProgressRef.current = jobData.progress;
        onProgress(jobData.progress, jobData.currentStep);
      }

      // 종료 상태 확인
      if (TERMINAL_STATUSES.includes(jobData.status)) {
        setIsPolling(false);

        if (jobData.status === 'completed') {
          onComplete?.(jobData);
        } else if (jobData.status === 'failed') {
          onError?.(jobData.error || 'Job failed');
        }
        return;
      }

      // 최대 시도 횟수 확인
      attemptCountRef.current += 1;
      if (maxAttempts && attemptCountRef.current >= maxAttempts) {
        setIsPolling(false);
        setError('Maximum polling attempts reached');
        onError?.('Maximum polling attempts reached');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Polling error';
      setError(message);
      // 에러 시에도 폴링 계속 (네트워크 일시 장애 대응)
    }
  }, [fetchJobStatus, maxAttempts, onComplete, onError, onProgress]);

  /**
   * 폴링 시작
   */
  const startPolling = useCallback(() => {
    if (!jobId || isPolling) return;

    setIsPolling(true);
    setError(null);
    attemptCountRef.current = 0;
    lastProgressRef.current = -1;

    // 즉시 첫 폴링 실행
    poll();

    // 인터벌 설정
    intervalIdRef.current = setInterval(poll, interval);
  }, [jobId, isPolling, poll, interval]);

  /**
   * 폴링 중지
   */
  const stopPolling = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    setIsPolling(false);
  }, []);

  /**
   * Job 취소
   */
  const cancelJob = useCallback(async () => {
    if (!jobId) return;

    try {
      const response = await fetch(`/api/ai/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to cancel job');
      }

      // 취소 후 상태 업데이트
      stopPolling();
      setJob((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cancel failed';
      setError(message);
      throw err;
    }
  }, [jobId, stopPolling]);

  // 자동 시작
  useEffect(() => {
    if (autoStart && jobId) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [jobId, autoStart, startPolling, stopPolling]);

  // Job ID 변경 시 리셋
  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setError(null);
      stopPolling();
    }
  }, [jobId, stopPolling]);

  return {
    job,
    isPolling,
    error,
    startPolling,
    stopPolling,
    cancelJob,
  };
}

// ============================================
// 유틸리티 훅
// ============================================

/**
 * Job 생성 + 폴링 통합 훅
 *
 * @example
 * ```tsx
 * const { submitJob, job, isSubmitting, isPolling } = useJobSubmit();
 *
 * const handleSubmit = async () => {
 *   await submitJob('분석', '모든 서버 상태 분석해줘');
 * };
 * ```
 */
export function useJobSubmit() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const polling = useJobPolling(jobId);

  const submitJob = useCallback(
    async (
      type: string,
      query: string,
      options?: { priority?: string; sessionId?: string }
    ) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const response = await fetch('/api/ai/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, query, options }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to submit job');
        }

        const data = await response.json();
        setJobId(data.jobId);

        return data.jobId;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Submit failed';
        setSubmitError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setJobId(null);
    setSubmitError(null);
    polling.stopPolling();
  }, [polling]);

  return {
    submitJob,
    reset,
    jobId,
    job: polling.job,
    isSubmitting,
    isPolling: polling.isPolling,
    error: submitError || polling.error,
    cancelJob: polling.cancelJob,
  };
}

export default useJobPolling;
