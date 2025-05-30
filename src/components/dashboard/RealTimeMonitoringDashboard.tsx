/**
 * 📊 실시간 모니터링 대시보드 v2.0
 * 
 * Grafana 스타일 인터페이스:
 * - 실시간 메트릭 차트
 * - 서버 상태 그리드
 * - 메모리 최적화 컨트롤
 * - 알림 시스템
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ServerMetrics {
  id: string;
  hostname: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  status: 'healthy' | 'warning' | 'critical';
  response_time: number;
  uptime: number;
}

interface SystemStatus {
  isRunning: boolean;
  totalServers: number;
  memoryUsage: number;
  totalMetrics: number;
}

interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  usagePercent: number;
  status: 'optimal' | 'warning' | 'critical';
}

export const RealTimeMonitoringDashboard: React.FC = () => {
  // 상태 관리
  const [servers, setServers] = useState<ServerMetrics[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    isRunning: false,
    totalServers: 0,
    memoryUsage: 0,
    totalMetrics: 0
  });
  const [memoryStats, setMemoryStats] = useState<MemoryStats>({
    heapUsed: 0,
    heapTotal: 0,
    usagePercent: 0,
    status: 'optimal'
  });
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<string[]>([]);

  // 실시간 데이터 업데이트
  const fetchSystemData = useCallback(async () => {
    try {
      // 시스템 상태 조회
      const statusResponse = await fetch('/api/system/status');
      const statusData = await statusResponse.json();
      
      if (statusData.success) {
        setSystemStatus(statusData.data.simulation);
        setServers(statusData.data.simulation.servers || []);
      }

      // 메모리 상태 조회
      const memoryResponse = await fetch('/api/system/optimize');
      const memoryData = await memoryResponse.json();
      
      if (memoryData.success) {
        setMemoryStats({
          heapUsed: memoryData.data.current.heapUsed,
          heapTotal: memoryData.data.current.heapTotal,
          usagePercent: memoryData.data.current.usagePercent,
          status: memoryData.data.status
        });
      }

      // 시계열 데이터 조회 (첫 번째 서버)
      if (servers.length > 0) {
        const timeSeriesResponse = await fetch(
          `/api/metrics/timeseries?serverId=${servers[0].id}&metrics=cpu_usage,memory_usage&format=json`
        );
        const timeSeriesResult = await timeSeriesResponse.json();
        
        if (timeSeriesResult.success) {
          setTimeSeriesData(timeSeriesResult.data.data || []);
        }
      }

    } catch (error) {
      console.error('데이터 조회 실패:', error);
      setAlerts(prev => [...prev, `데이터 조회 실패: ${error}`]);
    }
  }, [servers.length]);

  // 시뮬레이션 시작/중지
  const toggleSimulation = async () => {
    try {
      const endpoint = systemStatus.isRunning ? '/api/system/stop' : '/api/system/start';
      const method = systemStatus.isRunning ? 'POST' : 'POST';
      const body = systemStatus.isRunning ? {} : { mode: 'full' };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      
      if (result.success) {
        setAlerts(prev => [...prev, 
          systemStatus.isRunning ? '시뮬레이션 중지됨' : '시뮬레이션 시작됨'
        ]);
        await fetchSystemData();
      }
    } catch (error) {
      setAlerts(prev => [...prev, `시뮬레이션 토글 실패: ${error}`]);
    }
  };

  // 메모리 최적화 실행
  const optimizeMemory = async () => {
    try {
      const response = await fetch('/api/system/optimize', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        const improvement = result.data.optimization.memory.improvement;
        setAlerts(prev => [...prev, 
          `메모리 최적화 완료: ${improvement.freedMB}MB 해제`
        ]);
        await fetchSystemData();
      }
    } catch (error) {
      setAlerts(prev => [...prev, `메모리 최적화 실패: ${error}`]);
    }
  };

  // 초기 로드 및 실시간 업데이트
  useEffect(() => {
    fetchSystemData().then(() => setIsLoading(false));
    
    const interval = setInterval(fetchSystemData, 30000); // 30초마다 업데이트 (10초 → 30초로 최적화)
    return () => clearInterval(interval);
  }, [fetchSystemData]);

  // 차트 데이터 준비
  const serverStatusChart = {
    labels: ['정상', '경고', '위험'],
    datasets: [{
      data: [
        servers.filter(s => s.status === 'healthy').length,
        servers.filter(s => s.status === 'warning').length,
        servers.filter(s => s.status === 'critical').length
      ],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      borderWidth: 2
    }]
  };

  const cpuTrendChart = {
    labels: timeSeriesData.map((_, index) => `${index}분 전`).reverse(),
    datasets: [{
      label: 'CPU 사용률 (%)',
      data: timeSeriesData.map(d => d.cpu_usage).reverse(),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const memoryTrendChart = {
    labels: timeSeriesData.map((_, index) => `${index}분 전`).reverse(),
    datasets: [{
      label: '메모리 사용률 (%)',
      data: timeSeriesData.map(d => d.memory_usage).reverse(),
      borderColor: '#8B5CF6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">🔄 대시보드 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-blue-400 mb-2">
          🎯 OpenManager 실시간 모니터링
        </h1>
        <p className="text-gray-400">
          Grafana 스타일 모니터링 대시보드 • 업데이트: {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* 제어 패널 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-2">🎛️ 시뮬레이션 제어</h3>
          <button
            onClick={toggleSimulation}
            className={`w-full py-2 px-4 rounded font-semibold transition-colors ${
              systemStatus.isRunning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {systemStatus.isRunning ? '⏹️ 중지' : '▶️ 시작'}
          </button>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-2">🧠 메모리 제어</h3>
          <button
            onClick={optimizeMemory}
            className="w-full py-2 px-4 rounded font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            🚀 최적화
          </button>
          <div className="mt-2 text-sm text-gray-400">
            {memoryStats.usagePercent.toFixed(1)}% 사용 중
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-2">📊 서버 현황</h3>
          <div className="text-2xl font-bold text-blue-400">
            {systemStatus.totalServers}
          </div>
          <div className="text-sm text-gray-400">활성 서버</div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-2">📈 메트릭 수</h3>
          <div className="text-2xl font-bold text-green-400">
            {systemStatus.totalMetrics.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">실시간 데이터</div>
        </div>
      </div>

      {/* 메인 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 서버 상태 분포 */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-blue-400">🖥️ 서버 상태 분포</h3>
          <div className="h-64">
            <Doughnut 
              data={serverStatusChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#9CA3AF' }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* CPU 트렌드 */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-blue-400">📈 CPU 사용률 트렌드</h3>
          <div className="h-64">
            <Line 
              data={cpuTrendChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: '#9CA3AF' },
                    grid: { color: '#374151' }
                  },
                  x: {
                    ticks: { color: '#9CA3AF' },
                    grid: { color: '#374151' }
                  }
                },
                plugins: {
                  legend: {
                    labels: { color: '#9CA3AF' }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* 메모리 트렌드 */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-blue-400">🧠 메모리 사용률 트렌드</h3>
          <div className="h-64">
            <Line 
              data={memoryTrendChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: '#9CA3AF' },
                    grid: { color: '#374151' }
                  },
                  x: {
                    ticks: { color: '#9CA3AF' },
                    grid: { color: '#374151' }
                  }
                },
                plugins: {
                  legend: {
                    labels: { color: '#9CA3AF' }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* 서버 그리드 */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-8">
        <h3 className="text-xl font-semibold mb-4 text-blue-400">🖥️ 서버 상세 현황</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {servers.slice(0, 12).map(server => (
            <div 
              key={server.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                server.status === 'healthy' ? 'border-green-500 bg-green-900/20' :
                server.status === 'warning' ? 'border-yellow-500 bg-yellow-900/20' :
                'border-red-500 bg-red-900/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">{server.hostname}</h4>
                <span className={`text-xs px-2 py-1 rounded ${
                  server.status === 'healthy' ? 'bg-green-600' :
                  server.status === 'warning' ? 'bg-yellow-600' :
                  'bg-red-600'
                }`}>
                  {server.status}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>CPU:</span>
                  <span className={
                    server.cpu_usage > 80 ? 'text-red-400' :
                    server.cpu_usage > 60 ? 'text-yellow-400' : 'text-green-400'
                  }>
                    {server.cpu_usage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>메모리:</span>
                  <span className={
                    server.memory_usage > 80 ? 'text-red-400' :
                    server.memory_usage > 60 ? 'text-yellow-400' : 'text-green-400'
                  }>
                    {server.memory_usage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>응답시간:</span>
                  <span className={
                    server.response_time > 1000 ? 'text-red-400' :
                    server.response_time > 500 ? 'text-yellow-400' : 'text-green-400'
                  }>
                    {server.response_time}ms
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 알림 패널 */}
      {alerts.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-blue-400">🔔 시스템 알림</h3>
            <button
              onClick={() => setAlerts([])}
              className="text-gray-400 hover:text-white transition-colors"
            >
              모두 지우기
            </button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {alerts.slice(-5).map((alert, index) => (
              <div key={index} className="text-sm text-gray-300 p-2 bg-gray-700 rounded">
                {new Date().toLocaleTimeString()} - {alert}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 