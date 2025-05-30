/**
 * 🚀 Dashboard Entrance Component
 * 
 * 시작 애니메이션부터 대시보드 등장까지의 전체 플로우 관리
 * - 서비스 시작 애니메이션 단계
 * - 동적 전환 애니메이션
 * - 대시보드 등장 효과
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SystemControlPanel } from '../system/SystemControlPanel';
import ServerDashboard from './ServerDashboard';
import { Server, Cpu, Database, Cloud, Shield, BarChart3, GitBranch, Layers, Zap } from 'lucide-react';

interface DashboardEntranceProps {
  onStatsUpdate: (stats: any) => void;
}

type EntrancePhase = 'service-starting' | 'system-initializing' | 'components-loading' | 'dashboard-ready';

const DashboardEntrance: React.FC<DashboardEntranceProps> = ({ onStatsUpdate }) => {
  const [currentPhase, setCurrentPhase] = useState<EntrancePhase>('service-starting');
  const [progress, setProgress] = useState(0);
  const [currentService, setCurrentService] = useState(0);
  
  // 서비스 시작 단계 정의
  const services = [
    { name: 'ProcessManager', icon: <Zap />, color: 'text-blue-400', duration: 800 },
    { name: 'SystemWatchdog', icon: <Shield />, color: 'text-green-400', duration: 600 },
    { name: 'HealthCheck System', icon: <BarChart3 />, color: 'text-orange-400', duration: 700 },
    { name: 'API Server', icon: <Server />, color: 'text-purple-400', duration: 500 },
    { name: 'Database Service', icon: <Database />, color: 'text-cyan-400', duration: 600 },
    { name: 'Monitoring Layer', icon: <Layers />, color: 'text-pink-400', duration: 500 }
  ];

  // 시작 애니메이션 시퀀스
  useEffect(() => {
    let currentServiceIndex = 0;
    let totalProgress = 0;
    
    const startServiceSequence = () => {
      if (currentServiceIndex < services.length) {
        setCurrentService(currentServiceIndex);
        
        const service = services[currentServiceIndex];
        const serviceProgress = ((currentServiceIndex + 1) / services.length) * 100;
        
        // 서비스별 진행률 애니메이션
        const progressInterval = setInterval(() => {
          totalProgress += 2;
          if (totalProgress >= serviceProgress) {
            totalProgress = serviceProgress;
            clearInterval(progressInterval);
            
            // 다음 서비스로
            setTimeout(() => {
              currentServiceIndex++;
              if (currentServiceIndex >= services.length) {
                // 모든 서비스 시작 완료
                setTimeout(() => setCurrentPhase('system-initializing'), 500);
              } else {
                startServiceSequence();
              }
            }, service.duration);
          }
          setProgress(totalProgress);
        }, 50);
      }
    };

    if (currentPhase === 'service-starting') {
      setTimeout(() => startServiceSequence(), 1000);
    }
  }, [currentPhase]);

  // 시스템 초기화 단계
  useEffect(() => {
    if (currentPhase === 'system-initializing') {
      setTimeout(() => setCurrentPhase('components-loading'), 2000);
    }
  }, [currentPhase]);

  // 컴포넌트 로딩 단계
  useEffect(() => {
    if (currentPhase === 'components-loading') {
      setTimeout(() => setCurrentPhase('dashboard-ready'), 1500);
    }
  }, [currentPhase]);

  // 서비스 시작 애니메이션
  const ServiceStartingAnimation = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        scale: 0.98,
        filter: 'brightness(1.1)'
      }}
      transition={{ 
        exit: { duration: 0.5, ease: 'easeInOut' }
      }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center relative overflow-hidden"
    >
      {/* 배경 파티클 효과 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="text-center max-w-md mx-auto px-6 relative z-10">
        {/* 로고 영역 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <motion.div 
            className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(236, 72, 153, 0.3)",
                "0 0 40px rgba(236, 72, 153, 0.6)",
                "0 0 20px rgba(236, 72, 153, 0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Server className="w-10 h-10 text-white" />
          </motion.div>
          
          {/* 개선된 타이틀 - 그라데이션 효과 */}
          <motion.h1 
            className="text-4xl font-bold mb-2 bg-gradient-to-b from-white via-gray-100 to-gray-400 bg-clip-text text-transparent"
            style={{
              textShadow: "0 0 30px rgba(255, 255, 255, 0.5), 0 0 60px rgba(255, 255, 255, 0.2)"
            }}
            animate={{
              filter: [
                "drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))",
                "drop-shadow(0 0 20px rgba(255, 255, 255, 0.6))",
                "drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            OpenManager
          </motion.h1>
          
          {/* 개선된 부제목 */}
          <motion.p 
            className="bg-gradient-to-b from-gray-100 via-gray-300 to-gray-500 bg-clip-text text-transparent font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            AI 서버 모니터링 시스템
          </motion.p>
        </motion.div>

        {/* 개선된 진행률 바 */}
        <div className="mb-8">
          <div className="w-full bg-gray-700/50 backdrop-blur-sm rounded-full h-3 overflow-hidden border border-gray-600/30">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full relative"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </motion.div>
          </div>
          <motion.div 
            className="mt-3 bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent text-sm font-semibold"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {Math.round(progress)}% 완료
          </motion.div>
        </div>

        {/* 현재 서비스 - 안정적인 애니메이션 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentService}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="flex items-center justify-center gap-3 mb-8 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10"
          >
            <div className={`${services[currentService]?.color || 'text-gray-400'}`}>
              {services[currentService]?.icon}
            </div>
            <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent font-medium">
              {services[currentService]?.name} 시작 중...
            </span>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full"
            />
          </motion.div>
        </AnimatePresence>

        {/* 서비스 리스트 - 간소화된 애니메이션 */}
        <div className="space-y-2">
          {services.map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: index <= currentService ? 1 : 0.4,
                x: 0 
              }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg backdrop-blur-sm border transition-all duration-300 ${
                index < currentService 
                  ? 'bg-green-500/10 border-green-400/30 shadow-lg shadow-green-500/10'
                  : index === currentService
                    ? 'bg-blue-500/10 border-blue-400/30 shadow-lg shadow-blue-500/10'
                    : 'bg-white/5 border-gray-600/20'
              }`}
            >
              <div className={index <= currentService ? service.color : 'text-gray-500'}>
                {service.icon}
              </div>
              <span className={`text-sm font-medium ${
                index < currentService 
                  ? 'text-green-300'
                  : index === currentService
                    ? 'text-blue-300'
                    : 'text-gray-400'
              }`}>
                {service.name}
              </span>
              {index < currentService && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="ml-auto text-green-400 text-lg"
                >
                  ✓
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  // 시스템 초기화 애니메이션
  const SystemInitializingAnimation = () => (
    <motion.div
      initial={{ 
        opacity: 0,
        background: 'linear-gradient(135deg, #1e293b, #0f172a, #312e81)'
      }}
      animate={{ 
        opacity: 1,
        background: [
          'linear-gradient(135deg, #1e293b, #0f172a, #312e81)',
          'linear-gradient(135deg, #374151, #1f2937, #4c1d95)',
          'linear-gradient(135deg, #6b7280, #374151, #6366f1)'
        ]
      }}
      exit={{ 
        opacity: 0,
        scale: 1.1,
        background: 'linear-gradient(135deg, #6b7280, #374151, #6366f1)'
      }}
      transition={{ 
        duration: 2,
        background: { duration: 1.8, ease: 'easeInOut' }
      }}
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
    >
      {/* 배경 파티클 효과 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-blue-300 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-60 h-60 bg-purple-400 rounded-full filter blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="text-center relative z-10">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-32 h-32 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 relative"
        >
          <motion.div
            animate={{
              boxShadow: [
                "0 0 30px rgba(168, 85, 247, 0.4)",
                "0 0 60px rgba(168, 85, 247, 0.8)",
                "0 0 30px rgba(168, 85, 247, 0.4)"
              ]
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full"
          />
          <Cloud className="w-16 h-16 text-white" />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-3xl font-bold mb-4 bg-gradient-to-b from-white via-gray-100 to-gray-400 bg-clip-text text-transparent"
          style={{
            textShadow: "0 0 30px rgba(255, 255, 255, 0.5)"
          }}
        >
          시스템 초기화 중...
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-b from-gray-200 via-gray-300 to-gray-500 bg-clip-text text-transparent font-medium max-w-md mx-auto"
        >
          프로세스 관리자와 모니터링 시스템을 준비하고 있습니다
        </motion.p>

        {/* 로딩 인디케이터 */}
        <motion.div
          className="mt-8 flex justify-center space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );

  // 컴포넌트 로딩 애니메이션
  const ComponentsLoadingAnimation = () => (
    <motion.div
      initial={{ 
        opacity: 0, 
        background: 'linear-gradient(135deg, #6b7280, #374151, #6366f1)' 
      }}
      animate={{ 
        opacity: 1, 
        background: [
          'linear-gradient(135deg, #6b7280, #374151, #6366f1)',
          'linear-gradient(135deg, #9ca3af, #6b7280, #8b5cf6)',
          'linear-gradient(135deg, #e5e7eb, #d1d5db, #c7d2fe)',
          'linear-gradient(135deg, #ffffff, #f8fafc, #f1f5f9)'
        ]
      }}
      transition={{ 
        duration: 1.5,
        background: { duration: 1.4, ease: 'easeInOut' }
      }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
    >
      {/* 배경 효과 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-200 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-200 rounded-full filter blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="text-center relative z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 300 }}
          className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 relative"
        >
          <motion.div
            animate={{
              boxShadow: [
                "0 0 20px rgba(236, 72, 153, 0.3)",
                "0 0 40px rgba(236, 72, 153, 0.6)",
                "0 0 20px rgba(236, 72, 153, 0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-2xl"
          />
          <BarChart3 className="w-12 h-12 text-white" />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-2xl font-semibold mb-6 bg-gradient-to-b from-gray-800 via-gray-600 to-gray-500 bg-clip-text text-transparent"
          style={{
            textShadow: "0 0 20px rgba(0, 0, 0, 0.1)"
          }}
        >
          대시보드 준비 중...
        </motion.h2>
        
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-3 border-gray-300 border-t-blue-500 rounded-full mx-auto"
        />

        {/* 완료 표시 점들 */}
        <motion.div
          className="mt-6 flex justify-center space-x-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {['서버 연결', '데이터 로드', '차트 준비'].map((item, index) => (
            <motion.div
              key={item}
              className="text-xs text-gray-600 px-3 py-1 bg-gray-100 rounded-full border"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + index * 0.2 }}
            >
              {item}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );

  // 대시보드 등장 애니메이션
  const DashboardReadyAnimation = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="min-h-screen bg-gray-50"
    >
      <div className="space-y-6">
        {/* 통합 시스템 제어 패널 */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6"
        >
          <SystemControlPanel />
        </motion.div>
        
        {/* 서버 대시보드 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ServerDashboard onStatsUpdate={onStatsUpdate} />
        </motion.div>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait" initial={false}>
      {currentPhase === 'service-starting' && (
        <ServiceStartingAnimation key="service-starting" />
      )}
      {currentPhase === 'system-initializing' && (
        <SystemInitializingAnimation key="system-initializing" />
      )}
      {currentPhase === 'components-loading' && (
        <ComponentsLoadingAnimation key="components-loading" />
      )}
      {currentPhase === 'dashboard-ready' && (
        <DashboardReadyAnimation key="dashboard-ready" />
      )}
    </AnimatePresence>
  );
};

export default DashboardEntrance; 