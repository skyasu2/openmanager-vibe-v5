'use client';

import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Bot,
  Brain,
  Code,
  Cpu,
  Database,
  Globe,
  Monitor,
  Network,
  Palette,
  Settings,
  Shield,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
// 토스트 알림 제거됨
import FeatureCardModal from '@/components/shared/FeatureCardModal';
import { DateUtils } from '@/utils/DateUtils';
import { analyzeTechStack } from '@/utils/TechStackAnalyzer';

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
  'mcp-ai-system': {
    title: '🧠 MCP AI System (Render 배포)',
    icon: Brain,
    color: 'from-purple-500 to-indigo-500',
    techs: [
      {
        name: 'MCP AI Server',
        description: '컨텍스트 기반 패턴 대응 AI (Render 배포)',
        icon: Brain,
        color: 'bg-purple-600',
      },
      {
        name: '@modelcontextprotocol/sdk',
        description: 'Model Context Protocol 표준 구현',
        icon: Network,
        color: 'bg-indigo-600',
      },
    ],
  },
  'rag-backup-engine': {
    title: '🔄 RAG Backup Engine (Vercel 서버리스)',
    icon: Shield,
    color: 'from-emerald-500 to-teal-500',
    techs: [
      {
        name: '@tensorflow/tfjs',
        description: 'RAG 백업 엔진 - ML 추론',
        icon: Cpu,
        color: 'bg-orange-600',
      },
      {
        name: 'simple-statistics',
        description: 'RAG 백업 엔진 - 통계 분석',
        icon: BarChart3,
        color: 'bg-emerald-600',
      },
      {
        name: 'natural',
        description: 'RAG 백업 엔진 - 자연어 처리',
        icon: Globe,
        color: 'bg-green-600',
      },
      {
        name: 'fuse.js',
        description: 'RAG 백업 엔진 - 문서 검색',
        icon: Database,
        color: 'bg-teal-600',
      },
    ],
  },
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
        name: 'custom-korean-ai',
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
  'mcp-ai-engine': ['mcp-ai-system', 'rag-backup-engine'],
  'fullstack-ecosystem': ['frontend', 'data-storage', 'monitoring'],
  'tech-stack': ['frontend', 'visualization'],
  'cursor-ai': ['mcp-integration', 'ai-development', 'development'],
};

// 버전 관리 시스템 - v5.44.0 기준 업데이트
const COMPONENT_VERSIONS = {
  'mcp-ai-engine': '5.44.0', // TensorFlow 제거, 경량 ML 통합 완료
  'fullstack-ecosystem': '5.44.0', // Next.js 15.3.2 + React 19.1.0 완성
  'tech-stack': '5.44.0', // 최신 기술 스택 완전 구현
  'cursor-ai': '5.44.0', // Claude Sonnet 3.7 + MCP 통합 완료
} as const;

// 버전 히스토리 추적 (v5.44.0 현재 상태)
const VERSION_HISTORY = {
  'mcp-ai-engine': [
    {
      version: '5.44.0',
      date: DateUtils.getVersionDate('5.44.0'),
      changes:
        'TensorFlow 완전 제거, 경량 ML 엔진 통합, LocalRAG 독립화, Google AI Studio 베타 연동',
    },
    {
      version: '5.43.0',
      date: DateUtils.getVersionDate('5.43.0'),
      changes: 'AI 아키텍처 완전 리팩토링, 서버리스 최적화',
    },
    {
      version: '2.1.0',
      date: DateUtils.getVersionDate('2.1.0'),
      changes: 'MCP + RAG 백업 엔진 통합, Bot 아이콘 회전 애니메이션',
    },
    {
      version: '2.0.0',
      date: DateUtils.getVersionDate('2.0.0'),
      changes: 'MCP 컨텍스트 기반 패턴 대응 AI + RAG 백업 엔진 이중 구조',
    },
    {
      version: '1.0.0',
      date: DateUtils.getVersionDate('1.0.0'),
      changes: '초기 AI 엔진 구현',
    },
  ],
  'fullstack-ecosystem': [
    {
      version: '5.44.0',
      date: DateUtils.getVersionDate('5.44.0'),
      changes:
        'Next.js 15.3.2 + React 19.1.0 완성, Upstash Redis 연동, 완전한 풀스택 생태계 구축',
    },
    {
      version: '1.0.0',
      date: DateUtils.getVersionDate('1.0.0'),
      changes:
        '풀스택 개발 생태계 구축 - 프론트엔드, 백엔드, AI 엔진, 배포 인프라 통합',
    },
  ],
  'tech-stack': [
    {
      version: '5.44.0',
      date: DateUtils.getVersionDate('5.44.0'),
      changes:
        'Next.js 15.3.2, React 19.1.0, TypeScript 최신화, Vitest + Playwright 테스트 완성',
    },
  ],
  'cursor-ai': [
    {
      version: '5.44.0',
      date: DateUtils.getVersionDate('5.44.0'),
      changes:
        'Claude Sonnet 3.7 통합, MCP Protocol 완전 구현, GitHub Actions CI/CD 완성',
    },
    {
      version: '2.0.0',
      date: DateUtils.getVersionDate('2.0.0'),
      changes: 'GitHub + Vercel 배포 통합',
    },
  ],
} as const;

// 카드 데이터
const cardData: FeatureCard[] = [
  {
    id: 'mcp-ai-engine',
    title: '🧠 통합 AI 시스템',
    description:
      '📊 서버 상태를 한국어로 질문하세요! "CPU 높은 서버는?" → 즉시 분석 결과 제공. 장애 시 자동 보고서 생성',
    icon: Bot,
    gradient: 'from-purple-500 via-indigo-500 to-cyan-400',
    detailedContent: {
      overview: `v${COMPONENT_VERSIONS['mcp-ai-engine']} - MCP(Model Context Protocol) 기반 AI 엔진과 경량 ML 백업 시스템으로 구성된 서버 모니터링 전용 AI입니다.`,
      features: [
        '🎯 MCP 컨텍스트 추론: 서버 상태 패턴 학습 및 예측 분석',
        '🤖 자연어 서버 질의: "CPU 사용률이 높은 서버는?" 같은 자연어 명령 처리',
        '📋 자동 장애보고서: 시스템 이상 감지 시 상세 보고서 자동 생성',
        '🔄 경량 ML 백업: MCP 실패 시 경량 ML 엔진 기반 자동 폴백',
        '🌐 하이브리드 배포: MCP는 Render, RAG는 Vercel 서버리스',
        '🧠 벡터 DB 검색: Supabase pgvector + 로컬 메모리 이중 검색',
        '📊 한국어 NLP: hangul-js + korean-utils로 한국어 서버 로그 분석',
      ],
      technologies: [
        'MCP AI Server',
        'LocalRAG Engine',
        'Lightweight ML',
        'Google AI Studio',
        'Vector Database',
        'Korean NLP',
        'Hybrid Deployment',
      ],
    },
    requiresAI: true,
    isAICard: true,
  },
  {
    id: 'fullstack-ecosystem',
    title: '🚀 풀스택 개발 생태계',
    description:
      '프론트엔드, 백엔드, AI 엔진, 배포 인프라까지. 실시간 데이터 생성과 시연을 위한 완전한 개발 환경 구축',
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    detailedContent: {
      overview: `완전한 풀스택 개발 생태계로 프론트엔드부터 배포 인프라까지 모든 레이어를 통합한 현대적 개발 환경입니다.`,
      features: [
        '🎨 프론트엔드: Next.js 15.3.2 + React 19.1.0 + TypeScript로 현대적 UI/UX',
        '⚡ 백엔드: Serverless API + Edge Functions로 확장 가능한 아키텍처',
        '🤖 AI 엔진: 멀티 AI 통합으로 지능형 서비스 제공',
        '🌐 배포 인프라: Vercel + Render 멀티 클라우드 전략',
        '📊 실시간 데이터: 현실적인 서버 메트릭과 시뮬레이션',
        '🔒 보안: 환경변수 암호화, API 키 관리, 접근 제어',
        '🧪 테스트: 단위 테스트 + 통합 테스트 + E2E 자동화',
      ],
      technologies: [
        'Next.js 15.3.2',
        'React 19.1.0',
        'TypeScript',
        'Serverless APIs',
        'Vercel Deployment',
        'Render Hosting',
        'CI/CD Pipeline',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'tech-stack',
    title: '⚡ 적용 기술',
    description:
      '💻 Next.js 15.3.2 + TypeScript로 안정성 확보. Vercel 배포, TailwindCSS 디자인, 모든 코드 타입 안전성 100%',
    icon: Code,
    gradient: 'from-purple-500 to-indigo-600',
    detailedContent: {
      overview:
        '모던 풀스택 웹 애플리케이션의 핵심 기술들로 성능과 안정성을 극대화한 차세대 프론트엔드 아키텍처입니다.',
      features: [
        '⚛️ Next.js 15.3.2 + React 19.1.0: 최신 서버 컴포넌트와 스트리밍 SSR로 성능 극대화',
        '🎨 TailwindCSS + Framer Motion: 유틸리티 CSS와 선언적 애니메이션',
        '🔧 TypeScript + Zustand: 타입 안전성 100%와 경량 상태관리',
        '📊 Supabase + Upstash Redis: PostgreSQL 실시간 DB + 서버리스 캐싱',
        '🧪 Vitest + Playwright: 빠른 단위 테스트 + E2E 자동화',
        '📈 Chart.js + Recharts: 반응형 데이터 시각화',
        '✨ ESLint + Prettier: 코드 품질 자동화와 일관된 스타일',
      ],
      technologies: [
        'Next.js 15.3.2',
        'React 19.1.0',
        'TypeScript',
        'TailwindCSS',
        'Framer Motion',
        'Supabase',
        'Upstash Redis',
        'Testing Suite',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'cursor-ai',
    title: '🔥 Vibe Coding',
    description:
      '🎯 AI 주도 코딩으로 개발자 워크플로우를 혁신. Cursor + Claude Sonnet 3.7로 자연어 명령만으로 고품질 코드 생성, 자동 배포까지',
    icon: Zap,
    gradient: 'from-amber-600 via-orange-600 to-amber-700',
    detailedContent: {
      overview:
        'Cursor AI + Claude Sonnet 3.7을 중심으로 한 차세대 AI 개발 워크플로우입니다. MCP 도구들과 함께 자연어 명령으로 코드를 생성하고, GitHub 협업부터 자동 배포까지 완전한 개발 생태계를 구축합니다.',
      features: [
        '🎯 AI 주도 개발: Cursor AI + Claude Sonnet 3.7로 자연어 기반 코딩',
        '🔍 MCP 도구 활용: filesystem, web-search, sequential-thinking으로 개발 효율 극대화',
        '📱 GitHub 완전 통합: 자동 커밋, PR 생성, 이슈 추적, 코드 리뷰',
        '🚀 자동 배포: Vercel(웹앱) + Render(백엔드) 멀티 플랫폼 배포',
        '🔄 CI/CD 파이프라인: GitHub Actions로 테스트, 빌드, 배포 자동화',
        '💡 AI 브레인스토밍: 아키텍처 설계와 문제 해결 지원',
        '🤖 워크플로우 자동화: 반복 작업의 지능적 처리',
      ],
      technologies: [
        'Cursor AI',
        'Claude Sonnet 3.7',
        'MCP Protocol',
        'GitHub Integration',
        'Auto Deployment',
        'CI/CD Pipeline',
        'AI Workflow',
      ],
    },
    requiresAI: false,
    isVibeCard: true,
    isSpecial: true,
  },
];

export default function FeatureCardsGrid() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showDevModal, setShowDevModal] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const { aiAgent, adminMode, logoutAdmin } = useUnifiedAdminStore();

  // 다크모드 상태를 페이지에서 가져오기 (page.tsx에서 사용하는 것과 동일한 로직)
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // 페이지의 다크모드 상태와 동기화
    const checkDarkMode = () => {
      const body = document.body;
      const isDark =
        body.classList.contains('dark') ||
        document.documentElement.style.background?.includes(
          'rgb(15, 23, 42)'
        ) ||
        window.getComputedStyle(body).background?.includes('rgb(15, 23, 42)');
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // 다크모드 변경 감지를 위한 MutationObserver
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, []);

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
              className={`relative p-4 ${
                isDarkMode
                  ? 'bg-white/10 hover:bg-white/20 border-white/25'
                  : 'bg-gray-900/90 hover:bg-gray-900/95 border-gray-200/50'
              } backdrop-blur-sm border rounded-2xl transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) h-full ${
                card.isSpecial
                  ? isDarkMode
                    ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30'
                    : 'bg-gradient-to-br from-amber-100/90 to-orange-100/90 border-amber-300/50'
                  : ''
              } group-hover:transform group-hover:scale-[1.02] group-hover:shadow-2xl`}
            >
              {/* 그라데이션 배경 */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} ${
                  isDarkMode
                    ? 'opacity-0 group-hover:opacity-10'
                    : 'opacity-0 group-hover:opacity-15'
                } rounded-2xl transition-opacity duration-300`}
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
                      : isDarkMode
                        ? 'text-white group-hover:text-white'
                        : 'text-white group-hover:text-gray-100'
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
                      : isDarkMode
                        ? 'text-white/70 group-hover:text-white/90'
                        : 'text-white/90 group-hover:text-white'
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

      {/* 개발과정 버튼 - 관리자 모드일 때만 표시 */}
      {adminMode.isAuthenticated && (
        <div className='mt-12 flex justify-center'>
          <Link
            href='/about'
            onClick={() => {
              // 클릭 시 자동으로 관리자 권한 해제
              logoutAdmin();
              console.log('🔓 개발과정 페이지 접근 - 관리자 권한 자동 해제');
            }}
            className={`group relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 overflow-hidden ${
              isDarkMode
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-600/25'
            } hover:scale-105 hover:shadow-xl`}
          >
            <span className='relative z-10 flex items-center gap-2'>
              🔧 개발과정 보기
            </span>
          </Link>
        </div>
      )}

      {/* Feature Card Modal */}
      <FeatureCardModal
        selectedCard={selectedCardData}
        onClose={closeModal}
        renderTextWithAIGradient={renderTextWithAIGradient}
        modalRef={modalRef as React.RefObject<HTMLDivElement>}
        variant='home'
        isDarkMode={isDarkMode}
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
