'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Server } from '../../types/server';
import { timerManager } from '../../utils/TimerManager';

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

export default function ServerDetailModal({ server, onClose }: ServerDetailModalProps) {
  const [metricsHistory, setMetricsHistory] = useState<MetricsHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'metrics' | 'processes' | 'logs'>('overview');
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');

  const loadMetricsHistory = useCallback(async (serverId: string, range: string = '24h') => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/servers/${serverId}?history=true&range=${range}`);
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
  }, []);

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
          out: Math.floor(Math.random() * 800) + 300
        }
      });
    };

    updateRealTimeMetrics();
    
    // TimerManager를 사용한 실시간 메트릭 업데이트
    timerManager.register({
      id: `server-detail-metrics-${server.id}`,
      callback: updateRealTimeMetrics,
      interval: 3000,
      priority: 'medium',
        enabled: true
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
    const hours = range === '1h' ? 1 : range === '6h' ? 6 : range === '24h' ? 24 : 168; // 7d = 168h
    const interval = range === '1h' ? 5 : range === '6h' ? 30 : range === '24h' ? 60 : 360; // 분 단위
    const points = Math.floor((hours * 60) / interval);
    
    for (let i = points - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * interval * 60 * 1000));
      
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
          bytesSent: Math.round(load * 30000000)
        },
        responseTime: Math.round(100 + load * 200 + Math.random() * 100),
        connections: Math.round(50 + load * 200)
      });
    }
    
    return history;
  };

  // 메트릭 통계 계산
  const metricsStats = useMemo(() => {
    if (metricsHistory.length === 0) return null;

    const cpuAvg = Math.round(metricsHistory.reduce((sum, m) => sum + m.cpu, 0) / metricsHistory.length);
    const memoryAvg = Math.round(metricsHistory.reduce((sum, m) => sum + m.memory, 0) / metricsHistory.length);
    const diskAvg = Math.round(metricsHistory.reduce((sum, m) => sum + m.disk, 0) / metricsHistory.length);
    const responseTimeAvg = Math.round(metricsHistory.reduce((sum, m) => sum + m.responseTime, 0) / metricsHistory.length);

    const cpuMax = Math.max(...metricsHistory.map(m => m.cpu));
    const memoryMax = Math.max(...metricsHistory.map(m => m.memory));
    const responseTimeMax = Math.max(...metricsHistory.map(m => m.responseTime));

    return {
      cpu: { avg: cpuAvg, max: cpuMax },
      memory: { avg: memoryAvg, max: memoryMax },
      disk: { avg: diskAvg, max: Math.max(...metricsHistory.map(m => m.disk)) },
      responseTime: { avg: responseTimeAvg, max: responseTimeMax }
    };
  }, [metricsHistory]);

  if (!server) return null;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'online': return { 
        color: 'text-green-600', 
        bgColor: 'bg-green-100',
        label: '정상',
        icon: '🟢'
      };
      case 'warning': return { 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-100',
        label: '경고',
        icon: '🟡'
      };
      case 'offline': return { 
        color: 'text-red-600', 
        bgColor: 'bg-red-100',
        label: '위험',
        icon: '🔴'
      };
      default: return { 
        color: 'text-gray-600', 
        bgColor: 'bg-gray-100',
        label: '알 수 없음',
        icon: '⚪'
      };
    }
  };

  const statusInfo = getStatusInfo(server.status);

  // 차트 데이터 포인트 생성 (개선된 버전)
  const generateChartPoints = (data: number[], maxHeight: number = 140) => {
    if (data.length === 0) return '';
    
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;
    
    return data.map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * 100; // 퍼센트로 변경
      const y = 100 - ((value - minValue) / range) * 100; // 퍼센트로 변경
      return `${x},${y}`;
    }).join(' ');
  };

  // 실시간 게이지 컴포넌트
  const CircularGauge = ({ value, max = 100, label, color, size = 120 }: { 
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
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg className="transform -rotate-90" width={size} height={size}>
            <circle
              cx={size/2}
              cy={size/2}
              r="45"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx={size/2}
              cy={size/2}
              r="45"
              stroke={color}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold">{value}%</div>
            </div>
          </div>
        </div>
        <div className="mt-2 text-sm font-medium text-gray-700">{label}</div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 백드롭 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-60 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* 모달 컨텐트 */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden border border-gray-200">
          
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                  {server.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{server.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`${statusInfo.color} text-sm font-medium flex items-center gap-1`}>
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                    <span className="text-gray-500 text-sm">•</span>
                    <span className="text-gray-600 text-sm">{server.location}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all p-2 rounded-lg"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* 탭 네비게이션 */}
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex space-x-8 px-4 sm:px-6">
              {[
                { id: 'overview', label: '개요', icon: 'fas fa-chart-line' },
                { id: 'metrics', label: '메트릭', icon: 'fas fa-chart-bar' },
                { id: 'processes', label: '프로세스', icon: 'fas fa-cogs' },
                { id: 'logs', label: '로그', icon: 'fas fa-file-alt' }
              ].map((tab) => (
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
          <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
            
            {/* 개요 탭 */}
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                
                {/* 실시간 리소스 게이지 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">실시간 리소스 사용률</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 justify-items-center">
                    <CircularGauge value={server.cpu} label="CPU" color="#ef4444" />
                    <CircularGauge value={server.memory} label="메모리" color="#3b82f6" />
                    <CircularGauge value={server.disk} label="디스크" color="#8b5cf6" />
                  </div>
                </div>

                {/* 시스템 정보 카드들 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* 기본 정보 */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <i className="fas fa-server mr-2 text-blue-600"></i>
                      시스템 정보
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">운영체제</span>
                        <span className="font-medium">{server.os}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">가동시간</span>
                        <span className="font-medium">{server.uptime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">IP 주소</span>
                        <span className="font-medium">{server.ip}</span>
                      </div>
                      {realTimeMetrics && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">프로세스 수</span>
                            <span className="font-medium">{realTimeMetrics.processes}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">로드 평균</span>
                            <span className="font-medium">{realTimeMetrics.loadAverage}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">CPU 온도</span>
                            <span className="font-medium">{realTimeMetrics.temperature}°C</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 네트워크 정보 */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <i className="fas fa-network-wired mr-2 text-blue-600"></i>
                      네트워크 상태
                    </h4>
                    <div className="space-y-3 text-sm">
                      {realTimeMetrics && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">수신 속도</span>
                            <span className="font-medium text-green-600">↓ {realTimeMetrics.networkThroughput.in} KB/s</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">송신 속도</span>
                            <span className="font-medium text-blue-600">↑ {realTimeMetrics.networkThroughput.out} KB/s</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">응답시간</span>
                        <span className="font-medium">{(Math.random() * 100 + 50).toFixed(0)}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">활성 연결</span>
                        <span className="font-medium">{Math.floor(Math.random() * 100) + 50}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 서비스 상태 */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i className="fas fa-cog mr-2 text-green-600"></i>
                    실행 중인 서비스
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {server.services.map((service, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          service.status === 'running' 
                            ? 'bg-green-50 border-green-200 text-green-800' 
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              service.status === 'running' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className="font-medium">{service.name}</span>
                          </div>
                          <span className="text-xs bg-white px-2 py-1 rounded">:{service.port}</span>
                        </div>
                        <div className="text-xs mt-1">
                          상태: {service.status === 'running' ? '실행 중' : '중지됨'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 메트릭 탭 */}
            {selectedTab === 'metrics' && (
              <div className="space-y-6">
                
                {/* 시간 범위 선택 */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">성능 메트릭</h3>
                  <div className="flex items-center gap-2">
                    {(['1h', '6h', '24h', '7d'] as const).map((range) => (
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
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <div className="text-red-600 text-sm font-medium">CPU 사용률</div>
                      <div className="text-2xl font-bold text-red-700">{metricsStats.cpu.avg}%</div>
                      <div className="text-xs text-red-600">최대: {metricsStats.cpu.max}%</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="text-blue-600 text-sm font-medium">메모리 사용률</div>
                      <div className="text-2xl font-bold text-blue-700">{metricsStats.memory.avg}%</div>
                      <div className="text-xs text-blue-600">최대: {metricsStats.memory.max}%</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <div className="text-purple-600 text-sm font-medium">디스크 사용률</div>
                      <div className="text-2xl font-bold text-purple-700">{metricsStats.disk.avg}%</div>
                      <div className="text-xs text-purple-600">최대: {metricsStats.disk.max}%</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="text-green-600 text-sm font-medium">응답시간</div>
                      <div className="text-2xl font-bold text-green-700">{metricsStats.responseTime.avg}ms</div>
                      <div className="text-xs text-green-600">최대: {metricsStats.responseTime.max}ms</div>
                    </div>
                  </div>
                )}

                {/* 개선된 차트 */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">리소스 사용 추이</h4>
                    {isLoadingHistory && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>로딩 중...</span>
                      </div>
                    )}
                  </div>

                  {/* 범례 */}
                  <div className="flex flex-wrap gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>CPU</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>메모리</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span>디스크</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>응답시간 (×10ms)</span>
                    </div>
                  </div>

                  {/* 차트 영역 */}
                  <div className="relative h-64 border border-gray-200 rounded-lg bg-gradient-to-b from-gray-50 to-white">
                    {/* Y축 라벨 */}
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2 py-4">
                      <span>100</span>
                      <span>80</span>
                      <span>60</span>
                      <span>40</span>
                      <span>20</span>
                      <span>0</span>
                    </div>
                    
                    {/* 차트 영역 */}
                    <div className="ml-8 h-full relative p-4">
                      {/* 격자 */}
                      <div className="absolute inset-4 flex flex-col justify-between pointer-events-none">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="border-t border-gray-200"></div>
                        ))}
                      </div>
                      
                      {/* 실제 데이터 차트 */}
                      {metricsHistory.length > 0 && (
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          {/* CPU 라인 */}
                          <polyline
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="0.5"
                            points={generateChartPoints(metricsHistory.map(m => m.cpu))}
                            vectorEffect="non-scaling-stroke"
                          />
                          {/* 메모리 라인 */}
                          <polyline
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="0.5"
                            points={generateChartPoints(metricsHistory.map(m => m.memory))}
                            vectorEffect="non-scaling-stroke"
                          />
                          {/* 디스크 라인 */}
                          <polyline
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="0.5"
                            points={generateChartPoints(metricsHistory.map(m => m.disk))}
                            vectorEffect="non-scaling-stroke"
                          />
                          {/* 응답시간 라인 (스케일 조정) */}
                          <polyline
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="0.5"
                            points={generateChartPoints(metricsHistory.map(m => Math.min(m.responseTime / 10, 100)))}
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                      )}
                    </div>

                    {/* X축 라벨 */}
                    <div className="absolute bottom-0 left-8 right-0 flex justify-between text-xs text-gray-500 px-4 pb-2">
                      <span>{timeRange === '1h' ? '1시간 전' : timeRange === '6h' ? '6시간 전' : timeRange === '24h' ? '24시간 전' : '7일 전'}</span>
                      <span>현재</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 프로세스 탭 */}
            {selectedTab === 'processes' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">실행 중인 프로세스</h3>
                
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">프로세스명</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU %</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메모리 %</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.from({ length: 8 }, (_, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {1000 + Math.floor(Math.random() * 9000)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {['nginx', 'nodejs', 'postgresql', 'redis-server', 'systemd', 'chrome', 'docker', 'ssh'][i]}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {(Math.random() * 15).toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {(Math.random() * 25).toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
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
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">시스템 로그</h3>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                    <i className="fas fa-download mr-2"></i>
                    로그 다운로드
                  </button>
                </div>
                
                <div className="bg-gray-900 rounded-xl p-4 text-green-400 font-mono text-sm max-h-96 overflow-y-auto">
                  <div className="space-y-1">
                    {Array.from({ length: 20 }, (_, i) => (
                      <div key={i} className="flex">
                        <span className="text-gray-500 w-24 flex-shrink-0">
                          {new Date(Date.now() - i * 60000).toLocaleTimeString()}
                        </span>
                        <span className="ml-2">
                          {[
                            '[INFO] System status: healthy',
                            '[DEBUG] Memory usage: 67.2%',
                            '[INFO] New connection from 192.168.1.100',
                            '[WARN] High CPU usage detected: 89%',
                            '[INFO] Service nginx restarted successfully',
                            '[ERROR] Database connection timeout',
                            '[INFO] Backup completed successfully',
                            '[DEBUG] Cache cleared: 1.2GB freed'
                          ][i % 8]}
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