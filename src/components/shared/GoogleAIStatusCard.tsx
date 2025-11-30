/**
 * 🤖 Google AI 상태 카드 컴포넌트 - 통합 버전
 */

'use client';

// framer-motion 제거 - CSS 애니메이션 사용
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  RefreshCw,
  XCircle,
  Zap,
} from 'lucide-react';
import { FC, useState } from 'react';
import { useGoogleAIStatus } from '@/hooks/api/useGoogleAIStatus';

interface GoogleAIStatusCardProps {
  className?: string;
  showDetails?: boolean;
}

export const GoogleAIStatusCard: FC<GoogleAIStatusCardProps> = ({
  className = '',
  showDetails = true,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    data: status,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useGoogleAIStatus();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

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

  // 헬퍼 함수: API 키 상태 표시
  const renderApiKeyStatus = (
    keyStatus: string,
    keyId?: string,
    isConnected?: boolean
  ) => {
    let colorClass = '';
    let statusText = '';
    let icon = null;

    switch (keyStatus) {
      case 'valid':
        colorClass = 'text-green-600';
        statusText = '유효함';
        icon = <CheckCircle className="h-4 w-4" />;
        break;
      case 'invalid':
        colorClass = 'text-red-600';
        statusText = '유효하지 않음';
        icon = <XCircle className="h-4 w-4" />;
        break;
      case 'missing':
        colorClass = 'text-yellow-600';
        statusText = '설정 안 됨';
        icon = <AlertTriangle className="h-4 w-4" />;
        break;
      case 'expired':
        colorClass = 'text-red-600';
        statusText = '만료됨';
        icon = <XCircle className="h-4 w-4" />;
        break;
      default:
        colorClass = 'text-gray-600';
        statusText = '알 수 없음';
        icon = <Zap className="h-4 w-4" />;
    }

    return (
      <div className="flex items-center gap-2">
        <span className={`${colorClass} flex items-center gap-1`}>
          {icon} {statusText}
        </span>
        {keyId && <span className="text-xs text-gray-500">({keyId})</span>}
        {keyStatus === 'valid' && isConnected !== undefined && (
          <span
            className={`text-xs ${isConnected ? 'text-green-500' : 'text-red-500'}`}
          >
            {isConnected ? '(연결됨)' : '(연결안됨)'}
          </span>
        )}
      </div>
    );
  };

  // Dashboard 스타일 렌더링
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
          onClick={() => {
            void handleRefresh();
          }}
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
            {status?.activeKeySource && status.activeKeySource !== 'none' && (
              <div className="mt-1 text-xs text-blue-600">
                활성 키:{' '}
                {status.activeKeySource === 'primary' ? '주 키' : '보조 키'}
              </div>
            )}
          </div>
        </div>

        {showDetails && status && (
          <div className="space-y-3">
            <div className="mb-2 text-sm font-medium">API 키 상태</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">주 API 키</span>
                {renderApiKeyStatus(
                  status.apiKeyStatus.primary,
                  status.primaryKeyId,
                  status.primaryKeyConnected
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">보조 API 키</span>
                {renderApiKeyStatus(
                  status.apiKeyStatus.secondary,
                  status.secondaryKeyId,
                  status.secondaryKeyConnected
                )}
              </div>
            </div>

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
                  {Object.entries(
                    status.features as Record<string, boolean>
                  ).map(
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
