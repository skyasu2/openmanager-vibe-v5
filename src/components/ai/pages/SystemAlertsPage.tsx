/**
 * 🚨 System Alerts Page
 *
 * AI 에이전트 사이드바의 실시간 시스템 알림 페이지
 * - Critical/Warning/Resolved 알림 분류
 * - 실시간 알림 업데이트 (10초 간격)
 * - 알림 상세 정보 및 액션
 */

'use client';

import { Button } from '@/components/ui/button';
import { useSystemAlerts } from '@/hooks/useSystemAlerts';
import { cn } from '@/lib/utils';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Info,
  RefreshCw,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import React, {
  useEffect,
  useRef,
  useState
} from 'react';

interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'resolved' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  server: string;
  timestamp: Date;
  category: 'cpu' | 'memory' | 'disk' | 'network' | 'service';
  value?: number;
  threshold?: number;
}

interface SystemAlertsPageProps {
  className?: string;
}

const alertIcons: { [key: string]: React.ElementType } = {
  critical: XCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
  default: Info,
};

const alertColors: { [key: string]: string } = {
  critical: 'text-red-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
  success: 'text-green-500',
  default: 'text-gray-500',
};

const AlertItem = React.memo(({ alert, isLeaving }: any) => {
  const Icon = alertIcons[alert.level] || alertIcons.default;
  const color = alertColors[alert.level] || alertColors.default;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -30, transition: { duration: 0.3 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn('flex items-start p-3 rounded-lg', isLeaving && 'leaving')}
    >
      <Icon className={cn('w-5 h-5 mt-0.5 mr-3 flex-shrink-0', color)} />
      <div className='flex-grow'>
        <p className='font-semibold text-sm text-gray-800'>{alert.title}</p>
        <p className='text-xs text-gray-500'>{alert.message}</p>
      </div>
      <span className='text-xs text-gray-400 ml-3 flex-shrink-0'>
        {new Date(alert.timestamp).toLocaleTimeString()}
      </span>
    </motion.div>
  );
});
AlertItem.displayName = 'AlertItem';

export default function SystemAlertsPage({ className }: SystemAlertsPageProps) {
  const { alerts, loading, error } = useSystemAlerts();
  const [visibleAlerts, setVisibleAlerts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const MAX_VISIBLE_ALERTS = 5;

  useEffect(() => {
    if (alerts.length > 0) {
      setVisibleAlerts(alerts.slice(0, MAX_VISIBLE_ALERTS));
    }
  }, [alerts]);

  useEffect(() => {
    if (alerts.length <= MAX_VISIBLE_ALERTS) {
      setVisibleAlerts(alerts);
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % alerts.length);
    }, 5000); // 5초마다 회전

    return () => clearInterval(interval);
  }, [alerts]);

  useEffect(() => {
    if (alerts.length > MAX_VISIBLE_ALERTS) {
      const start = currentIndex;
      const end = start + MAX_VISIBLE_ALERTS;
      const wrappedAlerts = [...alerts, ...alerts].slice(start, end);
      setVisibleAlerts(wrappedAlerts);
    }
  }, [currentIndex, alerts]);

  const containerRef = useRef<HTMLDivElement>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-96',
        className
      )}
    >
      <div className='p-4 border-b border-gray-200 flex justify-between items-center'>
        <div className='flex items-center'>
          <AlertTriangle className='w-5 h-5 mr-2 text-yellow-500' />
          <h3 className='font-bold text-gray-800'>실시간 시스템 알림</h3>
        </div>
        <Button variant='ghost' size='sm' asChild>
          <Link href='/alerts'>
            전체보기 <ChevronRight className='w-4 h-4 ml-1' />
          </Link>
        </Button>
      </div>

      <div className='flex-grow overflow-y-auto p-2' ref={containerRef}>
        {loading && (
          <div className='flex items-center justify-center h-full text-gray-500'>
            <RefreshCw className='w-5 h-5 animate-spin mr-2' />
            알림을 불러오는 중...
          </div>
        )}
        {error && (
          <div className='flex items-center justify-center h-full text-red-500'>
            <XCircle className='w-5 h-5 mr-2' />
            오류: {error}
          </div>
        )}
        {!loading && !error && (
          <LayoutGroup>
            <motion.div
              variants={containerVariants}
              initial='hidden'
              animate='visible'
              className='space-y-1'
            >
              <AnimatePresence initial={false}>
                {visibleAlerts.map(alert => (
                  <AlertItem key={alert.id} alert={alert} />
                ))}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        )}
      </div>
    </div>
  );
}
