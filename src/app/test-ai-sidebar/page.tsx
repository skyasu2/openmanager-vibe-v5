/**
 * 🧪 AI 사이드바 종합 테스트 페이지
 * 
 * 모든 개선사항이 올바르게 작동하는지 확인:
 * - 타이머 통합 관리
 * - AI 처리 상태 제어
 * - API 응답 구조 호환성
 * - 디버깅 시스템
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AISidebar } from '../../modules/ai-sidebar/components/AISidebar';
import { timerManager } from '../../utils/TimerManager';

export default function TestAISidebarPage() {
  const [isOpen, setIsOpen] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [serverData, setServerData] = useState<any>(null);

  const config = {
    position: 'right' as const,
    theme: 'auto' as const,
    // 필수 속성들 (최소값)
    apiEndpoint: '/api/ai/unified',
    width: 400,
    height: '100vh',
    enableVoice: false,
    enableFileUpload: false,
    enableHistory: true,
    maxHistoryLength: 10,
    title: 'Test AI 사이드바',
    placeholder: '테스트 질문을 입력하세요...'
  };

  // API 상태 확인
  const checkAPIStatus = async () => {
    try {
      setApiStatus('loading');
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      
      setServerData(data);
      setApiStatus('success');
      console.log('✅ API 테스트 성공:', {
        serversCount: data.data?.servers?.length || data.servers?.length || 0,
        hasCompatibility: !!(data.data?.servers && data.servers),
        simulationRunning: data.data?.overview?.simulation_running
      });
    } catch (error) {
      console.error('❌ API 테스트 실패:', error);
      setApiStatus('error');
    }
  };

  // 타이머 디버그 정보 업데이트
  const updateDebugInfo = () => {
    const status = timerManager.getStatus();
    setDebugInfo({
      ...status,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  useEffect(() => {
    // 초기 API 상태 확인
    checkAPIStatus();
    
    // 디버그 정보 업데이트 (5초마다) - TimerManager 사용
    timerManager.register({
      id: 'test-page-debug-info',
      callback: updateDebugInfo,
      interval: 5000,
      priority: 'low'
    });
    updateDebugInfo(); // 즉시 실행
    
    return () => {
      timerManager.unregister('test-page-debug-info');
    };
  }, []);

  const handleToggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleShowTimerDebug = () => {
    timerManager.debugStatus();
    updateDebugInfo();
  };

  const handleTestTimerControl = () => {
    // AI 처리 모드 테스트
    console.log('🧪 AI 처리 모드 테스트 시작');
    timerManager.setAIProcessingMode(true);
    
    // 3초 후 AI 모드 해제 (일회성 작업이므로 setTimeout 사용)
    setTimeout(() => {
      console.log('🧪 AI 처리 모드 테스트 종료');
      timerManager.setAIProcessingMode(false);
      updateDebugInfo();
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 relative">
      {/* 헤더 */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            🧪 AI 사이드바 종합 테스트
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            타이머 통합 관리, AI 처리 상태 제어, API 호환성 등 모든 개선사항을 테스트합니다
          </p>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-6xl mx-auto p-6">
        {/* 컨트롤 패널 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* API 상태 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              📡 API 상태
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  apiStatus === 'success' ? 'bg-green-500' :
                  apiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {apiStatus === 'success' ? '정상' :
                   apiStatus === 'error' ? '오류' : '확인 중...'}
                </span>
              </div>
              {serverData && (
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  서버: {serverData.data?.servers?.length || serverData.servers?.length || 0}개<br/>
                  호환성: {serverData.data?.servers && serverData.servers ? '✅' : '❌'}<br/>
                  시뮬레이션: {serverData.data?.overview?.simulation_running ? '🟢' : '🔴'}
                </div>
              )}
              <button
                onClick={checkAPIStatus}
                className="w-full mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                재확인
              </button>
            </div>
          </motion.div>

          {/* 타이머 상태 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              ⏰ 타이머 관리
            </h3>
            {debugInfo && (
              <div className="space-y-2 text-sm">
                <div>총 타이머: {debugInfo.totalTimers}개</div>
                <div>활성 타이머: {debugInfo.activeTimers}개</div>
                <div className="text-xs text-gray-500">
                  업데이트: {debugInfo.timestamp}
                </div>
              </div>
            )}
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleShowTimerDebug}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                디버그
              </button>
              <button
                onClick={handleTestTimerControl}
                className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
              >
                AI 모드
              </button>
            </div>
          </motion.div>

          {/* 사이드바 제어 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              🤖 AI 사이드바
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {isOpen ? '열림' : '닫힘'}
                </span>
              </div>
              <button
                onClick={handleToggleSidebar}
                className="w-full px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                {isOpen ? '닫기' : '열기'}
              </button>
            </div>
          </motion.div>
        </div>

        {/* 테스트 지침 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700 mb-6"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            📋 테스트 가이드
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-medium mb-2">✅ 확인사항:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>동적 질문 템플릿 회전 (45초)</li>
                <li>실시간 서버 상태 업데이트 (30-45초)</li>
                <li>AI 질문 클릭 시 사고 과정 표시</li>
                <li>AI 처리 중 모든 타이머 정지</li>
                <li>처리 완료 후 타이머 복원</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🧪 테스트 순서:</h4>
              <ol className="space-y-1 list-decimal list-inside">
                <li>API 상태가 정상인지 확인</li>
                <li>타이머 디버그로 등록된 타이머 확인</li>
                <li>AI 모드 버튼으로 타이머 제어 테스트</li>
                <li>사이드바에서 질문 클릭하여 AI 처리 테스트</li>
                <li>브라우저 콘솔에서 상세 로그 확인</li>
              </ol>
            </div>
          </div>
        </motion.div>

        {/* 서버 상태 미리보기 */}
        {serverData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              🖥️ 서버 상태 미리보기
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {serverData.data?.overview?.healthy_servers || 0}
                </div>
                <div className="text-green-600">정상</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <div className="text-2xl font-bold text-yellow-600">
                  {serverData.data?.overview?.warning_servers || 0}
                </div>
                <div className="text-yellow-600">경고</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                <div className="text-2xl font-bold text-red-600">
                  {serverData.data?.overview?.critical_servers || 0}
                </div>
                <div className="text-red-600">심각</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {serverData.data?.overview?.total_servers || 0}
                </div>
                <div className="text-blue-600">전체</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* AI 사이드바 */}
      <AISidebar
        config={config}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="w-96"
      />

      {/* 사이드바 토글 버튼 (모바일) */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={handleToggleSidebar}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 flex items-center justify-center text-xl z-40"
        >
          🤖
        </motion.button>
      )}
    </div>
  );
} 