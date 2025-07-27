'use client';

import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { motion } from 'framer-motion';
import { Bot, Database, Sparkles, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import FeatureCardModal from '@/components/shared/FeatureCardModal';

// FeatureCard 타입 정의
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

// 카드 데이터
const cardData: FeatureCard[] = [
  {
    id: 'mcp-ai-engine',
    title: '🧠 AI 시스템',
    description:
      '한국어로 자연스럽게 질문하세요! "메모리 많이 쓰는 서버?" → 즉시 분석. LOCAL 모드로 무료 사용',
    icon: Bot,
    gradient: 'from-purple-500 via-indigo-500 to-cyan-400',
    detailedContent: {
      overview: `2가지 모드로 동작하는 똑똑한 AI 시스템입니다. LOCAL 모드는 무료로 사용 가능하며, 필요시 Google AI로 더 정교한 분석을 제공합니다.`,
      features: [
        '🇰🇷 한국어 자연어 처리: "CPU 높은 서버?", "메모리 부족한 VM?"',
        '🆓 LOCAL 모드: Supabase RAG + 한국어 엔진 (무료)',
        '🚀 GOOGLE 모드: Gemini 2.0 Flash (일 1,000회)',
        '💾 벡터 검색: 사용할수록 정확해지는 학습 시스템',
        '⚡ 빠른 응답: LOCAL 100-300ms, 캐싱으로 반복 질의 즉시',
      ],
      technologies: [
        '2-Mode System',
        'Supabase pgVector',
        'Korean NLP',
        'Google Gemini 2.0',
        'MCP Protocol',
      ],
    },
    requiresAI: true,
    isAICard: true,
  },
  {
    id: 'fullstack-ecosystem',
    title: '🏗️ 클라우드 개발 환경',
    description:
      'Vercel + Supabase + GCP + GitHub. 프론트엔드부터 AI 서버까지 통합된 현대적 클라우드 개발 플랫폼',
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    detailedContent: {
      overview: `6개의 클라우드 서비스를 하나로 연결한 개발 환경입니다. 코드 작성부터 배포까지 모든 과정이 자동화되어 있습니다.`,
      features: [
        '▲ Vercel: 자동 배포, Edge Functions, Preview URL',
        '🐘 Supabase: PostgreSQL + 실시간 구독 + RLS',
        '⚡ Upstash Redis: 캐싱, 세션, Rate Limiting',
        '☁️ GCP: VM에서 MCP 서버 24/7 운영',
        '🤖 Google AI Studio: Gemini API 통합',
        '🐙 GitHub Actions: CI/CD 자동화',
      ],
      technologies: [
        'Vercel',
        'Supabase',
        'Upstash Redis',
        'Google Cloud Platform',
        'GitHub',
        'MCP Server (GCP VM)',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'tech-stack',
    title: '💻 기술 스택',
    description:
      'Next.js 15 + React 19 + TypeScript. 최신 웹 기술로 구현된 현대적인 풀스택 애플리케이션',
    icon: Sparkles,
    gradient: 'from-blue-500 to-purple-600',
    detailedContent: {
      overview: `최신 웹 기술들을 조합하여 구축한 모던 풀스택 애플리케이션입니다. 프론트엔드부터 백엔드까지 타입 안전성과 개발자 경험을 최우선으로 설계되었습니다.`,
      features: [
        '⚛️ React 19 + Next.js 15: App Router, Server Components',
        '🔷 TypeScript: 100% 타입 안전성, strict mode',
        '🎨 Tailwind CSS: 유틸리티 기반 스타일링',
        '🗄️ Prisma + PostgreSQL: 타입 안전한 ORM',
        '🧪 Vitest + Playwright: 단위/통합/E2E 테스트',
        '📦 pnpm + Turbo: 빠른 패키지 관리와 빌드',
      ],
      technologies: [
        'Next.js 15',
        'React 19',
        'TypeScript 5.7',
        'Tailwind CSS',
        'Prisma',
        'Vitest',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'cursor-ai',
    title: '🔥 Vibe Coding',
    description:
      '🎯 AI와 함께하는 코딩 진화: ChatGPT(정적) → Cursor AI(동적) → Claude Code(풀스택) + Gemini CLI',
    icon: Zap,
    gradient: 'from-amber-600 via-orange-600 to-amber-700',
    detailedContent: {
      overview: `AI와 함께 코딩하는 방법의 진화입니다. ChatGPT로 시작해 Cursor AI를 거쳐 현재는 Claude Code와 Gemini CLI를 활용합니다.`,
      features: [
        '📄 1단계: ChatGPT로 HTML/CSS 정적 페이지',
        '⚛️ 2단계: Cursor AI로 React 동적 앱',
        '🚀 3단계: Claude Code로 풀스택 개발',
        '🤝 현재: Gemini CLI로 병렬 작업',
        '🔗 MCP: 파일시스템과 도구 완전 통합',
        '💡 진화: 각 단계의 경험이 다음 단계의 토대',
      ],
      technologies: [
        'ChatGPT → Cursor AI → Claude Code',
        'Gemini CLI (보조)',
        'MCP Protocol',
        'AI Pair Programming',
      ],
    },
    requiresAI: false,
    isVibeCard: true,
    isSpecial: true,
  },
];

export default function FeatureCardsGrid() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const { aiAgent } = useUnifiedAdminStore();

  // 카드는 항상 다크 테마로 표시

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
      console.warn(
        '🚧 이 기능은 AI 엔진 모드에서만 사용 가능합니다. 홈 화면에서 AI 모드를 활성화해주세요.'
      );
      return;
    }

    setSelectedCard(cardId);
  };

  const closeModal = () => {
    setSelectedCard(null);
  };

  const selectedCardData = cardData.find(card => card.id === selectedCard);

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
            whileHover={{
              scale: card.isVibeCard ? 1.08 : 1.05,
              y: card.isVibeCard ? -8 : -5,
              rotateY: card.isVibeCard ? 5 : 0,
            }}
            className={`group cursor-pointer relative ${
              card.isVibeCard
                ? 'hover:shadow-2xl hover:shadow-yellow-500/30 transform-gpu'
                : ''
            }`}
            onClick={() => handleCardClick(card.id)}
          >
            <div
              className={`relative p-4 bg-white/10 hover:bg-white/20 border-white/25 backdrop-blur-sm border rounded-2xl transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) h-full ${
                card.isSpecial
                  ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30'
                  : ''
              } group-hover:transform group-hover:scale-[1.02] group-hover:shadow-2xl`}
            >
              {/* 그라데이션 배경 */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}
              />

              {/* AI 카드 특별 이색 그라데이션 애니메이션 - landing 버전에서 재활용 */}
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

              {/* Vibe Coding 카드 특별 디자인 */}
              {card.isVibeCard && (
                <>
                  {/* 장식 요소 */}
                  <div className='absolute top-2 right-2 w-6 h-6 bg-yellow-400/30 rounded-full animate-pulse'></div>
                  <div className='absolute bottom-2 left-2 w-4 h-4 bg-yellow-400/20 rounded-full animate-pulse'></div>

                  {/* 개선된 배경 그라데이션 - 더 부드럽고 현대적 */}
                  <motion.div
                    className='absolute inset-0 rounded-2xl opacity-90'
                    style={{
                      background:
                        'linear-gradient(135deg, #f59e0b 0%, #f97316 25%, #ea580c 50%, #dc2626 75%, #b91c1c 100%)',
                    }}
                    animate={{
                      background: [
                        'linear-gradient(135deg, #f59e0b 0%, #f97316 25%, #ea580c 50%, #dc2626 75%, #b91c1c 100%)',
                        'linear-gradient(135deg, #f97316 0%, #ea580c 25%, #dc2626 50%, #b91c1c 75%, #f59e0b 100%)',
                        'linear-gradient(135deg, #ea580c 0%, #dc2626 25%, #b91c1c 50%, #f59e0b 75%, #f97316 100%)',
                        'linear-gradient(135deg, #f59e0b 0%, #f97316 25%, #ea580c 50%, #dc2626 75%, #b91c1c 100%)',
                      ],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />

                  {/* 텍스트 가독성을 위한 오버레이 */}
                  <div className='absolute inset-0 bg-black/15 rounded-2xl'></div>
                </>
              )}

              {/* 일반 카드들의 아이콘 (바이브 코딩 포함) */}
              <div
                className={`w-12 h-12 ${
                  card.isVibeCard
                    ? 'bg-gradient-to-br from-yellow-400 to-amber-500'
                    : `bg-gradient-to-br ${card.gradient}`
                } rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 relative z-10 ${
                  card.isAICard ? 'shadow-lg shadow-pink-500/25' : ''
                }`}
              >
                {card.isAICard ? (
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
                    <card.icon className='w-6 h-6 text-white' />
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
                    <card.icon className='w-6 h-6 text-amber-900' />
                  </motion.div>
                ) : (
                  <card.icon className='w-6 h-6 text-white' />
                )}
              </div>

              {/* 모든 카드들의 통일된 컨텐츠 */}
              <div className='relative z-10'>
                <h3
                  className={`text-lg font-bold mb-2 transition-colors leading-tight ${
                    card.isVibeCard
                      ? 'text-white group-hover:text-yellow-100'
                      : 'text-white group-hover:text-white'
                  }`}
                  style={{
                    color: card.isVibeCard
                      ? 'rgba(255, 255, 255, 0.98)'
                      : 'rgba(255, 255, 255, 0.95)',
                    fontWeight: 600,
                    lineHeight: 1.4,
                  }}
                >
                  {renderTextWithAIGradient(card.title)}
                </h3>
                <p
                  className={`text-xs leading-relaxed transition-colors ${
                    card.isVibeCard
                      ? 'text-white/90 group-hover:text-yellow-50'
                      : 'text-white/70 group-hover:text-white/90'
                  }`}
                  style={{
                    color: card.isVibeCard
                      ? 'rgba(255, 255, 255, 0.96)'
                      : 'rgba(255, 255, 255, 0.80)',
                    lineHeight: 1.5,
                    fontWeight: card.isVibeCard ? 700 : 500,
                  }}
                >
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
                    : card.isVibeCard
                      ? 'group-hover:ring-yellow-400/50'
                      : card.isSpecial
                        ? 'group-hover:ring-amber-400/50 group-hover:shadow-lg group-hover:shadow-amber-500/25'
                        : 'group-hover:ring-white/30'
                }`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Feature Card Modal */}
      <FeatureCardModal
        selectedCard={selectedCardData}
        onClose={closeModal}
        renderTextWithAIGradient={renderTextWithAIGradient}
        modalRef={modalRef as React.RefObject<HTMLDivElement>}
        variant='home'
      />
    </>
  );
}
