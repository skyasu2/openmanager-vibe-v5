/**
 * 🚀 Advanced Notification System
 *
 * 고급 알림 시스템 - 슬랙 연동 제외한 모든 일반 알림 처리
 * 모달과 블러 배경 위에서도 확실히 표시되는 최고 우선순위 알림
 *
 * @created 2025-07-02
 * @author AI Assistant
 */

'use client';

// CSS 애니메이션 keyframes 추가
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shrinkWidth {
      from { width: 100%; }
      to { width: 0%; }
    }
  `;
  if (!document.head.querySelector('style[data-notification-animations]')) {
    style.setAttribute('data-notification-animations', 'true');
    document.head.appendChild(style);
  }
}

// framer-motion 제거 - CSS 애니메이션 사용
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { logger } from '@/lib/logging';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface AdvancedNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'system';
  title: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date;
}

class AdvancedNotificationManager {
  private static instance: AdvancedNotificationManager;
  private notifications: AdvancedNotification[] = [];
  private listeners: Set<(notifications: AdvancedNotification[]) => void> =
    new Set();
  private idCounter = 0;

  static getInstance(): AdvancedNotificationManager {
    if (!AdvancedNotificationManager.instance) {
      AdvancedNotificationManager.instance = new AdvancedNotificationManager();
    }
    return AdvancedNotificationManager.instance;
  }

  private generateId(): string {
    return `adv-notif-${Date.now()}-${++this.idCounter}`;
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      listener([...this.notifications]);
    });
  }

  subscribe(
    listener: (notifications: AdvancedNotification[]) => void
  ): () => void {
    this.listeners.add(listener);
    listener([...this.notifications]);

    return () => {
      this.listeners.delete(listener);
    };
  }

  add(notification: Omit<AdvancedNotification, 'id' | 'timestamp'>): string {
    const newNotification: AdvancedNotification = {
      id: this.generateId(),
      timestamp: new Date(),
      priority: 'normal',
      duration: 5000,
      dismissible: true,
      ...notification,
    };

    // 우선순위에 따라 정렬하여 삽입
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    const insertIndex = this.notifications.findIndex(
      (n) =>
        priorityOrder[n.priority || 'normal'] >
        priorityOrder[newNotification.priority || 'normal']
    );

    if (insertIndex === -1) {
      this.notifications.push(newNotification);
    } else {
      this.notifications.splice(insertIndex, 0, newNotification);
    }

    this.notify();

    // 자동 제거 (duration이 0이 아닌 경우)
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.remove(newNotification.id);
      }, newNotification.duration);
    }

    logger.info(
      `🔔 고급 알림 추가: ${newNotification.type} - ${newNotification.title}`
    );
    return newNotification.id;
  }

  remove(id: string): void {
    const index = this.notifications.findIndex(
      (notification) => notification.id === id
    );
    if (index > -1) {
      this.notifications.splice(index, 1);
      this.notify();
    }
  }

  clear(): void {
    this.notifications = [];
    this.notify();
  }

  // 편의 메서드들
  success(
    title: string,
    message: string,
    options?: Partial<AdvancedNotification>
  ): string {
    return this.add({ ...options, type: 'success', title, message });
  }

  error(
    title: string,
    message: string,
    options?: Partial<AdvancedNotification>
  ): string {
    return this.add({
      ...options,
      type: 'error',
      title,
      message,
      priority: 'high',
      duration: 8000,
    });
  }

  warning(
    title: string,
    message: string,
    options?: Partial<AdvancedNotification>
  ): string {
    return this.add({
      ...options,
      type: 'warning',
      title,
      message,
      duration: 6000,
    });
  }

  info(
    title: string,
    message: string,
    options?: Partial<AdvancedNotification>
  ): string {
    return this.add({ ...options, type: 'info', title, message });
  }

  system(
    title: string,
    message: string,
    options?: Partial<AdvancedNotification>
  ): string {
    return this.add({
      ...options,
      type: 'system',
      title,
      message,
      priority: 'critical',
      duration: 0, // 수동으로만 닫기
    });
  }
}

export const advancedNotificationManager =
  AdvancedNotificationManager.getInstance();

// React Hook
export function useAdvancedNotifications() {
  return {
    notify: advancedNotificationManager.add.bind(advancedNotificationManager),
    success: advancedNotificationManager.success.bind(
      advancedNotificationManager
    ),
    error: advancedNotificationManager.error.bind(advancedNotificationManager),
    warning: advancedNotificationManager.warning.bind(
      advancedNotificationManager
    ),
    info: advancedNotificationManager.info.bind(advancedNotificationManager),
    system: advancedNotificationManager.system.bind(
      advancedNotificationManager
    ),
    clear: advancedNotificationManager.clear.bind(advancedNotificationManager),
    remove: advancedNotificationManager.remove.bind(
      advancedNotificationManager
    ),
  };
}

// Notification Item Component
interface NotificationItemProps {
  notification: AdvancedNotification;
  onDismiss: (id: string) => void;
  index: number;
}

function NotificationItem({
  notification,
  onDismiss,
  index,
}: NotificationItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    if (!notification.dismissible) return;
    setIsExiting(true);
    setTimeout(() => onDismiss(notification.id), 300);
  }, [notification.id, notification.dismissible, onDismiss]);

  const getTypeStyles = () => {
    const baseStyles = 'relative overflow-hidden';

    switch (notification.type) {
      case 'success':
        return {
          container: `${baseStyles} bg-green-600/90 border border-green-500/50`,
          icon: <CheckCircle className="h-5 w-5 text-white" />,
          accent: 'bg-green-500',
          textColor: 'text-white',
        };
      case 'error':
        return {
          container: `${baseStyles} bg-red-600/90 border border-red-500/50`,
          icon: <XCircle className="h-5 w-5 text-white" />,
          accent: 'bg-red-500',
          textColor: 'text-white',
        };
      case 'warning':
        return {
          container: `${baseStyles} bg-yellow-600/90 border border-yellow-500/50`,
          icon: <AlertTriangle className="h-5 w-5 text-white" />,
          accent: 'bg-yellow-500',
          textColor: 'text-white',
        };
      case 'system':
        return {
          container: `${baseStyles} bg-purple-600/90 border border-purple-500/50`,
          icon: <Activity className="h-5 w-5 text-white" />,
          accent: 'bg-purple-500',
          textColor: 'text-white',
        };
      default:
        return {
          container: `${baseStyles} bg-blue-600/90 border border-blue-500/50`,
          icon: <Info className="h-5 w-5 text-white" />,
          accent: 'bg-blue-500',
          textColor: 'text-white',
        };
    }
  };

  const getPriorityIndicator = () => {
    switch (notification.priority) {
      case 'critical':
        return <Zap className="animate-pulse h-3 w-3 text-red-500" />;
      case 'high':
        return (
          <div className="animate-pulse h-2 w-2 rounded-full bg-orange-500" />
        );
      case 'low':
        return <div className="h-2 w-2 rounded-full bg-gray-400" />;
      default:
        return null;
    }
  };

  const styles = getTypeStyles();
  const interactiveProps = notification.dismissible
    ? {
        role: 'button' as const,
        tabIndex: 0,
        onClick: handleDismiss,
        onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleDismiss();
          }
        },
      }
    : {};

  return (
    <div
      className={`${styles.container} min-w-80 max-w-96 transform rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02] ${notification.dismissible ? 'cursor-pointer' : ''} pointer-events-auto mb-4 ${isExiting ? 'animate-out fade-out-0 zoom-out-95 slide-out-to-right-1/2' : 'animate-in fade-in-0 zoom-in-95 slide-in-from-right-1/2'}`}
      style={{
        zIndex: 99990 - index,
        boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.2)',
        transform: `translateY(${-index * 5}px)`,
      }}
      {...interactiveProps}
    >
      {/* 우선순위 표시 바 */}
      <div className={`absolute left-0 right-0 top-0 h-1 ${styles.accent}`} />

      <div className="p-4">
        {/* 헤더 */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="shrink-0">{styles.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h3
                  className={`text-sm font-semibold ${styles.textColor} truncate`}
                >
                  {notification.title}
                </h3>
                {getPriorityIndicator()}
              </div>
              <p className={`text-xs ${styles.textColor} mt-1 opacity-90`}>
                {notification.message}
              </p>
            </div>
          </div>

          {notification.dismissible && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="ml-2 shrink-0 rounded-full p-1 transition-colors hover:bg-white/20"
            >
              <X className="h-4 w-4 text-white opacity-70 hover:opacity-100" />
            </button>
          )}
        </div>

        {/* 액션 버튼 */}
        {notification.action && (
          <div className="mt-3 flex justify-end border-t border-white/20 pt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                notification.action?.onClick();
                handleDismiss();
              }}
              className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/30"
            >
              {notification.action.label}
            </button>
          </div>
        )}

        {/* 시간 표시 */}
        <div
          className={`mt-3 flex items-center justify-between text-xs ${styles.textColor} opacity-75`}
        >
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>
              {notification.timestamp.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          {notification.priority && notification.priority !== 'normal' && (
            <span className="font-medium uppercase">
              {notification.priority}
            </span>
          )}
        </div>

        {/* 자동 닫힘 프로그레스 바 */}
        {notification.duration && notification.duration > 0 && (
          <div
            className="absolute bottom-0 left-0 h-1 rounded-b-xl bg-white/40 transition-all ease-linear"
            style={{
              animation: `shrinkWidth ${notification.duration / 1000}s linear`,
              width: '100%',
            }}
          />
        )}
      </div>
    </div>
  );
}

// Main Container Component
export function AdvancedNotificationContainer() {
  const [notifications, setNotifications] = useState<AdvancedNotification[]>(
    []
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = advancedNotificationManager.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const handleDismiss = useCallback((id: string) => {
    advancedNotificationManager.remove(id);
  }, []);

  const handleClearAll = useCallback(() => {
    advancedNotificationManager.clear();
  }, []);

  if (!mounted || typeof window === 'undefined') {
    return null;
  }

  const portalContainer =
    document.getElementById('advanced-notification-portal') || document.body;

  return createPortal(
    <div className="pointer-events-none fixed right-4 top-4 z-99999">
      {/* 전체 알림 제어 */}
      {notifications.length > 1 && (
        <div className="pointer-events-auto mb-4">
          <button
            onClick={handleClearAll}
            className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-2 text-xs font-medium text-white shadow-2xl backdrop-blur-xl transition-all duration-200 hover:bg-gray-800"
          >
            모든 알림 닫기 ({notifications.length})
          </button>
        </div>
      )}

      {/* 알림 목록 */}
      <div className="pointer-events-auto space-y-2">
        {notifications.map((notification, index) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={handleDismiss}
            index={index}
          />
        ))}
      </div>
    </div>,
    portalContainer
  );
}
