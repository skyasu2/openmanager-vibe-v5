/**
 * 🚀 서버 시작 버튼 컴포넌트
 * 4번 제한 웜업 시스템 시작
 */

'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

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

  // 웜업 상태 폴링
  const pollWarmupStatus = async () => {
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
      console.error('웜업 상태 확인 실패:', error);
    }
  };

  // 서버 시작 실행
  const handleStartServer = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/system/start-warmup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maxWarmups: 4 // 4번 웜업
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('🚀 서버 시작됨! 웜업 진행 중...');
        
        // 즉시 상태 확인
        await pollWarmupStatus();
        
        // 30초마다 상태 확인
        const interval = setInterval(pollWarmupStatus, 30000);
        setPollInterval(interval);
        
      } else {
        toast.error(`서버 시작 실패: ${data.message}`);
      }
      
    } catch (error) {
      console.error('서버 시작 오류:', error);
      toast.error('서버 시작 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 웜업 중지
  const handleStopWarmup = async () => {
    try {
      const response = await fetch('/api/system/start-warmup', {
        method: 'DELETE'
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
      console.error('웜업 중지 오류:', error);
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

  // 페이지 로드 시 현재 상태 확인
  useEffect(() => {
    pollWarmupStatus();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🚀 AI 서버 제어
        </h3>
        
        {/* 진행 상태 표시 */}
        {progress && (
          <div className="mb-6">
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>웜업 진행률</span>
                <span>{progress.current_count}/{progress.max_count} 완료</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
              <div>상태: {
                progress.stage === 'running' ? '🔥 웜업 중' :
                progress.stage === 'completed' ? '✅ 완료' : '⏸️ 중지됨'
              }</div>
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
              onClick={handleStartServer}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
              onClick={handleStopWarmup}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <span>🛑</span>
              <span>웜업 중지</span>
            </button>
          )}

          {progress?.completed && (
            <div className="text-center">
              <div className="bg-green-100 text-green-800 py-3 px-4 rounded-lg">
                <div className="font-medium">🎉 웜업 완료!</div>
                <div className="text-sm mt-1">AI 서버가 준비되었습니다</div>
              </div>
              
              <button
                onClick={() => setProgress(null)}
                className="mt-3 text-sm text-gray-500 hover:text-gray-700"
              >
                상태 초기화
              </button>
            </div>
          )}
        </div>

        {/* 안내 메시지 */}
        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <div>• 8분 간격으로 4번 웜업 후 자동 중지</div>
          <div>• 총 소요시간: 약 32분</div>
          <div>• Python AI 서버 콜드 스타트 방지</div>
        </div>
      </div>
    </div>
  );
} 