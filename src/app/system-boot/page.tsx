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
  const [bootState, setBootState] = useState<'ready' | 'running' | 'completed'>(
    'ready'
  );
  const [showControls, setShowControls] = useState(true);
  const [autoRedirect, setAutoRedirect] = useState(false);

  // 부팅 완료 핸들러
  const handleBootComplete = () => {
    setBootState('completed');
    setShowControls(true);

    if (autoRedirect) {
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }
  };

  // 부팅 시작
  const startBoot = () => {
    setBootState('running');
    setShowControls(false);
  };

  // 부팅 리셋
  const resetBoot = () => {
    setBootState('ready');
    setShowControls(true);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden'>
      {/* 배경 효과 */}
      <div className='absolute inset-0'>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl' />
        <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl' />
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl' />
      </div>

      {/* 헤더 */}
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
              <p className='text-blue-200'>시스템 부팅 애니메이션</p>
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

      {/* 메인 컨텐츠 */}
      <div className='relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)]'>
        <AnimatePresence mode='wait'>
          {/* 준비 상태 */}
          {bootState === 'ready' && (
            <motion.div
              key='ready'
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className='text-center space-y-8 max-w-md mx-auto px-6'
            >
              <div className='space-y-4'>
                <div className='w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center'>
                  <Monitor className='w-10 h-10 text-white' />
                </div>
                <h2 className='text-3xl font-bold text-white'>
                  시스템 부팅 애니메이션
                </h2>
                <p className='text-blue-200 text-lg'>
                  OpenManager Vibe v5 시스템의 부팅 과정을 시각화합니다
                </p>
              </div>

              <div className='space-y-4'>
                <button
                  onClick={startBoot}
                  className='w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl text-white font-semibold text-lg transition-all duration-200 hover:scale-105'
                >
                  <Play className='w-5 h-5' />
                  부팅 애니메이션 시작
                </button>

                <div className='flex items-center justify-center space-x-2'>
                  <input
                    type='checkbox'
                    id='autoRedirect'
                    checked={autoRedirect}
                    onChange={e => setAutoRedirect(e.target.checked)}
                    className='w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500'
                  />
                  <label
                    htmlFor='autoRedirect'
                    className='text-blue-200 text-sm'
                  >
                    완료 후 자동으로 대시보드로 이동
                  </label>
                </div>
              </div>

              <div className='grid grid-cols-1 gap-3 text-sm'>
                <Link
                  href='/dashboard'
                  className='flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors'
                >
                  <ArrowRight className='w-4 h-4' />
                  애니메이션 건너뛰고 대시보드로
                </Link>
              </div>

              <div className='text-xs text-blue-300 space-y-1'>
                <p>• 서버 {servers.length}개가 부팅 애니메이션에 참여합니다</p>
                <p>
                  • 언제든지 화면을 클릭하면 애니메이션을 건너뛸 수 있습니다
                </p>
              </div>
            </motion.div>
          )}

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
                  transition={{ type: 'spring', delay: 0.2 }}
                  className='w-20 h-20 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center'
                >
                  <Monitor className='w-10 h-10 text-white' />
                </motion.div>
                <h2 className='text-3xl font-bold text-white'>부팅 완료!</h2>
                <p className='text-green-200 text-lg'>
                  시스템이 성공적으로 부팅되었습니다
                </p>
              </div>

              <div className='space-y-4'>
                <Link
                  href='/dashboard'
                  className='w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl text-white font-semibold text-lg transition-all duration-200 hover:scale-105'
                >
                  <ArrowRight className='w-5 h-5' />
                  대시보드로 이동
                </Link>

                <button
                  onClick={resetBoot}
                  className='w-full flex items-center justify-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors'
                >
                  <RotateCcw className='w-4 h-4' />
                  다시 보기
                </button>
              </div>

              {autoRedirect && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='text-sm text-green-300'
                >
                  2초 후 자동으로 대시보드로 이동합니다...
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 플로팅 컨트롤 */}
      <AnimatePresence>
        {showControls && bootState === 'running' && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className='fixed bottom-6 right-6 space-y-3'
          >
            <button
              onClick={() => setShowControls(!showControls)}
              className='w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors'
            >
              <Pause className='w-5 h-5' />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 하단 네비게이션 */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='absolute bottom-0 left-0 right-0 p-6'
      >
        <div className='flex items-center justify-center space-x-4 text-sm text-blue-300'>
          <Link href='/' className='hover:text-white transition-colors'>
            홈
          </Link>
          <span>•</span>
          <Link
            href='/dashboard'
            className='hover:text-white transition-colors'
          >
            대시보드
          </Link>
          <span>•</span>
          <Link
            href='/vibe-coding'
            className='hover:text-white transition-colors'
          >
            바이브 코딩
          </Link>
        </div>
      </motion.footer>
    </div>
  );
}
