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
    description: '전체 서버의 현재 상태와 헬스체크 결과를 확인합니다'
  },
  {
    id: 'critical_alerts',
    question: '심각한 알림이 있나요?',
    icon: '🚨',
    category: 'incident',
    priority: 'critical',
    description: '심각도가 높은 알림과 즉시 대응이 필요한 이슈를 확인합니다'
  },
  {
    id: 'performance_analysis',
    question: '서버 성능 분석 결과는?',
    icon: '📊',
    category: 'analysis',
    priority: 'medium',
    description: 'CPU, 메모리, 디스크 사용률 등 성능 지표를 분석합니다'
  },
  {
    id: 'error_prediction',
    question: '장애 예측 결과를 알려주세요',
    icon: '🔮',
    category: 'prediction',
    priority: 'high',
    description: 'AI 기반 패턴 분석으로 잠재적 장애를 예측합니다'
  },
  {
    id: 'memory_issues',
    question: '메모리 누수가 의심되는 서버가 있나요?',
    icon: '💾',
    category: 'incident',
    priority: 'high',
    description: '메모리 사용률 급증 패턴을 감지하고 원인을 분석합니다'
  },
  {
    id: 'disk_usage',
    question: '디스크 공간이 부족한 서버는?',
    icon: '💿',
    category: 'monitoring',
    priority: 'medium',
    description: '디스크 사용률이 임계치를 초과한 서버를 찾아줍니다'
  },
  {
    id: 'network_latency',
    question: '네트워크 지연 문제가 있나요?',
    icon: '🌐',
    category: 'analysis',
    priority: 'medium',
    description: '네트워크 응답 시간과 패킷 손실률을 분석합니다'
  },
  {
    id: 'load_balancing',
    question: '로드 밸런싱 상태는 어떤가요?',
    icon: '⚖️',
    category: 'monitoring',
    priority: 'low',
    description: '서버 간 부하 분산 상태와 트래픽 분포를 확인합니다'
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
    };

    // TimerManager에 등록 (isProcessing 변경 시 자동 해제됨)
    timerManager.register({
      id: 'dynamic-question-rotation',
      callback: rotateQuestions,
      interval: baseInterval, // 기본 주기로 시작
      priority: 'medium'
    });

    return () => {
      console.log('🧹 질문 회전 타이머 정리');
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      timerManager.unregister('dynamic-question-rotation');
    };
  }, [questionTemplates.length, isProcessing]); // isProcessing을 의존성에 추가

  // 🎯 서버 상황 기반 질문 우선순위 업데이트 (2분마다)
  useEffect(() => {
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
      interval: 2 * 60 * 1000, // 2분
      priority: 'low'
    });

    return () => {
      timerManager.unregister('question-priority-updater');
    };
  }, [questionTemplates]);

  const currentTemplate = questionTemplates[currentTemplateIndex];

  const handleQuestionClick = (template: QuestionTemplate) => {
    setIsRotating(false); // 회전 정지
    onQuestionSelect(template.question);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className={`px-4 py-2 border-b dark:border-gray-700 ${className}`}>
      <div className="flex items-center space-x-3">
        {/* 현재 활성 질문 템플릿 */}
        <motion.div
          className="relative"
          onHoverStart={() => setHoveredTemplate(currentTemplate.id)}
          onHoverEnd={() => setHoveredTemplate(null)}
        >
          <motion.button
            onClick={() => handleQuestionClick(currentTemplate)}
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center text-sm
              ${getPriorityColor(currentTemplate.priority)}
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