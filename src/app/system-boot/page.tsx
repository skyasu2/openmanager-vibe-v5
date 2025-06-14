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
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { Server } from '@/types/server';

// 시스템 시작 로그 타입 정의
interface SystemBootLog {
  timestamp: string;
  stage: string;
  status: 'started' | 'completed' | 'failed';
  duration?: number;
  details?: string;
  error?: string;
}

// 로컬 스토리지에 로그 저장
const saveBootLog = (log: SystemBootLog) => {
  try {
    const existingLogs = JSON.parse(localStorage.getItem('systemBootLogs') || '[]');
    existingLogs.push(log);

    // 최대 100개 로그만 유지
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }

    localStorage.setItem('systemBootLogs', JSON.stringify(existingLogs));
    console.log('📝 시스템 부팅 로그 저장:', log);
  } catch (error) {
    console.error('❌ 로그 저장 실패:', error);
  }
};

// 개발용 로그 확인 함수
const getBootLogs = (): SystemBootLog[] => {
  try {
    return JSON.parse(localStorage.getItem('systemBootLogs') || '[]');
  } catch (error) {
    console.error('❌ 로그 읽기 실패:', error);
    return [];
  }
};

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

  const [bootState, setBootState] = useState<'running' | 'completed'>('running');
  const [currentStage, setCurrentStage] = useState<string>('초기화');
  const [bootStartTime, setBootStartTime] = useState<number>(Date.now());
  const [stageLogs, setStageLogs] = useState<SystemBootLog[]>([]);

  // 시스템 부팅 시작 로그 및 단계별 모니터링
  useEffect(() => {
    const startTime = Date.now();
    setBootStartTime(startTime);

    const startLog: SystemBootLog = {
      timestamp: new Date().toISOString(),
      stage: '시스템 부팅 시작',
      status: 'started',
      details: '사용자가 대시보드 접근을 통해 시스템 부팅 시작'
    };

    saveBootLog(startLog);
    setStageLogs([startLog]);

    console.log('🚀 시스템 부팅 시작 - 로깅 활성화');

    // 부팅 과정 단계별 모니터링
    const stages = [
      { name: '서버 데이터 초기화', delay: 1000 },
      { name: '시뮬레이션 엔진 시작', delay: 2500 },
      { name: 'AI 엔진 로딩', delay: 4000 },
      { name: '데이터 생성 시작', delay: 5500 },
      { name: '시스템 검증', delay: 7000 }
    ];

    stages.forEach(({ name, delay }) => {
      setTimeout(() => {
        if (bootState === 'running') {
          logStage(name, 'started', `단계 시작: ${name}`);

          // 각 단계 완료 로그 (1초 후)
          setTimeout(() => {
            if (bootState === 'running') {
              logStage(name, 'completed', `단계 완료: ${name}`);
            }
          }, 800);
        }
      }, delay);
    });
  }, []);

  // 단계별 로깅 함수
  const logStage = (stage: string, status: 'started' | 'completed' | 'failed', details?: string, error?: string) => {
    const now = Date.now();
    const duration = status !== 'started' ? now - bootStartTime : undefined;

    const log: SystemBootLog = {
      timestamp: new Date().toISOString(),
      stage,
      status,
      duration,
      details,
      error
    };

    saveBootLog(log);
    setStageLogs(prev => [...prev, log]);
    setCurrentStage(stage);

    console.log(`📊 [${status.toUpperCase()}] ${stage}`, { duration, details, error });
  };

  // 부팅 완료 핸들러 - 로깅 포함
  const handleBootComplete = () => {
    const totalDuration = Date.now() - bootStartTime;

    logStage('시스템 부팅 완료', 'completed', `총 소요 시간: ${totalDuration}ms`);

    console.log('🎉 부팅 시퀀스 완료 - 즉시 대시보드로 이동');
    console.log('📊 부팅 로그 요약:', {
      totalStages: stageLogs.length + 1,
      totalDuration: `${totalDuration}ms`,
      success: true
    });

    setBootState('completed');

    // 시스템 준비완료 화면 없이 바로 대시보드로 이동
    console.log('🚀 즉시 대시보드 이동');
    router.push('/dashboard');
  };

  // 개발용 로그 확인 (콘솔에서 호출 가능)
  useEffect(() => {
    // 전역 함수로 등록하여 개발자 도구에서 호출 가능
    (window as any).getSystemBootLogs = () => {
      const logs = getBootLogs();
      console.table(logs);
      return logs;
    };

    (window as any).clearSystemBootLogs = () => {
      localStorage.removeItem('systemBootLogs');
      console.log('🗑️ 시스템 부팅 로그가 삭제되었습니다.');
    };
  }, []);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden'>
      {/* 배경 효과 */}
      <div className='absolute inset-0'>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl' />
        <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl' />
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl' />
      </div>

      {/* 개발용 로그 표시 (우상단) */}
      <div className='absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-xs text-white/80 max-w-xs'>
        <div className='flex items-center gap-2 mb-2'>
          <Clock className='w-3 h-3' />
          <span className='font-semibold'>부팅 로그</span>
        </div>
        <div className='space-y-1 max-h-32 overflow-y-auto'>
          {stageLogs.slice(-5).map((log, index) => (
            <div key={index} className='flex items-center gap-2 text-xs'>
              {log.status === 'completed' ? (
                <CheckCircle className='w-2 h-2 text-green-400' />
              ) : log.status === 'failed' ? (
                <AlertCircle className='w-2 h-2 text-red-400' />
              ) : (
                <div className='w-2 h-2 bg-blue-400 rounded-full animate-pulse' />
              )}
              <span className='truncate'>{log.stage}</span>
              {log.duration && (
                <span className='text-white/50'>({log.duration}ms)</span>
              )}
            </div>
          ))}
        </div>
        <div className='mt-2 pt-2 border-t border-white/20 text-xs text-white/60'>
          현재: {currentStage}
        </div>
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

      {/* 하단 개발 정보 */}
      <div className='absolute bottom-4 left-4 z-20 bg-black/30 backdrop-blur-sm rounded-lg p-3 text-xs text-white/70'>
        <div className='flex items-center gap-2'>
          <Database className='w-3 h-3' />
          <span>개발자 도구에서 getSystemBootLogs() 호출로 전체 로그 확인 가능</span>
        </div>
      </div>
    </div>
  );
}
