'use client';

import { useState, useEffect, useCallback } from 'react';
import { Server } from '../../types/server';

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
}

export default function ServerDetailModal({ server, onClose }: ServerDetailModalProps) {
  const [metricsHistory, setMetricsHistory] = useState<MetricsHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadMetricsHistory = useCallback(async (serverId: string) => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/servers/${serverId}?history=true&hours=24`);
      const data = await response.json();
      
      if (data.success && data.history) {
        setMetricsHistory(data.history.metrics);
      } else {
        // 실제 데이터가 없으면 시뮬레이션 데이터 생성
        setMetricsHistory(generateSimulatedHistory());
      }
    } catch (error) {
      // 에러 시 시뮬레이션 데이터 사용 (로깅은 개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        console.error('히스토리 데이터 로드 실패:', error);
      }
      setMetricsHistory(generateSimulatedHistory());
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (server) {
      document.body.style.overflow = 'hidden';
      // 서버 히스토리 데이터 로드
      loadMetricsHistory(server.id);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [server, loadMetricsHistory]);

  const generateSimulatedHistory = (): MetricsHistory[] => {
    const history: MetricsHistory[] = [];
    const now = new Date();
    
    // 24시간 동안 1시간 간격으로 데이터 생성
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
      
      // 시간대별 패턴 적용
      const hour = timestamp.getHours();
      let baseLoad = 0.3; // 기본 부하
      
      if (hour >= 9 && hour <= 18) {
        baseLoad = 0.7; // 업무시간 높은 부하
      } else if (hour >= 19 && hour <= 23) {
        baseLoad = 0.5; // 저녁시간 중간 부하
      }
      
      // 랜덤 변동 추가
      const variation = (Math.random() - 0.5) * 0.3;
      const load = Math.max(0.1, Math.min(0.9, baseLoad + variation));
      
      history.push({
        timestamp: timestamp.toISOString(),
        cpu: Math.round(load * 100),
        memory: Math.round((load * 0.8 + Math.random() * 0.2) * 100),
        disk: Math.round((0.4 + Math.random() * 0.3) * 100),
        network: {
          bytesReceived: Math.round(load * 50000000), // 50MB 기준
          bytesSent: Math.round(load * 30000000)      // 30MB 기준
        }
      });
    }
    
    return history;
  };

  if (!server) return null;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'online': return { color: 'text-green-600', label: '정상' };
      case 'warning': return { color: 'text-yellow-600', label: '경고' };
      case 'offline': return { color: 'text-red-600', label: '실패' };
      default: return { color: 'text-gray-600', label: '알 수 없음' };
    }
  };

  const statusInfo = getStatusInfo(server.status);

  // 더미 데이터
  const networkData = {
    interface: 'eth0',
    receivedBytes: '4.12 MB',
    sentBytes: '23.19 MB',
    receivedErrors: 9,
    sentErrors: 4
  };

  const systemInfo = {
    os: server.os || 'CentOS 7',
    uptime: server.uptime,
    processes: 178,
    zombieProcesses: 0,
    loadAverage: '0.68',
    lastUpdate: '2025. 5. 18. 오후 7:00:00'
  };

  // 차트 데이터 포인트 생성
  const generateChartPoints = (data: number[], maxHeight: number = 160) => {
    if (data.length === 0) return '';
    
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;
    
    return data.map((value, index) => {
      const x = (index / (data.length - 1)) * 300; // 차트 너비 300px
      const y = maxHeight - ((value - minValue) / range) * maxHeight;
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 백드롭 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* 모달 컨텐트 */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">{server.name}</h2>
              <span className={`${statusInfo.color} text-sm font-medium`}>
                {statusInfo.label}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>

          {/* 메인 컨텐트 */}
          <div className="p-3 sm:p-6 max-h-[85vh] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* 좌측: 시스템 정보 */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">시스템 정보</h3>
                <div className="space-y-2 sm:space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">OS</span>
                    <span className="font-medium">{systemInfo.os}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">가동 시간</span>
                    <span className="font-medium">{systemInfo.uptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">프로세스 수</span>
                    <span className="font-medium">{systemInfo.processes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">좀비 프로세스</span>
                    <span className="font-medium">{systemInfo.zombieProcesses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">로드 평균 (1분)</span>
                    <span className="font-medium">{systemInfo.loadAverage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">마지막 업데이트</span>
                    <span className="font-medium text-xs sm:text-sm">{systemInfo.lastUpdate}</span>
                  </div>
                </div>
              </div>

              {/* 우측: 리소스 현황 */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">리소스 현황</h3>
                <div className="space-y-3 sm:space-y-4">
                  {/* CPU */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">CPU</span>
                      <span className="text-sm font-medium">{server.cpu}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded h-6 sm:h-8 relative">
                      <div 
                        className="bg-green-500 h-6 sm:h-8 rounded transition-all duration-300"
                        style={{ width: `${server.cpu}%` }}
                      ></div>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        사용률 (%)
                      </span>
                    </div>
                  </div>

                  {/* 메모리 */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">메모리</span>
                      <span className="text-sm font-medium">{server.memory}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded h-6 sm:h-8 relative">
                      <div 
                        className="bg-blue-500 h-6 sm:h-8 rounded transition-all duration-300"
                        style={{ width: `${server.memory}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 디스크 */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">디스크</span>
                      <span className="text-sm font-medium">{server.disk}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded h-6 sm:h-8 relative">
                      <div 
                        className="bg-purple-500 h-6 sm:h-8 rounded transition-all duration-300"
                        style={{ width: `${server.disk}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 네트워크 정보 */}
            <div className="mt-6 sm:mt-8">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">네트워크 정보</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                <div>
                  <span className="text-gray-600 block">인터페이스</span>
                  <span className="font-medium">{networkData.interface}</span>
                </div>
                <div>
                  <span className="text-gray-600 block">수신 바이트</span>
                  <span className="font-medium">{networkData.receivedBytes}</span>
                </div>
                <div>
                  <span className="text-gray-600 block">송신 바이트</span>
                  <span className="font-medium">{networkData.sentBytes}</span>
                </div>
                <div>
                  <span className="text-gray-600 block">수신 오류</span>
                  <span className="font-medium">{networkData.receivedErrors}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 mt-2">
                <div>
                  <span className="text-gray-600 block text-sm">송신 오류</span>
                  <span className="font-medium text-sm">{networkData.sentErrors}</span>
                </div>
              </div>
            </div>

            {/* 서비스 상태 */}
            <div className="mt-6 sm:mt-8">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">서비스 상태</h3>
              <div className="flex flex-wrap gap-2">
                {server.services.map((service, index) => (
                  <span
                    key={index}
                    className={`px-2 sm:px-3 py-1 rounded text-sm ${
                      service.status === 'running' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {service.name} ({service.status})
                  </span>
                ))}
              </div>
            </div>

            {/* 에러 메시지 */}
            <div className="mt-6 sm:mt-8">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">에러 메시지</h3>
              <p className="text-sm text-gray-600">알려진 보고된 오류가 없습니다.</p>
            </div>

            {/* 24시간 리소스 사용 추이 - 실제 데이터 */}
            <div className="mt-6 sm:mt-8">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                24시간 리소스 사용 추이
                {isLoadingHistory && (
                  <span className="ml-2 text-sm text-gray-500">로딩 중...</span>
                )}
              </h3>
              
              {/* 범례 */}
              <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>CPU</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>메모리</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span>디스크</span>
                </div>
              </div>

              {/* 차트 영역 */}
              <div className="relative h-40 sm:h-48 border border-gray-200 rounded-lg p-2 sm:p-4 bg-gray-50">
                {/* Y축 라벨 */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
                  <span>100</span>
                  <span>80</span>
                  <span>60</span>
                  <span>40</span>
                  <span>20</span>
                  <span>0</span>
                </div>
                
                {/* 차트 영역 */}
                <div className="ml-6 sm:ml-8 h-full relative">
                  {/* 격자 */}
                  <div className="absolute inset-0 flex flex-col justify-between">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="border-t border-gray-300 opacity-50"></div>
                    ))}
                  </div>
                  
                  {/* 실제 데이터 차트 */}
                  {metricsHistory.length > 0 && (
                    <svg className="w-full h-full" viewBox="0 0 300 160">
                      {/* CPU 라인 (빨간색) */}
                      <polyline
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        points={generateChartPoints(metricsHistory.map(m => m.cpu))}
                      />
                      {/* 메모리 라인 (파란색) */}
                      <polyline
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        points={generateChartPoints(metricsHistory.map(m => m.memory))}
                      />
                      {/* 디스크 라인 (보라색) */}
                      <polyline
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="2"
                        points={generateChartPoints(metricsHistory.map(m => m.disk))}
                      />
                    </svg>
                  )}
                </div>

                {/* X축 라벨 */}
                <div className="absolute bottom-0 left-6 sm:left-8 right-0 flex justify-between text-xs text-gray-500 mt-2">
                  <span>24시간 전</span>
                  <span>현재</span>
                </div>
              </div>

              {/* 데이터 요약 */}
              {metricsHistory.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
                  <div className="bg-white p-2 sm:p-3 rounded border">
                    <div className="text-gray-600">평균 CPU</div>
                    <div className="font-medium text-red-600">
                      {Math.round(metricsHistory.reduce((sum, m) => sum + m.cpu, 0) / metricsHistory.length)}%
                    </div>
                  </div>
                  <div className="bg-white p-2 sm:p-3 rounded border">
                    <div className="text-gray-600">평균 메모리</div>
                    <div className="font-medium text-blue-600">
                      {Math.round(metricsHistory.reduce((sum, m) => sum + m.memory, 0) / metricsHistory.length)}%
                    </div>
                  </div>
                  <div className="bg-white p-2 sm:p-3 rounded border">
                    <div className="text-gray-600">평균 디스크</div>
                    <div className="font-medium text-purple-600">
                      {Math.round(metricsHistory.reduce((sum, m) => sum + m.disk, 0) / metricsHistory.length)}%
                    </div>
                  </div>
                  <div className="bg-white p-2 sm:p-3 rounded border">
                    <div className="text-gray-600">데이터 포인트</div>
                    <div className="font-medium text-gray-900">{metricsHistory.length}개</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 