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
  Network,
  Monitor,
  Globe,
  Palette,
  Brain,
  Cloud,
  Shield,
  BarChart3,
  Settings,
  Wrench,
} from 'lucide-react';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useToast } from '@/components/ui/ToastNotification';
import TechStackDisplay from '@/components/ui/TechStackDisplay';
import { analyzeTechStack } from '@/utils/TechStackAnalyzer';

// 기술 카테고리별 데이터
const techCategories = {
  'mcp-integration': {
    title: '🔗 MCP 통합',
    icon: Network,
    color: 'from-purple-500 to-indigo-500',
    techs: [
      {
        name: 'MCP SDK',
        description: '🎯 핵심 - AI 모델 문맥 이해를 위한 lightweight 프로토콜',
        icon: Network,
        color: 'bg-purple-600',
      },
    ],
  },
  'ai-ml': {
    title: '🤖 AI/ML',
    icon: Brain,
    color: 'from-pink-500 to-rose-500',
    techs: [
      {
        name: 'TensorFlow.js',
        description: '브라우저 ML 실행',
        icon: Brain,
        color: 'bg-orange-500',
      },
      {
        name: 'Transformers.js',
        description: '사전훈련 모델',
        icon: Cpu,
        color: 'bg-red-500',
      },
      {
        name: 'natural',
        description: '영어 NLP',
        icon: Globe,
        color: 'bg-green-500',
      },
      {
        name: 'korean-js',
        description: '한국어 형태소',
        icon: Globe,
        color: 'bg-blue-500',
      },
    ],
  },
  frontend: {
    title: '💻 프론트엔드',
    icon: Monitor,
    color: 'from-blue-500 to-cyan-500',
    techs: [
      {
        name: 'Next.js',
        description: 'React 메타프레임워크',
        icon: Globe,
        color: 'bg-black',
      },
      {
        name: 'React',
        description: 'UI 컴포넌트',
        icon: Code,
        color: 'bg-blue-400',
      },
      {
        name: 'TypeScript',
        description: '정적 타입 체크',
        icon: Code,
        color: 'bg-blue-600',
      },
      {
        name: 'Tailwind CSS',
        description: '유틸리티 CSS',
        icon: Palette,
        color: 'bg-cyan-500',
      },
    ],
  },
  'data-storage': {
    title: '🗄️ 데이터 & 저장',
    icon: Database,
    color: 'from-emerald-500 to-teal-500',
    techs: [
      {
        name: 'Supabase',
        description: 'PostgreSQL DB',
        icon: Database,
        color: 'bg-green-600',
      },
      {
        name: 'Redis',
        description: '서버리스 캐싱',
        icon: Database,
        color: 'bg-red-600',
      },
      {
        name: 'Faker.js',
        description: '데이터 생성',
        icon: Zap,
        color: 'bg-yellow-500',
      },
    ],
  },
  monitoring: {
    title: '📊 모니터링',
    icon: BarChart3,
    color: 'from-orange-500 to-red-500',
    techs: [
      {
        name: 'Prometheus',
        description: '메트릭 수집',
        icon: BarChart3,
        color: 'bg-orange-500',
      },
      {
        name: 'SystemInfo',
        description: '시스템 정보',
        icon: Monitor,
        color: 'bg-gray-600',
      },
    ],
  },
  visualization: {
    title: '📈 시각화',
    icon: BarChart3,
    color: 'from-violet-500 to-purple-500',
    techs: [
      {
        name: 'Chart.js',
        description: '캔버스 차트',
        icon: BarChart3,
        color: 'bg-pink-500',
      },
      {
        name: 'Recharts',
        description: 'React 차트',
        icon: BarChart3,
        color: 'bg-purple-500',
      },
      {
        name: 'D3',
        description: '데이터 시각화',
        icon: BarChart3,
        color: 'bg-indigo-500',
      },
    ],
  },
  development: {
    title: '🛠️ 개발도구',
    icon: Wrench,
    color: 'from-gray-500 to-slate-500',
    techs: [
      {
        name: 'ESLint',
        description: '코드 품질',
        icon: Shield,
        color: 'bg-purple-600',
      },
      {
        name: 'Prettier',
        description: '코드 포맷팅',
        icon: Settings,
        color: 'bg-gray-700',
      },
      {
        name: 'Vitest',
        description: '단위 테스트',
        icon: Shield,
        color: 'bg-green-500',
      },
      {
        name: 'Playwright',
        description: 'E2E 테스트',
        icon: Shield,
        color: 'bg-blue-500',
      },
    ],
  },
  'ai-development': {
    title: '✨ AI 개발',
    icon: Sparkles,
    color: 'from-amber-500 to-yellow-500',
    techs: [
      {
        name: 'Cursor AI',
        description:
          '🎯 핵심 - Claude Sonnet 4.0 기반 컨텍스트 이해형 AI 에디터',
        icon: Code,
        color: 'bg-purple-600',
      },
      {
        name: 'Claude Sonnet',
        description: '커서 개발 모델 - 대규모 컨텍스트 처리 및 코드 이해',
        icon: Brain,
        color: 'bg-indigo-500',
      },
      {
        name: 'ChatGPT',
        description: '브레인스토밍 + 프롬프트 작성 초반 단계',
        icon: Brain,
        color: 'bg-green-500',
      },
      {
        name: 'Jules (Google AI)',
        description: 'AI 워크플로우 자동화 도우미 - 대화형 업무 실행 병행',
        icon: Settings,
        color: 'bg-blue-500',
      },
      {
        name: 'GPT Codex',
        description:
          '코드 특화 GPT-3 파생 모델 - 프로그래밍 언어 특화 병행 후반',
        icon: Code,
        color: 'bg-cyan-500',
      },
    ],
  },
};

// 카드별 기술 카테고리 매핑
const cardTechMapping = {
  'mcp-ai-engine': ['mcp-integration', 'ai-ml'],
  'data-generator': ['data-storage', 'monitoring'],
  'tech-stack': ['frontend', 'visualization'],
  'vibe-coding': ['mcp-integration', 'ai-development', 'development'],
};

// 카드 데이터
const cardData = [
  {
    id: 'mcp-ai-engine',
    title: 'MCP 기반 AI 엔진',
    description:
      'TensorFlow.js와 Transformers.js로 구현된 브라우저 기반 AI 엔진. MCP 프로토콜로 문서 검색과 컨텍스트 관리.',
    icon: Bot,
    gradient: 'from-blue-500 via-pink-500 to-cyan-400',
    detailedContent: {
      overview:
        'TensorFlow.js 4.22.0과 Hugging Face Transformers 2.17.2를 사용하여 브라우저에서 직접 실행되는 AI 엔진입니다. MCP(Model Context Protocol) SDK를 통해 문서 검색과 컨텍스트 관리를 수행합니다.',
      features: [
        'TensorFlow.js 4.22.0으로 브라우저 내 기계학습 모델 실행',
        '@xenova/transformers 2.17.2로 사전 훈련된 모델 활용',
        'MCP SDK 1.12.1 + filesystem/github 서버로 문서 검색',
        'natural 8.1.0, korean-js 0.8.2로 자연어 처리',
      ],
      technologies: [
        '@tensorflow/tfjs 4.22.0',
        '@xenova/transformers 2.17.2',
        '@modelcontextprotocol/sdk 1.12.1',
        'natural 8.1.0, korean-js 0.8.2',
      ],
    },
    requiresAI: true,
    isAICard: true,
  },
  {
    id: 'data-generator',
    title: '서버 데이터 생성기',
    description:
      'Faker.js와 Prometheus 클라이언트로 구현된 서버 메트릭 시뮬레이터. 실시간 시계열 데이터 생성.',
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    detailedContent: {
      overview:
        '@faker-js/faker 9.8.0과 prom-client 15.1.3을 사용하여 실제적인 서버 메트릭을 생성합니다. systeminformation 5.27.1로 시스템 정보를 수집하고 Redis로 캐싱합니다.',
      features: [
        '@faker-js/faker 9.8.0으로 현실적인 서버 데이터 생성',
        'prom-client 15.1.3으로 Prometheus 호환 메트릭 출력',
        'systeminformation 5.27.1로 실제 시스템 정보 수집',
        '@upstash/redis 1.34.3과 node-cron 4.0.7로 스케줄링',
      ],
      technologies: [
        '@faker-js/faker 9.8.0',
        'prom-client 15.1.3',
        'systeminformation 5.27.1',
        '@upstash/redis 1.34.3',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'tech-stack',
    title: '적용 기술',
    description:
      'Next.js 15, React 19, TypeScript 기반 풀스택 구현. Supabase와 Redis로 데이터 관리.',
    icon: Code,
    gradient: 'from-purple-500 to-indigo-600',
    detailedContent: {
      overview:
        'Next.js 15.3.2와 React 19.1.0 기반의 모던 풀스택 애플리케이션입니다. Zustand와 TanStack Query로 상태 관리, Supabase와 Upstash Redis로 데이터 관리를 구현했습니다.',
      features: [
        'Next.js 15.3.2, React 19.1.0, TypeScript 5로 프론트엔드 구현',
        'Zustand 5.0.5, @tanstack/react-query 5.79.0으로 상태 관리',
        '@supabase/supabase-js 2.49.8, @upstash/redis 1.34.3으로 백엔드',
        'Chart.js 4.4.9, Recharts 2.15.3, D3 7.9.0으로 시각화',
      ],
      technologies: [
        'Next.js 15.3.2, React 19.1.0',
        'Zustand 5.0.5, TanStack Query 5.79.0',
        'Supabase 2.49.8, Upstash Redis 1.34.3',
        'Tailwind CSS 3.4.1, Framer Motion 12.15.0',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'vibe-coding',
    title: '✨ Vibe Coding',
    description:
      'Cursor AI와 MCP 기반 개발 워크플로우. ESLint, Prettier, Vitest, Playwright로 코드 품질 관리.',
    icon: Sparkles,
    gradient: 'from-amber-400 via-orange-500 to-yellow-600',
    detailedContent: {
      overview:
        'Cursor AI와 MCP(Model Context Protocol)를 활용한 개발 워크플로우입니다. ESLint 9, Prettier 3.5.3으로 코드 품질을 관리하고, Vitest와 Playwright로 테스트를 자동화했습니다.',
      features: [
        '@modelcontextprotocol/sdk로 Cursor AI 개발 환경 구성',
        'ESLint 9, Prettier 3.5.3, lint-staged로 코드 품질 관리',
        'Vitest 3.2.1, @playwright/test 1.52.0으로 테스트 자동화',
        'Husky 9.1.7, GitHub Actions로 CI/CD 파이프라인 구축',
      ],
      technologies: [
        '@modelcontextprotocol/sdk 1.12.1',
        'ESLint 9, Prettier 3.5.3',
        'Vitest 3.2.1, Playwright 1.52.0',
        'Husky 9.1.7, GitHub Actions',
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
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md'>
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl ${
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
                      <h2 className='text-lg font-bold text-white'>
                        {renderTextWithAIGradient(selectedCardData.title)}
                      </h2>
                      <p className='text-xs text-gray-400'>
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
                  <h3 className='text-white font-medium mb-2 text-base'>
                    📖 개요
                  </h3>
                  <p className='text-gray-300 leading-relaxed text-sm'>
                    {renderTextWithAIGradient(
                      selectedCardData.detailedContent.overview
                    )}
                  </p>
                </div>

                {/* 주요 기능 */}
                <div>
                  <h3 className='text-white font-medium mb-3 text-base'>
                    ⚡ 주요 기능
                  </h3>
                  <ul className='space-y-2'>
                    {selectedCardData.detailedContent.features.map(
                      (feature, index) => (
                        <li
                          key={index}
                          className='flex items-start gap-2 text-xs'
                        >
                          <div
                            className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${
                              selectedCardData.isAICard
                                ? 'bg-pink-400'
                                : selectedCardData.isSpecial
                                  ? 'bg-amber-400'
                                  : 'bg-green-400'
                            }`}
                          />
                          <span className='text-gray-300 leading-relaxed'>
                            {renderTextWithAIGradient(feature)}
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
