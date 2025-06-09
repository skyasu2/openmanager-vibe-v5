'use client';

import React, { useEffect, useState } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import {
  X,
  ExternalLink,
  Star,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle,
  Zap,
  Copy,
  Download,
  Share,
} from 'lucide-react';

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

interface FeatureCardModalProps {
  selectedCard: FeatureCard | null | undefined;
  onClose: () => void;
  renderTextWithAIGradient: (text: string) => React.ReactNode;
  modalRef: React.RefObject<HTMLDivElement | null>;
  variant?: 'home' | 'landing';
}

// 모달별 카드 데이터 정의 (향상된 버전)
const getModalCardData = (cardId: string) => {
  const cardDataMap = {
    'mcp-ai-engine': [
      {
        icon: '🧠',
        title: 'UnifiedAIEngine',
        tag: {
          label: '자체개발',
          color: 'bg-gradient-to-r from-blue-500 to-blue-600',
        },
        description: '모든 AI 기능의 통합 관리 시스템',
        detailedDesc:
          'MCP 프로토콜 기반 중앙 관리 시스템으로 모든 AI 모듈을 통합 관리합니다.',
        bgColor: 'from-purple-50/80 to-purple-100/80',
        borderColor: 'border-purple-200/50',
        accent: 'purple',
        stats: { accuracy: '99.9%', response: '< 100ms' },
      },
      {
        icon: '🤖',
        title: 'TensorFlow.js',
        tag: {
          label: '오픈소스',
          color: 'bg-gradient-to-r from-green-500 to-emerald-600',
        },
        description: 'ML 추론 및 패턴 분석 엔진',
        detailedDesc:
          '브라우저 기반 머신러닝으로 실시간 서버 패턴 분석을 수행합니다.',
        bgColor: 'from-orange-50/80 to-orange-100/80',
        borderColor: 'border-orange-200/50',
        accent: 'orange',
        stats: { models: '15+', performance: '92%' },
      },
      {
        icon: '🇰🇷',
        title: 'Natural',
        tag: {
          label: '오픈소스',
          color: 'bg-gradient-to-r from-green-500 to-emerald-600',
        },
        description: '한국어 자연어 처리 시스템',
        detailedDesc:
          'hangul-js와 korean-utils를 활용한 고급 한국어 텍스트 분석입니다.',
        bgColor: 'from-emerald-50/80 to-emerald-100/80',
        borderColor: 'border-emerald-200/50',
        accent: 'emerald',
        stats: { accuracy: '96%', speed: '500ms' },
      },
      {
        icon: '⚡',
        title: 'MCPAIRouter',
        tag: {
          label: '자체개발',
          color: 'bg-gradient-to-r from-blue-500 to-blue-600',
        },
        description: '지능형 작업 라우팅 시스템',
        detailedDesc:
          'AI 작업을 효율적으로 분산하고 라우팅하는 스마트 시스템입니다.',
        bgColor: 'from-indigo-50/80 to-indigo-100/80',
        borderColor: 'border-indigo-200/50',
        accent: 'indigo',
        stats: { efficiency: '87%', latency: '< 50ms' },
      },
    ],
    'data-generator': [
      {
        icon: '📊',
        title: 'OptimizedDataGenerator',
        tag: {
          label: '자체개발',
          color: 'bg-gradient-to-r from-blue-500 to-blue-600',
        },
        description: '24시간 베이스라인 + 실시간 변동',
        detailedDesc:
          '시간대별 패턴을 학습하여 현실적인 서버 데이터를 생성합니다.',
        bgColor: 'from-emerald-50/80 to-emerald-100/80',
        borderColor: 'border-emerald-200/50',
        accent: 'emerald',
        stats: { servers: '30+', uptime: '99.9%' },
      },
      {
        icon: '⏱️',
        title: 'TimerManager',
        tag: {
          label: '자체개발',
          color: 'bg-gradient-to-r from-blue-500 to-blue-600',
        },
        description: '통합 타이머 관리 시스템',
        detailedDesc: '모든 시스템 타이머를 중앙에서 효율적으로 관리합니다.',
        bgColor: 'from-blue-50/80 to-blue-100/80',
        borderColor: 'border-blue-200/50',
        accent: 'blue',
        stats: { precision: '±1ms', timers: '100+' },
      },
      {
        icon: '📈',
        title: 'BaselineOptimizer',
        tag: {
          label: '자체개발',
          color: 'bg-gradient-to-r from-blue-500 to-blue-600',
        },
        description: '시간대별 패턴 분석',
        detailedDesc:
          '24시간 베이스라인 패턴을 분석하여 최적의 성능을 제공합니다.',
        bgColor: 'from-cyan-50/80 to-cyan-100/80',
        borderColor: 'border-cyan-200/50',
        accent: 'cyan',
        stats: { patterns: '168', accuracy: '94%' },
      },
      {
        icon: '🧹',
        title: 'MemoryOptimizer',
        tag: {
          label: '자체개발',
          color: 'bg-gradient-to-r from-blue-500 to-blue-600',
        },
        description: '메모리 최적화 + 가비지 컬렉션',
        detailedDesc: '메모리 사용량을 지속적으로 모니터링하고 최적화합니다.',
        bgColor: 'from-teal-50/80 to-teal-100/80',
        borderColor: 'border-teal-200/50',
        accent: 'teal',
        stats: { efficiency: '85%', savings: '40%' },
      },
    ],
    'tech-stack': [
      {
        icon: '⚡',
        title: 'Next.js 15',
        tag: {
          label: '오픈소스',
          color: 'bg-gradient-to-r from-green-500 to-emerald-600',
        },
        description: 'App Router + 서버리스 최적화',
        detailedDesc: '최신 Next.js로 구축된 고성능 React 애플리케이션입니다.',
        bgColor: 'from-slate-50/80 to-slate-100/80',
        borderColor: 'border-slate-200/50',
        accent: 'slate',
        stats: { version: '15.3.3', performance: 'A+' },
      },
      {
        icon: '🔧',
        title: 'TypeScript',
        tag: {
          label: '오픈소스',
          color: 'bg-gradient-to-r from-green-500 to-emerald-600',
        },
        description: '완전한 타입 안전성',
        detailedDesc: '100% TypeScript로 작성되어 런타임 오류를 방지합니다.',
        bgColor: 'from-blue-50/80 to-blue-100/80',
        borderColor: 'border-blue-200/50',
        accent: 'blue',
        stats: { coverage: '100%', errors: '0' },
      },
      {
        icon: '🎨',
        title: 'Tailwind CSS',
        tag: {
          label: '오픈소스',
          color: 'bg-gradient-to-r from-green-500 to-emerald-600',
        },
        description: '유틸리티 우선 스타일링',
        detailedDesc: 'Tailwind CSS로 일관되고 반응형 디자인을 구현했습니다.',
        bgColor: 'from-cyan-50/80 to-cyan-100/80',
        borderColor: 'border-cyan-200/50',
        accent: 'cyan',
        stats: { classes: '500+', bundle: '< 20KB' },
      },
      {
        icon: '🏗️',
        title: '모듈화 아키텍처',
        tag: {
          label: '자체개발',
          color: 'bg-gradient-to-r from-blue-500 to-blue-600',
        },
        description: '4개 독립 모듈 설계',
        detailedDesc: '확장 가능하고 유지보수가 쉬운 모듈화 아키텍처입니다.',
        bgColor: 'from-purple-50/80 to-purple-100/80',
        borderColor: 'border-purple-200/50',
        accent: 'purple',
        stats: { modules: '4', coupling: 'Low' },
      },
    ],
    'vibe-coding': [
      {
        icon: '🎯',
        title: 'Cursor AI',
        tag: {
          label: '외부도구',
          color: 'bg-gradient-to-r from-yellow-500 to-amber-600',
        },
        description: 'AI 기반 코드 생성 IDE',
        detailedDesc: 'Claude 4 Sonnet과 통합된 차세대 AI 개발 환경입니다.',
        bgColor: 'from-purple-50/80 to-purple-100/80',
        borderColor: 'border-purple-200/50',
        accent: 'purple',
        stats: { productivity: '+300%', automation: '80%' },
      },
      {
        icon: '🧠',
        title: 'Claude 4 Sonnet',
        tag: {
          label: '외부도구',
          color: 'bg-gradient-to-r from-yellow-500 to-amber-600',
        },
        description: '200K 컨텍스트 AI 모델',
        detailedDesc: '대용량 컨텍스트를 처리하는 최첨단 AI 언어 모델입니다.',
        bgColor: 'from-indigo-50/80 to-indigo-100/80',
        borderColor: 'border-indigo-200/50',
        accent: 'indigo',
        stats: { context: '200K', accuracy: '95%' },
      },
      {
        icon: '🔗',
        title: 'MCP Tools',
        tag: {
          label: '오픈소스',
          color: 'bg-gradient-to-r from-green-500 to-emerald-600',
        },
        description: '파일시스템 + Git 자동화',
        detailedDesc:
          'Model Context Protocol 도구로 개발 워크플로우를 자동화합니다.',
        bgColor: 'from-emerald-50/80 to-emerald-100/80',
        borderColor: 'border-emerald-200/50',
        accent: 'emerald',
        stats: { tools: '3', efficiency: '90%' },
      },
      {
        icon: '🚀',
        title: 'GitHub Actions',
        tag: {
          label: '오픈소스',
          color: 'bg-gradient-to-r from-green-500 to-emerald-600',
        },
        description: '자동 배포 + CI/CD',
        detailedDesc:
          'GitHub Actions로 완전 자동화된 CI/CD 파이프라인을 구축했습니다.',
        bgColor: 'from-green-50/80 to-green-100/80',
        borderColor: 'border-green-200/50',
        accent: 'green',
        stats: { deploys: '590+', success: '99%' },
      },
    ],
  };

  return cardDataMap[cardId as keyof typeof cardDataMap] || [];
};

export default function FeatureCardModal({
  selectedCard,
  onClose,
  renderTextWithAIGradient,
  modalRef,
  variant = 'home',
}: FeatureCardModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'tech'>(
    'overview'
  );
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // 마우스 위치 추적
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  // 키보드 네비게이션 - useEffect는 조건문보다 먼저
  useEffect(() => {
    if (!selectedCard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const tabs = ['overview', 'features', 'tech'] as const;
        const currentIndex = tabs.indexOf(activeTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        setActiveTab(tabs[nextIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, selectedCard]);

  if (!selectedCard) return null;

  const isHomeVariant = variant === 'home';
  const modalCards = getModalCardData(selectedCard.id);

  // 마우스 이동 추적
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const x = e.clientX - centerX;
    const y = e.clientY - centerY;

    mouseX.set(x);
    mouseY.set(y);
    setMousePosition({ x, y });
  };

  // 파티클 애니메이션 컴포넌트
  const ParticleBackground = () => {
    const particles = Array.from({ length: 20 }, (_, i) => i);

    return (
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        {particles.map(particle => (
          <motion.div
            key={particle}
            className='absolute w-1 h-1 bg-white/20 rounded-full'
            initial={{
              x:
                Math.random() *
                (typeof window !== 'undefined' ? window.innerWidth : 800),
              y:
                (typeof window !== 'undefined' ? window.innerHeight : 600) + 10,
              opacity: 0,
            }}
            animate={{
              y: -10,
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'linear',
            }}
          />
        ))}
      </div>
    );
  };

  // 모달 애니메이션 variants
  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      filter: 'blur(10px)',
      rotateX: 15,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: 'blur(0px)',
      rotateX: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
        duration: 0.6,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      filter: 'blur(10px)',
      rotateX: -15,
      transition: { duration: 0.3 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        type: 'spring',
        damping: 20,
        stiffness: 300,
      },
    }),
  };

  const tabVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  };

  return (
    <AnimatePresence mode='wait'>
      {/* 향상된 오버레이 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-50 flex items-center justify-center p-4'
        style={{
          background:
            'radial-gradient(circle at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%)',
          backdropFilter: 'blur(20px)',
        }}
        onMouseMove={handleMouseMove}
      >
        {/* 파티클 배경 */}
        <ParticleBackground />

        <motion.div
          ref={modalRef}
          variants={modalVariants}
          initial='hidden'
          animate='visible'
          exit='exit'
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
            backdropFilter: 'blur(40px)',
            background:
              'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.90) 50%, rgba(15, 23, 42, 0.95) 100%)',
          }}
          className={`relative w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-3xl shadow-2xl ${
            isHomeVariant && selectedCard.isSpecial
              ? 'bg-gradient-to-br from-gray-900/95 via-amber-900/10 to-gray-900/95 border border-amber-500/30'
              : isHomeVariant && selectedCard.isAICard
                ? 'bg-gradient-to-br from-gray-900/95 via-purple-900/10 to-gray-900/95 border border-purple-500/30'
                : 'bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-gray-700/30'
          }`}
        >
          {/* 동적 배경 패턴 */}
          <motion.div
            className='absolute inset-0 opacity-30'
            animate={{
              background: [
                'radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />

          {/* 헤더 섹션 개선 */}
          <div className='relative z-10 border-b border-white/10 backdrop-blur-sm'>
            <div className='flex items-center justify-between p-8'>
              <div className='flex items-center gap-6'>
                {/* 아이콘 컨테이너 */}
                <motion.div
                  className={`relative w-20 h-20 bg-gradient-to-br ${selectedCard.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                >
                  {/* 글로우 효과 */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${selectedCard.gradient} rounded-2xl blur-xl opacity-50`}
                  />

                  {selectedCard.isAICard ? (
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
                      className='relative z-10'
                    >
                      <selectedCard.icon className='w-10 h-10 text-white' />
                    </motion.div>
                  ) : selectedCard.isVibeCard ? (
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
                      className='relative z-10'
                    >
                      <selectedCard.icon className='w-10 h-10 text-white' />
                    </motion.div>
                  ) : (
                    <selectedCard.icon className='w-10 h-10 text-white relative z-10' />
                  )}
                </motion.div>

                {/* 제목 및 설명 */}
                <div className='flex-1'>
                  <motion.h2
                    className='text-3xl font-bold text-white mb-3'
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {renderTextWithAIGradient(selectedCard.title)}
                  </motion.h2>
                  <motion.p
                    className='text-lg text-gray-300'
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {renderTextWithAIGradient(selectedCard.description)}
                  </motion.p>

                  {/* 특별 배지 */}
                  {selectedCard.isAICard && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className='mt-3 inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium'
                    >
                      <Sparkles className='w-4 h-4' />
                      AI 파워드
                    </motion.div>
                  )}
                  {selectedCard.isSpecial && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className='mt-3 inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full text-amber-300 text-sm font-medium'
                    >
                      <Star className='w-4 h-4' />
                      프리미엄
                    </motion.div>
                  )}
                </div>

                {/* 액션 버튼들 */}
                <div className='flex items-center gap-2'>
                  <motion.button
                    className='w-10 h-10 rounded-full bg-gray-800/60 hover:bg-gray-700/60 backdrop-blur-sm border border-gray-600/30 flex items-center justify-center transition-all duration-300 group'
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title='복사'
                  >
                    <Copy className='w-4 h-4 text-gray-400 group-hover:text-white transition-colors' />
                  </motion.button>

                  <motion.button
                    className='w-10 h-10 rounded-full bg-gray-800/60 hover:bg-gray-700/60 backdrop-blur-sm border border-gray-600/30 flex items-center justify-center transition-all duration-300 group'
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title='다운로드'
                  >
                    <Download className='w-4 h-4 text-gray-400 group-hover:text-white transition-colors' />
                  </motion.button>

                  <motion.button
                    className='w-10 h-10 rounded-full bg-gray-800/60 hover:bg-gray-700/60 backdrop-blur-sm border border-gray-600/30 flex items-center justify-center transition-all duration-300 group'
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title='공유'
                  >
                    <Share className='w-4 h-4 text-gray-400 group-hover:text-white transition-colors' />
                  </motion.button>
                </div>
              </div>

              {/* 닫기 버튼 개선 */}
              <motion.button
                onClick={onClose}
                className='w-12 h-12 rounded-full bg-gray-800/60 hover:bg-gray-700/60 backdrop-blur-sm border border-gray-600/30 flex items-center justify-center transition-all duration-300 group'
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                aria-label='모달 닫기'
              >
                <X className='w-5 h-5 text-gray-400 group-hover:text-white transition-colors' />
              </motion.button>
            </div>

            {/* 탭 네비게이션 */}
            <div className='px-8 pb-4'>
              <div className='flex gap-1 bg-gray-800/40 backdrop-blur-sm rounded-xl p-1 border border-gray-700/30'>
                {[
                  { id: 'overview', label: '개요', icon: Info },
                  { id: 'features', label: '기능', icon: CheckCircle },
                  { id: 'tech', label: '기술', icon: Zap },
                ].map(tab => (
                  <motion.button
                    key={tab.id}
                    onClick={() =>
                      setActiveTab(tab.id as 'overview' | 'features' | 'tech')
                    }
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <tab.icon className='w-4 h-4' />
                    {tab.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* 콘텐츠 영역 개선 */}
          <div className='relative z-10 p-8 max-h-[60vh] overflow-y-auto custom-scrollbar'>
            <AnimatePresence mode='wait'>
              {/* 개요 탭 */}
              {activeTab === 'overview' && (
                <motion.div
                  key='overview'
                  variants={tabVariants}
                  initial='hidden'
                  animate='visible'
                  exit='hidden'
                  className='space-y-6'
                >
                  <motion.div
                    className='bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10'
                    whileHover={{ scale: 1.01, y: -2 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  >
                    <h3 className='text-white font-semibold mb-4 text-xl flex items-center gap-2'>
                      <Info className='w-5 h-5 text-blue-400' />
                      시스템 개요
                    </h3>
                    <p className='text-gray-300 leading-relaxed text-lg'>
                      {renderTextWithAIGradient(
                        selectedCard.detailedContent.overview
                      )}
                    </p>
                  </motion.div>
                </motion.div>
              )}

              {/* 기능 탭 */}
              {activeTab === 'features' && (
                <motion.div
                  key='features'
                  variants={tabVariants}
                  initial='hidden'
                  animate='visible'
                  exit='hidden'
                  className='space-y-4'
                >
                  <h3 className='text-white font-semibold mb-6 text-xl flex items-center gap-2'>
                    <CheckCircle className='w-5 h-5 text-green-400' />
                    주요 기능
                  </h3>
                  <div className='space-y-3'>
                    {selectedCard.detailedContent.features.map(
                      (feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{
                            x: 5,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          }}
                          className='flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer'
                        >
                          <motion.div
                            className='w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mt-2.5 flex-shrink-0'
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          />
                          <p className='text-gray-300 leading-relaxed'>
                            {renderTextWithAIGradient(feature)}
                          </p>
                        </motion.div>
                      )
                    )}
                  </div>
                </motion.div>
              )}

              {/* 기술 탭 - 카드 그리드 */}
              {activeTab === 'tech' && (
                <motion.div
                  key='tech'
                  variants={tabVariants}
                  initial='hidden'
                  animate='visible'
                  exit='hidden'
                  className='space-y-6'
                >
                  <h3 className='text-white font-semibold mb-6 text-xl flex items-center gap-2'>
                    <Zap className='w-5 h-5 text-yellow-400' />
                    기술 스택
                  </h3>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {modalCards.map((card, index) => (
                      <motion.div
                        key={index}
                        custom={index}
                        variants={cardVariants}
                        initial='hidden'
                        animate='visible'
                        onHoverStart={() => setHoveredCard(index)}
                        onHoverEnd={() => setHoveredCard(null)}
                        className='group relative'
                      >
                        <motion.div
                          className={`relative bg-gradient-to-br ${card.bgColor} backdrop-blur-sm rounded-2xl p-6 border ${card.borderColor} hover:shadow-xl transition-all duration-500 overflow-hidden`}
                          whileHover={{
                            scale: 1.02,
                            y: -5,
                            transition: {
                              type: 'spring',
                              damping: 15,
                              stiffness: 300,
                            },
                          }}
                        >
                          {/* 카드 배경 효과 */}
                          <motion.div
                            className={`absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                            initial={false}
                            animate={
                              hoveredCard === index
                                ? { opacity: 1 }
                                : { opacity: 0 }
                            }
                          />

                          {/* 상단 헤더 */}
                          <div className='relative z-10 flex items-center gap-4 mb-4'>
                            <motion.div
                              className={`w-14 h-14 ${card.tag.color} rounded-xl flex items-center justify-center text-2xl shadow-lg`}
                              whileHover={{ rotate: 360, scale: 1.1 }}
                              transition={{ duration: 0.6, type: 'spring' }}
                            >
                              {card.icon}
                            </motion.div>
                            <div className='flex-1'>
                              <h4 className='text-xl font-bold text-gray-800 mb-1'>
                                {card.title}
                              </h4>
                              <motion.span
                                className={`inline-block px-3 py-1 ${card.tag.color} text-white text-sm rounded-full font-medium shadow-md`}
                                whileHover={{ scale: 1.05 }}
                              >
                                {card.tag.label}
                              </motion.span>
                            </div>
                          </div>

                          {/* 설명 */}
                          <div className='relative z-10 space-y-3'>
                            <p className='text-base font-medium text-gray-800'>
                              {card.description}
                            </p>
                            <p className='text-sm text-gray-600 leading-relaxed'>
                              {card.detailedDesc}
                            </p>
                          </div>

                          {/* 통계 */}
                          {card.stats && (
                            <motion.div
                              className='relative z-10 mt-4 pt-4 border-t border-gray-200/50'
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                            >
                              <div className='flex gap-4'>
                                {Object.entries(card.stats).map(
                                  ([key, value]) => (
                                    <motion.div
                                      key={key}
                                      className='flex-1 text-center'
                                      whileHover={{ scale: 1.05 }}
                                    >
                                      <div className='text-lg font-bold text-gray-800'>
                                        {String(value)}
                                      </div>
                                      <div className='text-xs text-gray-600 capitalize'>
                                        {key}
                                      </div>
                                    </motion.div>
                                  )
                                )}
                              </div>
                            </motion.div>
                          )}

                          {/* 호버 시 화살표 */}
                          <motion.div
                            className='absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                            initial={{ x: -10 }}
                            animate={
                              hoveredCard === index ? { x: 0 } : { x: -10 }
                            }
                          >
                            <ArrowRight className='w-5 h-5 text-gray-600' />
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 푸터 추가 */}
          <motion.div
            className='relative z-10 border-t border-white/10 p-6 bg-gray-900/50 backdrop-blur-sm'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4 text-sm text-gray-400'>
                <span>💡 자세한 정보가 필요하신가요?</span>
                <motion.button
                  className='flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ExternalLink className='w-4 h-4' />
                  문서 보기
                </motion.button>
              </div>
              <div className='text-sm text-gray-500'>OpenManager v5.41.4</div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// 스타일 추가
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
`;

// 스타일을 head에 추가
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customScrollbarStyles;
  document.head.appendChild(styleElement);
}
