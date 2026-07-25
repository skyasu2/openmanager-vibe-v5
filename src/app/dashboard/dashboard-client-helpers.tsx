'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const AI_SIDEBAR_EXIT_DURATION_MS = 300;

type AnimatedAISidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  [key: string]: unknown;
};

const LazyAISidebar = dynamic(
  () => import('@/components/ai-sidebar/AISidebarV4'),
  {
    loading: () => (
      <div className="fixed inset-0 z-50 h-dvh w-screen max-w-none border-l border-gray-200 bg-white md:right-0 md:left-auto md:w-96 lg:w-[680px]">
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export function AnimatedAISidebar(props: AnimatedAISidebarProps) {
  const { isOpen, ...otherProps } = props;
  const [isPresent, setIsPresent] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsPresent(true);
      return;
    }

    const timeoutId = window.setTimeout(
      () => setIsPresent(false),
      AI_SIDEBAR_EXIT_DURATION_MS
    );

    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  if (!isPresent) return null;

  return (
    <LazyAISidebar
      isOpen={isOpen}
      {...otherProps}
      onExitAnimationEnd={() => setIsPresent(false)}
    />
  );
}

export const ContentLoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-100 p-6">
    <div className="space-y-6">
      <div className="h-16 animate-pulse rounded-lg bg-gray-200"></div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-gray-200"
          ></div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-lg bg-gray-200"
          ></div>
        ))}
      </div>
    </div>
  </div>
);

export function checkTestMode(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return false;
  }

  const cookieStr = typeof document.cookie === 'string' ? document.cookie : '';
  const cookies = cookieStr.split(';').map((c) => c.trim());
  const hasTestMode = cookies.some((c) => c.startsWith('test_mode=enabled'));
  const hasTestToken = cookies.some((c) => c.startsWith('vercel_test_token='));

  if (hasTestMode || hasTestToken) {
    return true;
  }

  try {
    const testModeEnabled =
      typeof localStorage !== 'undefined' &&
      localStorage.getItem('test_mode_enabled') === 'true';

    if (testModeEnabled) {
      return true;
    }
  } catch {}

  return false;
}
