/**
 * 🧪 AI 사이드바 테스트 페이지
 * 
 * 새로운 AI 사이드바 기능들을 테스트하는 페이지
 * - 실시간 서버 상황 표시
 * - 15초마다 바뀌는 동적 질문 템플릿
 * - 통합 AI 응답 (질문→사고과정→답변)
 */

'use client';

import React, { useState } from 'react';
import { AISidebar, type AISidebarConfig } from '../../modules/ai-sidebar';

export default function TestAISidebarPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // AI 사이드바 설정
  const sidebarConfig: AISidebarConfig = {
    // API 설정
    apiEndpoint: '/api/ai/unified',
    
    // UI 설정
    theme: 'auto',
    position: 'right',
    width: 450,
    height: '100vh',
    
    // 기능 설정
    enableVoice: false,
    enableFileUpload: false,
    enableHistory: true,
    maxHistoryLength: 10,
    
    // 커스터마이징
    title: 'OpenManager AI 🧠',
    placeholder: 'AI에게 질문하세요...',
    welcomeMessage: '안녕하세요! OpenManager AI 에이전트입니다. 서버 모니터링, 성능 분석, 장애 예측 등에 대해 궁금한 점을 자유롭게 물어보세요.',
    
    // 이벤트 핸들러
    onMessage: (message) => {
      console.log('📨 사용자 메시지:', message);
    },
    onResponse: (response) => {
      console.log('🤖 AI 응답:', response);
    },
    onError: (error) => {
      console.error('❌ AI 사이드바 오류:', error);
    },
    onOpen: () => {
      console.log('✅ AI 사이드바 열림');
    },
    onClose: () => {
      console.log('❌ AI 사이드바 닫힘');
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🧪 AI 사이드바 테스트
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            LangGraph + ReAct 프레임워크를 활용한 차세대 AI 인터페이스
          </p>
          
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="
              inline-flex items-center px-8 py-4 
              bg-gradient-to-r from-blue-600 to-indigo-600 
              hover:from-blue-700 hover:to-indigo-700
              text-white font-semibold rounded-xl shadow-lg hover:shadow-xl
              transform hover:scale-105 transition-all duration-200
              text-lg
            "
          >
            <span className="mr-3">🚀</span>
            AI 사이드바 열기
          </button>
        </div>

        {/* 기능 소개 */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              실시간 서버 상황
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              15초마다 업데이트되는 서버 상태 요약과 시각적 진행률 바
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              동적 질문 템플릿
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              서버 상황에 맞춰 자동으로 바뀌는 질문 제안과 우선순위 시스템
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-3xl mb-4">🧠</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              LangGraph 사고 과정
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              AI의 사고 과정을 5단계로 시각화하여 투명성과 신뢰도 향상
            </p>
          </div>
        </div>

        {/* ReAct 프레임워크 설명 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <span className="mr-3">🤖</span>
            ReAct 프레임워크 통합
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Before: 기존 AI 인터페이스
              </h3>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-sm">
                <p className="text-gray-600 dark:text-gray-400 mb-2">사용자: "서버 상태 확인"</p>
                <p className="text-gray-500 dark:text-gray-500 mb-2">[3초 대기...]</p>
                <p className="text-gray-800 dark:text-gray-200">AI: "정상입니다"</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                After: LangGraph + ReAct
              </h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm">
                <p className="text-blue-800 dark:text-blue-200 mb-1">💭 "사용자가 서버 상태에 대해 질문했습니다"</p>
                <p className="text-green-800 dark:text-green-200 mb-1">👀 "20개 서버 상태 확인 완료"</p>
                <p className="text-orange-800 dark:text-orange-200 mb-1">⚡ "server_status_check 분석 실행"</p>
                <p className="text-purple-800 dark:text-purple-200">✅ "전체 20개 서버 중: 정상 15개, 경고 3개, 오류 2개"</p>
              </div>
            </div>
          </div>
        </div>

        {/* 사용 가이드 */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-8 border border-green-200 dark:border-green-800">
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-6 flex items-center">
            <span className="mr-3">📋</span>
            사용 가이드
          </h2>
          
          <div className="space-y-4 text-green-700 dark:text-green-300">
            <div className="flex items-start space-x-3">
              <span className="font-bold text-green-600 dark:text-green-400">1.</span>
              <p>상단의 <strong>"AI 사이드바 열기"</strong> 버튼을 클릭하세요</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="font-bold text-green-600 dark:text-green-400">2.</span>
              <p>실시간 서버 상황 표시줄에서 현재 시스템 상태를 확인하세요</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="font-bold text-green-600 dark:text-green-400">3.</span>
              <p>동적 질문 템플릿 아이콘들을 마우스 오버하여 세부 내용을 확인하세요</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="font-bold text-green-600 dark:text-green-400">4.</span>
              <p>질문 아이콘을 클릭하거나 직접 질문을 입력해보세요</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="font-bold text-green-600 dark:text-green-400">5.</span>
              <p>AI의 5단계 사고 과정을 실시간으로 관찰하세요</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI 사이드바 */}
      <AISidebar
        config={sidebarConfig}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        className="z-50"
      />
    </div>
  );
} 