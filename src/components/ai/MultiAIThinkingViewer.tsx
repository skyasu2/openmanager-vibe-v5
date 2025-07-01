/**
 * 🚀 Multi-AI 사고 과정 시각화 컴포넌트
 * 
 * Resilient Dual-Core + 3-Mode Google AI 아키텍처 전용
 * - MCP Engine, RAG Engine, Google AI 동시 사고 과정 표시
 * - 실시간 타이핑 애니메이션
 * - 각 단계별 펼치기/접기 기능
 * - 이모티콘 기반 직관적 UI
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Database, 
  Search, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';

export interface MultiAIThinkingStep {
  id: string;
  engine: 'mcp' | 'rag' | 'google-ai' | 'fusion';
  type: 'processing' | 'searching' | 'analyzing' | 'completed' | 'failed';
  title: string;
  content: string;
  confidence?: number;
  responseTime?: number;
  timestamp: Date;
  details?: string[];
}

export interface MultiAIThinkingProps {
  mode: 'AUTO' | 'LOCAL' | 'GOOGLE_ONLY';
  isThinking: boolean;
  steps: MultiAIThinkingStep[];
  currentQuery?: string;
  className?: string;
}

const engineConfig = {
  mcp: {
    name: 'MCP Engine',
    icon: '🔧',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  rag: {
    name: 'RAG Engine', 
    icon: '🔍',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  'google-ai': {
    name: 'Google AI',
    icon: '🤖',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  fusion: {
    name: 'Result Fusion',
    icon: '⚡',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  }
};

const typeConfig = {
  processing: { icon: '⚙️', label: '처리 중' },
  searching: { icon: '🔍', label: '검색 중' },
  analyzing: { icon: '🧠', label: '분석 중' },
  completed: { icon: '✅', label: '완료' },
  failed: { icon: '❌', label: '실패' }
};

export const MultiAIThinkingViewer: React.FC<MultiAIThinkingProps> = ({
  mode,
  isThinking,
  steps,
  currentQuery,
  className = ''
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [isMainExpanded, setIsMainExpanded] = useState(true);

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getModeDisplay = () => {
    switch (mode) {
      case 'AUTO': return '🔄 AUTO 모드 (MCP+RAG → Google AI 백업)';
      case 'LOCAL': return '🏠 LOCAL 모드 (MCP+RAG 전용)';
      case 'GOOGLE_ONLY': return '🤖 GOOGLE_ONLY 모드 (Google AI 전용)';
      default: return '🤔 알 수 없는 모드';
    }
  };

  const TypewriterText: React.FC<{ text: string; speed?: number }> = ({ 
    text, 
    speed = 30 
  }) => {
    const [displayText, setDisplayText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
      if (currentIndex < text.length) {
        const timer = setTimeout(() => {
          setDisplayText(prev => prev + text[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        }, speed);
        return () => clearTimeout(timer);
      }
    }, [currentIndex, text, speed]);

    useEffect(() => {
      setDisplayText('');
      setCurrentIndex(0);
    }, [text]);

    return (
      <span>
        {displayText}
        {currentIndex < text.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="inline-block w-0.5 h-4 bg-current ml-0.5"
          />
        )}
      </span>
    );
  };

  if (!isThinking && steps.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* 헤더 */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsMainExpanded(!isMainExpanded)}
      >
        <div className="flex items-center space-x-3">
          <motion.div
            animate={isThinking ? { 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            } : {}}
            transition={{ 
              duration: 2, 
              repeat: isThinking ? Infinity : 0 
            }}
            className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white"
          >
            🧠
          </motion.div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Multi-AI 사고 과정
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getModeDisplay()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isThinking && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex space-x-1"
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            </motion.div>
          )}
          <motion.div
            animate={{ rotate: isMainExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </motion.div>
        </div>
      </div>

      {/* 현재 질문 */}
      {currentQuery && isMainExpanded && (
        <div className="px-4 pb-2">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                💬 현재 질문:
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentQuery}
            </p>
          </div>
        </div>
      )}

      {/* 사고 과정 단계들 */}
      <AnimatePresence>
        {isMainExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {steps.map((step, index) => {
                const engine = engineConfig[step.engine];
                const type = typeConfig[step.type];
                const isExpanded = expandedSteps.has(step.id);
                
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border rounded-lg ${engine.borderColor} ${engine.bgColor}`}
                  >
                    {/* 단계 헤더 */}
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/50 transition-colors"
                      onClick={() => toggleStep(step.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{engine.icon}</span>
                          <span className="text-xs">{type.icon}</span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${engine.color}`}>
                              {engine.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {type.label}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <TypewriterText text={step.title} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {step.confidence && (
                          <span className="text-xs text-gray-500">
                            {Math.round(step.confidence * 100)}%
                          </span>
                        )}
                        {step.responseTime && (
                          <span className="text-xs text-gray-500">
                            {step.responseTime}ms
                          </span>
                        )}
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </motion.div>
                      </div>
                    </div>

                    {/* 단계 상세 내용 */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="pt-3 space-y-2">
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                <TypewriterText text={step.content} speed={20} />
                              </div>
                              
                              {step.details && step.details.length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium text-gray-500">
                                    상세 정보:
                                  </div>
                                  {step.details.map((detail, idx) => (
                                    <div key={idx} className="text-xs text-gray-500 pl-2 border-l-2 border-gray-300">
                                      • {detail}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {/* 진행 중 표시 */}
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center p-4 text-gray-500"
                >
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex items-center space-x-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">AI가 열심히 생각하고 있습니다...</span>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 