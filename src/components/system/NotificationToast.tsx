/**
 * 🔔 알림 토스트 컴포넌트 (전역 시스템 연동)
 *
 * 특징:
 * - 서버 데이터 생성기 심각/경고 알림만 처리
 * - 전역 상태에 서버 알림 보고
 * - 시스템 초기화 관련 일반 알림 무시
 * - 최대 3개 알림으로 제한
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useGlobalSystemStore } from '@/stores/systemStore';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface DisplayNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  serverId?: string;
  serverName?: string;
  timestamp: number;
}

export const NotificationToast: React.FC = () => {
  const [notifications, setNotifications] = useState<DisplayNotification[]>([]);
  const { reportServerNotification, isSessionActive } = useGlobalSystemStore();

  const maxNotifications = 3; // 5개→3개로 축소

  // 시스템 이벤트 리스너 (서버 알림만 처리)
  useEffect(() => {
    const handleSystemEvent = (event: CustomEvent) => {
      const { type, level, message, serverId, serverName } = event.detail;

      // 서버 데이터 생성기 알림만 처리
      if (type !== 'server_alert') return;

      // 시스템 초기화 관련 일반 알림 무시
      if (level === 'info' && message.includes('초기화')) return;

      // Critical/Warning 알림만 처리
      if (level !== 'critical' && level !== 'warning') return;

      const notification: DisplayNotification = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: getNotificationTitle(level),
        message: message,
        type: level === 'critical' ? 'error' : 'warning',
        serverId,
        serverName,
        timestamp: Date.now(),
      };

      // 전역 상태에 서버 알림 보고 (웹 알림 발송)
      if (isSessionActive && serverId && serverName) {
        const status = level === 'critical' ? 'critical' : 'warning';
        reportServerNotification(serverId, serverName, status);
      }

      setNotifications(prev => {
        const newNotifications = [notification, ...prev].slice(
          0,
          maxNotifications
        );
        return newNotifications;
      });

      // 자동 제거 (Critical: 10초, Warning: 5초)
      const autoRemoveTime = level === 'critical' ? 10000 : 5000;
      setTimeout(() => {
        removeNotification(notification.id);
      }, autoRemoveTime);
    };

    window.addEventListener('system-event', handleSystemEvent as EventListener);
    return () => {
      window.removeEventListener(
        'system-event',
        handleSystemEvent as EventListener
      );
    };
  }, [reportServerNotification, isSessionActive]);

  const getNotificationTitle = (level: string): string => {
    switch (level) {
      case 'critical':
        return '🚨 심각한 문제 발생';
      case 'warning':
        return '⚠️ 주의 필요';
      case 'success':
        return '✅ 성공';
      case 'info':
      default:
        return '📋 알림';
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className='w-5 h-5 text-green-500' />;
      case 'warning':
        return <AlertTriangle className='w-5 h-5 text-yellow-500' />;
      case 'error':
        return <AlertTriangle className='w-5 h-5 text-red-500' />;
      case 'info':
      default:
        return <Info className='w-5 h-5 text-blue-500' />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className='fixed top-4 right-4 z-50 space-y-2'>
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`
            ${getBackgroundColor(notification.type)}
            border rounded-lg p-4 shadow-lg max-w-sm
            transform transition-all duration-300 ease-in-out
            _animate-in slide-in-from-right-full
          `}
        >
          <div className='flex items-start gap-3'>
            {getIcon(notification.type)}
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-semibold text-gray-900'>
                {notification.title}
              </p>
              <p className='text-sm text-gray-700 mt-1'>
                {notification.message}
              </p>
              {notification.serverName && (
                <p className='text-xs text-gray-500 mt-1'>
                  서버: {notification.serverName}
                </p>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className='text-gray-400 hover:text-gray-600 transition-colors'
              title='알림 닫기'
              aria-label='알림 닫기'
            >
              <X className='w-4 h-4' />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
