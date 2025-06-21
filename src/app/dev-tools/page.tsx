'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { getSystemUpdateStats } from '@/utils/update-prevention';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Brain,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Download,
  Globe,
  Key,
  MessageSquare,
  RefreshCw,
  Send,
  Server,
  Settings,
  Shield,
  TestTube,
  Trash2,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface ServiceStatus {
  name: string;
  status: 'connected' | 'error' | 'unknown';
  responseTime: number;
  details: any;
  error?: string;
}

interface ServicesStatusResponse {
  timestamp: string;
  environment: string;
  services: ServiceStatus[];
  summary: {
    total: number;
    connected: number;
    errors: number;
    averageResponseTime: number;
  };
}

interface KeyManagerStatus {
  timestamp: string;
  environment: string;
  keyManager: string;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    missing: number;
    successRate: number;
  };
  services?: Array<{
    service: string;
    status: 'active' | 'missing' | 'invalid';
    source: 'env' | 'default' | 'encrypted';
    preview: string;
    lastChecked: string;
  }>;
}

interface AITestResult {
  success: boolean;
  engine: string;
  response: string;
  responseTime: number;
  error?: string;
  metadata?: any;
}

interface AIEngineStatus {
  name: string;
  status: 'active' | 'inactive' | 'error';
  responseTime: number;
  requests: number;
  type: string;
  version: string;
  description: string;
}

const getServiceIcon = (serviceName: string) => {
  if (serviceName.includes('Supabase')) return <Database className='w-5 h-5' />;
  if (serviceName.includes('Redis')) return <Zap className='w-5 h-5' />;
  if (serviceName.includes('Google AI')) return <Brain className='w-5 h-5' />;
  if (serviceName.includes('Render')) return <Server className='w-5 h-5' />;
  if (serviceName.includes('Vercel')) return <Globe className='w-5 h-5' />;
  return <Server className='w-5 h-5' />;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'connected':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'connected':
      return 'default';
    case 'error':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export default function DevToolsPage() {
  const [servicesData, setServicesData] =
    useState<ServicesStatusResponse | null>(null);
  const [keyManager, setKeyManager] = useState<KeyManagerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [keyManagerLoading, setKeyManagerLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // AI 테스트 관련 상태
  const [aiTestQuery, setAiTestQuery] = useState('서버 상태 어때?');
  const [aiTestMode, setAiTestMode] = useState('auto');
  const [aiTestResult, setAiTestResult] = useState<AITestResult | null>(null);
  const [aiTestLoading, setAiTestLoading] = useState(false);
  const [aiEnginesStatus, setAiEnginesStatus] = useState<
    AIEngineStatus[] | null
  >(null);
  const [aiEnginesLoading, setAiEnginesLoading] = useState(false);

  // 갱신 방지 통계 관련 상태
  const [updateStats, setUpdateStats] = useState<any>(null);
  const [updateStatsLoading, setUpdateStatsLoading] = useState(false);

  // 프리셋 질문들
  const presetQueries = [
    'CPU 사용률이 높은 서버를 찾아줘',
    '메모리 사용량이 80% 이상인 서버는?',
    '디스크 공간이 부족한 서버 분석해줘',
    '네트워크 트래픽이 많은 서버는?',
    '최근 에러가 발생한 서버를 확인해줘',
    '성능 최적화가 필요한 서버 추천해줘',
  ];

  const fetchServicesStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/services/status');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError, 'Response:', text);
        throw new Error('서버 응답을 파싱할 수 없습니다');
      }
      setServicesData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('서비스 상태 확인 실패:', error);
      // 기본 데이터 설정
      setServicesData({
        timestamp: new Date().toISOString(),
        environment: 'development',
        services: [],
        summary: {
          total: 0,
          connected: 0,
          errors: 0,
          averageResponseTime: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchKeyManagerStatus = async () => {
    try {
      setKeyManagerLoading(true);
      const response = await fetch('/api/config/keys?action=status');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error(
          '키 관리자 JSON 파싱 오류:',
          parseError,
          'Response:',
          text
        );
        throw new Error('키 관리자 응답을 파싱할 수 없습니다');
      }
      setKeyManager(data);
    } catch (error) {
      console.error('키 관리자 상태 확인 실패:', error);
      // 기본 데이터 설정
      setKeyManager({
        timestamp: new Date().toISOString(),
        environment: 'development',
        keyManager: 'error',
        summary: {
          total: 0,
          valid: 0,
          invalid: 0,
          missing: 0,
          successRate: 0,
        },
        services: [],
      });
    } finally {
      setKeyManagerLoading(false);
    }
  };

  const fetchAIEnginesStatus = async () => {
    setAiEnginesLoading(true);
    try {
      const response = await fetch('/api/ai/engines/status');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success && data.data && data.data.engines) {
        setAiEnginesStatus(data.data.engines);
      }
    } catch (error) {
      console.error('AI 엔진 상태 확인 실패:', error);
      setAiEnginesStatus([]);
    } finally {
      setAiEnginesLoading(false);
    }
  };

  const fetchUpdateStats = async () => {
    setUpdateStatsLoading(true);
    try {
      // 클라이언트 사이드에서 갱신 방지 통계 가져오기
      const stats = getSystemUpdateStats();
      setUpdateStats(stats);
    } catch (error) {
      console.error('갱신 방지 통계 조회 실패:', error);
      setUpdateStats(null);
    } finally {
      setUpdateStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchServicesStatus();
    fetchKeyManagerStatus();
    fetchAIEnginesStatus();
    fetchUpdateStats();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchServicesStatus();
        fetchKeyManagerStatus();
        fetchAIEnginesStatus();
        fetchUpdateStats();
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleQuickSetup = async () => {
    try {
      setKeyManagerLoading(true);
      const response = await fetch('/api/config/keys?action=quick-setup');
      const data = await response.json();

      if (data.success) {
        alert(`✅ ${data.message}`);
        await fetchKeyManagerStatus();
        await fetchServicesStatus();
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      alert(`❌ 빠른 설정 실패: ${error}`);
    } finally {
      setKeyManagerLoading(false);
    }
  };

  const handleGenerateEnv = async () => {
    try {
      setKeyManagerLoading(true);
      const response = await fetch('/api/config/keys?action=generate-env');
      const data = await response.json();

      if (data.success) {
        alert(`✅ ${data.message}\n📁 위치: ${data.path}`);
        await fetchKeyManagerStatus();
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      alert(`❌ 파일 생성 실패: ${error}`);
    } finally {
      setKeyManagerLoading(false);
    }
  };

  // AI 자연어 질의 테스트
  const testAINaturalQuery = async () => {
    if (!aiTestQuery.trim()) {
      alert('질문을 입력해주세요!');
      return;
    }

    setAiTestLoading(true);
    setAiTestResult(null);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/ai/smart-fallback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: aiTestQuery,
          mode: aiTestMode,
          options: {
            enableThinking: true,
            enableAutoReport: true,
            fastMode: true,
            timeout: 10000,
          },
        }),
      });

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      if (data.success) {
        setAiTestResult({
          success: true,
          engine: data.engine || 'unknown',
          response: data.response || data.answer || '응답을 받았습니다.',
          responseTime,
          metadata: data.metadata,
        });
      } else {
        setAiTestResult({
          success: false,
          engine: data.engine || 'unknown',
          response: '',
          responseTime,
          error: data.error || '알 수 없는 오류가 발생했습니다.',
        });
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      setAiTestResult({
        success: false,
        engine: 'error',
        response: '',
        responseTime,
        error:
          error instanceof Error
            ? error.message
            : '네트워크 오류가 발생했습니다.',
      });
    } finally {
      setAiTestLoading(false);
    }
  };

  // 빠른 테스트 (프리셋 질문)
  const quickTest = async (query: string) => {
    setAiTestQuery(query);
    setTimeout(() => testAINaturalQuery(), 100);
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <CheckCircle className='h-5 w-5 text-green-500' />;
      case 'error':
      case 'missing':
        return <XCircle className='h-5 w-5 text-red-500' />;
      case 'invalid':
        return <AlertTriangle className='h-5 w-5 text-yellow-500' />;
      default:
        return <AlertTriangle className='h-5 w-5 text-gray-500' />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return (
          <Badge variant='default' className='bg-green-100 text-green-800'>
            활성화
          </Badge>
        );
      case 'error':
      case 'missing':
        return <Badge variant='destructive'>오류</Badge>;
      case 'invalid':
        return (
          <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
            무효
          </Badge>
        );
      default:
        return <Badge variant='outline'>알 수 없음</Badge>;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'default':
        return '';
      case 'encrypted':
        return '🔐';
      case 'env':
      default:
        return '📝';
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6'>
      <div className='max-w-7xl mx-auto space-y-6'>
        {/* 헤더 */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-slate-900 dark:text-slate-100'>
              🛠️ 개발자 도구
            </h1>
            <p className='text-slate-600 dark:text-slate-400 mt-2'>
              OpenManager Vibe v5 - 외부 서비스 실시간 상태 모니터링
            </p>
          </div>

          <div className='flex items-center gap-3'>
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className='flex items-center gap-2'
            >
              <RefreshCw
                className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`}
              />
              자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}
            </Button>

            <Button
              onClick={fetchServicesStatus}
              disabled={loading}
              className='flex items-center gap-2'
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
              수동 새로고침
            </Button>
          </div>
        </div>

        {/* 키 관리자 섹션 */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Key className='h-5 w-5' />
                <CardTitle>🔑 DevKeyManager</CardTitle>
              </div>
              <div className='flex space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={fetchKeyManagerStatus}
                  disabled={keyManagerLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${keyManagerLoading ? 'animate-spin' : ''}`}
                  />
                  새로고침
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleGenerateEnv}
                  disabled={keyManagerLoading}
                >
                  <Download className='h-4 w-4 mr-2' />
                  .env 생성
                </Button>
                <Button
                  size='sm'
                  onClick={handleQuickSetup}
                  disabled={keyManagerLoading}
                >
                  <Zap className='h-4 w-4 mr-2' />
                  빠른 설정
                </Button>
              </div>
            </div>
            <CardDescription>
              통합 API 키 관리 시스템 - 개발 효율성 우선
            </CardDescription>
          </CardHeader>
          <CardContent>
            {keyManager ? (
              <div className='space-y-4'>
                {/* 요약 정보 */}
                <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-blue-600'>
                      {keyManager.summary.total}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      총 서비스
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-green-600'>
                      {keyManager.summary.valid}
                    </div>
                    <div className='text-sm text-muted-foreground'>활성화</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-yellow-600'>
                      {keyManager.summary.invalid}
                    </div>
                    <div className='text-sm text-muted-foreground'>무효</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-red-600'>
                      {keyManager.summary.missing}
                    </div>
                    <div className='text-sm text-muted-foreground'>누락</div>
                  </div>
                  <div className='text-center'>
                    <div
                      className={`text-2xl font-bold ${keyManager.summary.successRate >= 80 ? 'text-green-600' : 'text-yellow-600'}`}
                    >
                      {keyManager.summary.successRate}%
                    </div>
                    <div className='text-sm text-muted-foreground'>성공률</div>
                  </div>
                </div>

                <Separator />

                {/* 서비스별 상태 */}
                {keyManager.services && (
                  <div className='space-y-2'>
                    <h4 className='font-semibold text-sm text-muted-foreground'>
                      서비스별 상태
                    </h4>
                    <div className='grid gap-2'>
                      {keyManager.services.map((service, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between p-3 border rounded-lg'
                        >
                          <div className='flex items-center space-x-3'>
                            {getStatusIcon(service.status)}
                            <div>
                              <div className='font-medium'>
                                {service.service}
                              </div>
                              <div className='text-sm text-muted-foreground'>
                                {getSourceIcon(service.source)}{' '}
                                {service.preview}
                              </div>
                            </div>
                          </div>
                          <div className='flex items-center space-x-2'>
                            {getStatusBadge(service.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 환경 정보 */}
                <div className='text-xs text-muted-foreground bg-muted p-3 rounded'>
                  <div className='grid grid-cols-2 gap-2'>
                    <div>환경: {keyManager.environment}</div>
                    <div>버전: {keyManager.keyManager}</div>
                    <div>
                      확인 시간:{' '}
                      {new Date(keyManager.timestamp).toLocaleString('ko-KR')}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className='text-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
                <p className='text-muted-foreground'>
                  키 관리자 상태를 확인하는 중...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* AI 엔진 테스트 및 자연어 질의 섹션 */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Brain className='h-5 w-5' />
                <CardTitle>🤖 AI 엔진 테스트 & 자연어 질의</CardTitle>
              </div>
              <div className='flex space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={fetchAIEnginesStatus}
                  disabled={aiEnginesLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${aiEnginesLoading ? 'animate-spin' : ''}`}
                  />
                  엔진 상태
                </Button>
              </div>
            </div>
            <CardDescription>
              AI 엔진별 상태 확인 및 실시간 자연어 질의 테스트
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-6'>
              {/* AI 엔진 상태 */}
              <div>
                <h4 className='font-semibold text-sm text-muted-foreground mb-3'>
                  AI 엔진 상태
                </h4>
                {aiEnginesStatus ? (
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                    {aiEnginesStatus.map((engine, index) => (
                      <Card key={index} className='p-3'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-2'>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                engine.status === 'active'
                                  ? 'bg-green-500'
                                  : engine.status === 'error'
                                    ? 'bg-red-500'
                                    : 'bg-gray-500'
                              }`}
                            />
                            <div>
                              <div className='font-medium text-sm'>
                                {engine.name}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                {engine.type}
                              </div>
                            </div>
                          </div>
                          <div className='text-right'>
                            <div className='text-xs font-medium'>
                              {engine.responseTime}ms
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              {engine.requests}회
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-4'>
                    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2'></div>
                    <p className='text-sm text-muted-foreground'>
                      AI 엔진 상태 확인 중...
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* 자연어 질의 테스트 */}
              <div>
                <h4 className='font-semibold text-sm text-muted-foreground mb-3'>
                  자연어 질의 테스트
                </h4>

                {/* 프리셋 질문들 */}
                <div className='mb-4'>
                  <label className='text-sm font-medium mb-2 block'>
                    빠른 테스트:
                  </label>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                    {presetQueries.map((query, index) => (
                      <Button
                        key={index}
                        variant='outline'
                        size='sm'
                        className='text-xs h-auto py-2 px-3'
                        onClick={() => quickTest(query)}
                        disabled={aiTestLoading}
                      >
                        {query}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 커스텀 질의 */}
                <div className='space-y-3'>
                  <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
                    <div className='md:col-span-2'>
                      <label className='text-sm font-medium mb-1 block'>
                        질문 입력:
                      </label>
                      <Textarea
                        value={aiTestQuery}
                        onChange={e => setAiTestQuery(e.target.value)}
                        placeholder='AI에게 질문을 입력하세요...'
                        rows={3}
                        className='text-sm'
                      />
                    </div>
                    <div>
                      <label className='text-sm font-medium mb-1 block'>
                        AI 모드:
                      </label>
                      <Select value={aiTestMode} onValueChange={setAiTestMode}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='auto'>Auto (전체)</SelectItem>
                          <SelectItem value='google'>Google AI</SelectItem>
                          <SelectItem value='local'>Local RAG</SelectItem>
                          <SelectItem value='mcp'>MCP 엔진</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='flex items-end'>
                      <Button
                        onClick={testAINaturalQuery}
                        disabled={aiTestLoading || !aiTestQuery.trim()}
                        className='w-full'
                      >
                        {aiTestLoading ? (
                          <>
                            <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                            처리 중...
                          </>
                        ) : (
                          <>
                            <Send className='w-4 h-4 mr-2' />
                            질의 실행
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* 테스트 결과 */}
                  {aiTestResult && (
                    <Card
                      className={`mt-4 ${aiTestResult.success ? 'border-green-200' : 'border-red-200'}`}
                    >
                      <CardHeader className='pb-3'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-2'>
                            {aiTestResult.success ? (
                              <CheckCircle className='h-5 w-5 text-green-500' />
                            ) : (
                              <XCircle className='h-5 w-5 text-red-500' />
                            )}
                            <CardTitle className='text-lg'>
                              {aiTestResult.success
                                ? 'AI 응답 성공'
                                : 'AI 응답 실패'}
                            </CardTitle>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <Badge variant='outline'>
                              {aiTestResult.engine}
                            </Badge>
                            <Badge variant='secondary'>
                              {aiTestResult.responseTime}ms
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {aiTestResult.success ? (
                          <div className='space-y-3'>
                            <div>
                              <p className='text-sm font-medium mb-1'>
                                AI 응답:
                              </p>
                              <div className='bg-slate-50 dark:bg-slate-800 p-3 rounded-lg'>
                                <p className='text-sm'>
                                  {aiTestResult.response}
                                </p>
                              </div>
                            </div>
                            {aiTestResult.metadata && (
                              <div>
                                <p className='text-sm font-medium mb-1'>
                                  메타데이터:
                                </p>
                                <div className='bg-slate-50 dark:bg-slate-800 p-3 rounded-lg'>
                                  <pre className='text-xs overflow-x-auto'>
                                    {JSON.stringify(
                                      aiTestResult.metadata,
                                      null,
                                      2
                                    )}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className='bg-red-50 dark:bg-red-900/20 p-3 rounded-lg'>
                            <p className='text-sm text-red-700 dark:text-red-300 font-medium'>
                              오류:
                            </p>
                            <p className='text-sm text-red-600 dark:text-red-400'>
                              {aiTestResult.error}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* 갱신 방지 통계 섹션 */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Shield className='h-5 w-5' />
                <CardTitle>🛡️ 갱신 방지 시스템</CardTitle>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={fetchUpdateStats}
                disabled={updateStatsLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${updateStatsLoading ? 'animate-spin' : ''}`}
                />
                통계 갱신
              </Button>
            </div>
            <CardDescription>
              과도한 API 호출 방지 및 시스템 최적화 통계
            </CardDescription>
          </CardHeader>
          <CardContent>
            {updateStats ? (
              <div className='space-y-4'>
                {/* 통계 요약 */}
                <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-blue-600'>
                      {updateStats.totalKeys}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      추적된 키
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-green-600'>
                      {updateStats.totalUpdates}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      허용된 갱신
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-red-600'>
                      {updateStats.totalBlocked}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      차단된 갱신
                    </div>
                  </div>
                  <div className='text-center'>
                    <div
                      className={`text-2xl font-bold ${updateStats.blockingRate > 50 ? 'text-green-600' : updateStats.blockingRate > 20 ? 'text-yellow-600' : 'text-red-600'}`}
                    >
                      {updateStats.blockingRate}%
                    </div>
                    <div className='text-sm text-muted-foreground'>차단율</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-purple-600'>
                      {updateStats.cacheStats.totalHits}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      캐시 히트
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 최적화 효과 */}
                <div className='bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4'>
                  <h4 className='font-semibold text-sm text-green-800 mb-2'>
                    🚀 최적화 효과
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                    <div className='flex items-center space-x-2'>
                      <CheckCircle className='w-4 h-4 text-green-600' />
                      <span className='text-green-700'>
                        {updateStats.totalBlocked}개 불필요한 요청 차단
                      </span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Clock className='w-4 h-4 text-blue-600' />
                      <span className='text-blue-700'>
                        캐시 {updateStats.cacheStats.size}개 항목 활용
                      </span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <BarChart3 className='w-4 h-4 text-purple-600' />
                      <span className='text-purple-700'>
                        시스템 부하 {updateStats.blockingRate}% 감소
                      </span>
                    </div>
                  </div>
                </div>

                {/* 설정 정보 */}
                <div className='text-xs text-muted-foreground bg-muted p-3 rounded'>
                  <div className='grid grid-cols-2 gap-2'>
                    <div>AI 인사이트: 5분 간격 갱신</div>
                    <div>서버 메트릭: 20초 간격 갱신</div>
                    <div>수동 갱신: 30초 최소 간격</div>
                    <div>캐시 정리: 10분마다 자동 실행</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className='text-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
                <p className='text-muted-foreground'>
                  갱신 방지 통계를 확인하는 중...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* 모드 선택 검증 테스트 섹션 */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Settings className='h-5 w-5' />
                <CardTitle>🔧 모드 선택 검증 테스트</CardTitle>
              </div>
              <Badge variant='outline' className='text-xs'>
                개발 도구
              </Badge>
            </div>
            <CardDescription>
              UI에서 모드 선택 시 실제로 모드가 바뀌는지 검증
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-6'>
              {/* 모드별 테스트 버튼들 */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <h4 className='text-sm font-medium text-gray-700'>
                    AUTO 모드
                  </h4>
                  <button
                    onClick={async () => {
                      const response = await fetch('/api/ai/smart-fallback', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          query: 'AUTO 모드 테스트',
                          mode: 'auto',
                          options: { enableThinking: true },
                        }),
                      });
                      const data = await response.json();
                      alert(
                        `AUTO 모드 응답:\n엔진: ${data.engine}\n성공: ${data.success}\n모드: ${data.mode}`
                      );
                    }}
                    className='w-full px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm'
                  >
                    AUTO 모드 테스트
                  </button>
                </div>

                <div className='space-y-2'>
                  <h4 className='text-sm font-medium text-gray-700'>
                    Google AI 모드
                  </h4>
                  <button
                    onClick={async () => {
                      const response = await fetch('/api/ai/smart-fallback', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          query: 'Google AI 모드 테스트',
                          mode: 'google-ai',
                          options: { enableThinking: true },
                        }),
                      });
                      const data = await response.json();
                      alert(
                        `Google AI 모드 응답:\n엔진: ${data.engine}\n성공: ${data.success}\n모드: ${data.mode}`
                      );
                    }}
                    className='w-full px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm'
                  >
                    Google AI 모드 테스트
                  </button>
                </div>

                <div className='space-y-2'>
                  <h4 className='text-sm font-medium text-gray-700'>
                    Internal 모드
                  </h4>
                  <button
                    onClick={async () => {
                      const response = await fetch('/api/ai/smart-fallback', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          query: 'Internal 모드 테스트',
                          mode: 'internal',
                          options: { enableThinking: true },
                        }),
                      });
                      const data = await response.json();
                      alert(
                        `Internal 모드 응답:\n엔진: ${data.engine}\n성공: ${data.success}\n모드: ${data.mode}`
                      );
                    }}
                    className='w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm'
                  >
                    Internal 모드 테스트
                  </button>
                </div>
              </div>

              {/* 모드 변경 검증 결과 */}
              <div className='bg-gray-50 rounded-lg p-4'>
                <h4 className='text-sm font-medium text-gray-700 mb-2'>
                  ✅ 모드 선택 검증 포인트
                </h4>
                <ul className='text-xs text-gray-600 space-y-1'>
                  <li>• UI에서 모드 선택 시 `selectedEngine` 상태가 변경됨</li>
                  <li>
                    • `handleSendInput`에서 `selectedEngine` 값이
                    `processRealAIQuery`에 전달됨
                  </li>
                  <li>
                    • `processRealAIQuery`에서 API 요청 시 `mode` 파라미터로
                    전달됨
                  </li>
                  <li>
                    • API 응답에서 `engine`과 `mode` 필드로 실제 사용된 모드
                    확인 가능
                  </li>
                  <li>• 프리셋 질문 클릭 시도 `selectedEngine` 값이 적용됨</li>
                </ul>
              </div>

              {/* 실시간 모드 확인 */}
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                <h4 className='text-sm font-medium text-blue-800 mb-2'>
                  🔍 실시간 모드 확인 방법
                </h4>
                <ol className='text-xs text-blue-700 space-y-1'>
                  <li>1. AI 사이드바 열기 → 자연어 질의 탭 선택</li>
                  <li>2. 우상단 모드 선택 드롭다운에서 원하는 모드 선택</li>
                  <li>3. 질문 입력 후 전송 또는 프리셋 질문 클릭</li>
                  <li>
                    4. 개발자 도구 → Network 탭에서 `/api/ai/smart-fallback`
                    요청 확인
                  </li>
                  <li>
                    5. 요청 Body의 `mode` 값과 응답의 `engine`, `mode` 값 비교
                  </li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* API 테스트 및 성능 모니터링 섹션 */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <TestTube className='h-5 w-5' />
                <CardTitle>🔗 API 테스트 & 성능 모니터링</CardTitle>
              </div>
              <Badge variant='outline' className='text-xs'>
                개발 도구
              </Badge>
            </div>
            <CardDescription>
              핵심 API 엔드포인트 테스트 및 실시간 성능 모니터링
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-6'>
              {/* 빠른 API 테스트 */}
              <div>
                <h4 className='font-semibold text-sm text-muted-foreground mb-3'>
                  빠른 API 테스트
                </h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex items-center gap-2'
                    onClick={() => window.open('/api/health', '_blank')}
                  >
                    <Activity className='w-4 h-4' />
                    Health Check
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex items-center gap-2'
                    onClick={() =>
                      window.open('/api/ai/engines/status', '_blank')
                    }
                  >
                    <Brain className='w-4 h-4' />
                    AI Status
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex items-center gap-2'
                    onClick={() => window.open('/api/servers', '_blank')}
                  >
                    <Server className='w-4 h-4' />
                    Servers
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex items-center gap-2'
                    onClick={() => window.open('/api/metrics', '_blank')}
                  >
                    <BarChart3 className='w-4 h-4' />
                    Metrics
                  </Button>
                </div>
              </div>

              <Separator />

              {/* 실시간 성능 메트릭 */}
              <div>
                <h4 className='font-semibold text-sm text-muted-foreground mb-3'>
                  실시간 성능 메트릭
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <Card>
                    <CardContent className='p-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                            평균 응답시간
                          </p>
                          <p className='text-2xl font-bold text-blue-600'>
                            {servicesData
                              ? formatResponseTime(
                                  servicesData.summary.averageResponseTime
                                )
                              : '--ms'}
                          </p>
                        </div>
                        <Clock className='w-8 h-8 text-blue-500' />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className='p-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                            활성 AI 엔진
                          </p>
                          <p className='text-2xl font-bold text-green-600'>
                            {aiEnginesStatus
                              ? aiEnginesStatus.filter(
                                  e => e.status === 'active'
                                ).length
                              : '--'}
                            <span className='text-sm text-muted-foreground'>
                              /{aiEnginesStatus?.length || '--'}
                            </span>
                          </p>
                        </div>
                        <Brain className='w-8 h-8 text-green-500' />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className='p-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                            연결된 서비스
                          </p>
                          <p className='text-2xl font-bold text-purple-600'>
                            {servicesData
                              ? servicesData.summary.connected
                              : '--'}
                            <span className='text-sm text-muted-foreground'>
                              /{servicesData?.summary.total || '--'}
                            </span>
                          </p>
                        </div>
                        <Database className='w-8 h-8 text-purple-500' />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              {/* 개발자 도구 링크 */}
              <div>
                <h4 className='font-semibold text-sm text-muted-foreground mb-3'>
                  개발자 도구 링크
                </h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex items-center gap-2'
                    onClick={() =>
                      window.open('/test-ai-integration.html', '_blank')
                    }
                  >
                    <Bot className='w-4 h-4' />
                    AI 통합 테스트
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex items-center gap-2'
                    onClick={() =>
                      window.open('/test-ai-simple.html', '_blank')
                    }
                  >
                    <MessageSquare className='w-4 h-4' />
                    AI 간단 테스트
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex items-center gap-2'
                    onClick={() =>
                      window.open('/test-ai-sidebar.html', '_blank')
                    }
                  >
                    <Cpu className='w-4 h-4' />
                    AI 사이드바 테스트
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex items-center gap-2'
                    onClick={() => window.open('/admin/ai-agent', '_blank')}
                  >
                    <Settings className='w-4 h-4' />
                    AI 관리자
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* 실시간 로그 모니터링 섹션 */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Activity className='h-5 w-5' />
                <CardTitle>📊 실시간 로그 모니터링</CardTitle>
              </div>
              <div className='flex space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => window.open('/api/logs?limit=50', '_blank')}
                >
                  <Download className='w-4 h-4 mr-2' />
                  로그 다운로드
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => window.open('/admin/ai-agent', '_blank')}
                >
                  <Settings className='w-4 h-4 mr-2' />
                  고급 모니터링
                </Button>
              </div>
            </div>
            <CardDescription>
              AI 엔진, API 요청, 시스템 이벤트 실시간 모니터링
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {/* 로그 요약 */}
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <Card>
                  <CardContent className='p-3'>
                    <div className='text-center'>
                      <div className='text-lg font-bold text-blue-600'>
                        {aiTestResult ? '1' : '0'}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        최근 AI 요청
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className='p-3'>
                    <div className='text-center'>
                      <div className='text-lg font-bold text-green-600'>
                        {servicesData ? servicesData.summary.connected : 0}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        활성 연결
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className='p-3'>
                    <div className='text-center'>
                      <div className='text-lg font-bold text-yellow-600'>
                        {servicesData ? servicesData.summary.errors : 0}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        오류 수
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className='p-3'>
                    <div className='text-center'>
                      <div className='text-lg font-bold text-purple-600'>
                        {lastUpdated
                          ? Math.floor(
                              (Date.now() - lastUpdated.getTime()) / 1000
                            )
                          : '--'}
                        s
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        마지막 업데이트
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 최근 활동 */}
              <div>
                <h4 className='font-semibold text-sm text-muted-foreground mb-3'>
                  최근 활동
                </h4>
                <div className='bg-slate-50 dark:bg-slate-800 p-4 rounded-lg max-h-64 overflow-y-auto'>
                  <div className='space-y-2 text-sm font-mono'>
                    {lastUpdated && (
                      <div className='flex items-center space-x-2'>
                        <span className='text-green-500'>●</span>
                        <span className='text-muted-foreground'>
                          {lastUpdated.toLocaleTimeString()}
                        </span>
                        <span>서비스 상태 업데이트 완료</span>
                      </div>
                    )}
                    {aiTestResult && (
                      <div className='flex items-center space-x-2'>
                        <span
                          className={
                            aiTestResult.success
                              ? 'text-green-500'
                              : 'text-red-500'
                          }
                        >
                          ●
                        </span>
                        <span className='text-muted-foreground'>
                          {new Date().toLocaleTimeString()}
                        </span>
                        <span>
                          AI 질의: &quot;{aiTestQuery.substring(0, 30)}...&quot;
                          - {aiTestResult.engine} ({aiTestResult.responseTime}
                          ms)
                        </span>
                      </div>
                    )}
                    {aiEnginesStatus && (
                      <div className='flex items-center space-x-2'>
                        <span className='text-blue-500'>●</span>
                        <span className='text-muted-foreground'>
                          {new Date().toLocaleTimeString()}
                        </span>
                        <span>
                          AI 엔진 상태 확인:{' '}
                          {
                            aiEnginesStatus.filter(e => e.status === 'active')
                              .length
                          }
                          /{aiEnginesStatus.length} 활성
                        </span>
                      </div>
                    )}
                    <div className='flex items-center space-x-2'>
                      <span className='text-gray-500'>●</span>
                      <span className='text-muted-foreground'>
                        {new Date().toLocaleTimeString()}
                      </span>
                      <span>개발 도구 페이지 로드 완료</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 시스템 상태 요약 */}
              <div className='bg-muted p-4 rounded-lg'>
                <h4 className='font-semibold text-sm mb-3'>
                  🔍 시스템 상태 요약
                </h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                  <div>
                    <p className='font-medium mb-2'>✅ 정상 작동 중:</p>
                    <ul className='text-muted-foreground space-y-1'>
                      <li>• MCP 서버 연결 (4개)</li>
                      <li>• AI 엔진 통합 시스템</li>
                      <li>• 자연어 질의 처리</li>
                      <li>• API 엔드포인트 응답</li>
                    </ul>
                  </div>
                  <div>
                    <p className='font-medium mb-2'>⚡ 성능 지표:</p>
                    <ul className='text-muted-foreground space-y-1'>
                      <li>
                        • 평균 응답시간:{' '}
                        {servicesData
                          ? formatResponseTime(
                              servicesData.summary.averageResponseTime
                            )
                          : '--'}
                      </li>
                      <li>
                        • AI 엔진 활성률:{' '}
                        {aiEnginesStatus
                          ? Math.round(
                              (aiEnginesStatus.filter(
                                e => e.status === 'active'
                              ).length /
                                aiEnginesStatus.length) *
                                100
                            )
                          : '--'}
                        %
                      </li>
                      <li>
                        • 서비스 연결률:{' '}
                        {servicesData
                          ? Math.round(
                              (servicesData.summary.connected /
                                servicesData.summary.total) *
                                100
                            )
                          : '--'}
                        %
                      </li>
                      <li>• 자동 새로고침: {autoRefresh ? 'ON' : 'OFF'}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 컨텍스트 캐시 모니터링 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              🚀 컨텍스트 캐시 모니터링
              <Badge variant='outline' className='text-xs'>
                AI 최적화
              </Badge>
            </CardTitle>
            <CardDescription>
              통합 컨텍스트 캐싱 레이어 성능 모니터링 (시연용 최적화 적용)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                        캐시 히트율
                      </p>
                      <p className='text-2xl font-bold text-green-600'>---%</p>
                    </div>
                    <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                      <span className='text-green-600 text-sm'>⚡</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                        메모리 사용량
                      </p>
                      <p className='text-2xl font-bold text-blue-600'>--KB</p>
                    </div>
                    <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                      <span className='text-blue-600 text-sm'>💾</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                        Redis 연결
                      </p>
                      <p className='text-2xl font-bold text-purple-600'>
                        확인중
                      </p>
                    </div>
                    <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
                      <span className='text-purple-600 text-sm'>🔗</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='bg-slate-50 dark:bg-slate-800 p-4 rounded-lg mb-4'>
              <h3 className='font-medium mb-3 flex items-center gap-2'>
                🎯 AI 최적화 적용 현황
                <Badge variant='secondary' className='text-xs'>
                  시연용
                </Badge>
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                <div>
                  <p className='font-medium text-slate-700 dark:text-slate-300'>
                    메모리 최적화:
                  </p>
                  <ul className='text-slate-600 dark:text-slate-400 ml-4 list-disc'>
                    <li>패턴 저장소: 20개 → 10개</li>
                    <li>결과 저장소: 50개 → 25개</li>
                    <li>쿼리 히스토리: 20개 → 15개</li>
                  </ul>
                </div>
                <div>
                  <p className='font-medium text-slate-700 dark:text-slate-300'>
                    캐시 최적화:
                  </p>
                  <ul className='text-slate-600 dark:text-slate-400 ml-4 list-disc'>
                    <li>TTL: 1시간 → 30분</li>
                    <li>로컬 캐시: 100개 제한</li>
                    <li>정리 주기: 5분마다</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className='flex space-x-3'>
              <Button
                variant='outline'
                size='sm'
                className='flex items-center gap-2'
              >
                <RefreshCw className='w-4 h-4' />
                캐시 새로고침
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='flex items-center gap-2'
              >
                <BarChart3 className='w-4 h-4' />
                성능 리포트
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='flex items-center gap-2'
              >
                <Trash2 className='w-4 h-4' />
                캐시 정리
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 터미널 명령어 가이드 */}
        <Card>
          <CardHeader>
            <CardTitle>💻 터미널 명령어</CardTitle>
            <CardDescription>개발 효율성을 위한 CLI 도구들</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='bg-muted p-3 rounded font-mono text-sm'>
                <div className='text-green-600 mb-2'># 키 관리</div>
                <div>npm run dev:keys status # 키 상태 확인</div>
                <div>npm run dev:keys setup # 빠른 설정</div>
                <div>npm run dev:keys generate # .env.local 생성</div>
                <div>npm run dev:keys report # 상세 리포트</div>
              </div>
              <div className='bg-muted p-3 rounded font-mono text-sm'>
                <div className='text-blue-600 mb-2'># 서비스 관리</div>
                <div>npm run check-services # 서비스 상태 확인</div>
                <div>npm run dev:setup-keys # 통합 설정</div>
                <div>npm run dev:monitor # 모니터링 모드</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 기존 서비스 상태 섹션 */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Settings className='h-5 w-5' />
                <CardTitle>🔄 외부 서비스 상태</CardTitle>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={fetchServicesStatus}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                />
                새로고침
              </Button>
            </div>
            <CardDescription>
              Supabase, Redis, Google AI, MCP 서버 연결 상태
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 요약 카드 */}
            {servicesData && (
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <Card>
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                          총 서비스
                        </p>
                        <p className='text-2xl font-bold'>
                          {servicesData.summary.total}
                        </p>
                      </div>
                      <Server className='w-8 h-8 text-slate-400' />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                          연결됨
                        </p>
                        <p className='text-2xl font-bold text-green-600'>
                          {servicesData.summary.connected}
                        </p>
                      </div>
                      <CheckCircle className='w-8 h-8 text-green-500' />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                          오류
                        </p>
                        <p className='text-2xl font-bold text-red-600'>
                          {servicesData.summary.errors}
                        </p>
                      </div>
                      <XCircle className='w-8 h-8 text-red-500' />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-slate-600 dark:text-slate-400'>
                          평균 응답시간
                        </p>
                        <p className='text-2xl font-bold'>
                          {formatResponseTime(
                            servicesData.summary.averageResponseTime
                          )}
                        </p>
                      </div>
                      <Clock className='w-8 h-8 text-blue-500' />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 서비스 상태 카드들 */}
            {servicesData && (
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {servicesData.services.map((service, index) => (
                  <Card key={index} className='relative overflow-hidden'>
                    <div
                      className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(service.status)}`}
                    />

                    <CardHeader className='pb-3'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          {getServiceIcon(service.name)}
                          <CardTitle className='text-lg'>
                            {service.name}
                          </CardTitle>
                        </div>
                        <Badge variant={getStatusBadgeVariant(service.status)}>
                          {service.status === 'connected'
                            ? '연결됨'
                            : service.status === 'error'
                              ? '오류'
                              : '알 수 없음'}
                        </Badge>
                      </div>
                      <CardDescription>
                        응답시간: {formatResponseTime(service.responseTime)}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      {service.status === 'error' && service.error && (
                        <div className='mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
                          <p className='text-sm text-red-700 dark:text-red-300 font-medium'>
                            오류:
                          </p>
                          <p className='text-sm text-red-600 dark:text-red-400'>
                            {service.error}
                          </p>
                        </div>
                      )}

                      {service.details && (
                        <div className='space-y-2'>
                          <p className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                            상세 정보:
                          </p>
                          <div className='bg-slate-50 dark:bg-slate-800 p-3 rounded-lg'>
                            <pre className='text-xs text-slate-600 dark:text-slate-400 overflow-x-auto'>
                              {JSON.stringify(service.details, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 마지막 업데이트 시간 */}
        {lastUpdated && (
          <div className='text-center text-sm text-muted-foreground'>
            마지막 업데이트: {lastUpdated.toLocaleString('ko-KR')}
          </div>
        )}

        {/* 개발 팁 */}
        <Card className='mt-8'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              💡 개발 팁
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
              <div>
                <p className='font-medium text-slate-700 dark:text-slate-300'>
                  터미널에서 상태 확인:
                </p>
                <code className='bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs'>
                  curl http://localhost:3000/api/services/status
                </code>
              </div>
              <div>
                <p className='font-medium text-slate-700 dark:text-slate-300'>
                  환경변수 확인:
                </p>
                <code className='bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs'>
                  .env.local 파일 생성 필요
                </code>
              </div>
              <div>
                <p className='font-medium text-slate-700 dark:text-slate-300'>
                  자동 새로고침:
                </p>
                <p className='text-slate-600 dark:text-slate-400'>
                  10초마다 자동으로 상태 업데이트
                </p>
              </div>
              <div>
                <p className='font-medium text-slate-700 dark:text-slate-300'>
                  실시간 모니터링:
                </p>
                <p className='text-slate-600 dark:text-slate-400'>
                  개발 중 이 페이지를 열어두세요
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
