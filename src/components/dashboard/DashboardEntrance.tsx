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

  // 서비스 시작 애니메이션 - 개선된 버전
  const ServiceStartingAnimation = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        scale: 0.95,
        filter: 'brightness(1.2)'
      }}
      transition={{ 
        exit: { duration: 0.6, ease: 'easeOut' }
      }}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center relative overflow-hidden"
    >
      {/* 개선된 배경 효과 */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-purple-400 rounded-full filter blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className="text-center max-w-lg mx-auto px-6 relative z-10">
        {/* 메인 로고 - 더 크고 임팩트 있게 */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, type: "spring", damping: 10 }}
          className="mb-8"
        >
          <motion.div 
            className="w-28 h-28 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
            animate={{ 
              boxShadow: [
                "0 0 40px rgba(59, 130, 246, 0.5)",
                "0 0 80px rgba(139, 92, 246, 0.8)",
                "0 0 40px rgba(59, 130, 246, 0.5)"
              ],
              rotateY: [0, 360]
            }}
            transition={{ 
              boxShadow: { duration: 3, repeat: Infinity },
              rotateY: { duration: 8, repeat: Infinity, ease: "linear" }
            }}
          >
            <Server className="w-14 h-14 text-white" />
          </motion.div>
          
          {/* 타이틀 - 더 화려한 효과 */}
          <motion.h1 
            className="text-5xl font-bold mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            style={{
              background: "linear-gradient(45deg, #ffffff 0%, #60a5fa 25%, #a78bfa 50%, #ec4899 75%, #ffffff 100%)",
              backgroundSize: "300% 300%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "gradient-shift 4s ease infinite"
            }}
          >
            OpenManager
          </motion.h1>
          
          {/* 부제목 */}
          <motion.p 
            className="text-xl text-blue-200 font-medium mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            AI 서버 모니터링 시스템
          </motion.p>
          
          <motion.p 
            className="text-sm text-blue-300/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            v5.7.4 • Python AI + TypeScript 하이브리드
          </motion.p>
        </motion.div>

        {/* 간소화된 진행률 */}
        <div className="mb-8">
          <motion.div
            className="w-full bg-white/10 backdrop-blur-sm rounded-full h-4 overflow-hidden border border-white/20 shadow-inner"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full relative overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* 빛나는 효과 */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="mt-4 text-white font-semibold text-lg"
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {Math.round(progress)}% 시스템 준비 중...
          </motion.div>
        </div>

        {/* 현재 작업 - 더 시각적으로 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentService}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <motion.div
                className={`text-3xl ${services[currentService]?.color || 'text-blue-400'}`}
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1.5, repeat: Infinity }
                }}
              >
                {services[currentService]?.icon}
              </motion.div>
              <div className="text-left">
                <div className="text-white font-semibold text-lg">
                  {services[currentService]?.name}
                </div>
                <div className="text-blue-200 text-sm">
                  초기화 중...
                </div>
              </div>
            </div>
            
            {/* 로딩 스피너 */}
            <motion.div
              className="w-8 h-8 mx-auto border-3 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </AnimatePresence>

        {/* 하단 정보 */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          <div className="text-blue-200/60 text-sm">
            잠시만 기다려주세요. 시스템을 준비하고 있습니다.
          </div>
        </motion.div>
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