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
  XCircle
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface SystemEvent {
  id: string;
  time: string;
  action: string;
  server: string;
  icon: React.ReactNode;
}

interface LiveSystemAlertsProps {
  className?: string;
}

// 📦 모의 알림 제거 (실제 API 호출로 대체)
// const generateMockAlerts = (): SystemAlert[] => [];

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

export default function LiveSystemAlerts({
  className = ''
}: LiveSystemAlertsProps) {
  const { sections, toggleSection } = useDashboardToggleStore();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const rotationRef = useRef<NodeJS.Timeout | null>(null);
  const [eventSourceRef, setEventSourceRef] = useState<EventSource | null>(null);
  const visibilityTimeout = useRef<NodeJS.Timeout | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

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
    // 🚀 실제 시스템 알림 SSE 연결
    const connectToAlertsStream = () => {
      if (typeof window === 'undefined' || eventSourceRef) return eventSourceRef;

      const eventSource = new EventSource('/api/alerts/stream');
      setEventSourceRef(eventSource);

      eventSource.onmessage = (event) => {
        try {
          const alertData = JSON.parse(event.data);
          if (alertData.type === 'alert') {
            setAlerts(prev => [alertData.data, ...prev.slice(0, 49)]);
            setLastUpdate(new Date());
          }
        } catch (error) {
          console.error('알림 스트림 파싱 오류:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('알림 스트림 연결 오류:', error);
        eventSource.close();
        setEventSourceRef(null);

        // 📊 실제 알림 API 호출로 폴백
        fetch('/api/alerts?limit=20')
          .then(res => res.json())
          .then(data => {
            if (data.success && data.alerts) {
              setAlerts(data.alerts);
              setLastUpdate(new Date());
            }
          })
          .catch(err => {
            console.error('알림 API 호출 실패:', err);
            setAlerts([]); // 빈 배열로 설정
          });
      };

      return eventSource;
    };

    const eventSource = connectToAlertsStream();

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        // 30초 이상 백그라운드 → SSE 닫기
        visibilityTimeout.current = setTimeout(() => {
          if (eventSourceRef) {
            eventSourceRef.close();
            setEventSourceRef(null);
          }
        }, 30000);
      } else {
        if (visibilityTimeout.current) {
          clearTimeout(visibilityTimeout.current);
          visibilityTimeout.current = null;
        }
        // 보이는 상태이고 SSE 닫혀 있으면 재연결
        if (!eventSourceRef) {
          connectToAlertsStream();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (eventSourceRef) {
        eventSourceRef.close();
        setEventSourceRef(null);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [eventSourceRef]);

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
