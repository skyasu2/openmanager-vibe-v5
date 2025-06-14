'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Wifi,
  Database,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CollapsibleCard from '@/components/shared/CollapsibleCard';
import { useDashboardToggleStore } from '@/stores/useDashboardToggleStore';

interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'resolved';
  title: string;
  server: string;
  message: string;
  timestamp: Date;
  icon: React.ReactNode;
}

interface SystemEvent {
  id: string;
  time: string;
  action: string;
  server: string;
  icon: React.ReactNode;
}

export default function LiveSystemAlerts() {
  const { sections, toggleSection } = useDashboardToggleStore();
  const [alerts, setAlerts] = useState<SystemAlert[]>([
    {
      id: '1',
      type: 'critical',
      title: 'High CPU Usage',
      server: 'DB-01',
      message: 'CPU usage at 95%',
      timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2분 전
      icon: <Database className='w-4 h-4' />,
    },
    {
      id: '2',
      type: 'warning',
      title: 'Memory Warning',
      server: 'WEB-03',
      message: 'Memory usage at 85%',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5분 전
      icon: <Activity className='w-4 h-4' />,
    },
    {
      id: '3',
      type: 'resolved',
      title: 'Disk Space',
      server: 'API-02',
      message: 'Disk space issue resolved',
      timestamp: new Date(Date.now() - 12 * 60 * 1000), // 12분 전
      icon: <CheckCircle className='w-4 h-4' />,
    },
  ]);

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

  const getAlertColor = (type: SystemAlert['type']) => {
    switch (type) {
      case 'critical':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'resolved':
        return 'border-green-200 bg-green-50 text-green-800';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'critical':
        return <XCircle className='w-4 h-4 text-red-500' />;
      case 'warning':
        return <AlertTriangle className='w-4 h-4 text-yellow-500' />;
      case 'resolved':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      default:
        return <AlertTriangle className='w-4 h-4 text-gray-500' />;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - timestamp.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes === 1) return '1 minute ago';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return '1 hour ago';
    return `${diffInHours} hours ago`;
  };

  return (
    <div className='h-full flex flex-col space-y-4'>
      {/* Live System Alerts */}
      <CollapsibleCard
        title="Live System Alerts"
        subtitle="실시간 알림"
        icon={
          <div className='p-2 bg-red-100 rounded-lg'>
            <AlertTriangle className='w-6 h-6 text-red-600' />
          </div>
        }
        isExpanded={sections.liveSystemAlerts}
        onToggle={() => toggleSection('liveSystemAlerts')}
        variant="bordered"
      >
        <div className='space-y-3 max-h-48 overflow-auto'>
          <AnimatePresence>
            {alerts.map(alert => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-3 rounded-lg border ${getAlertColor(alert.type)} transition-all duration-200`}
              >
                <div className='flex items-start gap-3'>
                  <div className='flex-shrink-0 mt-0.5'>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className='font-semibold text-sm'>
                        {alert.type.toUpperCase()}
                      </span>
                      <span className='text-xs text-gray-600'>•</span>
                      <span className='text-sm font-medium'>
                        {alert.server}
                      </span>
                    </div>
                    <p className='text-sm font-medium mb-1'>{alert.title}</p>
                    <p className='text-xs text-gray-600'>
                      {formatTimeAgo(alert.timestamp)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CollapsibleCard>

      {/* Recent System Events */}
      <CollapsibleCard
        title="최근 시스템 이벤트"
        subtitle="Recent Events"
        icon={
          <div className='p-2 bg-blue-100 rounded-lg'>
            <Clock className='w-6 h-6 text-blue-600' />
          </div>
        }
        isExpanded={sections.recentEvents}
        onToggle={() => toggleSection('recentEvents')}
        variant="bordered"
      >
        <div className='space-y-3 max-h-48 overflow-auto'>
          {events.map(event => (
            <div
              key={event.id}
              className='flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors'
            >
              <div className='flex-shrink-0'>{event.icon}</div>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium text-gray-900'>
                    {event.time}
                  </span>
                  <span className='text-xs text-gray-400'>•</span>
                  <span className='text-sm text-gray-700'>
                    {event.action}
                  </span>
                </div>
                <p className='text-xs text-gray-500'>{event.server}</p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleCard>

      {/* Network & Performance */}
      <CollapsibleCard
        title="네트워크 & 성능"
        subtitle="Network Stats"
        icon={
          <div className='p-2 bg-green-100 rounded-lg'>
            <Wifi className='w-6 h-6 text-green-600' />
          </div>
        }
        isExpanded={sections.networkStats}
        onToggle={() => toggleSection('networkStats')}
        variant="bordered"
      >
        <div className='space-y-4'>
          {/* Response Times */}
          <div>
            <h4 className='text-sm font-medium text-gray-700 mb-2'>
              Response Times
            </h4>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-gray-600'>🟢 &lt; 100ms</span>
                <span className='text-xs font-medium'>5 servers</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-gray-600'>🟡 100-500ms</span>
                <span className='text-xs font-medium'>2 servers</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-gray-600'>🔴 &gt; 500ms</span>
                <span className='text-xs font-medium'>1 server</span>
              </div>
            </div>
          </div>

          {/* Network Traffic */}
          <div>
            <h4 className='text-sm font-medium text-gray-700 mb-2'>
              Network Traffic
            </h4>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-gray-600'>↗ Inbound</span>
                <span className='text-xs font-medium'>45 MB/s</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-gray-600'>↙ Outbound</span>
                <span className='text-xs font-medium'>23 MB/s</span>
              </div>
            </div>
          </div>

          {/* Active Connections */}
          <div>
            <h4 className='text-sm font-medium text-gray-700 mb-2'>
              Active Connections
            </h4>
            <div className='flex items-center justify-between'>
              <span className='text-xs text-gray-600'>🔗 Total</span>
              <span className='text-xs font-medium'>1,247</span>
            </div>
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}
