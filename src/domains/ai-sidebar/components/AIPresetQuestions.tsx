/**
 * 🎯 AI 프리셋 질문 컴포넌트 (최적화됨)
 */

'use client';

import { motion } from 'framer-motion';
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  FileText,
  Globe,
  HardDrive,
  Sparkles,
  Zap,
} from 'lucide-react';
import React from 'react';

export interface PresetQuestion {
  id: string;
  text: string;
  category: string;
  icon: React.ComponentType<unknown>;
  color: string;
}

interface AIPresetQuestionsProps {
  onQuestionSelect: (question: string) => void;
  currentPage: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

// 프리셋 질문 목록
const PRESET_QUESTIONS: PresetQuestion[] = [
  {
    id: '1',
    text: '현재 서버 상태는 어떤가요?',
    category: '상태 확인',
    icon: Cpu,
    color: 'bg-blue-500',
  },
  {
    id: '2',
    text: 'CPU 사용률이 높은 서버를 찾아주세요',
    category: '성능 분석',
    icon: Zap,
    color: 'bg-red-500',
  },
  {
    id: '3',
    text: '메모리 부족 경고가 있나요?',
    category: '리소스 모니터링',
    icon: Brain,
    color: 'bg-yellow-500',
  },
  {
    id: '4',
    text: '네트워크 지연이 발생하고 있나요?',
    category: '네트워크 진단',
    icon: Globe,
    color: 'bg-green-500',
  },
  {
    id: '5',
    text: '최근 에러 로그를 분석해주세요',
    category: '로그 분석',
    icon: FileText,
    color: 'bg-purple-500',
  },
  {
    id: '6',
    text: '시스템 최적화 방안을 제안해주세요',
    category: '최적화',
    icon: Sparkles,
    color: 'bg-pink-500',
  },
  {
    id: '7',
    text: '디스크 사용량이 임계치에 도달했나요?',
    category: '스토리지',
    icon: HardDrive,
    color: 'bg-indigo-500',
  },
  {
    id: '8',
    text: '데이터베이스 연결 상태를 확인해주세요',
    category: '데이터베이스',
    icon: Database,
    color: 'bg-teal-500',
  },
];

const PRESETS_PER_PAGE = 4;

export const AIPresetQuestions: React.FC<AIPresetQuestionsProps> = ({
  onQuestionSelect,
  currentPage,
  onPageChange,
  className = '',
}) => {
  const totalPages = Math.ceil(PRESET_QUESTIONS.length / PRESETS_PER_PAGE);

  const getCurrentPresets = () => {
    const startIndex = currentPage * PRESETS_PER_PAGE;
    return PRESET_QUESTIONS.slice(startIndex, startIndex + PRESETS_PER_PAGE);
  };

  const goToPreviousPresets = () => {
    if (currentPage > 0) {
      onPageChange?.(currentPage - 1);
    }
  };

  const goToNextPresets = () => {
    if ((currentPage + 1) * PRESETS_PER_PAGE < PRESET_QUESTIONS.length) {
      onPageChange?.(currentPage + 1);
    }
  };

  const currentPresets = getCurrentPresets();

  return (
    <div className={`p-4 bg-white border-t border-gray-200 ${className}`}>
      {/* 헤더 */}
      <div className='flex items-center justify-between mb-3'>
        <h4 className='text-sm font-semibold text-gray-700'>빠른 질문</h4>
        <div className='flex items-center space-x-2'>
          <button
            onClick={goToPreviousPresets}
            disabled={currentPage === 0}
            className='p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            data-testid='preset-prev-button'
            aria-label='이전 페이지'
          >
            <ChevronLeft className='w-4 h-4 text-gray-600' />
          </button>
          <span
            className='text-xs text-gray-500'
            data-testid='preset-page-indicator'
          >
            {currentPage + 1}/{totalPages}
          </span>
          <button
            onClick={goToNextPresets}
            disabled={
              (currentPage + 1) * PRESETS_PER_PAGE >= PRESET_QUESTIONS.length
            }
            className='p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            data-testid='preset-next-button'
            aria-label='다음 페이지'
          >
            <ChevronRight className='w-4 h-4 text-gray-600' />
          </button>
        </div>
      </div>

      {/* 질문 그리드 */}
      <div
        className='relative h-32 overflow-hidden'
        data-testid='preset-questions-grid'
      >
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className='grid grid-cols-2 gap-2 h-full'
        >
          {currentPresets.map((question, index) => (
            <motion.button
              key={question.id}
              onClick={() => onQuestionSelect(question.text)}
              className='p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group'
              data-testid={`preset-question-${index}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className='flex items-center space-x-1 mb-1'>
                <div
                  className={`w-4 h-4 ${question.color} rounded flex items-center justify-center`}
                >
                  {React.createElement(question.icon, {
                    className: 'w-2 h-2 text-white',
                  })}
                </div>
                <span className='text-xs text-gray-500'>
                  {question.category}
                </span>
              </div>
              <p className='text-xs text-gray-800 line-clamp-2'>
                {question.text}
              </p>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
