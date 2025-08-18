/**
 * 🔔 간단한 토스트 알림 시스템
 */

'use client';

import { useState, useEffect } from 'react';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

const toastStore: {
  toasts: ToastMessage[];
  listeners: Set<() => void>;
} = {
  toasts: [],
  listeners: new Set(),
};

const notify = () => {
  toastStore.listeners.forEach((listener) => listener());
};

export const toast = {
  success: (message: string, duration = 3000) => {
    const id = Date.now().toString();
    toastStore.toasts.push({ id, message, type: 'success', duration });
    notify();
    setTimeout(() => {
      toastStore.toasts = toastStore.toasts.filter((t) => t.id !== id);
      notify();
    }, duration);
  },
  error: (message: string, duration = 5000) => {
    const id = Date.now().toString();
    toastStore.toasts.push({ id, message, type: 'error', duration });
    notify();
    setTimeout(() => {
      toastStore.toasts = toastStore.toasts.filter((t) => t.id !== id);
      notify();
    }, duration);
  },
  warning: (message: string, duration = 4000) => {
    const id = Date.now().toString();
    toastStore.toasts.push({ id, message, type: 'warning', duration });
    notify();
    setTimeout(() => {
      toastStore.toasts = toastStore.toasts.filter((t) => t.id !== id);
      notify();
    }, duration);
  },
  info: (message: string, duration = 3000) => {
    const id = Date.now().toString();
    toastStore.toasts.push({ id, message, type: 'info', duration });
    notify();
    setTimeout(() => {
      toastStore.toasts = toastStore.toasts.filter((t) => t.id !== id);
      notify();
    }, duration);
  },
};

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const updateToasts = () => setToasts([...toastStore.toasts]);
    toastStore.listeners.add(updateToasts);
    updateToasts();

    return () => {
      toastStore.listeners.delete(updateToasts);
    };
  }, []);

  return {
    // 직접 메서드들을 반환
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
    toasts,
  };
};

export function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-50 space-y-2">
      {toasts.map((toastItem) => (
        <div
          key={toastItem.id}
          className={`max-w-sm rounded-lg px-4 py-2 text-sm text-white shadow-lg ${toastItem.type === 'success' ? 'bg-green-600' : ''} ${toastItem.type === 'error' ? 'bg-red-600' : ''} ${toastItem.type === 'warning' ? 'bg-yellow-600' : ''} ${toastItem.type === 'info' ? 'bg-blue-600' : ''} `}
        >
          {toastItem.message}
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
