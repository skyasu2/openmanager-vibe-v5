'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Search, 
  Zap, 
  CheckCircle, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  Activity
} from 'lucide-react';
import { useAIThinking } from '@/stores/useAISidebarStore';
import type { AgentLog } from '@/stores/useAISidebarStore';

interface AgentThinkingPanelProps {
  className?: string;
  showDetails?: boolean;
}

// 🎯 단계별 정보
const STEP_INFO = {
  context: {
    icon: Search,
    title: '컨텍스트 분석',
    description: '서버 상태 데이터를 수집하고 분석하고 있습니다...',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20'
  },
  match: {
    icon: Brain,
    title: '패턴 매칭',
    description: 'AI가 기존 패턴과 매칭하여 최적의 답변을 찾고 있습니다...',
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/20'
  },
  generate: {
    icon: Zap,
    title: '응답 생성',
    description: '분석된 데이터를 바탕으로 답변을 생성하고 있습니다...',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20'
  },
  validation: {
    icon: CheckCircle,
    title: '검증 및 후처리',
    description: '생성된 답변의 정확성을 검증하고 있습니다...',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20'
  }
};

export default function AgentThinkingPanel({ 
  className = '',
  showDetails = true 
}: AgentThinkingPanelProps) {
  const { 
    isThinking, 
    activeStep, 
    thinkingLogs, 
    processingProgress 
  } = useAIThinking();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');

  // 타자기 효과로 로그 표시
  useEffect(() => {
    if (thinkingLogs.length === 0) return;
    
    const currentLog = thinkingLogs[currentLogIndex];
    if (!currentLog) return;

    let charIndex = 0;
    setDisplayedText('');
    
    const typeInterval = setInterval(() => {
      if (charIndex < currentLog.length) {
        setDisplayedText(currentLog.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        // 2초 후 다음 로그로 이동
        setTimeout(() => {
          if (currentLogIndex < thinkingLogs.length - 1) {
            setCurrentLogIndex(currentLogIndex + 1);
          }
        }, 2000);
      }
    }, 30); // 30ms마다 한 글자씩

    return () => clearInterval(typeInterval);
  }, [currentLogIndex, thinkingLogs]);

  // 새 로그가 추가되면 인덱스 업데이트
  useEffect(() => {
    if (thinkingLogs.length > 0) {
      setCurrentLogIndex(thinkingLogs.length - 1);
    }
  }, [thinkingLogs.length]);

  if (!isThinking) {
    return null;
  }

  const currentStepInfo = activeStep ? STEP_INFO[activeStep] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl backdrop-blur-sm ${className}`}
    >
      {/* 헤더 */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg"
            >
              <Brain className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <h3 className="text-white font-medium">AI 사고 과정</h3>
              <p className="text-xs text-gray-400">실시간 분석 중...</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-700/50 rounded-md transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>

        {/* 진행률 바 */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>진행률</span>
            <span>{Math.round(processingProgress)}%</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${processingProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* 현재 단계 */}
              {currentStepInfo && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`p-3 ${currentStepInfo.bgColor} border border-slate-600/30 rounded-lg`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <currentStepInfo.icon className={`w-5 h-5 ${currentStepInfo.color}`} />
                    <h4 className="text-white font-medium">{currentStepInfo.title}</h4>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Loader2 className={`w-4 h-4 ${currentStepInfo.color} animate-spin`} />
                    </motion.div>
                  </div>
                  <p className="text-sm text-gray-300">{currentStepInfo.description}</p>
                </motion.div>
              )}

              {/* 실시간 로그 */}
              {showDetails && thinkingLogs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    실시간 로그
                  </h4>
                  
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {thinkingLogs.map((log, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-2 bg-slate-800/30 rounded-md text-xs ${
                          index === currentLogIndex ? 'border border-purple-500/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date().toLocaleTimeString()}</span>
                        </div>
                        <p className="text-gray-300">
                          {index === currentLogIndex ? displayedText : log}
                          {index === currentLogIndex && displayedText.length < log.length && (
                            <motion.span
                              animate={{ opacity: [1, 0] }}
                              transition={{ duration: 0.8, repeat: Infinity }}
                              className="text-purple-400"
                            >
                              |
                            </motion.span>
                          )}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* 단계 요약 */}
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(STEP_INFO).map(([step, info]) => {
                  const isActive = activeStep === step;
                  const isCompleted = !isActive && Object.keys(STEP_INFO).indexOf(step) < Object.keys(STEP_INFO).indexOf(activeStep || 'context');
                  
                  return (
                    <motion.div
                      key={step}
                      className={`p-2 rounded-lg text-center transition-all ${
                        isActive 
                          ? `${info.bgColor} border border-slate-600/30` 
                          : isCompleted
                          ? 'bg-green-500/20 border border-green-500/30'
                          : 'bg-slate-800/30 border border-slate-700/30'
                      }`}
                      animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <info.icon className={`w-4 h-4 mx-auto mb-1 ${
                        isActive 
                          ? info.color 
                          : isCompleted
                          ? 'text-green-400'
                          : 'text-gray-500'
                      }`} />
                      <p className={`text-xs font-medium ${
                        isActive 
                          ? 'text-white' 
                          : isCompleted
                          ? 'text-green-300'
                          : 'text-gray-500'
                      }`}>
                        {info.title.split(' ')[0]}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 