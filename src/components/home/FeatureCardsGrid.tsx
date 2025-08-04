'use client';

import FeatureCardModal from '@/components/shared/FeatureCardModal';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { motion } from 'framer-motion';
import { Bot, Database, Sparkles, Zap, type LucideIcon } from 'lucide-react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

// FeatureCard 타입 정의
interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
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
    title: '🧠 AI 어시스턴트',
    description:
      'AI로 시스템을 분석하는 도구입니다. 질문하면 답변해주고, 앞일을 예측하며, 보고서까지 자동으로 만들어줍니다.',
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
    title: '🏗️ 클라우드 플랫폼 활용',
    description:
      'Vercel + Supabase + GCP + Upstash Redis. 프론트엔드부터 AI 서버까지 통합된 현대적 클라우드 개발 플랫폼',
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    detailedContent: {
      overview: `v5.66.27 - 무료 티어 최적화로 월 $0 운영! 4개 클라우드 플랫폼을 통합하여 완전한 서버리스 인프라 구축, 자동 스케일링과 글로벌 CDN으로 성능 최적화.`,
      features: [
        '▲ Vercel 플랫폼: Next.js 15 자동 배포, Edge Runtime 활용, Preview URL로 브랜치별 테스트 환경 구축',
        '🌐 Vercel로 구현한 기능: 서버리스 API Routes 12개, 실시간 대시보드, GitHub 연동 자동 배포',
        '🐘 Supabase 플랫폼: PostgreSQL + pgVector + Row Level Security, 실시간 구독 지원',
        '📊 Supabase로 구현한 기능: 서버 메트릭 저장, AI 벡터 검색, 사용자 인증 시스템',
        '⚡ Upstash Redis: 고속 인메모리 캐싱, Rate Limiting, 세션 관리 (256MB 무료)',
        '☁️ GCP Functions: Python 3.11 기반 AI 처리 서버 3개 (enhanced-korean-nlp, ml-analytics-engine, unified-ai-processor)',
        '🤖 Google AI Studio: Gemini 2.0 Flash API 통합, 일 1,000회 무료 할당량 활용',
        '🔄 GitHub Actions: 자동 테스트, 배포 파이프라인, 코드 품질 검사 (월 2,000분 무료)',
      ],
      technologies: [
        'Vercel Edge Runtime',
        'Supabase PostgreSQL',
        'Upstash Redis',
        'GCP Cloud Functions',
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
      'AI 기반 Vibe Coding으로 Claude Code & Gemini CLI를 활용하여 자연어 프롬프트 기반 UI/기능 프로토타입을 빠르게 구현',
    icon: Zap,
    gradient: 'from-amber-600 via-orange-600 to-amber-700',
    detailedContent: {
      overview: `v5.66.26 - AI 트리오로 개발 속도 10배 향상! Cursor의 자동 오류 수정, Claude Code의 11개 MCP 서버, Gemini CLI의 1M 토큰으로 이 프로젝트의 코드 품질을 475→400개 문제로 개선했습니다.`,
      features: [
        '🚀 Cursor AI (2025): 자동 오류 감지/수정, 백그라운드 에이전트, Composer로 멀티파일 동시 생성',
        '🤖 Claude Code + MCP: filesystem, github, supabase 등 11개 서버로 프로젝트 전체 관리',
        '💡 Gemini CLI (무료): 1M 토큰 컨텍스트로 전체 코드베이스 분석 (일 1,000회 무료)',
        '🔧 실제 활용: TypeScript 타입 에러 302개 → 0개, ESLint 문제 475개 → 400개 감소',
        '📊 MCP 활용 예시: supabase 서버로 DB 마이그레이션, github 서버로 PR 자동 생성',
        '⚡ 협업 전략: Claude로 코드 생성 → Gemini로 대규모 분석 → Cursor로 실시간 수정',
        '🔍 17개 서브에이전트: code-review, test-automation, debugger 등으로 품질 자동 관리',
      ],
      technologies: [
        'Cursor AI: GPT-4, Claude 3.7 지원, SOC 2 인증, $20/월 Pro 플랜',
        'Claude Code: Pro $20/월, Max $100/월, Remote MCP 원클릭 설치',
        'Gemini CLI: Gemini 2.5 Pro, ReAct 루프, Veo 3/Deep Research 통합',
        '11개 MCP 서버: filesystem, memory, github, supabase, tavily-remote, playwright 등',
        '개발 성과: 3단계 테스트 전략 구축, 메모리 캐시 최적화, GCP Functions 3개 배포',
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

  const selectedCardData = cardData.find((card) => card.id === selectedCard) || null;

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
