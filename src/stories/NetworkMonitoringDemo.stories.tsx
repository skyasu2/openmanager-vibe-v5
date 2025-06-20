/**
 * 🌐 네트워크 모니터링 데모 스토리북 (v5.44.4)
 *
 * 실시간 네트워크 트래픽 모니터링 및 분석 컴포넌트
 * 최신 업데이트: 15개 서버 실시간 네트워크 메트릭, 트래픽 분석, 대역폭 모니터링
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Wifi,
  Download,
  Upload,
  Router,
  Monitor,
  AlertTriangle,
  TrendingUp,
  Server,
  Globe,
} from 'lucide-react';

// 네트워크 모니터링 컴포넌트
const NetworkMonitoringDemo = () => {
  const [networkData, setNetworkData] = useState({
    totalBandwidth: 1000, // Mbps
    currentUsage: 0,
    downloadSpeed: 0,
    uploadSpeed: 0,
    packetsPerSecond: 0,
    activeConnections: 0,
    servers: [] as any[],
  });

  const [isMonitoring, setIsMonitoring] = useState(true);

  // 실시간 네트워크 데이터 시뮬레이션
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      const baseDownload = Math.sin(Date.now() / 10000) * 200 + 300;
      const baseUpload = Math.sin(Date.now() / 8000) * 100 + 150;
      const variance = (Math.random() - 0.5) * 100;

      const downloadSpeed = Math.max(0, baseDownload + variance);
      const uploadSpeed = Math.max(0, baseUpload + variance / 2);
      const currentUsage = ((downloadSpeed + uploadSpeed) / 1000) * 100;

      setNetworkData(prev => ({
        ...prev,
        currentUsage: Math.min(95, currentUsage),
        downloadSpeed,
        uploadSpeed,
        packetsPerSecond: Math.floor(downloadSpeed * 10 + uploadSpeed * 8),
        activeConnections: Math.floor(Math.random() * 50) + 100,
        servers: generateServerNetworkData(),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  // 서버별 네트워크 데이터 생성
  const generateServerNetworkData = () => {
    const serverTypes = ['web', 'api', 'database', 'cache', 'storage'];
    return Array.from({ length: 15 }, (_, i) => ({
      id: `server-${i + 1}`,
      name: `${serverTypes[i % serverTypes.length].toUpperCase()}-${String(i + 1).padStart(2, '0')}`,
      type: serverTypes[i % serverTypes.length],
      networkUsage: Math.random() * 100,
      latency: Math.random() * 50 + 10,
      throughput: Math.random() * 500 + 100,
      status: Math.random() > 0.8 ? 'warning' : 'online',
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'offline': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getBandwidthColor = (usage: number) => {
    if (usage > 80) return 'text-red-600';
    if (usage > 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Wifi className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  네트워크 모니터링 데모
                </h1>
                <p className="text-gray-600">
                  실시간 네트워크 트래픽 분석 및 대역폭 모니터링 (v5.44.4)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMonitoring(!isMonitoring)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isMonitoring
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
              >
                {isMonitoring ? '모니터링 중지' : '모니터링 시작'}
              </button>
              {isMonitoring && (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">실시간</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 메인 메트릭 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 대역폭 사용률 */}
          <motion.div
            className="bg-white p-6 rounded-lg shadow-sm border"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-gray-900">대역폭 사용률</h3>
              </div>
              <span className={`text-lg font-bold ${getBandwidthColor(networkData.currentUsage)}`}>
                {networkData.currentUsage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${networkData.currentUsage > 80 ? 'bg-red-500' :
                  networkData.currentUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                style={{ width: `${networkData.currentUsage}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {networkData.totalBandwidth} Mbps 중 {(networkData.currentUsage * networkData.totalBandwidth / 100).toFixed(0)} Mbps 사용
            </p>
          </motion.div>

          {/* 다운로드 속도 */}
          <motion.div
            className="bg-white p-6 rounded-lg shadow-sm border"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-gray-900">다운로드</h3>
              </div>
              <span className="text-lg font-bold text-green-600">
                {networkData.downloadSpeed.toFixed(0)} Mbps
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">
                평균 {(networkData.downloadSpeed * 0.8).toFixed(0)} Mbps
              </span>
            </div>
          </motion.div>

          {/* 업로드 속도 */}
          <motion.div
            className="bg-white p-6 rounded-lg shadow-sm border"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-gray-900">업로드</h3>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {networkData.uploadSpeed.toFixed(0)} Mbps
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">
                평균 {(networkData.uploadSpeed * 0.9).toFixed(0)} Mbps
              </span>
            </div>
          </motion.div>

          {/* 활성 연결 */}
          <motion.div
            className="bg-white p-6 rounded-lg shadow-sm border"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Router className="w-5 h-5 text-purple-600" />
                <h3 className="font-medium text-gray-900">활성 연결</h3>
              </div>
              <span className="text-lg font-bold text-purple-600">
                {networkData.activeConnections}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-600">
                {networkData.packetsPerSecond.toLocaleString()} pps
              </span>
            </div>
          </motion.div>
        </div>

        {/* 서버별 네트워크 상태 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  서버별 네트워크 상태 (15개 서버)
                </h3>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>지연시간</span>
                <span>처리량</span>
                <span>상태</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {networkData.servers.map((server) => (
                <motion.div
                  key={server.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900">{server.name}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(server.status)}`}>
                      {server.status === 'online' ? '정상' : server.status === 'warning' ? '경고' : '오프라인'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">네트워크 사용률</span>
                      <span className="font-medium">{server.networkUsage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-1000 ${server.networkUsage > 80 ? 'bg-red-500' :
                          server.networkUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                        style={{ width: `${server.networkUsage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">지연시간: {server.latency.toFixed(1)}ms</span>
                      <span className="text-gray-600">처리량: {server.throughput.toFixed(0)} Mbps</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* 알림 배너 */}
        {networkData.currentUsage > 80 && (
          <motion.div
            className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h4 className="font-medium text-red-800">높은 대역폭 사용률 경고</h4>
                <p className="text-sm text-red-700">
                  현재 대역폭 사용률이 {networkData.currentUsage.toFixed(1)}%로 임계치를 초과했습니다.
                  네트워크 성능 저하가 발생할 수 있습니다.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const meta: Meta<typeof NetworkMonitoringDemo> = {
  title: 'Dashboard/네트워크 모니터링 데모',
  component: NetworkMonitoringDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '🌐 네트워크 모니터링 데모 (v5.44.4)\n\n' +
          '✅ 실시간 대역폭 사용률 모니터링\n' +
          '✅ 15개 서버 네트워크 상태 추적\n' +
          '✅ 다운로드/업로드 속도 실시간 표시\n' +
          '✅ 패킷 처리량 및 활성 연결 수 모니터링\n' +
          '✅ 지연시간 및 처리량 분석\n' +
          '✅ 임계치 기반 자동 알림 시스템\n' +
          '✅ 인터랙티브 애니메이션 효과\n' +
          '✅ 서버별 네트워크 성능 비교\n' +
          '✅ 실시간 모니터링 ON/OFF 제어\n' +
          '📊 시스템 현황: 15개 서버, 14개 AI 엔진',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 🌐 기본 네트워크 모니터링 (실시간)
 */
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '15개 서버의 실시간 네트워크 트래픽을 모니터링하는 기본 데모입니다. 대역폭 사용률, 다운로드/업로드 속도, 활성 연결 수를 실시간으로 표시합니다.',
      },
    },
  },
};
