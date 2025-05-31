'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Database, 
  Play, 
  Pause, 
  Activity, 
  Clock, 
  Server,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  BarChart3
} from 'lucide-react';

interface ServerGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GeneratorStatus {
  isRunning: boolean;
  serversCount: number;
  updateCounter: number;
  memoryUsage: string;
  lastPatternUpdate: string;
  config: {
    updateInterval: number;
    compressionEnabled: boolean;
    realisticPatternsEnabled: boolean;
  };
}

interface ServerPreview {
  id: string;
  name: string;
  cpu_usage: number;
  memory_usage: number;
  status: 'healthy' | 'warning' | 'critical';
  last_updated: string;
  role: string;
  environment: string;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
}

export const ServerGeneratorModal: React.FC<ServerGeneratorModalProps> = ({
  isOpen,
  onClose
}) => {
  const [status, setStatus] = useState<GeneratorStatus | null>(null);
  const [servers, setServers] = useState<ServerPreview[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
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
      // 생성기 상태 조회
      const statusResponse = await fetch('/api/data-generator/optimized?action=status');
      const statusData = await statusResponse.json();
      
      if (statusData.success) {
        setStatus(statusData.data.optimizedGenerator);
      }

      // 서버 미리보기 데이터 조회
      const serversResponse = await fetch('/api/data-generator/optimized?action=servers');
      const serversData = await serversResponse.json();
      
      if (serversData.success && serversData.data.servers) {
        // 모달 형식에 맞게 데이터 변환
        const transformedServers = serversData.data.servers.slice(0, 5).map((server: any, index: number) => ({
          id: server.id || `server-${index}`,
          name: server.name || server.server_name || `Server-${index + 1}`,
          cpu_usage: server.cpu_usage || server.cpu || Math.random() * 100,
          memory_usage: server.memory_usage || server.memory || Math.random() * 100,
          status: server.status === 'critical' ? 'critical' : 
                  server.status === 'warning' ? 'warning' : 'healthy',
          last_updated: server.last_updated || server.lastUpdate || new Date().toISOString(),
          role: server.role || server.type || 'web',
          environment: server.environment || 'production'
        }));
        setServers(transformedServers);
      } else {
        // Fallback 데이터
        setServers([
          { 
            id: 'server-001', 
            name: 'Web-Server-01', 
            cpu_usage: 45.2, 
            memory_usage: 67.8, 
            status: 'healthy', 
            last_updated: new Date().toISOString(),
            role: 'web',
            environment: 'production'
          },
          { 
            id: 'server-002', 
            name: 'API-Server-01', 
            cpu_usage: 78.9, 
            memory_usage: 82.1, 
            status: 'warning', 
            last_updated: new Date().toISOString(),
            role: 'api',
            environment: 'production'
          },
          { 
            id: 'server-003', 
            name: 'Database-01', 
            cpu_usage: 23.4, 
            memory_usage: 91.5, 
            status: 'critical', 
            last_updated: new Date().toISOString(),
            role: 'database',
            environment: 'production'
          }
        ]);
      }

      // 모의 로그 데이터 (실제로는 API에서 가져올 수 있음)
      setLogs([
        {
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          message: '베이스라인 데이터 생성 완료 (24시간 패턴)'
        },
        {
          timestamp: new Date(Date.now() - 30000).toLocaleTimeString(),
          level: 'info', 
          message: '실시간 변동 적용 중 (5초 간격)'
        },
        {
          timestamp: new Date(Date.now() - 60000).toLocaleTimeString(),
          level: 'warning',
          message: '메모리 사용량 임계값 접근 (85%)'
        }
      ]);

    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setLogs(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        level: 'error',
        message: '데이터 로드 실패: ' + (error as Error).message
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 생성기 제어 (시작/중지)
  const controlGenerator = async (action: 'start' | 'stop') => {
    setIsControlling(true);
    try {
      const response = await fetch('/api/data-generator/optimized', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const result = await response.json();
      
      if (result.success) {
        setLogs(prev => [{
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          message: result.data.message
        }, ...prev.slice(0, 2)]);
        
        // 상태 갱신
        await loadData();
      } else {
        setLogs(prev => [{
          timestamp: new Date().toLocaleTimeString(),
          level: 'error',
          message: result.error || '제어 실패'
        }, ...prev.slice(0, 2)]);
      }
    } catch (error) {
      console.error('생성기 제어 실패:', error);
      setLogs(prev => [{
        timestamp: new Date().toLocaleTimeString(),
        level: 'error',
        message: '제어 요청 실패: ' + (error as Error).message
      }, ...prev.slice(0, 2)]);
    } finally {
      setIsControlling(false);
    }
  };

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (isOpen) {
      loadData();
      // 10초마다 자동 갱신
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // 상태에 따른 색상 반환
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-blue-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
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
            className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl"
          >
            {/* 헤더 */}
            <div className="p-6 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">서버 데이터 생성기</h2>
                    <p className="text-sm text-gray-400">시뮬레이터 상태 확인 및 제어</p>
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
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-300">데이터를 로드하는 중...</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* 상태 요약 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className={`w-4 h-4 ${status?.isRunning ? 'text-green-400' : 'text-red-400'}`} />
                      <span className="text-gray-300 text-sm">상태</span>
                    </div>
                    <p className={`text-lg font-semibold ${status?.isRunning ? 'text-green-400' : 'text-red-400'}`}>
                      {status?.isRunning ? '실행 중' : '중지됨'}
                    </p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Server className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300 text-sm">서버 수</span>
                    </div>
                    <p className="text-lg font-semibold text-white">{status?.serversCount || 0}</p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-300 text-sm">메모리 사용량</span>
                    </div>
                    <p className="text-lg font-semibold text-white">{status?.memoryUsage || '0%'}</p>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-300 text-sm">마지막 업데이트</span>
                    </div>
                    <p className="text-lg font-semibold text-white">{status?.lastPatternUpdate || 'N/A'}</p>
                  </div>
                </div>

                {/* 제어 버튼 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => controlGenerator(status?.isRunning ? 'stop' : 'start')}
                    disabled={isControlling}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                      status?.isRunning
                        ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/50'
                        : 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/50'
                    }`}
                  >
                    {isControlling ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : status?.isRunning ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {isControlling ? '처리 중...' : status?.isRunning ? '정지' : '시작'}
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

                {/* 서버 미리보기 */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">최근 생성된 서버 (상위 5개)</h3>
                  <div className="bg-gray-800/30 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-700/50">
                            <th className="text-left p-3 text-gray-300">서버명</th>
                            <th className="text-left p-3 text-gray-300">CPU</th>
                            <th className="text-left p-3 text-gray-300">메모리</th>
                            <th className="text-left p-3 text-gray-300">상태</th>
                            <th className="text-left p-3 text-gray-300">역할</th>
                            <th className="text-left p-3 text-gray-300">환경</th>
                          </tr>
                        </thead>
                        <tbody>
                          {servers.map((server, index) => (
                            <tr key={server.id} className="border-b border-gray-700/30">
                              <td className="p-3 text-white font-medium">{server.name}</td>
                              <td className="p-3 text-gray-300">{server.cpu_usage.toFixed(1)}%</td>
                              <td className="p-3 text-gray-300">{server.memory_usage.toFixed(1)}%</td>
                              <td className="p-3">
                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(server.status)}`}>
                                  {server.status}
                                </span>
                              </td>
                              <td className="p-3 text-gray-300">{server.role}</td>
                              <td className="p-3 text-gray-300">{server.environment}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 로그 미리보기 */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">최근 로그 (상위 3개)</h3>
                  <div className="bg-gray-800/30 rounded-lg p-4 space-y-2">
                    {logs.map((log, index) => (
                      <div key={index} className="flex items-start gap-3 text-sm">
                        <span className="text-gray-500 min-w-[60px]">{log.timestamp}</span>
                        <span className={`min-w-[60px] ${getLogColor(log.level)}`}>
                          [{log.level.toUpperCase()}]
                        </span>
                        <span className="text-gray-300 flex-1">{log.message}</span>
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

export default ServerGeneratorModal; 