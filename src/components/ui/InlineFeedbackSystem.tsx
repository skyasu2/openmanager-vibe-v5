/**
 * 🎯 Inline Feedback System
 *
 * 블러 효과 없는 깔끔한 인라인 피드백 시스템
 * 토스트 알림을 대체하여 더 직관적이고 사용자 친화적인 피드백 제공
 *
 * @created 2025-06-03
 * @author AI Assistant
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';

export interface InlineFeedback {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  message: string;
  duration?: number;
  persistent?: boolean; // 지속적으로 표시할지 여부
}

class InlineFeedbackManager {
  private static instance: InlineFeedbackManager;
  private feedbacks: Map<string, InlineFeedback> = new Map();
  private listeners: Set<(feedbacks: Map<string, InlineFeedback>) => void> =
    new Set();
  private idCounter = 0;

  static getInstance(): InlineFeedbackManager {
    if (!InlineFeedbackManager.instance) {
      InlineFeedbackManager.instance = new InlineFeedbackManager();
    }
    return InlineFeedbackManager.instance;
  }

  private generateId(): string {
    return `inline-feedback-${Date.now()}-${++this.idCounter}`;
  }

  private notify(): void {
    this.listeners.forEach(listener => {
      listener(new Map(this.feedbacks));
    });
  }

  subscribe(
    listener: (feedbacks: Map<string, InlineFeedback>) => void
  ): () => void {
    this.listeners.add(listener);
    listener(new Map(this.feedbacks));

    return () => {
      this.listeners.delete(listener);
    };
  }

  // 특정 영역에 피드백 표시
  showFeedback(
    area: string,
    type: InlineFeedback['type'],
    message: string,
    options?: {
      duration?: number;
      persistent?: boolean;
    }
  ): string {
    const feedback: InlineFeedback = {
      id: this.generateId(),
      type,
      message,
      duration: options?.duration ?? (type === 'loading' ? 0 : 3000),
      persistent: options?.persistent ?? false,
    };

    this.feedbacks.set(area, feedback);
    this.notify();

    // 자동 제거 (duration이 0이 아니고 persistent가 false인 경우)
    if (feedback.duration && feedback.duration > 0 && !feedback.persistent) {
      setTimeout(() => {
        this.clearFeedback(area);
      }, feedback.duration);
    }

    return feedback.id;
  }

  // 특정 영역의 피드백 제거
  clearFeedback(area: string): void {
    this.feedbacks.delete(area);
    this.notify();
  }

  // 모든 피드백 제거
  clearAll(): void {
    this.feedbacks.clear();
    this.notify();
  }

  // 편의 메서드들
  success(
    area: string,
    message: string,
    options?: { duration?: number; persistent?: boolean }
  ): string {
    return this.showFeedback(area, 'success', message, options);
  }

  error(
    area: string,
    message: string,
    options?: { duration?: number; persistent?: boolean }
  ): string {
    return this.showFeedback(area, 'error', message, options);
  }

  warning(
    area: string,
    message: string,
    options?: { duration?: number; persistent?: boolean }
  ): string {
    return this.showFeedback(area, 'warning', message, options);
  }

  info(
    area: string,
    message: string,
    options?: { duration?: number; persistent?: boolean }
  ): string {
    return this.showFeedback(area, 'info', message, options);
  }

  loading(area: string, message: string): string {
    return this.showFeedback(area, 'loading', message, {
      duration: 0,
      persistent: true,
    });
  }
}

export const inlineFeedbackManager = InlineFeedbackManager.getInstance();

// React Hook
export function useInlineFeedback() {
  return {
    success: inlineFeedbackManager.success.bind(inlineFeedbackManager),
    error: inlineFeedbackManager.error.bind(inlineFeedbackManager),
    warning: inlineFeedbackManager.warning.bind(inlineFeedbackManager),
    info: inlineFeedbackManager.info.bind(inlineFeedbackManager),
    loading: inlineFeedbackManager.loading.bind(inlineFeedbackManager),
    clear: inlineFeedbackManager.clearFeedback.bind(inlineFeedbackManager),
    clearAll: inlineFeedbackManager.clearAll.bind(inlineFeedbackManager),
  };
}

// 개별 피드백 컴포넌트
interface FeedbackDisplayProps {
  feedback: InlineFeedback;
  compact?: boolean;
}

function FeedbackDisplay({ feedback, compact = false }: FeedbackDisplayProps) {
  const getStyles = () => {
    const baseStyles = compact
      ? 'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium'
      : 'flex items-center gap-3 p-3 rounded-lg';

    switch (feedback.type) {
      case 'success':
        return {
          container: `${baseStyles} bg-green-50 text-green-800 border border-green-200`,
          icon: (
            <CheckCircle
              className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-green-600`}
            />
          ),
        };
      case 'error':
        return {
          container: `${baseStyles} bg-red-50 text-red-800 border border-red-200`,
          icon: (
            <XCircle
              className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-red-600`}
            />
          ),
        };
      case 'warning':
        return {
          container: `${baseStyles} bg-yellow-50 text-yellow-800 border border-yellow-200`,
          icon: (
            <AlertTriangle
              className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-yellow-600`}
            />
          ),
        };
      case 'loading':
        return {
          container: `${baseStyles} bg-blue-50 text-blue-800 border border-blue-200`,
          icon: (
            <Loader2
              className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600 animate-spin`}
            />
          ),
        };
      case 'info':
      default:
        return {
          container: `${baseStyles} bg-blue-50 text-blue-800 border border-blue-200`,
          icon: (
            <Info
              className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`}
            />
          ),
        };
    }
  };

  const styles = getStyles();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      className={styles.container}
    >
      {styles.icon}
      <span className={compact ? 'text-sm' : 'text-sm font-medium'}>
        {feedback.message}
      </span>
    </motion.div>
  );
}

// 특정 영역에 피드백을 표시하는 컨테이너
interface InlineFeedbackContainerProps {
  area: string;
  compact?: boolean;
  className?: string;
}

export function InlineFeedbackContainer({
  area,
  compact = false,
  className = '',
}: InlineFeedbackContainerProps) {
  const [feedbacks, setFeedbacks] = useState<Map<string, InlineFeedback>>(
    new Map()
  );

  useEffect(() => {
    const unsubscribe = inlineFeedbackManager.subscribe(setFeedbacks);
    return unsubscribe;
  }, []);

  const feedback = feedbacks.get(area);

  if (!feedback) return null;

  return (
    <div className={`${className}`}>
      <AnimatePresence mode='wait'>
        <FeedbackDisplay
          key={feedback.id}
          feedback={feedback}
          compact={compact}
        />
      </AnimatePresence>
    </div>
  );
}

// 상태 배지 컴포넌트
interface StatusBadgeProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  children?: React.ReactNode;
  className?: string;
}

export function StatusBadge({
  status,
  children,
  className = '',
}: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'loading':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className='w-3 h-3 animate-spin' />;
      case 'success':
        return <CheckCircle className='w-3 h-3' />;
      case 'error':
        return <XCircle className='w-3 h-3' />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      key={status}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyles()} ${className}`}
    >
      {getStatusIcon()}
      {children}
    </motion.div>
  );
}

// 버튼 상태 래퍼 컴포넌트
interface ButtonWithFeedbackProps {
  children: React.ReactNode;
  onClick: () => Promise<void> | void;
  successMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function ButtonWithFeedback({
  children,
  onClick,
  successMessage = '완료되었습니다',
  errorMessage = '오류가 발생했습니다',
  loadingMessage = '처리 중...',
  className = '',
  disabled = false,
}: ButtonWithFeedbackProps) {
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const feedbackArea = `button-${Date.now()}`;
  const { success, error, loading, clear } = useInlineFeedback();

  const handleClick = async () => {
    if (disabled || status === 'loading') return;

    try {
      setStatus('loading');
      loading(feedbackArea, loadingMessage);

      await onClick();

      setStatus('success');
      success(feedbackArea, successMessage);

      // 3초 후 상태 초기화
      setTimeout(() => {
        setStatus('idle');
        clear(feedbackArea);
      }, 3000);
    } catch (err) {
      setStatus('error');
      error(feedbackArea, errorMessage);

      // 5초 후 상태 초기화
      setTimeout(() => {
        setStatus('idle');
        clear(feedbackArea);
      }, 5000);
    }
  };

  return (
    <div className='space-y-2'>
      <motion.button
        onClick={handleClick}
        disabled={disabled || status === 'loading'}
        className={`${className} ${
          status === 'loading' ? 'opacity-75 cursor-not-allowed' : ''
        }`}
        whileHover={status !== 'loading' ? { scale: 1.02 } : {}}
        whileTap={status !== 'loading' ? { scale: 0.98 } : {}}
      >
        {children}
      </motion.button>

      <InlineFeedbackContainer area={feedbackArea} compact />
    </div>
  );
}
