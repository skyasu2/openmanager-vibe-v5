/**
 * 🤖 Google AI 상태 카드 컴포넌트 - 통합 버전
 */

'use client';

import { FC } from 'react';
import {
  useGoogleAIStatus,
  useRefreshGoogleAIStatus,
} from '@/hooks/api/useGoogleAIStatus';
// framer-motion 제거 - CSS 애니메이션 사용
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  Key,
  RefreshCw,
  Settings,
  XCircle,
  Zap,
} from 'lucide-react';
import React, { Fragment, useState } from 'react';

interface GoogleAIStatusCardProps {
  className?: string;
  showDetails?: boolean;
  variant?: 'admin' | 'dashboard';
}

export const GoogleAIStatusCard: FC<GoogleAIStatusCardProps> = ({
  className = '',
  showDetails = true,
  variant = 'dashboard',
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const {
    data: status,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useGoogleAIStatus();
  const refreshStatus = useRefreshGoogleAIStatus();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (variant === 'admin') {
        await refreshStatus();
      } else {
        await refetch();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;

    setIsSaving(true);
    try {
      // API 키 저장 로직
      const response = await fetch('/api/google-ai/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (response.ok) {
        setShowApiKeyInput(false);
        setApiKey('');
        await handleRefresh(); // 상태 새로고침
      }
    } catch (error) {
      console.error('API 키 저장 실패:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // API 키 관리 버튼 컴포넌트
  const APIKeyManagementButton = () => (
    <div className="relative">
      {!showApiKeyInput ? (
        <button
          onClick={() => setShowApiKeyInput(true)}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="API 키 관리"
        >
          <Settings className="h-4 w-4" />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Google AI API 키 입력"
            className="w-32 rounded border px-2 py-1 text-xs"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                void handleSaveApiKey();
              }
            }}
          />
          <button
            onClick={() => { void handleSaveApiKey(); }}
            disabled={isSaving || !apiKey.trim()}
            className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {isSaving ? '저장중...' : '저장'}
          </button>
          <button
            onClick={() => {
              setShowApiKeyInput(false);
              setApiKey('');
            }}
            className="rounded bg-gray-500 px-2 py-1 text-xs text-white hover:bg-gray-600"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );

  const getStatusIcon = () => {
    if (isLoading || isRefreshing || isRefetching) {
      return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />;
    }

    if (error || !status?.isConnected) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }

    if (status?.isConnected && status?.healthCheckStatus === 'healthy') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }

    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (isLoading) return '상태 확인 중...';
    if (error) return '연결 오류';
    if (!status?.isConnected) return '연결 끊김';
    if (status?.healthCheckStatus === 'healthy') return '정상 작동';
    if (status?.healthCheckStatus === 'degraded') return '부분 작동';
    return '비정상';
  };

  const getStatusColor = () => {
    if (isLoading || isRefreshing || isRefetching) return 'text-blue-600';
    if (error || !status?.isConnected) return 'text-red-600';
    if (status?.healthCheckStatus === 'healthy') return 'text-green-600';
    if (status?.healthCheckStatus === 'degraded') return 'text-yellow-600';
    return 'text-red-600';
  };

  // Admin 스타일 렌더링
  if (variant === 'admin') {
    return (
      <div
        className={`rounded-xl border border-gray-200 bg-white shadow-lg ${className}`}
      >
        <div className="border-b border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Google AI 상태
                </h3>
                <p className="text-sm text-gray-600">Gemini API 모니터링</p>
              </div>
            </div>

            <button
              onClick={() => { void handleRefresh(); }}
              disabled={isRefetching || isRefreshing}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              title="새로고침"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefetching || isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                Google AI 상태 확인 중...
              </span>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-red-400" />
              <p className="font-medium text-red-600">상태 확인 실패</p>
              <p className="mt-1 text-sm text-gray-500">{error.message}</p>
            </div>
          ) : !status ? (
            <div className="py-8 text-center">
              <Zap className="mx-auto mb-3 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">Google AI 상태 정보 없음</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">활성화</span>
                  <CheckCircle
                    className={`h-4 w-4 ${status.isEnabled ? 'text-green-500' : 'text-red-500'}`}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">연결</span>
                  <CheckCircle
                    className={`h-4 w-4 ${status.isConnected ? 'text-green-500' : 'text-red-500'}`}
                  />
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      API 키:{' '}
                      {status.apiKeyStatus === 'valid'
                        ? 'AIza****...****'
                        : status.apiKeyStatus}
                    </span>
                  </div>
                  {variant === 'admin' && <APIKeyManagementButton />}
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">성능 지표</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="font-bold text-blue-600">
                      {status.performance?.averageResponseTime || 0}ms
                    </div>
                    <div className="text-gray-500">응답시간</div>
                  </div>
                  <div>
                    <div className="font-bold text-green-600">
                      {Math.round((status.performance?.successRate || 0) * 100)}
                      %
                    </div>
                    <div className="text-gray-500">성공률</div>
                  </div>
                  <div>
                    <div className="font-bold text-red-600">
                      {Math.round((status.performance?.errorRate || 0) * 100)}%
                    </div>
                    <div className="text-gray-500">오류율</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard 스타일 렌더링 (기본)
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-6 shadow-lg ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Google AI 상태
            </h3>
            <p className="text-sm text-gray-600">Gemini API 연결 모니터링</p>
          </div>
        </div>

        <button
          onClick={() => { void handleRefresh(); }}
          disabled={isLoading || isRefreshing}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:opacity-50"
          title="상태 새로고침"
        >
          <RefreshCw
            className={`h-4 w-4 text-gray-500 ${isLoading || isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
          {getStatusIcon()}
          <div className="flex-1">
            <div className={`font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </div>
            {status?.lastHealthCheck && (
              <div className="mt-1 text-xs text-gray-500">
                마지막 확인:{' '}
                {new Date(status.lastHealthCheck).toLocaleTimeString('ko-KR')}
              </div>
            )}
          </div>
        </div>

        {showDetails && status && (
          <Fragment>
            <div
              className="space-y-3"
            >
              {status.model && (
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="text-gray-600">모델:</span>
                  <span className="font-medium text-gray-800">
                    {status.model}
                  </span>
                </div>
              )}

              {status.performance?.averageResponseTime && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-600">평균 응답 시간:</span>
                  <span className="font-medium text-gray-800">
                    {status.performance.averageResponseTime}ms
                  </span>
                </div>
              )}

              {status.quotaStatus && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">일일 할당량:</span>
                    <span className="font-medium text-gray-800">
                      {status.quotaStatus.daily.used} /{' '}
                      {status.quotaStatus.daily.limit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-600">분당 할당량:</span>
                    <span className="font-medium text-gray-800">
                      {status.quotaStatus.perMinute.used} /{' '}
                      {status.quotaStatus.perMinute.limit}
                    </span>
                  </div>
                </div>
              )}

              {status.features && (
                <div className="mt-3">
                  <div className="mb-2 text-sm text-gray-600">활성 기능:</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(status.features as Record<string, boolean>).map(
                      ([feature, enabled]) =>
                        enabled && (
                          <span
                            key={feature}
                            className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700"
                          >
                            {feature}
                          </span>
                        )
                    )}
                  </div>
                </div>
              )}
            </div>
          </Fragment>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span>연결 오류: {error.message || '알 수 없는 오류'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleAIStatusCard;
