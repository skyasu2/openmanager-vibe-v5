/**
 * 🚀 서버 시작 버튼 컴포넌트
 * 4번 제한 웜업 시스템 시작
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { logger } from '@/lib/logging';

interface WarmupProgress {
  active: boolean;
  completed: boolean;
  current_count: number;
  max_count: number;
  remaining: number;
  percentage: number;
  stage: 'stopped' | 'running' | 'completed';
  eta_minutes: number;
}

export default function ServerStartButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<WarmupProgress | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [showWarmupProgress, _setShowWarmupProgress] = useState(true);

  // 웜업 상태 폴링
  const pollWarmupStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/system/start-warmup');
      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress);

        // 완료되면 폴링 중지
        if (data.progress.completed) {
          if (pollInterval) {
            clearInterval(pollInterval);
            setPollInterval(null);
          }
          toast.success('🎉 서버 웜업 완료!');
        }
      }
    } catch (error) {
      logger.error('웜업 상태 확인 실패:', error);
    }
  }, [pollInterval]);

  // 서버 시작 실행
  const handleStartServer = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/system/start-warmup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxWarmups: 4, // 4번 웜업
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('🚀 서버 시작됨! 웜업 진행 중...');

        // 즉시 상태 확인
        await pollWarmupStatus();

        // 30초마다 상태 확인
        const interval = setInterval(() => {
          void pollWarmupStatus();
        }, 30000);
        setPollInterval(interval);
      } else {
        toast.error(`서버 시작 실패: ${data.message}`);
      }
    } catch (error) {
      logger.error('서버 시작 오류:', error);
      toast.error('서버 시작 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 웜업 중지
  const handleStopWarmup = async () => {
    try {
      const response = await fetch('/api/system/start-warmup', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('웜업 시스템이 중지되었습니다');
        setProgress(null);

        if (pollInterval) {
          clearInterval(pollInterval);
          setPollInterval(null);
        }
      }
    } catch (error) {
      logger.error('웜업 중지 오류:', error);
      toast.error('웜업 중지 중 오류가 발생했습니다');
    }
  };

  // 컴포넌트 언마운트 시 폴링 정리
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  // 워밍업 상태 폴링 시작
  useEffect(() => {
    if (showWarmupProgress) {
      void pollWarmupStatus();
    }
  }, [showWarmupProgress, pollWarmupStatus]);

  return (
    <div className="rounded-lg border bg-white p-6 shadow-lg">
      <div className="text-center">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          🚀 AI 서버 제어
        </h3>

        {/* 진행 상태 표시 */}
        {progress && (
          <div className="mb-6">
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>웜업 진행률</span>
                <span>
                  {progress.current_count}/{progress.max_count} 완료
                </span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-1 text-xs text-gray-500">
              <div>
                상태:{' '}
                {progress.stage === 'running'
                  ? '🔥 웜업 중'
                  : progress.stage === 'completed'
                    ? '✅ 완료'
                    : '⏸️ 중지됨'}
              </div>
              {progress.stage === 'running' && (
                <div>예상 완료: {progress.eta_minutes}분 후</div>
              )}
            </div>
          </div>
        )}

        {/* 컨트롤 버튼들 */}
        <div className="space-y-3">
          {!progress?.active && !progress?.completed && (
            <button
              type="button"
              onClick={() => {
                void handleStartServer();
              }}
              disabled={isLoading}
              className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-all duration-200 hover:bg-blue-700 active:scale-[0.97] disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  <span>시작 중...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>서버 시작 (4번 웜업)</span>
                </>
              )}
            </button>
          )}

          {progress?.active && !progress?.completed && (
            <button
              type="button"
              onClick={() => {
                void handleStopWarmup();
              }}
              className="flex w-full items-center justify-center space-x-2 rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition-all duration-200 hover:bg-red-700 active:scale-[0.97]"
            >
              <span>🛑</span>
              <span>웜업 중지</span>
            </button>
          )}

          {progress?.completed && (
            <div className="text-center">
              <div className="rounded-lg bg-green-100 px-4 py-3 text-green-800">
                <div className="font-medium">🎉 웜업 완료!</div>
                <div className="mt-1 text-sm">AI 서버가 준비되었습니다</div>
              </div>

              <button
                type="button"
                onClick={() => setProgress(null)}
                className="mt-3 text-sm text-gray-500 transition-colors hover:text-gray-700 active:text-gray-900"
              >
                상태 초기화
              </button>
            </div>
          )}
        </div>

        {/* 안내 메시지 */}
        <div className="mt-4 space-y-1 text-xs text-gray-500">
          <div>• 8분 간격으로 4번 웜업 후 자동 중지</div>
          <div>• 총 소요시간: 약 32분</div>
          <div>• Python AI 서버 콜드 스타트 방지</div>
        </div>
      </div>
    </div>
  );
}
