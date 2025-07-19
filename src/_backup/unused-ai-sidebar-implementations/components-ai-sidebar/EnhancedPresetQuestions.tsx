'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Shield,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  MessageSquare,
} from 'lucide-react';
import {
  useAISidebarStore,
  PRESET_QUESTIONS,
} from '@/stores/useAISidebarStore';
import type { PresetQuestion } from '@/stores/useAISidebarStore';

interface EnhancedPresetQuestionsProps {
  className?: string;
  onQuestionSelect: (question: PresetQuestion) => void;
}

// 📂 카테고리 정보
const CATEGORY_INFO = {
  performance: {
    icon: Cpu,
    label: '성능 분석',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    hoverBg: 'hover:bg-red-100',
  },
  security: {
    icon: Shield,
    label: '보안 점검',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    hoverBg: 'hover:bg-green-100',
  },
  prediction: {
    icon: TrendingUp,
    label: '예측 분석',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverBg: 'hover:bg-blue-100',
  },
  analysis: {
    icon: Search,
    label: '종합 분석',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    hoverBg: 'hover:bg-purple-100',
  },
};

export default function EnhancedPresetQuestions({
  className = '',
  onQuestionSelect,
}: EnhancedPresetQuestionsProps) {
  // Zustand 스토어 연동을 위한 타입 안전성 확보
  const [activePreset, setActivePreset] = useState<PresetQuestion | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('performance');
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 카테고리별 질문 필터링
  const filteredQuestions = PRESET_QUESTIONS.filter(
    q => q.category === activeCategory
  );

  // 질문 선택 핸들러
  const handleQuestionSelect = (question: PresetQuestion) => {
    setActivePreset(question);
    onQuestionSelect(question);
  };

  // 모바일 카테고리 스크롤
  const scrollToCategory = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;

    const scrollAmount = 120;
    const currentScroll = scrollRef.current.scrollLeft;
    const newScroll =
      direction === 'left'
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;

    scrollRef.current.scrollTo({ left: newScroll, behavior: 'smooth' });
  };

  return (
    <div className={`${className}`}>
      {/* 카테고리 탭 - 데스크톱 */}
      {!isMobile && (
        <div className='grid grid-cols-2 gap-2 mb-4'>
          {Object.entries(CATEGORY_INFO).map(([category, info]) => {
            const Icon = info.icon;
            const isActive = activeCategory === category;

            return (
              <motion.button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  isActive
                    ? `${info.bgColor} ${info.borderColor} ${info.color}`
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className='flex items-center gap-2'>
                  <Icon className='w-4 h-4' />
                  <span className='text-sm font-medium'>{info.label}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* 카테고리 탭 - 모바일 (수평 스크롤) */}
      {isMobile && (
        <div className='relative mb-4'>
          <button
            onClick={() => scrollToCategory('left')}
            className='absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white shadow-md rounded-full'
          >
            <ChevronLeft className='w-4 h-4 text-gray-600' />
          </button>

          <div
            ref={scrollRef}
            className='flex gap-2 overflow-x-auto scroll-smooth px-6 pb-2'
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {Object.entries(CATEGORY_INFO).map(([category, info]) => {
              const Icon = info.icon;
              const isActive = activeCategory === category;

              return (
                <motion.button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`flex-shrink-0 p-3 rounded-lg border transition-all duration-200 ${
                    isActive
                      ? `${info.bgColor} ${info.borderColor} ${info.color}`
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className='flex items-center gap-2 min-w-max'>
                    <Icon className='w-4 h-4' />
                    <span className='text-sm font-medium'>{info.label}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <button
            onClick={() => scrollToCategory('right')}
            className='absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white shadow-md rounded-full'
          >
            <ChevronRight className='w-4 h-4 text-gray-600' />
          </button>
        </div>
      )}

      {/* 질문 카드들 */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className='space-y-3'
        >
          {filteredQuestions.map(question => {
            const isSelected = activePreset?.id === question.id;
            const isRecommended = question.isAIRecommended;

            return (
              <motion.button
                key={question.id}
                onClick={() => handleQuestionSelect(question)}
                className={`
                  group relative p-4 bg-white rounded-xl border-2 transition-all duration-200 text-left h-full
                  ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-purple-300 hover:shadow-md hover:scale-102'
                  }
                `}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* 추천 배지 */}
                {isRecommended && (
                  <div className='absolute -top-2 -right-2 z-10'>
                    <motion.div
                      animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className='bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg'
                    >
                      <Sparkles className='w-3 h-3' />
                      AI 추천
                    </motion.div>
                  </div>
                )}

                <div className='flex items-center gap-3 mb-3'>
                  <div
                    className={`
                    p-2 rounded-lg transition-colors
                    ${
                      isSelected
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-600'
                    }
                  `}
                  >
                    <MessageSquare className='w-5 h-5' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h3
                      className={`
                      font-semibold text-sm transition-colors truncate
                      ${isSelected ? 'text-purple-900' : 'text-gray-900 group-hover:text-purple-900'}
                    `}
                    >
                      {question.question.length > 30
                        ? `${question.question.substring(0, 30)}...`
                        : question.question}
                    </h3>
                  </div>
                </div>

                <p
                  className={`
                  text-xs leading-relaxed transition-colors
                  ${isSelected ? 'text-purple-700' : 'text-gray-600 group-hover:text-purple-700'}
                `}
                >
                  {question.question}
                </p>

                {/* 선택 효과 */}
                {isSelected && (
                  <motion.div
                    layoutId='selectedCard'
                    className='absolute inset-0 border-2 border-purple-500 rounded-xl'
                    initial={false}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}

                {/* 클릭 효과 */}
                <motion.div
                  className='absolute top-3 right-3'
                  animate={
                    isSelected
                      ? {
                          rotate: [0, 360],
                          scale: [1, 1.2, 1],
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.5,
                    ease: 'easeInOut',
                  }}
                >
                  <Zap
                    className={`
                    w-4 h-4 transition-colors
                    ${isSelected ? 'text-purple-500' : 'text-gray-400 group-hover:text-purple-500'}
                  `}
                  />
                </motion.div>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* 질문 수 표시 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className='mt-4 text-center'
      >
        <p className='text-xs text-gray-500'>
          {CATEGORY_INFO[activeCategory as keyof typeof CATEGORY_INFO].label} •{' '}
          {filteredQuestions.length}개의 질문
        </p>
      </motion.div>
    </div>
  );
}
