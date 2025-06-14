'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  progress?: number; // 0-100 for progress notifications
}

export interface ToastOptions {
  type?: ToastNotification['type'];
  duration?: number;
  dismissible?: boolean;
  action?: ToastNotification['action'];
  progress?: number;
}

class ToastManager {
  private static instance: ToastManager;
  private toasts: ToastNotification[] = [];
  private listeners: Set<(toasts: ToastNotification[]) => void> = new Set();
  private idCounter = 0;

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  private generateId(): string {
    return `toast-${++this.idCounter}-${Date.now()}`;
  }

  private notify(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.toasts]);
      } catch (error) {
        console.error('Toast listener error:', error);
      }
    });
  }

  subscribe(listener: (toasts: ToastNotification[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 🎯 토스트 추가 (메인 메서드)
   */
  add(message: string, options: ToastOptions = {}): string {
    const toast: ToastNotification = {
      id: this.generateId(),
      type: options.type || 'info',
      message,
      duration: options.duration ?? (options.type === 'error' ? 7000 : 4000),
      dismissible: options.dismissible ?? true,
      action: options.action,
      progress: options.progress,
    };

    this.toasts.push(toast);
    this.notify();

    // 자동 제거 (duration이 0이 아닌 경우)
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.remove(toast.id);
      }, toast.duration);
    }

    console.log(`🔔 토스트 알림 추가: ${toast.type} - ${message}`);
    return toast.id;
  }

  /**
   * 🗑️ 토스트 제거
   */
  remove(id: string): void {
    const index = this.toasts.findIndex(toast => toast.id === id);
    if (index > -1) {
      this.toasts.splice(index, 1);
      this.notify();
    }
  }

  /**
   * 🧹 모든 토스트 제거
   */
  clear(): void {
    this.toasts = [];
    this.notify();
  }

  /**
   * 🔄 토스트 업데이트 (주로 프로그레스용)
   */
  update(id: string, updates: Partial<ToastNotification>): void {
    const toast = this.toasts.find(t => t.id === id);
    if (toast) {
      Object.assign(toast, updates);
      this.notify();
    }
  }

  // 편의 메서드들
  success(message: string, options?: Omit<ToastOptions, 'type'>): string {
    return this.add(message, { ...options, type: 'success' });
  }

  error(message: string, options?: Omit<ToastOptions, 'type'>): string {
    return this.add(message, { ...options, type: 'error' });
  }

  warning(message: string, options?: Omit<ToastOptions, 'type'>): string {
    return this.add(message, { ...options, type: 'warning' });
  }

  info(message: string, options?: Omit<ToastOptions, 'type'>): string {
    return this.add(message, { ...options, type: 'info' });
  }

  /**
   * 📊 프로그레스 토스트 (자동 복구 등에 사용)
   */
  progress(
    message: string,
    initialProgress = 0
  ): {
    id: string;
    update: (progress: number, newMessage?: string) => void;
    complete: (finalMessage?: string) => void;
    fail: (errorMessage?: string) => void;
  } {
    const id = this.add(message, {
      type: 'info',
      duration: 0, // 수동 제거
      progress: initialProgress,
    });

    return {
      id,
      update: (progress: number, newMessage?: string) => {
        this.update(id, {
          progress: Math.min(100, Math.max(0, progress)),
          message: newMessage || message,
        });
      },
      complete: (finalMessage?: string) => {
        this.update(id, {
          type: 'success',
          message: finalMessage || `${message} - 완료`,
          progress: 100,
          duration: 3000,
        });
        setTimeout(() => this.remove(id), 3000);
      },
      fail: (errorMessage?: string) => {
        this.update(id, {
          type: 'error',
          message: errorMessage || `${message} - 실패`,
          duration: 5000,
        });
        setTimeout(() => this.remove(id), 5000);
      },
    };
  }
}

export const toastManager = ToastManager.getInstance();

// React Hook
export function useToast() {
  return {
    toast: toastManager.add.bind(toastManager),
    success: toastManager.success.bind(toastManager),
    error: toastManager.error.bind(toastManager),
    warning: toastManager.warning.bind(toastManager),
    info: toastManager.info.bind(toastManager),
    progress: toastManager.progress.bind(toastManager),
    clear: toastManager.clear.bind(toastManager),
    remove: toastManager.remove.bind(toastManager),
  };
}

// Toast Container Component
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const handleDismiss = useCallback((id: string) => {
    toastManager.remove(id);
  }, []);

  if (!mounted || typeof window === 'undefined') {
    return null;
  }

  const portalContainer =
    document.getElementById('toast-portal') || document.body;

  return createPortal(
    <div className='fixed top-[70px] sm:top-[80px] left-2 sm:left-4 z-[50000] space-y-3 w-[calc(100%-1rem)] sm:w-80 md:w-96 pointer-events-none'>
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={handleDismiss}
          stackIndex={index}
        />
      ))}
    </div>,
    portalContainer
  );
}

// Individual Toast Item
interface ToastItemProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
  stackIndex?: number;
}

function ToastItem({ toast, onDismiss, stackIndex = 0 }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 150); // 애니메이션 시간
  }, [toast.id, onDismiss]);

  const getTypeStyles = () => {
    const baseStyles =
      'relative p-4 sm:p-5 rounded-xl shadow-lg border pointer-events-auto backdrop-blur-sm transition-all duration-300 hover:shadow-xl';

    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-white dark:bg-slate-800 border-green-500/30 text-green-800 dark:text-green-200 shadow-green-200/50 dark:shadow-green-900/30 ring-1 ring-green-500/20`;
      case 'error':
        return `${baseStyles} bg-white dark:bg-slate-800 border-red-500/30 text-red-800 dark:text-red-200 shadow-red-200/50 dark:shadow-red-900/30 ring-1 ring-red-500/20`;
      case 'warning':
        return `${baseStyles} bg-white dark:bg-slate-800 border-yellow-500/30 text-yellow-800 dark:text-yellow-200 shadow-yellow-200/50 dark:shadow-yellow-900/30 ring-1 ring-yellow-500/20`;
      case 'info':
      default:
        return `${baseStyles} bg-white dark:bg-slate-800 border-blue-500/30 text-blue-800 dark:text-blue-200 shadow-blue-200/50 dark:shadow-blue-900/30 ring-1 ring-blue-500/20`;
    }
  };

  const getIcon = () => {
    const iconClass = 'w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0';

    switch (toast.type) {
      case 'success':
        return (
          <svg
            className={`${iconClass} text-green-500 dark:text-green-400`}
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
              clipRule='evenodd'
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            className={`${iconClass} text-red-500 dark:text-red-400`}
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
              clipRule='evenodd'
            />
          </svg>
        );
      case 'warning':
        return (
          <svg
            className={`${iconClass} text-yellow-500 dark:text-yellow-400`}
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
              clipRule='evenodd'
            />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg
            className={`${iconClass} text-blue-500 dark:text-blue-400`}
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
              clipRule='evenodd'
            />
          </svg>
        );
    }
  };

  return (
    <div
      className={`
        ${getTypeStyles()}
        transform transition-all duration-300 ease-in-out
        ${isExiting ? 'translate-x-full opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100'}
        hover:scale-[1.02] hover:shadow-2xl cursor-pointer w-full
        ${stackIndex > 0 ? 'mt-3' : ''}
      `}
      style={{
        marginBottom: stackIndex > 0 ? '4px' : '0px',
        zIndex: 50000 - stackIndex,
      }}
      onClick={toast.dismissible ? handleDismiss : undefined}
    >
      {/* 프로그레스 바 (있는 경우) */}
      {typeof toast.progress === 'number' && (
        <div className='absolute top-0 left-0 h-1.5 bg-black/10 dark:bg-white/10 rounded-t-xl overflow-hidden'>
          <div
            className='h-full bg-current transition-all duration-300 rounded-t-xl'
            style={{ width: `${toast.progress}%` }}
          />
        </div>
      )}

      <div className='flex items-start space-x-4'>
        {/* 아이콘 */}
        <div className='flex-shrink-0 mt-0.5'>{getIcon()}</div>

        {/* 메시지 */}
        <div className='flex-1 min-w-0'>
          <p className='text-sm sm:text-base font-medium leading-6 break-words text-black dark:text-white'>
            {toast.message}
          </p>

          {/* 액션 버튼 */}
          {toast.action && (
            <button
              onClick={e => {
                e.stopPropagation();
                toast.action!.onClick();
              }}
              className='mt-3 text-sm font-semibold underline hover:no-underline focus:outline-none transition-colors'
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* 닫기 버튼 */}
        {toast.dismissible && (
          <button
            onClick={e => {
              e.stopPropagation();
              handleDismiss();
            }}
            className='flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1.5 transition-all duration-200'
            title='알림 닫기'
          >
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                clipRule='evenodd'
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
