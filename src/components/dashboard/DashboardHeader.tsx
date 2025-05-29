'use client';

import { memo } from 'react';

interface ServerStats {
  total: number;
  online: number;
  warning: number;
  offline: number;
}

interface DashboardHeaderProps {
  serverStats: ServerStats;
  onNavigateHome: () => void;
  onToggleAgent: () => void;
  isAgentOpen: boolean;
  systemStatusDisplay: React.ReactNode;
}

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
          >
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-server text-white text-sm"></i>
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
          <div className="hidden md:flex items-center gap-6">
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
          >
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 ${isAgentOpen ? 'text-white' : 'text-gray-600'}`}>
                🤖
              </div>
              <span className="hidden sm:inline text-sm font-medium">
                AI 에이전트
              </span>
            </div>
            
            {/* 활성화 상태 표시 */}
            {isAgentOpen && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-white"></div>
            )}
          </button>
        </div>
      </div>
    </header>
  );
});

export default DashboardHeader; 