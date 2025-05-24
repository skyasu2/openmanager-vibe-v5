'use client';

import { useState, useEffect } from 'react';
import { Server } from '../../types/server';

interface ServerDetailModalProps {
  server: Server | null;
  onClose: () => void;
  onAskAI?: (query: string, context?: any) => void;
}

export default function ServerDetailModal({ server, onClose, onAskAI }: ServerDetailModalProps) {
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 백드롭 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* 모달 컨텐트 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">{server.name}</h2>
              <span className={`${statusInfo.color} text-sm font-medium`}>
                {statusInfo.label}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>

          {/* 메인 컨텐트 */}
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 좌측: 시스템 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">시스템 정보</h3>
                <div className="space-y-3 text-sm">
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
                    <span className="font-medium">{systemInfo.lastUpdate}</span>
                  </div>
                </div>
              </div>

              {/* 우측: 리소스 현황 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">리소스 현황</h3>
                <div className="space-y-4">
                  {/* CPU */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">CPU</span>
                      <span className="text-sm font-medium">{server.cpu}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded h-8 relative">
                      <div 
                        className="bg-green-500 h-8 rounded transition-all duration-300"
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
                    <div className="w-full bg-gray-200 rounded h-8 relative">
                      <div 
                        className="bg-green-500 h-8 rounded transition-all duration-300"
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
                    <div className="w-full bg-gray-200 rounded h-8 relative">
                      <div 
                        className="bg-green-500 h-8 rounded transition-all duration-300"
                        style={{ width: `${server.disk}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 네트워크 정보 */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">네트워크 정보</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
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
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">서비스 상태</h3>
              <div className="flex flex-wrap gap-2">
                {server.services.map((service, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded text-sm ${
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
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">에러 메시지</h3>
              <p className="text-sm text-gray-600">알려진 보고된 오류가 없습니다.</p>
            </div>

            {/* 24시간 리소스 사용 추이 */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">24시간 리소스 사용 추이</h3>
              
              {/* 범례 */}
              <div className="flex gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>CPU</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>메모리</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-cyan-500 rounded"></div>
                  <span>디스크</span>
                </div>
              </div>

              {/* 차트 영역 */}
              <div className="relative h-48 border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                <div className="ml-8 h-full relative">
                  {/* 격자 */}
                  <div className="absolute inset-0 flex flex-col justify-between">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="border-t border-gray-300 opacity-50"></div>
                    ))}
                  </div>
                  
                  {/* 가상 데이터 포인트들 */}
                  <svg className="w-full h-full">
                    {/* CPU 라인 (빨간색) */}
                    <polyline
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      points="0,120 50,110 100,105 150,108 200,115 250,118 300,120"
                    />
                    {/* 메모리 라인 (파란색) */}
                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      points="0,130 50,125 100,120 150,122 200,128 250,132 300,135"
                    />
                    {/* 디스크 라인 (청록색) */}
                    <polyline
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                      points="0,150 50,148 100,145 150,147 200,150 250,152 300,155"
                    />
                  </svg>
                </div>

                {/* X축 라벨 */}
                <div className="absolute bottom-0 left-8 right-0 flex justify-between text-xs text-gray-500 mt-2">
                  <span>18:24</span>
                  <span>19:00</span>
                </div>
              </div>
            </div>

            {/* AI 분석 버튼 */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleAIAnalysis}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <i className="fas fa-brain"></i>
                AI 분석
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 