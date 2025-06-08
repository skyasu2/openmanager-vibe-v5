/**
 * 🖥️ Advanced Monitoring Dashboard v2.0
 *
 * RealServerDataGenerator와 EnhancedDataAnalyzer를 활용한 고도화된 모니터링 대시보드
 * - 다층적 서버 아키텍처 시각화
 * - 실시간 AI 분석 및 인사이트
 * - 한국어 자연어 쿼리 인터페이스
 * - 클러스터 및 애플리케이션 수준 모니터링
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
// ❌ 제거: Node.js 전용 모듈을 클라이언트에서 import하면 안됨
// import {
//   RealServerDataGenerator,
//   type ServerInstance,
//   type ServerCluster,
//   type ApplicationMetrics,
// } from '@/services/data-generator/RealServerDataGenerator';
// import {
//   EnhancedDataAnalyzer,
//   type EnhancedAnalysisResult,
//   type QueryResponse,
// } from '@/services/ai/EnhancedDataAnalyzer';

// 🚨 Alert 아이템 타입 정의
interface AlertItem {
  level: 'critical' | 'warning' | 'info';
  message: string;
  timestamp?: string;
  source?: string;
}

// 🚨 Recommendation 아이템 타입 정의  
interface RecommendationItem {
  priority: 'high' | 'medium' | 'low';
  action: string;
  impact: string;
  effort: string;
  description?: string;
  category?: string;
}

// ✅ 완전한 타입 정의 (실제 구현은 API 라우트에서 처리)
interface ServerInstance {
  id: string;
  name: string;
  type: string;
  role: string;
  status: string;
  location?: string;
  environment?: string;
  health: {
    score: number;
    issues: string[];
    lastCheck?: string;
  };
  metrics: {
    cpu: number;
    memory: number;
    disk?: number;
    uptime?: number;
    requests: number;
    errors: number;
  };
  specs?: {
    cpu: {
      cores: number;
      model: string;
    };
    memory: {
      total: number;
      type: string;
    };
    disk: {
      total: number;
      type: string;
    };
    network: {
      bandwidth: number;
    };
  };
}

interface ServerCluster {
  id: string;
  name: string;
  servers: ServerInstance[];
  loadBalancer: {
    algorithm: string;
    activeConnections: number;
  };
  scaling?: {
    current: number;
    max: number;
    policy: string;
  };
}

interface ApplicationMetrics {
  id: string;
  name: string;
  status: string;
  responseTime: number;
  throughput: number;
  version?: string;
  performance?: {
    availability: number;
    responseTime: number;
    throughput: number;
    errorRate: number;
  };
  resources?: {
    cost: number;
  };
  deployments?: {
    production: { servers: number };
    staging: { servers: number };
    development: { servers: number };
  };
}

interface EnhancedAnalysisResult {
  summary: string;
  insights: {
    summary?: string;
    keyFindings?: string[];
    alerts?: AlertItem[];  // ✅ AlertItem[] 타입으로 수정
    recommendations?: RecommendationItem[];  // ✅ RecommendationItem[] 타입으로 수정
  };
  recommendations: string[];
}

interface QueryResponse {
  success: boolean;
  message: string;
  data?: any;
  query?: string;
  response?: string;
  suggestions?: string[];
}

// 🚨 메트릭 카드 컴포넌트
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  status: 'good' | 'warning' | 'critical';
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  status,
  icon,
}) => {
  const statusColors = {
    good: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    critical: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${statusColors[status]}`}>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium opacity-75'>{title}</p>
          <p className='text-2xl font-bold'>{value}</p>
          {change !== undefined && (
            <p
              className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {change >= 0 ? '+' : ''}
              {change}%
            </p>
          )}
        </div>
        {icon && <div className='text-2xl opacity-75'>{icon}</div>}
      </div>
    </div>
  );
};

// 🎯 서버 타입별 아이콘
const getServerTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    web: '🌐',
    api: '🔗',
    database: '🗄️',
    cache: '⚡',
    queue: '📋',
    cdn: '🌎',
    gpu: '🧠',
    storage: '💾',
  };
  return icons[type] || '🖥️';
};

// 🎨 상태별 색상
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    running: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    stopped: 'text-gray-600',
    maintenance: 'text-blue-600',
  };
  return colors[status] || 'text-gray-600';
};

// 🏗️ 서버 카드 컴포넌트
interface ServerCardProps {
  server: ServerInstance;
  onClick: (server: ServerInstance) => void;
}

const ServerCard: React.FC<ServerCardProps> = ({ server, onClick }) => {
  const healthColor =
    server.health.score > 80
      ? 'text-green-600'
      : server.health.score > 50
        ? 'text-yellow-600'
        : 'text-red-600';

  return (
    <div
      className='bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-4 border'
      onClick={() => onClick(server)}
    >
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center space-x-2'>
          <span className='text-2xl'>{getServerTypeIcon(server.type)}</span>
          <div>
            <h3 className='font-medium'>{server.name}</h3>
            <p className='text-xs text-gray-500'>
              {server.type} • {server.role}
            </p>
          </div>
        </div>
        <div className={`text-right ${getStatusColor(server.status)}`}>
          <p className='text-sm font-medium'>{server.status}</p>
          <p className={`text-xs ${healthColor}`}>
            건강도 {server.health.score}
          </p>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-2 text-sm'>
        <div>
          <p className='text-gray-500'>CPU</p>
          <p className='font-medium'>{server.metrics.cpu.toFixed(1)}%</p>
        </div>
        <div>
          <p className='text-gray-500'>메모리</p>
          <p className='font-medium'>{server.metrics.memory.toFixed(1)}%</p>
        </div>
        <div>
          <p className='text-gray-500'>요청/분</p>
          <p className='font-medium'>{server.metrics.requests}</p>
        </div>
        <div>
          <p className='text-gray-500'>오류</p>
          <p className='font-medium text-red-600'>{server.metrics.errors}</p>
        </div>
      </div>

      {server.health.issues.length > 0 && (
        <div className='mt-2 p-2 bg-red-50 rounded text-xs text-red-700'>
          ⚠️ {server.health.issues.length}개 이슈 감지됨
        </div>
      )}
    </div>
  );
};

// 🔍 클러스터 카드 컴포넌트
interface ClusterCardProps {
  cluster: ServerCluster;
}

const ClusterCard: React.FC<ClusterCardProps> = ({ cluster }) => {
  const avgHealth =
    cluster.servers.reduce((sum, s) => sum + s.health.score, 0) /
    cluster.servers.length;
  const totalRequests = cluster.servers.reduce(
    (sum, s) => sum + s.metrics.requests,
    0
  );

  return (
    <div className='bg-white rounded-lg shadow p-4 border'>
      <div className='flex items-center justify-between mb-3'>
        <div>
          <h3 className='font-medium'>{cluster.name}</h3>
          <p className='text-xs text-gray-500'>
            🏗️ {cluster.servers.length}개 서버
          </p>
        </div>
        <div className='text-right'>
          <p className='text-sm font-medium'>
            {cluster.loadBalancer.algorithm}
          </p>
          <p className='text-xs text-gray-500'>로드밸런서</p>
        </div>
      </div>

      <div className='grid grid-cols-3 gap-2 text-sm'>
        <div>
          <p className='text-gray-500'>평균 건강도</p>
          <p className='font-medium'>{avgHealth.toFixed(0)}</p>
        </div>
        <div>
          <p className='text-gray-500'>활성 연결</p>
          <p className='font-medium'>
            {cluster.loadBalancer.activeConnections}
          </p>
        </div>
        <div>
          <p className='text-gray-500'>총 요청</p>
          <p className='font-medium'>{totalRequests}</p>
        </div>
      </div>

      <div className='mt-3 bg-gray-50 rounded p-2'>
        <p className='text-xs text-gray-600'>
          스케일링: {cluster.scaling?.current}/{cluster.scaling?.max}(
          {cluster.scaling?.policy} 기반)
        </p>
      </div>
    </div>
  );
};

// 🗣️ AI 쿼리 인터페이스
interface AIQueryInterfaceProps {
  onQuery: (query: string) => Promise<QueryResponse>;
}

const AIQueryInterface: React.FC<AIQueryInterfaceProps> = ({ onQuery }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const result = await onQuery(query);
      setResponse(result);
    } catch (error) {
      console.error('쿼리 처리 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQueries = [
    'CPU 사용률이 높은 서버를 찾아주세요',
    '시스템 전체 성능 상태는 어떤가요?',
    '메모리 부족 문제가 있는 서버가 있나요?',
    '오류가 많이 발생하는 서버를 알려주세요',
  ];

  return (
    <div className='bg-white rounded-lg shadow p-6 border'>
      <h3 className='text-lg font-medium mb-4'>🤖 AI 시스템 분석</h3>

      <form onSubmit={handleSubmit} className='mb-4'>
        <div className='flex space-x-2'>
          <input
            type='text'
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='시스템에 대해 궁금한 것을 물어보세요...'
            className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            disabled={isLoading}
          />
          <button
            type='submit'
            disabled={isLoading || !query.trim()}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
          >
            {isLoading ? '분석중...' : '질문'}
          </button>
        </div>
      </form>

      <div className='mb-4'>
        <p className='text-sm text-gray-600 mb-2'>빠른 질문:</p>
        <div className='flex flex-wrap gap-2'>
          {quickQueries.map((quickQuery, index) => (
            <button
              key={index}
              onClick={() => setQuery(quickQuery)}
              className='text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded'
            >
              {quickQuery}
            </button>
          ))}
        </div>
      </div>

      {response && (
        <div className='border-t pt-4'>
          <div className='mb-2'>
            <span className='text-sm text-gray-500'>질문:</span>
            <p className='text-sm font-medium'>{response.query}</p>
          </div>
          <div className='mb-2'>
            <span className='text-sm text-gray-500'>답변:</span>
            <p className='text-sm'>{response.response}</p>
          </div>
          {(response.suggestions?.length || 0) > 0 && (
            <div>
              <span className='text-sm text-gray-500'>추가 제안:</span>
              <ul className='text-sm text-blue-600'>
                {(response.suggestions || []).map((suggestion: string, index: number) => (
                  <li
                    key={index}
                    className='cursor-pointer hover:underline'
                    onClick={() => setQuery(suggestion)}
                  >
                    • {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 📈 메인 대시보드 컴포넌트
export const AdvancedMonitoringDashboard: React.FC = () => {
  const [servers, setServers] = useState<ServerInstance[]>([]);
  const [clusters, setClusters] = useState<ServerCluster[]>([]);
  const [applications, setApplications] = useState<ApplicationMetrics[]>([]);
  const [analysis, setAnalysis] = useState<EnhancedAnalysisResult | null>(null);
  const [selectedServer, setSelectedServer] = useState<ServerInstance | null>(
    null
  );
  const [currentView, setCurrentView] = useState<
    'overview' | 'servers' | 'clusters' | 'applications'
  >('overview');

  // 🔄 데이터 새로고침
  const refreshData = useCallback(async () => {
    try {
      // ✅ API 호출로 변경
      const [serversRes, clustersRes, appsRes] = await Promise.all([
        fetch('/api/servers/realtime'),
        fetch('/api/servers/realtime?type=clusters'),
        fetch('/api/servers/realtime?type=applications')
      ]);

      const serversData = await serversRes.json();
      const clustersData = await clustersRes.json();
      const appsData = await appsRes.json();

      setServers(serversData.data || []);
      setClusters(clustersData.data || []);
      setApplications(appsData.data || []);

      // AI 분석 실행
      const analysisRes = await fetch('/api/ai/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze-system' })
      });
      const analysisResult = await analysisRes.json();
      setAnalysis(analysisResult.data || { summary: '', insights: { recommendations: [] }, recommendations: [] });
    } catch (error) {
      console.error('데이터 새로고침 실패:', error);
      // 안전한 fallback
      setServers([]);
      setClusters([]);
      setApplications([]);
      setAnalysis({ summary: '데이터 로딩 실패', insights: { recommendations: [] }, recommendations: [] });
    }
  }, []);

  // 🚀 초기화 및 자동 새로고침
  useEffect(() => {
    // ✅ API 호출로 초기화
      refreshData();

    // 자동 새로고침 설정 (30초마다)
    const interval = setInterval(refreshData, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [refreshData]);

  // 🤖 AI 쿼리 처리
  const handleAIQuery = async (query: string): Promise<QueryResponse> => {
    try {
      const response = await fetch('/api/ai/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, action: 'natural-language-query' })
      });
      const result = await response.json();
      return {
        success: result.success || true,
        message: result.message || '처리 완료',
        data: result.data,
        query: query,
        response: result.response || result.message,
        suggestions: result.suggestions || []
      };
    } catch (error) {
      return {
        success: false,
        message: '쿼리 처리 중 오류가 발생했습니다.',
        query: query,
        response: '오류가 발생했습니다.',
        suggestions: []
      };
    }
  };

  // 📊 메트릭 계산
  const totalServers = servers.length;
  const healthyServers = servers.filter(s => s.health.score > 80).length;
  const warningServers = servers.filter(
    s => s.health.score <= 80 && s.health.score > 50
  ).length;
  const criticalServers = servers.filter(s => s.health.score <= 50).length;
  const avgCpu =
    totalServers > 0
      ? servers.reduce((sum, s) => sum + s.metrics.cpu, 0) / totalServers
      : 0;
  const avgMemory =
    totalServers > 0
      ? servers.reduce((sum, s) => sum + s.metrics.memory, 0) / totalServers
      : 0;
  const totalRequests = servers.reduce((sum, s) => sum + s.metrics.requests, 0);
  const totalErrors = servers.reduce((sum, s) => sum + s.metrics.errors, 0);

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* 헤더 */}
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            🖥️ Advanced Monitoring Dashboard
          </h1>
          <p className='text-gray-600'>
            실시간 시스템 모니터링 및 AI 분석 • 마지막 업데이트:{' '}
            {new Date().toLocaleTimeString('ko-KR')}
          </p>
        </div>

        {/* 네비게이션 */}
        <div className='mb-6'>
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex space-x-8'>
              {[
                { key: 'overview', label: '📊 개요', icon: '📊' },
                { key: 'servers', label: '🖥️ 서버', icon: '🖥️' },
                { key: 'clusters', label: '🏗️ 클러스터', icon: '🏗️' },
                { key: 'applications', label: '📱 애플리케이션', icon: '📱' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setCurrentView(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    currentView === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 개요 탭 */}
        {currentView === 'overview' && (
          <div className='space-y-6'>
            {/* 핵심 메트릭 */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              <MetricCard
                title='전체 서버'
                value={totalServers}
                status='good'
                icon='🖥️'
              />
              <MetricCard
                title='정상 서버'
                value={`${healthyServers}/${totalServers}`}
                change={
                  healthyServers > warningServers + criticalServers ? 5 : -2
                }
                status={
                  healthyServers > totalServers * 0.8 ? 'good' : 'warning'
                }
                icon='✅'
              />
              <MetricCard
                title='평균 CPU'
                value={`${avgCpu.toFixed(1)}%`}
                status={
                  avgCpu < 70 ? 'good' : avgCpu < 85 ? 'warning' : 'critical'
                }
                icon='⚡'
              />
              <MetricCard
                title='평균 메모리'
                value={`${avgMemory.toFixed(1)}%`}
                status={
                  avgMemory < 80
                    ? 'good'
                    : avgMemory < 90
                      ? 'warning'
                      : 'critical'
                }
                icon='💾'
              />
            </div>

            {/* AI 분석 결과 */}
            {analysis && (
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* 시스템 인사이트 */}
                <div className='bg-white rounded-lg shadow p-6 border'>
                  <h3 className='text-lg font-medium mb-4'>
                    🧠 AI 시스템 인사이트
                  </h3>
                  <div className='space-y-4'>
                    <div>
                      <h4 className='font-medium text-gray-900'>요약</h4>
                      <p className='text-sm text-gray-600'>
                        {analysis.insights.summary}
                      </p>
                    </div>

                    <div>
                      <h4 className='font-medium text-gray-900'>
                        주요 발견사항
                      </h4>
                      <ul className='text-sm text-gray-600 space-y-1'>
                        {analysis.insights.keyFindings?.map((finding, index) => (
                          <li key={index}>• {finding}</li>
                        ))}
                      </ul>
                    </div>

                    {(analysis.insights.alerts?.length || 0) > 0 && (
                      <div>
                        <h4 className='font-medium text-gray-900'>알림</h4>
                        <div className='space-y-2'>
                          {(analysis.insights.alerts || []).map((alert: AlertItem, index: number) => (
                            <div
                              key={index}
                              className={`p-2 rounded text-sm ${
                                alert.level === 'critical'
                                  ? 'bg-red-50 text-red-700'
                                  : alert.level === 'warning'
                                    ? 'bg-yellow-50 text-yellow-700'
                                    : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {alert.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 권장사항 */}
                <div className='bg-white rounded-lg shadow p-6 border'>
                  <h3 className='text-lg font-medium mb-4'>💡 권장사항</h3>
                  <div className='space-y-3'>
                    {(analysis.insights.recommendations || []).map((rec: RecommendationItem, index: number) => (
                      <div
                        key={index}
                        className='border-l-4 border-blue-400 pl-4'
                      >
                        <div className='flex items-center space-x-2 mb-1'>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              rec.priority === 'high'
                                ? 'bg-red-100 text-red-800'
                                : rec.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {rec.priority === 'high'
                              ? '높음'
                              : rec.priority === 'medium'
                                ? '중간'
                                : '낮음'}
                          </span>
                        </div>
                        <p className='font-medium text-sm'>{rec.action}</p>
                        <p className='text-xs text-gray-600'>
                          영향: {rec.impact}
                        </p>
                        <p className='text-xs text-gray-600'>
                          소요: {rec.effort}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI 쿼리 인터페이스 */}
            <AIQueryInterface onQuery={handleAIQuery} />
          </div>
        )}

        {/* 서버 탭 */}
        {currentView === 'servers' && (
          <div className='space-y-6'>
            <div className='flex justify-between items-center'>
              <h2 className='text-xl font-medium'>
                서버 목록 ({totalServers}대)
              </h2>
              <div className='flex space-x-2'>
                <span className='px-2 py-1 bg-green-100 text-green-800 rounded text-sm'>
                  정상 {healthyServers}
                </span>
                <span className='px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm'>
                  경고 {warningServers}
                </span>
                <span className='px-2 py-1 bg-red-100 text-red-800 rounded text-sm'>
                  임계 {criticalServers}
                </span>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              {servers.map(server => (
                <ServerCard
                  key={server.id}
                  server={server}
                  onClick={setSelectedServer}
                />
              ))}
            </div>
          </div>
        )}

        {/* 클러스터 탭 */}
        {currentView === 'clusters' && (
          <div className='space-y-6'>
            <h2 className='text-xl font-medium'>
              클러스터 목록 ({clusters.length}개)
            </h2>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {clusters.map(cluster => (
                <ClusterCard key={cluster.id} cluster={cluster} />
              ))}
            </div>
          </div>
        )}

        {/* 애플리케이션 탭 */}
        {currentView === 'applications' && (
          <div className='space-y-6'>
            <h2 className='text-xl font-medium'>
              애플리케이션 목록 ({applications.length}개)
            </h2>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {applications.map(app => (
                <div
                  key={app.name}
                  className='bg-white rounded-lg shadow p-4 border'
                >
                  <div className='flex items-center justify-between mb-3'>
                    <div>
                      <h3 className='font-medium'>{app.name}</h3>
                      <p className='text-xs text-gray-500'>v{app.version}</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-medium'>
                        {app.performance?.availability.toFixed(1)}%
                      </p>
                      <p className='text-xs text-gray-500'>가용성</p>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-2 text-sm'>
                    <div>
                      <p className='text-gray-500'>응답시간</p>
                      <p className='font-medium'>
                        {app.performance?.responseTime}ms
                      </p>
                    </div>
                    <div>
                      <p className='text-gray-500'>처리량</p>
                      <p className='font-medium'>
                        {app.performance?.throughput}
                      </p>
                    </div>
                    <div>
                      <p className='text-gray-500'>오류율</p>
                      <p className='font-medium text-red-600'>
                        {app.performance?.errorRate.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className='text-gray-500'>비용</p>
                      <p className='font-medium'>${app.resources?.cost}</p>
                    </div>
                  </div>

                  <div className='mt-3 bg-gray-50 rounded p-2'>
                    <p className='text-xs text-gray-600'>
                      운영: {app.deployments?.production.servers}대 • 스테이징:{' '}
                      {app.deployments?.staging.servers}대 • 개발:{' '}
                      {app.deployments?.development.servers}대
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 서버 상세 모달 */}
        {selectedServer && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto'>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h2 className='text-xl font-bold flex items-center space-x-2'>
                    <span>{getServerTypeIcon(selectedServer.type)}</span>
                    <span>{selectedServer.name}</span>
                  </h2>
                  <button
                    onClick={() => setSelectedServer(null)}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    ✕
                  </button>
                </div>

                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <h3 className='font-medium mb-2'>기본 정보</h3>
                      <p>타입: {selectedServer.type}</p>
                      <p>역할: {selectedServer.role}</p>
                      <p>위치: {selectedServer.location}</p>
                      <p>환경: {selectedServer.environment}</p>
                      <p>
                        상태:{' '}
                        <span className={getStatusColor(selectedServer.status)}>
                          {selectedServer.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <h3 className='font-medium mb-2'>하드웨어 스펙</h3>
                      <p>
                        CPU: {selectedServer.specs?.cpu.cores}코어{' '}
                        {selectedServer.specs?.cpu.model}
                      </p>
                      <p>
                        메모리: {selectedServer.specs?.memory.total}GB{' '}
                        {selectedServer.specs?.memory.type}
                      </p>
                      <p>
                        디스크: {selectedServer.specs?.disk.total}GB{' '}
                        {selectedServer.specs?.disk.type}
                      </p>
                      <p>
                        네트워크: {selectedServer.specs?.network.bandwidth}Mbps
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className='font-medium mb-2'>현재 메트릭</h3>
                    <div className='grid grid-cols-4 gap-4'>
                      <div className='bg-gray-50 p-3 rounded'>
                        <p className='text-sm text-gray-600'>CPU</p>
                        <p className='font-bold'>
                          {selectedServer.metrics.cpu.toFixed(1)}%
                        </p>
                      </div>
                      <div className='bg-gray-50 p-3 rounded'>
                        <p className='text-sm text-gray-600'>메모리</p>
                        <p className='font-bold'>
                          {selectedServer.metrics.memory.toFixed(1)}%
                        </p>
                      </div>
                      <div className='bg-gray-50 p-3 rounded'>
                        <p className='text-sm text-gray-600'>디스크</p>
                        <p className='font-bold'>
                          {selectedServer.metrics.disk?.toFixed(1)}%
                        </p>
                      </div>
                      <div className='bg-gray-50 p-3 rounded'>
                        <p className='text-sm text-gray-600'>업타임</p>
                        <p className='font-bold'>
                          {selectedServer.metrics.uptime?.toFixed(1)}일
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className='font-medium mb-2'>건강도 및 이슈</h3>
                    <div className='flex items-center space-x-4 mb-2'>
                      <span className='text-lg font-bold'>
                        건강도: {selectedServer.health.score}/100
                      </span>
                      <span className='text-sm text-gray-600'>
                        마지막 체크: {selectedServer.health.lastCheck}
                      </span>
                    </div>
                    {selectedServer.health.issues.length > 0 && (
                      <div className='space-y-1'>
                        {selectedServer.health.issues.map((issue, index) => (
                          <div
                            key={index}
                            className='bg-red-50 text-red-700 p-2 rounded text-sm'
                          >
                            ⚠️ {issue}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedMonitoringDashboard;
