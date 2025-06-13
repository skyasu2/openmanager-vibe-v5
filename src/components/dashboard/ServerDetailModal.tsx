'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { Server } from '../../types/server';
import { timerManager } from '../../utils/TimerManager';
import { safeFormatUptime } from '../../utils/safeFormat';

interface ServerDetailModalProps {
  server: Server | null;
  onClose: () => void;
}

interface MetricsHistory {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: {
    bytesReceived: number;
    bytesSent: number;
  };
  responseTime: number;
  connections: number;
}

interface RealTimeMetrics {
  processes: number;
  loadAverage: string;
  temperature: number;
  networkThroughput: {
    in: number;
    out: number;
  };
}

interface NetworkMetrics {
  bytesIn: number; // 수신 데이터 (MB/s)
  bytesOut: number; // 송신 데이터 (MB/s)
  packetsIn: number; // 수신 패킷 수
  packetsOut: number; // 송신 패킷 수
  connections: number; // 활성 연결 수
  latency: number; // 네트워크 지연 시간 (ms)
  bandwidth: number; // 대역폭 사용률 (%)
  errorRate: number; // 패킷 에러율 (%)
}

export default function ServerDetailModal({
  server,
  onClose,
}: ServerDetailModalProps) {
  const [metricsHistory, setMetricsHistory] = useState<MetricsHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'metrics' | 'network' | 'processes' | 'logs'
  >('overview');
  const [realTimeMetrics, setRealTimeMetrics] =
    useState<RealTimeMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

  const loadMetricsHistory = useCallback(
    async (serverId: string, range: string = '24h') => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch(
          `/api/servers/${serverId}?history=true&range=${range}`
        );
        const data = await response.json();

        if (data.success && data.history) {
          setMetricsHistory(data.history.metrics);
        } else {
          setMetricsHistory(generateSimulatedHistory(range));
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('히스토리 데이터 로드 실패:', error);
        }
        setMetricsHistory(generateSimulatedHistory(range));
      } finally {
        setIsLoadingHistory(false);
      }
    },
    []
  );

  // 실시간 메트릭 업데이트
  useEffect(() => {
    if (!server) return;

    const updateRealTimeMetrics = () => {
      setRealTimeMetrics({
        processes: Math.floor(Math.random() * 200) + 150,
        loadAverage: (Math.random() * 2).toFixed(2),
        temperature: Math.floor(Math.random() * 20) + 45,
        networkThroughput: {
          in: Math.floor(Math.random() * 1000) + 500,
          out: Math.floor(Math.random() * 800) + 300,
        },
      });
    };

    updateRealTimeMetrics();

    // TimerManager를 사용한 실시간 메트릭 업데이트
    timerManager.register({
      id: `server-detail-metrics-${server.id}`,
      callback: updateRealTimeMetrics,
      interval: 3000,
      priority: 'medium',
      enabled: true,
    });

    return () => {
      timerManager.unregister(`server-detail-metrics-${server.id}`);
    };
  }, [server]);

  useEffect(() => {
    if (server) {
      document.body.style.overflow = 'hidden';
      loadMetricsHistory(server.id, timeRange);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [server, loadMetricsHistory, timeRange]);

  const generateSimulatedHistory = (range: string): MetricsHistory[] => {
    const history: MetricsHistory[] = [];
    const now = new Date();

    // 시간 범위에 따른 데이터 포인트 수
    const hours =
      range === '1h' ? 1 : range === '6h' ? 6 : range === '24h' ? 24 : 168; // 7d = 168h
    const interval =
      range === '1h' ? 5 : range === '6h' ? 30 : range === '24h' ? 60 : 360; // 분 단위
    const points = Math.floor((hours * 60) / interval);

    for (let i = points - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * interval * 60 * 1000);

      // 시간대별 패턴 적용
      const hour = timestamp.getHours();
      let baseLoad = 0.3;

      if (hour >= 9 && hour <= 18) {
        baseLoad = 0.7;
      } else if (hour >= 19 && hour <= 23) {
        baseLoad = 0.5;
      }

      const variation = (Math.random() - 0.5) * 0.3;
      const load = Math.max(0.1, Math.min(0.9, baseLoad + variation));

      history.push({
        timestamp: timestamp.toISOString(),
        cpu: Math.round(load * 100),
        memory: Math.round((load * 0.8 + Math.random() * 0.2) * 100),
        disk: Math.round((0.4 + Math.random() * 0.3) * 100),
        network: {
          bytesReceived: Math.round(load * 50000000),
          bytesSent: Math.round(load * 30000000),
        },
        responseTime: Math.round(100 + load * 200 + Math.random() * 100),
        connections: Math.round(50 + load * 200),
      });
    }

    return history;
  };

  // 메트릭 통계 계산
  const metricsStats = useMemo(() => {
    if (metricsHistory.length === 0) return null;

    const cpuAvg = Math.round(
      metricsHistory.reduce((sum, m) => sum + m.cpu, 0) / metricsHistory.length
    );
    const memoryAvg = Math.round(
      metricsHistory.reduce((sum, m) => sum + m.memory, 0) /
        metricsHistory.length
    );
    const diskAvg = Math.round(
      metricsHistory.reduce((sum, m) => sum + m.disk, 0) / metricsHistory.length
    );
    const responseTimeAvg = Math.round(
      metricsHistory.reduce((sum, m) => sum + m.responseTime, 0) /
        metricsHistory.length
    );

    const cpuMax = Math.max(...metricsHistory.map(m => m.cpu));
    const memoryMax = Math.max(...metricsHistory.map(m => m.memory));
    const responseTimeMax = Math.max(
      ...metricsHistory.map(m => m.responseTime)
    );

    return {
      cpu: { avg: cpuAvg, max: cpuMax },
      memory: { avg: memoryAvg, max: memoryMax },
      disk: { avg: diskAvg, max: Math.max(...metricsHistory.map(m => m.disk)) },
      responseTime: { avg: responseTimeAvg, max: responseTimeMax },
    };
  }, [metricsHistory]);

  if (!server) return null;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'online':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: '정상',
          icon: '🟢',
        };
      case 'warning':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: '경고',
          icon: '🟡',
        };
      case 'offline':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: '위험',
          icon: '🔴',
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: '알 수 없음',
          icon: '⚪',
        };
    }
  };

  const statusInfo = getStatusInfo(server.status);

  // 차트 데이터 포인트 생성 (개선된 버전)
  const generateChartPoints = (data: number[], maxHeight: number = 140) => {
    if (data.length === 0) return '';

    const maxValue = Math.max(...data, 100); // 최소 100으로 설정
    const minValue = Math.min(...data, 0);
    const range = maxValue - minValue || 100;

    return data
      .map((value, index) => {
        const x = (index / Math.max(data.length - 1, 1)) * 300; // 실제 크기로 변경
        const y = maxHeight - ((value - minValue) / range) * maxHeight;
        return `${x},${y}`;
      })
      .join(' ');
  };

  // 실시간 게이지 컴포넌트
  const CircularGauge = ({
    value,
    max = 100,
    label,
    color,
    size = 120,
  }: {
    value: number;
    max?: number;
    label: string;
    color: string;
    size?: number;
  }) => {
    const percentage = (value / max) * 100;
    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className='flex flex-col items-center'>
        <div className='relative' style={{ width: size, height: size }}>
          <svg className='transform -rotate-90' width={size} height={size}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r='45'
              stroke='#e5e7eb'
              strokeWidth='8'
              fill='transparent'
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r='45'
              stroke={color}
              strokeWidth='8'
              fill='transparent'
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap='round'
              className='transition-all duration-1000 ease-out'
            />
          </svg>
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='text-center'>
              <div className='text-lg font-bold'>{value}%</div>
            </div>
          </div>
        </div>
        <div className='mt-2 text-sm font-medium text-gray-700'>{label}</div>
      </div>
    );
  };

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      {/* 백드롭 */}
      <div
        className='fixed inset-0 bg-black bg-opacity-60 transition-opacity'
        onClick={onClose}
      ></div>

      {/* 모달 컨텐트 */}
      <div className='flex min-h-full items-center justify-center p-2 sm:p-4'>
        <div className='relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden border border-gray-200'>
          {/* 헤더 */}
          <div className='flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50'>
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-3'>
                <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold'>
                  {server.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className='text-xl sm:text-2xl font-bold text-gray-900'>
                    {server.name}
                  </h2>
                  <div className='flex items-center gap-2 mt-1'>
                    <span
                      className={`${statusInfo.color} text-sm font-medium flex items-center gap-1`}
                    >
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                    <span className='text-gray-500 text-sm'>•</span>
                    <span className='text-gray-600 text-sm'>
                      {server.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all p-2 rounded-lg'
              aria-label='모달 닫기'
              title='모달 닫기'
            >
              <i className='fas fa-times text-xl'></i>
            </button>
          </div>

          {/* 탭 네비게이션 */}
          <div className='border-b border-gray-200 bg-gray-50'>
            <nav className='flex space-x-8 px-4 sm:px-6'>
              {[
                { id: 'overview', label: '개요', icon: 'fas fa-chart-line' },
                { id: 'metrics', label: '메트릭', icon: 'fas fa-chart-bar' },
                {
                  id: 'network',
                  label: '네트워크',
                  icon: 'fas fa-network-wired',
                },
                { id: 'processes', label: '프로세스', icon: 'fas fa-cogs' },
                { id: 'logs', label: '로그', icon: 'fas fa-file-alt' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <i className={`${tab.icon} mr-2`}></i>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 메인 컨텐트 */}
          <div className='p-4 sm:p-6 max-h-[75vh] overflow-y-auto'>
            {/* 개요 탭 */}
            {selectedTab === 'overview' && (
              <div className='space-y-6'>
                {/* 실시간 리소스 게이지 */}
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    실시간 리소스 사용률
                  </h3>
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center'>
                    <CircularGauge
                      value={server.cpu}
                      label='CPU'
                      color='#ef4444'
                    />
                    <CircularGauge
                      value={server.memory}
                      label='메모리'
                      color='#3b82f6'
                    />
                    <CircularGauge
                      value={server.disk}
                      label='디스크'
                      color='#8b5cf6'
                    />
                    <CircularGauge
                      value={
                        realTimeMetrics
                          ? Math.min(
                              (realTimeMetrics.networkThroughput.in +
                                realTimeMetrics.networkThroughput.out) /
                                20,
                              100
                            )
                          : 45
                      }
                      label='네트워크'
                      color='#22c55e'
                    />
                  </div>
                </div>

                {/* 네트워크 상세 정보 */}
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    네트워크 상세 정보
                  </h3>
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6'>
                    <div className='bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-4 border border-green-200'>
                      <div className='text-green-600 text-sm font-medium'>
                        연결 수
                      </div>
                      <div className='text-2xl font-bold text-green-700'>
                        {realTimeMetrics
                          ? Math.floor(Math.random() * 200) + 50
                          : 127}
                      </div>
                      <div className='text-xs text-green-600'>활성 연결</div>
                    </div>
                    <div className='bg-gradient-to-br from-blue-50 to-cyan-100 rounded-lg p-4 border border-blue-200'>
                      <div className='text-blue-600 text-sm font-medium'>
                        지연 시간
                      </div>
                      <div className='text-2xl font-bold text-blue-700'>
                        {Math.floor(Math.random() * 50) + 15}ms
                      </div>
                      <div className='text-xs text-blue-600'>평균 응답</div>
                    </div>
                    <div className='bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg p-4 border border-purple-200'>
                      <div className='text-purple-600 text-sm font-medium'>
                        패킷 In
                      </div>
                      <div className='text-2xl font-bold text-purple-700'>
                        {realTimeMetrics
                          ? Math.floor(
                              realTimeMetrics.networkThroughput.in * 100
                            )
                          : 2547}
                      </div>
                      <div className='text-xs text-purple-600'>pkt/s</div>
                    </div>
                    <div className='bg-gradient-to-br from-orange-50 to-amber-100 rounded-lg p-4 border border-orange-200'>
                      <div className='text-orange-600 text-sm font-medium'>
                        패킷 Out
                      </div>
                      <div className='text-2xl font-bold text-orange-700'>
                        {realTimeMetrics
                          ? Math.floor(
                              realTimeMetrics.networkThroughput.out * 85
                            )
                          : 1892}
                      </div>
                      <div className='text-xs text-orange-600'>pkt/s</div>
                    </div>
                  </div>
                </div>

                {/* 시스템 정보 카드들 */}
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  {/* 기본 정보 */}
                  <div className='bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200'>
                    <h4 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                      <i className='fas fa-server mr-2 text-blue-600'></i>
                      시스템 정보
                    </h4>
                    <div className='space-y-3 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>운영체제</span>
                        <span className='font-medium'>{server.os}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>가동시간</span>
                        <span className='font-medium'>
                          {safeFormatUptime(server.uptime)}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>IP 주소</span>
                        <span className='font-medium'>{server.ip}</span>
                      </div>
                      {realTimeMetrics && (
                        <>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>프로세스 수</span>
                            <span className='font-medium'>
                              {realTimeMetrics.processes}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>로드 평균</span>
                            <span className='font-medium'>
                              {realTimeMetrics.loadAverage}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>CPU 온도</span>
                            <span className='font-medium'>
                              {realTimeMetrics.temperature}°C
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>네트워크 In</span>
                            <span className='font-medium'>
                              {realTimeMetrics.networkThroughput.in.toFixed(1)}{' '}
                              MB/s
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>네트워크 Out</span>
                            <span className='font-medium'>
                              {realTimeMetrics.networkThroughput.out.toFixed(1)}{' '}
                              MB/s
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 네트워크 정보 */}
                  <div className='bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200'>
                    <h4 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                      <i className='fas fa-network-wired mr-2 text-blue-600'></i>
                      네트워크 상태
                    </h4>
                    <div className='space-y-3 text-sm'>
                      {realTimeMetrics && (
                        <>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>수신 속도</span>
                            <span className='font-medium text-green-600'>
                              ↓ {realTimeMetrics.networkThroughput.in} KB/s
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>송신 속도</span>
                            <span className='font-medium text-blue-600'>
                              ↑ {realTimeMetrics.networkThroughput.out} KB/s
                            </span>
                          </div>
                        </>
                      )}
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>응답시간</span>
                        <span className='font-medium'>
                          {(Math.random() * 100 + 50).toFixed(0)}ms
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>활성 연결</span>
                        <span className='font-medium'>
                          {Math.floor(Math.random() * 100) + 50}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 서비스 상태 */}
                <div className='bg-white rounded-xl p-6 border border-gray-200'>
                  <h4 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                    <i className='fas fa-cog mr-2 text-green-600'></i>
                    실행 중인 서비스
                  </h4>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                    {server.services.map((service, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          service.status === 'running'
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                service.status === 'running'
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                              }`}
                            ></div>
                            <span className='font-medium'>{service.name}</span>
                          </div>
                          <span className='text-xs bg-white px-2 py-1 rounded'>
                            :{service.port}
                          </span>
                        </div>
                        <div className='text-xs mt-1'>
                          상태:{' '}
                          {service.status === 'running' ? '실행 중' : '중지됨'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 네트워크 탭 */}
            {selectedTab === 'network' && (
              <div className='space-y-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  네트워크 상세 분석
                </h3>

                {/* 실시간 네트워크 상태 */}
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                  <div className='bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200'>
                    <h4 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                      <i className='fas fa-exchange-alt mr-2 text-green-600'></i>
                      트래픽 현황
                    </h4>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between'>
                        <span className='text-gray-600'>수신 (Ingress)</span>
                        <div className='flex items-center gap-2'>
                          <div className='w-20 h-2 bg-green-200 rounded-full overflow-hidden'>
                            <div
                              className='h-full bg-green-500 rounded-full transition-all duration-1000'
                              style={{
                                width: `${realTimeMetrics ? realTimeMetrics.networkThroughput.in / 10 : 45}%`,
                              }}
                            ></div>
                          </div>
                          <span className='font-medium text-green-700'>
                            {realTimeMetrics
                              ? realTimeMetrics.networkThroughput.in.toFixed(1)
                              : '4.5'}{' '}
                            MB/s
                          </span>
                        </div>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-gray-600'>송신 (Egress)</span>
                        <div className='flex items-center gap-2'>
                          <div className='w-20 h-2 bg-blue-200 rounded-full overflow-hidden'>
                            <div
                              className='h-full bg-blue-500 rounded-full transition-all duration-1000'
                              style={{
                                width: `${realTimeMetrics ? realTimeMetrics.networkThroughput.out / 8 : 38}%`,
                              }}
                            ></div>
                          </div>
                          <span className='font-medium text-blue-700'>
                            {realTimeMetrics
                              ? realTimeMetrics.networkThroughput.out.toFixed(1)
                              : '3.2'}{' '}
                            MB/s
                          </span>
                        </div>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-gray-600'>총 대역폭 사용률</span>
                        <span className='font-bold text-lg text-gray-800'>
                          {realTimeMetrics
                            ? Math.min(
                                ((realTimeMetrics.networkThroughput.in +
                                  realTimeMetrics.networkThroughput.out) /
                                  20) *
                                  100,
                                100
                              ).toFixed(1)
                            : '42.5'}
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-6 border border-blue-200'>
                    <h4 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                      <i className='fas fa-link mr-2 text-blue-600'></i>
                      연결 상태
                    </h4>
                    <div className='space-y-4'>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>활성 연결</span>
                        <span className='font-medium text-blue-700'>
                          {Math.floor(Math.random() * 200) + 100}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>대기 중 연결</span>
                        <span className='font-medium text-yellow-600'>
                          {Math.floor(Math.random() * 20) + 5}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>평균 지연시간</span>
                        <span className='font-medium text-green-600'>
                          {Math.floor(Math.random() * 30) + 15}ms
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>패킷 손실률</span>
                        <span className='font-medium text-red-600'>
                          {(Math.random() * 0.5).toFixed(3)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 네트워크 인터페이스 목록 */}
                <div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
                  <div className='px-6 py-4 border-b border-gray-200 bg-gray-50'>
                    <h4 className='text-lg font-semibold text-gray-900'>
                      네트워크 인터페이스
                    </h4>
                  </div>
                  <div className='overflow-x-auto'>
                    <table className='min-w-full divide-y divide-gray-200'>
                      <thead className='bg-gray-50'>
                        <tr>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            인터페이스
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            IP 주소
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            상태
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            RX (MB/s)
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            TX (MB/s)
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            지연시간
                          </th>
                        </tr>
                      </thead>
                      <tbody className='bg-white divide-y divide-gray-200'>
                        {[
                          {
                            name: 'eth0',
                            ip: '192.168.1.100',
                            status: 'up',
                            rx: 4.2,
                            tx: 2.8,
                            latency: 12,
                          },
                          {
                            name: 'eth1',
                            ip: '10.0.0.15',
                            status: 'up',
                            rx: 1.5,
                            tx: 0.9,
                            latency: 8,
                          },
                          {
                            name: 'lo',
                            ip: '127.0.0.1',
                            status: 'up',
                            rx: 0.1,
                            tx: 0.1,
                            latency: 1,
                          },
                        ].map((iface, index) => (
                          <tr key={index} className='hover:bg-gray-50'>
                            <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                              {iface.name}
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                              {iface.ip}
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  iface.status === 'up'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {iface.status === 'up' ? '활성' : '비활성'}
                              </span>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                              {iface.rx.toFixed(1)}
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                              {iface.tx.toFixed(1)}
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                              {iface.latency}ms
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 포트 사용량 */}
                <div className='bg-white rounded-xl border border-gray-200 p-6'>
                  <h4 className='text-lg font-semibold text-gray-900 mb-4 flex items-center'>
                    <i className='fas fa-door-open mr-2 text-purple-600'></i>
                    포트 사용 현황
                  </h4>
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                    {[
                      {
                        port: 80,
                        service: 'HTTP',
                        status: 'open',
                        connections: 45,
                      },
                      {
                        port: 443,
                        service: 'HTTPS',
                        status: 'open',
                        connections: 128,
                      },
                      {
                        port: 22,
                        service: 'SSH',
                        status: 'open',
                        connections: 3,
                      },
                      {
                        port: 3306,
                        service: 'MySQL',
                        status: 'open',
                        connections: 12,
                      },
                    ].map((port, index) => (
                      <div
                        key={index}
                        className='bg-gray-50 rounded-lg p-4 border border-gray-200'
                      >
                        <div className='flex justify-between items-center mb-2'>
                          <span className='font-bold text-lg text-gray-800'>
                            :{port.port}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              port.status === 'open'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {port.status === 'open' ? '열림' : '닫힘'}
                          </span>
                        </div>
                        <div className='text-sm text-gray-600 mb-1'>
                          {port.service}
                        </div>
                        <div className='text-xs text-gray-500'>
                          {port.connections} 연결
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 메트릭 탭 */}
            {selectedTab === 'metrics' && (
              <div className='space-y-6'>
                {/* 시간 범위 선택 */}
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    성능 메트릭
                  </h3>
                  <div className='flex items-center gap-2'>
                    {(['1h', '6h', '24h', '7d'] as const).map(range => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          timeRange === range
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 통계 요약 */}
                {metricsStats && (
                  <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                    <div className='bg-red-50 rounded-lg p-4 border border-red-200'>
                      <div className='text-red-600 text-sm font-medium'>
                        CPU 사용률
                      </div>
                      <div className='text-2xl font-bold text-red-700'>
                        {metricsStats.cpu.avg}%
                      </div>
                      <div className='text-xs text-red-600'>
                        최대: {metricsStats.cpu.max}%
                      </div>
                    </div>
                    <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
                      <div className='text-blue-600 text-sm font-medium'>
                        메모리 사용률
                      </div>
                      <div className='text-2xl font-bold text-blue-700'>
                        {metricsStats.memory.avg}%
                      </div>
                      <div className='text-xs text-blue-600'>
                        최대: {metricsStats.memory.max}%
                      </div>
                    </div>
                    <div className='bg-purple-50 rounded-lg p-4 border border-purple-200'>
                      <div className='text-purple-600 text-sm font-medium'>
                        디스크 사용률
                      </div>
                      <div className='text-2xl font-bold text-purple-700'>
                        {metricsStats.disk.avg}%
                      </div>
                      <div className='text-xs text-purple-600'>
                        최대: {metricsStats.disk.max}%
                      </div>
                    </div>
                    <div className='bg-green-50 rounded-lg p-4 border border-green-200'>
                      <div className='text-green-600 text-sm font-medium'>
                        응답시간
                      </div>
                      <div className='text-2xl font-bold text-green-700'>
                        {metricsStats.responseTime.avg}ms
                      </div>
                      <div className='text-xs text-green-600'>
                        최대: {metricsStats.responseTime.max}ms
                      </div>
                    </div>
                  </div>
                )}

                {/* 개선된 차트 */}
                <div className='bg-white rounded-xl border border-gray-200 p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h4 className='text-lg font-semibold text-gray-900'>
                      리소스 사용 추이
                    </h4>
                    {isLoadingHistory && (
                      <div className='flex items-center gap-2 text-sm text-blue-600'>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                        <span>로딩 중...</span>
                      </div>
                    )}
                  </div>

                  {/* 범례 */}
                  <div className='flex flex-wrap gap-6 mb-6 text-sm'>
                    <div className='flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg border border-red-200'>
                      <div className='w-4 h-4 bg-red-500 rounded-full shadow-sm'></div>
                      <span className='font-medium text-red-700'>
                        CPU 사용률
                      </span>
                    </div>
                    <div className='flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200'>
                      <div className='w-4 h-4 bg-blue-500 rounded-full shadow-sm'></div>
                      <span className='font-medium text-blue-700'>
                        메모리 사용률
                      </span>
                    </div>
                    <div className='flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200'>
                      <div className='w-4 h-4 bg-purple-500 rounded-full shadow-sm'></div>
                      <span className='font-medium text-purple-700'>
                        디스크 사용률
                      </span>
                    </div>
                    <div className='flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200'>
                      <div className='w-4 h-4 bg-green-500 rounded-full shadow-sm'></div>
                      <span className='font-medium text-green-700'>
                        네트워크 처리량
                      </span>
                    </div>
                  </div>

                  {/* 차트 영역 */}
                  <div className='relative h-80 border border-gray-200 rounded-lg bg-gradient-to-b from-gray-50 to-white overflow-hidden'>
                    {/* Y축 라벨 */}
                    <div className='absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2 py-4'>
                      <span>100%</span>
                      <span>80%</span>
                      <span>60%</span>
                      <span>40%</span>
                      <span>20%</span>
                      <span>0%</span>
                    </div>

                    {/* 차트 영역 */}
                    <div className='ml-12 h-full relative p-4'>
                      {/* 격자 */}
                      <div className='absolute inset-4 flex flex-col justify-between pointer-events-none'>
                        {[0, 1, 2, 3, 4, 5].map(i => (
                          <div
                            key={i}
                            className='border-t border-gray-200'
                            style={{ opacity: 0.5 }}
                          ></div>
                        ))}
                      </div>

                      {/* 실제 데이터 차트 */}
                      {metricsHistory.length > 0 && (
                        <svg
                          className='w-full h-full'
                          width='100%'
                          height='100%'
                          viewBox='0 0 300 140'
                          preserveAspectRatio='xMidYMid meet'
                        >
                          {/* 배경 그라데이션 영역 */}
                          <defs>
                            <linearGradient
                              id='cpuGradient'
                              x1='0%'
                              y1='0%'
                              x2='0%'
                              y2='100%'
                            >
                              <stop
                                offset='0%'
                                stopColor='#ef4444'
                                stopOpacity='0.3'
                              />
                              <stop
                                offset='100%'
                                stopColor='#ef4444'
                                stopOpacity='0.05'
                              />
                            </linearGradient>
                            <linearGradient
                              id='memoryGradient'
                              x1='0%'
                              y1='0%'
                              x2='0%'
                              y2='100%'
                            >
                              <stop
                                offset='0%'
                                stopColor='#3b82f6'
                                stopOpacity='0.3'
                              />
                              <stop
                                offset='100%'
                                stopColor='#3b82f6'
                                stopOpacity='0.05'
                              />
                            </linearGradient>
                            <linearGradient
                              id='diskGradient'
                              x1='0%'
                              y1='0%'
                              x2='0%'
                              y2='100%'
                            >
                              <stop
                                offset='0%'
                                stopColor='#8b5cf6'
                                stopOpacity='0.3'
                              />
                              <stop
                                offset='100%'
                                stopColor='#8b5cf6'
                                stopOpacity='0.05'
                              />
                            </linearGradient>
                            <linearGradient
                              id='networkGradient'
                              x1='0%'
                              y1='0%'
                              x2='0%'
                              y2='100%'
                            >
                              <stop
                                offset='0%'
                                stopColor='#22c55e'
                                stopOpacity='0.3'
                              />
                              <stop
                                offset='100%'
                                stopColor='#22c55e'
                                stopOpacity='0.05'
                              />
                            </linearGradient>
                          </defs>

                          {/* CPU 영역 채우기 */}
                          <polygon
                            fill='url(#cpuGradient)'
                            points={`0,140 ${generateChartPoints(
                              metricsHistory.map(m => m.cpu)
                            )} 300,140`}
                            opacity='0.4'
                          />

                          {/* CPU 라인 */}
                          <polyline
                            fill='none'
                            stroke='#ef4444'
                            strokeWidth='3'
                            points={generateChartPoints(
                              metricsHistory.map(m => m.cpu)
                            )}
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            style={{
                              filter:
                                'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3))',
                            }}
                          />

                          {/* 메모리 라인 */}
                          <polyline
                            fill='none'
                            stroke='#3b82f6'
                            strokeWidth='3'
                            points={generateChartPoints(
                              metricsHistory.map(m => m.memory)
                            )}
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            style={{
                              filter:
                                'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))',
                            }}
                          />

                          {/* 디스크 라인 */}
                          <polyline
                            fill='none'
                            stroke='#8b5cf6'
                            strokeWidth='3'
                            points={generateChartPoints(
                              metricsHistory.map(m => m.disk)
                            )}
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            style={{
                              filter:
                                'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3))',
                            }}
                          />

                          {/* 네트워크 라인 */}
                          <polyline
                            fill='none'
                            stroke='#22c55e'
                            strokeWidth='3'
                            points={generateChartPoints(
                              metricsHistory.map(m =>
                                m.network?.bytesReceived
                                  ? Math.min(
                                      (m.network.bytesReceived / 1000000) * 2,
                                      100
                                    )
                                  : Math.floor(Math.random() * 30) + 20
                              )
                            )}
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            style={{
                              filter:
                                'drop-shadow(0 2px 4px rgba(34, 197, 94, 0.3))',
                            }}
                          />

                          {/* 데이터 포인트 표시 */}
                          {metricsHistory.slice(-1).map((metric, index) => {
                            const x = 300;
                            const cpuY = 140 - (metric.cpu / 100) * 140;
                            const memoryY = 140 - (metric.memory / 100) * 140;
                            const diskY = 140 - (metric.disk / 100) * 140;
                            const networkY =
                              140 -
                              (Math.min(
                                ((metric.network?.bytesReceived || 0) /
                                  1000000) *
                                  2,
                                100
                              ) /
                                100) *
                                140;

                            return (
                              <g key={index}>
                                <circle
                                  cx={x}
                                  cy={cpuY}
                                  r='4'
                                  fill='#ef4444'
                                  stroke='white'
                                  strokeWidth='2'
                                />
                                <circle
                                  cx={x}
                                  cy={memoryY}
                                  r='4'
                                  fill='#3b82f6'
                                  stroke='white'
                                  strokeWidth='2'
                                />
                                <circle
                                  cx={x}
                                  cy={diskY}
                                  r='4'
                                  fill='#8b5cf6'
                                  stroke='white'
                                  strokeWidth='2'
                                />
                                <circle
                                  cx={x}
                                  cy={networkY}
                                  r='4'
                                  fill='#22c55e'
                                  stroke='white'
                                  strokeWidth='2'
                                />
                              </g>
                            );
                          })}
                        </svg>
                      )}
                    </div>

                    {/* X축 라벨 */}
                    <div className='absolute bottom-0 left-8 right-0 flex justify-between text-xs text-gray-500 px-4 pb-2'>
                      <span>
                        {timeRange === '1h'
                          ? '1시간 전'
                          : timeRange === '6h'
                            ? '6시간 전'
                            : timeRange === '24h'
                              ? '24시간 전'
                              : '7일 전'}
                      </span>
                      <span>현재</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 프로세스 탭 */}
            {selectedTab === 'processes' && (
              <div className='space-y-6'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  실행 중인 프로세스
                </h3>

                <div className='bg-white rounded-xl border border-gray-200 overflow-hidden'>
                  <div className='overflow-x-auto'>
                    <table className='min-w-full divide-y divide-gray-200'>
                      <thead className='bg-gray-50'>
                        <tr>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            PID
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            프로세스명
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            CPU %
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            메모리 %
                          </th>
                          <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            상태
                          </th>
                        </tr>
                      </thead>
                      <tbody className='bg-white divide-y divide-gray-200'>
                        {Array.from({ length: 8 }, (_, i) => (
                          <tr key={i} className='hover:bg-gray-50'>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                              {1000 + Math.floor(Math.random() * 9000)}
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                              {
                                [
                                  'nginx',
                                  'nodejs',
                                  'postgresql',
                                  'redis-server',
                                  'systemd',
                                  'chrome',
                                  'docker',
                                  'ssh',
                                ][i]
                              }
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                              {(Math.random() * 15).toFixed(1)}%
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                              {(Math.random() * 25).toFixed(1)}%
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <span className='inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800'>
                                실행 중
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 로그 탭 */}
            {selectedTab === 'logs' && (
              <div className='space-y-6'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    시스템 로그
                  </h3>
                  <button className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm'>
                    <i className='fas fa-download mr-2'></i>
                    로그 다운로드
                  </button>
                </div>

                <div className='bg-gray-900 rounded-xl p-4 text-green-400 font-mono text-sm max-h-96 overflow-y-auto'>
                  <div className='space-y-1'>
                    {Array.from({ length: 20 }, (_, i) => (
                      <div key={i} className='flex'>
                        <span className='text-gray-500 w-24 flex-shrink-0'>
                          {new Date(
                            Date.now() - i * 60000
                          ).toLocaleTimeString()}
                        </span>
                        <span className='ml-2'>
                          {
                            [
                              '[INFO] System status: healthy',
                              '[DEBUG] Memory usage: 67.2%',
                              '[INFO] New connection from 192.168.1.100',
                              '[WARN] High CPU usage detected: 89%',
                              '[INFO] Service nginx restarted successfully',
                              '[ERROR] Database connection timeout',
                              '[INFO] Backup completed successfully',
                              '[DEBUG] Cache cleared: 1.2GB freed',
                            ][i % 8]
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
