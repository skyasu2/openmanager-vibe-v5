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
  Zap
} from 'lucide-react';
import { useAISidebarStore, PRESET_QUESTIONS } from '@/stores/useAISidebarStore';
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
    hoverBg: 'hover:bg-red-100'
  },
  security: {
    icon: Shield,
    label: '보안 점검',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    hoverBg: 'hover:bg-green-100'
  },
  prediction: {
    icon: TrendingUp,
    label: '예측 분석',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverBg: 'hover:bg-blue-100'
  },
  analysis: {
    icon: Search,
    label: '종합 분석',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    hoverBg: 'hover:bg-purple-100'
  }
};

export default function EnhancedPresetQuestions({ 
  className = '',
  onQuestionSelect 
}: EnhancedPresetQuestionsProps) {
  const { activePreset, setActivePreset } = useAISidebarStore();
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
    const newScroll = direction === 'left' 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount;
    
    scrollRef.current.scrollTo({ left: newScroll, behavior: 'smooth' });
  };

  return (
    <div className={`${className}`}>
      {/* 카테고리 탭 - 데스크톱 */}
      {!isMobile && (
        <div className="grid grid-cols-2 gap-2 mb-4">
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
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{info.label}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* 카테고리 탭 - 모바일 (수평 스크롤) */}
      {isMobile && (
        <div className="relative mb-4">
          <button
            onClick={() => scrollToCategory('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white shadow-md rounded-full"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          
          <div
            ref={scrollRef}
            className="flex gap-2 overflow-x-auto scroll-smooth px-6 pb-2"
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
                  <div className="flex items-center gap-2 min-w-max">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{info.label}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
          
          <button
            onClick={() => scrollToCategory('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-white shadow-md rounded-full"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {/* 질문 카드들 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-3"
        >
          {filteredQuestions.map((question, index) => {
            const categoryInfo = CATEGORY_INFO[question.category];
            const Icon = categoryInfo.icon;
            const isSelected = activePreset?.id === question.id;
            
            return (
              <motion.button
                key={question.id}
                onClick={() => handleQuestionSelect(question)}
                className={`w-full p-4 text-left rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? `${categoryInfo.bgColor} ${categoryInfo.borderColor} scale-[1.02]`
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3">
                  {/* 아이콘 */}
                  <motion.div
                    className={`p-2 rounded-lg ${
                      isSelected ? categoryInfo.bgColor : 'bg-gray-100'
                    }`}
                    animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {question.icon ? (
                      <span className="text-lg">{question.icon}</span>
                    ) : (
                      <Icon className={`w-4 h-4 ${
                        isSelected ? categoryInfo.color : 'text-gray-600'
                      }`} />
                    )}
                  </motion.div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium mb-1 ${
                      isSelected ? categoryInfo.color : 'text-gray-900'
                    }`}>
                      {question.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {question.description}
                    </p>
                    
                    {/* AI 추천 뱃지 */}
                    {index === 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center gap-1 mt-2"
                      >
                        <Sparkles className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-yellow-600 font-medium">
                          AI 추천
                        </span>
                      </motion.div>
                    )}
                  </div>

                  {/* 선택 표시 */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className={`p-1 rounded-full ${categoryInfo.bgColor}`}
                    >
                      <Zap className={`w-3 h-3 ${categoryInfo.color}`} />
                    </motion.div>
                  )}
                </div>
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
        className="mt-4 text-center"
      >
        <p className="text-xs text-gray-500">
          {CATEGORY_INFO[activeCategory as keyof typeof CATEGORY_INFO].label} •{' '}
          {filteredQuestions.length}개의 질문
        </p>
      </motion.div>
    </div>
  );
} 