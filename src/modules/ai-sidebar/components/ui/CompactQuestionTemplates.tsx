/**
 * 🎯 컴팩트 질문 템플릿 컴포넌트
 *
 * - 한 줄에 4개씩 표시
 * - 절반 크기로 축소
 * - 아이콘 + 툴팁으로 간결하게 표시
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { timerManager } from '../../../../utils/TimerManager';

interface QuestionTemplate {
  id: string;
  question: string;
  icon: string;
  category: 'monitoring' | 'analysis' | 'prediction' | 'incident';
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  description: string;
}

interface CompactQuestionTemplatesProps {
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
    description: '전체 서버의 현재 상태와 헬스체크 결과를 확인합니다',
  },
  {
    id: 'critical_alerts',
    question: '심각한 알림이 있나요?',
    icon: '🚨',
    category: 'incident',
    priority: 'critical',
    enabled: true,
    description: '심각도가 높은 알림과 즉시 대응이 필요한 이슈를 확인합니다',
  },
  {
    id: 'performance_analysis',
    question: '서버 성능 분석 결과는?',
    icon: '📊',
    category: 'analysis',
    priority: 'medium',
    enabled: true,
    description: 'CPU, 메모리, 디스크 사용률 및 응답시간을 종합 분석합니다',
  },
  {
    id: 'failure_prediction',
    question: '장애 예측 결과를 알려주세요',
    icon: '🔮',
    category: 'prediction',
    priority: 'high',
    enabled: true,
    description: 'AI 기반 장애 예측 모델의 최신 분석 결과를 제공합니다',
  },
  {
    id: 'memory_issues',
    question: '메모리 사용률이 높은 서버는?',
    icon: '💾',
    category: 'monitoring',
    priority: 'high',
    enabled: true,
    description: '메모리 사용률 80% 이상인 서버들의 상세 정보를 확인합니다',
  },
  {
    id: 'disk_space',
    question: '디스크 공간이 부족한 서버는?',
    icon: '💿',
    category: 'monitoring',
    priority: 'medium',
    enabled: true,
    description: '디스크 사용률이 높거나 여유 공간이 부족한 서버를 찾습니다',
  },
  {
    id: 'network_latency',
    question: '네트워크 지연이 발생하고 있나요?',
    icon: '🌐',
    category: 'analysis',
    priority: 'medium',
    enabled: true,
    description: '네트워크 응답시간과 연결 상태를 실시간으로 모니터링합니다',
  },
];

export const CompactQuestionTemplates: React.FC<
  CompactQuestionTemplatesProps
> = ({ onQuestionSelect, isProcessing = false, className = '' }) => {
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);

  const [isRotating, setIsRotating] = useState(true);

  // 현재 표시할 4개 템플릿 선택
  const displayedTemplates = questionTemplates.slice(
    currentTemplateIndex,
    currentTemplateIndex + 4
  );

  // 부족한 개수만큼 앞에서 가져오기
  if (displayedTemplates.length < 4) {
    const remaining = 4 - displayedTemplates.length;
    displayedTemplates.push(...questionTemplates.slice(0, remaining));
  }

  // 🔄 자동 질문 회전 (30초마다)
  useEffect(() => {
    if (isProcessing) {
      console.log('🚫 AI 처리 중 - 질문 회전 정지');
      setIsRotating(false);
      timerManager.unregister('compact-question-rotation');
      return;
    }

    console.log('🔄 컴팩트 질문 회전 타이머 시작');
    setIsRotating(true);

    const rotateQuestions = () => {
      if (isProcessing) return;
      setCurrentTemplateIndex(prev => (prev + 4) % questionTemplates.length);
    };

    timerManager.register({
      id: 'compact-question-rotation',
      callback: rotateQuestions,
      interval: 30000, // 30초
      priority: 'medium',
      enabled: true,
    });

    return () => {
      timerManager.unregister('compact-question-rotation');
    };
  }, [isProcessing]);

  const handleQuestionClick = (template: QuestionTemplate) => {
    if (isProcessing) {
      console.log('🚫 AI 처리 중이므로 클릭 무시:', template.question);
      return;
    }

    console.log('🎯 컴팩트 질문 선택:', template.question);
    onQuestionSelect(template.question);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'monitoring':
        return '👁️';
      case 'analysis':
        return '📈';
      case 'prediction':
        return '🔮';
      case 'incident':
        return '🚨';
      default:
        return '❓';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* 제목 */}
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center space-x-2'>
          <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            빠른 질문
          </span>
          {isRotating && !isProcessing && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className='w-3 h-3 text-gray-400'
            >
              ⟳
            </motion.div>
          )}
        </div>
        <span className='text-xs text-gray-500 dark:text-gray-400'>
          {Math.floor(currentTemplateIndex / 4) + 1} /{' '}
          {Math.ceil(questionTemplates.length / 4)}
        </span>
      </div>

      {/* 컴팩트 질문 그리드 (1줄에 4개) */}
      <div className='grid grid-cols-4 gap-2'>
        <AnimatePresence mode='wait'>
          {displayedTemplates.map((template, index) => (
            <motion.button
              key={`${template.id}-${currentTemplateIndex}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              onClick={() => handleQuestionClick(template)}
              disabled={isProcessing}
              className={`
                relative p-2 rounded-lg border-2 transition-all duration-200
                ${getPriorityColor(template.priority)}
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
                aspect-square flex flex-col items-center justify-center text-center
              `}
              title={template.description}
            >
              {/* 카테고리 배지 */}
              <div className='absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-xs'>
                {getCategoryIcon(template.category)}
              </div>

              {/* 메인 아이콘 */}
              <div className='text-xl mb-1'>{template.icon}</div>

              {/* 축약된 텍스트 */}
              <div className='text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight'>
                {template.question.split(' ').slice(0, 2).join(' ')}
                {template.question.split(' ').length > 2 && '...'}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* 네비게이션 인디케이터 */}
      <div className='flex justify-center mt-3 space-x-1'>
        {Array.from(
          { length: Math.ceil(questionTemplates.length / 4) },
          (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentTemplateIndex(i * 4)}
              disabled={isProcessing}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                Math.floor(currentTemplateIndex / 4) === i
                  ? 'bg-blue-500 w-4'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
              }`}
              title={`페이지 ${i + 1}로 이동`}
            />
          )
        )}
      </div>
    </div>
  );
};
