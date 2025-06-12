/**
 * 🚀 Dashboard Entrance Component
 *
 * 시작 애니메이션부터 대시보드 등장까지의 전체 플로우 관리
 * - 서비스 시작 애니메이션 단계
 * - 시뮬레이션 진행 상황 표시
 * - 동적 전환 애니메이션
 * - 대시보드 등장 효과
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SystemControlPanel } from '../system/SystemControlPanel';
import ServerDashboard from './ServerDashboard';
import SimulateProgressBar from './SimulateProgressBar';
import useSimulationProgress from '../../hooks/useSimulationProgress';
import {
  Server,
  Cpu,
  Database,
  Cloud,
  Shield,
  BarChart3,
  GitBranch,
  Layers,
  Zap,
} from 'lucide-react';

interface DashboardEntranceProps {
  onStatsUpdate: (stats: any) => void;
}

type EntrancePhase =
  | 'service-starting'
  | 'simulation-progress'
  | 'dashboard-ready';

const DashboardEntrance: React.FC<DashboardEntranceProps> = ({
  onStatsUpdate,
}) => {
  const [currentPhase, setCurrentPhase] =
    useState<EntrancePhase>('service-starting');
  const [progress, setProgress] = useState(0);
  const [currentService, setCurrentService] = useState(0);

  // 시뮬레이션 진행 상황 훅
  const {
    data: simulationData,
    loading: simulationLoading,
    error: simulationError,
    isComplete: simulationComplete,
    startPolling,
  } = useSimulationProgress({
    pollInterval: 2000,
    autoStart: false,
  }); // 수동 시작

  // 서비스 시작 단계 정의
  const services = [
    {
      name: 'ProcessManager',
      icon: <Zap />,
      color: 'text-blue-400',
      duration: 800,
    },
    {
      name: 'SystemWatchdog',
      icon: <Shield />,
      color: 'text-green-400',
      duration: 600,
    },
    {
      name: 'HealthCheck System',
      icon: <BarChart3 />,
      color: 'text-orange-400',
      duration: 700,
    },
    {
      name: 'API Server',
      icon: <Server />,
      color: 'text-purple-400',
      duration: 500,
    },
    {
      name: 'Database Service',
      icon: <Database />,
      color: 'text-cyan-400',
      duration: 600,
    },
    {
      name: 'Monitoring Layer',
      icon: <Layers />,
      color: 'text-pink-400',
      duration: 500,
    },
  ];

  // 시작 애니메이션 시퀀스
  useEffect(() => {
    let currentServiceIndex = 0;
    let totalProgress = 0;

    const startServiceSequence = () => {
      if (currentServiceIndex < services.length) {
        setCurrentService(currentServiceIndex);

        const service = services[currentServiceIndex];
        const serviceProgress =
          ((currentServiceIndex + 1) / services.length) * 100;

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
                // 모든 서비스 시작 완료 -> 시뮬레이션 진행 단계로
                setTimeout(() => {
                  setCurrentPhase('simulation-progress');
                  // 시뮬레이션 진행 단계에서 폴링 시작
                  startPolling();
                }, 500);
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
  }, [currentPhase, startPolling]);

  // 시뮬레이션 완료시 대시보드로 전환
  useEffect(() => {
    if (simulationComplete) {
      setTimeout(() => setCurrentPhase('dashboard-ready'), 1000);
    }
  }, [simulationComplete]);

  // 서비스 시작 애니메이션 - 개선된 버전
  const ServiceStartingAnimation = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 0.95,
        filter: 'brightness(1.2)',
      }}
      transition={{
        exit: { duration: 0.6, ease: 'easeOut' },
      }}
      className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center relative overflow-hidden'
    >
      {/* 개선된 배경 효과 */}
      <div className='absolute inset-0 opacity-30'>
        <motion.div
          className='absolute top-1/3 left-1/3 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl'
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className='absolute bottom-1/3 right-1/3 w-80 h-80 bg-purple-400 rounded-full filter blur-3xl'
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className='text-center max-w-lg mx-auto px-6 relative z-10'>
        {/* 메인 로고 - 더 크고 임팩트 있게 */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, type: 'spring', damping: 10 }}
          className='mb-8'
        >
          <motion.div
            className='w-28 h-28 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl'
            animate={{
              boxShadow: [
                '0 0 40px rgba(59, 130, 246, 0.5)',
                '0 0 80px rgba(139, 92, 246, 0.8)',
                '0 0 40px rgba(59, 130, 246, 0.5)',
              ],
              rotateY: [0, 360],
            }}
            transition={{
              boxShadow: { duration: 3, repeat: Infinity },
              rotateY: { duration: 8, repeat: Infinity, ease: 'linear' },
            }}
          >
            <Server className='w-14 h-14 text-white' />
          </motion.div>

          {/* 타이틀 - 더 화려한 효과 */}
          <motion.h1
            className='text-5xl font-bold mb-3'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            style={{
              background:
                'linear-gradient(45deg, #ffffff 0%, #60a5fa 25%, #a78bfa 50%, #ec4899 75%, #ffffff 100%)',
              backgroundSize: '300% 300%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradient-shift 4s ease infinite',
            }}
          >
            OpenManager
          </motion.h1>

          {/* 부제목 */}
          <motion.p
            className='text-xl text-blue-200 font-medium mb-2'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            AI 서버 모니터링 시스템
          </motion.p>

          <motion.p
            className='text-sm text-blue-300/80'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            v5.12.0 • Enterprise-Grade 최적화 완료
          </motion.p>
        </motion.div>

        {/* 간소화된 진행률 */}
        <div className='mb-8'>
          <motion.div
            className='w-full bg-white/10 backdrop-blur-sm rounded-full h-4 overflow-hidden border border-white/20 shadow-inner'
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            <motion.div
              className='h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full relative overflow-hidden'
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {/* 빛나는 효과 */}
              <motion.div
                className='absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full'
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>

          <motion.div
            className='mt-4 text-white font-semibold text-lg'
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {Math.round(progress)}% 기본 서비스 시작 중...
          </motion.div>
        </div>

        {/* 현재 작업 - 더 시각적으로 */}
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentService}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className='bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl'
          >
            <div className='flex items-center justify-center gap-4 mb-4'>
              <motion.div
                className={`text-3xl ${services[currentService]?.color || 'text-blue-400'}`}
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 1.5, repeat: Infinity },
                }}
              >
                {services[currentService]?.icon}
              </motion.div>
              <div className='text-left'>
                <div className='text-white font-semibold text-lg'>
                  {services[currentService]?.name}
                </div>
                <div className='text-blue-200 text-sm'>초기화 중...</div>
              </div>
            </div>

            {/* 로딩 스피너 */}
            <motion.div
              className='w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto'
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CSS 추가 */}
      <style jsx>{`
        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </motion.div>
  );

  // 시뮬레이션 진행 단계
  const SimulationProgressView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8 }}
      className='min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center px-6'
    >
      <div className='max-w-2xl w-full'>
        {/* 메인 제목 */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className='text-center mb-8'
        >
          <motion.h2
            className='text-4xl font-bold text-white mb-4'
            animate={{
              textShadow: [
                '0 0 20px rgba(59, 130, 246, 0.5)',
                '0 0 40px rgba(139, 92, 246, 0.8)',
                '0 0 20px rgba(59, 130, 246, 0.5)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            🚀 시스템 시뮬레이션 초기화
          </motion.h2>
          <p className='text-gray-300 text-lg'>
            실시간 모니터링 환경을 구성하고 있습니다
          </p>
        </motion.div>

        {/* 시뮬레이션 프로그레스 바 */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <SimulateProgressBar
            currentStep={simulationData?.currentStep || 0}
            totalSteps={simulationData?.totalSteps || 12}
            progress={simulationData?.progress}
            isActive={simulationData?.isActive || true}
            stepDescription={simulationData?.stepDescription}
            stepIcon={simulationData?.stepIcon}
            showDetailed={true}
            onComplete={() => {
              console.log('✅ 시뮬레이션 완료! 대시보드로 전환합니다.');
            }}
            error={simulationError}
          />
        </motion.div>

        {/* 하단 상태 정보 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className='mt-8 text-center'
        >
          <div className='grid grid-cols-3 gap-4 text-center'>
            <div className='bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10'>
              <div className='text-2xl font-bold text-cyan-400'>
                {simulationData?.currentStep
                  ? simulationData.currentStep + 1
                  : 1}
              </div>
              <div className='text-gray-400 text-sm'>현재 단계</div>
            </div>
            <div className='bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10'>
              <div className='text-2xl font-bold text-blue-400'>
                {simulationData?.progress || 0}%
              </div>
              <div className='text-gray-400 text-sm'>완료율</div>
            </div>
            <div className='bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10'>
              <div className='text-2xl font-bold text-purple-400'>
                {simulationData?.nextStepETA || 0}s
              </div>
              <div className='text-gray-400 text-sm'>다음 단계</div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  // 대시보드 등장 애니메이션
  const DashboardReadyAnimation = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className='min-h-screen bg-gray-50'
    >
      <div className='space-y-6'>
        {/* 통합 시스템 제어 패널 */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='p-6'
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
    <AnimatePresence mode='wait'>
      {currentPhase === 'service-starting' && (
        <ServiceStartingAnimation key='service-starting' />
      )}
      {currentPhase === 'simulation-progress' && (
        <SimulationProgressView key='simulation-progress' />
      )}
      {currentPhase === 'dashboard-ready' && (
        <DashboardReadyAnimation key='dashboard-ready' />
      )}
    </AnimatePresence>
  );
};

export default DashboardEntrance;
