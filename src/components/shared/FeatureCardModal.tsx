'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  gradient: string;
  detailedContent: {
    overview: string;
    features: string[];
    technologies: string[];
  };
  requiresAI: boolean;
  isAICard?: boolean;
  isSpecial?: boolean;
  isVibeCard?: boolean;
}

interface FeatureCardModalProps {
  selectedCard: FeatureCard | null | undefined;
  onClose: () => void;
  renderTextWithAIGradient: (text: string) => React.ReactNode;
  modalRef: React.RefObject<HTMLDivElement | null>;
  variant?: 'home' | 'landing';
}

// 모달별 카드 데이터 정의
const getModalCardData = (cardId: string) => {
  const cardDataMap = {
    'mcp-ai-engine': [
      {
        icon: '🧠',
        title: 'UnifiedAIEngine',
        tag: { label: '자체개발', color: 'bg-blue-600' },
        description: '모든 AI 기능의 통합 관리',
        bgColor: 'from-purple-50 to-purple-100',
        borderColor: 'border-purple-200',
      },
      {
        icon: '🤖',
        title: 'TensorFlow.js',
        tag: { label: '오픈소스', color: 'bg-green-600' },
        description: 'ML 추론 및 패턴 분석',
        bgColor: 'from-orange-50 to-orange-100',
        borderColor: 'border-orange-200',
      },
      {
        icon: '🇰🇷',
        title: 'Natural',
        tag: { label: '오픈소스', color: 'bg-green-600' },
        description: '한국어 자연어 처리',
        bgColor: 'from-emerald-50 to-emerald-100',
        borderColor: 'border-emerald-200',
      },
      {
        icon: '⚡',
        title: 'MCPAIRouter',
        tag: { label: '자체개발', color: 'bg-blue-600' },
        description: '지능형 작업 라우팅',
        bgColor: 'from-indigo-50 to-indigo-100',
        borderColor: 'border-indigo-200',
      },
    ],
    'data-generator': [
      {
        icon: '📊',
        title: 'OptimizedDataGenerator',
        tag: { label: '자체개발', color: 'bg-blue-600' },
        description: '24시간 베이스라인 + 실시간 변동',
        bgColor: 'from-emerald-50 to-emerald-100',
        borderColor: 'border-emerald-200',
      },
      {
        icon: '⏱️',
        title: 'TimerManager',
        tag: { label: '자체개발', color: 'bg-blue-600' },
        description: '통합 타이머 관리',
        bgColor: 'from-blue-50 to-blue-100',
        borderColor: 'border-blue-200',
      },
      {
        icon: '📈',
        title: 'BaselineOptimizer',
        tag: { label: '자체개발', color: 'bg-blue-600' },
        description: '시간대별 패턴 분석',
        bgColor: 'from-cyan-50 to-cyan-100',
        borderColor: 'border-cyan-200',
      },
      {
        icon: '🧹',
        title: 'MemoryOptimizer',
        tag: { label: '자체개발', color: 'bg-blue-600' },
        description: '메모리 최적화 + 가비지 컬렉션',
        bgColor: 'from-teal-50 to-teal-100',
        borderColor: 'border-teal-200',
      },
    ],
    'tech-stack': [
      {
        icon: '⚡',
        title: 'Next.js 15',
        tag: { label: '오픈소스', color: 'bg-green-600' },
        description: 'App Router + 서버리스 최적화',
        bgColor: 'from-slate-50 to-slate-100',
        borderColor: 'border-slate-200',
      },
      {
        icon: '🔧',
        title: 'TypeScript',
        tag: { label: '오픈소스', color: 'bg-green-600' },
        description: '완전한 타입 안전성',
        bgColor: 'from-blue-50 to-blue-100',
        borderColor: 'border-blue-200',
      },
      {
        icon: '🎨',
        title: 'Tailwind CSS',
        tag: { label: '오픈소스', color: 'bg-green-600' },
        description: '유틸리티 우선 스타일링',
        bgColor: 'from-cyan-50 to-cyan-100',
        borderColor: 'border-cyan-200',
      },
      {
        icon: '🏗️',
        title: '모듈화 아키텍처',
        tag: { label: '자체개발', color: 'bg-blue-600' },
        description: '4개 독립 모듈 설계',
        bgColor: 'from-purple-50 to-purple-100',
        borderColor: 'border-purple-200',
      },
    ],
    'vibe-coding': [
      {
        icon: '🎯',
        title: 'Cursor AI',
        tag: { label: '외부도구', color: 'bg-yellow-600' },
        description: 'AI 기반 코드 생성 IDE',
        bgColor: 'from-purple-50 to-purple-100',
        borderColor: 'border-purple-200',
      },
      {
        icon: '🧠',
        title: 'Claude 4 Sonnet',
        tag: { label: '외부도구', color: 'bg-yellow-600' },
        description: '200K 컨텍스트 AI 모델',
        bgColor: 'from-indigo-50 to-indigo-100',
        borderColor: 'border-indigo-200',
      },
      {
        icon: '🔗',
        title: 'MCP Tools',
        tag: { label: '오픈소스', color: 'bg-green-600' },
        description: '파일시스템 + Git 자동화',
        bgColor: 'from-emerald-50 to-emerald-100',
        borderColor: 'border-emerald-200',
      },
      {
        icon: '🚀',
        title: 'GitHub Actions',
        tag: { label: '오픈소스', color: 'bg-green-600' },
        description: '자동 배포 + CI/CD',
        bgColor: 'from-green-50 to-green-100',
        borderColor: 'border-green-200',
      },
    ],
  };

  return cardDataMap[cardId as keyof typeof cardDataMap] || [];
};

export default function FeatureCardModal({
  selectedCard,
  onClose,
  renderTextWithAIGradient,
  modalRef,
  variant = 'home',
}: FeatureCardModalProps) {
  if (!selectedCard) return null;

  const isHomeVariant = variant === 'home';
  const modalCards = getModalCardData(selectedCard.id);

  return (
    <AnimatePresence>
      <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60'>
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900/95 border border-gray-700/50 rounded-xl shadow-2xl ${
            isHomeVariant && selectedCard.isSpecial
              ? 'border-amber-500/50 bg-gradient-to-br from-gray-900/95 to-amber-900/20'
              : ''
          } ${
            isHomeVariant && selectedCard.isAICard
              ? 'border-pink-500/50 bg-gradient-to-br from-gray-900/95 to-pink-900/20'
              : ''
          }`}
        >
          {/* 헤더 */}
          <div
            className={`${isHomeVariant ? 'p-6' : 'sticky top-0 z-10 bg-gray-900/90 backdrop-blur-sm p-6'} border-b border-gray-700/50`}
          >
            <div className='flex items-start justify-between'>
              <div className='flex items-start gap-4'>
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${selectedCard.gradient} rounded-xl flex items-center justify-center ${
                    isHomeVariant && selectedCard.isSpecial
                      ? 'shadow-lg shadow-amber-500/25'
                      : ''
                  } ${
                    isHomeVariant && selectedCard.isAICard
                      ? 'shadow-lg shadow-pink-500/25'
                      : ''
                  }`}
                >
                  {selectedCard.isAICard ? (
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        rotate: {
                          duration: 8,
                          repeat: Infinity,
                          ease: 'linear',
                        },
                        scale: {
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        },
                      }}
                    >
                      <selectedCard.icon className='w-6 h-6 text-white' />
                    </motion.div>
                  ) : selectedCard.isVibeCard ? (
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <selectedCard.icon className='w-6 h-6 text-white' />
                    </motion.div>
                  ) : (
                    <selectedCard.icon className='w-6 h-6 text-white' />
                  )}
                </div>
                <div>
                  <h2 className='text-xl font-bold text-white mb-2'>
                    {renderTextWithAIGradient(selectedCard.title)}
                  </h2>
                  <p className='text-base text-gray-400'>
                    {renderTextWithAIGradient(selectedCard.description)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className='w-8 h-8 rounded-full bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-center transition-colors'
              >
                <X className='w-4 h-4 text-gray-400' />
              </button>
            </div>
          </div>

          {/* 카드 그리드 콘텐츠 */}
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {modalCards.map((card, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`bg-gradient-to-br ${card.bgColor} rounded-xl p-6 border ${card.borderColor} hover:shadow-lg transition-all duration-300`}
                >
                  <div className='flex items-center gap-3 mb-4'>
                    <div
                      className={`w-12 h-12 ${card.tag.color} rounded-lg flex items-center justify-center text-2xl`}
                    >
                      {card.icon}
                    </div>
                    <div className='flex-1'>
                      <h3 className='text-lg font-bold text-gray-800 mb-1'>
                        {card.title}
                      </h3>
                      <span
                        className={`px-2 py-1 ${card.tag.color} text-white text-xs rounded font-medium`}
                      >
                        {card.tag.label}
                      </span>
                    </div>
                  </div>
                  <p className='text-base text-gray-700 leading-relaxed'>
                    {card.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* 개요 섹션 */}
            <div className='mt-8 p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10'>
              <h3 className='text-white font-semibold mb-3 text-lg flex items-center gap-2'>
                📖 개요
              </h3>
              <p className='text-gray-300 leading-relaxed text-base'>
                {renderTextWithAIGradient(
                  selectedCard.detailedContent.overview
                )}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
