'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Monitor, 
  Play, 
  Pause, 
  Activity, 
  Clock, 
  Server,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Cpu,
  HardDrive,
  Wifi,
  Database
} from 'lucide-react';

interface ServerMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MonitoringStatus {
  isMonitoringActive: boolean;
  totalHosts: number;
  warningCount: number;
  criticalCount: number;
  lastCheckedAt: string;
  uptime: number;
  responseTime: number;
}

interface HealthSummary {
  cpu: {
    average: number;
    max: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  memory: {
    average: number;
    max: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  disk: {
    average: number;
    max: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  network: {
    average: number;
    max: number;
    status: 'healthy' | 'warning' | 'critical';
  };
}

interface IncidentLog {
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  serverId?: string;
  resolved: boolean;
}

export const ServerMonitorModal: React.FC<ServerMonitorModalProps> = ({
  isOpen,
  onClose
}) => {
  const [status, setStatus] = useState<MonitoringStatus | null>(null);
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [incidents, setIncidents] = useState<IncidentLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isControlling, setIsControlling] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // 모달 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 데이터 로드
  const loadData = async () => {
    if (!isOpen) return;
    
    setIsLoading(true);
    try {
      // 시스템 상태 조회
      const statusResponse = await fetch('/api/system/unified?action=status');
      const statusData = await statusResponse.json();
      
      if (statusData.success) {
        const systemStatus = statusData.data;
        setStatus({
          isMonitoringActive: systemStatus.simulation.isRunning,
          totalHosts: systemStatus.simulation.serverCount || 0,
          warningCount: Math.floor(systemStatus.simulation.serverCount * 0.2),
          criticalCount: Math.floor(systemStatus.simulation.serverCount * 0.1),
          lastCheckedAt: systemStatus.lastUpdated,
          uptime: systemStatus.simulation.runtime,
          responseTime: systemStatus.performance.averageResponseTime
        });
      }

      // 헬스 체크
      const healthResponse = await fetch('/api/health');
      const healthData = await healthResponse.json();
      
      if (healthData.status) {
        // 모의 헬스 요약 데이터 생성
        setHealthSummary({
          cpu: {
            average: 45 + Math.random() * 30,
            max: 75 + Math.random() * 20,
            status: 'healthy'
          },
          memory: {
            average: 55 + Math.random() * 25,
            max: 80 + Math.random() * 15,
            status: 'warning'
          },
          disk: {
            average: 35 + Math.random() * 20,
            max: 65 + Math.random() * 25,
            status: 'healthy'
          },
          network: {
            average: 25 + Math.random() * 40,
            max: 85 + Math.random() * 10,
            status: 'healthy'
          }
        });
      }

      // 최근 장애 로그 (모의 데이터)
      setIncidents([
        {
          timestamp: new Date().toLocaleString(),
          severity: 'warning',
          message: 'Server-03 메모리 사용량 85% 초과',
          serverId: 'server-003',
          resolved: false
        },
        {
          timestamp: new Date(Date.now() - 5 * 60000).toLocaleString(),
          severity: 'critical',
          message: 'Database-01 응답 시간 임계값 초과 (2.5초)',
          serverId: 'database-001',
          resolved: true
        },
        {
          timestamp: new Date(Date.now() - 15 * 60000).toLocaleString(),
          severity: 'info',
          message: 'Load-Balancer-01 정상 작동 확인',
          serverId: 'lb-001',
          resolved: true
        },
        {
          timestamp: new Date(Date.now() - 30 * 60000).toLocaleString(),
          severity: 'warning',
          message: 'API-Server-02 CPU 사용량 80% 접근',
          serverId: 'api-002',
          resolved: true
        },
        {
          timestamp: new Date(Date.now() - 45 * 60000).toLocaleString(),
          severity: 'info',
          message: '전체 시스템 모니터링 시작',
          resolved: true
        }
      ]);

    } catch (error) {
      console.error('모니터링 데이터 로드 실패:', error);
      setIncidents(prev => [{
        timestamp: new Date().toLocaleString(),
        severity: 'critical',
        message: '모니터링 데이터 로드 실패: ' + (error as Error).message,
        resolved: false
      }, ...prev.slice(0, 4)]);
    } finally {
      setIsLoading(false);
    }
  };

  // 모니터링 제어 (시작/중지)
  const controlMonitoring = async (action: 'start' | 'stop') => {
    setIsControlling(true);
    try {
      const endpoint = action === 'start' ? '/api/system/start' : '/api/system/stop';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      
      if (result.success) {
        setIncidents(prev => [{
          timestamp: new Date().toLocaleString(),
          severity: 'info',
          message: `서버 모니터링 ${action === 'start' ? '시작' : '중지'}됨`,
          resolved: true
        }, ...prev.slice(0, 4)]);
        
        // 상태 갱신
        await loadData();
      } else {
        setIncidents(prev => [{
          timestamp: new Date().toLocaleString(),
          severity: 'critical',
          message: `모니터링 제어 실패: ${result.message || '알 수 없는 오류'}`,
          resolved: false
        }, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('모니터링 제어 실패:', error);
      setIncidents(prev => [{
        timestamp: new Date().toLocaleString(),
        severity: 'critical',
        message: '모니터링 제어 요청 실패: ' + (error as Error).message,
        resolved: false
      }, ...prev.slice(0, 4)]);
    } finally {
      setIsControlling(false);
    }
  };

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (isOpen) {
      loadData();
      // 15초마다 자동 갱신
      const interval = setInterval(loadData, 15000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // 상태에 따른 색상 반환
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'text-blue-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatUptime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}일 ${hours % 24}시간`;
    if (hours > 0) return `${hours}시간 ${minutes % 60}분`;
    return `${minutes}분`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl max-h-[85vh] overflow-y-auto bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl"
          >
            {/* 헤더 */}
            <div className="p-6 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">서버 모니터링 상태</h2>
                    <p className="text-sm text-gray-400">실시간 모니터링 상태 확인 및 제어</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 text-green-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-300">모니터링 데이터를 로드하는 중...</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* 상태 요약 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className={`w-4 h-4 ${status?.isMonitoringActive ? 'text-green-400' : 'text-red-400'}`} />
                      <span className="text-gray-300 text-sm">모니터링 상태</span>
                    </div>
                    <p className={`text-lg font-semibold ${status?.isMonitoringActive ? 'text-green-400' : 'text-red-400'}`}>
                      {status?.isMonitoringActive ? '활성' : '비활성'}
                    </p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Server className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300 text-sm">모니터링 대상</span>
                    </div>
                    <p className="text-lg font-semibold text-white">{status?.totalHosts || 0}개 서버</p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-300 text-sm">경고/위험</span>
                    </div>
                    <p className="text-lg font-semibold text-white">
                      <span className="text-yellow-400">{status?.warningCount || 0}</span> / 
                      <span className="text-red-400 ml-1">{status?.criticalCount || 0}</span>
                    </p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-300 text-sm">업타임</span>
                    </div>
                    <p className="text-lg font-semibold text-white">
                      {status?.uptime ? formatUptime(status.uptime) : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* 제어 버튼 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => controlMonitoring(status?.isMonitoringActive ? 'stop' : 'start')}
                    disabled={isControlling}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                      status?.isMonitoringActive
                        ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/50'
                        : 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/50'
                    }`}
                  >
                    {isControlling ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : status?.isMonitoringActive ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {isControlling ? '처리 중...' : status?.isMonitoringActive ? '모니터링 정지' : '모니터링 시작'}
                  </button>

                  <button
                    onClick={loadData}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    새로고침
                  </button>
                </div>

                {/* 헬스 요약 */}
                {healthSummary && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">시스템 리소스 평균</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gray-800/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Cpu className={`w-4 h-4 ${getHealthColor(healthSummary.cpu.status)}`} />
                          <span className="text-gray-300 text-sm">CPU</span>
                        </div>
                        <p className="text-white font-semibold">{healthSummary.cpu.average.toFixed(1)}%</p>
                        <p className="text-xs text-gray-400">최대: {healthSummary.cpu.max.toFixed(1)}%</p>
                      </div>

                      <div className="bg-gray-800/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className={`w-4 h-4 ${getHealthColor(healthSummary.memory.status)}`} />
                          <span className="text-gray-300 text-sm">메모리</span>
                        </div>
                        <p className="text-white font-semibold">{healthSummary.memory.average.toFixed(1)}%</p>
                        <p className="text-xs text-gray-400">최대: {healthSummary.memory.max.toFixed(1)}%</p>
                      </div>

                      <div className="bg-gray-800/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <HardDrive className={`w-4 h-4 ${getHealthColor(healthSummary.disk.status)}`} />
                          <span className="text-gray-300 text-sm">디스크</span>
                        </div>
                        <p className="text-white font-semibold">{healthSummary.disk.average.toFixed(1)}%</p>
                        <p className="text-xs text-gray-400">최대: {healthSummary.disk.max.toFixed(1)}%</p>
                      </div>

                      <div className="bg-gray-800/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Wifi className={`w-4 h-4 ${getHealthColor(healthSummary.network.status)}`} />
                          <span className="text-gray-300 text-sm">네트워크</span>
                        </div>
                        <p className="text-white font-semibold">{healthSummary.network.average.toFixed(1)}%</p>
                        <p className="text-xs text-gray-400">최대: {healthSummary.network.max.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 최근 장애 감지 로그 */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">최근 모니터링 로그 (상위 5개)</h3>
                  <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
                    {incidents.map((incident, index) => (
                      <div key={index} className="flex items-start gap-3 text-sm">
                        <span className="text-gray-500 min-w-[120px] text-xs">{incident.timestamp}</span>
                        <span className={`min-w-[80px] text-xs ${getSeverityColor(incident.severity)}`}>
                          [{incident.severity.toUpperCase()}]
                        </span>
                        <span className="text-gray-300 flex-1">{incident.message}</span>
                        {incident.resolved ? (
                          <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ServerMonitorModal; 