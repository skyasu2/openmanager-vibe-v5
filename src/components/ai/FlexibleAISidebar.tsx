/**
 * 🤖 유연한 AI 사이드바 컴포넌트
 * 
 * 새로운 AI 사이드바 모듈을 활용한 통합 컴포넌트
 * - 실시간 서버 상황 표시
 * - 동적 질문 템플릿
 * - 통합 AI 응답 (질문→사고과정→답변)
 */

'use client';

import React from 'react';
import { AISidebar, type AISidebarConfig } from '../../modules/ai-sidebar';

interface FlexibleAISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  serverMetrics?: any;
}

export default function FlexibleAISidebar({ 
  isOpen, 
  onClose, 
  serverMetrics 
}: FlexibleAISidebarProps) {
  
  // AI 사이드바 설정
  const sidebarConfig: AISidebarConfig = {
    // API 설정
    apiEndpoint: '/api/ai/unified',
    
    // UI 설정
    theme: 'auto',
    position: 'right',
    width: 400,
    height: '100vh',
    
    // 기능 설정
    enableVoice: false,
    enableFileUpload: false,
    enableHistory: true,
    maxHistoryLength: 10,
    
    // 커스터마이징
    title: 'OpenManager AI',
    placeholder: 'AI에게 질문하세요...',
    welcomeMessage: '안녕하세요! OpenManager AI 에이전트입니다. 서버 모니터링, 성능 분석, 장애 예측 등에 대해 궁금한 점을 자유롭게 물어보세요.',
    
    // 이벤트 핸들러
    onMessage: (message) => {
      console.log('사용자 메시지:', message);
    },
    onResponse: (response) => {
      console.log('AI 응답:', response);
    },
    onError: (error) => {
      console.error('AI 사이드바 오류:', error);
    },
    onOpen: () => {
      console.log('AI 사이드바 열림');
    },
    onClose: () => {
      console.log('AI 사이드바 닫힘');
      onClose();
    }
  };

  return (
    <AISidebar
      config={sidebarConfig}
      isOpen={isOpen}
      onClose={onClose}
      className="z-50"
    />
  );
} 