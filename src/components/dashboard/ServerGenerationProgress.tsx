/**
 * 🚀 Server Generation Progress Component
 * 
 * 순차 서버 생성 진행률 및 상태 표시
 * - 현실적인 서버 배포 과정 시뮬레이션
 * - 부드러운 애니메이션과 진행률 표시
 * - 사용자 몰입도 향상을 위한 UX
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Cpu, Database, Cloud, Shield, BarChart3, GitBranch, Mail, Layers } from 'lucide-react';

interface ServerGenerationProgressProps {
  currentCount: number;
  totalServers: number;
  progress: number;
  isGenerating: boolean;
  isComplete: boolean;
  nextServerType: string | null;
  currentMessage: string;
  error: string | null;
  lastGeneratedServer: any | null;
}

const ServerGenerationProgress: React.FC<ServerGenerationProgressProps> = ({
  currentCount,
  totalServers,
  progress,
  isGenerating,
  isComplete,
  nextServerType,
  currentMessage,
  error,
  lastGeneratedServer
}) => {
  // 서버 타입별 아이콘 매핑
  const getServerIcon = (serverType: string) => {
    const type = serverType?.toLowerCase() || '';
    
    if (type.includes('web')) return <Server className="w-4 h-4" />;
    if (type.includes('database')) return <Database className="w-4 h-4" />;
    if (type.includes('kubernetes')) return <Layers className="w-4 h-4" />;
    if (type.includes('api')) return <GitBranch className="w-4 h-4" />;
    if (type.includes('analytics')) return <BarChart3 className="w-4 h-4" />;
    if (type.includes('monitoring')) return <BarChart3 className="w-4 h-4" />;
    if (type.includes('security')) return <Shield className="w-4 h-4" />;
    if (type.includes('mail')) return <Mail className="w-4 h-4" />;
    if (type.includes('ci/cd')) return <GitBranch className="w-4 h-4" />;
    
    return <Cloud className="w-4 h-4" />;
  };
  
  // 서버 타입별 색상 매핑
  const getServerColor = (serverType: string) => {
    const type = serverType?.toLowerCase() || '';
    
    if (type.includes('web')) return 'text-blue-400';
    if (type.includes('database')) return 'text-purple-400';
    if (type.includes('kubernetes')) return 'text-cyan-400';
    if (type.includes('api')) return 'text-green-400';
    if (type.includes('analytics')) return 'text-orange-400';
    if (type.includes('monitoring')) return 'text-yellow-400';
    if (type.includes('security')) return 'text-red-400';
    if (type.includes('mail')) return 'text-pink-400';
    if (type.includes('ci/cd')) return 'text-indigo-400';
    
    return 'text-gray-400';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6 mb-6"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <motion.div
              animate={isGenerating ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: isGenerating ? Infinity : 0, ease: "linear" }}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                isComplete 
                  ? 'border-green-500 bg-green-500/20' 
                  : error 
                    ? 'border-red-500 bg-red-500/20'
                    : 'border-blue-500 bg-blue-500/20'
              }`}
            >
              {isComplete ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-green-400"
                >
                  ✓
                </motion.div>
              ) : error ? (
                <div className="text-red-400">✗</div>
              ) : (
                <Cloud className="w-4 h-4 text-blue-400" />
              )}
            </motion.div>
            
            {isGenerating && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2 border-blue-400/30"
              />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white">
              인프라 배포 진행률
            </h3>
            <p className="text-gray-400 text-sm">
              {currentCount}/{totalServers} 서버 배포됨
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {progress}%
          </div>
          <div className="text-xs text-gray-400">
            완료율
          </div>
        </div>
      </div>
      
      {/* 진행률 바 */}
      <div className="mb-4">
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              className="absolute inset-0 bg-white/20 rounded-full"
              animate={{ x: [-100, 100] }}
              transition={{ 
                duration: 2,
                repeat: isGenerating ? Infinity : 0,
                ease: "linear" 
              }}
            />
          </motion.div>
        </div>
        
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>시작</span>
          <span>{currentCount > 0 && currentCount < totalServers ? `${currentCount}개 배포됨` : ''}</span>
          <span>완료</span>
        </div>
      </div>
      
      {/* 현재 상태 메시지 */}
      <motion.div
        key={currentMessage}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center space-x-3 mb-4"
      >
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
          isComplete 
            ? 'bg-green-500/20 border border-green-500/30' 
            : error
              ? 'bg-red-500/20 border border-red-500/30'
              : 'bg-blue-500/20 border border-blue-500/30'
        }`}>
          {nextServerType && getServerIcon(nextServerType)}
          <span className={`text-sm font-medium ${
            isComplete 
              ? 'text-green-400' 
              : error
                ? 'text-red-400'
                : 'text-blue-400'
          }`}>
            {currentMessage}
          </span>
        </div>
        
        {isGenerating && nextServerType && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-2 text-gray-400 text-sm"
          >
            <span>다음:</span>
            <div className={`flex items-center space-x-1 ${getServerColor(nextServerType)}`}>
              {getServerIcon(nextServerType)}
              <span>{nextServerType}</span>
            </div>
          </motion.div>
        )}
      </motion.div>
      
      {/* 마지막 생성된 서버 정보 */}
      <AnimatePresence>
        {lastGeneratedServer && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 mb-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg border ${getServerColor(lastGeneratedServer.type)} border-current/30 bg-current/10 flex items-center justify-center`}>
                  {getServerIcon(lastGeneratedServer.type)}
                </div>
                
                <div>
                  <h4 className="text-white font-medium">
                    {lastGeneratedServer.hostname}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {lastGeneratedServer.name} • {lastGeneratedServer.location}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="text-green-400">
                  ✓ 배포 완료
                </div>
                <div className="text-gray-400">
                  {lastGeneratedServer.provider?.toUpperCase()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 에러 메시지 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm"
          >
            <div className="flex items-center space-x-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 완료 메시지 */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="text-4xl mb-2"
            >
              🎉
            </motion.div>
            <h4 className="text-green-400 font-medium mb-1">
              인프라 배포 완료!
            </h4>
            <p className="text-gray-400 text-sm">
              총 {totalServers}개 서버가 성공적으로 배포되었습니다
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ServerGenerationProgress; 