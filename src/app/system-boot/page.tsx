'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { SystemBootSequence } from '@/components/dashboard/transition';
import { useServerDataStore } from '@/stores/serverDataStore';
import { useRouter } from 'next/navigation';
import {
  Monitor,
  Play,
  Pause,
  RotateCcw,
  Home,
  ArrowRight,
} from 'lucide-react';
import type { Server } from '@/types/server';

export default function SystemBootPage() {
  const { servers: serverMetrics } = useServerDataStore();

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
    services: [], // 빈 배열로 초기화
  }));
  const router = useRouter();
  const [bootState, setBootState] = useState<'running' | 'completed'>(
    'running'
  );

  // 페이지 로드 시 바로 애니메이션 시작
  useEffect(() => {
    // 컴포넌트 마운트 시 바로 running 상태로 설정
    setBootState('running');
  }, []);

  // 부팅 완료 핸들러 - 자동 이동 제거
  const handleBootComplete = () => {
    setBootState('completed');
    // 자동 이동 기능 제거됨
  };

  // 부팅 다시 시작
  const restartBoot = () => {
    setBootState('running');
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden'>
      {/* 배경 효과 */}
      <div className='absolute inset-0'>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl' />
        <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl' />
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl' />
      </div>

      {/* 헤더 - 부팅 완료 시에만 표시 */}
      {bootState === 'completed' && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='relative z-10 p-6'
        >
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center'>
                <Monitor className='w-6 h-6 text-white' />
              </div>
              <div>
                <h1 className='text-2xl font-bold text-white'>
                  OpenManager Vibe v5
                </h1>
                <p className='text-blue-200'>시스템 부팅 완료</p>
              </div>
            </div>

            <Link
              href='/'
              className='flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors'
            >
              <Home className='w-4 h-4' />
              홈으로
            </Link>
          </div>
        </motion.header>
      )}

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

          {/* 부팅 완료 */}
          {bootState === 'completed' && (
            <motion.div
              key='completed'
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className='text-center space-y-8 max-w-md mx-auto px-6'
            >
              <div className='space-y-4'>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className='w-20 h-20 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center'
                >
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    ✓
                  </motion.div>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className='text-3xl font-bold text-white'
                >
                  시스템 부팅 완료!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className='text-green-200 text-lg'
                >
                  모든 서버가 성공적으로 초기화되었습니다
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className='grid grid-cols-1 gap-4'
              >
                <Link
                  href='/dashboard'
                  className='flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl text-white font-semibold text-lg transition-all duration-200 hover:scale-105'
                >
                  <ArrowRight className='w-5 h-5' />
                  대시보드로 이동
                </Link>

                <button
                  onClick={restartBoot}
                  className='flex items-center justify-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors'
                >
                  <RotateCcw className='w-4 h-4' />
                  부팅 애니메이션 다시 보기
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className='text-xs text-blue-300 space-y-1'
              >
                <p>✓ {servers.length}개 서버 부팅 완료</p>
                <p>✓ 모든 시스템 서비스 정상 동작</p>
                <p>✓ 대시보드 접근 준비 완료</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
