'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ServerDashboard from '../../components/dashboard/ServerDashboard';
import AgentModal from '../../components/ai/AgentModal';
import ProfileDropdown from '../../components/ui/ProfileDropdown';
import { usePowerStore } from '../../stores/powerStore';

export default function DashboardPage() {
  const router = useRouter();
  const [isAgentOpen, setIsAgentOpen] = useState(false);

  const [serverStats, setServerStats] = useState({
    total: 10,
    online: 3,
    warning: 5,
    offline: 2
  });

  // 절전 모드 상태 관리
  const { mode } = usePowerStore();
  const isSystemActive = mode === 'active' || mode === 'monitoring';



  // 시스템 자동 활성화 (인증 로직 제거)
  useEffect(() => {
    // 시스템이 비활성화 상태라면 자동 활성화
    if (!isSystemActive) {
      console.log('🚀 대시보드 접근 시 시스템 자동 활성화 중...');
      const { activateSystem } = usePowerStore.getState();
      activateSystem();
      console.log('✅ 시스템 활성화 완료');
    }
  }, [isSystemActive]);

  const closeAgent = () => {
    setIsAgentOpen(false);
  };

  const toggleAgent = () => {
    if (isAgentOpen) {
      closeAgent();
    } else {
      setIsAgentOpen(true);
    }
  };

  const handleStatsUpdate = (stats: { total: number; online: number; warning: number; offline: number }) => {
    setServerStats(stats);
  };

  // 랜딩페이지로 이동 (간소화)
  const handleGoToLanding = () => {
    console.log('🏠 랜딩페이지로 이동');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleGoToLanding}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-server text-white text-sm"></i>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">OpenManager</h1>
                <p className="text-xs text-gray-500">AI 서버 모니터링</p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* 빠른 통계 */}
            <div className="hidden md:flex items-center gap-4 lg:gap-6">
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
              onClick={toggleAgent}
              className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium transition-all ${
                isAgentOpen
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className={`fas fa-brain text-sm ${
                isAgentOpen 
                  ? 'text-white' 
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent'
              }`}></i>
              <span className="hidden sm:inline">AI 에이전트</span>
              
              {/* 알림 뱃지 */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
            </button>

            {/* 사용자 메뉴 */}
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors">
                <i className="fas fa-bell text-gray-600 text-sm bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent"></i>
              </button>
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="relative">
        <ServerDashboard onStatsUpdate={handleStatsUpdate} />
        
        {/* AI 에이전트 모달 */}
        <AgentModal isOpen={isAgentOpen} onClose={closeAgent} />
      </main>


    </div>
  );
} 