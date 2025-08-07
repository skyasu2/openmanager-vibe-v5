'use client';

/**
 * 🚀 Enhanced Server Detail Modal v4.0
 *
 * 완전히 재디자인된 현대적 서버 상세 모달:
 * - 직관적인 탭 네비게이션
 * - 상태별 색상 시스템 (녹색/노랑/빨강)
 * - 부드러운 애니메이션
 * - 반응형 레이아웃
 * - 실시간 데이터 시각화
 * - 깔끔한 카드 기반 디자인
 */

import { calculateOptimalCollectionInterval } from '@/config/serverConfig';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Cpu,
  FileText,
  Network,
  Pause,
  Play,
  Server as ServerIcon,
  X,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { ServerModal3DGauge } from '../shared/UnifiedCircularGauge';

// framer-motion을 동적 import로 처리
const MotionButton = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.motion.button })),
  { ssr: false }
);
const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.motion.div })),
  { ssr: false }
);
const AnimatePresence = dynamic(
  () =>
    import('framer-motion').then((mod) => ({ default: mod.AnimatePresence })),
  { ssr: false }
);

interface EnhancedServerModalProps {
  server: {
    id: string;
    hostname: string;
    name: string;
    type: string;
    environment: string;
    location: string;
    provider: string;
    status: 'healthy' | 'warning' | 'critical' | 'offline';
    cpu: number;
    memory: number;
    disk: number;
    network?: number; // 네트워크 사용률 추가
    uptime: string;
    lastUpdate: Date;
    alerts: number;
    services: Array<{
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
    health?: {
      score: number;
      trend: number[];
    };
    alertsSummary?: {
      total: number;
      critical: number;
      warning: number;
    };
  } | null;
  onClose: () => void;
}

export default function EnhancedServerModal({
  server,
  onClose,
}: EnhancedServerModalProps) {
  // 🎯 React Hooks는 항상 최상단에서 호출
  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'metrics' | 'processes' | 'logs' | 'network'
  >('overview');
  const [isRealtime, setIsRealtime] = useState(true);
  const [_timeRange, _setTimeRange] = useState<
    '5m' | '1h' | '6h' | '24h' | '7d'
  >('1h');
  const [realtimeData, setRealtimeData] = useState({
    cpu: [] as number[],
    memory: [] as number[],
    disk: [] as number[],
    network: [] as { in: number; out: number }[],
    latency: [] as number[],
    processes: [] as Array<{
      name: string;
      cpu: number;
      memory: number;
      pid: number;
    }>,
    logs: [] as Array<{
      timestamp: string;
      level: 'info' | 'warn' | 'error';
      message: string;
      source: string;
    }>,
  });

  // 🛡️ 서버 데이터 안전성 검증 및 기본값 설정
  const safeServer = useMemo(
    () =>
      server
        ? {
            id: server.id || 'unknown',
            hostname: server.hostname || 'unknown.local',
            name: server.name || 'Unknown Server',
            type: server.type || 'unknown',
            environment: server.environment || 'unknown',
            location: server.location || 'Unknown Location',
            provider: server.provider || 'Unknown Provider',
            status: server.status || 'offline',
            cpu: typeof server.cpu === 'number' ? server.cpu : 0,
            memory: typeof server.memory === 'number' ? server.memory : 0,
            disk: typeof server.disk === 'number' ? server.disk : 0,
            network: typeof server.network === 'number' ? server.network : 0,
            uptime: server.uptime || '0h 0m',
            lastUpdate: server.lastUpdate || new Date(),
            alerts: typeof server.alerts === 'number' ? server.alerts : 0,
            services: Array.isArray(server.services) ? server.services : [],
            specs: server.specs || { cpu_cores: 4, memory_gb: 8, disk_gb: 100 },
            os: server.os || 'Unknown OS',
            ip: server.ip || '0.0.0.0',
            networkStatus: server.networkStatus || 'offline',
            health: server.health || { score: 0, trend: [] },
            alertsSummary: server.alertsSummary || {
              total: 0,
              critical: 0,
              warning: 0,
            },
          }
        : null,
    [server]
  );

  // 실시간 데이터 생성
  useEffect(() => {
    if (!safeServer || !isRealtime) return;

    const generateRealtimeData = () => {
      try {
        const now = new Date();
        setRealtimeData((prev) => ({
          cpu: [
            ...prev.cpu.slice(-29),
            // 🎯 메트릭 변화량 안정화: 기존 ±10 → ±3
            safeServer.cpu + (Math.random() - 0.5) * 3,
          ].slice(-30),
          memory: [
            ...prev.memory.slice(-29),
            // 🎯 메트릭 변화량 안정화: 기존 ±8 → ±2
            safeServer.memory + (Math.random() - 0.5) * 2,
          ].slice(-30),
          disk: [
            ...prev.disk.slice(-29),
            // 🎯 메트릭 변화량 안정화: 기존 ±3 → ±1
            safeServer.disk + (Math.random() - 0.5) * 1,
          ].slice(-30),
          network: [
            ...prev.network.slice(-29),
            {
              in: Math.random() * 200 + 400,
              out: Math.random() * 150 + 250,
            },
          ].slice(-30),
          latency: [...prev.latency.slice(-29), Math.random() * 20 + 45].slice(
            -30
          ),
          processes:
            safeServer.services?.map((service, i) => ({
              name: service.name || `service-${i}`,
              cpu: parseFloat((Math.random() * 8).toFixed(2)),
              memory: parseFloat((Math.random() * 6).toFixed(2)),
              pid: 1000 + i,
            })) || [],
          logs: [
            ...prev.logs.slice(-19),
            {
              timestamp: now.toISOString(),
              level: ['info', 'warn', 'error'][
                Math.floor(Math.random() * 3)
              ] as 'info' | 'warn' | 'error',
              message: [
                `${safeServer.name} - HTTP request processed successfully`,
                `${safeServer.name} - Memory usage above threshold`,
                `${safeServer.name} - Database connection established`,
                `${safeServer.name} - Cache invalidated`,
                `${safeServer.name} - Backup completed`,
                `${safeServer.name} - SSL certificate renewed`,
              ][Math.floor(Math.random() * 6)],
              source:
                safeServer.services?.[
                  Math.floor(Math.random() * safeServer.services.length)
                ]?.name || safeServer.name,
            },
          ].slice(-20),
        }));
      } catch (error) {
        console.error(
          '⚠️ [EnhancedServerModal] 실시간 데이터 생성 오류:',
          error
        );
        // 오류 발생 시 기본 데이터로 설정
        setRealtimeData((prev) => ({
          ...prev,
          logs: [
            ...prev.logs.slice(-19),
            {
              timestamp: new Date().toISOString(),
              level: 'warn' as 'info' | 'warn' | 'error',
              message: `${safeServer.name} - 데이터 생성 오류 발생`,
              source: safeServer.name,
            },
          ].slice(-20),
        }));
      }
    };

    generateRealtimeData();
    // 🎯 데이터 수집 간격과 완전 동기화
    // 서버 카드, 실시간 훅과 모두 동기화하여 일관된 업데이트 제공
    // 🚨 무료 티어 절약: 실시간 데이터 생성 간격 5-10분
    const interval = setInterval(
      generateRealtimeData,
      calculateOptimalCollectionInterval()
    );

    return () => clearInterval(interval);
  }, [safeServer, isRealtime]);

  // 탭 설정
  const tabs = [
    { id: 'overview', label: '개요', icon: Activity },
    { id: 'metrics', label: '메트릭', icon: BarChart3 },
    { id: 'processes', label: '프로세스', icon: Cpu },
    { id: 'logs', label: '로그', icon: FileText },
    { id: 'network', label: '네트워크', icon: Network },
  ];

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
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h4 className="mb-2 text-sm font-medium text-gray-700">{label}</h4>
        <div className="relative" style={{ height }}>
          <svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id={`area-gradient-${label}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                <stop offset="100%" stopColor={color} stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {/* 격자 */}
            {[20, 40, 60, 80].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="#f3f4f6"
                strokeWidth="0.5"
              />
            ))}
            {/* 영역 */}
            <polygon
              fill={`url(#area-gradient-${label})`}
              points={`0,100 ${points} 100,100`}
            />
            {/* 라인 */}
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="3"
              points={points}
              vectorEffect="non-scaling-stroke"
              className="drop-shadow-sm"
            />
            {/* 최신 값 포인트 */}
            {data.length > 0 && (
              <circle
                cx={((data.length - 1) / Math.max(data.length - 1, 1)) * 100}
                cy={100 - Math.max(0, Math.min(100, data[data.length - 1]))}
                r="2"
                fill={color}
                className="drop-shadow-sm"
              />
            )}
          </svg>
          {/* Y축 라벨 */}
          <div className="absolute left-0 top-0 flex h-full flex-col justify-between pr-2 text-xs text-gray-400">
            <span>100</span>
            <span>50</span>
            <span>0</span>
          </div>
        </div>
        <div className="mt-1 text-right">
          <span className="text-sm font-bold" style={{ color }}>
            {data[data.length - 1]?.toFixed(1) || '0'}%
          </span>
        </div>
      </div>
    );
  };

  if (!safeServer) {
    console.warn('⚠️ [EnhancedServerModal] 서버 데이터가 없습니다.');
    // 모달을 닫지 않고 오류 상태를 표시
    return (
      <AnimatePresence>
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <MotionDiv
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md rounded-xl bg-white p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 text-4xl text-red-500">⚠️</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              서버 데이터 오류
            </h3>
            <p className="mb-4 text-gray-600">
              서버 정보를 불러올 수 없습니다.
            </p>
            <button
              onClick={onClose}
              className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            >
              닫기
            </button>
          </MotionDiv>
        </MotionDiv>
      </AnimatePresence>
    );
  }

  // 상태별 색상 테마 가져오기
  const getStatusTheme = () => {
    switch (safeServer?.status) {
      case 'healthy':
        return {
          gradient: 'from-green-500 to-emerald-600',
          bgLight: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          badge: 'bg-green-100 text-green-800',
          icon: '✅',
        };
      case 'warning':
        return {
          gradient: 'from-yellow-500 to-amber-600',
          bgLight: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-700',
          badge: 'bg-yellow-100 text-yellow-800',
          icon: '⚠️',
        };
      case 'critical':
      case 'offline':
        return {
          gradient: 'from-red-500 to-rose-600',
          bgLight: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          badge: 'bg-red-100 text-red-800',
          icon: '🚨',
        };
      default:
        return {
          gradient: 'from-gray-500 to-slate-600',
          bgLight: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          badge: 'bg-gray-100 text-gray-800',
          icon: '❓',
        };
    }
  };

  const statusTheme = getStatusTheme();

  return (
    <AnimatePresence>
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <MotionDiv
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="flex h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 - 상태별 색상 적용 */}
          <div className={`bg-gradient-to-r ${statusTheme.gradient} p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <MotionDiv
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="rounded-xl bg-white/25 p-3 backdrop-blur-sm shadow-lg"
                >
                  <ServerIcon className="h-7 w-7 text-white" />
                </MotionDiv>
                <div>
                  <h2 className="flex items-center gap-3 text-2xl font-bold">
                    <span className="drop-shadow-sm">{safeServer.name}</span>
                    <span className="text-3xl">{statusTheme.icon}</span>
                    {safeServer.health?.score !== undefined && (
                      <MotionDiv
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="rounded-lg bg-white/30 px-3 py-1 text-sm font-bold backdrop-blur-sm"
                      >
                        점수: {Math.round(safeServer.health.score)}%
                      </MotionDiv>
                    )}
                  </h2>
                  <p className="flex items-center gap-3 text-white/90 mt-1">
                    <span className="font-medium">{safeServer.type}</span>
                    <span>•</span>
                    <span>{safeServer.location}</span>
                    {safeServer.alertsSummary?.total ? (
                      <MotionDiv
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-500/30 px-3 py-1 text-xs font-bold backdrop-blur-sm"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {safeServer.alertsSummary.total} 알림
                      </MotionDiv>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MotionButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsRealtime(!isRealtime)}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-medium transition-all duration-300 ${
                    isRealtime
                      ? 'bg-white text-green-600 shadow-xl'
                      : 'bg-white/20 text-white backdrop-blur-sm hover:bg-white/30'
                  }`}
                >
                  {isRealtime ? (
                    <>
                      <Play className="h-4 w-4" />
                      <span>실시간 모니터링 중</span>
                      <span className="animate-pulse">●</span>
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4" />
                      <span>일시정지</span>
                    </>
                  )}
                </MotionButton>

                <MotionButton
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm transition-all duration-300 hover:bg-white/30"
                  title="모달 닫기"
                >
                  <X className="h-5 w-5" />
                </MotionButton>
              </div>
            </div>

            {/* 탭 네비게이션 - 개선된 디자인 */}
            <div className="mt-6 flex gap-2 overflow-x-auto">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = selectedTab === tab.id;
                return (
                  <MotionButton
                    key={tab.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTab(tab.id as any)}
                    className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-white text-gray-800 shadow-xl'
                        : 'bg-white/10 text-white/90 backdrop-blur-sm hover:bg-white/20'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-gray-700' : 'text-white/90'}`} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <MotionDiv
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-xl bg-white"
                        style={{ zIndex: -1 }}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </MotionButton>
                );
              })}
            </div>
          </div>

          {/* 콘텐츠 영역 - 현대적이고 직관적인 UI로 재디자인 */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
            <AnimatePresence mode="wait">
              <MotionDiv
                key={selectedTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 300, 
                  damping: 30 
                }}
                className="p-6"
              >
                {selectedTab === 'overview' && (
                  <div className="space-y-6">
                    {/* 3D 게이지들 - 개선된 디자인 */}
                    <MotionDiv
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                          실시간 리소스 모니터링
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-sm text-gray-600 font-medium">실시간 업데이트 중</span>
                        </div>
                      </div>
                      <div className={`grid grid-cols-1 gap-8 rounded-2xl bg-gradient-to-br ${statusTheme.bgLight} backdrop-blur-sm border ${statusTheme.borderColor} p-8 shadow-xl md:grid-cols-3`}>
                        <MotionDiv whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400 }}>
                          <ServerModal3DGauge
                            value={safeServer.cpu}
                            label="CPU"
                            type="cpu"
                            size={160}
                          />
                        </MotionDiv>
                        <MotionDiv whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400 }}>
                          <ServerModal3DGauge
                            value={safeServer.memory}
                            label="메모리"
                            type="memory"
                            size={160}
                          />
                        </MotionDiv>
                        <MotionDiv whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400 }}>
                          <ServerModal3DGauge
                            value={safeServer.disk}
                            label="디스크"
                            type="disk"
                            size={160}
                          />
                        </MotionDiv>
                      </div>
                    </MotionDiv>

                    {/* 시스템 정보 - 개선된 카드 디자인 */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <MotionDiv
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="group"
                      >
                        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl">
                          {/* 배경 그라데이션 효과 */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-50" />
                          
                          <div className="relative">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                <ServerIcon className="h-5 w-5" />
                              </div>
                              <h4 className="text-lg font-bold text-gray-800">
                                시스템 정보
                              </h4>
                            </div>
                            <div className="space-y-4">
                              {[
                                { label: '운영체제', value: safeServer.os || 'Ubuntu 22.04', icon: '🐧' },
                                { label: 'IP 주소', value: safeServer.ip || '192.168.1.100', icon: '🌐' },
                                { label: '업타임', value: safeServer.uptime, icon: '⏱️' },
                                { label: '마지막 업데이트', value: '방금 전', icon: '🔄' }
                              ].map((item, idx) => (
                                <MotionDiv
                                  key={idx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.3 + idx * 0.05 }}
                                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="text-gray-600 font-medium">{item.label}</span>
                                  </div>
                                  <span className={`font-semibold ${item.label === 'IP 주소' ? 'font-mono text-sm bg-gray-100 px-2 py-1 rounded' : 'text-gray-800'}`}>
                                    {item.value}
                                  </span>
                                </MotionDiv>
                              ))}
                            </div>
                          </div>
                        </div>
                      </MotionDiv>

                      <MotionDiv
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="group"
                      >
                        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl">
                          {/* 배경 그라데이션 효과 */}
                          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-50" />
                          
                          <div className="relative">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                                <Activity className="h-5 w-5" />
                              </div>
                              <h4 className="text-lg font-bold text-gray-800">
                                서비스 상태
                              </h4>
                            </div>
                            <div className="space-y-3">
                              {safeServer.services && safeServer.services.length > 0 ? (
                                safeServer.services.map((service, index) => (
                                  <MotionDiv
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.35 + index * 0.05 }}
                                    whileHover={{ x: 4 }}
                                    className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-transparent hover:from-gray-100 transition-all"
                                  >
                                    <div className="flex items-center gap-3">
                                      <MotionDiv
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className={`h-3 w-3 rounded-full shadow-sm ${
                                          service.status === 'running'
                                            ? 'bg-green-500 shadow-green-200'
                                            : service.status === 'stopped'
                                              ? 'bg-red-500 shadow-red-200'
                                              : 'bg-amber-500 shadow-amber-200'
                                        }`}
                                      />
                                      <span className="font-semibold text-gray-700">
                                        {service.name}
                                      </span>
                                    </div>
                                    <span
                                      className={`rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${
                                        service.status === 'running'
                                          ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
                                          : service.status === 'stopped'
                                            ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                                            : 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800'
                                      }`}
                                    >
                                      {service.status === 'running'
                                        ? '✅ 실행중'
                                        : service.status === 'stopped'
                                          ? '🛑 중지됨'
                                          : '⏸️ 대기중'}
                                    </span>
                                  </MotionDiv>
                                ))
                              ) : (
                                <div className="py-8 text-center">
                                  <div className="text-4xl mb-2">📭</div>
                                  <div className="text-gray-500 font-medium">서비스 정보가 없습니다</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </MotionDiv>
                    </div>
                  </div>
                )}

                {selectedTab === 'metrics' && (
                  <div className="space-y-6">
                    <MotionDiv
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                          실시간 메트릭 모니터링
                        </h3>
                        <MotionButton
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIsRealtime(!isRealtime)}
                          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold shadow-lg transition-all ${
                            isRealtime
                              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                          }`}
                        >
                          {isRealtime ? (
                            <>
                              <Pause className="h-4 w-4" />
                              일시정지
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              시작하기
                            </>
                          )}
                        </MotionButton>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { data: realtimeData.cpu, color: '#3b82f6', label: 'CPU 사용률', icon: '🔥', gradient: 'from-blue-500 to-blue-600' },
                          { data: realtimeData.memory, color: '#8b5cf6', label: '메모리 사용률', icon: '💾', gradient: 'from-purple-500 to-purple-600' },
                          { data: realtimeData.disk, color: '#06b6d4', label: '디스크 사용률', icon: '💿', gradient: 'from-cyan-500 to-cyan-600' },
                          { 
                            data: realtimeData.network.map((n) =>
                              Math.min(100, Math.max(0, typeof n === 'number' ? n : (n.in + n.out) / 2))
                            ), 
                            color: '#10b981', 
                            label: '네트워크 사용률', 
                            icon: '🌐', 
                            gradient: 'from-emerald-500 to-emerald-600' 
                          }
                        ].map((chart, idx) => (
                          <MotionDiv
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + idx * 0.1 }}
                            whileHover={{ y: -4 }}
                            className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl hover:shadow-2xl transition-all"
                          >
                            <div className={`absolute inset-0 bg-gradient-to-br ${chart.gradient} opacity-5`} />
                            <div className="relative">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">{chart.icon}</span>
                                  <h4 className="font-bold text-gray-800">{chart.label}</h4>
                                </div>
                                <div className={`text-2xl font-bold bg-gradient-to-r ${chart.gradient} bg-clip-text text-transparent`}>
                                  {chart.data[chart.data.length - 1]?.toFixed(1) || '0'}%
                                </div>
                              </div>
                              <RealtimeChart
                                data={chart.data}
                                color={chart.color}
                                label=""
                              />
                            </div>
                          </MotionDiv>
                        ))}
                      </div>
                    </MotionDiv>
                  </div>
                )}

                {selectedTab === 'processes' && (
                  <div className="space-y-6">
                    <MotionDiv
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                          실행 중인 프로세스
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">총 프로세스:</span>
                          <span className="font-bold text-gray-800">{realtimeData.processes.length}</span>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
                          <div className="grid grid-cols-4 gap-4 text-white font-semibold">
                            <div>프로세스 이름</div>
                            <div>PID</div>
                            <div>CPU 사용률</div>
                            <div>메모리 사용률</div>
                          </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {realtimeData.processes.map((process, idx) => (
                            <MotionDiv
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              whileHover={{ backgroundColor: '#f9fafb' }}
                              className="grid grid-cols-4 gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                              <div className="font-semibold text-gray-800 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                {process.name}
                              </div>
                              <div className="text-gray-600 font-mono text-sm">
                                #{process.pid}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all ${
                                      process.cpu > 80 ? 'bg-red-500' : 
                                      process.cpu > 50 ? 'bg-yellow-500' : 
                                      'bg-blue-500'
                                    }`}
                                    style={{ width: `${process.cpu}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-gray-700">
                                  {process.cpu.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all ${
                                      process.memory > 80 ? 'bg-red-500' : 
                                      process.memory > 50 ? 'bg-yellow-500' : 
                                      'bg-purple-500'
                                    }`}
                                    style={{ width: `${process.memory}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-gray-700">
                                  {process.memory.toFixed(1)}%
                                </span>
                              </div>
                            </MotionDiv>
                          ))}
                        </div>
                      </div>
                    </MotionDiv>
                  </div>
                )}

                {selectedTab === 'logs' && (
                  <div className="space-y-6">
                    <MotionDiv
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                          실시간 로그 스트림
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span className="text-xs text-gray-600">정보</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-yellow-500" />
                            <span className="text-xs text-gray-600">경고</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            <span className="text-xs text-gray-600">오류</span>
                          </div>
                        </div>
                      </div>
                      <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
                        <div className="relative h-[500px] overflow-y-auto p-6 font-mono text-sm">
                          {realtimeData.logs.map((log, idx) => (
                            <MotionDiv
                              key={idx}
                              initial={{ opacity: 0, x: -30 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.02 }}
                              className={`mb-3 flex items-start gap-3 p-3 rounded-lg backdrop-blur-sm ${
                                log.level === 'error'
                                  ? 'bg-red-500/10 border-l-4 border-red-500'
                                  : log.level === 'warn'
                                    ? 'bg-yellow-500/10 border-l-4 border-yellow-500'
                                    : 'bg-green-500/10 border-l-4 border-green-500'
                              }`}
                            >
                              <div className="flex-shrink-0">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                  log.level === 'error'
                                    ? 'bg-red-500 text-white'
                                    : log.level === 'warn'
                                      ? 'bg-yellow-500 text-white'
                                      : 'bg-green-500 text-white'
                                }`}>
                                  {log.level.toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="text-gray-400 text-xs">
                                    {(() => {
                                      try {
                                        const date = new Date(log.timestamp);
                                        return isNaN(date.getTime())
                                          ? new Date().toLocaleTimeString()
                                          : date.toLocaleTimeString();
                                      } catch {
                                        return new Date().toLocaleTimeString();
                                      }
                                    })()}
                                  </span>
                                  <span className="text-blue-400 text-xs font-semibold">
                                    [{log.source}]
                                  </span>
                                </div>
                                <div className={`${
                                  log.level === 'error'
                                    ? 'text-red-300'
                                    : log.level === 'warn'
                                      ? 'text-yellow-300'
                                      : 'text-green-300'
                                }`}>
                                  {log.message}
                                </div>
                              </div>
                            </MotionDiv>
                          ))}
                        </div>
                      </div>
                    </MotionDiv>
                  </div>
                )}

                {selectedTab === 'network' && (
                  <div className="space-y-6">
                    <MotionDiv
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-transparent">
                          🌐 네트워크 실시간 모니터링
                        </h3>
                        <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-full">
                          <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium text-emerald-700">실시간 업데이트</span>
                        </div>
                      </div>
                    </MotionDiv>

                    {/* 네트워크 상태 카드 - 현대적 디자인 */}
                    <MotionDiv
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="grid grid-cols-1 gap-6 md:grid-cols-3"
                    >
                      {/* 네트워크 상태 카드 */}
                      <MotionDiv
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 shadow-xl"
                      >
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-white">네트워크 상태</h4>
                            <span className="text-2xl">🌍</span>
                          </div>
                          <div className="flex items-center gap-3 mb-4">
                            <MotionDiv
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [1, 0.8, 1]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut'
                              }}
                              className={`h-4 w-4 rounded-full ${
                                safeServer.networkStatus === 'excellent'
                                  ? 'bg-green-400 shadow-green-400/50'
                                  : safeServer.networkStatus === 'good'
                                    ? 'bg-yellow-400 shadow-yellow-400/50'
                                    : safeServer.networkStatus === 'poor'
                                      ? 'bg-red-400 shadow-red-400/50'
                                      : safeServer.networkStatus === 'offline'
                                        ? 'bg-blue-400 shadow-blue-400/50'
                                        : 'bg-gray-400 shadow-gray-400/50'
                              } shadow-lg`}
                            />
                            <span className="text-xl font-bold text-white">
                              {safeServer.networkStatus === 'excellent'
                                ? '최상'
                                : safeServer.networkStatus === 'good'
                                  ? '양호'
                                  : safeServer.networkStatus === 'poor'
                                    ? '부족'
                                    : safeServer.networkStatus === 'offline'
                                      ? '오프라인'
                                      : '알수없음'}
                            </span>
                          </div>
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                            <div className="text-xs text-white/80 mb-1">네트워크 속도</div>
                            <div className="text-2xl font-bold text-white">
                              {safeServer.specs?.network_speed || '1 Gbps'}
                            </div>
                          </div>
                        </div>
                      </MotionDiv>

                      {/* 현재 트래픽 카드 */}
                      <MotionDiv
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 shadow-xl"
                      >
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-white">실시간 트래픽</h4>
                            <span className="text-2xl">📊</span>
                          </div>
                          <div className="space-y-4">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-white/80">⬇️ 인바운드</span>
                                <MotionDiv
                                  animate={{ opacity: [1, 0.7, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                  className="text-xl font-bold text-green-300"
                                >
                                  {realtimeData.network[
                                    realtimeData.network.length - 1
                                  ]?.in.toFixed(1) || '0'} MB/s
                                </MotionDiv>
                              </div>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-white/80">⬆️ 아웃바운드</span>
                                <MotionDiv
                                  animate={{ opacity: [1, 0.7, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                                  className="text-xl font-bold text-cyan-300"
                                >
                                  {realtimeData.network[
                                    realtimeData.network.length - 1
                                  ]?.out.toFixed(1) || '0'} MB/s
                                </MotionDiv>
                              </div>
                            </div>
                          </div>
                        </div>
                      </MotionDiv>

                      {/* 지연시간 카드 */}
                      <MotionDiv
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-6 shadow-xl"
                      >
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-bold text-white">응답 시간</h4>
                            <span className="text-2xl">⚡</span>
                          </div>
                          <MotionDiv
                            animate={{
                              scale: [1, 1.05, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut'
                            }}
                            className="text-4xl font-bold text-white mb-2"
                          >
                            {realtimeData.latency[
                              realtimeData.latency.length - 1
                            ]?.toFixed(1) || '0'} ms
                          </MotionDiv>
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                            <div className="text-sm text-white/80">평균 지연시간</div>
                            <div className="text-xs text-white/60 mt-1">최적 상태 &lt; 50ms</div>
                          </div>
                        </div>
                      </MotionDiv>
                    </MotionDiv>

                    {/* 네트워크 트래픽 차트 - 현대적 디자인 */}
                    <MotionDiv
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="grid grid-cols-1 gap-6 md:grid-cols-2"
                    >
                      <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            네트워크 트래픽 흐름
                          </h4>
                          <span className="text-xl">📈</span>
                        </div>
                        <div className="relative h-40 bg-white rounded-xl p-2">
                          <svg
                            className="h-full w-full"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                          >
                            <defs>
                              <linearGradient
                                id="network-in-gradient-modern"
                                x1="0%"
                                y1="0%"
                                x2="0%"
                                y2="100%"
                              >
                                <stop
                                  offset="0%"
                                  stopColor="#10b981"
                                  stopOpacity="0.5"
                                />
                                <stop
                                  offset="100%"
                                  stopColor="#10b981"
                                  stopOpacity="0.05"
                                />
                              </linearGradient>
                              <linearGradient
                                id="network-out-gradient-modern"
                                x1="0%"
                                y1="0%"
                                x2="0%"
                                y2="100%"
                              >
                                <stop
                                  offset="0%"
                                  stopColor="#3b82f6"
                                  stopOpacity="0.5"
                                />
                                <stop
                                  offset="100%"
                                  stopColor="#3b82f6"
                                  stopOpacity="0.05"
                                />
                              </linearGradient>
                            </defs>

                            {/* 그리드 라인 */}
                            {[20, 40, 60, 80].map((y) => (
                              <line
                                key={y}
                                x1="0"
                                y1={y}
                                x2="100"
                                y2={y}
                                stroke="#e5e7eb"
                                strokeWidth="0.5"
                                strokeDasharray="2,2"
                              />
                            ))}

                            {/* 인바운드 영역 */}
                            <path
                              d={`M0,100 ${realtimeData.network
                                .map((data, index) => {
                                  const x = (index / Math.max(realtimeData.network.length - 1, 1)) * 100;
                                  const y = 100 - Math.max(0, Math.min(100, (data.in / 600) * 100));
                                  return `L${x},${y}`;
                                })
                                .join(' ')} L100,100 Z`}
                              fill="url(#network-in-gradient-modern)"
                            />

                            {/* 인바운드 라인 */}
                            <polyline
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="3"
                              points={realtimeData.network
                                .map((data, index) => {
                                  const x = (index / Math.max(realtimeData.network.length - 1, 1)) * 100;
                                  const y = 100 - Math.max(0, Math.min(100, (data.in / 600) * 100));
                                  return `${x},${y}`;
                                })
                                .join(' ')}
                              vectorEffect="non-scaling-stroke"
                            />

                            {/* 아웃바운드 영역 */}
                            <path
                              d={`M0,100 ${realtimeData.network
                                .map((data, index) => {
                                  const x = (index / Math.max(realtimeData.network.length - 1, 1)) * 100;
                                  const y = 100 - Math.max(0, Math.min(100, (data.out / 400) * 100));
                                  return `L${x},${y}`;
                                })
                                .join(' ')} L100,100 Z`}
                              fill="url(#network-out-gradient-modern)"
                            />

                            {/* 아웃바운드 라인 */}
                            <polyline
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="3"
                              points={realtimeData.network
                                .map((data, index) => {
                                  const x = (index / Math.max(realtimeData.network.length - 1, 1)) * 100;
                                  const y = 100 - Math.max(0, Math.min(100, (data.out / 400) * 100));
                                  return `${x},${y}`;
                                })
                                .join(' ')}
                              vectorEffect="non-scaling-stroke"
                            />
                          </svg>

                          {/* 범례 */}
                          <div className="absolute right-3 top-3 flex gap-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
                            <div className="flex items-center gap-1">
                              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                              <span className="text-xs font-medium">인바운드</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                              <span className="text-xs font-medium">아웃바운드</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <RealtimeChart
                        data={realtimeData.latency}
                        color="#8b5cf6"
                        label="네트워크 지연시간 (ms)"
                      />
                    </MotionDiv>

                    {/* 네트워크 연결 정보 - 현대적 디자인 */}
                    <MotionDiv
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="rounded-2xl bg-gradient-to-br from-slate-50 to-gray-100 p-6 shadow-xl hover:shadow-2xl transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-xl font-bold bg-gradient-to-r from-slate-700 to-gray-900 bg-clip-text text-transparent">
                          🔗 네트워크 연결 상세 정보
                        </h4>
                        <div className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full">
                          <span className="text-xs font-medium text-green-700">연결됨</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* 왼쪽 컬럼 */}
                        <div className="space-y-4">
                          <MotionDiv
                            whileHover={{ x: 5 }}
                            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <span className="flex items-center gap-2 text-sm text-gray-600">
                              <span>🌐</span> IP 주소
                            </span>
                            <span className="font-mono font-bold text-gray-900">{safeServer.ip}</span>
                          </MotionDiv>
                          <MotionDiv
                            whileHover={{ x: 5 }}
                            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <span className="flex items-center gap-2 text-sm text-gray-600">
                              <span>💻</span> 호스트명
                            </span>
                            <span className="font-medium text-gray-900">{safeServer.hostname}</span>
                          </MotionDiv>
                          <MotionDiv
                            whileHover={{ x: 5 }}
                            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <span className="flex items-center gap-2 text-sm text-gray-600">
                              <span>📍</span> 위치
                            </span>
                            <span className="font-medium text-gray-900">{safeServer.location}</span>
                          </MotionDiv>
                        </div>
                        {/* 오른쪽 컬럼 */}
                        <div className="space-y-4">
                          <MotionDiv
                            whileHover={{ x: 5 }}
                            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <span className="flex items-center gap-2 text-sm text-gray-600">
                              <span>☁️</span> 프로바이더
                            </span>
                            <span className="font-medium text-gray-900">{safeServer.provider}</span>
                          </MotionDiv>
                          <MotionDiv
                            whileHover={{ x: 5 }}
                            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <span className="flex items-center gap-2 text-sm text-gray-600">
                              <span>🔧</span> 환경
                            </span>
                            <span className="font-medium text-gray-900 capitalize">{safeServer.environment}</span>
                          </MotionDiv>
                          <MotionDiv
                            whileHover={{ x: 5 }}
                            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                          >
                            <span className="flex items-center gap-2 text-sm text-gray-600">
                              <span>🖥️</span> 서버 타입
                            </span>
                            <span className="font-medium text-gray-900 capitalize">{safeServer.type}</span>
                          </MotionDiv>
                        </div>
                      </div>
                    </MotionDiv>
                  </div>
                )}
              </MotionDiv>
            </AnimatePresence>
          </div>

          {/* 하단 버튼 영역 */}
          <div className="border-t border-gray-200 bg-white px-6 py-4">
            <div className="flex justify-end gap-3">
              <MotionButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
                닫기
              </MotionButton>
            </div>
          </div>
        </MotionDiv>
      </MotionDiv>
    </AnimatePresence>
  );
}
