'use client';

/**
 * 🔧 Google AI 관리 탭
 *
 * Google AI Studio 연동 설정 및 제어 기능:
 * - API 연결 상태 확인
 * - 온오프 토글 제어
 * - 할당량 모니터링
 * - 연결 테스트 기능
 */

import React, { useState, useEffect } from 'react';
import {
  Power,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Settings,
  BarChart3,
  TestTube,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GoogleAIStatus {
  enabled: boolean;
  connected: boolean;
  lastCheck: string;
  quotaUsage: {
    daily: number;
    monthly: number;
    remaining: number;
  };
  model: string;
  version: string;
  error?: string;
  quota?: {
    dailyUsed: number;
    dailyLimit: number;
    hourlyUsed: number;
    hourlyLimit: number;
    testUsed: number;
    testLimit: number;
    circuitBreakerActive: boolean;
    healthCheckCacheHours: number;
    lastHealthCheck: string | null;
  };
  quotaProtection?: boolean;
  mockMode?: boolean;
}

export default function GoogleAIManagementTab() {
  const [status, setStatus] = useState<GoogleAIStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // 컴포넌트 마운트 시 상태 로드
  useEffect(() => {
    loadGoogleAIStatus();
  }, []);

  /**
   * 🔍 Google AI 상태 로드
   */
  const loadGoogleAIStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai/google-ai/status');

      if (response.ok) {
        const apiData = await response.json();

        // API 응답 구조에 맞게 상태 매핑
        const mappedStatus: GoogleAIStatus = {
          enabled: apiData.data?.overall?.isReady || false,
          connected: apiData.data?.service?.connectionTest?.success || false,
          lastCheck: new Date().toISOString(),
          quotaUsage: {
            daily: apiData.data?.quota?.dailyUsed || 0,
            monthly: 0,
            remaining: Math.max(
              0,
              (apiData.data?.quota?.dailyLimit || 100) -
                (apiData.data?.quota?.dailyUsed || 0)
            ),
          },
          model:
            apiData.data?.environment?.GOOGLE_AI_MODEL || 'gemini-1.5-flash',
          version: apiData.data?.system?.version || 'Unknown',
          quota: apiData.data?.quota,
          quotaProtection: apiData.data?.overall?.quotaProtectionEnabled,
          mockMode: apiData.data?.overall?.mockMode,
        };

        setStatus(mappedStatus);
        console.log('📊 Google AI 상태:', mappedStatus);
      } else {
        console.error('❌ Google AI 상태 로드 실패:', response.statusText);
        setStatus({
          enabled: false,
          connected: false,
          lastCheck: new Date().toISOString(),
          quotaUsage: { daily: 0, monthly: 0, remaining: 0 },
          model: 'Unknown',
          version: 'Unknown',
          error: '상태를 불러올 수 없습니다',
        });
      }
    } catch (error) {
      console.error('❌ Google AI 상태 로드 중 오류:', error);
      setStatus({
        enabled: false,
        connected: false,
        lastCheck: new Date().toISOString(),
        quotaUsage: { daily: 0, monthly: 0, remaining: 0 },
        model: 'Unknown',
        version: 'Unknown',
        error: '네트워크 오류',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 🔄 Google AI 온오프 토글
   */
  const toggleGoogleAI = async (enabled: boolean) => {
    try {
      setIsToggling(true);

      const response = await fetch('/api/ai/google-ai/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled,
          action: enabled ? 'enable' : 'disable',
        }),
      });

      if (response.ok) {
        const updatedStatus = await response.json();
        setStatus(prev =>
          prev ? { ...prev, enabled: updatedStatus.enabled } : null
        );
        console.log(`✅ Google AI ${enabled ? '활성화' : '비활성화'} 완료`);
      } else {
        console.error('❌ Google AI 설정 변경 실패:', response.statusText);
        // 실패 시 원래 상태로 되돌리기
        await loadGoogleAIStatus();
      }
    } catch (error) {
      console.error('❌ Google AI 토글 중 오류:', error);
      await loadGoogleAIStatus();
    } finally {
      setIsToggling(false);
    }
  };

  /**
   * 🧪 Google AI 연결 테스트
   */
  const testConnection = async () => {
    try {
      setIsTesting(true);

      const response = await fetch('/api/ai/google-ai/test', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Google AI 연결 테스트 성공:', result);
        // 테스트 후 상태 새로고침
        await loadGoogleAIStatus();
      } else {
        console.error('❌ Google AI 연결 테스트 실패:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Google AI 연결 테스트 중 오류:', error);
    } finally {
      setIsTesting(false);
    }
  };

  /**
   * 🎨 상태에 따른 색상 반환
   */
  const getStatusColor = () => {
    if (!status) return 'text-gray-400';
    if (status.error) return 'text-red-400';
    if (status.enabled && status.connected) return 'text-green-400';
    if (status.enabled && !status.connected) return 'text-yellow-400';
    return 'text-gray-400';
  };

  /**
   * 🎨 상태 아이콘 반환
   */
  const getStatusIcon = () => {
    if (!status) return <XCircle className='w-5 h-5 text-gray-400' />;
    if (status.error) return <XCircle className='w-5 h-5 text-red-400' />;
    if (status.enabled && status.connected)
      return <CheckCircle className='w-5 h-5 text-green-400' />;
    if (status.enabled && !status.connected)
      return <AlertTriangle className='w-5 h-5 text-yellow-400' />;
    return <XCircle className='w-5 h-5 text-gray-400' />;
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <Card className='bg-gray-800/50 border-gray-700'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-white'>
              <RefreshCw className='w-5 h-5 animate-spin' />
              Google AI 관리 로딩 중...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 메인 제어 패널 */}
      <Card className='bg-gray-800/50 border-gray-700'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-white'>
            <Settings className='w-5 h-5' />
            Google AI Studio 제어
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* 온오프 토글 */}
          <div className='flex items-center justify-between p-4 bg-gray-700/30 rounded-lg'>
            <div className='flex items-center gap-3'>
              <Power
                className={`w-6 h-6 ${status?.enabled ? 'text-green-400' : 'text-gray-400'}`}
              />
              <div>
                <div className='font-medium text-white'>Google AI 엔진</div>
                <div className='text-sm text-gray-400'>
                  {status?.enabled
                    ? 'AI 엔진이 활성화되어 있습니다'
                    : 'AI 엔진이 비활성화되어 있습니다'}
                </div>
              </div>
            </div>
            <Switch
              checked={status?.enabled || false}
              onCheckedChange={toggleGoogleAI}
              disabled={isToggling}
              className='data-[state=checked]:bg-green-500'
            />
          </div>

          {/* 상태 정보 */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='p-4 bg-gray-700/30 rounded-lg'>
              <div className='flex items-center gap-2 mb-2'>
                {getStatusIcon()}
                <span className='font-medium text-white'>연결 상태</span>
              </div>
              <div className={`text-sm ${getStatusColor()}`}>
                {status?.error
                  ? status.error
                  : status?.connected
                    ? '연결됨'
                    : '연결 안됨'}
              </div>
            </div>

            <div className='p-4 bg-gray-700/30 rounded-lg'>
              <div className='flex items-center gap-2 mb-2'>
                <Zap className='w-5 h-5 text-blue-400' />
                <span className='font-medium text-white'>모델 정보</span>
              </div>
              <div className='text-sm text-gray-300'>
                {status?.model} v{status?.version}
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className='flex gap-3'>
            <Button
              onClick={loadGoogleAIStatus}
              disabled={isLoading}
              variant='outline'
              size='sm'
              className='flex items-center gap-2'
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              />
              상태 새로고침
            </Button>

            {status?.enabled && (
              <Button
                onClick={testConnection}
                disabled={isTesting}
                variant='outline'
                size='sm'
                className='flex items-center gap-2'
              >
                <TestTube
                  className={`w-4 h-4 ${isTesting ? 'animate-pulse' : ''}`}
                />
                연결 테스트
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 할당량 모니터링 */}
      {status?.enabled && (
        <Card className='bg-gray-800/50 border-gray-700'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-white'>
              <BarChart3 className='w-5 h-5' />
              API 할당량 모니터링
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* 기본 할당량 정보 */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='p-4 bg-gray-700/30 rounded-lg'>
                <div className='text-sm text-gray-400 mb-1'>일일 사용량</div>
                <div className='text-xl font-bold text-blue-400'>
                  {status.quota?.dailyUsed ||
                    status.quotaUsage.daily.toLocaleString()}{' '}
                  / {status.quota?.dailyLimit || 100}
                </div>
                <div className='text-xs text-gray-500 mt-1'>
                  {Math.round(
                    ((status.quota?.dailyUsed || status.quotaUsage.daily) /
                      (status.quota?.dailyLimit || 100)) *
                      100
                  )}
                  % 사용
                </div>
              </div>

              <div className='p-4 bg-gray-700/30 rounded-lg'>
                <div className='text-sm text-gray-400 mb-1'>시간당 사용량</div>
                <div className='text-xl font-bold text-purple-400'>
                  {status.quota?.hourlyUsed || 0} /{' '}
                  {status.quota?.hourlyLimit || 20}
                </div>
                <div className='text-xs text-gray-500 mt-1'>
                  {Math.round(
                    ((status.quota?.hourlyUsed || 0) /
                      (status.quota?.hourlyLimit || 20)) *
                      100
                  )}
                  % 사용
                </div>
              </div>

              <div className='p-4 bg-gray-700/30 rounded-lg'>
                <div className='text-sm text-gray-400 mb-1'>테스트 사용량</div>
                <div className='text-xl font-bold text-yellow-400'>
                  {status.quota?.testUsed || 0} / {status.quota?.testLimit || 5}
                </div>
                <div className='text-xs text-gray-500 mt-1'>
                  오늘{' '}
                  {(status.quota?.testLimit || 5) -
                    (status.quota?.testUsed || 0)}
                  회 남음
                </div>
              </div>
            </div>

            {/* 할당량 보호 상태 */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='p-4 bg-gray-700/30 rounded-lg'>
                <div className='flex items-center gap-2 mb-2'>
                  <div
                    className={`w-3 h-3 rounded-full ${status.quotaProtection ? 'bg-green-400' : 'bg-red-400'}`}
                  />
                  <span className='font-medium text-white'>할당량 보호</span>
                </div>
                <div className='text-sm text-gray-300'>
                  {status.quotaProtection ? '활성화됨' : '비활성화됨'}
                </div>
                {status.mockMode && (
                  <Badge
                    variant='outline'
                    className='mt-2 text-xs text-yellow-400 border-yellow-400'
                  >
                    Mock 모드
                  </Badge>
                )}
              </div>

              <div className='p-4 bg-gray-700/30 rounded-lg'>
                <div className='flex items-center gap-2 mb-2'>
                  <div
                    className={`w-3 h-3 rounded-full ${status.quota?.circuitBreakerActive ? 'bg-red-400' : 'bg-green-400'}`}
                  />
                  <span className='font-medium text-white'>
                    Circuit Breaker
                  </span>
                </div>
                <div className='text-sm text-gray-300'>
                  {status.quota?.circuitBreakerActive ? '차단됨' : '정상'}
                </div>
                {status.quota?.circuitBreakerActive && (
                  <div className='text-xs text-red-400 mt-1'>
                    연속 실패로 인한 일시 차단
                  </div>
                )}
              </div>
            </div>

            {/* 헬스체크 캐시 정보 */}
            {status.quota?.lastHealthCheck && (
              <div className='p-4 bg-gray-700/30 rounded-lg'>
                <div className='flex items-center gap-2 mb-2'>
                  <CheckCircle className='w-4 h-4 text-green-400' />
                  <span className='font-medium text-white'>헬스체크 캐시</span>
                </div>
                <div className='text-sm text-gray-300'>
                  마지막 헬스체크:{' '}
                  {new Date(status.quota.lastHealthCheck).toLocaleString(
                    'ko-KR'
                  )}
                </div>
                <div className='text-xs text-gray-500 mt-1'>
                  {status.quota.healthCheckCacheHours}시간 캐시 적용 (과도한 API
                  호출 방지)
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 마지막 체크 시간 */}
      {status && (
        <div className='text-center'>
          <Badge variant='outline' className='text-gray-400 border-gray-600'>
            마지막 확인: {new Date(status.lastCheck).toLocaleString('ko-KR')}
          </Badge>
        </div>
      )}
    </div>
  );
}
