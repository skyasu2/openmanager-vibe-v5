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
  Clock,
} from 'lucide-react';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useToast } from '@/components/ui/ToastNotification';
import TechStackDisplay from '@/components/ui/TechStackDisplay';
import { analyzeTechStack } from '@/utils/TechStackAnalyzer';
import FeatureCardModal from '../shared/FeatureCardModal';
import DateUtils from '@/utils/DateUtils';

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
  'data-generator': ['data-storage', 'monitoring'],
  'tech-stack': ['frontend', 'visualization'],
  'vibe-coding': ['mcp-integration', 'ai-development', 'development'],
};

// 버전 관리 시스템
const COMPONENT_VERSIONS = {
  'mcp-ai-engine': '2.1.0', // MCP + RAG 백업 엔진 통합
  'data-generator': '3.0.1', // 5개 모듈 통합 + 성능 최적화
  'tech-stack': '1.5.0',
  'vibe-coding': '2.0.0', // GitHub + Vercel 배포 통합
} as const;

// 버전 히스토리 추적 (올바른 프로젝트 타임라인)
const VERSION_HISTORY = {
  'mcp-ai-engine': [
    {
      version: '2.1.0',
      date: DateUtils.getVersionDate('2.1.0'),
      changes:
        'MCP + RAG TensorFlow 백업 엔진 통합, Bot 아이콘 회전 애니메이션',
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
  'data-generator': [
    {
      version: '3.0.1',
      date: DateUtils.getVersionDate('3.0.1'),
      changes: '코드베이스 분석 기반 문서 갱신, 5개 모듈 통합 구조 완성',
    },
    {
      version: '3.0.0',
      date: DateUtils.getVersionDate('3.0.0'),
      changes: '5개 모듈 통합 아키텍처, 환경별 3단계 모드, 극한 성능 최적화',
    },
    {
      version: '2.5.0',
      date: DateUtils.getVersionDate('2.5.0'),
      changes: '베이스라인 최적화 + 실시간 델타 시스템',
    },
    {
      version: '2.0.0',
      date: DateUtils.getVersionDate('2.0.0'),
      changes: 'OptimizedDataGenerator 도입',
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
      overview: `v${COMPONENT_VERSIONS['mcp-ai-engine']} - MCP(Model Context Protocol) 기반 AI 엔진과 TensorFlow.js RAG 백업 시스템으로 구성된 서버 모니터링 전용 AI입니다. 서버 상태 패턴 분석, 자연어 문의응답, 자동 장애보고서 생성 등 서버 관리에 특화된 지능형 기능을 제공합니다.`,
      features: [
        '🎯 MCP 컨텍스트 추론: 서버 상태 패턴 학습 및 예측 분석',
        '🤖 자연어 서버 질의: "CPU 사용률이 높은 서버는?" 같은 자연어 명령 처리',
        '📋 자동 장애보고서: 시스템 이상 감지 시 상세 보고서 자동 생성',
        '🔄 RAG 백업 엔진: MCP 실패 시 TensorFlow.js 기반 자동 폴백',
        '🌐 하이브리드 배포: MCP는 Render, RAG는 Vercel 서버리스',
        '🧠 벡터 DB 검색: Supabase pgvector + 로컬 메모리 이중 검색',
        '📊 한국어 NLP: hangul-js + korean-utils로 한국어 서버 로그 분석',
      ],
      technologies: [
        '🧠 MCP AI Server: Model Context Protocol 기반 컨텍스트 추론 엔진',
        '📚 RAG Backup Engine: TensorFlow.js + Natural + Fuse.js 백업 시스템',
        '🔗 @modelcontextprotocol/sdk: AI 에이전트 간 표준 통신 프로토콜',
        '🧮 @tensorflow/tfjs: 브라우저 머신러닝 추론 + 벡터 임베딩',
        '🔍 @xenova/transformers: 사전훈련 BERT/DistilBERT 모델 활용',
        '📊 PostgresVectorDB: Supabase pgvector 확장을 활용한 벡터 검색',
        '💾 LocalVectorDB: 메모리 기반 빠른 벡터 검색 캐시',
        '🇰🇷 hangul-js + korean-utils: 한국어 서버 로그 형태소 분석',
      ],
    },
    requiresAI: true,
    isAICard: true,
  },
  {
    id: 'data-generator',
    title: '📊 실시간 서버 데이터 생성기',
    description:
      '🔄 실제 서버처럼 동작하는 데이터를 자동 생성. 업무시간↑/야간↓ 패턴, 장애 시뮬레이션, 환경별 최적화',
    icon: Database,
    gradient: 'from-emerald-500 to-teal-600',
    detailedContent: {
      overview: `v${COMPONENT_VERSIONS['data-generator']} - 실제 서버 환경을 시뮬레이션하는 차세대 데이터 생성 시스템입니다. 환경별 자동 최적화, 24시간 베이스라인 + 실시간 델타 방식으로 극한의 성능 최적화를 달성했으며, 다양한 서버 아키텍처와 장애 시나리오를 지원합니다.`,
      features: [
        '🎯 환경별 자동 최적화: Local(50서버,5초) → Premium(20서버,10초) → Basic(6서버,15초)',
        '📊 24시간 베이스라인: 1440개 데이터포인트 미리 생성, 실시간은 델타만 계산',
        '⚡ 극한 성능 최적화: 메모리 97%→75%, CPU 75% 절약, 응답시간 50% 단축',
        '🏗️ 4가지 아키텍처: Single/Master-Slave/Load-Balanced/Microservices',
        '🎭 5가지 시뮬레이션: Normal/HighLoad/Maintenance/Incident/Scaling',
        '🌐 Prometheus 호환: 표준 메트릭 포맷으로 모니터링 도구 연동',
        '💾 Redis 캐싱: Upstash 서버리스 Redis로 데이터 지속성 보장',
      ],
      technologies: [
        '🎰 RealServerDataGenerator v3.0: 환경별 3단계 모드, 공용 환경 감지',
        '⚡ OptimizedDataGenerator v3.0: 24시간 베이스라인 + 실시간 델타',
        '📊 BaselineOptimizer: 시간대별 패턴 + 서버 역할별 프로파일링',
        '🔧 TimerManager: 타이머 통합 관리, CPU 75% 절약, 충돌 방지',
        '💾 MemoryOptimizer: 자동 GC, 캐시 정리, 메모리 최적화',
        '📈 Faker.js: 현실적인 서버 데이터 생성 (이름, 로그, 메트릭)',
        '🌐 Prometheus Client: 메트릭 수집, 히스토그램/게이지/카운터',
        '💾 Upstash Redis: 서버리스 Redis 캐싱, Vercel 완벽 호환',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'tech-stack',
    title: '⚡ 적용 기술',
    description:
      '💻 Next.js 15 + TypeScript로 안정성 확보. Vercel 배포, TailwindCSS 디자인, 모든 코드 타입 안전성 100%',
    icon: Code,
    gradient: 'from-purple-500 to-indigo-600',
    detailedContent: {
      overview:
        '모던 풀스택 웹 애플리케이션의 핵심 기술들로 성능과 안정성을 극대화한 차세대 프론트엔드 아키텍처입니다. 모든 라이브러리가 오픈소스이며 최신 웹 표준을 준수하여 개발 생산성과 사용자 경험을 동시에 향상시킵니다.',
      features: [
        '⚛️ Next.js 15 + React 19: 최신 서버 컴포넌트와 스트리밍 SSR로 성능 극대화',
        '🎨 TailwindCSS + Framer Motion: 유틸리티 CSS와 선언적 애니메이션',
        '🔧 TypeScript + Zustand: 타입 안전성 100%와 경량 상태관리',
        '📊 Supabase + Redis: PostgreSQL 실시간 DB + 서버리스 캐싱',
        '🧪 Vitest + Playwright: 빠른 단위 테스트 + E2E 자동화',
        '📈 Chart.js + Recharts: 반응형 데이터 시각화',
        '✨ ESLint + Prettier: 코드 품질 자동화와 일관된 스타일',
      ],
      technologies: [
        '⚛️ Next.js 15.3.3: React 19 기반 풀스택 프레임워크',
        '🎨 Tailwind CSS 3.4: 유틸리티 퍼스트 CSS 프레임워크',
        '🔧 TypeScript 5.6: 정적 타입 검사 및 IDE 지원',
        '🌊 Framer Motion 11: 선언적 React 애니메이션 라이브러리',
        '🗄️ Zustand 4.5: 경량 React 상태 관리 라이브러리',
        '📊 Supabase: PostgreSQL 기반 실시간 데이터베이스',
        '⚡ Upstash Redis: 서버리스 Redis 캐싱 서비스',
        '🧪 Vitest: 빠른 단위 테스트 프레임워크',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'vibe-coding',
    title: '🎯 바이브 코딩',
    description:
      '🤖 AI가 80% 코딩! Cursor + Claude 4로 자연어 명령만으로 코드 생성. GitHub 590+ 커밋, 자동 배포까지',
    icon: Zap,
    gradient: 'from-yellow-400 via-orange-500 via-pink-500 to-purple-600',
    detailedContent: {
      overview:
        'Cursor AI + Claude 4 Sonnet을 중심으로 한 차세대 AI 개발 워크플로우입니다. 3개 MCP 도구로 200K+ 토큰 컨텍스트를 활용한 AI 개발부터 GitHub 협업, Vercel/Render 자동 배포까지 완전한 개발 생태계를 구축했습니다.',
      features: [
        '🎯 AI 개발 80%: Cursor AI + Claude 4 Sonnet으로 200K+ 토큰 컨텍스트 활용',
        '🔍 3개 MCP 도구: filesystem, web-search, sequential-thinking으로 개발 효율 극대화',
        '📱 GitHub 완전 통합: 590+ 커밋, 자동 PR, 이슈 추적, 코드 리뷰',
        '🚀 자동 배포: Vercel(웹앱) + Render(MCP 서버) 멀티 플랫폼',
        '🔄 CI/CD 파이프라인: GitHub Actions로 테스트, 빌드, 배포 자동화',
        '💡 브레인스토밍: ChatGPT + GPT Codex로 아키텍처 설계',
        '🤖 대규모 자동화: Google Jules AI Agent로 VM 기반 작업',
      ],
      technologies: [
        '🎯 Cursor AI Editor: Claude 4 Sonnet 통합 AI 코딩 환경',
        '🧠 Claude 4 Sonnet: 200K 토큰 컨텍스트 지원 고성능 AI',
        '🔧 MCP Protocol: 3개 도구로 개발 워크플로우 최적화',
        '📱 GitHub: 590+ 커밋, 이슈 관리, 자동 PR',
        '🚀 Vercel: Next.js 앱 자동 배포 및 Edge Functions',
        '🌐 Render: MCP 서버 및 백엔드 서비스 배포',
        '⚙️ GitHub Actions: CI/CD 파이프라인 자동화',
        '💡 ChatGPT: 아키텍처 설계 및 브레인스토밍',
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
  const modalRef = useRef<HTMLDivElement>(null);

  const { aiAgent } = useUnifiedAdminStore();
  const { warning } = useToast();

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

              {/* 바이브 코딩 카드 4색 그라데이션 애니메이션 개선 - landing + home 버전 통합 */}
              {card.isVibeCard && (
                <motion.div
                  className='absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-orange-500/20 via-pink-500/20 to-purple-600/20 rounded-2xl'
                  animate={{
                    background: [
                      'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(249,115,22,0.2) 25%, rgba(236,72,153,0.2) 75%, rgba(147,51,234,0.2) 100%)',
                      'linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(236,72,153,0.2) 25%, rgba(147,51,234,0.2) 75%, rgba(251,191,36,0.2) 100%)',
                      'linear-gradient(135deg, rgba(236,72,153,0.2) 0%, rgba(147,51,234,0.2) 25%, rgba(251,191,36,0.2) 75%, rgba(249,115,22,0.2) 100%)',
                      'linear-gradient(135deg, rgba(147,51,234,0.2) 0%, rgba(251,191,36,0.2) 25%, rgba(249,115,22,0.2) 75%, rgba(236,72,153,0.2) 100%)',
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}

              {/* 아이콘 - landing 버전의 개선된 애니메이션 통합 */}
              <div
                className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 relative z-10 ${
                  card.isAICard ? 'shadow-lg shadow-pink-500/25' : ''
                } ${card.isVibeCard ? 'shadow-lg shadow-yellow-500/25' : ''}`}
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
                    <card.icon className='w-6 h-6 text-white' />
                  </motion.div>
                ) : (
                  <card.icon className='w-6 h-6 text-white' />
                )}
              </div>

              {/* 컨텐츠 */}
              <div className='relative z-10'>
                <h3
                  className={`text-lg font-bold mb-2 transition-colors leading-tight ${
                    isDarkMode
                      ? 'text-white group-hover:text-white'
                      : 'text-white group-hover:text-gray-100'
                  }`}
                  style={{
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontWeight: 600,
                    lineHeight: 1.4,
                  }}
                >
                  {renderTextWithAIGradient(card.title)}
                </h3>
                <p
                  className={`text-xs leading-relaxed transition-colors ${
                    isDarkMode
                      ? 'text-white/70 group-hover:text-white/90'
                      : 'text-white/90 group-hover:text-white'
                  }`}
                  style={{
                    color: 'rgba(255, 255, 255, 0.80)',
                    lineHeight: 1.5,
                    fontWeight: 500,
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
        modalRef={modalRef}
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
