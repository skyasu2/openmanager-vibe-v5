/**
 * 🚀 Enhanced Server Detail Modal v3.0
 *
 * 완전히 고도화된 서버 상세 모달:
 * - 실시간 3D 게이지 및 차트
 * - 다중 탭 인터페이스
 * - 실시간 로그 스트림
 * - 프로세스 모니터링
 * - 네트워크 토폴로지
 * - AI 기반 인사이트
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Server,
  Database,
  Shield,
  BarChart3,
  Terminal,
  Network,
  Zap,
  Globe,
  Settings,
  RefreshCw,
  Play,
  Pause,
  Eye,
  Download,
  Share,
  Maximize2,
  Monitor,
  FileText,
  Brain,
  Target,
  Layers,
  GitBranch,
} from 'lucide-react';

interface EnhancedServerModalProps {
  isOpen: boolean;
  server: {
    id: string;
    hostname?: string;
    name: string;
    type?: string;
    environment?: string;
    location?: string;
    provider?: string;
    status: 'healthy' | 'warning' | 'critical' | 'offline';
    cpu: number;
    memory: number;
    disk: number;
    network?: number; // 네트워크 사용률 추가
    uptime?: string;
    lastUpdate?: Date;
    alerts?: number;
    services?: Array<{
      name: string;
      status: 'running' | 'stopped';
      port: number;
    }>;
    specs?: {
      cpu_cores: number;
      memory_gb: number;
      disk_gb: number;
      network_speed?: string; // 네트워크 속도 추가
    };
    os?: string;
    ip?: string;
    networkStatus?: 'excellent' | 'good' | 'poor' | 'offline'; // 네트워크 상태 추가
  } | null;
  onClose: () => void;
}

export default function EnhancedServerModal({
  isOpen,
  server,
  onClose,
}: EnhancedServerModalProps) {
  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'metrics' | 'processes' | 'logs' | 'network' | 'ai'
  >('overview');
  const [isRealtime, setIsRealtime] = useState(true);
  const [timeRange, setTimeRange] = useState<'5m' | '1h' | '6h' | '24h' | '7d'>(
    '1h'
  );

  const [realtimeData, setRealtimeData] = useState<{
    cpu: number[];
    memory: number[];
    disk: number[];
    network: { in: number; out: number }[];
    latency: number[];
    processes: Array<{
      name: string;
      cpu: number;
      memory: number;
      pid: number;
    }>;
    logs: Array<{
      timestamp: string;
      level: string;
      message: string;
      source: string;
    }>;
    insights: Array<{
      type: string;
      message: string;
      severity: string;
      timestamp: string;
    }>;
  }>({
    cpu: [],
    memory: [],
    disk: [],
    network: [],
    latency: [],
    processes: [],
    logs: [],
    insights: [],
  });

  // 🛡️ 안전한 서버 객체 생성 (null/undefined 방지)
  const safeServer = useMemo(() => {
    if (!server) return null;
    return {
      id: server.id || 'unknown',
      name: server.name || server.hostname || 'Unknown Server',
      hostname: server.hostname || server.name || 'unknown',
      status: server.status || 'offline',
      cpu: Math.max(0, Math.min(100, server.cpu || 0)),
      memory: Math.max(0, Math.min(100, server.memory || 0)),
      disk: Math.max(0, Math.min(100, server.disk || 0)),
      network: Math.max(0, Math.min(100, server.network || 0)),
      location: server.location || 'Unknown',
      provider: server.provider || 'Unknown',
      type: server.type || 'unknown',
      environment: server.environment || 'production',
      uptime: server.uptime || '0d 0h 0m',
      lastUpdate: server.lastUpdate || new Date(),
      alerts: server.alerts || 0,
      services: Array.isArray(server.services) ? server.services : [
        { name: 'nginx', status: 'running', port: 80 },
        { name: 'nodejs', status: 'running', port: 3000 },
        { name: 'redis', status: 'running', port: 6379 },
      ],
      specs: server.specs || {
        cpu_cores: 4,
        memory_gb: 8,
        disk_gb: 100,
        network_speed: '1Gbps',
      },
      os: server.os || 'Linux',
      ip: server.ip || '192.168.1.100',
      networkStatus: server.networkStatus || 'good',
    };
  }, [server]);

  // 🔄 실시간 데이터 생성
  useEffect(() => {
    if (!isRealtime || !safeServer) return;

    const interval = setInterval(() => {
      // 🎯 서버 상태에 따른 현실적인 변화량
      const statusMultiplier = safeServer.status === 'critical' ? 1.5 :
        safeServer.status === 'warning' ? 1.2 : 1.0;

      setRealtimeData(prev => ({
        cpu: [
          ...prev.cpu.slice(-19),
          Math.max(0, Math.min(100, safeServer.cpu + (Math.random() - 0.5) * 10 * statusMultiplier))
        ],
        memory: [
          ...prev.memory.slice(-19),
          Math.max(0, Math.min(100, safeServer.memory + (Math.random() - 0.5) * 5 * statusMultiplier))
        ],
        disk: [
          ...prev.disk.slice(-19),
          Math.max(0, Math.min(100, safeServer.disk + (Math.random() - 0.5) * 2))
        ],
        network: [
          ...prev.network.slice(-19),
          {
            in: Math.max(0, safeServer.network + (Math.random() - 0.5) * 20),
            out: Math.max(0, (safeServer.network || 0) * 0.8 + (Math.random() - 0.5) * 15),
          },
        ],
        latency: [
          ...prev.latency.slice(-19),
          Math.max(1, 50 + (Math.random() - 0.5) * 100 * statusMultiplier)
        ],
        processes: [
          { name: 'nginx', cpu: 15 + Math.random() * 10, memory: 8 + Math.random() * 4, pid: 1234 },
          { name: 'node', cpu: 25 + Math.random() * 15, memory: 12 + Math.random() * 8, pid: 5678 },
          { name: 'redis', cpu: 5 + Math.random() * 5, memory: 4 + Math.random() * 2, pid: 9012 },
          { name: 'postgres', cpu: 20 + Math.random() * 10, memory: 16 + Math.random() * 8, pid: 3456 },
        ],
        logs: [
          ...prev.logs.slice(-4),
          {
            timestamp: new Date().toISOString(),
            level: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)],
            message: [
              'HTTP request processed successfully',
              'Database connection established',
              'Cache miss for key: user_session',
              'Memory usage threshold exceeded',
              'SSL certificate renewal required',
            ][Math.floor(Math.random() * 5)],
            source: ['nginx', 'postgres', 'redis', 'app'][Math.floor(Math.random() * 4)],
          },
        ],
        insights: [
          ...prev.insights.slice(-2),
          {
            type: ['performance', 'security', 'optimization'][Math.floor(Math.random() * 3)],
            message: [
              `CPU 사용률이 ${Math.round(safeServer.cpu)}%로 높습니다.`,
              '메모리 사용 패턴이 비정상적입니다.',
              '네트워크 지연시간이 증가하고 있습니다.',
              '디스크 I/O 성능이 저하되고 있습니다.',
            ][Math.floor(Math.random() * 4)],
            severity: statusMultiplier > 1.2 ? 'high' : statusMultiplier > 1.0 ? 'medium' : 'low',
            timestamp: new Date().toISOString(),
          },
        ],
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [isRealtime, safeServer]);

  // 탭 설정
  const tabs = [
    { id: 'overview', label: '개요', icon: Activity },
    { id: 'metrics', label: '메트릭', icon: BarChart3 },
    { id: 'processes', label: '프로세스', icon: Cpu },
    { id: 'logs', label: '로그', icon: FileText },
    { id: 'network', label: '네트워크', icon: Network },
    { id: 'ai', label: 'AI 인사이트', icon: Brain },
  ];

  // 3D 게이지 컴포넌트
  const CircularGauge3D = ({
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
    const percentage = Math.max(0, Math.min(100, (value / max) * 100));
    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className='flex flex-col items-center'>
        <div className='relative' style={{ width: size, height: size }}>
          <svg
            className='transform -rotate-90 drop-shadow-lg'
            width={size}
            height={size}
          >
            {/* 배경 원 */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r='45'
              stroke='#e5e7eb'
              strokeWidth='8'
              fill='transparent'
              className='drop-shadow-sm'
            />
            {/* 진행률 원 */}
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
              className='transition-all duration-1000 ease-out drop-shadow-sm'
              style={{
                filter: `drop-shadow(0 0 8px ${color}40)`,
              }}
            />
            {/* 내부 그라데이션 */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r='35'
              fill={`url(#gradient-${label})`}
              className='opacity-20'
            />
            <defs>
              <radialGradient id={`gradient-${label}`}>
                <stop offset='0%' stopColor={color} stopOpacity='0.3' />
                <stop offset='100%' stopColor={color} stopOpacity='0.1' />
              </radialGradient>
            </defs>
          </svg>
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='text-center'>
              <div className='text-2xl font-bold' style={{ color }}>
                {value}%
              </div>
              <div className='text-xs text-gray-500 mt-1'>{label}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 실시간 차트 컴포넌트
  const RealtimeChart = ({
    data,
    color,
    label,
    height = 100,
  }: {
    data: number[];
    color: string;
    label: string;
    height?: number;
  }) => {
    const points = data
      .map((value, index) => {
        const x = (index / Math.max(data.length - 1, 1)) * 100;
        const y = 100 - Math.max(0, Math.min(100, value));
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <div className='bg-white rounded-lg p-4 shadow-sm border'>
        <h4 className='text-sm font-medium text-gray-700 mb-2'>{label}</h4>
        <div className='relative' style={{ height }}>
          <svg
            className='w-full h-full'
            viewBox='0 0 100 100'
            preserveAspectRatio='none'
          >
            <defs>
              <linearGradient
                id={`area-gradient-${label}`}
                x1='0%'
                y1='0%'
                x2='0%'
                y2='100%'
              >
                <stop offset='0%' stopColor={color} stopOpacity='0.3' />
                <stop offset='100%' stopColor={color} stopOpacity='0.05' />
              </linearGradient>
            </defs>
            {/* 격자 */}
            {[20, 40, 60, 80].map(y => (
              <line
                key={y}
                x1='0'
                y1={y}
                x2='100'
                y2={y}
                stroke='#f3f4f6'
                strokeWidth='0.5'
              />
            ))}
            {/* 영역 */}
            <polygon
              fill={`url(#area-gradient-${label})`}
              points={`0,100 ${points} 100,100`}
            />
            {/* 라인 */}
            <polyline
              fill='none'
              stroke={color}
              strokeWidth='2'
              points={points}
              vectorEffect='non-scaling-stroke'
              className='drop-shadow-sm'
            />
            {/* 최신 값 포인트 */}
            {data.length > 0 && (
              <circle
                cx={((data.length - 1) / Math.max(data.length - 1, 1)) * 100}
                cy={100 - Math.max(0, Math.min(100, data[data.length - 1]))}
                r='2'
                fill={color}
                className='drop-shadow-sm'
              />
            )}
          </svg>
          {/* Y축 라벨 */}
          <div className='absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2'>
            <span>100</span>
            <span>50</span>
            <span>0</span>
          </div>
        </div>
        <div className='text-right mt-1'>
          <span className='text-sm font-bold' style={{ color }}>
            {data[data.length - 1]?.toFixed(1) || '0'}%
          </span>
        </div>
      </div>
    );
  };

  if (!server) return null;

  // 🛡️ 서버 데이터가 없으면 null 반환
  if (!isOpen || !safeServer) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className='bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden'
            onClick={e => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className='bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='p-3 bg-white/20 rounded-lg'>
                    <Server className='w-6 h-6' />
                  </div>
                  <div>
                    <h2 className='text-2xl font-bold'>{safeServer.name}</h2>
                    <p className='text-blue-100'>
                      {safeServer.type} • {safeServer.location}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-3'>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsRealtime(!isRealtime)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${isRealtime ? 'bg-green-500' : 'bg-white/20'
                      }`}
                  >
                    {isRealtime ? (
                      <Play className='w-4 h-4' />
                    ) : (
                      <Pause className='w-4 h-4' />
                    )}
                    {isRealtime ? '실시간' : '정지됨'}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className='p-2 bg-white/20 rounded-lg hover:bg-white/30'
                  >
                    <X className='w-5 h-5' />
                  </motion.button>
                </div>
              </div>

              {/* 탭 네비게이션 */}
              <div className='flex gap-2 mt-6'>
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedTab(tab.id as any)}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${selectedTab === tab.id
                        ? 'bg-white text-blue-600 shadow-lg'
                        : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                    >
                      <Icon className='w-4 h-4' />
                      {tab.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* 콘텐츠 영역 */}
            <div className='flex-1 p-6 overflow-y-auto bg-gray-50'>
              <AnimatePresence mode='wait'>
                <motion.div
                  key={selectedTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {selectedTab === 'overview' && (
                    <div className='space-y-6'>
                      {/* 3D 게이지들 */}
                      <div>
                        <h3 className='text-xl font-bold text-gray-900 mb-4'>
                          실시간 리소스 모니터링
                        </h3>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-8 bg-white rounded-xl p-6 shadow-sm'>
                          <CircularGauge3D
                            value={safeServer.cpu}
                            label='CPU'
                            color='#ef4444'
                            size={140}
                          />
                          <CircularGauge3D
                            value={safeServer.memory}
                            label='메모리'
                            color='#3b82f6'
                            size={140}
                          />
                          <CircularGauge3D
                            value={safeServer.disk}
                            label='디스크'
                            color='#8b5cf6'
                            size={140}
                          />
                        </div>
                      </div>

                      {/* 시스템 정보 */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='bg-white rounded-xl p-6 shadow-sm'>
                          <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                            시스템 정보
                          </h4>
                          <div className='space-y-3'>
                            <div className='flex justify-between'>
                              <span className='text-gray-600'>운영체제</span>
                              <span className='font-medium'>
                                {safeServer.os}
                              </span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-gray-600'>IP 주소</span>
                              <span className='font-medium'>
                                {safeServer.ip}
                              </span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-gray-600'>업타임</span>
                              <span className='font-medium'>
                                {safeServer.uptime}
                              </span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-gray-600'>CPU 코어</span>
                              <span className='font-medium'>
                                {safeServer.specs?.cpu_cores}개
                              </span>
                            </div>
                            <div className='flex justify-between'>
                              <span className='text-gray-600'>메모리</span>
                              <span className='font-medium'>
                                {safeServer.specs?.memory_gb}GB
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className='bg-white rounded-xl p-6 shadow-sm'>
                          <h4 className='text-lg font-semibold text-gray-900 mb-4'>
                            서비스 상태
                          </h4>
                          <div className='space-y-3'>
                            {safeServer.services.map((service, idx) => (
                              <div
                                key={idx}
                                className='flex items-center justify-between'
                              >
                                <div className='flex items-center gap-3'>
                                  <div
                                    className={`w-3 h-3 rounded-full ${service.status === 'running'
                                      ? 'bg-green-500'
                                      : 'bg-red-500'
                                      }`}
                                  />
                                  <span className='font-medium'>
                                    {service.name}
                                  </span>
                                </div>
                                <span className='text-sm text-gray-600'>
                                  :{service.port}
                                </span>
                              </div>
                            ))}

                            {/* 서비스가 없는 경우 안내 메시지 */}
                            {safeServer.services.length === 0 && (
                              <div className='text-center py-4 text-gray-500'>
                                <span className='text-sm'>
                                  등록된 서비스가 없습니다
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTab === 'metrics' && (
                    <div className='space-y-6'>
                      <div className='flex items-center justify-between'>
                        <h3 className='text-xl font-bold text-gray-900'>
                          성능 메트릭
                        </h3>
                        <select
                          value={timeRange}
                          onChange={e => setTimeRange(e.target.value as any)}
                          className='px-3 py-2 border border-gray-300 rounded-lg'
                          title='시간 범위 선택'
                          aria-label='시간 범위 선택'
                        >
                          <option value='5m'>5분</option>
                          <option value='1h'>1시간</option>
                          <option value='6h'>6시간</option>
                          <option value='24h'>24시간</option>
                          <option value='7d'>7일</option>
                        </select>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <RealtimeChart
                          data={realtimeData.cpu}
                          color='#ef4444'
                          label='CPU 사용률'
                        />
                        <RealtimeChart
                          data={realtimeData.memory}
                          color='#3b82f6'
                          label='메모리 사용률'
                        />
                        <RealtimeChart
                          data={realtimeData.disk}
                          color='#8b5cf6'
                          label='디스크 사용률'
                        />
                        <RealtimeChart
                          data={realtimeData.latency}
                          color='#22c55e'
                          label='응답 시간 (ms)'
                        />
                      </div>
                    </div>
                  )}

                  {selectedTab === 'processes' && (
                    <div className='space-y-6'>
                      <h3 className='text-xl font-bold text-gray-900'>
                        실행 중인 프로세스
                      </h3>
                      <div className='bg-white rounded-xl shadow-sm overflow-hidden'>
                        <table className='w-full'>
                          <thead className='bg-gray-50'>
                            <tr>
                              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                프로세스
                              </th>
                              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                PID
                              </th>
                              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                CPU
                              </th>
                              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                메모리
                              </th>
                            </tr>
                          </thead>
                          <tbody className='bg-white divide-y divide-gray-200'>
                            {realtimeData.processes.map((process, idx) => (
                              <motion.tr
                                key={idx}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.1 }}
                              >
                                <td className='px-6 py-4 whitespace-nowrap'>
                                  <div className='font-medium text-gray-900'>
                                    {process.name}
                                  </div>
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                  {process.pid}
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap'>
                                  <div className='text-sm font-medium text-gray-900'>
                                    {process.cpu.toFixed(1)}%
                                  </div>
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap'>
                                  <div className='text-sm font-medium text-gray-900'>
                                    {process.memory.toFixed(1)}%
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {selectedTab === 'logs' && (
                    <div className='space-y-6'>
                      <h3 className='text-xl font-bold text-gray-900'>
                        실시간 로그
                      </h3>
                      <div className='bg-gray-900 rounded-xl p-4 h-96 overflow-y-auto font-mono text-sm'>
                        {realtimeData.logs.map((log, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`mb-2 ${log.level === 'error'
                              ? 'text-red-400'
                              : log.level === 'warn'
                                ? 'text-yellow-400'
                                : 'text-green-400'
                              }`}
                          >
                            <span className='text-gray-500'>
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <span className='ml-2 text-blue-400'>
                              [{log.source}]
                            </span>
                            <span className='ml-2 font-bold'>
                              {log.level.toUpperCase()}
                            </span>
                            <span className='ml-2'>{log.message}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTab === 'ai' && (
                    <div className='space-y-6'>
                      <h3 className='text-xl font-bold text-gray-900'>
                        AI 인사이트
                      </h3>
                      <div className='space-y-4'>
                        {realtimeData.insights.map((insight, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`p-4 rounded-xl border-l-4 ${insight.severity === 'critical'
                              ? 'bg-red-50 border-red-500'
                              : insight.severity === 'warning'
                                ? 'bg-yellow-50 border-yellow-500'
                                : 'bg-blue-50 border-blue-500'
                              }`}
                          >
                            <div className='flex items-start gap-3'>
                              <Brain className='w-5 h-5 mt-1 text-blue-600' />
                              <div>
                                <p className='font-medium text-gray-900'>
                                  {insight.message}
                                </p>
                                <p className='text-sm text-gray-600 mt-1'>
                                  {insight.type} •{' '}
                                  {new Date(insight.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
