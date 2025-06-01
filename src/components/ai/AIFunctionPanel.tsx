/**
 * 🎛️ AI 기능 통합 패널 컴포넌트
 * 
 * - 좌측 기능 선택 버튼들
 * - 우측 기능별 패널 표시
 * - 탭 전환 애니메이션
 * - 모바일 대응
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAISidebarStore } from '@/stores/useAISidebarStore';
import FeatureButton, { FunctionTabType } from './FeatureButton';
import QAPanel from './QAPanel';
import AutoReportPanel from './AutoReportPanel';
import ContextSwitchPanel from './ContextSwitchPanel';
import PatternAnalysisPanel from './PatternAnalysisPanel';
import AgentLogPanel from './AgentLogPanel';

interface AIFunctionPanelProps {
  className?: string;
}

const AIFunctionPanel: React.FC<AIFunctionPanelProps> = ({ className = '' }) => {
  const { functionTab, setFunctionTab } = useAISidebarStore();

  const functionButtons = [
    {
      icon: '💬',
      tab: 'qa' as FunctionTabType,
      tooltip: 'AI 질의응답\n프리셋 또는 직접 질문 기반 AI 질의응답'
    },
    {
      icon: '📄',
      tab: 'report' as FunctionTabType,
      tooltip: '장애 보고서\n최근 서버 상태 기반 자동 장애 리포트 생성'
    },
    {
      icon: '📊',
      tab: 'patterns' as FunctionTabType,
      tooltip: '패턴 분석\n장애 유형/변화 패턴 요약 및 차트 표시'
    },
    {
      icon: '🔄',
      tab: 'logs' as FunctionTabType,
      tooltip: '로그 순환\n최근 추론 흐름 및 로그 확인'
    },
    {
      icon: '⚙️',
      tab: 'context' as FunctionTabType,
      tooltip: '컨텍스트 설정\n기본/고급/커스텀 컨텍스트 선택'
    }
  ];

  const handleFunctionChange = (tab: FunctionTabType) => {
    setFunctionTab(tab);
  };

  const renderActivePanel = () => {
    switch (functionTab) {
      case 'qa':
        return <QAPanel key="qa" className="flex-1" />;
      case 'report':
        return <AutoReportPanel key="report" className="flex-1" />;
      case 'patterns':
        return <PatternAnalysisPanel key="patterns" className="flex-1" />;
      case 'logs':
        return <AgentLogPanel key="logs" className="flex-1" />;
      case 'context':
        return <ContextSwitchPanel key="context" className="flex-1" />;
      default:
        return <QAPanel key="default" className="flex-1" />;
    }
  };

  return (
    <div className={`flex h-full bg-gray-900/50 ${className}`}>
      {/* 좌측 기능 버튼 패널 */}
      <div className="w-16 border-r border-gray-700/50 bg-gray-800/30 p-2">
        <div className="space-y-3">
          {functionButtons.map((button) => (
            <FeatureButton
              key={button.tab}
              icon={button.icon}
              tab={button.tab}
              tooltip={button.tooltip}
              isActive={functionTab === button.tab}
              onClick={handleFunctionChange}
            />
          ))}
        </div>
        
        {/* 버튼 패널 하단 */}
        <div className="mt-6 pt-4 border-t border-gray-700/30">
          <div className="text-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mb-1 animate-pulse" />
            <p className="text-gray-500 text-xs">AI 활성</p>
          </div>
        </div>
      </div>

      {/* 우측 기능 패널 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={functionTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ 
              duration: 0.3,
              ease: "easeInOut"
            }}
            className="flex-1 overflow-hidden"
          >
            {renderActivePanel()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIFunctionPanel; 