/**
 * 🚀 Vercel API 테스터 패널
 * Cursor에서 Vercel 프로덕션 환경 API를 직접 테스트할 수 있는 개발 도구
 *
 * @author SkyAsus Team
 * @date 2025-06-27 04:47 KST
 * @version 1.0.0
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Activity,
  BarChart3,
  Brain,
  Download,
  Play,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface APITestResult {
  success: boolean;
  status: number;
  data?: any;
  error?: string;
  responseTime: number;
  endpoint: string;
  timestamp: string;
}

interface VercelAPIConfig {
  baseUrl: string;
  timeout: number;
  authToken?: string;
}

export function VercelAPITesterPanel() {
  const [config, setConfig] = useState<VercelAPIConfig>({
    baseUrl:
      'https://openmanager-vibe-v5-p64aybo8u-skyasus-projects.vercel.app',
    timeout: 30000,
  });

  const [customEndpoint, setCustomEndpoint] = useState('/api/health-check');
  const [testResults, setTestResults] = useState<APITestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    'quick' | 'custom' | 'bulk' | 'results'
  >('quick');

  const predefinedEndpoints = [
    { name: '🔍 헬스체크', endpoint: '/api/health-check', icon: Activity },
    { name: '🤖 AI 상태', endpoint: '/api/ai/status', icon: Brain },
    { name: '⚙️ AI 엔진', endpoint: '/api/ai/engines', icon: Zap },
    { name: '💾 시스템 상태', endpoint: '/api/system/state', icon: Server },
    { name: '📊 메트릭', endpoint: '/api/metrics', icon: BarChart3 },
  ];

  const allTestEndpoints = [
    '/api/health-check',
    '/api/ai/status',
    '/api/ai/engines',
    '/api/system/state',
    '/api/metrics',
    '/api/ai/unified-query',
    '/api/ai/insights',
    '/api/dashboard',
  ];

  /**
   * 🌐 API 요청 실행
   */
  const makeAPIRequest = async (
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    data?: any
  ): Promise<APITestResult> => {
    const startTime = Date.now();
    const fullUrl = `${config.baseUrl}${endpoint}`;

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Cursor-Vercel-Tester/1.0',
        'X-Cursor-Dev-Mode': 'true',
        'X-Test-Environment': 'cursor-development',
      };

      if (config.authToken) {
        headers['Authorization'] = `Bearer ${config.authToken}`;
      }

      const response = await fetch(fullUrl, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: AbortSignal.timeout(config.timeout),
      });

      const responseTime = Date.now() - startTime;
      const responseData = await response.json().catch(() => null);

      return {
        success: response.ok,
        status: response.status,
        data: responseData,
        responseTime,
        endpoint,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        error: error instanceof Error ? error.message : String(error),
        responseTime: Date.now() - startTime,
        endpoint,
        timestamp: new Date().toISOString(),
      };
    }
  };

  /**
   * 🧪 단일 API 테스트
   */
  const testSingleAPI = async (endpoint: string) => {
    setIsLoading(true);
    try {
      const result = await makeAPIRequest(endpoint);
      setTestResults(prev => [result, ...prev.slice(0, 19)]); // 최대 20개 결과 유지
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 🧪 전체 API 테스트
   */
  const testAllAPIs = async () => {
    setIsLoading(true);
    setTestResults([]); // 결과 초기화

    try {
      const results: APITestResult[] = [];

      for (const endpoint of allTestEndpoints) {
        const result = await makeAPIRequest(endpoint);
        results.push(result);
        setTestResults(prev => [result, ...prev]);

        // API 부하 방지를 위한 지연
        if (endpoint !== allTestEndpoints[allTestEndpoints.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // 결과 요약 표시
      const successCount = results.filter(r => r.success).length;
      const avgResponseTime =
        results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

      alert(
        `테스트 완료!\n성공: ${successCount}/${results.length}\n평균 응답시간: ${avgResponseTime.toFixed(0)}ms`
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 📁 결과를 JSON 파일로 다운로드
   */
  const downloadResults = () => {
    const dataStr = JSON.stringify(testResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `vercel-api-test-results-${new Date().toISOString().slice(0, 16).replace(/:/g, '-')}.json`;
    link.click();

    URL.revokeObjectURL(url);
  };

  /**
   * 🎨 결과 상태 색상
   */
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800';
    if (status >= 300 && status < 400) return 'bg-yellow-100 text-yellow-800';
    if (status >= 400 && status < 500) return 'bg-red-100 text-red-800';
    if (status >= 500) return 'bg-red-200 text-red-900';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className='space-y-6'>
      {/* 헤더 */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>🚀 Vercel API 테스터</h2>
          <p className='text-sm text-gray-600 mt-1'>
            Cursor에서 Vercel 프로덕션 환경 API를 직접 테스트
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            onClick={() => setTestResults([])}
            variant='outline'
            size='sm'
          >
            🗑️ 결과 지우기
          </Button>
          {testResults.length > 0 && (
            <Button onClick={downloadResults} variant='outline' size='sm'>
              <Download className='w-4 h-4 mr-1' />
              결과 다운로드
            </Button>
          )}
        </div>
      </div>

      {/* 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>⚙️ 연결 설정</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <label className='text-sm font-medium'>Vercel 프로덕션 URL</label>
            <Input
              value={config.baseUrl}
              onChange={e =>
                setConfig(prev => ({ ...prev, baseUrl: e.target.value }))
              }
              className='mt-1'
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='text-sm font-medium'>타임아웃 (ms)</label>
              <Input
                type='number'
                value={config.timeout}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    timeout: parseInt(e.target.value),
                  }))
                }
                className='mt-1'
              />
            </div>
            <div>
              <label className='text-sm font-medium'>
                인증 토큰 (선택사항)
              </label>
              <Input
                type='password'
                value={config.authToken || ''}
                onChange={e =>
                  setConfig(prev => ({ ...prev, authToken: e.target.value }))
                }
                placeholder='Bearer 토큰 (선택사항)'
                className='mt-1'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 탭 네비게이션 */}
      <div className='flex gap-2 border-b'>
        {[
          { id: 'quick', label: '⚡ 빠른 테스트' },
          { id: 'custom', label: '🔧 커스텀 테스트' },
          { id: 'bulk', label: '🧪 전체 테스트' },
          { id: 'results', label: '📊 결과' },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={selectedTab === tab.id ? 'default' : 'ghost'}
            onClick={() => setSelectedTab(tab.id as any)}
            size='sm'
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* 빠른 테스트 탭 */}
      {selectedTab === 'quick' && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {predefinedEndpoints.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={index} className='hover:shadow-md transition-shadow'>
                <CardContent className='p-4'>
                  <div className='flex items-center gap-3 mb-3'>
                    <Icon className='w-5 h-5 text-blue-600' />
                    <span className='font-medium'>{item.name}</span>
                  </div>
                  <p className='text-sm text-gray-600 mb-3'>{item.endpoint}</p>
                  <Button
                    onClick={() => testSingleAPI(item.endpoint)}
                    disabled={isLoading}
                    size='sm'
                    className='w-full'
                  >
                    {isLoading ? (
                      <RefreshCw className='w-4 h-4 animate-spin' />
                    ) : (
                      <Play className='w-4 h-4' />
                    )}
                    테스트
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 커스텀 테스트 탭 */}
      {selectedTab === 'custom' && (
        <Card>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium'>API 엔드포인트</label>
                <Input
                  value={customEndpoint}
                  onChange={e => setCustomEndpoint(e.target.value)}
                  placeholder='/api/your-endpoint'
                  className='mt-1'
                />
              </div>
              <div className='flex gap-2'>
                <Button
                  onClick={() => testSingleAPI(customEndpoint)}
                  disabled={isLoading || !customEndpoint}
                  className='flex-1'
                >
                  {isLoading ? (
                    <RefreshCw className='w-4 h-4 animate-spin mr-2' />
                  ) : (
                    <Play className='w-4 h-4 mr-2' />
                  )}
                  GET 테스트
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 전체 테스트 탭 */}
      {selectedTab === 'bulk' && (
        <Card>
          <CardContent className='p-6'>
            <div className='text-center space-y-4'>
              <p className='text-gray-600'>
                {allTestEndpoints.length}개의 주요 API 엔드포인트를 순차적으로
                테스트합니다.
              </p>
              <div className='flex flex-wrap gap-2 justify-center'>
                {allTestEndpoints.map((endpoint, index) => (
                  <Badge key={index} variant='outline'>
                    {endpoint}
                  </Badge>
                ))}
              </div>
              <Button
                onClick={testAllAPIs}
                disabled={isLoading}
                size='lg'
                className='px-8'
              >
                {isLoading ? (
                  <RefreshCw className='w-4 h-4 animate-spin mr-2' />
                ) : (
                  <Zap className='w-4 h-4 mr-2' />
                )}
                전체 테스트 시작
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 결과 탭 */}
      {selectedTab === 'results' && (
        <div className='space-y-4'>
          {testResults.length === 0 ? (
            <Card>
              <CardContent className='p-8 text-center text-gray-500'>
                아직 테스트 결과가 없습니다.
              </CardContent>
            </Card>
          ) : (
            testResults.map((result, index) => (
              <Card key={index}>
                <CardContent className='p-4'>
                  <div className='flex justify-between items-start mb-3'>
                    <div className='flex items-center gap-3'>
                      <Badge className={getStatusColor(result.status)}>
                        {result.success ? '✅' : '❌'} {result.status || 'ERR'}
                      </Badge>
                      <span className='font-mono text-sm'>
                        {result.endpoint}
                      </span>
                      <span className='text-sm text-gray-500'>
                        {result.responseTime}ms
                      </span>
                    </div>
                    <span className='text-xs text-gray-400'>
                      {new Date(result.timestamp).toLocaleString('ko-KR')}
                    </span>
                  </div>

                  {result.error && (
                    <div className='bg-red-50 border-l-4 border-red-400 p-3 mb-3'>
                      <p className='text-sm text-red-700'>🔴 {result.error}</p>
                    </div>
                  )}

                  {result.data && (
                    <details className='mt-3'>
                      <summary className='cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900'>
                        📊 응답 데이터 보기
                      </summary>
                      <Textarea
                        value={JSON.stringify(result.data, null, 2)}
                        readOnly
                        className='mt-2 font-mono text-xs'
                        rows={8}
                      />
                    </details>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
