'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useAISidebarStore } from '@/stores/useAISidebarStore';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { NotificationToast } from '@/components/system/NotificationToast';
import { cn } from '@/lib/utils';
import React from 'react';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import Link from 'next/link';
import { AISidebar } from '@/presentation/ai-sidebar';
import { AlertTriangle } from 'lucide-react';

// --- Dynamic Imports ---
const DashboardHeader = dynamic(
  () => import('../../components/dashboard/DashboardHeader')
);
const DashboardContent = dynamic(
  () => import('../../components/dashboard/DashboardContent')
);
const FloatingSystemControl = dynamic(
  () => import('../../components/system/FloatingSystemControl')
);
const ContentLoadingSkeleton = () => (
  <div className='p-6 space-y-4'>
    <div className='w-full h-32 bg-gray-200 rounded-lg animate-pulse'></div>
  </div>
);

// This is the original ErrorBoundary which might not support FallbackComponent prop.
// It will be used as a last resort.
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Dashboard Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className='min-h-screen bg-red-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-lg shadow-lg p-6 max-w-md w-full'>
            <div className='text-center'>
              <AlertTriangle className='h-12 w-12 text-red-500 mx-auto mb-4' />
              <h2 className='text-xl font-semibold text-gray-900 mb-2'>
                Dashboard Failed to Load
              </h2>
              <p className='text-gray-600 mb-4'>
                {this.state.error?.message || 'Unknown error'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className='px-4 py-2 bg-blue-500 text-white rounded-lg'
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function DashboardPageContent() {
  const [isClient, setIsClient] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const isResizing = false; // Removed from store to prevent errors

  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleAgent = useCallback(() => {
    setIsAgentOpen(prev => !prev);
  }, []);
  const closeAgent = useCallback(() => {
    setIsAgentOpen(false);
  }, []);

  if (!isClient) {
    return (
      <div className='w-full h-screen flex items-center justify-center'>
        <div className='w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin'></div>
      </div>
    );
  }

  const dummySystemControl = {
    systemState: { status: 'ok' },
    aiAgentState: { state: 'idle' },
    isSystemActive: true,
    isSystemPaused: false,
    onStartSystem: () => Promise.resolve(),
    onStopSystem: () => Promise.resolve(),
    onResumeSystem: () => Promise.resolve(),
  };

  return (
    <div
      className={cn(
        'flex h-screen bg-gray-100 dark:bg-gray-900',
        isResizing && 'cursor-col-resize'
      )}
    >
      <div className='flex-1 flex flex-col min-h-0'>
        <DashboardHeader
          onNavigateHome={() => (window.location.href = '/')}
          onToggleAgent={toggleAgent}
          isAgentOpen={isAgentOpen}
        />
        <main className='flex-1 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-8'>
          <DashboardContent
            showSequentialGeneration={false}
            servers={[]}
            status={{ type: 'idle' }}
            actions={{ start: () => {}, stop: () => {} }}
            selectedServer={null}
            onServerClick={() => {}}
            onServerModalClose={() => {}}
            onStatsUpdate={() => {}}
            onShowSequentialChange={() => {}}
            mainContentVariants={{}}
            isAgentOpen={isAgentOpen}
          />
        </main>
      </div>
      <AnimatePresence>
        {isAgentOpen && (
          <motion.aside
            initial={{ width: 0 }}
            animate={{ width: 'auto' }}
            exit={{ width: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className='overflow-hidden'
          >
            <AISidebar onClose={closeAgent} isOpen={isAgentOpen} />
          </motion.aside>
        )}
      </AnimatePresence>
      <FloatingSystemControl {...dummySystemControl} />
      <NotificationToast />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardErrorBoundary>
      <Suspense fallback={<ContentLoadingSkeleton />}>
        <DashboardPageContent />
      </Suspense>
    </DashboardErrorBoundary>
  );
}
