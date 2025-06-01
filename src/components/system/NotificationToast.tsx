/**
 * 🔔 실시간 알림 토스트 컴포넌트
 * 
 * ✅ 기능:
 * - Phase 1 + 2.1 모듈 이벤트 실시간 표시
 * - 자동 사라짐 (5초)
 * - 심각도별 색상 구분
 * - 애니메이션 및 사운드 효과
 * - 스택형 다중 알림 지원
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X, 
  Bell,
  Activity,
  Database,
  Wifi,
  MessageSquare
} from 'lucide-react';
import { useSystemIntegration, SystemEvent } from '@/hooks/useSystemIntegration';

interface NotificationToastProps {
  className?: string;
  maxNotifications?: number;
  autoHideDuration?: number;
  enableSound?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

interface DisplayNotification extends SystemEvent {
  isVisible: boolean;
  hideTimer?: NodeJS.Timeout;
}

/**
 * 🎨 심각도별 스타일 가져오기
 */
const getSeverityStyles = (severity: SystemEvent['severity']) => {
  switch (severity) {
    case 'critical':
      return {
        bgColor: 'bg-red-500',
        borderColor: 'border-red-500',
        textColor: 'text-red-50',
        icon: AlertTriangle,
        iconColor: 'text-red-100'
      };
    case 'warning':
      return {
        bgColor: 'bg-yellow-500',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-50',
        icon: AlertTriangle,
        iconColor: 'text-yellow-100'
      };
    case 'info':
    default:
      return {
        bgColor: 'bg-blue-500',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-50',
        icon: CheckCircle,
        iconColor: 'text-blue-100'
      };
  }
};

/**
 * 🎭 이벤트 타입별 아이콘 가져오기
 */
const getEventTypeIcon = (type: SystemEvent['type']) => {
  switch (type) {
    case 'pattern_detected':
      return Activity;
    case 'notification_sent':
      return MessageSquare;
    case 'data_cleaned':
      return Database;
    case 'connection_change':
      return Wifi;
    case 'error':
    default:
      return AlertTriangle;
  }
};

/**
 * 🔔 개별 알림 컴포넌트
 */
const ToastNotification: React.FC<{
  notification: DisplayNotification;
  onDismiss: (id: string) => void;
  index: number;
}> = ({ notification, onDismiss, index }) => {
  const styles = getSeverityStyles(notification.severity);
  const EventTypeIcon = getEventTypeIcon(notification.type);
  const SeverityIcon = styles.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 400, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        scale: 1,
        y: -index * 10 // 스택 효과
      }}
      exit={{ 
        opacity: 0, 
        x: 400, 
        scale: 0.8,
        transition: { duration: 0.2 }
      }}
      className={`
        ${styles.bgColor} ${styles.borderColor} ${styles.textColor}
        relative min-w-80 max-w-96 p-4 rounded-lg shadow-lg border-l-4
        backdrop-blur-sm bg-opacity-95
        mb-2 cursor-pointer
        transform transition-all duration-200 hover:scale-105
      `}
      style={{ zIndex: 8999 - index }}
      onClick={() => onDismiss(notification.id)}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <EventTypeIcon className={`w-4 h-4 ${styles.iconColor}`} />
            <SeverityIcon className={`w-4 h-4 ${styles.iconColor}`} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
            {notification.type.replace('_', ' ')}
          </span>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(notification.id);
          }}
          className={`${styles.iconColor} hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors`}
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* 메시지 */}
      <div className="text-sm font-medium mb-2">
        {notification.message}
      </div>

      {/* 메타데이터 (있는 경우) */}
      {notification.metadata && (
        <div className="text-xs opacity-75 bg-black bg-opacity-20 rounded px-2 py-1 mb-2">
          {typeof notification.metadata === 'string' 
            ? notification.metadata 
            : JSON.stringify(notification.metadata, null, 2)
          }
        </div>
      )}

      {/* 시간 */}
      <div className="text-xs opacity-60 flex items-center justify-between">
        <span>
          {notification.timestamp.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </span>
        <span className="flex items-center space-x-1">
          <Bell className="w-3 h-3" />
          <span>클릭하여 닫기</span>
        </span>
      </div>

      {/* 프로그레스 바 (자동 닫힘 표시) */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-white bg-opacity-30 rounded-b-lg"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 5, ease: 'linear' }}
      />
    </motion.div>
  );
};

/**
 * 🔔 알림 토스트 메인 컴포넌트
 */
export const NotificationToast: React.FC<NotificationToastProps> = ({
  className = '',
  maxNotifications = 5,
  autoHideDuration = 5000,
  enableSound = true,
  position = 'top-right'
}) => {
  const [notifications, setNotifications] = useState<DisplayNotification[]>([]);
  const { subscribeToEvents } = useSystemIntegration();

  /**
   * 🔊 알림 사운드 재생
   */
  const playNotificationSound = useCallback((severity: SystemEvent['severity']) => {
    if (!enableSound || typeof window === 'undefined') return;

    try {
      // Web Audio API를 사용한 간단한 비프음
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // 심각도별 주파수 설정
      const frequency = severity === 'critical' ? 800 : severity === 'warning' ? 600 : 400;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('알림 사운드 재생 실패:', error);
    }
  }, [enableSound]);

  /**
   * 📝 알림 추가
   */
  const addNotification = useCallback((event: SystemEvent) => {
    const displayNotification: DisplayNotification = {
      ...event,
      isVisible: true
    };

    setNotifications(prev => {
      // 최대 개수 제한
      const newNotifications = [displayNotification, ...prev].slice(0, maxNotifications);
      
      // 기존 알림들의 타이머 업데이트
      newNotifications.forEach((notif, index) => {
        if (notif.hideTimer) {
          clearTimeout(notif.hideTimer);
        }
        
        // 새로운 타이머 설정
        notif.hideTimer = setTimeout(() => {
          removeNotification(notif.id);
        }, autoHideDuration + (index * 200)); // 스택된 알림은 조금 더 오래 유지
      });

      return newNotifications;
    });

    // 사운드 재생
    playNotificationSound(event.severity);
  }, [maxNotifications, autoHideDuration, playNotificationSound]);

  /**
   * 🗑️ 알림 제거
   */
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification?.hideTimer) {
        clearTimeout(notification.hideTimer);
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  /**
   * 🗑️ 모든 알림 제거
   */
  const clearAllNotifications = useCallback(() => {
    notifications.forEach(notification => {
      if (notification.hideTimer) {
        clearTimeout(notification.hideTimer);
      }
    });
    setNotifications([]);
  }, [notifications]);

  /**
   * 🔔 이벤트 구독 설정
   */
  useEffect(() => {
    const unsubscribe = subscribeToEvents(addNotification);
    return unsubscribe;
  }, [subscribeToEvents, addNotification]);

  /**
   * 🧹 컴포넌트 언마운트 시 타이머 정리
   */
  useEffect(() => {
    return () => {
      notifications.forEach(notification => {
        if (notification.hideTimer) {
          clearTimeout(notification.hideTimer);
        }
      });
    };
  }, [notifications]);

  /**
   * 📍 위치별 스타일 계산
   */
  const getPositionStyles = () => {
    const base = 'fixed z-[8000] pointer-events-none';
    
    switch (position) {
      case 'top-left':
        return `${base} top-4 left-4`;
      case 'bottom-right':
        return `${base} bottom-4 right-4`;
      case 'bottom-left':
        return `${base} bottom-4 left-4`;
      case 'top-right':
      default:
        return `${base} top-4 right-4`;
    }
  };

  const handleClose = useCallback((id: string) => {
    removeNotification(id);
  }, [removeNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className={`${getPositionStyles()} ${className}`}>
      {/* 전체 알림 제어 */}
      {notifications.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 pointer-events-auto"
        >
          <button
            onClick={clearAllNotifications}
            className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-1 rounded-full 
                       transition-colors duration-200 shadow-lg backdrop-blur-sm"
          >
            모든 알림 닫기 ({notifications.length})
          </button>
        </motion.div>
      )}

      {/* 알림 목록 */}
      <div className="pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification, index) => (
            <ToastNotification
              key={notification.id}
              notification={notification}
              onDismiss={handleClose}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NotificationToast; 