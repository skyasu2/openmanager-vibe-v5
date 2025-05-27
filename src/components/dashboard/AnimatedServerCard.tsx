/**
 * 🎨 Animated Server Card
 * 
 * 순차적으로 등장하는 서버 카드 애니메이션
 * - 부드러운 등장 효과
 * - 서버 타입별 색상 구분
 * - 실시간 메트릭 표시
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Server, Database, Cloud, Shield, BarChart3, GitBranch, Mail, Layers, Cpu, HardDrive, Activity } from 'lucide-react';

interface AnimatedServerCardProps {
  server: {
    id: string;
    hostname: string;
    name: string;
    type: string;
    environment: string;
    location: string;
    provider: string;
    status: 'online' | 'warning' | 'offline';
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
  delay?: number;
}

const AnimatedServerCard: React.FC<AnimatedServerCardProps> = ({ 
  server, 
  index,
  delay = 0
}) => {
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
  
  // 서버 타입별 색상
  const getTypeColor = () => {
    const type = server.type.toLowerCase();
    
    if (type.includes('web')) return 'from-blue-500 to-blue-600';
    if (type.includes('database')) return 'from-purple-500 to-purple-600';
    if (type.includes('kubernetes')) return 'from-cyan-500 to-cyan-600';
    if (type.includes('api')) return 'from-green-500 to-green-600';
    if (type.includes('analytics')) return 'from-orange-500 to-orange-600';
    if (type.includes('monitoring')) return 'from-yellow-500 to-yellow-600';
    if (type.includes('security')) return 'from-red-500 to-red-600';
    if (type.includes('mail')) return 'from-pink-500 to-pink-600';
    if (type.includes('ci_cd')) return 'from-indigo-500 to-indigo-600';
    
    return 'from-gray-500 to-gray-600';
  };
  
  // 상태별 색상
  const getStatusColor = () => {
    switch (server.status) {
      case 'online': return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'warning': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'offline': return 'text-red-400 bg-red-400/20 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };
  
  // 메트릭별 색상
  const getMetricColor = (value: number, type: 'cpu' | 'memory' | 'disk') => {
    if (type === 'disk') {
      if (value > 90) return 'text-red-400';
      if (value > 75) return 'text-yellow-400';
      return 'text-green-400';
    } else {
      if (value > 85) return 'text-red-400';
      if (value > 70) return 'text-yellow-400';
      return 'text-green-400';
    }
  };
  
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: 50, 
        scale: 0.8,
        rotateX: -15 
      }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        rotateX: 0 
      }}
      transition={{ 
        duration: 0.8,
        delay: delay + (index * 0.1),
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ 
        y: -5,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className="relative group"
    >
      {/* 등장 효과 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ 
          delay: delay + (index * 0.1) + 0.3,
          duration: 0.6,
          times: [0, 0.6, 1]
        }}
        className="absolute -inset-1 bg-gradient-to-r opacity-20 rounded-lg blur-lg group-hover:opacity-30 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
        }}
      />
      
      <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-all duration-300">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ 
                delay: delay + (index * 0.1) + 0.5,
                duration: 0.6,
                type: "spring",
                stiffness: 200
              }}
              className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getTypeColor()} flex items-center justify-center text-white shadow-lg`}
            >
              {getServerIcon()}
            </motion.div>
            
            <div>
              <motion.h3
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + (index * 0.1) + 0.6 }}
                className="text-lg font-semibold text-white"
              >
                {server.hostname}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + (index * 0.1) + 0.7 }}
                className="text-gray-400 text-sm"
              >
                {server.name}
              </motion.p>
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + (index * 0.1) + 0.8 }}
            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}
          >
            {server.status.toUpperCase()}
          </motion.div>
        </div>
        
        {/* 메트릭 */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + (index * 0.1) + 0.9 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-1">
              <Cpu className="w-4 h-4 text-blue-400 mr-1" />
              <span className="text-xs text-gray-400">CPU</span>
            </div>
            <div className={`text-lg font-bold ${getMetricColor(server.cpu, 'cpu')}`}>
              {server.cpu}%
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + (index * 0.1) + 1.0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-1">
              <Activity className="w-4 h-4 text-purple-400 mr-1" />
              <span className="text-xs text-gray-400">RAM</span>
            </div>
            <div className={`text-lg font-bold ${getMetricColor(server.memory, 'memory')}`}>
              {server.memory}%
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + (index * 0.1) + 1.1 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-1">
              <HardDrive className="w-4 h-4 text-green-400 mr-1" />
              <span className="text-xs text-gray-400">DISK</span>
            </div>
            <div className={`text-lg font-bold ${getMetricColor(server.disk, 'disk')}`}>
              {server.disk}%
            </div>
          </motion.div>
        </div>
        
        {/* 추가 정보 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + (index * 0.1) + 1.2 }}
          className="space-y-2 text-sm"
        >
          <div className="flex justify-between text-gray-400">
            <span>위치:</span>
            <span className="text-white">{server.location}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>제공자:</span>
            <span className="text-white uppercase">{server.provider}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>가동시간:</span>
            <span className="text-white">{server.uptime}</span>
          </div>
          {server.ip && (
            <div className="flex justify-between text-gray-400">
              <span>IP:</span>
              <span className="text-white font-mono">{server.ip}</span>
            </div>
          )}
        </motion.div>
        
        {/* 서비스 상태 */}
        {server.services && server.services.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + (index * 0.1) + 1.3 }}
            className="mt-4 pt-4 border-t border-gray-700"
          >
            <div className="text-xs text-gray-400 mb-2">서비스 ({server.services.length}개)</div>
            <div className="flex flex-wrap gap-1">
              {server.services.slice(0, 3).map((service, idx) => (
                <motion.span
                  key={service.name}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: delay + (index * 0.1) + 1.4 + (idx * 0.1) }}
                  className={`px-2 py-1 rounded text-xs ${
                    service.status === 'running'
                      ? 'bg-green-400/20 text-green-400 border border-green-400/30'
                      : 'bg-gray-400/20 text-gray-400 border border-gray-400/30'
                  }`}
                >
                  {service.name}
                </motion.span>
              ))}
              {server.services.length > 3 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: delay + (index * 0.1) + 1.7 }}
                  className="px-2 py-1 rounded text-xs bg-gray-600/20 text-gray-400 border border-gray-600/30"
                >
                  +{server.services.length - 3}
                </motion.span>
              )}
            </div>
          </motion.div>
        )}
        
        {/* 알림 배지 */}
        {server.alerts > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              delay: delay + (index * 0.1) + 1.5,
              type: "spring",
              stiffness: 500,
              damping: 20
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
          >
            {server.alerts}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default AnimatedServerCard; 