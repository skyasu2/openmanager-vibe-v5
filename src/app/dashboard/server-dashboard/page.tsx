'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ServerDashboard from '../../../components/dashboard/ServerDashboard';
import AgentModal from '../../../components/ai/AgentModal';
import ProfileDropdown from '../../../components/ui/ProfileDropdown';

export default function ServerDashboardPage() {
  const router = useRouter();
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isManualExit, setIsManualExit] = useState(false); // 수동 종료 플래그

  // 권한 확인 (임시로 완화됨)
  useEffect(() => {
    const checkAuth = () => {
      // 수동 종료 중이면 인증 체크 스킵
      if (isManualExit) return;
      
      const authToken = localStorage.getItem('dashboard_auth_token');
      const sessionAuth = sessionStorage.getItem('dashboard_authorized');
      const authTime = localStorage.getItem('dashboard_access_time');
      const fromIndex = localStorage.getItem('authorized_from_index');
      
      // 임시 접근 허용: 메인 대시보드에서 온 경우 자동 인증 설정
      if (!authToken && !sessionAuth) {
        console.log('🔧 임시 인증 설정 - server-dashboard 접근 허용');
        localStorage.setItem('dashboard_auth_token', `auto_${Date.now()}`);
        sessionStorage.setItem('dashboard_authorized', 'true');
        localStorage.setItem('dashboard_access_time', Date.now().toString());
        localStorage.setItem('authorized_from_index', 'true');
        return;
      }
      
      // 기본 인증 확인 (완화됨)
      if (!authToken || !sessionAuth) {
        console.log('🔧 임시 인증 재설정');
        localStorage.setItem('dashboard_auth_token', `auto_${Date.now()}`);
        sessionStorage.setItem('dashboard_authorized', 'true');
        localStorage.setItem('dashboard_access_time', Date.now().toString());
        localStorage.setItem('authorized_from_index', 'true');
        return;
      }
      
      // 세션 만료 확인 (2시간으로 연장)
      if (authTime) {
        const accessTime = parseInt(authTime);
        const currentTime = Date.now();
        const twoHours = 2 * 60 * 60 * 1000; // 2시간으로 연장
        
        if (currentTime - accessTime > twoHours) {
          console.log('⏰ 세션 만료 (2시간) - 랜딩페이지로 이동');
          localStorage.clear();
          sessionStorage.clear();
          alert('2시간 체험 세션이 만료되었습니다. 랜딩페이지로 이동합니다.');
          router.replace('/');
          return;
        }
      }
    };

    checkAuth();
    // 5분마다 세션 확인으로 변경 (덜 빈번하게)
    const interval = setInterval(checkAuth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [router, isManualExit]);

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
            
            <button 
              onClick={() => {
                console.log('🏠 OpenManager 버튼 클릭 - 랜딩페이지로 이동');
                // 수동 종료 플래그 설정
                setIsManualExit(true);
                // 세션 정리 후 랜딩페이지 이동
                localStorage.clear();
                sessionStorage.clear();
                // window.location.href를 사용하여 확실한 페이지 이동
                window.location.href = '/';
              }}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-server text-white text-sm"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">OpenManager</h1>
                <p className="text-xs text-gray-500">서버 대시보드</p>
              </div>
            </button>
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
      <main className="relative">
        <ServerDashboard />
        
        {/* AI 에이전트 모달 */}
        <AgentModal isOpen={isAgentOpen} onClose={closeAgent} />
      </main>
    </div>
  );
} 