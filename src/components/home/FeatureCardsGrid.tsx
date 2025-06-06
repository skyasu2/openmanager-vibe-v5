'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Activity,
  Layers,
  X,
  Sparkles,
  Cpu,
  Database,
  Code,
  Zap,
} from 'lucide-react';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useToast } from '@/components/ui/ToastNotification';
import TechStackDisplay from '@/components/ui/TechStackDisplay';
import { analyzeTechStack } from '@/utils/TechStackAnalyzer';

// 카드 데이터
const cardData = [
  {
    id: 'mcp-ai-engine',
    title: 'MCP 기반 AI 엔진',
    description:
      'MCP(Model Context Protocol)로 구동되는 브라우저 기반 AI 엔진.',
    icon: Bot,
    gradient: 'from-blue-500 via-pink-500 to-cyan-400',
    detailedContent: {
      overview:
        'MCP는 AI 모델과 외부 데이터 소스 간의 표준화된 통신 프로토콜입니다. 본 엔진은 TensorFlow.js와 Transformers.js를 활용하여 서버 의존성 없이 브라우저에서 직접 AI 추론을 수행합니다.',
      technologies: [
        'MCP SDK - AI 모델과 데이터 소스 간 표준 프로토콜',
        'TensorFlow.js - 브라우저 내 기계학습 실행',
        'Transformers.js - 사전 훈련된 모델 실행',
        'natural - 영어 자연어 처리',
        'korean-js - 한국어 형태소 분석',
        'ml-matrix - 행렬 연산 및 선형대수',
        'ml-regression - 회귀 분석 및 예측',
        'fuse.js - 퍼지 검색 엔진',
        'compromise - 자연어 이해 및 파싱',
      ],
    },
    requiresAI: true,
    isAICard: true,
  },
  {
    id: 'data-generator',
    title: '서버 데이터 생성기',
    description: '오픈소스 라이브러리로 구현된 실시간 서버 메트릭 시뮬레이터.',
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    detailedContent: {
      overview:
        '실제 서버 환경을 시뮬레이션하는 데이터 생성 시스템입니다. Faker.js로 현실적인 데이터를 생성하고, Prometheus로 메트릭을 수집하며, Redis와 Supabase로 데이터를 저장합니다.',
      technologies: [
        '@faker-js/faker - 현실적인 서버 데이터 생성',
        'prom-client - Prometheus 메트릭 수집',
        'systeminformation - 시스템 정보 수집',
        '@upstash/redis - 서버리스 Redis 캐싱',
        '@supabase/supabase-js - PostgreSQL 데이터 저장',
        'node-cron - 작업 스케줄링',
        'date-fns - 시계열 데이터 관리',
        'axios - HTTP 클라이언트',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'tech-stack',
    title: '적용 기술',
    description: '최신 웹 기술 스택으로 구현된 풀스택 애플리케이션.',
    icon: Code,
    gradient: 'from-purple-500 to-indigo-600',
    detailedContent: {
      overview:
        '최신 React 생태계 기반의 모던 풀스택 애플리케이션입니다. Next.js App Router와 React Server Components를 활용하고, Zustand로 상태를 관리합니다.',
      technologies: [
        'Next.js - React 메타프레임워크',
        'React - 컴포넌트 기반 UI 라이브러리',
        'TypeScript - 정적 타입 체크',
        'Tailwind CSS - 유틸리티 CSS 프레임워크',
        'Zustand - 클라이언트 상태 관리',
        '@tanstack/react-query - 서버 상태 관리',
        'framer-motion - React 애니메이션',
        'chart.js - 캔버스 기반 차트',
        'recharts - React 전용 차트',
        'd3 - 데이터 시각화',
        'lucide-react - SVG 아이콘',
        '@headlessui/react - 접근성 UI 컴포넌트',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'vibe-coding',
    title: '✨ Vibe Coding',
    description:
      'Cursor AI + MCP 기반 개발 워크플로우. 다중 AI 모델 협업 개발.',
    icon: Sparkles,
    gradient: 'from-amber-400 via-orange-500 to-yellow-600',
    detailedContent: {
      overview:
        'Cursor AI는 MCP를 통해 프로젝트 컨텍스트를 이해하는 AI 네이티브 에디터입니다. Claude Sonnet 3.7/4.0을 주력으로, ChatGPT와 OpenAI Codex를 상황별로 활용하여 개발합니다.',
      technologies: [
        'Cursor AI - Claude Sonnet 기반 AI 에디터',
        'MCP SDK - AI와 프로젝트 간 통신',
        'ChatGPT - 프롬프트 설계 및 브레인스토밍',
        'OpenAI Codex - 문서화 및 후기 작성',
        'ESLint - 코드 품질 검사',
        'Prettier - 코드 포맷팅',
        'Vitest - 단위 테스트',
        'Playwright - E2E 테스트',
        'Husky - Git hooks 관리',
        '@typescript-eslint - TypeScript 린트',
        '@testing-library - React 테스트',
      ],
    },
    requiresAI: false,
    isSpecial: true,
    isVibeCard: true,
  },
];

export default function FeatureCardsGrid() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showDevModal, setShowDevModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const { aiAgent } = useUnifiedAdminStore();
  const { warning } = useToast();

  // 모달 외부 클릭 시 닫기 처리
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setSelectedCard(null);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedCard(null);
      }
    };

    if (selectedCard) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [selectedCard]);

  const handleCardClick = (cardId: string) => {
    const card = cardData.find(c => c.id === cardId);

    if (card?.requiresAI && !aiAgent.isEnabled) {
      // AI 엔진이 필요한 기능에 일반 사용자가 접근할 때
      warning(
        '🚧 이 기능은 AI 엔진 모드에서만 사용 가능합니다. 홈 화면에서 AI 모드를 활성화해주세요.',
        {
          duration: 5000,
          action: {
            label: '활성화하기',
            onClick: () => (window.location.href = '/'),
          },
        }
      );
      return;
    }

    setSelectedCard(cardId);
  };

  const closeModal = () => {
    setSelectedCard(null);
  };

  const selectedCardData = cardData.find(card => card.id === selectedCard);

  // 선택된 카드의 기술 스택 분석
  const analyzedTechStack = selectedCardData
    ? analyzeTechStack(selectedCardData.detailedContent.technologies)
    : [];

  // AI 단어에 그라데이션 애니메이션 적용하는 함수
  const renderTextWithAIGradient = (text: string) => {
    if (!text.includes('AI')) return text;

    return text.split(/(AI)/g).map((part, index) => {
      if (part === 'AI') {
        return (
          <motion.span
            key={index}
            className='bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-bold'
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              backgroundSize: '200% 200%',
            }}
          >
            {part}
          </motion.span>
        );
      }
      return part;
    });
  };

  return (
    <>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto'>
        {cardData.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className='group cursor-pointer relative'
            onClick={() => handleCardClick(card.id)}
          >
            <div
              className={`relative p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300 h-full ${
                card.isSpecial
                  ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30'
                  : ''
              }`}
            >
              {/* 그라데이션 배경 */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}
              />

              {/* AI 카드 특별 이색 그라데이션 애니메이션 */}
              {card.isAICard && (
                <motion.div
                  className='absolute inset-0 bg-gradient-to-br from-blue-500/30 via-pink-500/30 to-cyan-400/30 rounded-2xl'
                  animate={{
                    background: [
                      'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(236,72,153,0.3) 50%, rgba(34,197,94,0.3) 100%)',
                      'linear-gradient(135deg, rgba(236,72,153,0.3) 0%, rgba(34,197,94,0.3) 50%, rgba(59,130,246,0.3) 100%)',
                      'linear-gradient(135deg, rgba(34,197,94,0.3) 0%, rgba(59,130,246,0.3) 50%, rgba(236,72,153,0.3) 100%)',
                      'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(236,72,153,0.3) 50%, rgba(34,197,94,0.3) 100%)',
                    ],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}

              {/* 바이브 코딩 카드 골드 그라데이션 애니메이션 */}
              {card.isVibeCard && (
                <motion.div
                  className='absolute inset-0 rounded-2xl'
                  animate={{
                    background: [
                      'linear-gradient(135deg, rgba(251,191,36,0.3) 0%, rgba(249,115,22,0.3) 50%, rgba(234,179,8,0.3) 100%)',
                      'linear-gradient(135deg, rgba(234,179,8,0.3) 0%, rgba(251,191,36,0.3) 50%, rgba(249,115,22,0.3) 100%)',
                      'linear-gradient(135deg, rgba(249,115,22,0.3) 0%, rgba(234,179,8,0.3) 50%, rgba(251,191,36,0.3) 100%)',
                      'linear-gradient(135deg, rgba(251,191,36,0.3) 0%, rgba(249,115,22,0.3) 50%, rgba(234,179,8,0.3) 100%)',
                    ],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}

              {/* 아이콘 */}
              <div
                className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 relative z-10 ${
                  card.isSpecial ? 'shadow-lg shadow-amber-500/25' : ''
                } ${card.isAICard ? 'shadow-lg shadow-pink-500/25' : ''}`}
              >
                {card.isAICard ? (
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
                      scale: {
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      },
                    }}
                  >
                    <card.icon className='w-5 h-5 text-white' />
                  </motion.div>
                ) : card.isVibeCard ? (
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
                    <card.icon className='w-5 h-5 text-white' />
                  </motion.div>
                ) : (
                  <card.icon className='w-5 h-5 text-white' />
                )}
              </div>

              {/* 컨텐츠 */}
              <div className='relative z-10'>
                <h3 className='text-lg font-bold text-white mb-2 group-hover:text-white transition-colors'>
                  {renderTextWithAIGradient(card.title)}
                </h3>
                <p className='text-white/70 text-xs leading-relaxed group-hover:text-white/90 transition-colors'>
                  {renderTextWithAIGradient(card.description)}
                </p>

                {/* AI 에이전트 필요 표시 */}
                {card.requiresAI && !aiAgent.isEnabled && (
                  <div className='mt-2 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-300 text-xs text-center'>
                    AI 에이전트 모드 필요
                  </div>
                )}
              </div>

              {/* 호버 효과 */}
              <div
                className={`absolute inset-0 ring-2 ring-transparent transition-all duration-300 rounded-2xl ${
                  card.isAICard
                    ? 'group-hover:ring-pink-400/50 group-hover:shadow-lg group-hover:shadow-pink-500/25'
                    : card.isSpecial
                      ? 'group-hover:ring-amber-400/50 group-hover:shadow-lg group-hover:shadow-amber-500/25'
                      : 'group-hover:ring-white/30'
                }`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* 개선된 상세 모달 */}
      <AnimatePresence>
        {selectedCard && selectedCardData && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60'>
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-900 border border-gray-700/50 rounded-xl shadow-2xl ${
                selectedCardData.isSpecial
                  ? 'border-amber-500/50 bg-gradient-to-br from-gray-900/95 to-amber-900/20'
                  : ''
              } ${
                selectedCardData.isAICard
                  ? 'border-pink-500/50 bg-gradient-to-br from-gray-900/95 to-pink-900/20'
                  : ''
              }`}
            >
              {/* 헤더 */}
              <div className='p-4 border-b border-gray-700/50'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${selectedCardData.gradient} rounded-lg flex items-center justify-center ${
                        selectedCardData.isSpecial
                          ? 'shadow-lg shadow-amber-500/25'
                          : ''
                      } ${
                        selectedCardData.isAICard
                          ? 'shadow-lg shadow-pink-500/25'
                          : ''
                      }`}
                    >
                      {selectedCardData.isAICard ? (
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
                          <selectedCardData.icon className='w-5 h-5 text-white' />
                        </motion.div>
                      ) : selectedCardData.isVibeCard ? (
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
                          <selectedCardData.icon className='w-5 h-5 text-white' />
                        </motion.div>
                      ) : (
                        <selectedCardData.icon className='w-5 h-5 text-white' />
                      )}
                    </div>
                    <div>
                      <h2 className='text-2xl font-bold text-white'>
                        {renderTextWithAIGradient(selectedCardData.title)}
                      </h2>
                      <p className='text-base text-gray-400'>
                        {renderTextWithAIGradient(selectedCardData.description)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className='w-8 h-8 rounded-full bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-center transition-colors'
                  >
                    <X className='w-4 h-4 text-gray-400' />
                  </button>
                </div>
              </div>

              {/* 상세 내용 */}
              <div className='p-4 space-y-4'>
                {/* 개요 */}
                <div>
                  <h3 className='text-white font-medium mb-3 text-xl'>
                    📖 개요
                  </h3>
                  <p className='text-gray-200 leading-relaxed text-lg'>
                    {renderTextWithAIGradient(
                      selectedCardData.detailedContent.overview
                    )}
                  </p>
                </div>

                {/* 적용 기술 */}
                <div>
                  <h3 className='text-white font-medium mb-3 text-xl'>
                    🛠️ 적용 기술
                  </h3>
                  <ul className='space-y-3'>
                    {selectedCardData.detailedContent.technologies.map(
                      (tech, index) => (
                        <li
                          key={index}
                          className='flex items-start gap-3 text-base'
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                              selectedCardData.isAICard
                                ? 'bg-pink-400'
                                : selectedCardData.isSpecial
                                  ? 'bg-amber-400'
                                  : 'bg-green-400'
                            }`}
                          />
                          <span className='text-gray-200 leading-relaxed'>
                            {renderTextWithAIGradient(tech)}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* 기술 스택 분석 */}
                <div>
                  <TechStackDisplay
                    categories={analyzedTechStack}
                    showHeader={true}
                    compact={true}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 개발 중 모달 */}
      <AnimatePresence>
        {showDevModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className='fixed top-20 left-1/2 transform -translate-x-1/2 z-50 p-4 bg-orange-500/90 text-white rounded-lg shadow-lg'
          >
            <div className='flex items-center gap-2 text-sm font-medium'>
              <Bot className='w-4 h-4' />
              <span>
                {renderTextWithAIGradient('AI 에이전트 모드를 활성화해주세요')}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
