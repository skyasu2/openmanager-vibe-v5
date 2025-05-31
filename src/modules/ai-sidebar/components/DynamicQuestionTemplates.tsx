/**
 * 🎯 동적 질문 템플릿 컴포넌트
 * 
 * 15초마다 바뀌는 서버 상황 기반 질문 템플릿
 * - 작은 아이콘 형태로 표시
 * - 마우스 오버 시 툴팁으로 질문 내용 표시
 * - 클릭 시 즉시 질문 처리 시작
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { timerManager } from '../../../utils/TimerManager';

interface QuestionTemplate {
  id: string;
  question: string;
  icon: string;
  category: 'monitoring' | 'analysis' | 'prediction' | 'incident';
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  description: string;
}

interface DynamicQuestionTemplatesProps {
  onQuestionSelect: (question: string) => void;
  isProcessing?: boolean;
  className?: string;
}

const questionTemplates: QuestionTemplate[] = [
  {
    id: 'server_status',
    question: '현재 서버 상태는 어떤가요?',
    icon: '🖥️',
    category: 'monitoring',
    priority: 'high',
    enabled: true,
    description: '전체 서버의 현재 상태와 헬스체크 결과를 확인합니다'
  },
  {
    id: 'critical_alerts',
    question: '심각한 알림이 있나요?',
    icon: '🚨',
    category: 'incident',
    priority: 'critical',
    enabled: true,
    description: '심각도가 높은 알림과 즉시 대응이 필요한 이슈를 확인합니다'
  },
  {
    id: 'performance_analysis',
    question: '서버 성능 분석 결과는?',
    icon: '📊',
    category: 'analysis',
    priority: 'medium',
    enabled: true,
    description: 'CPU, 메모리, 디스크 사용률 및 응답시간을 종합 분석합니다'
  },
  {
    id: 'failure_prediction',
    question: '장애 예측 결과를 알려주세요',
    icon: '🔮',
    category: 'prediction',
    priority: 'high',
    enabled: true,
    description: 'AI 기반 장애 예측 모델의 최신 분석 결과를 제공합니다'
  },
  {
    id: 'memory_issues',
    question: '메모리 사용률이 높은 서버는?',
    icon: '💾',
    category: 'monitoring',
    priority: 'high',
    enabled: true,
    description: '메모리 사용률 80% 이상인 서버들의 상세 정보를 확인합니다'
  },
  {
    id: 'disk_space',
    question: '디스크 공간이 부족한 서버는?',
    icon: '💿',
    category: 'monitoring',
    priority: 'medium',
    enabled: true,
    description: '디스크 사용률이 높거나 여유 공간이 부족한 서버를 찾습니다'
  },
  {
    id: 'network_latency',
    question: '네트워크 지연이 발생하고 있나요?',
    icon: '🌐',
    category: 'analysis',
    priority: 'medium',
    enabled: true,
    description: '네트워크 응답시간과 연결 상태를 실시간으로 모니터링합니다'
  },
  {
    id: 'load_balancing',
    question: '로드 밸런싱 상태는 어떤가요?',
    icon: '⚖️',
    category: 'analysis',
    priority: 'low',
    enabled: true,
    description: '서버 간 부하 분산 상태와 트래픽 분배 효율성을 분석합니다'
  }
];

export const DynamicQuestionTemplates: React.FC<DynamicQuestionTemplatesProps> = ({
  onQuestionSelect,
  isProcessing = false,
  className = ''
}) => {
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(true);

  // 🔄 자동 질문 회전 (45초마다, 상호작용 시 더 활발하게)
  useEffect(() => {
    // AI 처리 중이면 모든 타이머 정지
    if (isProcessing) {
      console.log('🚫 AI 처리 중 - 질문 회전 정지');
      setIsRotating(false);
      timerManager.unregister('dynamic-question-rotation');
      timerManager.unregister('dynamic-question-interaction');
      return;
    }

    console.log('🔄 질문 회전 타이머 시작');
    setIsRotating(true);

    const baseInterval = 45000; // 기본 45초
    const activeInterval = 25000; // 활발한 상태일 때 25초

    // 사용자 상호작용 감지
    let lastInteraction = Date.now();
    const handleUserInteraction = () => {
      lastInteraction = Date.now();
    };

    // 전역 이벤트 리스너 등록
    window.addEventListener('mousemove', handleUserInteraction);
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    const rotateQuestions = () => {
      if (isProcessing) {
        console.log('🚫 회전 실행 취소 - AI 처리 중');
        return;
      }
      
      // 최근 2분 내 상호작용이 있었다면 더 빠르게
      const isUserActive = Date.now() - lastInteraction < 2 * 60 * 1000;
      const interval = isUserActive ? activeInterval : baseInterval;
      
      console.log('🎯 질문 회전 실행 - 다음 간격:', interval / 1000 + '초');
      setCurrentTemplateIndex((prev) => (prev + 1) % questionTemplates.length);
      
      // 동적 간격 조정
      timerManager.unregister('dynamic-question-rotation');
      timerManager.register({
        id: 'dynamic-question-rotation',
        callback: rotateQuestions,
        interval: interval,
        priority: 'medium',
        enabled: true
      });
    };

    // TimerManager에 등록
    timerManager.register({
      id: 'dynamic-question-rotation',
      callback: rotateQuestions,
      interval: baseInterval,
      priority: 'medium',
      enabled: true
    });

    return () => {
      console.log('🧹 질문 회전 타이머 정리');
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      timerManager.unregister('dynamic-question-rotation');
      timerManager.unregister('dynamic-question-interaction');
    };
  }, [isProcessing]); // 의존성을 isProcessing만으로 단순화

  // 🎯 서버 상황 기반 질문 우선순위 업데이트 (2분마다)
  useEffect(() => {
    if (isProcessing) return; // AI 처리 중에는 우선순위 업데이트 중지

    const updateBasedOnServerStatus = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const data = await response.json();
          // API 응답 구조에 맞춰 서버 데이터 접근
          const servers = data.data?.servers || data.servers || [];
          
          console.log('🎯 질문 우선순위 업데이트 - 서버 데이터:', servers.length + '개');
          
          // 서버 상황 분석
          const criticalCount = servers.reduce((count: number, s: any) => {
            return count + (s.alerts || []).filter((a: any) => Number(a.severity) >= 3).length;
          }, 0);
          
          const errorServers = servers.filter((s: any) => s.status === 'error').length;
          
          // 우선순위 재조정
          if (criticalCount > 0 || errorServers > 0) {
            const urgentQuestion = questionTemplates.find(t => t.priority === 'critical');
            if (urgentQuestion) {
              const urgentIndex = questionTemplates.indexOf(urgentQuestion);
              setCurrentTemplateIndex(urgentIndex);
            }
          }
        }
      } catch (error) {
        console.error('서버 상황 기반 질문 업데이트 실패:', error);
      }
    };

    // 2분마다 서버 상황 체크
    timerManager.register({
      id: 'question-priority-updater',
      callback: updateBasedOnServerStatus,
      interval: 120000, // 2분
      priority: 'low',
      enabled: true
    });

    return () => {
      timerManager.unregister('question-priority-updater');
    };
  }, [isProcessing]);

  const currentTemplate = questionTemplates[currentTemplateIndex];

  const handleQuestionClick = (template: QuestionTemplate) => {
    console.log('🎯 질문 선택:', template.question);
    onQuestionSelect(template.question);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (isProcessing) {
    return (
      <div className={`p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <motion.div
            className="w-2 h-2 bg-yellow-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.6, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          />
          <span className="text-sm text-yellow-700 dark:text-yellow-300">
            AI가 질문을 처리하고 있습니다...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
        {/* 메인 추천 질문 */}
        <motion.div 
          className="relative"
          key={currentTemplate.id}
        >
          <motion.button
            onClick={() => handleQuestionClick(currentTemplate)}
            onHoverStart={() => setHoveredTemplate(currentTemplate.id)}
            onHoverEnd={() => setHoveredTemplate(null)}
            className={`
              w-12 h-12 rounded-xl flex items-center justify-center text-lg
              bg-gradient-to-br from-blue-500 to-purple-600 text-white
              hover:scale-110 transition-transform duration-200
              shadow-md hover:shadow-lg
            `}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              rotate: isRotating ? [0, 5, -5, 0] : 0,
            }}
            transition={{
              duration: 2,
              repeat: isRotating ? Infinity : 0,
              repeatDelay: 13
            }}
          >
            {currentTemplate.icon}
          </motion.button>

          {/* 툴팁 */}
          <AnimatePresence>
            {hoveredTemplate === currentTemplate.id && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-10"
              >
                <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl max-w-xs">
                  <div className="font-medium mb-1">{currentTemplate.question}</div>
                  <div className="text-gray-300 text-xs">{currentTemplate.description}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(currentTemplate.priority)}`}>
                      {currentTemplate.priority.toUpperCase()}
                    </span>
                    <span className="text-gray-400 text-xs">클릭하여 질문</span>
                  </div>
                  {/* 화살표 */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 다른 추천 질문들 (작은 아이콘) */}
        <div className="flex items-center space-x-1">
          {questionTemplates
            .filter((_, index) => index !== currentTemplateIndex)
            .slice(0, 3)
            .map((template, index) => (
              <motion.button
                key={template.id}
                onClick={() => handleQuestionClick(template)}
                onHoverStart={() => setHoveredTemplate(template.id)}
                onHoverEnd={() => setHoveredTemplate(null)}
                className="
                  w-6 h-6 rounded-md flex items-center justify-center text-xs
                  bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400
                  hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors
                  relative
                "
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {template.icon}

                {/* 작은 툴팁 */}
                <AnimatePresence>
                  {hoveredTemplate === template.id && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 z-10"
                    >
                      <div className="bg-gray-800 text-white text-xs rounded p-2 whitespace-nowrap shadow-lg">
                        {template.question}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-b-gray-800" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
        </div>

        {/* 상태 표시 */}
        <div className="flex items-center space-x-1 ml-auto">
          <motion.div
            className={`w-1.5 h-1.5 rounded-full ${isRotating ? 'bg-green-400' : 'bg-gray-400'}`}
            animate={{
              scale: isRotating ? [1, 1.5, 1] : 1,
              opacity: isRotating ? [1, 0.5, 1] : 0.5,
            }}
            transition={{
              duration: 2,
              repeat: isRotating ? Infinity : 0,
            }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isRotating ? '자동' : '수동'}
          </span>
        </div>
      </div>

      {/* 진행 표시 바 */}
      {isRotating && (
        <motion.div
          className="mt-2 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-blue-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </motion.div>
      )}
    </div>
  );
};