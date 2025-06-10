'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings,
  Activity,
} from 'lucide-react';

interface AdminData {
  systemStatus: 'healthy' | 'initializing' | 'error';
  engines: {
    mcp: { available: boolean; successRate: number; todayFailures: number };
    rag: { available: boolean; successRate: number; todayFailures: number };
    googleAI: {
      available: boolean;
      successRate: number;
      todayFailures: number;
      quotaUsed: number;
      quotaRemaining: number;
      quotaPercentage: number;
    };
  };
  quota: {
    googleAI: {
      used: number;
      limit: number;
      remaining: number;
      percentage: number;
      isNearLimit: boolean;
      resetTime: string;
    };
  };
  analytics: {
    totalQueries: number;
    todayFailures: number;
    averageResponseTime: number;
    hourlyUsage: Array<{
      hour: number;
      failures: number;
      mcpFailures: number;
      ragFailures: number;
      googleAIFailures: number;
    }>;
  };
  recentFailures: Array<{
    timestamp: Date;
    stage: 'mcp' | 'rag' | 'google_ai';
    query: string;
    error: string;
    responseTime: number;
  }>;
}

export default function SmartFallbackAdminPage() {
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 관리자 데이터 로드
  const loadAdminData = async () => {
    if (!adminKey) return;

    try {
      const response = await fetch('/api/ai/smart-fallback/admin', {
        headers: {
          'X-Admin-Key': adminKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdminData(data.adminData);
        setIsAuthenticated(true);
        setLoading(false);
      } else {
        throw new Error('인증 실패');
      }
    } catch (error) {
      console.error('관리자 데이터 로드 실패:', error);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  // 할당량 리셋
  const resetQuota = async () => {
    setActionLoading('reset');
    try {
      const response = await fetch('/api/ai/smart-fallback/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminKey,
        },
        body: JSON.stringify({
          action: 'reset_quota',
          adminKey,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert('할당량이 성공적으로 리셋되었습니다!');
        loadAdminData(); // 데이터 새로고침
      } else {
        alert('할당량 리셋 실패: ' + result.error);
      }
    } catch (error) {
      alert('할당량 리셋 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  // 엔진 테스트
  const testEngines = async () => {
    setActionLoading('test');
    try {
      const response = await fetch('/api/ai/smart-fallback/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminKey,
        },
        body: JSON.stringify({
          action: 'force_test',
          testQuery: '관리자 테스트: 시스템 상태를 확인해주세요',
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log('테스트 결과:', result.testResults);
        alert('엔진 테스트가 완료되었습니다. 콘솔을 확인하세요.');
      } else {
        alert('엔진 테스트 실패: ' + result.error);
      }
    } catch (error) {
      alert('엔진 테스트 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (adminKey) {
      loadAdminData();
    }
  }, [adminKey]);

  // 5초마다 자동 새로고침
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(loadAdminData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, adminKey]);

  // 인증 화면
  if (!isAuthenticated) {
    return (
      <div className='container mx-auto p-6'>
        <div className='max-w-md mx-auto'>
          <Card>
            <CardHeader>
              <CardTitle className='text-center'>
                🔑 Smart Fallback 관리자
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-2'>
                  관리자 키
                </label>
                <input
                  type='password'
                  value={adminKey}
                  onChange={e => setAdminKey(e.target.value)}
                  placeholder='관리자 키를 입력하세요'
                  className='w-full p-2 border rounded-md'
                />
              </div>
              <Button
                onClick={loadAdminData}
                disabled={!adminKey || loading}
                className='w-full'
              >
                {loading ? '인증 중...' : '로그인'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading || !adminData) {
    return (
      <div className='container mx-auto p-6'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <RefreshCw className='h-8 w-8 animate-spin mx-auto mb-2' />
            <p>관리자 데이터 로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* 헤더 */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>🧠 Smart Fallback 관리자</h1>
          <p className='text-muted-foreground'>
            AI 엔진 폴백 시스템 모니터링 및 관리
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            onClick={loadAdminData}
            variant='outline'
            size='sm'
            disabled={actionLoading !== null}
          >
            <RefreshCw className='h-4 w-4 mr-2' />
            새로고침
          </Button>
          <Button
            onClick={resetQuota}
            variant='destructive'
            size='sm'
            disabled={actionLoading !== null}
          >
            {actionLoading === 'reset' ? (
              <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
            ) : (
              <Settings className='h-4 w-4 mr-2' />
            )}
            할당량 리셋
          </Button>
          <Button
            onClick={testEngines}
            variant='outline'
            size='sm'
            disabled={actionLoading !== null}
          >
            {actionLoading === 'test' ? (
              <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
            ) : (
              <Activity className='h-4 w-4 mr-2' />
            )}
            엔진 테스트
          </Button>
        </div>
      </div>

      {/* 시스템 상태 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            {adminData.systemStatus === 'healthy' ? (
              <CheckCircle className='h-5 w-5 text-green-500' />
            ) : (
              <AlertCircle className='h-5 w-5 text-yellow-500' />
            )}
            시스템 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* MCP 엔진 */}
            <div className='p-4 border rounded-lg'>
              <div className='flex justify-between items-center mb-2'>
                <h3 className='font-semibold'>MCP 엔진</h3>
                <Badge
                  variant={
                    adminData.engines.mcp.available ? 'default' : 'destructive'
                  }
                >
                  {adminData.engines.mcp.available ? '사용 가능' : '사용 불가'}
                </Badge>
              </div>
              <div className='space-y-1 text-sm'>
                <p>성공률: {adminData.engines.mcp.successRate}%</p>
                <p>오늘 실패: {adminData.engines.mcp.todayFailures}회</p>
              </div>
            </div>

            {/* RAG 엔진 */}
            <div className='p-4 border rounded-lg'>
              <div className='flex justify-between items-center mb-2'>
                <h3 className='font-semibold'>RAG 엔진</h3>
                <Badge
                  variant={
                    adminData.engines.rag.available ? 'default' : 'destructive'
                  }
                >
                  {adminData.engines.rag.available ? '사용 가능' : '사용 불가'}
                </Badge>
              </div>
              <div className='space-y-1 text-sm'>
                <p>성공률: {adminData.engines.rag.successRate}%</p>
                <p>오늘 실패: {adminData.engines.rag.todayFailures}회</p>
              </div>
            </div>

            {/* Google AI */}
            <div className='p-4 border rounded-lg'>
              <div className='flex justify-between items-center mb-2'>
                <h3 className='font-semibold'>Google AI</h3>
                <Badge
                  variant={
                    adminData.engines.googleAI.available
                      ? 'default'
                      : 'destructive'
                  }
                >
                  {adminData.engines.googleAI.available
                    ? '사용 가능'
                    : '사용 불가'}
                </Badge>
              </div>
              <div className='space-y-1 text-sm'>
                <p>성공률: {adminData.engines.googleAI.successRate}%</p>
                <p>오늘 실패: {adminData.engines.googleAI.todayFailures}회</p>
                <p>
                  할당량: {adminData.engines.googleAI.quotaUsed}/300 (
                  {adminData.engines.googleAI.quotaPercentage}%)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 할당량 모니터링 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            Google AI 할당량
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <span>일일 사용량</span>
              <span className='font-mono'>
                {adminData.quota.googleAI.used} /{' '}
                {adminData.quota.googleAI.limit}
              </span>
            </div>

            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className={`h-2 rounded-full transition-all ${
                  adminData.quota.googleAI.isNearLimit
                    ? 'bg-red-500'
                    : adminData.quota.googleAI.percentage > 50
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${adminData.quota.googleAI.percentage}%` }}
              />
            </div>

            <div className='flex justify-between text-sm text-muted-foreground'>
              <span>남은 할당량: {adminData.quota.googleAI.remaining}회</span>
              <span>
                {adminData.quota.googleAI.isNearLimit && (
                  <Badge variant='destructive'>⚠️ 할당량 부족</Badge>
                )}
              </span>
            </div>

            <p className='text-xs text-muted-foreground'>
              마지막 리셋:{' '}
              {new Date(adminData.quota.googleAI.resetTime).toLocaleString(
                'ko-KR'
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 상세 분석 탭 */}
      <Tabs defaultValue='analytics' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='analytics'>📊 분석</TabsTrigger>
          <TabsTrigger value='failures'>❌ 실패 로그</TabsTrigger>
        </TabsList>

        <TabsContent value='analytics'>
          <Card>
            <CardHeader>
              <CardTitle>📊 오늘의 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                <div className='text-center'>
                  <div className='text-2xl font-bold'>
                    {adminData.analytics.totalQueries}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    총 쿼리 수
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-red-500'>
                    {adminData.analytics.todayFailures}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    오늘 실패 수
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold'>
                    {adminData.analytics.averageResponseTime}ms
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    평균 응답시간
                  </div>
                </div>
              </div>

              {/* 시간대별 실패 차트 (간단한 막대형) */}
              <div>
                <h4 className='font-semibold mb-2'>시간대별 실패 현황</h4>
                <div className='grid grid-cols-12 gap-1 h-32'>
                  {adminData.analytics.hourlyUsage.map((usage, index) => (
                    <div
                      key={index}
                      className='flex flex-col justify-end items-center'
                    >
                      <div
                        className='w-full bg-red-200 rounded-t'
                        style={{
                          height: `${Math.max(1, (usage.failures / Math.max(...adminData.analytics.hourlyUsage.map(u => u.failures), 1)) * 100)}%`,
                        }}
                        title={`${usage.hour}시: ${usage.failures}회 실패`}
                      />
                      <div className='text-xs mt-1'>{usage.hour}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='failures'>
          <Card>
            <CardHeader>
              <CardTitle>❌ 최근 실패 로그</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2 max-h-96 overflow-y-auto'>
                {adminData.recentFailures.map((failure, index) => (
                  <div key={index} className='p-3 border rounded-lg text-sm'>
                    <div className='flex justify-between items-start mb-2'>
                      <Badge variant='outline'>
                        {failure.stage.toUpperCase()}
                      </Badge>
                      <span className='text-xs text-muted-foreground'>
                        {new Date(failure.timestamp).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <div className='mb-1'>
                      <strong>쿼리:</strong> {failure.query}
                    </div>
                    <div className='mb-1 text-red-600'>
                      <strong>오류:</strong> {failure.error}
                    </div>
                    <div className='text-muted-foreground'>
                      응답시간: {failure.responseTime}ms
                    </div>
                  </div>
                ))}

                {adminData.recentFailures.length === 0 && (
                  <div className='text-center py-8 text-muted-foreground'>
                    최근 실패한 요청이 없습니다.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
