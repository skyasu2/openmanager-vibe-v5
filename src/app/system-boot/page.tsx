'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useRouter } from 'next/navigation';
import { SystemBootSequence } from '@/components/dashboard/transition';
import { useServerDataStore } from '@/stores/serverDataStore';
import {
  Monitor,
  CheckCircle,
  Server as ServerIcon,
  Database,
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

  // 부팅 완료 핸들러 - 즉시 대시보드로 이동
  const handleBootComplete = () => {
    console.log('🎉 부팅 시퀀스 완료 - 즉시 대시보드로 이동');
    setBootState('completed');

    // 시스템 준비완료 화면 없이 바로 대시보드로 이동
    console.log('🚀 즉시 대시보드 이동');
    router.push('/dashboard');
  };

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
        </AnimatePresence>
      </div>
    </div>
  );
}
