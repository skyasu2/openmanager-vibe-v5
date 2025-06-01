'use client';

import React, { useState } from 'react';
import { useRealtimeServers } from '@/hooks/api/useRealtimeServers';

export default function RealtimeServerDashboard() {
  const [viewMode, setViewMode] = useState<'overview' | 'servers' | 'clusters' | 'applications'>('overview');
  
  const {
    summary,
    servers,
    clusters,
    applications,
    selectedServer,
    selectedCluster,
    isLoading,
    error,
    isConnected,
    lastUpdate,
    refreshAll,
    selectServer,
    selectCluster,
    simulateIncident,
    toggleDataGeneration,
    hasData,
    totalServers,
    runningServers,
    errorServers,
    warningServers,
    healthPercentage,
    averageHealth
  } = useRealtimeServers({
    autoRefresh: true,
    refreshInterval: 5000
  });

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}일 ${hours}시간`;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'stopped': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'web': return '🌐';
      case 'api': return '🔌';
      case 'database': return '🗄️';
      case 'cache': return '💾';
      case 'queue': return '📬';
      case 'cdn': return '🌍';
      default: return '💻';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🚀 실시간 서버 모니터링</h1>
              <p className="text-gray-600">OpenManager Vibe v5 - 실제 서버 데이터 대시보드</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded text-sm ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                {isConnected ? '연결됨' : '연결 끊김'}
              </div>
              {lastUpdate && (
                <span className="text-sm text-gray-500">
                  마지막 업데이트: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {/* 네비게이션 탭 */}
          <div className="flex gap-2 mb-4">
            {[
              { key: 'overview', label: '📊 개요', icon: '📊' },
              { key: 'servers', label: '🖥️ 서버', icon: '🖥️' },
              { key: 'clusters', label: '🏗️ 클러스터', icon: '🏗️' },
              { key: 'applications', label: '📱 애플리케이션', icon: '📱' }
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`px-4 py-2 text-sm rounded ${
                  viewMode === key 
                    ? 'bg-blue-600 text-white' 
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setViewMode(key as any)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 컨트롤 버튼 */}
          <div className="flex gap-2">
            <button 
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              onClick={refreshAll}
              disabled={isLoading}
            >
              {isLoading ? '⏳' : '🔄'} 새로고침
            </button>
            <button 
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              onClick={() => toggleDataGeneration(true)}
            >
              ▶️ 데이터 생성 시작
            </button>
            <button 
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              onClick={() => toggleDataGeneration(false)}
            >
              ⏹️ 데이터 생성 중지
            </button>
          </div>
        </div>

        {/* 오류 표시 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}

        {/* 로딩 상태 */}
        {isLoading && !hasData && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-gray-600">서버 데이터를 불러오는 중...</p>
          </div>
        )}

        {/* 개요 탭 */}
        {viewMode === 'overview' && summary && (
          <div className="space-y-6">
            {/* 요약 카드들 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">총 서버</h3>
                <p className="text-2xl font-bold text-blue-600">{summary.overview.totalServers}</p>
                <p className="text-xs text-green-600">
                  {summary.overview.runningServers}개 실행 중
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">시스템 건강도</h3>
                <p className="text-2xl font-bold text-green-600">{Math.round(summary.health.averageScore)}%</p>
                <p className="text-xs text-gray-600">
                  {summary.health.criticalIssues}개 이슈
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">평균 CPU</h3>
                <p className="text-2xl font-bold text-orange-600">{Math.round(summary.performance.avgCpu)}%</p>
                <p className="text-xs text-gray-600">실시간 사용률</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">월간 비용</h3>
                <p className="text-2xl font-bold text-purple-600">${Math.round(summary.cost.monthly)}</p>
                <p className="text-xs text-gray-600">예상 비용</p>
              </div>
            </div>

            {/* 성능 차트 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📈 실시간 성능 지표</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">CPU 사용률</label>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-blue-600 h-4 rounded-full transition-all" 
                      style={{ width: `${summary.performance.avgCpu}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{Math.round(summary.performance.avgCpu)}%</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">메모리 사용률</label>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-green-600 h-4 rounded-full transition-all" 
                      style={{ width: `${summary.performance.avgMemory}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{Math.round(summary.performance.avgMemory)}%</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">디스크 사용률</label>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-yellow-600 h-4 rounded-full transition-all" 
                      style={{ width: `${summary.performance.avgDisk}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{Math.round(summary.performance.avgDisk)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 서버 탭 */}
        {viewMode === 'servers' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 서버 목록 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold">🖥️ 서버 목록 ({totalServers}개)</h3>
                  <div className="flex gap-4 text-sm text-gray-600 mt-2">
                    <span className="text-green-600">✅ 실행중: {runningServers}</span>
                    <span className="text-yellow-600">⚠️ 경고: {warningServers}</span>
                    <span className="text-red-600">❌ 오류: {errorServers}</span>
                  </div>
                </div>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {servers.map((server) => (
                    <div 
                      key={server.id} 
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedServer?.id === server.id ? 'bg-blue-50' : ''}`}
                      onClick={() => selectServer(server.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getTypeIcon(server.type)}</span>
                          <div>
                            <h4 className="font-medium">{server.name}</h4>
                            <p className="text-sm text-gray-600">{server.location}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(server.status)}`}>
                            {server.status}
                          </span>
                          <p className="text-sm text-gray-600 mt-1">
                            건강도: {Math.round(server.health.score)}%
                          </p>
                        </div>
                      </div>
                      
                      {/* 간단한 메트릭 */}
                      <div className="grid grid-cols-3 gap-4 mt-3 text-xs">
                        <div>
                          <span className="text-gray-500">CPU:</span>
                          <span className="ml-1 font-medium">{Math.round(server.metrics.cpu)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">메모리:</span>
                          <span className="ml-1 font-medium">{Math.round(server.metrics.memory)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">요청:</span>
                          <span className="ml-1 font-medium">{server.metrics.requests}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 서버 상세 */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">📋 서버 상세 정보</h3>
              </div>
              <div className="p-4">
                {selectedServer ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-lg">{selectedServer.name}</h4>
                      <p className="text-gray-600">{selectedServer.location}</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs mt-2 ${getStatusColor(selectedServer.status)}`}>
                        {selectedServer.status}
                      </span>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">💻 스펙</h5>
                      <div className="space-y-1 text-sm">
                        <p>CPU: {selectedServer.specs.cpu.cores}코어 {selectedServer.specs.cpu.model}</p>
                        <p>메모리: {Math.round(selectedServer.specs.memory.total / (1024*1024*1024))}GB {selectedServer.specs.memory.type}</p>
                        <p>디스크: {Math.round(selectedServer.specs.disk.total / (1024*1024*1024))}GB {selectedServer.specs.disk.type}</p>
                        <p>네트워크: {selectedServer.specs.network.bandwidth}Mbps</p>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">📊 현재 메트릭</h5>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>CPU</span>
                            <span>{Math.round(selectedServer.metrics.cpu)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${selectedServer.metrics.cpu}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>메모리</span>
                            <span>{Math.round(selectedServer.metrics.memory)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${selectedServer.metrics.memory}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>디스크</span>
                            <span>{Math.round(selectedServer.metrics.disk)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-600 h-2 rounded-full" 
                              style={{ width: `${selectedServer.metrics.disk}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">⏱️ 운영 정보</h5>
                      <div className="space-y-1 text-sm">
                        <p>업타임: {formatUptime(selectedServer.metrics.uptime)}</p>
                        <p>요청수: {selectedServer.metrics.requests.toLocaleString()}</p>
                        <p>오류수: {selectedServer.metrics.errors}</p>
                        <p>네트워크 IN: {Math.round(selectedServer.metrics.network.in)}MB/s</p>
                        <p>네트워크 OUT: {Math.round(selectedServer.metrics.network.out)}MB/s</p>
                      </div>
                    </div>

                    {selectedServer.health.issues.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2 text-red-600">⚠️ 이슈</h5>
                        <div className="space-y-1">
                          {selectedServer.health.issues.map((issue, index) => (
                            <p key={index} className="text-sm text-red-600">• {issue}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button 
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        onClick={() => simulateIncident(selectedServer.id)}
                      >
                        🎭 장애 시뮬레이션
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">👈</div>
                    <p>서버를 선택하여 상세 정보를 확인하세요</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 클러스터 탭 */}
        {viewMode === 'clusters' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">🏗️ 클러스터 현황</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {clusters.map((cluster) => (
                  <div key={cluster.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-medium">{cluster.name}</h4>
                        <p className="text-sm text-gray-600">{cluster.servers.length}개 서버</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">로드밸런싱: {cluster.loadBalancer.algorithm}</p>
                        <p className="text-sm text-gray-600">활성 연결: {cluster.loadBalancer.activeConnections}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">현재 서버</p>
                        <p className="text-lg font-semibold">{cluster.scaling.current}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">최소/최대</p>
                        <p className="text-lg font-semibold">{cluster.scaling.min}/{cluster.scaling.max}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">목표</p>
                        <p className="text-lg font-semibold">{cluster.scaling.target}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">정책</p>
                        <p className="text-lg font-semibold">{cluster.scaling.policy}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">서버 목록</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {cluster.servers.map((server) => (
                          <div key={server.id} className="flex items-center gap-2 p-2 border rounded text-sm">
                            <span className="text-lg">{getTypeIcon(server.type)}</span>
                            <div className="flex-1">
                              <p className="font-medium">{server.name}</p>
                              <p className="text-gray-600">CPU: {Math.round(server.metrics.cpu)}%</p>
                            </div>
                            <span className={`px-1 py-0.5 rounded text-xs ${getStatusColor(server.status)}`}>
                              {server.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 애플리케이션 탭 */}
        {viewMode === 'applications' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">📱 애플리케이션 현황</h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {applications.map((app, index) => (
                  <div key={index} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-xl font-semibold">{app.name}</h4>
                        <p className="text-gray-600">버전 {app.version}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-600">{app.performance.availability.toFixed(1)}%</p>
                        <p className="text-sm text-gray-600">가용성</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <h5 className="font-medium mb-3">🏭 배포 환경</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Production</span>
                            <span className="text-sm font-medium">{app.deployments.production.servers}서버</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Staging</span>
                            <span className="text-sm font-medium">{app.deployments.staging.servers}서버</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Development</span>
                            <span className="text-sm font-medium">{app.deployments.development.servers}서버</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-3">⚡ 성능 지표</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">응답시간</span>
                            <span className="text-sm font-medium">{Math.round(app.performance.responseTime)}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">처리량</span>
                            <span className="text-sm font-medium">{Math.round(app.performance.throughput)}/s</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">에러율</span>
                            <span className="text-sm font-medium">{app.performance.errorRate.toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-3">💰 리소스 비용</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">CPU</span>
                            <span className="text-sm font-medium">{Math.round(app.resources.totalCpu)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">메모리</span>
                            <span className="text-sm font-medium">{Math.round(app.resources.totalMemory)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">예상 비용</span>
                            <span className="text-sm font-medium">${app.resources.cost.toFixed(2)}/h</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 데이터 없음 */}
        {!hasData && !isLoading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium mb-2">서버 데이터 없음</h3>
            <p className="text-gray-600 mb-4">실시간 서버 데이터 생성을 시작하세요</p>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => toggleDataGeneration(true)}
            >
              ▶️ 데이터 생성 시작
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 