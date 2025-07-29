'use client';

import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { motion } from 'framer-motion';
import { Bot, Database, Sparkles, Zap } from 'lucide-react';
import { useEffect, useRef, useState, useMemo, memo } from 'react';
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
      overview: `v5.65.3 - AI 시스템 대폭 개선! MCP 활용률 3배 향상, 서브 에이전트 100% 성공률 달성, 엔터프라이즈급 안정성 확보.`,
      features: [
        '🇰🇷 한국어 자연어 처리: "CPU 높은 서버?", "메모리 부족한 VM?"',
        '🆓 LOCAL 모드: Supabase RAG + 한국어 엔진 (완전 무료)',
        '🚀 GOOGLE 모드: Gemini 2.0 Flash (일 1,000회 무료)',
        '🤝 서브 에이전트: 10개 전문 AI로 작업 자동화 (100% 작동)',
        '📊 MCP 서버: 9개 중 6개 활성, 2개 테스트 중, 1개 설정 필요',
        '⚡ 빠른 응답: LOCAL 100-300ms, Python 3.11 Functions 배포',
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
      'Vercel + Supabase + GCP + Upstash for Redis. 프론트엔드부터 AI 서버까지 통합된 현대적 클라우드 개발 플랫폼',
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    detailedContent: {
      overview: `v5.65.3 - 무료 티어 최적화로 월 $0 운영! Python 3.11 Functions 구현, Vercel-Supabase-GCP 통합으로 완전한 클라우드 인프라 구축.`,
      features: [
        '▲ Vercel: 자동 배포, Edge Functions, Preview URL (무료 티어)',
        '🐘 Supabase: PostgreSQL + pgVector + RLS (500MB 무료)',
        '⚡ Upstash Redis: 고속 캐싱, Rate Limiting (256MB 무료)',
        '☁️ GCP Functions: Python 3.11 런타임 3개 배포 완료',
        '🤖 Google AI Studio: Gemini 2.0 Flash API (일 1,000회 무료)',
        '🔄 GitHub Actions: CI/CD 파이프라인 구축 (월 2,000분 무료)',
      ],
      technologies: [
        'Vercel',
        'Supabase',
        'Upstash for Redis',
        'Google Cloud Platform',
        'MCP Server (GCP VM)',
        'CI/CD Pipeline',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'tech-stack',
    title: '💻 기술 스택',
    description:
      'Next.js 14 + React 18 + TypeScript. 안정적인 프로덕션급 웹 기술로 구현된 현대적인 풀스택 애플리케이션',
    icon: Sparkles,
    gradient: 'from-blue-500 to-purple-600',
    detailedContent: {
      overview: `v5.65.3 - 코드 품질 지속적 개선! TypeScript strict mode 적용, 코드 품질 관리 시스템 구축, 테스트 자동화로 안정성 확보.`,
      features: [
        '⚛️ React 18.2 + Next.js 14.2.4: App Router, Edge Runtime 최적화',
        '🔷 TypeScript: strict mode 적용으로 타입 안전성 강화',
        '✨ ESLint: 코드 품질 지속적 개선 중 (린트 문제 15% 감소)',
        '🎨 Tailwind CSS: JIT 컴파일러로 스타일 최적화',
        '🧪 Vitest: 227개 테스트 케이스, 목표 커버리지 70%',
        '📦 npm 패키지 관리: 검증된 의존성 관리 (Node.js 22+)',
      ],
      technologies: [
        'Next.js 14.2.4',
        'React 18.2.0',
        'TypeScript',
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
      '🎯 AI 기반 워크플로우 구성: ChatGPT (목업) → Cursor AI (정적 페이지 자동 생성) → Claude Code + Gemini CLI (코드 자동화 및 병렬 분석)',
    icon: Zap,
    gradient: 'from-amber-600 via-orange-600 to-amber-700',
    detailedContent: {
      overview: `v5.65.3 - AI 페어 프로그래밍의 혁신! Claude Code + MCP 서버 통합으로 개발 자동화, 10개 전문 AI 어시스턴트로 모든 개발 작업 지원.`,
      features: [
        '🤖 Claude Code: 9개 MCP 서버 통합 (6개 활성, 3개 구성 중)',
        '🤝 서브 에이전트: 10개 전문 AI로 100% 작업 성공률',
        '🔗 MCP 도구: filesystem, github, memory, supabase 자동화',
        '🚀 AI 지원: 코드 작성, 테스트 실행, 문서화, 배포 지원',
        '💯 개선 성과: 서브 에이전트 성공률 70% → 100%',
        '📈 생산성: 반복 작업 자동화로 개발 속도 대폭 향상',
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

// AI 단어에 그라데이션 애니메이션 적용하는 함수 - 컴포넌트 외부로 이동
const renderTextWithAIGradient = (text: string) => {
  if (!text.includes('AI')) return text;

  return text.split(/(AI)/g).map((part, index) => {
    if (part === 'AI') {
      return (
        <motion.span
          key={index}
          className='bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent font-bold bg-[length:200%_200%]'
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {part}
        </motion.span>
      );
    }
    return part;
  });
};

// 개별 카드 컴포넌트를 메모이제이션
const FeatureCardItem = memo(
  ({
    card,
    index,
    onCardClick,
    isAIDisabled,
  }: {
    card: FeatureCard;
    index: number;
    onCardClick: (cardId: string) => void;
    isAIDisabled: boolean;
  }) => {
    // 카드 타입별 스타일 헬퍼
    const getCardStyles = (card: FeatureCard) => {
      return {
        title: card.isVibeCard
          ? 'text-white/98 group-hover:text-yellow-100'
          : 'text-white/95 group-hover:text-white',
        description: card.isVibeCard
          ? 'text-white/96 group-hover:text-yellow-50 font-bold'
          : 'text-white/80 group-hover:text-white/90 font-medium',
        hoverRing: card.isAICard
          ? 'group-hover:ring-pink-400/50 group-hover:shadow-lg group-hover:shadow-pink-500/25'
          : card.isVibeCard
            ? 'group-hover:ring-yellow-400/50'
            : card.isSpecial
              ? 'group-hover:ring-amber-400/50 group-hover:shadow-lg group-hover:shadow-amber-500/25'
              : 'group-hover:ring-white/30',
        iconColor: card.isVibeCard ? 'text-amber-900' : 'text-white',
      };
    };

    // 아이콘 애니메이션 설정
    const getIconAnimation = (card: FeatureCard) => {
      if (card.isAICard) {
        return {
          _animate: {
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          },
          transition: {
            rotate: {
              duration: 8,
              repeat: Infinity,
              ease: 'linear' as const,
            },
            scale: {
              duration: 2,
              repeat: Infinity,
            },
          },
        };
      }
      if (card.isVibeCard) {
        return {
          _animate: {
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0],
          },
          transition: {
            duration: 2.5,
            repeat: Infinity,
          },
        };
      }
      return null;
    };

    const cardStyles = useMemo(() => getCardStyles(card), [card]);
    const iconAnimation = useMemo(() => getIconAnimation(card), [card]);

    return (
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
        onClick={() => onCardClick(card.id)}
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
              <div className='absolute top-2 right-2 w-6 h-6 bg-yellow-400/30 rounded-full _animate-pulse'></div>
              <div className='absolute bottom-2 left-2 w-4 h-4 bg-yellow-400/20 rounded-full _animate-pulse'></div>

              {/* 개선된 배경 그라데이션 - 애니메이션 효과 */}
              <div className='absolute inset-0 rounded-2xl overflow-hidden'>
                <div className='absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 opacity-90 bg-[length:200%_200%] _animate-gradient' />
              </div>

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
            {iconAnimation ? (
              <motion.div {...iconAnimation}>
                <card.icon className={`w-6 h-6 ${cardStyles.iconColor}`} />
              </motion.div>
            ) : (
              <card.icon className='w-6 h-6 text-white' />
            )}
          </div>

          {/* 모든 카드들의 통일된 컨텐츠 */}
          <div className='relative z-10'>
            <h3
              className={`text-lg font-semibold mb-2 transition-colors leading-snug ${cardStyles.title}`}
            >
              {renderTextWithAIGradient(card.title)}
            </h3>
            <p
              className={`text-xs leading-relaxed transition-colors ${cardStyles.description}`}
            >
              {renderTextWithAIGradient(card.description)}
            </p>

            {/* AI 어시스턴트 필요 표시 */}
            {card.requiresAI && isAIDisabled && (
              <div className='mt-2 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-300 text-xs text-center'>
                AI 어시스턴트 모드 필요
              </div>
            )}
          </div>

          {/* 호버 효과 */}
          <div
            className={`absolute inset-0 ring-2 ring-transparent transition-all duration-300 rounded-2xl ${cardStyles.hoverRing}`}
          />
        </div>
      </motion.div>
    );
  }
);

FeatureCardItem.displayName = 'FeatureCardItem';

export default function FeatureCardsGrid() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const { aiAgent } = useUnifiedAdminStore();

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

  // handleCardClick을 useCallback으로 메모이제이션
  const handleCardClick = useMemo(
    () => (cardId: string) => {
      const card = cardData.find(c => c.id === cardId);

      if (card?.requiresAI && !aiAgent.isEnabled) {
        // AI 엔진이 필요한 기능에 일반 사용자가 접근할 때
        console.warn(
          '🚧 이 기능은 AI 엔진 모드에서만 사용 가능합니다. 홈 화면에서 AI 모드를 활성화해주세요.'
        );
        return;
      }

      setSelectedCard(cardId);
    },
    [aiAgent.isEnabled]
  );

  const closeModal = () => {
    setSelectedCard(null);
  };

  const selectedCardData = cardData.find(card => card.id === selectedCard);

  return (
    <>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto'>
        {cardData.map((card, index) => (
          <FeatureCardItem
            key={card.id}
            card={card}
            index={index}
            onCardClick={handleCardClick}
            isAIDisabled={!aiAgent.isEnabled}
          />
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
