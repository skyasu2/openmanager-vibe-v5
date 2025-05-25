'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ServerDashboard from '../../../components/dashboard/ServerDashboard';
import AgentPanel from '../../../components/ai/AgentPanel';
import AgentPanelMobile from '../../../components/ai/AgentPanelMobile';
import ProfileDropdown from '../../../components/ui/ProfileDropdown';

export default function ServerDashboardPage() {
  const router = useRouter();
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 화면 크기 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 권한 확인
  useEffect(() => {
    const checkAuth = () => {
      const authToken = localStorage.getItem('dashboard_auth_token');
      const sessionAuth = sessionStorage.getItem('dashboard_authorized');
      const authTime = localStorage.getItem('dashboard_access_time');
      const fromIndex = localStorage.getItem('authorized_from_index');
      
      // 랜딩페이지를 거치지 않고 직접 접근한 경우
      if (!fromIndex || fromIndex !== 'true') {
        localStorage.clear();
        sessionStorage.clear();
        router.replace('/');
        return;
      }
      
      // 기본 인증 확인
      if (!authToken || !sessionAuth || !authTime) {
        localStorage.clear();
        sessionStorage.clear();
        router.replace('/');
        return;
      }
      
      // 1시간(3600000ms) 세션 만료 확인
      const accessTime = parseInt(authTime);
      const currentTime = Date.now();
      const oneHour = 60 * 60 * 1000; // 1시간
      
      if (currentTime - accessTime > oneHour) {
        localStorage.clear();
        sessionStorage.clear();
        alert('1시간 체험 세션이 만료되었습니다. 랜딩페이지로 이동합니다.');
        router.replace('/');
        return;
      }
    };

    checkAuth();
    // 1분마다 세션 만료 확인
    const interval = setInterval(checkAuth, 60000);
    return () => clearInterval(interval);
  }, [router]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
            >
              <i className="fas fa-arrow-left text-gray-600 text-sm"></i>
            </button>
            
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-server text-white text-sm"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">OpenManager</h1>
                <p className="text-xs text-gray-500">서버 대시보드</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* 빠른 통계 */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900">6대</div>
                <div className="text-xs text-gray-500">전체 서버</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-green-600">4대</div>
                <div className="text-xs text-gray-500">온라인</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-red-600">1대</div>
                <div className="text-xs text-gray-500">오프라인</div>
              </div>
            </div>

            {/* AI 에이전트 토글 버튼 */}
            <button
              onClick={toggleAgent}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
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
              <span className="hidden sm:inline">AI 분석</span>
              
              {/* 알림 뱃지 */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
            </button>

            {/* 추가 액션 버튼들 */}
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors">
                <i className="fas fa-refresh text-gray-600 text-sm bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent"></i>
              </button>
              <button className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors">
                <i className="fas fa-cog text-gray-600 text-sm bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent"></i>
              </button>
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐트 영역 */}
      <div className="flex relative">
        {/* 서버 대시보드 */}
        <main className={`flex-1 transition-all duration-300 ${
          isAgentOpen && !isMobile ? 'lg:mr-96' : ''
        }`}>
          <ServerDashboard />
        </main>

        {/* AI 에이전트 패널 (데스크탑) */}
        {!isMobile && (
          <AgentPanel
            isOpen={isAgentOpen}
            onClose={closeAgent}
          />
        )}
      </div>

      {/* AI 에이전트 모바일 드로어 */}
      {isMobile && (
        <AgentPanelMobile
          isOpen={isAgentOpen}
          onClose={closeAgent}
        />
      )}

      {/* 플로팅 액션 버튼 (모바일용 보조) */}
      {isMobile && !isAgentOpen && (
        <button
          onClick={toggleAgent}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:shadow-xl transition-all"
        >
          <i className="fas fa-brain text-lg"></i>
        </button>
      )}
    </div>
  );
} 