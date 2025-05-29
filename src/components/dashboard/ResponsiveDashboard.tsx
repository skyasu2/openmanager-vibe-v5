'use client';

import { useState, useEffect } from 'react';
import { useServerDataStore } from '../../stores/serverDataStore';
import { Server } from '../../types/server';
import toast, { Toaster } from 'react-hot-toast';

// 기존 컴포넌트
import ServerDashboard from './ServerDashboard';

// 새로운 모바일 컴포넌트
import MobileSummaryCard from '../mobile/MobileSummaryCard';
import MobileServerSheet from '../mobile/MobileServerSheet';

interface ResponsiveDashboardProps {
  onStatsUpdate?: (stats: { total: number; online: number; warning: number; offline: number }) => void;
}

export default function ResponsiveDashboard({ onStatsUpdate }: ResponsiveDashboardProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentServerIndex, setCurrentServerIndex] = useState(0);

  // 서버 데이터 스토어
  const { servers, isLoading, refreshData } = useServerDataStore();

  // 화면 크기 감지
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 통계 업데이트
  useEffect(() => {
    if (onStatsUpdate && servers.length > 0) {
      const stats = {
        total: servers.length,
        online: servers.filter(s => s.status === 'healthy').length,
        warning: servers.filter(s => s.status === 'warning').length,
        offline: servers.filter(s => s.status === 'critical').length
      };
      onStatsUpdate(stats);
    }
  }, [servers, onStatsUpdate]);

  // 모바일: 서버 선택 처리
  const handleMobileServerSelect = (server: Server) => {
    setSelectedServer(server);
    setCurrentServerIndex(servers.findIndex(s => s.id === server.id));
    setIsSheetOpen(true);
    
    // 햅틱 피드백 (모바일)
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // 토스트 알림
    toast.success(`${server.name} 서버 정보`, {
      duration: 2000,
      position: 'top-center'
    });
  };

  // 모바일: 전체 보기 (데스크톱 모드로 전환)
  const handleViewAll = () => {
    setIsMobile(false);
    toast('데스크톱 뷰로 전환됨', { 
      icon: '💻',
      duration: 2000 
    });
  };

  // 스와이프 네비게이션
  const handleSwipeNext = () => {
    const nextIndex = Math.min(currentServerIndex + 1, servers.length - 1);
    if (nextIndex !== currentServerIndex) {
      setCurrentServerIndex(nextIndex);
      setSelectedServer(servers[nextIndex]);
      
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }
  };

  const handleSwipePrev = () => {
    const prevIndex = Math.max(currentServerIndex - 1, 0);
    if (prevIndex !== currentServerIndex) {
      setCurrentServerIndex(prevIndex);
      setSelectedServer(servers[prevIndex]);
      
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }
  };

  // 데스크톱: 서버 선택 처리
  const handleDesktopServerSelect = (server: Server) => {
    setSelectedServer(server);
    // 데스크톱에서는 기존 모달 사용
  };

  // Pull-to-refresh 처리 (모바일)
  useEffect(() => {
    if (!isMobile) return;

    let startY = 0;
    let isRefreshing = false;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;
      
      // 페이지 최상단에서 아래로 당기는 경우
      if (window.scrollY === 0 && pullDistance > 100) {
        isRefreshing = true;
        
        toast.loading('서버 정보를 새로고침 중...', { 
          duration: 2000,
          id: 'refresh'
        });
        
        refreshData().then(() => {
          toast.success('새로고침 완료!', { 
            id: 'refresh',
            duration: 1500 
          });
          isRefreshing = false;
        });
      }
    };

    const handleTouchEnd = () => {
      setTimeout(() => {
        isRefreshing = false;
      }, 1000);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, refreshData]);

  // 로딩 상태
  if (isLoading && servers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isMobile ? '모바일 대시보드 로딩 중...' : '서버 연결 중'}
          </h3>
          <p className="text-gray-600">모니터링 시스템을 초기화하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 토스트 알림 시스템 */}
      <Toaster
        position={isMobile ? "top-center" : "bottom-right"}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            fontSize: isMobile ? '14px' : '13px'
          }
        }}
      />

      {/* 모바일 뷰 */}
      {isMobile ? (
        <div className="space-y-4 p-4">
          {/* 화면 전환 버튼 */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-900">모바일 대시보드</h1>
            <button
              onClick={() => setIsMobile(false)}
              className="text-sm text-blue-500 hover:text-blue-600 font-medium"
            >
              데스크톱 뷰 →
            </button>
          </div>

          {/* 모바일 요약 카드 */}
          <MobileSummaryCard
            servers={servers as any}
            onServerSelect={handleMobileServerSelect}
            onViewAll={handleViewAll}
            lastUpdate={new Date()}
          />

          {/* 당겨서 새로고침 힌트 */}
          <div className="text-center py-2">
            <p className="text-xs text-gray-400">
              ↓ 당겨서 새로고침 ↓
            </p>
          </div>

          {/* 모바일 서버 시트 */}
          <MobileServerSheet
            server={selectedServer}
            servers={servers as any}
            isOpen={isSheetOpen}
            onClose={() => setIsSheetOpen(false)}
            onSwipeNext={handleSwipeNext}
            onSwipePrev={handleSwipePrev}
          />
        </div>
      ) : (
        /* 데스크톱 뷰 */
        <div className="space-y-4">
          {/* 화면 전환 버튼 */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-900">서버 대시보드</h1>
            <button
              onClick={() => setIsMobile(true)}
              className="text-sm text-blue-500 hover:text-blue-600 font-medium"
            >
              ← 모바일 뷰
            </button>
          </div>

          {/* 기존 서버 대시보드 */}
          <ServerDashboard onStatsUpdate={onStatsUpdate} />
        </div>
      )}
    </>
  );
} 