'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SystemBootSequence } from '@/components/dashboard/transition';
import { useServerDataStore } from '@/stores/serverDataStore';
import {
  Monitor,
  ArrowRight,
  CheckCircle,
  Server as ServerIcon,
  Database,
  RotateCcw,
} from 'lucide-react';
import type { Server } from '@/types/server';

export default function SystemBootPage() {
  const { servers: serverMetrics } = useServerDataStore();
  const router = useRouter();

  // EnhancedServerMetrics를 Server 타입으로 변환
  const servers: Server[] = serverMetrics.map(server => ({
    id: server.id,
    name: server.name || server.hostname,
    status:
      server.status === 'critical'
        ? 'warning'
        : server.status === 'warning'
          ? 'warning'
          : 'online',
    cpu: server.cpu_usage,
    memory: server.memory_usage,
    disk: server.disk_usage,
    uptime: `${Math.floor(server.uptime / 24)}d ${server.uptime % 24}h`,
    location: server.environment,
    alerts: server.alerts?.length || 0,
    lastUpdate: new Date(server.last_updated),
    services: [],
  }));

  const [bootState, setBootState] = useState<'running' | 'completed'>(
    'running'
  );
  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState(0);
  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // 부팅 완료 핸들러 - 3초 카운트다운 시작
  const handleBootComplete = () => {
    console.log('🎉 부팅 시퀀스 완료 - 3초 후 자동 이동 시작');
    setBootState('completed');

    // 3초 카운트다운 시작
    setAutoRedirectCountdown(3);
    const timer = setInterval(() => {
      setAutoRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          console.log('🚀 자동 대시보드 이동');
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setCountdownTimer(timer);
  };

  // 카운트다운 중지
  const stopCountdown = () => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      setCountdownTimer(null);
    }
    setAutoRedirectCountdown(0);
    console.log('⏹️ 자동 이동 카운트다운 중지');
  };

  // 부팅 다시 시작
  const restartBoot = () => {
    stopCountdown();
    setBootState('running');
  };

  // ESC 키와 배경 클릭으로 카운트다운 중지
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && autoRedirectCountdown > 0) {
        stopCountdown();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        autoRedirectCountdown > 0 &&
        (e.target as HTMLElement).classList.contains('bg-gradient-to-br')
      ) {
        stopCountdown();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    };
  }, [autoRedirectCountdown, countdownTimer]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden'>
      {/* 배경 효과 */}
      <div className='absolute inset-0'>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl' />
        <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl' />
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl' />
      </div>

      {/* 메인 컨텐츠 */}
      <div className='relative z-10 flex items-center justify-center min-h-screen'>
        <AnimatePresence mode='wait'>
          {/* 부팅 실행 중 */}
          {bootState === 'running' && (
            <SystemBootSequence
              servers={servers}
              onBootComplete={handleBootComplete}
              skipAnimation={false}
              autoStart={true}
            />
          )}

          {/* 부팅 완료 - 정적 완료 화면 */}
          {bootState === 'completed' && (
            <motion.div
              key='completed'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='w-full h-full flex items-center justify-center'
            >
              <div className='text-center space-y-8 max-w-4xl mx-auto px-6'>
                {/* 시스템 상태 표시 */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className='p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm'
                  >
                    <div className='flex items-center gap-3 mb-3'>
                      <CheckCircle className='w-6 h-6 text-green-400' />
                      <h3 className='text-lg font-semibold text-white'>
                        시스템 초기화
                      </h3>
                    </div>
                    <p className='text-green-300 text-sm'>
                      모든 시스템 구성 요소가 성공적으로 로드되었습니다
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className='p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm'
                  >
                    <div className='flex items-center gap-3 mb-3'>
                      <ServerIcon className='w-6 h-6 text-blue-400' />
                      <h3 className='text-lg font-semibold text-white'>
                        서버 연결
                      </h3>
                    </div>
                    <p className='text-blue-300 text-sm'>
                      {servers.length}개 서버가 온라인 상태입니다
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className='p-6 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm'
                  >
                    <div className='flex items-center gap-3 mb-3'>
                      <Database className='w-6 h-6 text-purple-400' />
                      <h3 className='text-lg font-semibold text-white'>
                        데이터베이스
                      </h3>
                    </div>
                    <p className='text-purple-300 text-sm'>
                      모든 데이터 연결이 활성화되었습니다
                    </p>
                  </motion.div>
                </div>

                {/* 시스템 로고 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className='text-center'
                >
                  <div className='w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center'>
                    <Monitor className='w-12 h-12 text-white' />
                  </div>
                  <h1 className='text-3xl font-bold text-white mb-2'>
                    OpenManager Vibe v5
                  </h1>
                  <p className='text-blue-200'>시스템이 준비되었습니다</p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 우측 하단 버튼 - 부팅 완료 시에만 표시 */}
      {bootState === 'completed' && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className='fixed bottom-8 right-8 flex flex-col gap-3'
        >
          <Link
            href='/dashboard'
            onClick={() => stopCountdown()}
            className={`flex items-center gap-3 px-6 py-4 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 ${
              autoRedirectCountdown > 0
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
            }`}
          >
            <ArrowRight className='w-5 h-5' />
            {autoRedirectCountdown > 0 ? (
              <div className='flex items-center gap-2'>
                <span>자동 이동</span>
                <div className='bg-white/20 rounded-full w-6 h-6 flex items-center justify-center'>
                  <span className='text-sm font-bold'>
                    {autoRedirectCountdown}
                  </span>
                </div>
              </div>
            ) : (
              '대시보드로 이동'
            )}
          </Link>

          <button
            onClick={restartBoot}
            className='flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors backdrop-blur-sm'
          >
            <RotateCcw className='w-4 h-4' />
            다시 보기
          </button>

          {/* 카운트다운 중단 안내 */}
          {autoRedirectCountdown > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className='text-center text-gray-300 text-xs bg-black/20 rounded-lg px-3 py-2 backdrop-blur-sm'
            >
              <div className='flex items-center justify-center gap-1 text-center'>
                <span>ESC 키 또는 배경 클릭으로 중단</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
