/**
 * 🤖 통합 AI 응답 컴포넌트
 * 
 * 질문 → 생각 과정 → 답변을 하나의 접힌/펼친 형태로 표시
 * - 동적 사고 과정 애니메이션
 * - LangGraph 스타일 사고 추적
 * - 동일한 크기로 접힌 채로 존재
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLangGraphThinking } from '../../../components/ai/modal-v2/hooks/useLangGraphThinking';
import LangGraphThinkingDisplay from '../../../components/ai/modal-v2/components/LangGraphThinkingDisplay';
import { MCPLangGraphAgent } from '../../../services/ai-agent/MCPLangGraphAgent';

interface IntegratedAIResponseProps {
  question: string;
  isProcessing: boolean;
  onComplete: () => void;
  className?: string;
}

export const IntegratedAIResponse: React.FC<IntegratedAIResponseProps> = ({
  question,
  isProcessing,
  onComplete,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [response, setResponse] = useState<string>('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState<string>('준비 중...');

  const {
    startThinking,
    completeThinking,
    allSteps,
    reactSteps,
    currentStep,
    animate,
    finalAnswer,
    isThinking: hookIsThinking
  } = useLangGraphThinking({
    autoAnimate: true,
    showReActSteps: true
  });

  // 질문 처리 시작 - 무한 루프 방지 및 강력한 상태 보호
  useEffect(() => {
    let isMounted = true;
    
    const processQuestionSafely = async () => {
      if (!isMounted || !isProcessing || !question || isThinking || response) {
        return;
      }
      
      console.log('🤖 AI 질문 처리 시작:', question);
      setIsThinking(true);
      setResponse('');
      
      try {
        console.log('🔄 LangGraph 사고 흐름 시작...');
        // LangGraph 사고 흐름 시작
        const sessionId = `sidebar_${Date.now()}`;
        if (isMounted) {
          try {
            startThinking(sessionId, question, 'enterprise');
            console.log('✅ LangGraph 시작 성공');
          } catch (langError) {
            console.error('❌ LangGraph 시작 실패:', langError);
            throw new Error('LangGraph 초기화 실패');
          }
        }
        
        console.log('🤖 MCP Agent 초기화 중...');
        // MCP Agent 초기화
        try {
          const mcpAgent = MCPLangGraphAgent.getInstance();
          await mcpAgent.initialize();
          console.log('✅ MCP Agent 초기화 완료');
          
          // 질문 처리
          const mcpQuery = {
            id: `query_${Date.now()}`,
            question: question,
            priority: 'high' as const,
            category: determineCategory(question)
          };
          
          console.log('🚀 질문 처리 시작:', mcpQuery);
          
          if (isMounted) {
            try {
              const result = await mcpAgent.processQuery(mcpQuery);
              console.log('✅ 질문 처리 완료:', result);
              
              // 응답 설정
              if (isMounted) {
                setResponse(result.answer);
                setIsThinking(false);
                completeThinking(result);
                
                // 완료 콜백 (지연 실행)
                setTimeout(() => {
                  if (isMounted) {
                    onComplete();
                  }
                }, 2000); // 2초로 연장하여 사용자가 결과를 확인할 시간 제공
              }
            } catch (queryError) {
              console.error('❌ 질문 처리 실패:', queryError);
              throw new Error(`질문 처리 중 오류: ${queryError instanceof Error ? queryError.message : '알 수 없는 오류'}`);
            }
          }
        } catch (mcpError) {
          console.error('❌ MCP Agent 오류:', mcpError);
          throw new Error(`MCP Agent 오류: ${mcpError instanceof Error ? mcpError.message : '알 수 없는 오류'}`);
        }
      } catch (error) {
        console.error('❌ AI 질문 처리 실패:', error);
        if (isMounted) {
          setResponse('죄송합니다. 질문 처리 중 오류가 발생했습니다.');
          setIsThinking(false);
          onComplete();
        }
      }
    };

    if (isProcessing && question && !isThinking && !response) {
      processQuestionSafely();
    }

    return () => {
      isMounted = false;
    };
  }, [isProcessing, question]); // 의존성 최소화

  const determineCategory = (question: string): 'monitoring' | 'analysis' | 'prediction' | 'incident' | 'general' => {
    const lowered = question.toLowerCase();
    if (lowered.includes('상태') || lowered.includes('모니터링')) return 'monitoring';
    if (lowered.includes('분석') || lowered.includes('성능')) return 'analysis';
    if (lowered.includes('예측') || lowered.includes('장애')) return 'prediction';
    if (lowered.includes('알림') || lowered.includes('오류')) return 'incident';
    return 'general';
  };

  const getThinkingPhaseText = () => {
    if (!currentStep) return '질문을 분석하고 있습니다...';
    
    switch (currentStep.type) {
      case 'analysis': return '질문 의도를 파악하고 있습니다...';
      case 'query': return '관련 데이터를 수집하고 있습니다...';
      case 'processing': return '수집된 정보를 분석하고 있습니다...';
      case 'prediction': return 'AI 기반 예측을 수행하고 있습니다...';
      case 'summary': return '결과를 종합하고 있습니다...';
      case 'validation': return '답변을 검증하고 있습니다...';
      default: return currentStep.title;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-sm ${className}`}>
      {/* 헤더 - 질문 */}
      <motion.div
        className="p-4 border-b dark:border-gray-700 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              Q
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {question}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isThinking ? '처리 중...' : response ? '완료됨' : '대기 중'}
              </div>
            </div>
          </div>
          
          <motion.button
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.button>
        </div>
      </motion.div>

      {/* 확장 가능한 내용 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {/* 사고 과정 */}
            {(isThinking || allSteps.length > 0) && (
              <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center space-x-2 mb-3">
                  <motion.div
                    className="w-2 h-2 bg-yellow-400 rounded-full"
                    animate={{
                      scale: isThinking ? [1, 1.2, 1] : 1,
                      opacity: isThinking ? [1, 0.6, 1] : 1,
                    }}
                    transition={{
                      duration: 1,
                      repeat: isThinking ? Infinity : 0,
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    AI 사고 과정
                  </span>
                  {isThinking && (
                    <motion.span
                      className="text-xs text-yellow-600 dark:text-yellow-400"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      생각하는 중...
                    </motion.span>
                  )}
                </div>

                {/* LangGraph 사고 과정 표시 */}
                {allSteps.length > 0 ? (
                  <LangGraphThinkingDisplay
                    steps={allSteps}
                    reactSteps={reactSteps}
                    currentStep={currentStep}
                    isThinking={isThinking}
                    animate={animate}
                    showReActSteps={true}
                    compact={true}
                  />
                ) : isThinking ? (
                  <div className="flex items-center space-x-3">
                    <motion.div
                      className="flex space-x-1"
                      animate={{
                        x: [0, 10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-blue-400 rounded-full"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </motion.div>
                    <motion.span
                      className="text-sm text-gray-600 dark:text-gray-400"
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {getThinkingPhaseText()}
                    </motion.span>
                  </div>
                ) : null}
              </div>
            )}

            {/* 답변 */}
            {response && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    A
                  </div>
                  <div className="flex-1">
                    <motion.div
                      className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      {response.split('\n').map((line, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 + 0.4 }}
                          className={line.trim() === '' ? 'h-2' : 'mb-2'}
                        >
                          {line}
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* 응답 메타데이터 */}
                    <motion.div
                      className="mt-3 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      <span>✅ 분석 완료</span>
                      {allSteps.length > 0 && (
                        <span>{allSteps.length}단계 처리</span>
                      )}
                      <span>{new Date().toLocaleTimeString()}</span>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 접혔을 때 미니 상태 표시 */}
      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-2 text-center"
        >
          <div className="flex items-center justify-center space-x-2">
            {isThinking ? (
              <>
                <motion.div
                  className="w-1.5 h-1.5 bg-yellow-400 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.6, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                />
                <span className="text-xs text-gray-500">처리 중...</span>
              </>
            ) : response ? (
              <>
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                <span className="text-xs text-gray-500">답변 완료</span>
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                <span className="text-xs text-gray-500">대기 중</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}; 