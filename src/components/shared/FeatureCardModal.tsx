'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  Star,
  Zap,
  Shield,
  TrendingUp,
  Database,
  Code,
  Cpu,
  Network,
  Globe,
  Settings,
  Monitor,
  Cloud,
  Brain,
  ArrowRight,
  ExternalLink,
  Rocket,
  Award,
  Target,
  Layers,
} from 'lucide-react';

interface FeatureCardModalProps {
  selectedCard: any;
  onClose: () => void;
  renderTextWithAIGradient: (text: string) => React.ReactNode;
  modalRef: React.RefObject<HTMLDivElement>;
  variant?: 'home' | 'landing';
  isDarkMode?: boolean;
}

// 실제 구현된 핵심 기능만 담은 심플한 카드 데이터
const getCoreFeatures = (cardId: string) => {
  const featureMaps: {
    [key: string]: Array<{
      icon: string;
      title: string;
      description: string;
      status: 'active' | 'ready' | 'demo';
    }>;
  } = {
    'mcp-ai-engine': [
      {
        icon: '��',
        title: 'MCP AI 서버',
        description: 'Cursor IDE 연동 완료',
        status: 'active',
      },
      {
        icon: '🔄',
        title: 'Smart Fallback',
        description: 'MCP → RAG → Google AI',
        status: 'active',
      },
      {
        icon: '🗣️',
        title: '한국어 대화',
        description: '자연어 서버 관리',
        status: 'active',
      },
      {
        icon: '📊',
        title: '실시간 분석',
        description: '서버 상태 모니터링',
        status: 'ready',
      },
    ],
    'fullstack-ecosystem': [
      {
        icon: '⚛️',
        title: 'Next.js 15',
        description: '97개 페이지 빌드 성공',
        status: 'active',
      },
      {
        icon: '🗄️',
        title: 'Supabase + Redis',
        description: '실제 연결 검증 완료',
        status: 'active',
      },
      {
        icon: '🚀',
        title: 'Vercel 배포',
        description: '자동 배포 파이프라인',
        status: 'active',
      },
      {
        icon: '📱',
        title: '반응형 디자인',
        description: '모바일/데스크톱 최적화',
        status: 'ready',
      },
    ],
    'tech-stack': [
      {
        icon: '🔷',
        title: 'TypeScript',
        description: '컴파일 오류 0개 달성',
        status: 'active',
      },
      {
        icon: '🎨',
        title: 'TailwindCSS',
        description: '커스텀 디자인 시스템',
        status: 'active',
      },
      {
        icon: '🧪',
        title: '테스트 스위트',
        description: 'Unit + Integration',
        status: 'ready',
      },
      {
        icon: '⚡',
        title: 'Framer Motion',
        description: '부드러운 애니메이션',
        status: 'active',
      },
    ],
    'vibe-coding': [
      {
        icon: '🤖',
        title: 'Cursor IDE',
        description: 'AI 페어 프로그래밍',
        status: 'active',
      },
      {
        icon: '🔧',
        title: 'MCP Protocol',
        description: '개발 도구 연동',
        status: 'active',
      },
      {
        icon: '📝',
        title: '자동 문서화',
        description: '코드와 함께 업데이트',
        status: 'ready',
      },
      {
        icon: '🎯',
        title: '20일 개발',
        description: '1인 개발 완성',
        status: 'active',
      },
    ],
  };
  return featureMaps[cardId] || [];
};

// 실제 기술 스택 (버전 정보 포함)
const getTechStack = (cardId: string) => {
  const techMaps: {
    [key: string]: Array<{
      name: string;
      category: string;
      version?: string;
      purpose: string;
    }>;
  } = {
    'mcp-ai-engine': [
      { name: 'MCP Server', category: 'AI', purpose: 'AI 통신 프로토콜' },
      { name: 'Google AI Studio', category: 'AI', purpose: '베타 API 연동' },
      { name: 'RAG Engine', category: 'AI', purpose: '로컬 벡터 검색' },
      { name: 'Korean NLP', category: 'AI', purpose: '한국어 처리' },
    ],
    'fullstack-ecosystem': [
      {
        name: 'Next.js',
        category: 'Framework',
        version: '15.0',
        purpose: 'React 풀스택',
      },
      {
        name: 'Supabase',
        category: 'Database',
        purpose: 'PostgreSQL 클라우드',
      },
      { name: 'Redis', category: 'Cache', purpose: 'Upstash 호스팅' },
      { name: 'Vercel', category: 'Deploy', purpose: '서버리스 배포' },
    ],
    'tech-stack': [
      {
        name: 'TypeScript',
        category: 'Language',
        version: '^5.0',
        purpose: '타입 안전성',
      },
      {
        name: 'TailwindCSS',
        category: 'Style',
        version: '^3.4',
        purpose: 'Utility CSS',
      },
      {
        name: 'Framer Motion',
        category: 'Animation',
        version: '^11.0',
        purpose: '애니메이션',
      },
      {
        name: 'Zustand',
        category: 'State',
        version: '^4.5',
        purpose: '상태 관리',
      },
    ],
    'vibe-coding': [
      { name: 'Cursor IDE', category: 'Tool', purpose: 'AI 코딩 도구' },
      {
        name: 'Claude Sonnet',
        category: 'AI',
        version: '3.7+',
        purpose: 'AI 어시스턴트',
      },
      { name: 'GitHub', category: 'VCS', purpose: '버전 관리' },
      { name: 'ESLint', category: 'Quality', purpose: '코드 품질' },
    ],
  };
  return techMaps[cardId] || [];
};

// 실제 성과 지표 (측정 가능한 것만)
const getActualMetrics = (cardId: string) => {
  const metricMaps: {
    [key: string]: Array<{
      label: string;
      value: string;
      icon: string;
      color: string;
    }>;
  } = {
    'mcp-ai-engine': [
      {
        label: 'AI 엔진',
        value: '5개',
        icon: '🧠',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        label: '폴백 단계',
        value: '3단계',
        icon: '🔄',
        color: 'from-green-500 to-emerald-500',
      },
      {
        label: '언어 지원',
        value: '한국어',
        icon: '🌐',
        color: 'from-purple-500 to-pink-500',
      },
    ],
    'fullstack-ecosystem': [
      {
        label: '정적 페이지',
        value: '97개',
        icon: '📄',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        label: 'API 경로',
        value: '50+개',
        icon: '🔌',
        color: 'from-green-500 to-emerald-500',
      },
      {
        label: '배포 상태',
        value: '성공',
        icon: '✅',
        color: 'from-purple-500 to-pink-500',
      },
    ],
    'tech-stack': [
      {
        label: 'TS 오류',
        value: '0개',
        icon: '✅',
        color: 'from-green-500 to-emerald-500',
      },
      {
        label: '패키지',
        value: '40+개',
        icon: '📦',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        label: '빌드 시간',
        value: '~30초',
        icon: '⚡',
        color: 'from-yellow-500 to-orange-500',
      },
    ],
    'vibe-coding': [
      {
        label: '개발 기간',
        value: '20일',
        icon: '📅',
        color: 'from-purple-500 to-pink-500',
      },
      {
        label: '개발자',
        value: '1명',
        icon: '👨‍💻',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        label: '커밋',
        value: '50+개',
        icon: '📝',
        color: 'from-green-500 to-emerald-500',
      },
    ],
  };
  return metricMaps[cardId] || [];
};

// Status 배지 컴포넌트
const StatusBadge = ({ status }: { status: 'active' | 'ready' | 'demo' }) => {
  const configs = {
    active: {
      bg: 'bg-green-500/20 border-green-500/30',
      text: 'text-green-300',
      label: '운영중',
    },
    ready: {
      bg: 'bg-blue-500/20 border-blue-500/30',
      text: 'text-blue-300',
      label: '준비완료',
    },
    demo: {
      bg: 'bg-yellow-500/20 border-yellow-500/30',
      text: 'text-yellow-300',
      label: '데모',
    },
  };

  const config = configs[status];

  return (
    <span
      className={`inline-block px-2 py-1 text-xs rounded-full font-medium border ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};

// 핵심 기능 카드 컴포넌트
const CoreFeatureCard = ({
  feature,
  index,
}: {
  feature: {
    icon: string;
    title: string;
    description: string;
    status: 'active' | 'ready' | 'demo';
  };
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ scale: 1.02, y: -2 }}
    className='p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300'
  >
    <div className='flex items-start justify-between mb-3'>
      <div className='text-2xl'>{feature.icon}</div>
      <StatusBadge status={feature.status} />
    </div>
    <h4 className='font-semibold text-white mb-2'>{feature.title}</h4>
    <p className='text-sm text-white/70'>{feature.description}</p>
  </motion.div>
);

// 기술 스택 카드 컴포넌트
const TechCard = ({
  tech,
  index,
}: {
  tech: { name: string; category: string; version?: string; purpose: string };
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ scale: 1.02, y: -2 }}
    className='p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300'
  >
    <div className='flex items-center justify-between mb-2'>
      <h4 className='font-semibold text-white'>{tech.name}</h4>
      {tech.version && (
        <span className='text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30'>
          {tech.version}
        </span>
      )}
    </div>
    <p className='text-xs text-blue-300 mb-1'>{tech.category}</p>
    <p className='text-sm text-white/60'>{tech.purpose}</p>
  </motion.div>
);

// 실제 지표 카드 컴포넌트
const MetricCard = ({
  metric,
  index,
}: {
  metric: { label: string; value: string; icon: string; color: string };
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ scale: 1.02, y: -2 }}
    className='p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300'
  >
    <div className='flex items-center gap-3'>
      <div
        className={`w-10 h-10 rounded-lg bg-gradient-to-r ${metric.color} flex items-center justify-center text-lg`}
      >
        {metric.icon}
      </div>
      <div className='flex-1'>
        <h4 className='font-bold text-white text-lg'>{metric.value}</h4>
        <p className='text-sm text-white/60'>{metric.label}</p>
      </div>
    </div>
  </motion.div>
);

export default function FeatureCardModal({
  selectedCard,
  onClose,
  renderTextWithAIGradient,
  modalRef,
  variant = 'home',
  isDarkMode = true,
}: FeatureCardModalProps) {
  // 키보드 네비게이션
  useEffect(() => {
    if (!selectedCard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCard, onClose]);

  if (!selectedCard) return null;

  // 실제 데이터 가져오기
  const coreFeatures = getCoreFeatures(selectedCard.id);
  const techStack = getTechStack(selectedCard.id);
  const actualMetrics = getActualMetrics(selectedCard.id);

  // 모달 애니메이션
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
        duration: 0.4,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: { duration: 0.2 },
    },
  };

  return (
    <AnimatePresence mode='wait'>
      {/* 첫페이지와 일치하는 다크 그라데이션 오버레이 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-gray-900/95 via-blue-900/50 to-purple-900/50 backdrop-blur-sm'
        onClick={onClose}
      >
        <motion.div
          ref={modalRef}
          variants={modalVariants}
          initial='hidden'
          animate='visible'
          exit='exit'
          onClick={e => e.stopPropagation()}
          className='relative w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900/90 via-blue-900/20 to-purple-900/20 backdrop-blur-xl border border-white/10 shadow-2xl'
        >
          {/* 헤더 */}
          <div className='p-6 border-b border-white/10'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-r ${
                    selectedCard.id === 'mcp-ai-engine'
                      ? 'from-blue-500 to-cyan-500'
                      : selectedCard.id === 'fullstack-ecosystem'
                        ? 'from-green-500 to-emerald-500'
                        : selectedCard.id === 'tech-stack'
                          ? 'from-purple-500 to-pink-500'
                          : 'from-yellow-500 to-orange-500'
                  } flex items-center justify-center text-white text-xl`}
                >
                  {selectedCard.id === 'mcp-ai-engine'
                    ? '🧠'
                    : selectedCard.id === 'fullstack-ecosystem'
                      ? '🌐'
                      : selectedCard.id === 'tech-stack'
                        ? '🏗️'
                        : '🚀'}
                </div>
                <div>
                  <h2 className='text-2xl font-bold text-white'>
                    {selectedCard.title}
                  </h2>
                  <p className='text-sm text-white/60'>
                    {selectedCard.subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className='w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10 text-white/60 hover:text-white'
              >
                <X className='w-6 h-6' />
              </button>
            </div>
          </div>

          {/* 스크롤 가능한 콘텐츠 영역 */}
          <div className='overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-8 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30'>
            {/* 1. 실제 지표 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='space-y-4'
            >
              <div className='flex items-center gap-3 mb-4'>
                <div className='p-2 rounded-lg bg-blue-500/20'>
                  <TrendingUp className='w-5 h-5 text-blue-400' />
                </div>
                <h3 className='text-xl font-bold text-white'>실제 성과</h3>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {actualMetrics.map((metric, index) => (
                  <MetricCard key={index} metric={metric} index={index} />
                ))}
              </div>
            </motion.div>

            {/* 2. 핵심 기능 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='space-y-4'
            >
              <div className='flex items-center gap-3 mb-4'>
                <div className='p-2 rounded-lg bg-green-500/20'>
                  <CheckCircle className='w-5 h-5 text-green-400' />
                </div>
                <h3 className='text-xl font-bold text-white'>핵심 기능</h3>
              </div>
              <div className='grid md:grid-cols-2 gap-4'>
                {coreFeatures.map((feature, index) => (
                  <CoreFeatureCard
                    key={index}
                    feature={feature}
                    index={index}
                  />
                ))}
              </div>
            </motion.div>

            {/* 3. 기술 스택 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className='space-y-4'
            >
              <div className='flex items-center gap-3 mb-4'>
                <div className='p-2 rounded-lg bg-purple-500/20'>
                  <Code className='w-5 h-5 text-purple-400' />
                </div>
                <h3 className='text-xl font-bold text-white'>기술 스택</h3>
              </div>
              <div className='grid md:grid-cols-2 gap-4'>
                {techStack.map((tech, index) => (
                  <TechCard key={index} tech={tech} index={index} />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
