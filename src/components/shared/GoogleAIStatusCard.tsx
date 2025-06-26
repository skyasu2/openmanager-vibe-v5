/**
 * 🤖 Google AI 상태 카드 컴포넌트 - 통합 버전
 */

'use client';

import {
  useGoogleAIStatus,
  useRefreshGoogleAIStatus,
} from '@/hooks/api/useGoogleAIStatus';
import { AnimatePresence, motion } from 'framer-motion';
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
import React, { useState } from 'react';

interface GoogleAIStatusCardProps {
  className?: string;
  showDetails?: boolean;
  variant?: 'admin' | 'dashboard';
}

export const GoogleAIStatusCard: React.FC<GoogleAIStatusCardProps> = ({
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
    <div className='relative'>
      {!showApiKeyInput ? (
        <button
          onClick={() => setShowApiKeyInput(true)}
          className='p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors'
          title='API 키 관리'
        >
          <Settings className='w-4 h-4' />
        </button>
      ) : (
        <div className='flex items-center gap-2'>
          <input
            type='password'
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder='Google AI API 키 입력'
            className='text-xs px-2 py-1 border rounded w-32'
            onKeyPress={e => e.key === 'Enter' && handleSaveApiKey()}
          />
          <button
            onClick={handleSaveApiKey}
            disabled={isSaving || !apiKey.trim()}
            className='text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50'
          >
            {isSaving ? '저장중...' : '저장'}
          </button>
          <button
            onClick={() => {
              setShowApiKeyInput(false);
              setApiKey('');
            }}
            className='text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600'
          >
            취소
          </button>
        </div>
      )}
    </div>
  );

  const getStatusIcon = () => {
    if (isLoading || isRefreshing || isRefetching) {
      return <RefreshCw className='w-5 h-5 text-blue-500 animate-spin' />;
    }

    if (error || !status?.isConnected) {
      return <XCircle className='w-5 h-5 text-red-500' />;
    }

    if (status?.isConnected && status?.healthCheckStatus === 'healthy') {
      return <CheckCircle className='w-5 h-5 text-green-500' />;
    }

    return <AlertTriangle className='w-5 h-5 text-yellow-500' />;
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}
      >
        <div className='p-6 border-b border-gray-100'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
                <Zap className='w-5 h-5 text-white' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-800'>
                  Google AI 상태
                </h3>
                <p className='text-sm text-gray-600'>Gemini API 모니터링</p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefetching || isRefreshing}
              className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50'
              title='새로고침'
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefetching || isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>

        <div className='p-6'>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              <span className='ml-3 text-gray-600'>
                Google AI 상태 확인 중...
              </span>
            </div>
          ) : error ? (
            <div className='text-center py-8'>
              <AlertTriangle className='w-12 h-12 text-red-400 mx-auto mb-3' />
              <p className='text-red-600 font-medium'>상태 확인 실패</p>
              <p className='text-sm text-gray-500 mt-1'>{error.message}</p>
            </div>
          ) : !status ? (
            <div className='text-center py-8'>
              <Zap className='w-12 h-12 text-gray-300 mx-auto mb-3' />
              <p className='text-gray-500'>Google AI 상태 정보 없음</p>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>활성화</span>
                  <CheckCircle
                    className={`w-4 h-4 ${status.isEnabled ? 'text-green-500' : 'text-red-500'}`}
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>연결</span>
                  <CheckCircle
                    className={`w-4 h-4 ${status.isConnected ? 'text-green-500' : 'text-red-500'}`}
                  />
                </div>
              </div>

              <div className='border rounded-lg p-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Key className='w-4 h-4 text-gray-500' />
                    <span className='text-sm font-medium'>
                      API 키:{' '}
                      {status.apiKeyStatus === 'valid'
                        ? 'AIza****...****'
                        : status.apiKeyStatus}
                    </span>
                  </div>
                  {variant === 'admin' && <APIKeyManagementButton />}
                </div>
              </div>

              <div className='border rounded-lg p-3'>
                <div className='flex items-center gap-2 mb-2'>
                  <Activity className='w-4 h-4 text-gray-500' />
                  <span className='text-sm font-medium'>성능 지표</span>
                </div>
                <div className='grid grid-cols-3 gap-2 text-center text-xs'>
                  <div>
                    <div className='font-bold text-blue-600'>
                      {status.performance?.averageResponseTime || 0}ms
                    </div>
                    <div className='text-gray-500'>응답시간</div>
                  </div>
                  <div>
                    <div className='font-bold text-green-600'>
                      {Math.round((status.performance?.successRate || 0) * 100)}
                      %
                    </div>
                    <div className='text-gray-500'>성공률</div>
                  </div>
                  <div>
                    <div className='font-bold text-red-600'>
                      {Math.round((status.performance?.errorRate || 0) * 100)}%
                    </div>
                    <div className='text-gray-500'>오류율</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Dashboard 스타일 렌더링 (기본)
  return (
    <div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}
    >
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
            <Brain className='w-5 h-5 text-white' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-800'>
              Google AI 상태
            </h3>
            <p className='text-sm text-gray-600'>Gemini API 연결 모니터링</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          className='p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50'
          title='상태 새로고침'
        >
          <RefreshCw
            className={`w-4 h-4 text-gray-500 ${isLoading || isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      <div className='space-y-4'>
        <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
          {getStatusIcon()}
          <div className='flex-1'>
            <div className={`font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </div>
            {status?.lastHealthCheck && (
              <div className='text-xs text-gray-500 mt-1'>
                마지막 확인:{' '}
                {new Date(status.lastHealthCheck).toLocaleTimeString('ko-KR')}
              </div>
            )}
          </div>
        </div>

        {showDetails && status && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='space-y-3'
            >
              {status.model && (
                <div className='flex items-center gap-2 text-sm'>
                  <Zap className='w-4 h-4 text-purple-500' />
                  <span className='text-gray-600'>모델:</span>
                  <span className='font-medium text-gray-800'>
                    {status.model}
                  </span>
                </div>
              )}

              {status.performance?.averageResponseTime && (
                <div className='flex items-center gap-2 text-sm'>
                  <Clock className='w-4 h-4 text-blue-500' />
                  <span className='text-gray-600'>평균 응답 시간:</span>
                  <span className='font-medium text-gray-800'>
                    {status.performance.averageResponseTime}ms
                  </span>
                </div>
              )}

              {status.quotaStatus && (
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm'>
                    <BarChart3 className='w-4 h-4 text-green-500' />
                    <span className='text-gray-600'>일일 할당량:</span>
                    <span className='font-medium text-gray-800'>
                      {status.quotaStatus.daily.used} /{' '}
                      {status.quotaStatus.daily.limit}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-sm'>
                    <Activity className='w-4 h-4 text-blue-500' />
                    <span className='text-gray-600'>분당 할당량:</span>
                    <span className='font-medium text-gray-800'>
                      {status.quotaStatus.perMinute.used} /{' '}
                      {status.quotaStatus.perMinute.limit}
                    </span>
                  </div>
                </div>
              )}

              {status.features && (
                <div className='mt-3'>
                  <div className='text-sm text-gray-600 mb-2'>활성 기능:</div>
                  <div className='flex flex-wrap gap-1'>
                    {(Object.entries(status.features) as [string, boolean][]).map(
                      ([feature, enabled]) =>
                        enabled && (
                          <span
                            key={feature}
                            className='px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full'
                          >
                            {feature}
                          </span>
                        )
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {error && (
          <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
            <div className='flex items-center gap-2 text-red-700 text-sm'>
              <AlertTriangle className='w-4 h-4' />
              <span>연결 오류: {error.message || '알 수 없는 오류'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleAIStatusCard;
