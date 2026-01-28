'use client';

/**
 * 🚀 OptimizedDashboard v2.5
 * Phase 2-5 시점 복원: 통합된 대시보드 컴포넌트
 *
 * 통합 기능:
 * - DashboardHeader + DashboardContent 통합
 * - framer-motion 직접 import (SSR 호환)
 * - 실시간 서버 모니터링
 * - AI 사이드바 통합
 */

// framer-motion 제거 - CSS 애니메이션 사용
import { LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
// 컴포넌트 import
import { AutoLogoutWarning } from '@/components/auth/AutoLogoutWarning';
import { RealtimeClock } from '@/components/shared/RealtimeClock';
import { useToast } from '@/hooks/use-toast';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import { useServerDashboard } from '@/hooks/useServerDashboard';
import { signOut, useSession } from '@/hooks/useSupabaseSession';
import { useSystemIntegration } from '@/hooks/useSystemIntegration';
import type { Server } from '@/types/server';
import EnhancedServerModal from './EnhancedServerModal';
import ServerDashboard from './ServerDashboard';

// AI 사이드바 제거 - DashboardClient에서 관리

interface OptimizedDashboardProps {
  servers?: Server[];
  isLoading?: boolean;
  error?: string | null;
}

export default function OptimizedDashboard({
  servers: propServers,
  isLoading: propIsLoading,
  error: propError,
}: OptimizedDashboardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  // AI 사이드바 제거 - DashboardClient에서 관리

  // 서버 모달 상태
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  // 시스템 통합 상태
  const systemStatus = useSystemIntegration();
  const isConnected = systemStatus.systemStatus === 'running';
  const _healthStatus =
    systemStatus.systemStatus === 'running' ? 'healthy' : 'critical';

  // 🔧 Phase 4: useServerDashboard에서 pagination 상태 가져오기
  const {
    paginatedServers,
    servers: allServers,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    changePageSize,
  } = useServerDashboard({ initialServers: propServers });
  const _isLoading = propIsLoading;
  const _error = propError;

  // 자동 로그아웃 훅
  const {
    remainingTime,
    isWarning: showLogoutWarning,
    updateActivity,
    logout: handleLogoutNow,
  } = useAutoLogout({
    timeoutMinutes: 10,
    warningMinutes: 1,
    onWarning: () => {
      toast({
        title: '⏰ 자동 로그아웃 경고',
        description: '1분 후 자동 로그아웃됩니다. 세션을 연장하시겠습니까?',
        variant: 'destructive',
      });
    },
    onLogout: () => {
      toast({
        title: '🔒 자동 로그아웃',
        description: '비활성으로 인한 자동 로그아웃되었습니다.',
      });
      router.push('/login');
    },
  });

  const handleExtendSession = () => {
    updateActivity();
  };

  // 로그인 상태 확인
  useEffect(() => {
    if (!session && status !== 'loading') {
      router.push('/login');
    }
  }, [session, status, router]);

  // 서버 선택 핸들러
  const _handleServerSelect = (server: Server) => {
    setSelectedServer(server);
    setIsServerModalOpen(true);
  };

  // 서버 모달 닫기
  const handleServerModalClose = () => {
    setIsServerModalOpen(false);
    setSelectedServer(null);
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  // 로딩 상태
  if (status === 'loading' || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-900 via-purple-900 to-violet-900">
        <div className="text-center text-white">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          <p className="text-lg">시스템 초기화 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 자동 로그아웃 경고 */}
      {showLogoutWarning && (
        <AutoLogoutWarning
          remainingTime={remainingTime}
          isWarning={showLogoutWarning}
          onExtendSession={handleExtendSession}
          onLogoutNow={handleLogoutNow}
        />
      )}

      {/* 메인 레이아웃 */}
      <div className="flex transition-all duration-300">
        {/* 메인 콘텐츠 */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* 통합 헤더 */}
          <header className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              {/* 브랜드 로고 */}
              <div className="flex items-center space-x-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-r from-blue-500 to-purple-600">
                  <span className="text-xl font-bold text-white">O</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    OpenManager AI
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    서버 모니터링 시스템
                  </p>
                </div>
              </div>

              {/* 중앙 정보 */}
              <div className="flex items-center space-x-6">
                {/* 실시간 시계 - 최적화된 컴포넌트 사용 */}
                <RealtimeClock
                  format="24h"
                  showIcon={true}
                  locale="ko-KR"
                  className="text-gray-600 dark:text-gray-300"
                />

                {/* AI 어시스턴트 토글 제거 - DashboardClient에서 관리 */}
              </div>

              {/* 사용자 메뉴 */}
              <div className="flex items-center space-x-4">
                {/* 시스템 상태 */}
                <div
                  className={`h-3 w-3 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  title={isConnected ? '시스템 연결됨' : '시스템 연결 안됨'}
                />

                {/* 사용자 정보 */}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {session.user?.name || '사용자'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {session.user?.email}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </div>
                </div>

                {/* 로그아웃 버튼 */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-gray-500 transition-colors hover:text-red-600"
                  title="로그아웃"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          {/* 대시보드 콘텐츠 */}
          <main className="flex-1 p-6">
            <div>
              <ServerDashboard
                servers={paginatedServers}
                totalServers={allServers.length}
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={changePageSize}
                onStatsUpdate={(_stats: {
                  total: number;
                  online: number;
                  warning: number;
                  critical: number;
                  offline: number;
                  unknown: number;
                }) => {}}
              />
            </div>
          </main>
        </div>

        {/* AI 사이드바 제거 - DashboardClient에서 관리 */}
      </div>

      {/* 플로팅 시스템 컨트롤 제거됨 - Vercel 플랫폼 자체 모니터링 사용 */}

      {/* AI 에이전트 토글 버튼 제거 - DashboardClient에서 관리 */}

      {/* 서버 상세 모달 */}
      {isServerModalOpen && selectedServer && selectedServer.hostname && (
        <EnhancedServerModal
          server={{
            ...selectedServer,
            id: selectedServer.id || selectedServer.hostname || 'unknown',
            name:
              selectedServer.name ||
              selectedServer.hostname ||
              'Unknown Server',
            hostname:
              selectedServer.hostname || selectedServer.name || 'Unknown',
            type: selectedServer.type || 'web',
            environment: selectedServer.environment || 'production',
            location: selectedServer.location || 'unknown',
            provider: selectedServer.provider || 'unknown',
            status: selectedServer.status, // 🔧 수정: 직접 사용 (타입 통합 완료)
            uptime:
              typeof selectedServer.uptime === 'number'
                ? selectedServer.uptime.toString()
                : selectedServer.uptime,
            alerts:
              typeof selectedServer.alerts === 'number'
                ? selectedServer.alerts
                : Array.isArray(selectedServer.alerts)
                  ? selectedServer.alerts.length
                  : 0,
            // networkStatus는 EnhancedServerModal 내부에서 자동 변환됨
            networkStatus: selectedServer.networkStatus,
            lastUpdate: selectedServer.lastUpdate || new Date(),
            cpu: selectedServer.cpu || 0,
            memory: selectedServer.memory || 0,
            disk: selectedServer.disk || 0,
            network: selectedServer.network || 0,
            services: (selectedServer.services || []).map((service) => ({
              name: service.name,
              status: service.status as
                | 'running'
                | 'stopped'
                | 'error'
                | 'starting'
                | 'stopping'
                | 'failed'
                | 'unknown',
              port: service.port || 80,
            })),
          }}
          onClose={handleServerModalClose}
        />
      )}
    </div>
  );
}
