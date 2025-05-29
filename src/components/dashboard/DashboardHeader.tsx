'use client';

import { memo } from 'react';

/**
 * 서버 통계 인터페이스
 */
interface ServerStats {
  /** 전체 서버 수 */
  total: number;
  /** 온라인 서버 수 */
  online: number;
  /** 경고 상태 서버 수 */
  warning: number;
  /** 오프라인 서버 수 */
  offline: number;
}

/**
 * 대시보드 헤더 컴포넌트 Props
 */
interface DashboardHeaderProps {
  /** 서버 통계 데이터 */
  serverStats: ServerStats;
  /** 홈으로 이동 핸들러 */
  onNavigateHome: () => void;
  /** AI 에이전트 토글 핸들러 */
  onToggleAgent: () => void;
  /** AI 에이전트 열림 상태 */
  isAgentOpen: boolean;
  /** 시스템 상태 표시 컴포넌트 */
  systemStatusDisplay: React.ReactNode;
}

/**
 * 대시보드 메인 헤더 컴포넌트
 * 
 * @description
 * - 브랜드 로고 및 네비게이션
 * - 실시간 서버 통계 표시
 * - AI 에이전트 토글 버튼
 * - 시스템 상태 표시
 * 
 * @example
 * ```tsx
 * <DashboardHeader
 *   serverStats={{ total: 10, online: 8, warning: 1, offline: 1 }}
 *   onNavigateHome={() => router.push('/')}
 *   onToggleAgent={() => setIsAgentOpen(!isAgentOpen)}
 *   isAgentOpen={false}
 *   systemStatusDisplay={<SystemStatusDisplay />}
 * />
 * ```
 */
const DashboardHeader = memo(function DashboardHeader({
  serverStats,
  onNavigateHome,
  onToggleAgent,
  isAgentOpen,
  systemStatusDisplay
}: DashboardHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onNavigateHome}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            aria-label="홈으로 이동"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-server text-white text-sm" aria-hidden="true"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">OpenManager</h1>
              <p className="text-xs text-gray-500">AI 서버 모니터링</p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* 시스템 상태 표시 */}
          {systemStatusDisplay}
          
          {/* 빠른 통계 - 실시간 데이터 */}
          <div className="hidden md:flex items-center gap-6" role="status" aria-label="서버 통계">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">{serverStats.total}대</div>
              <div className="text-xs text-gray-500">전체 서버</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-green-600">{serverStats.online}대</div>
              <div className="text-xs text-gray-500">온라인</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-orange-600">{serverStats.warning}대</div>
              <div className="text-xs text-gray-500">경고</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-red-600">{serverStats.offline}대</div>
              <div className="text-xs text-gray-500">오프라인</div>
            </div>
          </div>

          {/* AI 에이전트 토글 버튼 */}
          <button
            onClick={onToggleAgent}
            className={`
              relative p-3 rounded-xl transition-all duration-300 transform
              ${isAgentOpen 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
              }
            `}
            title={isAgentOpen ? 'AI 에이전트 닫기' : 'AI 에이전트 열기'}
            aria-label={isAgentOpen ? 'AI 에이전트 닫기' : 'AI 에이전트 열기'}
            aria-pressed={isAgentOpen}
          >
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 ${isAgentOpen ? 'text-white' : 'text-gray-600'}`} aria-hidden="true">
                🤖
              </div>
              <span className="hidden sm:inline text-sm font-medium">
                AI 에이전트
              </span>
            </div>
            
            {/* 활성화 상태 표시 */}
            {isAgentOpen && (
              <div 
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-white"
                aria-hidden="true"
              ></div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader; 