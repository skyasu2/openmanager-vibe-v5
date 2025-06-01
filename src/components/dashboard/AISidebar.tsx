/**
 * 🤖 AI 사이드바 - UI 리팩토링 v1.0
 * 
 * ✨ 기능:
 * - AI 관련 기능들을 별도 사이드바로 분리
 * - 토글 버튼으로 슬라이드 인/아웃 제어
 * - Pattern Matcher, MCP AI 에이전트, 예측 시스템 포함
 * - 우측 고정 위치, 독립적인 UI 영역
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Brain, 
  TrendingUp, 
  X, 
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Activity,
  BarChart3
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSystemStore } from '@/stores/systemStore';

// Dynamic imports for AI components
const PatternAnalysisWidget = dynamic(() => import('@/components/ai/PatternAnalysisWidget'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64" />,
  ssr: false
});

const PredictionDashboard = dynamic(() => import('@/components/prediction/PredictionDashboard'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-80" />,
  ssr: false
});

const AISidebarV5 = dynamic(() => import('@/components/ai/sidebar/AISidebarV5'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-full" />,
  ssr: false
});

interface AISidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  position?: 'left' | 'right';
  width?: number;
}

const FloatingToggleButton: React.FC<{
  isOpen: boolean;
  onClick: () => void;
  position: 'left' | 'right';
  aiEnabled: boolean;
}> = ({ isOpen, onClick, position, aiEnabled }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`fixed top-1/2 -translate-y-1/2 z-50 p-3 rounded-full shadow-lg transition-all ${
      position === 'right' 
        ? `${isOpen ? 'right-[400px]' : 'right-4'}` 
        : `${isOpen ? 'left-[400px]' : 'left-4'}`
    } ${
      aiEnabled 
        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
        : 'bg-gray-500 text-white'
    }`}
    title={aiEnabled ? 'AI 사이드바 토글' : 'AI 기능이 비활성화됨'}
    disabled={!aiEnabled}
  >
    {isOpen ? (
      position === 'right' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />
    ) : (
      <Bot className="w-5 h-5" />
    )}
  </motion.button>
);

const AIFeatureCard: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  isActive: boolean;
  children: React.ReactNode;
}> = ({ title, description, icon: Icon, isActive, children }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isActive ? 'bg-purple-100' : 'bg-gray-100'}`}>
          <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-gray-500'}`} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <div className="ml-auto">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
      </div>
    </div>
    <div className="p-4">
      {children}
    </div>
  </div>
);

export const AISidebar: React.FC<AISidebarProps> = ({
  isOpen,
  onToggle,
  onClose,
  position = 'right',
  width = 400
}) => {
  const { aiAgent } = useSystemStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'predictions' | 'chat'>('overview');

  // ESC 키로 사이드바 닫기
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: position === 'right' ? width : -width,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };

  const overlayVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 }
  };

  return (
    <>
      {/* 플로팅 토글 버튼 */}
      <FloatingToggleButton
        isOpen={isOpen}
        onClick={onToggle}
        position={position}
        aiEnabled={aiAgent.isEnabled}
      />

      {/* 사이드바 및 오버레이 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={overlayVariants}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={onClose}
            />

            {/* 사이드바 */}
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={sidebarVariants}
              className={`fixed top-0 ${position}-0 h-full bg-gray-50 shadow-xl z-50 overflow-hidden`}
              style={{ width }}
            >
              {/* 헤더 */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold">AI 기능 센터</h2>
                      <p className="text-xs text-purple-100">
                        {aiAgent.isEnabled ? '활성화됨' : '비활성화됨'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* AI 비활성화 상태 */}
              {!aiAgent.isEnabled && (
                <div className="p-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                    <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <h3 className="font-semibold text-orange-800 mb-1">AI 기능 비활성화</h3>
                    <p className="text-sm text-orange-600 mb-3">
                      AI 기능을 사용하려면 먼저 활성화해주세요.
                    </p>
                    <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors">
                      AI 활성화
                    </button>
                  </div>
                </div>
              )}

              {/* AI 활성화 상태 - 탭 네비게이션 */}
              {aiAgent.isEnabled && (
                <>
                  <div className="border-b border-gray-200 bg-white">
                    <div className="flex">
                      {[
                        { id: 'overview', label: '개요', icon: BarChart3 },
                        { id: 'patterns', label: '패턴', icon: Activity },
                        { id: 'predictions', label: '예측', icon: TrendingUp },
                        { id: 'chat', label: '채팅', icon: Bot }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`flex-1 p-3 text-xs font-medium transition-colors ${
                            activeTab === tab.id
                              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <tab.icon className="w-4 h-4 mx-auto mb-1" />
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 탭 콘텐츠 */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {activeTab === 'overview' && (
                      <div className="space-y-4">
                        <AIFeatureCard
                          title="AI 상태 요약"
                          description="전체 AI 시스템 현황"
                          icon={Brain}
                          isActive={aiAgent.isEnabled}
                        >
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>총 쿼리</span>
                              <span className="font-medium">{aiAgent.totalQueries || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>MCP 상태</span>
                              <span className={`font-medium ${
                                aiAgent.mcpStatus === 'connected' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {aiAgent.mcpStatus}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>마지막 활성화</span>
                              <span className="font-medium text-gray-500">
                                {aiAgent.lastActivated ? new Date(aiAgent.lastActivated).toLocaleTimeString() : '-'}
                              </span>
                            </div>
                          </div>
                        </AIFeatureCard>
                      </div>
                    )}

                    {activeTab === 'patterns' && (
                      <AIFeatureCard
                        title="패턴 분석"
                        description="실시간 이상 패턴 감지"
                        icon={Activity}
                        isActive={true}
                      >
                        <PatternAnalysisWidget />
                      </AIFeatureCard>
                    )}

                    {activeTab === 'predictions' && (
                      <AIFeatureCard
                        title="예측 분석"
                        description="머신러닝 기반 장애 예측"
                        icon={TrendingUp}
                        isActive={true}
                      >
                        <PredictionDashboard 
                          serverId="web-server-01"
                          autoRefresh={true}
                          refreshInterval={30000}
                        />
                      </AIFeatureCard>
                    )}

                    {activeTab === 'chat' && (
                      <AIFeatureCard
                        title="AI 채팅"
                        description="자연어 기반 시스템 제어"
                        icon={Bot}
                        isActive={true}
                      >
                        <AISidebarV5 
                          isOpen={true} 
                          onClose={() => {}}
                        />
                      </AIFeatureCard>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}; 