/**
 * useAsyncAIQuery Hook
 *
 * Provides async AI query functionality with real-time progress updates.
 * Uses Job Queue + SSE for long-running queries to avoid Vercel timeout.
 *
 * Flow:
 * 1. Create job via POST /api/ai/jobs
 * 2. Connect to SSE stream: /api/ai/jobs/:id/stream
 * 3. Receive real-time progress updates
 * 4. Get final result when completed
 *
 * @example
 * ```tsx
 * const { sendQuery, progress, result, error, isLoading, cancel } = useAsyncAIQuery();
 *
 * const handleSubmit = async () => {
 *   const response = await sendQuery('서버 상태를 분석해주세요');
 *   if (response.success) {
 *     console.log('Result:', response.data);
 *   }
 * };
 * ```
 *
 * @version 1.0.0
 */

import { useCallback, useRef, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface AsyncQueryProgress {
  stage: string;
  progress: number; // 0-100
  message?: string;
  elapsedMs?: number;
}

export interface AsyncQueryResult {
  success: boolean;
  response?: string;
  targetAgent?: string;
  toolResults?: unknown[];
  processingTimeMs?: number;
  error?: string;
}

export interface AsyncQueryState {
  isLoading: boolean;
  isConnected: boolean;
  progress: AsyncQueryProgress | null;
  result: AsyncQueryResult | null;
  error: string | null;
  jobId: string | null;
}

export interface UseAsyncAIQueryOptions {
  /** Session ID for conversation context */
  sessionId?: string;
  /** Timeout in milliseconds (default: 120000) */
  timeout?: number;
  /** Callback when progress updates */
  onProgress?: (progress: AsyncQueryProgress) => void;
  /** Callback when result is received */
  onResult?: (result: AsyncQueryResult) => void;
  /** Callback when error occurs */
  onError?: (error: string) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useAsyncAIQuery(options: UseAsyncAIQueryOptions = {}) {
  const {
    sessionId,
    timeout = 120000,
    onProgress,
    onResult,
    onError,
  } = options;

  // State
  const [state, setState] = useState<AsyncQueryState>({
    isLoading: false,
    isConnected: false,
    progress: null,
    result: null,
    error: null,
    jobId: null,
  });

  // Refs for cleanup
  const eventSourceRef = useRef<EventSource | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cancel current query
  const cancel = useCallback(async () => {
    cleanup();

    if (state.jobId) {
      try {
        await fetch(`/api/ai/jobs/${state.jobId}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('[AsyncAI] Failed to cancel job:', e);
      }
    }

    setState((prev) => ({
      ...prev,
      isLoading: false,
      isConnected: false,
      error: 'Cancelled by user',
    }));
  }, [state.jobId, cleanup]);

  // Send query
  const sendQuery = useCallback(
    async (query: string): Promise<AsyncQueryResult> => {
      // Cleanup previous state
      cleanup();
      setState({
        isLoading: true,
        isConnected: false,
        progress: null,
        result: null,
        error: null,
        jobId: null,
      });

      return new Promise((resolve) => {
        const handleError = (error: string) => {
          cleanup();
          setState((prev) => ({
            ...prev,
            isLoading: false,
            isConnected: false,
            error,
          }));
          onError?.(error);
          resolve({ success: false, error });
        };

        const handleResult = (result: AsyncQueryResult) => {
          cleanup();
          setState((prev) => ({
            ...prev,
            isLoading: false,
            isConnected: false,
            result,
          }));
          onResult?.(result);
          resolve(result);
        };

        // Step 1: Create Job
        fetch('/api/ai/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            options: { sessionId },
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Failed to create job: ${response.status}`);
            }
            return response.json();
          })
          .then((data: { jobId: string; status: string }) => {
            const { jobId } = data;

            setState((prev) => ({ ...prev, jobId }));

            // Step 2: Connect to SSE Stream
            const eventSource = new EventSource(`/api/ai/jobs/${jobId}/stream`);
            eventSourceRef.current = eventSource;

            // Handle connection
            eventSource.addEventListener('connected', () => {
              setState((prev) => ({ ...prev, isConnected: true }));
            });

            // Handle progress updates
            eventSource.addEventListener('progress', (event) => {
              try {
                const progress = JSON.parse(event.data) as AsyncQueryProgress;
                setState((prev) => ({ ...prev, progress }));
                onProgress?.(progress);
              } catch (e) {
                console.warn('[AsyncAI] Failed to parse progress:', e);
              }
            });

            // Handle result
            eventSource.addEventListener('result', (event) => {
              try {
                const data = JSON.parse(event.data);
                handleResult({
                  success: true,
                  response: data.response,
                  targetAgent: data.targetAgent,
                  toolResults: data.toolResults,
                  processingTimeMs: data.processingTimeMs,
                });
              } catch (e) {
                handleError(`Failed to parse result: ${e}`);
              }
            });

            // Handle error from stream
            eventSource.addEventListener('error', (event) => {
              if (eventSource.readyState === EventSource.CLOSED) {
                // Connection closed normally
                return;
              }

              // Try to parse error data
              const messageEvent = event as MessageEvent;
              if (messageEvent.data) {
                try {
                  const data = JSON.parse(messageEvent.data);
                  handleError(data.error || 'Stream error');
                } catch {
                  handleError('Connection error');
                }
              } else {
                handleError('Connection lost');
              }
            });

            // Handle timeout from stream
            eventSource.addEventListener('timeout', (event) => {
              try {
                const data = JSON.parse((event as MessageEvent).data);
                handleError(data.message || 'Request timeout');
              } catch {
                handleError('Request timeout');
              }
            });

            // Set timeout
            timeoutRef.current = setTimeout(() => {
              handleError(`Request timeout after ${timeout}ms`);
            }, timeout);
          })
          .catch((error) => {
            handleError(`Failed to start query: ${error.message}`);
          });
      });
    },
    [sessionId, timeout, onProgress, onResult, onError, cleanup]
  );

  // Reset state
  const reset = useCallback(() => {
    cleanup();
    setState({
      isLoading: false,
      isConnected: false,
      progress: null,
      result: null,
      error: null,
      jobId: null,
    });
  }, [cleanup]);

  return {
    // Actions
    sendQuery,
    cancel,
    reset,

    // State
    ...state,

    // Computed
    progressPercent: state.progress?.progress || 0,
    progressMessage: state.progress?.message || '',
  };
}

export default useAsyncAIQuery;
