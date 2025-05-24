'use client';import { useState, useEffect } from 'react';import { motion } from 'framer-motion';import { useDemoStore } from '../../stores/demoStore';import ServerCard from '../../components/demo/ServerCard';import AIChatPanel from '../../components/demo/AIChatPanel';import AutoDemoScenario from '../../components/demo/AutoDemoScenario';import { Activity, Wifi, Shield, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';import Link from 'next/link';import { useRouter } from 'next/navigation';// 동적 렌더링 강제 (HTML 파일 생성 방지)export const dynamic = 'force-dynamic';

export default function DemoPage() {
  const router = useRouter();
  const {
    servers,
    chatMessages,
    systemStatus,
    selectedServer,
    highlightedServers,
    isTyping,
    addMessage,
    selectServer,
    updateSystemStatus
  } = useDemoStore();

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

  // 시스템 상태 업데이트
  useEffect(() => {
    updateSystemStatus();
    const interval = setInterval(updateSystemStatus, 5000);
    return () => clearInterval(interval);
  }, [updateSystemStatus]);

  // 실시간 메트릭 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      // 랜덤하게 서버 메트릭 약간 변경
      const randomServer = servers[Math.floor(Math.random() * servers.length)];
      if (randomServer) {
        const { updateServerMetrics } = useDemoStore.getState();
        const variation = Math.random() * 10 - 5; // -5 to +5
        updateServerMetrics(randomServer.id, {
          cpu: Math.max(10, Math.min(95, randomServer.metrics.cpu + variation))
        });
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [servers]);

  const handleSendMessage = (content: string) => {
    addMessage({
      type: 'user',
      content
    });

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const responses = {
        '현재 시스템 상태는?': `현재 시스템 상태입니다:\n• 총 ${systemStatus.totalServers}개 서버\n• 정상: ${systemStatus.healthyServers}개\n• 경고: ${systemStatus.warningServers}개\n• 심각: ${systemStatus.criticalServers}개`,
        'CPU 사용률이 높은 서버는?': '가장 높은 CPU 사용률을 보이는 서버들을 찾아보겠습니다...',
        '경고 상태인 서버 분석': '경고 상태인 서버들을 분석하고 있습니다...',
        '전체 서버 성능 리포트': '전체 서버 성능을 분석하여 리포트를 생성하겠습니다...'
      };

      const response = responses[content as keyof typeof responses] || 
        `"${content}"에 대해 분석하고 있습니다. 서버 상태를 확인해보세요.`;

      addMessage({
        type: 'ai',
        content: response,
        hasChart: content.includes('리포트')
      });
    }, 1500);
  };

  const handleServerClick = (server: typeof servers[0]) => {
    selectServer(server);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* 자동 데모 시나리오 */}
      <AutoDemoScenario />

      {/* 헤더 */}
      <header className="h-20 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity cursor-pointer">
          <motion.div
            className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center"
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Activity className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">OpenManager AI</h1>
            <p className="text-sm text-gray-600">통합 서버 모니터링 & AI 분석 데모</p>
          </div>
        </Link>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-700">정상 {systemStatus.healthyServers}</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">경고 {systemStatus.warningServers}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-gray-700">심각 {systemStatus.criticalServers}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Wifi className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">실시간 연결</span>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* AI 채팅 패널 (좌측 35%) */}
        <div className="w-[35%] border-r border-gray-200">
          <AIChatPanel
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
          />
        </div>

        {/* 서버 모니터링 패널 (우측 65%) */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">서버 모니터링 대시보드</h2>
            <p className="text-gray-600">실시간 서버 상태 및 메트릭을 확인하세요</p>
          </div>

          {/* 서버 그리드 */}
          <div className="grid grid-cols-3 gap-4 h-fit">
            {servers.slice(0, 9).map((server) => (
              <motion.div
                key={server.id}
                layout
                transition={{ duration: 0.3 }}
              >
                <ServerCard
                  server={server}
                  isHighlighted={highlightedServers.includes(server.id)}
                  onClick={() => handleServerClick(server)}
                />
              </motion.div>
            ))}
          </div>

          {/* 추가 서버들 (작은 카드로 표시) */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">추가 서버들</h3>
            <div className="grid grid-cols-5 gap-3">
              {servers.slice(9).map((server) => (
                <motion.div
                  key={server.id}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-all
                    ${highlightedServers.includes(server.id)
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:shadow-md'
                    }
                  `}
                  onClick={() => handleServerClick(server)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-800 truncate">
                      {server.name.split('-')[0]}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      server.status === 'healthy' ? 'bg-green-500' :
                      server.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                  <div className="text-xs text-gray-600">
                    CPU: {server.metrics.cpu}%
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 상태바 */}
      <footer className="h-15 bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>시스템 정상 운영중</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span>{systemStatus.activeAlerts}개 활성 알림</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>마지막 업데이트: {systemStatus.lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>
      </footer>

      {/* 서버 상세 정보 슬라이드 패널 */}
      {selectedServer && (
        <motion.div
          className="fixed right-0 top-0 h-full w-full sm:w-80 md:w-96 bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 20 }}
        >
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">서버 상세 정보</h3>
              <button
                onClick={() => selectServer(null)}
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 text-sm sm:text-base">{selectedServer.name}</h4>
                <p className="text-xs sm:text-sm text-gray-600">{selectedServer.type} • {selectedServer.location}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-600">CPU 사용률</div>
                  <div className="text-lg sm:text-xl font-semibold text-gray-900">{selectedServer.metrics.cpu}%</div>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-600">메모리 사용률</div>
                  <div className="text-lg sm:text-xl font-semibold text-gray-900">{selectedServer.metrics.memory}%</div>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-600">디스크 사용률</div>
                  <div className="text-lg sm:text-xl font-semibold text-gray-900">{selectedServer.metrics.disk}%</div>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-600">네트워크 사용률</div>
                  <div className="text-lg sm:text-xl font-semibold text-gray-900">{selectedServer.metrics.network}%</div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                <div className="text-xs sm:text-sm text-gray-600">업타임</div>
                <div className="text-base sm:text-lg font-semibold text-gray-900">{selectedServer.uptime}일</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
} 