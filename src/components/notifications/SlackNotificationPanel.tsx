/**
 * 🔔 슬랙 전용 알림 패널 v2.0 - 단일 채널 특화
 *
 * #server-alerts 채널 전용:
 * - 채널 선택 로직 제거
 * - 단순화된 API 호출
 * - 향상된 에러 처리
 * - 15초 타임아웃 적용
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  ExternalLink,
  Clock,
  MessageSquare,
  Hash,
} from 'lucide-react';

// 단일 채널 고정
const SLACK_CHANNEL = '#server-alerts';

// 슬랙 알림 인터페이스 (단순화)
interface SlackNotification {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  status: 'sending' | 'sent' | 'failed';
  slackMessageId?: string;
}

// 향상된 fetch 함수 (타임아웃 및 에러 처리)
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout = 15000
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error(`요청 타임아웃 (${timeout}ms 초과)`);
    }

    throw error;
  }
};

// 단일 채널 슬랙 알림 훅
export const useSlackNotifications = () => {
  const [notifications, setNotifications] = useState<SlackNotification[]>([]);

  const sendSlackNotification = async (data: {
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }) => {
    const notification: SlackNotification = {
      id: crypto.randomUUID(),
      message: data.message,
      severity: data.severity,
      timestamp: new Date(),
      status: 'sending',
    };

    // 즉시 UI에 표시
    setNotifications(prev => [notification, ...prev].slice(0, 10)); // 최대 10개

    try {
      // 개선된 API 호출
      const result = await fetchWithTimeout(
        '/api/slack/send',
        {
          method: 'POST',
          body: JSON.stringify({
            message: data.message,
            severity: data.severity,
          }),
        },
        15000
      ); // 15초 타임아웃

      if (result.success) {
        // 성공 상태로 업데이트
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id
              ? { ...n, status: 'sent', slackMessageId: result.messageId }
              : n
          )
        );
      } else {
        throw new Error(result.error || '전송 실패');
      }
    } catch (error) {
      console.error('슬랙 알림 전송 실패:', error);

      // 실패 상태로 업데이트
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, status: 'failed' } : n
        )
      );
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return { notifications, sendSlackNotification, removeNotification };
};

// 개별 슬랙 알림 아이템 (단순화)
const SlackNotificationItem: React.FC<{
  notification: SlackNotification;
  onDismiss: (id: string) => void;
}> = ({ notification, onDismiss }) => {
  const severityConfig = {
    critical: {
      color: 'border-red-500',
      icon: AlertTriangle,
      text: 'text-red-100',
      bg: 'bg-red-900/30',
      iconColor: 'text-red-400',
    },
    high: {
      color: 'border-orange-500',
      icon: AlertTriangle,
      text: 'text-orange-100',
      bg: 'bg-orange-900/30',
      iconColor: 'text-orange-400',
    },
    medium: {
      color: 'border-blue-500',
      icon: Info,
      text: 'text-blue-100',
      bg: 'bg-blue-900/30',
      iconColor: 'text-blue-400',
    },
    low: {
      color: 'border-gray-500',
      icon: Info,
      text: 'text-gray-100',
      bg: 'bg-gray-900/30',
      iconColor: 'text-gray-400',
    },
  };

  const config = severityConfig[notification.severity];
  const SeverityIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className={`${config.bg} border-l-4 ${config.color} rounded-r-lg mb-3 backdrop-blur-sm overflow-hidden`}
    >
      <div className='p-4'>
        <div className='flex items-start space-x-3'>
          {/* 슬랙 아이콘 */}
          <div className='flex-shrink-0'>
            <div className='w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center shadow-lg'>
              <MessageSquare className='w-4 h-4 text-white' />
            </div>
          </div>

          {/* 메시지 내용 */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-center space-x-2 mb-2'>
              <SeverityIcon className={`w-4 h-4 ${config.iconColor}`} />
              <span className='text-sm font-medium text-purple-300 flex items-center'>
                <Hash className='w-3 h-3 mr-1' />
                server-alerts
              </span>
              <div className='flex items-center space-x-1'>
                {notification.status === 'sending' && (
                  <>
                    <Clock className='w-3 h-3 text-yellow-400 animate-pulse' />
                    <span className='text-xs text-yellow-400'>전송 중...</span>
                  </>
                )}
                {notification.status === 'sent' && (
                  <>
                    <CheckCircle className='w-3 h-3 text-green-400' />
                    <span className='text-xs text-green-400'>전송됨</span>
                  </>
                )}
                {notification.status === 'failed' && (
                  <>
                    <X className='w-3 h-3 text-red-400' />
                    <span className='text-xs text-red-400'>실패</span>
                  </>
                )}
              </div>
            </div>

            <p className={`text-sm ${config.text} leading-relaxed mb-3`}>
              {notification.message}
            </p>

            <div className='flex items-center justify-between'>
              <span className='text-xs text-white/50'>
                {notification.timestamp.toLocaleTimeString('ko-KR')}
              </span>

              <div className='flex items-center space-x-2'>
                {notification.status === 'sent' && (
                  <button
                    className='text-xs text-purple-300 hover:text-purple-200 underline flex items-center space-x-1 transition-colors'
                    onClick={() => window.open('https://slack.com', '_blank')}
                  >
                    <span>Slack에서 보기</span>
                    <ExternalLink className='w-3 h-3' />
                  </button>
                )}

                <button
                  onClick={() => onDismiss(notification.id)}
                  className='text-white/40 hover:text-white/70 transition-colors p-1'
                >
                  <X className='w-3 h-3' />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// 메인 슬랙 알림 패널
export const SlackNotificationPanel: React.FC = () => {
  const { notifications, sendSlackNotification, removeNotification } =
    useSlackNotifications();
  const [slackStatus, setSlackStatus] = useState<any>(null);

  // 슬랙 상태 확인 (개선된 에러 처리)
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // 개선된 상태 확인
        const result = await fetchWithTimeout('/api/slack/send', {}, 10000);

        if (result.success) {
          setSlackStatus({ ...result.data, enabled: true });
        } else {
          setSlackStatus({ enabled: false, error: result.error });
        }
      } catch (error) {
        console.error('슬랙 상태 확인 실패:', error);
        setSlackStatus({
          enabled: false,
          error: error instanceof Error ? error.message : '상태 확인 실패',
        });
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 15000); // 15초마다 상태 확인

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = (id: string) => {
    removeNotification(id);
  };

  // 단일 채널 테스트 메시지들
  const testMessages = [
    {
      label: '🚨 긴급',
      message: '🚨 Web-Server-01 CPU 사용률 95% - 즉시 확인 필요!',
      severity: 'critical' as const,
    },
    {
      label: '⚠️ 경고',
      message: '⚠️ DB-Server-02 메모리 사용률 87% - 주의 필요',
      severity: 'high' as const,
    },
    {
      label: '📊 정보',
      message: '📊 AI 분석 완료 - 모든 서버 정상 상태 확인',
      severity: 'medium' as const,
    },
    {
      label: '🧪 테스트',
      message: '🧪 OpenManager Vibe v5 슬랙 연동 테스트',
      severity: 'low' as const,
    },
  ];

  const handleTestAlert = async (
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ) => {
    await sendSlackNotification({ message, severity });
  };

  return (
    <div className='max-w-md mx-auto'>
      {/* 헤더 */}
      <div className='flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 backdrop-blur-lg rounded-xl border border-purple-500/30'>
        <div className='flex items-center space-x-2'>
          <div className='w-6 h-6 bg-purple-600 rounded flex items-center justify-center'>
            <Hash className='w-4 h-4 text-white' />
          </div>
          <h3 className='text-white font-semibold'>server-alerts</h3>
          <div
            className={`w-2 h-2 rounded-full ${slackStatus?.enabled ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}
          ></div>
          <span className='text-xs text-white/70'>
            {slackStatus?.enabled ? '연결됨' : '비활성화'}
          </span>
        </div>

        {/* 테스트 버튼들 (컬러로 구분) */}
        <div className='flex space-x-1'>
          {testMessages.map((test, index) => (
            <button
              key={index}
              onClick={() => handleTestAlert(test.message, test.severity)}
              className={`px-2 py-1 text-xs text-white rounded transition-colors ${
                test.severity === 'critical'
                  ? 'bg-red-600 hover:bg-red-700'
                  : test.severity === 'high'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : test.severity === 'medium'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-600 hover:bg-gray-700'
              }`}
              title={test.message}
            >
              {test.label.split(' ')[0]} {/* 이모지만 표시 */}
            </button>
          ))}
        </div>
      </div>

      {/* 알림 목록 */}
      <div className='space-y-2'>
        {notifications.length === 0 ? (
          <div className='text-center py-8 px-4 bg-gray-900/30 rounded-lg border border-gray-700/50'>
            <div className='w-12 h-12 bg-purple-600/30 rounded-lg mx-auto mb-3 flex items-center justify-center'>
              <Hash className='w-6 h-6 text-purple-400' />
            </div>
            <p className='text-sm text-white/60 mb-2'>
              아직 #server-alerts 알림이 없습니다
            </p>
            <p className='text-xs text-white/40'>
              위의 테스트 버튼으로 슬랙 연동을 체험해보세요
            </p>
          </div>
        ) : (
          <AnimatePresence mode='popLayout'>
            {notifications.map(notification => (
              <SlackNotificationItem
                key={notification.id}
                notification={notification}
                onDismiss={handleDismiss}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* 통계 정보 */}
      {slackStatus && (
        <div className='mt-4 p-3 bg-gray-900/30 rounded-lg border border-gray-700/50'>
          <div className='flex justify-between text-xs text-white/60'>
            <span>총 전송: {slackStatus.alertsSent || 0}개</span>
            <span>채널: {SLACK_CHANNEL}</span>
          </div>
          {slackStatus.error && (
            <div className='text-xs text-red-400 mt-1'>
              오류: {slackStatus.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SlackNotificationPanel;
