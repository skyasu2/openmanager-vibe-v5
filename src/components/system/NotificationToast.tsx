/**
 * 🔔 실시간 알림 토스트 컴포넌트 (리팩토링됨)
 *
 * ✅ 기능:
 * - 브라우저 네이티브 알림과 통합
 * - 서버 모니터링 전용 웹 알림
 * - 강화된 중복 방지 시스템
 * - Vercel 환경 최적화
 * - 자동 사라짐 및 애니메이션
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  MessageSquare,
  Server,
  Shield,
} from 'lucide-react';
import {
  useSystemIntegration,
  SystemEvent,
} from '@/hooks/useSystemIntegration';
import {
  browserNotificationService,
  sendServerAlert,
  requestNotificationPermission,
} from '@/services/notifications/BrowserNotificationService';

interface NotificationToastProps {
  className?: string;
  maxNotifications?: number;
  autoHideDuration?: number;
  enableSound?: boolean;
  enableBrowserNotifications?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

interface DisplayNotification extends SystemEvent {
  isVisible: boolean;
  hideTimer?: NodeJS.Timeout;
}

/**
 * 🎨 심각도별 스타일 매핑
 */
const getSeverityStyle = (severity: SystemEvent['severity']) => {
  const styles = {
    critical: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-900',
      icon: 'text-red-600',
      accent: 'bg-red-500',
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-900',
      icon: 'text-yellow-600',
      accent: 'bg-yellow-500',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-900',
      icon: 'text-blue-600',
      accent: 'bg-blue-500',
    },
  };
  return styles[severity] || styles.info;
};

/**
 * 🔔 이벤트 타입별 아이콘 매핑
 */
const getEventIcon = (
  type: SystemEvent['type'],
  severity: SystemEvent['severity']
) => {
  const iconProps = { className: `w-5 h-5 ${getSeverityStyle(severity).icon}` };

  switch (type) {
    case 'connection_change':
      return <Wifi {...iconProps} />;
    case 'pattern_detected':
      return <Activity {...iconProps} />;
    case 'data_cleaned':
      return <Database {...iconProps} />;
    case 'notification_sent':
      return <MessageSquare {...iconProps} />;
    case 'error':
      return <AlertTriangle {...iconProps} />;
    case 'server_alert':
      return <Server {...iconProps} />;
    case 'security':
      return <Shield {...iconProps} />;
    default:
      return severity === 'critical' ? (
        <AlertTriangle {...iconProps} />
      ) : severity === 'warning' ? (
        <AlertTriangle {...iconProps} />
      ) : (
        <Info {...iconProps} />
      );
  }
};

/**
 * 🔔 알림 토스트 메인 컴포넌트
 */
export const NotificationToast: React.FC<NotificationToastProps> = ({
  className = '',
  maxNotifications = 5,
  autoHideDuration = 5000,
  enableSound = true,
  enableBrowserNotifications = true,
  position = 'top-right',
}) => {
  const [notifications, setNotifications] = useState<DisplayNotification[]>([]);
  const [browserPermissionRequested, setBrowserPermissionRequested] =
    useState(false);
  const { subscribeToEvents } = useSystemIntegration();
  const lastNotificationRef = useRef<string>('');
  const duplicateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 🔊 알림 사운드 재생
   */
  const playNotificationSound = useCallback(
    (severity: SystemEvent['severity']) => {
      if (!enableSound || typeof window === 'undefined') return;

      try {
        // Web Audio API를 사용한 간단한 비프음
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // 심각도별 주파수 설정
        const frequency =
          severity === 'critical' ? 800 : severity === 'warning' ? 600 : 400;
        oscillator.frequency.setValueAtTime(
          frequency,
          audioContext.currentTime
        );
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.3
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
        console.warn('알림 사운드 재생 실패:', error);
      }
    },
    [enableSound]
  );

  /**
   * 🚨 브라우저 네이티브 알림 처리
   */
  const handleBrowserNotification = useCallback(
    async (event: SystemEvent) => {
      if (!enableBrowserNotifications) return;

      // 서버 관련 심각한 상황만 브라우저 알림
      const shouldSendBrowserNotification =
        (event.severity === 'critical' || event.severity === 'warning') &&
        (event.type === 'server_alert' ||
          event.type === 'error' ||
          event.type === 'pattern_detected' ||
          event.message.toLowerCase().includes('서버') ||
          event.message.toLowerCase().includes('장애') ||
          event.message.toLowerCase().includes('오류'));

      if (shouldSendBrowserNotification) {
        await sendServerAlert({
          title: `OpenManager - ${event.severity === 'critical' ? '긴급' : '경고'}`,
          message: event.message,
          severity: event.severity,
          serverId: event.metadata?.serverId,
          type: event.type,
          tag: `openmanager-${event.type}-${event.severity}`,
        });
      }
    },
    [enableBrowserNotifications]
  );

  /**
   * 🔍 중복 알림 검사 (강화됨)
   */
  const isDuplicateNotification = useCallback(
    (event: SystemEvent): boolean => {
      const eventKey = `${event.type}-${event.severity}-${event.message.substring(0, 50)}`;

      // 최근 알림과 비교
      if (lastNotificationRef.current === eventKey) {
        return true;
      }

      // 기존 알림 목록에서 중복 검사 (최근 30초 이내)
      const now = Date.now();
      const isDuplicate = notifications.some(notif => {
        const notifKey = `${notif.type}-${notif.severity}-${notif.message.substring(0, 50)}`;
        const timeDiff = now - notif.timestamp.getTime();
        return notifKey === eventKey && timeDiff < 30000; // 30초 제한
      });

      return isDuplicate;
    },
    [notifications]
  );

  /**
   * 📝 알림 추가 (리팩토링됨)
   */
  const addNotification = useCallback(
    async (event: SystemEvent) => {
      // 시스템 초기화 관련 일반 info 알림은 조용하게 처리
      if (
        event.severity === 'info' &&
        event.type === 'connection_change' &&
        (event.message.includes('초기화') ||
          event.message.includes('시작') ||
          event.message.includes('준비'))
      ) {
        console.log('🔕 시스템 초기화 알림 무음 처리:', event.message);
        return; // Toast 알림 생략
      }

      // 중복 방지 검사
      if (isDuplicateNotification(event)) {
        console.log('🔄 중복 알림 방지:', event.message);
        return;
      }

      // 브라우저 네이티브 알림 처리
      await handleBrowserNotification(event);

      const displayNotification: DisplayNotification = {
        ...event,
        isVisible: true,
      };

      setNotifications(prev => {
        // 🛡️ 안전한 배열 처리
        const safeArray = Array.isArray(prev) ? prev : [];

        // 최대 개수 제한
        const newNotifications = [displayNotification, ...safeArray].slice(
          0,
          maxNotifications
        );

        // 🛡️ 안전한 정렬 및 타이머 설정
        const validNotifications = newNotifications.filter(
          notif =>
            notif && typeof notif === 'object' && notif.id && notif.severity
        );

        // 기존 알림들의 타이머 업데이트
        validNotifications.forEach((notif, index) => {
          if (notif.hideTimer) {
            clearTimeout(notif.hideTimer);
          }

          // 새로운 타이머 설정
          notif.hideTimer = setTimeout(
            () => {
              removeNotification(notif.id);
            },
            autoHideDuration + index * 200
          ); // 스택된 알림은 조금 더 오래 유지
        });

        return validNotifications;
      });

      // 중복 방지를 위한 키 저장
      const eventKey = `${event.type}-${event.severity}-${event.message.substring(0, 50)}`;
      lastNotificationRef.current = eventKey;

      // 중복 방지 키 초기화 타이머
      if (duplicateTimeoutRef.current) {
        clearTimeout(duplicateTimeoutRef.current);
      }
      duplicateTimeoutRef.current = setTimeout(() => {
        lastNotificationRef.current = '';
      }, 30000); // 30초 후 초기화

      // 사운드 재생
      playNotificationSound(event.severity);
    },
    [
      maxNotifications,
      autoHideDuration,
      playNotificationSound,
      isDuplicateNotification,
      handleBrowserNotification,
    ]
  );

  /**
   * 🗑️ 알림 제거
   */
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const safeArray = Array.isArray(prev) ? prev : [];
      return safeArray.filter(notif => {
        if (notif.id === id) {
          if (notif.hideTimer) {
            clearTimeout(notif.hideTimer);
          }
          return false;
        }
        return true;
      });
    });
  }, []);

  /**
   * 🎯 포지션별 스타일 계산
   */
  const getPositionStyle = () => {
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
    };
    return positions[position] || positions['top-right'];
  };

  // 🔔 이벤트 구독
  useEffect(() => {
    const unsubscribe = subscribeToEvents(addNotification);
    return unsubscribe;
  }, [subscribeToEvents, addNotification]);

  // 🔐 브라우저 알림 권한 요청 (한 번만)
  useEffect(() => {
    if (enableBrowserNotifications && !browserPermissionRequested) {
      setBrowserPermissionRequested(true);
      setTimeout(() => {
        requestNotificationPermission().then(permission => {
          console.log('🔔 브라우저 알림 권한:', permission);
        });
      }, 5000); // 5초 후 권한 요청 (사용자 경험 고려)
    }
  }, [enableBrowserNotifications, browserPermissionRequested]);

  // 🧹 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      notifications.forEach(notif => {
        if (notif.hideTimer) {
          clearTimeout(notif.hideTimer);
        }
      });
      if (duplicateTimeoutRef.current) {
        clearTimeout(duplicateTimeoutRef.current);
      }
    };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div
      className={`fixed ${getPositionStyle()} z-50 pointer-events-none ${className}`}
    >
      <div className='space-y-3 max-w-sm w-full'>
        <AnimatePresence>
          {notifications.map((notification, index) => {
            const style = getSeverityStyle(notification.severity);

            return (
              <motion.div
                key={notification.id}
                initial={{
                  opacity: 0,
                  x: position.includes('right') ? 100 : -100,
                  scale: 0.8,
                }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  x: position.includes('right') ? 100 : -100,
                  scale: 0.8,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                  delay: index * 0.1,
                }}
                className={`
                  ${style.bg} border-l-4 ${style.accent} border-t border-r border-b
                  rounded-lg shadow-lg p-4 pointer-events-auto
                  backdrop-blur-sm bg-opacity-95
                  hover:shadow-xl transition-shadow duration-200
                `}
              >
                <div className='flex items-start space-x-3'>
                  {/* 아이콘 */}
                  <div className='flex-shrink-0 mt-0.5'>
                    {getEventIcon(notification.type, notification.severity)}
                  </div>

                  {/* 내용 */}
                  <div className='flex-1 min-w-0'>
                    <div className={`text-sm font-medium ${style.text}`}>
                      {notification.message}
                    </div>
                    <div className='text-xs text-gray-500 mt-1 flex items-center space-x-2'>
                      <span>{notification.source}</span>
                      <span>•</span>
                      <span>
                        {new Intl.DateTimeFormat('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        }).format(notification.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* 닫기 버튼 */}
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className={`
                      flex-shrink-0 rounded-full p-1 
                      ${style.icon} hover:bg-black hover:bg-opacity-10
                      transition-colors duration-150
                    `}
                  >
                    <X className='w-4 h-4' />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NotificationToast;
