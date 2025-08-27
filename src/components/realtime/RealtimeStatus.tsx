/**
 * 🔄 실시간 연결 상태 표시 컴포넌트
 *
 * Phase 7.3: 실시간 데이터 통합
 * - WebSocket 연결 상태 시각화
 * - 실시간 데이터 수신 표시
 * - 연결 문제 알림 및 재연결 버튼
 */

'use client';

import { useRealtimeData } from '@/hooks/api/useRealtimeQueries';
// framer-motion 제거 - CSS 애니메이션 사용
import { AlertCircle, CheckCircle, RefreshCw, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

interface RealtimeStatusProps {
  compact?: boolean;
  showDetails?: boolean;
  className?: string;
}

export default function RealtimeStatus({
  compact = false,
  showDetails = true,
  className = '',
}: RealtimeStatusProps) {
  const {
    servers,
    predictions,
    overallStatus,
    reconnectAll,
    isFullyConnected,
  } = useRealtimeData();
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [showReconnectButton, setShowReconnectButton] = useState(false);

  // 📊 연결 상태별 스타일
  const getStatusConfig = () => {
    switch (overallStatus) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          text: '실시간 연결됨',
          pulse: true,
        };
      case 'connecting':
        return {
          icon: RefreshCw,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          text: '연결 중...',
          pulse: false,
          spin: true,
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          text: '연결 끊김',
          pulse: false,
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          text: '상태 불명',
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // 🔄 마지막 업데이트 시간 갱신
  useEffect(() => {
    if (isFullyConnected) {
      setLastUpdateTime(new Date());
      setShowReconnectButton(false);
      return undefined;
    } else {
      // 5초 후 재연결 버튼 표시
      const timer = setTimeout(() => setShowReconnectButton(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isFullyConnected]);

  // 🎨 컴팩트 모드 렌더링
  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="relative">
          <Icon
            className={`h-4 w-4 ${config.color} ${config.spin ? 'animate-spin' : ''}`}
          />
          {config.pulse && (
            <div
              className="absolute inset-0 h-4 w-4 rounded-full bg-green-400 opacity-30"
            />
          )}
        </div>
        <span className={`text-sm font-medium ${config.color}`}>
          {config.text}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} rounded-lg border p-4 ${className}`}
    >
      {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Icon
              className={`h-5 w-5 ${config.color} ${config.spin ? 'animate-spin' : ''}`}
            />
            {config.pulse && (
              <div
                className="absolute inset-0 h-5 w-5 rounded-full bg-green-400 opacity-30"
              />
            )}
          </div>
          <div>
            <h3 className={`font-semibold ${config.color}`}>실시간 모니터링</h3>
            <p className="text-sm text-gray-600">{config.text}</p>
          </div>
        </div>

        {/* 재연결 버튼 */}
        <Fragment>
          {showReconnectButton && !isFullyConnected && (
            <button
              onClick={reconnectAll}
              className="rounded bg-blue-500 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-600"
            >
              재연결
            </button>
          )}
        </Fragment>
      </div>

      {/* 상세 정보 */}
      {showDetails && (
        <div className="space-y-2">
          {/* 연결 상태 세부사항 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">서버 모니터링:</span>
              <div className="flex items-center space-x-1">
                {servers.isConnected ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={
                    servers.isConnected ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {servers.isConnected ? '연결됨' : '끊김'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">AI 예측:</span>
              <div className="flex items-center space-x-1">
                {predictions.isConnected ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={
                    predictions.isConnected ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {predictions.isConnected ? '연결됨' : '끊김'}
                </span>
              </div>
            </div>
          </div>

          {/* 마지막 업데이트 시간 */}
          {isFullyConnected && (
            <div className="border-t border-gray-200 pt-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>마지막 업데이트:</span>
                <span>{lastUpdateTime.toLocaleTimeString()}</span>
              </div>
            </div>
          )}

          {/* 재연결 시도 횟수 */}
          {servers.reconnectAttempts > 0 && (
            <div className="text-xs text-yellow-600">
              재연결 시도: {servers.reconnectAttempts}/5
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 🎯 플로팅 상태 표시기 (화면 우하단)
export function FloatingRealtimeStatus() {
  const [isMinimized, setIsMinimized] = useState(true);

  return (
    <div
      className="fixed bottom-4 right-4 z-50"
    >
      <Fragment>
        {isMinimized ? (
          <button
            key="minimized"
            onClick={() => setIsMinimized(false)}
            className="rounded-full bg-white p-3 shadow-lg transition-all hover:shadow-xl"
          >
            <RealtimeStatus compact />
          </button>
        ) : (
          <div
            key="expanded"
            className="rounded-lg border bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b p-2">
              <span className="text-sm font-medium text-gray-700">
                실시간 상태
              </span>
              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-400 hover:text-gray-600"
                title="실시간 상태 최소화"
                aria-label="실시간 상태 최소화"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <RealtimeStatus compact={false} showDetails />
            </div>
          </div>
        )}
      </Fragment>
    </div>
  );
}
