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
      exit={{ opacity: 0, scale: 0.95 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center"
    >
      <div className="text-center max-w-md mx-auto px-6">
        {/* 로고 영역 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Server className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">OpenManager</h1>
          <p className="text-gray-300">AI 서버 모니터링 시스템</p>
        </motion.div>

        {/* 진행률 바 */}
        <div className="mb-6">
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="mt-2 text-gray-400 text-sm">{Math.round(progress)}% 완료</div>
        </div>

        {/* 현재 서비스 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentService}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className={`${services[currentService]?.color || 'text-gray-400'}`}>
              {services[currentService]?.icon}
            </div>
            <span className="text-white font-medium">
              {services[currentService]?.name} 시작 중...
            </span>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
          </motion.div>
        </AnimatePresence>

        {/* 서비스 리스트 */}
        <div className="space-y-2">
          {services.map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: index <= currentService ? 1 : 0.3,
                x: 0 
              }}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg ${
                index < currentService 
                  ? 'bg-green-500/20 border border-green-500/30'
                  : index === currentService
                    ? 'bg-blue-500/20 border border-blue-500/30'
                    : 'bg-gray-700/30 border border-gray-600/30'
              }`}
            >
              <div className={index <= currentService ? service.color : 'text-gray-500'}>
                {service.icon}
              </div>
              <span className={`text-sm ${
                index < currentService 
                  ? 'text-green-400'
                  : index === currentService
                    ? 'text-blue-400'
                    : 'text-gray-500'
              }`}>
                {service.name}
              </span>
              {index < currentService && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto text-green-400"
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center"
    >
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-32 h-32 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <Cloud className="w-16 h-16 text-white" />
        </motion.div>
        
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-white mb-4"
        >
          시스템 초기화 중...
        </motion.h2>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-300"
        >
          프로세스 관리자와 모니터링 시스템을 준비하고 있습니다
        </motion.p>
      </div>
    </motion.div>
  );

  // 컴포넌트 로딩 애니메이션
  const ComponentsLoadingAnimation = () => (
    <motion.div
      initial={{ opacity: 0, background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}
      animate={{ 
        opacity: 1, 
        background: [
          'linear-gradient(135deg, #1e293b, #0f172a)',
          'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
          'linear-gradient(135deg, #ffffff, #f8fafc)'
        ]
      }}
      transition={{ 
        duration: 1.5,
        background: { duration: 1.2, ease: 'easeInOut' }
      }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 300 }}
          className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
        >
          <BarChart3 className="w-12 h-12 text-white" />
        </motion.div>
        
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-xl font-semibold text-gray-800 mb-2"
        >
          대시보드 준비 중...
        </motion.h2>
        
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-6 h-6 border-2 border-gray-400 border-t-blue-500 rounded-full mx-auto"
        />
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
    <AnimatePresence mode="wait">
      {currentPhase === 'service-starting' && <ServiceStartingAnimation key="service-starting" />}
      {currentPhase === 'system-initializing' && <SystemInitializingAnimation key="system-initializing" />}
      {currentPhase === 'components-loading' && <ComponentsLoadingAnimation key="components-loading" />}
      {currentPhase === 'dashboard-ready' && <DashboardReadyAnimation key="dashboard-ready" />}
    </AnimatePresence>
  );
};

export default DashboardEntrance; 