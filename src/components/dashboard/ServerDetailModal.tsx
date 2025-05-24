'use client';

import { useState, useEffect } from 'react';
import { Server } from '../../types/server';

interface ServerDetailModalProps {
  server: Server | null;
  onClose: () => void;
  onAskAI?: (query: string, context?: any) => void;
}

export default function ServerDetailModal({ server, onClose, onAskAI }: ServerDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'logs' | 'metrics'>('overview');

  useEffect(() => {
    if (server) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [server]);

  if (!server) return null;

  const handleAIAnalysis = () => {
    if (onAskAI) {
      onAskAI(`${server.name} 서버에 대해 상세 분석해줘`, { serverId: server.id, serverData: server });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'offline': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 백드롭 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* 모달 컨텐트 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* 헤더 */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <i className="fas fa-server text-2xl text-blue-600"></i>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{server.name}</h2>
                  <p className="text-sm text-gray-500">{server.ip} • {server.location}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(server.status)} bg-gray-100`}>
                {server.status.toUpperCase()}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* AI 분석 버튼 */}
              <button
                onClick={handleAIAnalysis}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <i className="fas fa-brain"></i>
                AI 분석
              </button>
              
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="border-b border-gray-200">
            <div className="flex px-6">
              {[
                { id: 'overview', label: '개요', icon: 'fas fa-chart-pie' },
                { id: 'services', label: '서비스', icon: 'fas fa-cogs' },
                { id: 'logs', label: '로그', icon: 'fas fa-list' },
                { id: 'metrics', label: '메트릭', icon: 'fas fa-chart-line' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <i className={tab.icon}></i>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 컨텐트 */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 시스템 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">시스템 정보</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">운영체제</span>
                        <span className="font-medium">{server.os}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">업타임</span>
                        <span className="font-medium">{server.uptime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">위치</span>
                        <span className="font-medium">{server.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">리소스 사용량</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600">CPU</span>
                          <span className="font-medium">{server.cpu}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${server.cpu}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600">메모리</span>
                          <span className="font-medium">{server.memory}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${server.memory}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600">디스크</span>
                          <span className="font-medium">{server.disk}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${server.disk}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">실행 중인 서비스</h3>
                <div className="space-y-3">
                  {server.services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          service.status === 'running' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        포트 {service.port}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 로그</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {server.logs?.map((log, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-500">{log.timestamp}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          log.level === 'ERROR' ? 'bg-red-100 text-red-700' :
                          log.level === 'WARN' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {log.level}
                        </span>
                      </div>
                      <p className="text-gray-800">{log.message}</p>
                    </div>
                  )) || <p className="text-gray-500 text-center py-8">로그가 없습니다.</p>}
                </div>
              </div>
            )}

            {activeTab === 'metrics' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">성능 메트릭</h3>
                <div className="text-center py-12 text-gray-500">
                  <i className="fas fa-chart-line text-4xl mb-4"></i>
                  <p>성능 차트가 여기에 표시됩니다</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 