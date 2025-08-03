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
      overview: `v5.66.22 - 실시간 AI 어시스턴트! 대시보드 사이드바에서 한국어로 자연스럽게 질문하고 즉시 답변받으세요. 서버 상태 분석, 이상 징후 감지, 성능 예측까지.`,
      features: [
        '🤖 실시간 AI 사이드바: 대시보드에서 항상 대기 중인 AI 어시스턴트',
        '🇰🇷 한국어 자연어 처리: "CPU 높은 서버?", "메모리 부족한 VM?"',
        '📊 서버 상태 분석: 실시간 메트릭 기반 지능형 분석 및 답변',
        '🚨 이상 징후 감지: 패턴 분석으로 문제 사전 예방 알림',
        '🆓 LOCAL 모드: Supabase pgVector + 한국어 엔진 (완전 무료)',
        '🚀 GOOGLE 모드: Gemini 2.0 Flash로 고급 분석 (일 1,000회 무료)',
      ],
      technologies: [
        '2-Mode System',
        'Supabase pgVector',
        'Korean NLP Engine',
        'Google Gemini 2.0',
        'Real-time Assistant',
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
      overview: `v5.66.22 - 무료 티어 최적화로 월 $0 운영! Python 3.11 Functions 3개 배포 완료, Vercel-Supabase-GCP 통합으로 완전한 클라우드 인프라 구축.`,
      features: [
        '▲ Vercel: 자동 배포, Edge Runtime, Preview URL (무료 티어)',
        '🐘 Supabase: PostgreSQL + pgVector + RLS (500MB 무료)',
        '⚡ Upstash Redis: 고속 캐싱, Rate Limiting (256MB 무료)',
        '☁️ GCP Functions: enhanced-korean-nlp, ml-analytics-engine, unified-ai-processor (배포 완료)',
        '🤖 Google AI Studio: Gemini 2.0 Flash API (일 1,000회 무료)',
        '🔄 GitHub Actions: CI/CD 파이프라인 구축 (월 2,000분 무료)',
      ],
      technologies: [
        'Vercel Edge Runtime',
        'Supabase PostgreSQL',
        'Upstash Redis',
        'Python 3.11 Functions',
        'Google AI Studio',
        'GitHub Actions',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'tech-stack',
    title: '💻 기술 스택',
    description:
      'Next.js 15 + React 18 + TypeScript. 안정적인 프로덕션급 웹 기술로 구현된 현대적인 풀스택 애플리케이션',
    icon: Sparkles,
    gradient: 'from-blue-500 to-purple-600',
    detailedContent: {
      overview: `v5.66.22 - 코드 품질 지속적 개선! TypeScript strict mode 적용, 코드 품질 관리 시스템 구축, 테스트 자동화로 안정성 확보.`,
      features: [
        '⚛️ React 18.3.1 + Next.js 15.4.5: App Router, Edge Runtime 최적화',
        '🔷 TypeScript: strict mode 적용으로 타입 안전성 강화',
        '✨ ESLint: 코드 품질 지속적 개선 중 (린트 문제 15% 감소)',
        '🎨 Tailwind CSS: JIT 컴파일러로 스타일 최적화',
        '🧪 Vitest: 40개 테스트 파일, 3단계 테스트 전략 (minimal → smart → full)',
        '📦 npm 패키지 관리: 검증된 의존성 관리 (Node.js 22+)',
      ],
      technologies: [
        'Next.js 15.4.5',
        'React 18.3.1',
        'TypeScript',
        'Tailwind CSS',
        'Zustand',
        'Vitest',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'cursor-ai',
    title: '🔥 Vibe Coding',
    description:
      '🎯 AI 개발 도구의 진화: ChatGPT (초기 목업) → Cursor AI (코드 생성) → Claude Code (완전 자동화). 지금은 Claude Code + 11개 MCP로 개발!',
    icon: Zap,
    gradient: 'from-amber-600 via-orange-600 to-amber-700',
    detailedContent: {
      overview: `v5.66.22 - AI 개발 도구의 완벽한 진화! ChatGPT로 시작하여 Cursor AI를 거쳐 현재는 Claude Code + 11개 MCP 서버로 완전 자동화 달성. 개발 속도 10배 향상!`,
      features: [
        '💬 ChatGPT: 초기 페이지 목업 생성 → 현재는 브레인스토밍 & 프롬프트 설계',
        '💻 Cursor AI → Claude Code: v5.65까지 Cursor 사용 → 이후 Claude Code로 완전 전환',
        '🤖 Claude Code: 현재 주력! 11개 MCP 서버로 완벽한 개발 자동화 실현',
        '📋 CLAUDE.md: AI가 따르는 프로젝트 규칙과 표준 문서화',
        '🚀 개발 속도: ChatGPT 시절 대비 10배, Cursor AI 대비 3배 향상',
        '✨ 전체 프로젝트 자동화: Git, 테스트, 배포까지 완전 자동화',
      ],
      technologies: [
        'ChatGPT (초기)',
        'Cursor AI (중기)',
        'Claude Code (현재)',
        '11 MCP Servers',
        'CLAUDE.md',
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
          className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-[length:200%_200%] bg-clip-text font-bold text-transparent"
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
        className={`group relative cursor-pointer ${
          card.isVibeCard
            ? 'transform-gpu hover:shadow-2xl hover:shadow-yellow-500/30'
            : ''
        }`}
        onClick={() => onCardClick(card.id)}
      >
        <div
          className={`cubic-bezier(0.4, 0, 0.2, 1) relative h-full rounded-2xl border border-white/25 bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/20 ${
            card.isSpecial
              ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10'
              : ''
          } group-hover:scale-[1.02] group-hover:transform group-hover:shadow-2xl`}
        >
          {/* 그라데이션 배경 */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${card.gradient} rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-10`}
          />

          {/* AI 카드 특별 이색 그라데이션 애니메이션 - landing 버전에서 재활용 */}
          {card.isAICard && (
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/30 via-pink-500/30 to-cyan-400/30"
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
              <div className="_animate-pulse absolute right-2 top-2 h-6 w-6 rounded-full bg-yellow-400/30"></div>
              <div className="_animate-pulse absolute bottom-2 left-2 h-4 w-4 rounded-full bg-yellow-400/20"></div>

              {/* 개선된 배경 그라데이션 - 애니메이션 효과 */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="_animate-gradient absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-600 to-red-700 bg-[length:200%_200%] opacity-90" />
              </div>

              {/* 텍스트 가독성을 위한 오버레이 */}
              <div className="absolute inset-0 rounded-2xl bg-black/15"></div>
            </>
          )}

          {/* 일반 카드들의 아이콘 (바이브 코딩 포함) */}
          <div
            className={`h-12 w-12 ${
              card.isVibeCard
                ? 'bg-gradient-to-br from-yellow-400 to-amber-500'
                : `bg-gradient-to-br ${card.gradient}`
            } relative z-10 mb-3 flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${
              card.isAICard ? 'shadow-lg shadow-pink-500/25' : ''
            }`}
          >
            {iconAnimation ? (
              <motion.div {...iconAnimation}>
                <card.icon className={`h-6 w-6 ${cardStyles.iconColor}`} />
              </motion.div>
            ) : (
              <card.icon className="h-6 w-6 text-white" />
            )}
          </div>

          {/* 모든 카드들의 통일된 컨텐츠 */}
          <div className="relative z-10">
            <h3
              className={`mb-2 text-lg font-semibold leading-snug transition-colors ${cardStyles.title}`}
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
              <div className="mt-2 rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-1 text-center text-xs text-orange-300">
                AI 어시스턴트 모드 필요
              </div>
            )}
          </div>

          {/* 호버 효과 */}
          <div
            className={`absolute inset-0 rounded-2xl ring-2 ring-transparent transition-all duration-300 ${cardStyles.hoverRing}`}
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
      const card = cardData.find((c) => c.id === cardId);

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

  const selectedCardData = cardData.find((card) => card.id === selectedCard);

  return (
    <>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
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
        variant="home"
      />
    </>
  );
}
