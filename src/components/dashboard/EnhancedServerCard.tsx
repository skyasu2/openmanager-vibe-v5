/**
 * 🌟 Enhanced Server Card v3.0
 * 
 * 고도화된 서버 카드 컴포넌트:
 * - 실시간 미니 차트 (CPU, Memory, Disk)
 * - 그라데이션 및 글래스모피즘 디자인
 * - 부드러운 애니메이션 및 호버 효과
 * - 상태별 색상 테마
 * - 실시간 활동 인디케이터
 */

import React, { memo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, Database, Cloud, Shield, BarChart3, GitBranch, 
  Mail, Layers, Cpu, HardDrive, Activity, Wifi, 
  Eye, Settings, Play, Square, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { Server as ServerType } from '../../types/server';

interface EnhancedServerCardProps {
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
    uptime: string;
    lastUpdate: Date;
    alerts: number;
    services: Array<{name: string; status: 'running' | 'stopped'; port: number}>;
    specs?: {
      cpu_cores: number;
      memory_gb: number;
      disk_gb: number;
    };
    os?: string;
    ip?: string;
  };
  index: number;
  onClick?: (server: any) => void;
  showMiniCharts?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

const EnhancedServerCard: React.FC<EnhancedServerCardProps> = memo(({ 
  server, 
  index,
  onClick,
  showMiniCharts = true,
  variant = 'default'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [realtimeData, setRealtimeData] = useState<{
    cpu: number[];
    memory: number[];
    disk: number[];
    trend: 'up' | 'down' | 'stable';
  }>({
    cpu: Array.from({length: 10}, () => Math.random() * 30 + server.cpu - 15),
    memory: Array.from({length: 10}, () => Math.random() * 20 + server.memory - 10),
    disk: Array.from({length: 10}, () => Math.random() * 10 + server.disk - 5),
    trend: 'stable'
  });

  // 실시간 데이터 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeData(prev => ({
        cpu: [...prev.cpu.slice(1), Math.max(0, Math.min(100, server.cpu + (Math.random() - 0.5) * 20))],
        memory: [...prev.memory.slice(1), Math.max(0, Math.min(100, server.memory + (Math.random() - 0.5) * 15))],
        disk: [...prev.disk.slice(1), Math.max(0, Math.min(100, server.disk + (Math.random() - 0.5) * 5))],
        trend: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'up' : 'down') : 'stable'
      }));
    }, 2000 + index * 100); // 카드별로 약간씩 다른 업데이트 주기

    return () => clearInterval(interval);
  }, [server.cpu, server.memory, server.disk, index]);

  // 서버 타입별 아이콘
  const getServerIcon = () => {
    const type = server.type.toLowerCase();
    
    if (type.includes('web')) return <Server className="w-5 h-5" />;
    if (type.includes('database')) return <Database className="w-5 h-5" />;
    if (type.includes('kubernetes')) return <Layers className="w-5 h-5" />;
    if (type.includes('api')) return <GitBranch className="w-5 h-5" />;
    if (type.includes('analytics')) return <BarChart3 className="w-5 h-5" />;
    if (type.includes('monitoring')) return <BarChart3 className="w-5 h-5" />;
    if (type.includes('security')) return <Shield className="w-5 h-5" />;
    if (type.includes('mail')) return <Mail className="w-5 h-5" />;
    if (type.includes('ci_cd')) return <GitBranch className="w-5 h-5" />;
    
    return <Cloud className="w-5 h-5" />;
  };
  
  // 상태별 색상 테마
  const getStatusTheme = () => {
    switch (server.status) {
      case 'healthy':
        return {
          gradient: 'from-green-50 via-emerald-50 to-teal-50',
          border: 'border-green-200',
          hoverBorder: 'hover:border-green-300',
          glow: 'hover:shadow-green-100',
          statusBg: 'bg-green-100',
          statusText: 'text-green-700',
          statusIcon: '🟢',
          label: '정상',
          accent: 'text-green-600'
        };
      case 'warning':
        return {
          gradient: 'from-yellow-50 via-orange-50 to-amber-50',
          border: 'border-yellow-200',
          hoverBorder: 'hover:border-yellow-300',
          glow: 'hover:shadow-yellow-100',
          statusBg: 'bg-yellow-100',
          statusText: 'text-yellow-700',
          statusIcon: '🟡',
          label: '경고',
          accent: 'text-yellow-600'
        };
      case 'critical':
        return {
          gradient: 'from-red-50 via-rose-50 to-pink-50',
          border: 'border-red-200',
          hoverBorder: 'hover:border-red-300',
          glow: 'hover:shadow-red-100',
          statusBg: 'bg-red-100',
          statusText: 'text-red-700',
          statusIcon: '🔴',
          label: '심각',
          accent: 'text-red-600'
        };
      default:
        return {
          gradient: 'from-gray-50 via-slate-50 to-gray-50',
          border: 'border-gray-200',
          hoverBorder: 'hover:border-gray-300',
          glow: 'hover:shadow-gray-100',
          statusBg: 'bg-gray-100',
          statusText: 'text-gray-700',
          statusIcon: '⚪',
          label: '오프라인',
          accent: 'text-gray-600'
        };
    }
  };

  const theme = getStatusTheme();

  // 미니 차트 생성
  const MiniChart = ({ data, color, label }: { data: number[]; color: string; label: string }) => {
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - value;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="flex flex-col items-center">
        <div className="text-xs font-medium text-gray-600 mb-1">{label}</div>
        <div className="w-16 h-8 relative">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`gradient-${server.id}-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                <stop offset="100%" stopColor={color} stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="2"
              points={points}
              vectorEffect="non-scaling-stroke"
            />
            <polygon
              fill={`url(#gradient-${server.id}-${label})`}
              points={`0,100 ${points} 100,100`}
            />
          </svg>
        </div>
        <div className="text-xs font-bold" style={{ color }}>
          {data[data.length - 1]?.toFixed(0)}%
        </div>
      </div>
    );
  };

  // 트렌드 아이콘
  const getTrendIcon = () => {
    switch (realtimeData.trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-red-500" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-green-500" />;
      default: return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  const handleCardClick = useCallback(() => {
    if (onClick) {
      onClick(server);
    }
  }, [onClick, server]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className={`
        relative p-6 rounded-xl cursor-pointer
        bg-gradient-to-br ${theme.gradient}
        border-2 ${theme.border} ${theme.hoverBorder}
        shadow-lg ${theme.glow} hover:shadow-xl
        transition-all duration-300 ease-out
        backdrop-blur-sm
        group
      `}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 실시간 활동 인디케이터 */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-2 h-2 bg-green-400 rounded-full"
        />
        {getTrendIcon()}
      </div>

      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div 
            className={`p-2 rounded-lg ${theme.statusBg} ${theme.accent}`}
            whileHover={{ rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            {getServerIcon()}
          </motion.div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg group-hover:text-gray-700 transition-colors">
              {server.name}
            </h3>
            <p className="text-sm text-gray-600">
              {server.type} • {server.location}
            </p>
          </div>
        </div>

        <motion.div 
          className={`px-3 py-1 rounded-full ${theme.statusBg} flex items-center gap-1`}
          whileHover={{ scale: 1.05 }}
        >
          <span>{theme.statusIcon}</span>
          <span className={`text-xs font-semibold ${theme.statusText}`}>
            {theme.label}
          </span>
        </motion.div>
      </div>

      {/* 메트릭 및 미니 차트 */}
      <div className="space-y-4">
        {showMiniCharts && (
          <div className="flex justify-between items-center bg-white/50 rounded-lg p-3 backdrop-blur-sm">
            <MiniChart data={realtimeData.cpu} color="#ef4444" label="CPU" />
            <MiniChart data={realtimeData.memory} color="#3b82f6" label="메모리" />
            <MiniChart data={realtimeData.disk} color="#8b5cf6" label="디스크" />
          </div>
        )}

        {/* 주요 메트릭 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-xs text-gray-600">CPU</div>
            <div className="text-lg font-bold text-red-600">{server.cpu}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600">메모리</div>
            <div className="text-lg font-bold text-blue-600">{server.memory}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600">디스크</div>
            <div className="text-lg font-bold text-purple-600">{server.disk}%</div>
          </div>
        </div>

        {/* 서비스 상태 */}
        <div className="flex gap-2 flex-wrap">
          {server.services.slice(0, 3).map((service, idx) => (
            <motion.div
              key={idx}
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                service.status === 'running'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${
                service.status === 'running' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {service.name}
            </motion.div>
          ))}
          {server.services.length > 3 && (
            <div className="px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded">
              +{server.services.length - 3}개 더
            </div>
          )}
        </div>

        {/* 알림 */}
        {server.alerts > 0 && (
          <motion.div 
            className="flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-lg text-sm"
            whileHover={{ scale: 1.02 }}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{server.alerts}개의 알림</span>
          </motion.div>
        )}
      </div>

      {/* 호버 액션 버튼들 */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 right-4 flex gap-2"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 bg-white/80 hover:bg-white rounded-lg shadow-lg backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
            >
              <Eye className="w-4 h-4 text-gray-600" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 bg-white/80 hover:bg-white rounded-lg shadow-lg backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <Settings className="w-4 h-4 text-gray-600" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

EnhancedServerCard.displayName = 'EnhancedServerCard';

export default EnhancedServerCard; 