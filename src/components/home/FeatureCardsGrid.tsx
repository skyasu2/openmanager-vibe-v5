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
import FeatureCardModal from '../shared/FeatureCardModal';

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
        name: 'Google Jules AI Agent',
        description:
          'GitHub 완전 연동 + 클라우드 VM 기반 대규모 자동화 에이전트',
        icon: Settings,
        color: 'bg-blue-500',
      },
      {
        name: 'GPT Codex',
        description:
          'OpenAI 코드 특화 모델 - 자연어→코드 변환, 디버깅 및 리팩토링 최적화',
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
const cardData: FeatureCard[] = [
  {
    id: 'mcp-ai-engine',
    title: 'MCP 기반 AI 엔진',
    description:
      '외부 LLM API 없이 독립 동작하는 11개 통합 엔진으로 100% 가용성 보장',
    icon: Bot,
    gradient: 'from-blue-500 via-pink-500 to-cyan-400',
    detailedContent: {
      overview:
        'MasterAIEngine v4.0으로 11개 AI 엔진을 통합 관리하는 완전 독립형 시스템입니다. AI 모델 간 컨텍스트 프로토콜(85% 신뢰도), TensorFlow.js 브라우저 ML, Simple-Statistics 고속 통계로 총 70MB 메모리, 4중 폴백 100% 가용성을 달성했습니다.',
      features: [
        '🧠 AI 모델 통합: 11개 엔진 마스터 관리, 85% 신뢰도, 200ms 응답 보장',
        '📊 TensorFlow.js v4.22: LSTM 장애 예측, 오토인코더 이상 탐지, WebGL 가속',
        '🗣️ 한국어 AI 특화: 조사 처리, 의도 분류 90%, 서버 모니터링 도메인 어휘',
      ],
      technologies: [
        '🤖 Master AI Engine v4.0: 11개 엔진 통합, 85% 신뢰도, 70MB 메모리 최적화',
        '🔗 MCP Protocol: AI 모델 간 컨텍스트 통신, 상태 동기화, 메모리 공유',
        '⚡ TensorFlow.js v4.22: LSTM 시계열 예측, WebGL 가속, 브라우저 ML 실행',
        '📊 Simple-Statistics v7.8: 10,000+/초 고속 계산, Z-score 이상탐지, 95% 정확도',
        '🧠 NLP Suite: Natural.js, Compromise.js, Fuse.js 검색, ML-Matrix 행렬연산',
        '🗣️ 한국어 전용: korean-js 형태소, hangul-js 조사, 도메인 템플릿 90% 정확도',
        '🎯 AICache 시스템: 다중 레벨 캐싱, 85% 적중률, 지연 로딩 2초 단축',
        '🔄 폴백 시스템: MCP→TensorFlow→Statistics→Hybrid 4단계, 100% 가용성',
      ],
    },
    requiresAI: true,
    isAICard: true,
  },
  {
    id: 'data-generator',
    title: '서버 데이터 생성기',
    description:
      '3가지 생성기와 베이스라인 최적화로 메모리 60%, CPU 75% 절약을 달성한 현실적 시뮬레이션 엔진',
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    detailedContent: {
      overview:
        'OptimizedDataGenerator + BaselineOptimizer + RealServerDataGenerator 3중 아키텍처로 현실적 패턴과 성능 최적화를 동시에 달성한 차세대 서버 시뮬레이션 시스템입니다.',
      features: [
        '📊 OptimizedDataGenerator v3.0: 24시간 베이스라인 + 실시간 변동으로 메모리 60% 절약',
        '🎭 RealServerDataGenerator: 환경별(개발/프로덕션) 서버 생성 + 클러스터 관리',
        '🏗️ BaselineOptimizer: 시간대별 패턴 엔진 + 서버 타입별 프로파일링',
      ],
      technologies: [
        '🔧 OptimizedDataGenerator v3.0: 24시간 베이스라인, 델타 압축, 메모리 60% 최적화',
        '🎭 RealServerDataGenerator: 환경별 서버 생성, 클러스터 관리, GPU 메트릭 지원',
        '🏗️ BaselineOptimizer: 시간대 패턴 엔진, CPU/메모리 프로파일링, 성능 예측',
        '📊 Faker.js v8.4: 현실적 데이터 생성, 지역화 지원, 커스텀 스키마 확장',
        '🚀 prom-client: Prometheus 메트릭, 레이블링, 히스토그램/게이지/카운터 지원',
        '💾 Upstash Redis: 서버리스 캐싱, 시계열 데이터, 자동 스케일링, delta-compression',
        '⚡ TimerManager: 비동기 스케줄링, 메모리 최적화, 자동 정리, 성능 모니터링',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'tech-stack',
    title: '적용 기술',
    description:
      '15개 오픈소스 웹 기술로 타입 안전성 100%, 런타임 에러 95% 감소',
    icon: Code,
    gradient: 'from-purple-500 to-indigo-600',
    detailedContent: {
      overview:
        '모던 풀스택 웹 애플리케이션의 핵심 기술들로 성능과 안정성을 극대화한 차세대 아키텍처입니다. 모든 라이브러리가 오픈소스이며 최신 웹 표준을 준수합니다.',
      features: [
        '⚛️ Next.js 15 + React 19: 최신 서버 컴포넌트와 동시성 기능으로 성능 극대화',
        '🎨 TailwindCSS + Framer Motion: 유틸리티 CSS와 선언적 애니메이션으로 개발 속도 3배 향상',
        '🔧 TypeScript + ESLint + Prettier: 타입 안전성 100%와 코드 품질 자동화',
      ],
      technologies: [
        '⚛️ Next.js 15.3.3: App Router, 서버 컴포넌트, 스트리밍 SSR, 자동 번들 최적화',
        '🔧 React 19: 동시성 렌더링, Suspense, useTransition, 자동 배칭 최적화',
        '💎 TypeScript 5.6: 타입 안전성 100%, 고급 타입 추론, 컴파일 타임 최적화',
        '🎨 TailwindCSS v4: JIT 컴파일, 커스텀 디자인 시스템, 99% CSS 압축율',
        '🎬 Framer Motion: 선언적 애니메이션, 레이아웃 애니메이션, 제스처 인식',
        '📦 Zustand (2.9KB): 경량 상태관리, TypeScript 네이티브, devtools 통합',
        '⚡ TanStack Query v5: 서버 상태 캐싱, 백그라운드 업데이트, 오프라인 지원',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'vibe-coding',
    title: 'Vibe Coding 워크플로우',
    description:
      'Cursor AI + Claude 4 Sonnet 모델을 메인으로, 하이브리드 AI 전략을 통한 혁신적 개발 방식입니다.',
    icon: Zap,
    gradient: 'from-yellow-400 via-orange-500 via-pink-500 to-purple-600',
    detailedContent: {
      overview:
        'Cursor AI를 메인 도구로, Claude 4 Sonnet 모델 선택과 3개 MCP Tools 통합으로 개발 효율성 300% 향상을 달성한 차세대 하이브리드 AI 개발 워크플로우입니다.',
      features: [
        '🎯 메인 개발 80%: Cursor AI (Claude 4 Sonnet 모델) - 200K+ 토큰 문맥 이해',
        '🧠 브레인스토밍 15%: ChatGPT (gpt codex) - 아키텍처 설계 및 창의적 문제 해결',
        '🔧 Cursor MCP Tools: filesystem, duckduckgo-search, sequential-thinking 개발 도구 통합',
      ],
      technologies: [
        '🎯 Cursor AI Editor: Claude 4 Sonnet 기반, 200K+ 토큰 컨텍스트, AI 자동완성',
        '🧠 Claude 4 Sonnet: 최대 컨텍스트 모델, 코드 이해 특화, 멀티턴 대화 지원',
        '🔍 mcp-filesystem: Cursor용 파일 탐색 도구, 코드 구조 분석, 자동 의존성 추적',
        '🌐 mcp-duckduckgo-search: Cursor용 웹 검색 도구, 최신 기술 문서, 오류 해결 지원',
        '🧠 mcp-sequential-thinking: Cursor용 사고 도구, 단계별 문제 해결, 논리 검증',
        '💭 ChatGPT-4: 브레인스토밍, 아키텍처 설계, 창의적 솔루션 도출',
        '🤖 Google Jules: GitHub 연동, 클라우드 VM 자동화, 대규모 작업 처리',
        '🔄 하이브리드 전략: 상황별 AI 선택, 워크플로우 최적화, 효율성 극대화',
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

      {/* Feature Card Modal */}
      <FeatureCardModal
        selectedCard={selectedCardData || null}
        onClose={closeModal}
        renderTextWithAIGradient={renderTextWithAIGradient}
        analyzedTechStack={analyzedTechStack}
        modalRef={modalRef}
        variant='home'
      />

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
