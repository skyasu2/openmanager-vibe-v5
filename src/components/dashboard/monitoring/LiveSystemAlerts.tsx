'use client';

import CollapsibleCard from '@/components/shared/CollapsibleCard';

// SystemAlert type definition (moved from admin)
interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  source: string;
  isClosable: boolean;
}

// framer-motion 제거 - CSS 애니메이션 사용
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  XCircle,
} from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useDashboardToggleStore } from '@/stores/useDashboardToggleStore';

interface SystemEvent {
  id: string;
  time: string;
  action: string;
  server: string;
  icon: ReactNode;
}

// 📦 모의 알림 (SSE 실패 시 폴백)
const _generateMockAlerts = (): SystemAlert[] => [];

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
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <AlertOctagon className="h-5 w-5 text-yellow-500" />;
    case 'info':
      return <Activity className="h-5 w-5 text-blue-500" />;
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    default:
      return <Activity className="h-5 w-5 text-gray-500" />;
  }
};

const formatTimeAgo = (date: string | Date): string => {
  const targetDate = date instanceof Date ? date : new Date(date);
  const seconds = Math.floor((Date.now() - targetDate.getTime()) / 1000);
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
  const _esRef = useRef<EventSource | null>(null);
  const _visibilityTimeout = useRef<NodeJS.Timeout | null>(null);
  const [_isConnected, _setIsConnected] = useState(true);

  // SystemEvent 상태 추가
  const [events, _setEvents] = useState<SystemEvent[]>([
    {
      id: '1',
      time: '15:42',
      action: 'Server restart',
      server: 'WEB-01',
      icon: <Activity className="h-4 w-4 text-blue-500" />,
    },
    {
      id: '2',
      time: '15:38',
      action: 'High memory',
      server: 'DB-02',
      icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    },
    {
      id: '3',
      time: '15:35',
      action: 'Service down',
      server: 'API-03',
      icon: <XCircle className="h-4 w-4 text-red-500" />,
    },
    {
      id: '4',
      time: '15:30',
      action: 'Backup started',
      server: 'All servers',
      icon: <Database className="h-4 w-4 text-green-500" />,
    },
  ]);

  useEffect(() => {
    if (!_isConnected) return;

    // 🔄 EventSource 대신 polling 방식으로 변경
    const pollAlerts = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const data = await response.json();

          // 서버 상태에서 알림 추출
          const newAlerts: SystemAlert[] = [];

          if (data.servers && Array.isArray(data.servers)) {
            data.servers.forEach((server: unknown) => {
              if (typeof server === 'object' && server !== null) {
                const s = server as {
                  id?: string;
                  name?: string;
                  status?: string;
                };
                if (s.status === 'critical') {
                  newAlerts.push({
                    id: `${s.id ?? 'unknown'}-critical`,
                    type: 'error',
                    title: `서버 ${s.name ?? '알 수 없음'} 오류`,
                    message: `서버 ${s.name ?? '알 수 없음'}에 심각한 문제가 발생했습니다`,
                    timestamp: new Date().toISOString(),
                    source: 'system',
                    isClosable: true,
                  });
                } else if (s.status === 'warning') {
                  newAlerts.push({
                    id: `${s.id}-warning`,
                    type: 'warning',
                    title: `서버 ${s.name} 경고`,
                    message: `서버 ${s.name}에 주의가 필요합니다`,
                    timestamp: new Date().toISOString(),
                    source: 'system',
                    isClosable: true,
                  });
                }
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
    void pollAlerts();

    // 60초마다 폴링 (포트폴리오 무료 티어 최적화)
    const pollInterval = setInterval(() => {
      void pollAlerts();
    }, 60000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [_isConnected]);

  // 5초마다 알림 로테이션
  useEffect(() => {
    if (rotationRef.current) clearInterval(rotationRef.current);
    if (alerts.length === 0) return;

    rotationRef.current = setInterval(() => {
      setCurrentAlertIndex((idx) => (idx + 1) % alerts.length);
    }, 5000);

    return () => {
      if (rotationRef.current) clearInterval(rotationRef.current);
    };
  }, [alerts]);

  const currentAlert = alerts[currentAlertIndex];

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Live System Alerts */}
      <CollapsibleCard
        title="Live System Alerts"
        subtitle="실시간 알림"
        icon={
          <div className="rounded-lg bg-red-100 p-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        }
        isExpanded={sections.liveSystemAlerts}
        onToggle={() => toggleSection('liveSystemAlerts')}
        variant="bordered"
      >
        <div className="relative h-32 overflow-hidden">
          {currentAlert && (
            <div
              key={currentAlert.id}
              className={`absolute inset-0 rounded-lg border p-4 ${getAlertColor(currentAlert.type)}`}
            >
              <div className="flex h-full items-start gap-3">
                <div className="mt-1 shrink-0">
                  {getAlertIcon(currentAlert.type)}
                </div>
                <div className="flex h-full min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {currentAlert.type.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-600">•</span>
                      <span className="text-sm font-medium">
                        {(currentAlert as SystemAlert & { server?: string })
                          .server || 'System'}
                      </span>
                    </div>
                    <p
                      className="mb-1 truncate text-sm font-medium"
                      title={currentAlert.title}
                    >
                      {currentAlert.title}
                    </p>
                  </div>
                  <p className="self-end text-xs text-gray-600">
                    {formatTimeAgo(currentAlert.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Recent System Events"
        subtitle="최근 시스템 이벤트"
        icon={
          <div className="rounded-lg bg-blue-100 p-2">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
        }
        isExpanded={sections.recentEvents}
        onToggle={() => toggleSection('recentEvents')}
        variant="bordered"
      >
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="flex items-center text-sm">
              <span className="w-12 text-gray-500">{event.time}</span>
              <span className="mr-2">{event.icon}</span>
              <span className="flex-1 truncate">
                {event.action} on <strong>{event.server}</strong>
              </span>
            </div>
          ))}
        </div>
      </CollapsibleCard>
    </div>
  );
}
