'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import ServerDashboard from '../../components/dashboard/ServerDashboard';
import AgentModal from '../../components/ai/AgentModal';
import ProfileDropdown from '../../components/ui/ProfileDropdown';
import { useSystemControl } from '../../hooks/useSystemControl';

export default function DashboardPage() {
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [serverStats, setServerStats] = useState({
    total: 0,
    online: 0,
    warning: 0,
    offline: 0
  });
  
  // 개선된 시스템 제어 훅
  const {
    isSystemActive,
    isSystemPaused,
    formattedTime,
    stopFullSystem,
    pauseFullSystem,
    resumeFullSystem,
    recordActivity,
    isPaused,
    pauseReason,
    isUserSession
  } = useSystemControl();

  // 클라이언트 사이드 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 자동 인증 설정 (클라이언트 사이드에서만)
  useEffect(() => {
    if (isClient) {
      console.log('🔓 대시보드 접근 - 자동 인증 처리');
      localStorage.setItem('dashboard_auth_token', `auto_${Date.now()}`);
      sessionStorage.setItem('dashboard_authorized', 'true');
      localStorage.setItem('dashboard_access_time', Date.now().toString());
      localStorage.setItem('authorized_from_index', 'true');
    }
  }, [isClient]);

  // 사용자 활동 추적
  useEffect(() => {
    if (!isClient || !isSystemActive) return;

    const handleUserActivity = () => {
      recordActivity();
    };

    // 사용자 활동 이벤트 리스너
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // 초기 활동 기록
    recordActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isClient, isSystemActive, recordActivity]);

  const closeAgent = () => {
    setIsAgentOpen(false);
    recordActivity(); // AI 모달 닫기도 활동으로 기록
  };

  const toggleAgent = () => {
    if (isAgentOpen) {
      closeAgent();
    } else {
      setIsAgentOpen(true);
      recordActivity(); // AI 모달 열기도 활동으로 기록
    }
  };

  // 시스템 중지 핸들러 (개선됨)
  const handleSystemStop = useCallback(async () => {
    const sessionType = isUserSession ? '사용자 세션' : 'AI 세션';
    
    if (!confirm(`${sessionType}을 중지하시겠습니까?\n\n• 모든 서버 모니터링이 중단됩니다\n• AI 에이전트가 비활성화됩니다\n• 랜딩페이지로 이동합니다`)) {
      return;
    }

    try {
      const result = await stopFullSystem();
      
      if (result.success) {
        console.log('✅ 시스템 중지 완료:', result.message);
        
        if (result.errors.length > 0) {
          alert(`${result.message}\n\n경고 사항:\n${result.errors.join('\n')}\n\n랜딩페이지로 이동합니다.`);
        } else {
          alert(`${result.message}\n\n랜딩페이지로 이동합니다.`);
        }
        
        // 랜딩페이지로 이동
        window.location.href = '/';
      } else {
        console.warn('⚠️ 시스템 중지 중 오류:', result.errors);
        alert(`${result.message}\n\n오류 내용:\n${result.errors.join('\n')}`);
      }
    } catch (error) {
      console.error('❌ 시스템 중지 실패:', error);
      alert('시스템 중지 중 오류가 발생했습니다.\n다시 시도해주세요.');
    }
  }, [stopFullSystem, isUserSession]);

  // 시스템 일시정지 핸들러
  const handleSystemPause = useCallback(async () => {
    try {
      const result = await pauseFullSystem('사용자 요청');
      
      if (result.success) {
        console.log('⏸️ 시스템 일시정지:', result.message);
      }
    } catch (error) {
      console.error('❌ 시스템 일시정지 실패:', error);
    }
  }, [pauseFullSystem]);

  // 시스템 재개 핸들러
  const handleSystemResume = useCallback(async () => {
    try {
      const result = await resumeFullSystem();
      
      if (result.success) {
        console.log('▶️ 시스템 재개:', result.message);
      }
    } catch (error) {
      console.error('❌ 시스템 재개 실패:', error);
    }
  }, [resumeFullSystem]);

  // 시스템 상태 표시 컴포넌트
  const SystemStatusDisplay = useMemo(() => {
    if (isSystemPaused) {
      return (
        <div className="hidden lg:flex items-center gap-3 px-3 py-1 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm font-medium text-yellow-700">시스템 일시정지</span>
          </div>
          <div className="text-xs text-yellow-600">{pauseReason}</div>
          <button
            onClick={handleSystemResume}
            className="text-xs text-green-600 hover:text-green-800 hover:bg-green-100 px-2 py-1 rounded transition-colors"
            title="시스템 재개"
          >
            재개
          </button>
        </div>
      );
    }

    if (isSystemActive) {
      const sessionType = isUserSession ? '사용자 세션' : 'AI 세션';
      
      return (
        <div className="hidden lg:flex items-center gap-3 px-3 py-1 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">{sessionType} 실행 중</span>
          </div>
          <div className="text-xs text-green-600">{formattedTime}</div>
          <div className="flex gap-1">
            {isUserSession && (
              <button
                onClick={handleSystemPause}
                className="text-xs text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 px-2 py-1 rounded transition-colors"
                title="시스템 일시정지"
              >
                일시정지
              </button>
            )}
            <button
              onClick={handleSystemStop}
              className="text-xs text-red-600 hover:text-red-800 hover:bg-red-100 px-2 py-1 rounded transition-colors"
              title="시스템 중지"
            >
              중지
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="hidden lg:flex items-center gap-3 px-3 py-1 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-sm font-medium text-gray-600">시스템 중지됨</span>
        </div>
        <button
          onClick={() => window.location.href = '/'}
          className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
          title="랜딩페이지에서 시스템 시작"
        >
          시작하기
        </button>
      </div>
    );
  }, [isSystemActive, isSystemPaused, isUserSession, formattedTime, pauseReason, handleSystemStop, handleSystemPause, handleSystemResume]);

  // 서버 사이드 렌더링 시 기본 UI 반환
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">대시보드를 로드하고 있습니다...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                console.log('🏠 OpenManager 버튼 클릭 - 랜딩페이지로 이동');
                recordActivity(); // 네비게이션도 활동으로 기록
                // 서비스 종료하지 않고 단순히 랜딩페이지로 이동
                window.location.href = '/';
              }}
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
            {SystemStatusDisplay}
            
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
              <span className="hidden sm:inline">AI 에이전트</span>
              
              {/* 알림 뱃지 */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
            </button>

            {/* 추가 액션 버튼들 */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  recordActivity();
                  window.location.reload();
                }}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
              >
                <i className="fas fa-refresh text-gray-600 text-sm bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent"></i>
              </button>
              <button 
                onClick={() => recordActivity()}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
              >
                <i className="fas fa-bell text-gray-600 text-sm bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent"></i>
              </button>
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐트 영역 */}
      <main className="relative">
        <ServerDashboard onStatsUpdate={setServerStats} />
        
        {/* AI 에이전트 모달 */}
        <AgentModal isOpen={isAgentOpen} onClose={closeAgent} />
      </main>
    </div>
  );
} 