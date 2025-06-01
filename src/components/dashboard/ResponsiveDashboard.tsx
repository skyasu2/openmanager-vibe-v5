'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import ServerDashboard from './ServerDashboard';
// import DashboardEntrance from './DashboardEntrance';
// import { SystemControlPanel } from '../system/SystemControlPanel';
import { Server } from '../../types/server';
import { cn } from '../../lib/utils';

interface ResponsiveDashboardProps {
  onStatsUpdate?: (stats: { total: number; online: number; warning: number; offline: number }) => void;
  className?: string;
  showSystemControl?: boolean;
  entranceAnimation?: boolean;
}

/**
 * 📱 ResponsiveDashboard Component
 * 
 * 반응형 대시보드 컴포넌트:
 * - 모바일/태블릿/데스크톱 레이아웃 자동 전환
 * - 동적 그리드 시스템
 * - 터치 최적화 인터페이스
 * - 성능 최적화 뷰포트 관리
 */
export default function ResponsiveDashboard({
  onStatsUpdate,
  className,
  showSystemControl = true,
  entranceAnimation = false
}: ResponsiveDashboardProps) {
  const [isInitialized, setIsInitialized] = useState(!entranceAnimation);
  const [selectedView, setSelectedView] = useState<'grid' | 'list' | 'compact'>('grid');
  
  // 반응형 브레이크포인트 감지
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1280px)');
  const isExtraLarge = useMediaQuery('(min-width: 1536px)');

  // 화면 크기에 따른 기본 뷰 설정
  useEffect(() => {
    if (isMobile) {
      setSelectedView('compact');
    } else if (isTablet) {
      setSelectedView('list');
    } else {
      setSelectedView('grid');
    }
  }, [isMobile, isTablet]);

  // 레이아웃 설정
  const layoutConfig = useMemo(() => {
    if (isMobile) {
      return {
        containerClass: 'responsive-container-mobile',
        gridCols: 'grid-cols-1',
        gap: 'gap-3',
        padding: 'p-3',
        cardSize: 'compact',
        maxItems: 6 // 모바일에서는 성능을 위해 제한
      };
    } else if (isTablet) {
      return {
        containerClass: 'responsive-container-tablet',
        gridCols: 'grid-cols-2',
        gap: 'gap-4',
        padding: 'p-4',
        cardSize: 'medium',
        maxItems: 12
      };
    } else if (isLargeDesktop || isExtraLarge) {
      return {
        containerClass: 'responsive-container-desktop-xl',
        gridCols: 'grid-cols-4 xl:grid-cols-5',
        gap: 'gap-6',
        padding: 'p-6',
        cardSize: 'large',
        maxItems: 50
      };
    } else {
      return {
        containerClass: 'responsive-container-desktop',
        gridCols: 'grid-cols-3',
        gap: 'gap-5',
        padding: 'p-5',
        cardSize: 'medium',
        maxItems: 30
      };
    }
  }, [isMobile, isTablet, isLargeDesktop, isExtraLarge]);

  // 애니메이션 variants
  const containerVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      scale: 0.98
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.25, 0, 1],
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.98,
      transition: { duration: 0.3 }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, delay: 0.2 }
    }
  };

  // 시스템 통계 업데이트 핸들러
  const handleStatsUpdate = (stats: { total: number; online: number; warning: number; offline: number }) => {
    onStatsUpdate?.(stats);
  };

  // 초기화 완료 핸들러
  const handleInitializationComplete = () => {
    setIsInitialized(true);
  };

  // 입구 애니메이션이 활성화된 경우 - 임시로 비활성화
  // if (entranceAnimation && !isInitialized) {
  //   return (
  //     <DashboardEntrance 
  //       onStatsUpdate={handleStatsUpdate}
  //       onComplete={handleInitializationComplete}
  //     />
  //   );
  // }

  return (
    <motion.div
      className={cn(
        'w-full min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800',
        layoutConfig.containerClass,
        layoutConfig.padding,
        className
      )}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="mx-auto max-w-full">
        {/* 헤더 섹션 */}
        {showSystemControl && (
          <motion.div
            variants={headerVariants}
            className="mb-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  시스템 대시보드
                </h1>
                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1">
                  실시간 서버 모니터링 및 관리
                </p>
              </div>
              
              {/* 뷰 전환 컨트롤 (태블릿 이상에서만 표시) */}
              {!isMobile && (
                <div className="flex items-center space-x-2">
                  <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border">
                    {[
                      { key: 'grid', label: '그리드', icon: '⊞' },
                      { key: 'list', label: '리스트', icon: '☰' },
                      { key: 'compact', label: '컴팩트', icon: '▤' }
                    ].map(({ key, label, icon }) => (
                      <button
                        key={key}
                        onClick={() => setSelectedView(key as any)}
                        className={cn(
                          'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                          selectedView === key
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
                        )}
                      >
                        <span className="mr-1">{icon}</span>
                        <span className="hidden sm:inline">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* 시스템 제어 패널 - 임시로 비활성화 */}
            {/* <div className="mt-4">
              <SystemControlPanel />
            </div> */}
          </motion.div>
        )}

        {/* 메인 콘텐츠 */}
        <motion.div
          variants={contentVariants}
          className="space-y-6"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedView}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <ServerDashboard
                onStatsUpdate={handleStatsUpdate}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* 성능 모니터링 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-xs font-mono">
          <div>화면: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : isLargeDesktop ? 'Large Desktop' : 'Desktop'}</div>
          <div>뷰: {selectedView}</div>
          <div>최대 항목: {layoutConfig.maxItems}</div>
        </div>
      )}
    </motion.div>
  );
} 