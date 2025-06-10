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

// 🎨 통합 카드 디자인 시스템
const cardDesignSystem = {
  // 공통 기본 스타일
  baseClasses:
    'p-4 rounded-2xl shadow-lg min-h-[200px] text-white relative overflow-hidden hover:scale-[1.02] transition-transform duration-300 ease-in-out cursor-pointer',

  // 카드별 특화 그라데이션
  gradients: {
    ai: 'bg-gradient-to-br from-[#a18cd1] to-[#fbc2eb]', // 보라 → 핑크 (AI 시스템)
    aiAgent: 'bg-gradient-to-br from-blue-500 to-indigo-600', // 푸른색 계열 (AI 에이전트)
    realtime: 'bg-gradient-to-br from-cyan-500 to-emerald-600', // 청록 → 초록 (실시간 데이터)
    tech: 'bg-gradient-to-br from-indigo-700 to-violet-600', // 남색 → 보라 (기술 스택)
    vibe: 'bg-gradient-to-br from-orange-500 to-yellow-400', // 황금색 계열 (바이브 코딩)
    monitoring: 'bg-gradient-to-br from-emerald-600 to-teal-500', // 초록 계열 (모니터링)
    security: 'bg-gradient-to-br from-red-500 to-pink-500', // 빨강 계열 (보안)
  },

  // 아이콘 스타일
  iconContainer: 'absolute top-4 left-4 text-3xl mb-2 opacity-90',

  // 텍스트 스타일
  title: 'font-bold text-lg mb-2 pl-12', // 아이콘 공간 확보
  description: 'text-sm text-white/90 leading-relaxed pl-12',
};

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

// 🎨 리팩토링된 카드 데이터
const featureCards: FeatureCard[] = [
  {
    id: 'ai-unified-system',
    title: '🧠 통합 AI 시스템',
    description:
      '서버 상태를 한국어로 질문하세요! "CPU 높은 서버는?" → 즉시 분석 결과 제공. 장애 시 자동 보고서 생성',
    icon: Brain,
    gradient: cardDesignSystem.gradients.ai,
    detailedContent: {
      overview:
        '완전 독립 동작하는 AI 엔진으로, 별도 API 키 없이도 서버 모니터링과 분석이 가능합니다.',
      features: [
        '🔍 한국어 자연어 처리 (형태소 분석)',
        '📊 실시간 서버 상태 분석',
        '🚨 자동 장애 감지 및 보고서 생성',
        '💡 AI 기반 최적화 제안',
        '🎯 컨텍스트 기반 패턴 인식',
      ],
      technologies: ['MCP SDK', 'TensorFlow.js', 'Natural NLP', 'Korean AI'],
    },
    requiresAI: false,
    isAICard: true,
  },
  {
    id: 'ai-agent',
    title: '🤖 AI 에이전트',
    description:
      '독립 모드로 동작하는 AI 에이전트. 서버 상태 질문, 장애 분석, 최적화 제안을 자동으로 수행합니다.',
    icon: Bot,
    gradient: cardDesignSystem.gradients.aiAgent,
    detailedContent: {
      overview:
        'AI 에이전트는 독립적으로 동작하며 서버 시스템과 연동하여 지능적인 분석을 제공합니다.',
      features: [
        '🧠 독립 모드 AI 추론',
        '🔄 실시간 상태 모니터링',
        '📈 예측적 분석',
        '🎯 자동 최적화 제안',
        '🚨 프로액티브 알림',
      ],
      technologies: ['MCP Protocol', 'Machine Learning', 'Pattern Recognition'],
    },
    requiresAI: true,
    isAICard: true,
  },
  {
    id: 'realtime-data',
    title: '📊 실시간 서버 데이터 생성기',
    description:
      '실제 서버처럼 동작하는 데이터를 자동 생성. 업무 시간↑/야간↓ 패턴, 장애 시뮬레이션, 환경별 최적화',
    icon: Activity,
    gradient: cardDesignSystem.gradients.realtime,
    detailedContent: {
      overview:
        '실제 운영 환경을 시뮬레이션하는 지능적 데이터 생성 시스템입니다.',
      features: [
        '⏰ 시간대별 트래픽 패턴',
        '🔥 장애 상황 시뮬레이션',
        '📈 부하 테스트 데이터',
        '🌍 지역별 서버 특성',
        '🎯 실시간 메트릭 생성',
      ],
      technologies: ['Faker.js', 'Statistics Engine', 'Time Series'],
    },
    requiresAI: false,
  },
  {
    id: 'tech-stack',
    title: '💻 적용 기술',
    description:
      'Next.js 15 + TypeScript로 안정성 확보. Vercel 배포, TailwindCSS 디자인, 모든 코드 타입 안전성 100%',
    icon: Code,
    gradient: cardDesignSystem.gradients.tech,
    detailedContent: {
      overview:
        '최신 웹 기술 스택으로 구축된 안정적이고 확장 가능한 아키텍처입니다.',
      features: [
        '⚡ Next.js 15 App Router',
        '🔒 TypeScript 100% 적용',
        '🎨 TailwindCSS + Framer Motion',
        '☁️ Vercel 서버리스 배포',
        '🗄️ Supabase + Redis 데이터베이스',
      ],
      technologies: [
        'Next.js',
        'TypeScript',
        'TailwindCSS',
        'Vercel',
        'Supabase',
      ],
    },
    requiresAI: false,
  },
  {
    id: 'vibe-coding',
    title: '✨ 바이브 코딩',
    description:
      'AI와 함께하는 직관적 개발 경험. 실시간 코드 분석, 자동 최적화 제안, 그리고 개발자 친화적 인터페이스',
    icon: Sparkles,
    gradient: cardDesignSystem.gradients.vibe,
    detailedContent: {
      overview: 'AI가 개발 과정을 돕는 혁신적인 코딩 경험을 제공합니다.',
      features: [
        '🎯 실시간 코드 분석',
        '💡 AI 기반 최적화 제안',
        '🔄 자동 리팩토링',
        '📝 스마트 문서화',
        '🚀 성능 최적화 가이드',
      ],
      technologies: [
        'AI Code Analysis',
        'Pattern Recognition',
        'Auto Optimization',
      ],
    },
    requiresAI: true,
    isVibeCard: true,
  },
  {
    id: 'monitoring',
    title: '📈 고급 모니터링',
    description:
      '실시간 서버 상태 추적, 성능 메트릭 분석, 예측적 알림 시스템으로 안정적인 서비스 운영을 보장합니다.',
    icon: BarChart3,
    gradient: cardDesignSystem.gradients.monitoring,
    detailedContent: {
      overview:
        '종합적인 서버 모니터링과 성능 분석을 통해 서비스 안정성을 확보합니다.',
      features: [
        '📊 실시간 메트릭 대시보드',
        '🔔 지능형 알림 시스템',
        '📈 성능 트렌드 분석',
        '🎯 예측적 장애 감지',
        '📋 자동 보고서 생성',
      ],
      technologies: [
        'Prometheus',
        'Grafana',
        'Alert Manager',
        'Time Series DB',
      ],
    },
    requiresAI: false,
  },
];

export default function FeatureCardsGrid() {
  const [selectedCard, setSelectedCard] = useState<FeatureCard | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [, setTechStack] = useState(analyzeTechStack([]));
  const modalRef = useRef<HTMLDivElement>(null);
  const { aiAgent } = useUnifiedAdminStore();
  const { info } = useToast();

  // 다크모드 감지
  useEffect(() => {
    const checkDarkMode = () => {
      const htmlElement = document.documentElement;
      const isDark =
        htmlElement.classList.contains('dark') ||
        htmlElement.style.background?.includes('rgb(15, 23, 42)') ||
        document.body.style.background?.includes('rgb(15, 23, 42)');
      setIsDarkMode(isDark);
    };

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, []);

  // 모달 외부 클릭 처리
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        closeModal();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
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
    const card = featureCards.find(c => c.id === cardId);
    if (!card) return;

    // AI 관련 카드이지만 AI가 비활성화된 경우
    if (card.requiresAI && !aiAgent.isEnabled) {
      info('🤖 이 기능을 사용하려면 먼저 AI 에이전트를 활성화해주세요!');
      return;
    }

    setSelectedCard(card);

    // 기술스택 업데이트
    setTimeout(() => {
      setTechStack(analyzeTechStack([]));
    }, 100);
  };

  const closeModal = () => {
    setSelectedCard(null);
  };

  // AI 그라데이션 텍스트 렌더링
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
      {/* 🎨 리팩토링된 카드 그리드 */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12'>
        {featureCards.map((card, index) => (
          <motion.div
            key={card.id}
            className={`${cardDesignSystem.baseClasses} ${card.gradient}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            onClick={() => handleCardClick(card.id)}
            whileHover={{
              scale: 1.02,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* 아이콘 */}
            <div className={cardDesignSystem.iconContainer}>
              {typeof card.icon === 'string' ? (
                <span>{card.icon}</span>
              ) : (
                <card.icon className='w-8 h-8' />
              )}
            </div>

            {/* 제목 */}
            <h3 className={cardDesignSystem.title}>
              {card.isAICard
                ? renderTextWithAIGradient(card.title)
                : card.title}
            </h3>

            {/* 설명 */}
            <p className={cardDesignSystem.description}>{card.description}</p>

            {/* AI 요구사항 배지 */}
            {card.requiresAI && (
              <div className='absolute top-4 right-4'>
                <motion.div
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    aiAgent.isEnabled
                      ? 'bg-green-500/20 text-green-200 border border-green-400/30'
                      : 'bg-yellow-500/20 text-yellow-200 border border-yellow-400/30'
                  }`}
                  animate={
                    !aiAgent.isEnabled
                      ? {
                          scale: [1, 1.05, 1],
                          opacity: [0.7, 1, 0.7],
                        }
                      : {}
                  }
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {aiAgent.isEnabled ? '✅ AI' : '🤖 AI 필요'}
                </motion.div>
              </div>
            )}

            {/* 특별 배지 */}
            {card.isSpecial && (
              <div className='absolute bottom-4 right-4'>
                <motion.div
                  className='text-yellow-400'
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  ⭐
                </motion.div>
              </div>
            )}

            {/* Vibe 카드 특별 효과 */}
            {card.isVibeCard && (
              <motion.div
                className='absolute inset-0 pointer-events-none'
                animate={{
                  background: [
                    'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                    'radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                    'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* 기존 모달 코드 유지 */}
      <AnimatePresence>
        {selectedCard && (
          <FeatureCardModal
            selectedCard={selectedCard}
            modalRef={modalRef}
            isDarkMode={isDarkMode}
            onClose={closeModal}
            renderTextWithAIGradient={renderTextWithAIGradient}
            variant='home'
          />
        )}
      </AnimatePresence>
    </>
  );
}
