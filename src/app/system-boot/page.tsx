'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import SystemBootSequence from '@/components/dashboard/transition/SystemBootSequence';

export default function SystemBootPage() {
  const router = useRouter();

  const handleBootComplete = () => {
    console.log('🎉 시스템 로딩 완료 - 대시보드로 이동');
    router.push('/dashboard');
  };

  // 더미 서버 데이터
  const dummyServers = [
    {
      id: '1',
      name: 'Server 1',
      status: 'online' as const,
      cpu: 45,
      memory: 60,
      disk: 35,
      uptime: '7d 12h',
      location: 'Seoul',
      alerts: 0,
      lastUpdate: new Date(),
      services: [],
    },
    {
      id: '2',
      name: 'Server 2',
      status: 'online' as const,
      cpu: 30,
      memory: 45,
      disk: 50,
      uptime: '2d 8h',
      location: 'Tokyo',
      alerts: 1,
      lastUpdate: new Date(),
      services: [],
    },
    {
      id: '3',
      name: 'Server 3',
      status: 'warning' as const,
      cpu: 80,
      memory: 85,
      disk: 70,
      uptime: '12h 30m',
      location: 'Singapore',
      alerts: 2,
      lastUpdate: new Date(),
      services: [],
    },
  ];

  return (
    <SystemBootSequence
      servers={dummyServers}
      onBootComplete={handleBootComplete}
      autoStart={true}
      skipAnimation={false}
    />
  );
}
