'use client';

import CollapsibleCard from '@/components/shared/CollapsibleCard';
import { SystemAlert } from '@/domains/ai-sidebar/types';
import { useDashboardToggleStore } from '@/stores/useDashboardToggleStore';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface SystemEvent {
  id: string;
  time: string;
  action: string;
  server: string;
  icon: React.ReactNode;
}

// 📦 모의 알림 (SSE 실패 시 폴백)
const generateMockAlerts = (): SystemAlert[] => [];

const getAlertColor = (type: SystemAlert['type']) => {
  switch (type) {
    case 'error':
      return 'border-red-500/50 bg-red-500/10';
    case 'warning':
      return 'border-yellow-500/50 bg-yellow-500/10';
    case 'info':
      return 'border-blue-500/50 bg-blue-500/10';
    case 'success':
      return 'border-green-500/50 bg-green-500/10';
    default:
      return 'border-gray-500/50 bg-gray-500/10';
  }
};

const getAlertIcon = (type: SystemAlert['type']) => {
  switch (type) {
    case 'error':
      return <AlertTriangle className='w-5 h-5 text-red-500' />;
    case 'warning':
      return <AlertOctagon className='w-5 h-5 text-yellow-500' />;
    case 'info':
      return <Activity className='w-5 h-5 text-blue-500' />;
    case 'success':
      return <CheckCircle className='w-5 h-5 text-green-500' />;
    default:
      return <Activity className='w-5 h-5 text-gray-500' />;
  }
};

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}초 전`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
};

export default function LiveSystemAlerts() {
  const { sections, toggleSection } = useDashboardToggleStore();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const rotationRef = useRef<NodeJS.Timeout | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const visibilityTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  // SystemEvent 상태 추가
  const [events, setEvents] = useState<SystemEvent[]>([
    {
      id: '1',
      time: '15:42',
      action: 'Server restart',
      server: 'WEB-01',
      icon: <Activity className='w-4 h-4 text-blue-500' />,
    },
    {
      id: '2',
      time: '15:38',
      action: 'High memory',
      server: 'DB-02',
      icon: <AlertTriangle className='w-4 h-4 text-yellow-500' />,
    },
    {
      id: '3',
      time: '15:35',
      action: 'Service down',
      server: 'API-03',
      icon: <XCircle className='w-4 h-4 text-red-500' />,
    },
    {
      id: '4',
      time: '15:30',
      action: 'Backup started',
      server: 'All servers',
      icon: <Database className='w-4 h-4 text-green-500' />,
    },
  ]);

  useEffect(() => {
    if (!isConnected) return;

    // 🔄 EventSource 대신 polling 방식으로 변경
    const pollAlerts = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const data = await response.json();

          // 서버 상태에서 알림 추출
          const newAlerts: any[] = [];

          if (data.servers) {
            data.servers.forEach((server: any) => {
              if (server.status === 'critical') {
                newAlerts.push({
                  id: `${server.id}-critical`,
                  type: 'error',
                  message: `서버 ${server.name}에 심각한 문제가 발생했습니다`,
                  timestamp: new Date().toISOString(),
                  serverId: server.id,
                });
              } else if (server.status === 'warning') {
                newAlerts.push({
                  id: `${server.id}-warning`,
                  type: 'warning',
                  message: `서버 ${server.name}에 주의가 필요합니다`,
                  timestamp: new Date().toISOString(),
                  serverId: server.id,
                });
              }
            });
          }

          setAlerts(newAlerts);
        }
      } catch (error) {
        console.error('알림 조회 실패:', error);
      }
    };

    // 초기 로드
    pollAlerts();

    // 15초마다 폴링
    const pollInterval = setInterval(pollAlerts, 15000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [isConnected]);

  // 5초마다 알림 로테이션
  useEffect(() => {
    if (rotationRef.current) clearInterval(rotationRef.current);
    if (alerts.length === 0) return;

    rotationRef.current = setInterval(() => {
      setCurrentAlertIndex(idx => (idx + 1) % alerts.length);
    }, 5000);

    return () => {
      if (rotationRef.current) clearInterval(rotationRef.current);
    };
  }, [alerts]);

  const currentAlert = alerts[currentAlertIndex];

  return (
    <div className='h-full flex flex-col space-y-4'>
      {/* Live System Alerts */}
      <CollapsibleCard
        title='Live System Alerts'
        subtitle='실시간 알림'
        icon={
          <div className='p-2 bg-red-100 rounded-lg'>
            <AlertTriangle className='w-6 h-6 text-red-600' />
          </div>
        }
        isExpanded={sections.liveSystemAlerts}
        onToggle={() => toggleSection('liveSystemAlerts')}
        variant='bordered'
      >
        <div className='h-32 overflow-hidden relative'>
          <AnimatePresence mode='wait'>
            {currentAlert && (
              <motion.div
                key={currentAlert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className={`absolute inset-0 p-4 rounded-lg border ${getAlertColor(currentAlert.type)}`}
              >
                <div className='flex items-start gap-3 h-full'>
                  <div className='flex-shrink-0 mt-1'>
                    {getAlertIcon(currentAlert.type)}
                  </div>
                  <div className='flex-1 min-w-0 flex flex-col justify-between h-full'>
                    <div>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className='font-semibold text-sm'>
                          {currentAlert.type.toUpperCase()}
                        </span>
                        <span className='text-xs text-gray-600'>•</span>
                        <span className='text-sm font-medium'>
                          {(currentAlert as any).server || 'System'}
                        </span>
                      </div>
                      <p
                        className='text-sm font-medium mb-1 truncate'
                        title={currentAlert.title}
                      >
                        {currentAlert.title}
                      </p>
                    </div>
                    <p className='text-xs text-gray-600 self-end'>
                      {formatTimeAgo(currentAlert.timestamp)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title='Recent System Events'
        subtitle='최근 시스템 이벤트'
        icon={
          <div className='p-2 bg-blue-100 rounded-lg'>
            <Clock className='w-6 h-6 text-blue-600' />
          </div>
        }
        isExpanded={sections.recentEvents}
        onToggle={() => toggleSection('recentEvents')}
        variant='bordered'
      >
        <div className='space-y-3'>
          {events.map(event => (
            <div key={event.id} className='flex items-center text-sm'>
              <span className='w-12 text-gray-500'>{event.time}</span>
              <span className='mr-2'>{event.icon}</span>
              <span className='flex-1 truncate'>
                {event.action} on <strong>{event.server}</strong>
              </span>
            </div>
          ))}
        </div>
      </CollapsibleCard>
    </div>
  );
}
