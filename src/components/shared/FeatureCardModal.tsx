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

// 풍부한 기능 카드 데이터 (2~3일 전 버전 스타일)
const getFeatureCards = (cardId: string) => {
  const featureMaps: {
    [key: string]: Array<{
      icon: string;
      title: string;
      description: string;
      details: string;
      status: 'active' | 'ready' | 'demo';
      metrics?: { label: string; value: string }[];
    }>;
  } = {
    'mcp-ai-engine': [
      {
        icon: '🧠',
        title: 'MCP AI 서버 통합',
        description: 'Model Context Protocol 기반 AI 서버 완전 통합',
        details:
          'Cursor IDE와 직접 연동되어 실시간 코드 분석 및 서버 관리 지원',
        status: 'active',
        metrics: [
          { label: 'AI 엔진', value: '5개' },
          { label: '응답 시간', value: '<2초' },
        ],
      },
      {
        icon: '🔄',
        title: 'Smart Fallback 시스템',
        description: '3단계 폴백으로 100% 가용성 보장',
        details: 'MCP → RAG Engine → Google AI Studio 순차 폴백',
        status: 'active',
        metrics: [
          { label: '가용성', value: '99.9%' },
          { label: '폴백 단계', value: '3단계' },
        ],
      },
      {
        icon: '🌐',
        title: '한국어 최적화',
        description: '한국어 자연어 처리 완전 지원',
        details: 'hangul-js + korean-utils 라이브러리 통합',
        status: 'active',
        metrics: [
          { label: '언어 지원', value: '한국어' },
          { label: '정확도', value: '95%+' },
        ],
      },
      {
        icon: '📊',
        title: '실시간 모니터링',
        description: '서버 상태 실시간 분석 및 예측',
        details: '30개 가상 서버 실시간 메트릭 수집 및 AI 분석',
        status: 'ready',
        metrics: [
          { label: '모니터링 서버', value: '30개' },
          { label: '업데이트 주기', value: '1초' },
        ],
      },
    ],
    'fullstack-ecosystem': [
      {
        icon: '⚛️',
        title: 'Next.js 15 풀스택',
        description: '최신 React 18 + Next.js 15 기반 풀스택 아키텍처',
        details: '97개 정적 페이지 + 50+ API 라우트 완전 구현',
        status: 'active',
        metrics: [
          { label: '정적 페이지', value: '97개' },
          { label: 'API 라우트', value: '50+개' },
        ],
      },
      {
        icon: '🗄️',
        title: 'Database & Cache',
        description: 'Supabase PostgreSQL + Upstash Redis 이중화',
        details: '실시간 데이터 동기화 및 캐싱 최적화',
        status: 'active',
        metrics: [
          { label: 'DB 연결', value: '안정' },
          { label: '캐시 적중률', value: '85%+' },
        ],
      },
      {
        icon: '🚀',
        title: 'Vercel 배포',
        description: '자동 CI/CD 파이프라인 구축',
        details: 'Git push → 자동 빌드 → 배포 완전 자동화',
        status: 'active',
        metrics: [
          { label: '배포 시간', value: '~2분' },
          { label: '성공률', value: '100%' },
        ],
      },
      {
        icon: '📱',
        title: '반응형 디자인',
        description: '모든 디바이스 완벽 지원',
        details: 'Mobile-first 설계 + Desktop 최적화',
        status: 'ready',
        metrics: [
          { label: '지원 디바이스', value: '전체' },
          { label: '성능 점수', value: '95+' },
        ],
      },
    ],
    'tech-stack': [
      {
        icon: '🔷',
        title: 'TypeScript 완전 적용',
        description: '100% TypeScript 코드베이스',
        details: '타입 안전성 보장 + 컴파일 타임 오류 검증',
        status: 'active',
        metrics: [
          { label: 'TS 커버리지', value: '100%' },
          { label: '컴파일 오류', value: '0개' },
        ],
      },
      {
        icon: '🎨',
        title: 'TailwindCSS 디자인',
        description: '커스텀 디자인 시스템 구축',
        details: 'Utility-first CSS + 다크모드 완전 지원',
        status: 'active',
        metrics: [
          { label: 'CSS 크기', value: '~50KB' },
          { label: '테마', value: '다크/라이트' },
        ],
      },
      {
        icon: '🧪',
        title: '테스트 자동화',
        description: 'Unit + Integration 테스트 스위트',
        details: 'Jest + Testing Library 기반 자동화 테스트',
        status: 'ready',
        metrics: [
          { label: '테스트 커버리지', value: '80%+' },
          { label: '테스트 수', value: '50+개' },
        ],
      },
      {
        icon: '⚡',
        title: 'Framer Motion',
        description: '고급 애니메이션 시스템',
        details: '60fps 부드러운 전환 + 인터랙티브 애니메이션',
        status: 'active',
        metrics: [
          { label: '애니메이션', value: '60fps' },
          { label: '번들 크기', value: '~100KB' },
        ],
      },
    ],
    'vibe-coding': [
      {
        icon: '🤖',
        title: 'Cursor IDE 통합',
        description: 'AI 페어 프로그래밍 완전 활용',
        details: 'Claude Sonnet 3.5 + MCP 프로토콜 연동',
        status: 'active',
        metrics: [
          { label: 'AI 모델', value: 'Claude 3.5' },
          { label: '생산성 향상', value: '300%+' },
        ],
      },
      {
        icon: '🔧',
        title: 'MCP 개발 도구',
        description: 'Model Context Protocol 개발 환경',
        details: '실시간 코드 분석 + 자동 리팩토링 지원',
        status: 'active',
        metrics: [
          { label: 'MCP 서버', value: '3개' },
          { label: '도구 연동', value: '완료' },
        ],
      },
      {
        icon: '📝',
        title: '자동 문서화',
        description: '코드와 함께 업데이트되는 문서',
        details: 'JSDoc + TypeScript + 자동 README 생성',
        status: 'ready',
        metrics: [
          { label: '문서 페이지', value: '20+개' },
          { label: '자동 업데이트', value: '실시간' },
        ],
      },
      {
        icon: '🎯',
        title: '20일 완성 프로젝트',
        description: '1인 개발로 완성한 풀스택 시스템',
        details: '기획부터 배포까지 20일 완성 + 50+ 커밋',
        status: 'active',
        metrics: [
          { label: '개발 기간', value: '20일' },
          { label: '총 커밋', value: '50+개' },
        ],
      },
    ],
  };
  return featureMaps[cardId] || [];
};

// 상세 기술 스택 정보
const getTechDetails = (cardId: string) => {
  const techMaps: {
    [key: string]: Array<{
      name: string;
      category: string;
      version?: string;
      purpose: string;
      features: string[];
    }>;
  } = {
    'mcp-ai-engine': [
      {
        name: 'MCP Server',
        category: 'AI Protocol',
        purpose: 'AI 통신 프로토콜',
        features: ['실시간 통신', '타입 안전성', '확장 가능'],
      },
      {
        name: 'Google AI Studio',
        category: 'AI Service',
        purpose: '베타 API 연동',
        features: ['Gemini Pro', '무료 티어', '한국어 지원'],
      },
      {
        name: 'RAG Engine',
        category: 'AI Search',
        purpose: '로컬 벡터 검색',
        features: ['임베딩 생성', '유사도 검색', '컨텍스트 확장'],
      },
      {
        name: 'Korean NLP',
        category: 'Language',
        purpose: '한국어 처리',
        features: ['형태소 분석', '자연어 이해', '문맥 파악'],
      },
    ],
    'fullstack-ecosystem': [
      {
        name: 'Next.js',
        category: 'Framework',
        version: '15.0',
        purpose: 'React 풀스택 프레임워크',
        features: ['App Router', 'Server Components', 'Static Generation'],
      },
      {
        name: 'Supabase',
        category: 'Database',
        version: '2.0',
        purpose: 'PostgreSQL 클라우드 서비스',
        features: ['실시간 구독', 'Row Level Security', 'Auto API'],
      },
      {
        name: 'Upstash Redis',
        category: 'Cache',
        purpose: '서버리스 Redis',
        features: ['글로벌 복제', '자동 스케일링', 'REST API'],
      },
      {
        name: 'Vercel',
        category: 'Platform',
        purpose: '서버리스 배포',
        features: ['Edge Functions', 'Auto Scaling', 'Global CDN'],
      },
    ],
    'tech-stack': [
      {
        name: 'TypeScript',
        category: 'Language',
        version: '^5.0',
        purpose: '타입 안전 JavaScript',
        features: ['정적 타입 검사', 'IntelliSense', '리팩토링 지원'],
      },
      {
        name: 'TailwindCSS',
        category: 'Styling',
        version: '^3.4',
        purpose: 'Utility-first CSS',
        features: ['JIT 컴파일', '다크모드', '반응형 디자인'],
      },
      {
        name: 'Framer Motion',
        category: 'Animation',
        version: '^11.0',
        purpose: '고급 애니메이션 라이브러리',
        features: ['선언적 애니메이션', '제스처 지원', '레이아웃 애니메이션'],
      },
      {
        name: 'Zustand',
        category: 'State',
        version: '^4.5',
        purpose: '경량 상태 관리',
        features: ['TypeScript 지원', '미들웨어', '개발자 도구'],
      },
    ],
    'vibe-coding': [
      {
        name: 'Cursor IDE',
        category: 'Editor',
        purpose: 'AI 통합 코드 에디터',
        features: ['AI 자동완성', '코드 생성', '리팩토링'],
      },
      {
        name: 'Claude Sonnet',
        category: 'AI Assistant',
        version: '3.5',
        purpose: 'AI 페어 프로그래밍',
        features: ['코드 리뷰', '버그 수정', '아키텍처 설계'],
      },
      {
        name: 'GitHub',
        category: 'VCS',
        purpose: '버전 관리 시스템',
        features: ['Git 워크플로우', 'Actions CI/CD', 'Issue 관리'],
      },
      {
        name: 'ESLint + Prettier',
        category: 'Quality',
        purpose: '코드 품질 관리',
        features: ['린팅 규칙', '자동 포맷팅', 'Pre-commit Hook'],
      },
    ],
  };
  return techMaps[cardId] || [];
};

// 실제 성능 메트릭
const getPerformanceMetrics = (cardId: string) => {
  const metricMaps: {
    [key: string]: Array<{
      label: string;
      value: string;
      icon: string;
      color: string;
      trend?: 'up' | 'down' | 'stable';
    }>;
  } = {
    'mcp-ai-engine': [
      {
        label: 'AI 엔진 수',
        value: '5개',
        icon: '🧠',
        color: 'from-blue-500 to-cyan-500',
        trend: 'stable',
      },
      {
        label: '평균 응답시간',
        value: '1.2초',
        icon: '⚡',
        color: 'from-green-500 to-emerald-500',
        trend: 'down',
      },
      {
        label: '폴백 성공률',
        value: '99.9%',
        icon: '🔄',
        color: 'from-purple-500 to-pink-500',
        trend: 'up',
      },
      {
        label: '한국어 정확도',
        value: '95%+',
        icon: '🌐',
        color: 'from-orange-500 to-red-500',
        trend: 'up',
      },
    ],
    'fullstack-ecosystem': [
      {
        label: '정적 페이지',
        value: '97개',
        icon: '📄',
        color: 'from-blue-500 to-cyan-500',
        trend: 'stable',
      },
      {
        label: 'API 엔드포인트',
        value: '50+개',
        icon: '🔌',
        color: 'from-green-500 to-emerald-500',
        trend: 'up',
      },
      {
        label: '빌드 성공률',
        value: '100%',
        icon: '✅',
        color: 'from-purple-500 to-pink-500',
        trend: 'stable',
      },
      {
        label: '배포 시간',
        value: '~2분',
        icon: '🚀',
        color: 'from-orange-500 to-red-500',
        trend: 'down',
      },
    ],
    'tech-stack': [
      {
        label: 'TypeScript 오류',
        value: '0개',
        icon: '✅',
        color: 'from-green-500 to-emerald-500',
        trend: 'stable',
      },
      {
        label: '설치된 패키지',
        value: '40+개',
        icon: '📦',
        color: 'from-blue-500 to-cyan-500',
        trend: 'up',
      },
      {
        label: '빌드 시간',
        value: '~30초',
        icon: '⚡',
        color: 'from-yellow-500 to-orange-500',
        trend: 'down',
      },
      {
        label: '번들 크기',
        value: '~2MB',
        icon: '📊',
        color: 'from-purple-500 to-pink-500',
        trend: 'stable',
      },
    ],
    'vibe-coding': [
      {
        label: '개발 기간',
        value: '20일',
        icon: '📅',
        color: 'from-purple-500 to-pink-500',
        trend: 'stable',
      },
      {
        label: '개발자 수',
        value: '1명',
        icon: '👨‍💻',
        color: 'from-blue-500 to-cyan-500',
        trend: 'stable',
      },
      {
        label: '총 커밋 수',
        value: '50+개',
        icon: '📝',
        color: 'from-green-500 to-emerald-500',
        trend: 'up',
      },
      {
        label: '생산성 향상',
        value: '300%+',
        icon: '🚀',
        color: 'from-orange-500 to-red-500',
        trend: 'up',
      },
    ],
  };
  return metricMaps[cardId] || [];
};

// 상태 배지 컴포넌트
const StatusBadge = ({ status }: { status: 'active' | 'ready' | 'demo' }) => {
  const config = {
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

  const statusConfig = config[status];

  return (
    <span
      className={`inline-block px-2 py-1 text-xs rounded-full font-medium border ${statusConfig.bg} ${statusConfig.text}`}
    >
      {statusConfig.label}
    </span>
  );
};

// 풍부한 기능 카드 컴포넌트 (2~3일 전 스타일)
const EnhancedFeatureCard = ({
  feature,
  index,
}: {
  feature: {
    icon: string;
    title: string;
    description: string;
    details: string;
    status: 'active' | 'ready' | 'demo';
    metrics?: { label: string; value: string }[];
  };
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ scale: 1.02, y: -4 }}
    className='p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300 group'
  >
    <div className='flex items-start justify-between mb-4'>
      <div className='text-3xl group-hover:scale-110 transition-transform duration-300'>
        {feature.icon}
      </div>
      <StatusBadge status={feature.status} />
    </div>

    <h4 className='font-bold text-white mb-2 text-lg'>{feature.title}</h4>
    <p className='text-sm text-blue-300 mb-3 font-medium'>
      {feature.description}
    </p>
    <p className='text-xs text-white/60 mb-4 leading-relaxed'>
      {feature.details}
    </p>

    {feature.metrics && (
      <div className='grid grid-cols-2 gap-2 pt-3 border-t border-white/10'>
        {feature.metrics.map((metric, idx) => (
          <div key={idx} className='text-center'>
            <div className='text-sm font-bold text-white'>{metric.value}</div>
            <div className='text-xs text-white/50'>{metric.label}</div>
          </div>
        ))}
      </div>
    )}
  </motion.div>
);

// 상세 기술 카드 컴포넌트
const DetailedTechCard = ({
  tech,
  index,
}: {
  tech: {
    name: string;
    category: string;
    version?: string;
    purpose: string;
    features: string[];
  };
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ scale: 1.02, y: -2 }}
    className='p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300'
  >
    <div className='flex items-center justify-between mb-3'>
      <h4 className='font-bold text-white text-lg'>{tech.name}</h4>
      {tech.version && (
        <span className='text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium'>
          {tech.version}
        </span>
      )}
    </div>

    <div className='flex items-center gap-2 mb-3'>
      <span className='text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30'>
        {tech.category}
      </span>
    </div>

    <p className='text-sm text-white/70 mb-4'>{tech.purpose}</p>

    <div className='space-y-1'>
      <div className='text-xs text-white/50 mb-2'>주요 기능:</div>
      {tech.features.map((feature, idx) => (
        <div key={idx} className='flex items-center gap-2'>
          <div className='w-1 h-1 rounded-full bg-blue-400'></div>
          <span className='text-xs text-white/60'>{feature}</span>
        </div>
      ))}
    </div>
  </motion.div>
);

// 향상된 메트릭 카드 컴포넌트
const EnhancedMetricCard = ({
  metric,
  index,
}: {
  metric: {
    label: string;
    value: string;
    icon: string;
    color: string;
    trend?: 'up' | 'down' | 'stable';
  };
  index: number;
}) => {
  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return '';
    }
  };

  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      case 'stable':
        return 'text-blue-400';
      default:
        return 'text-white/60';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.05, y: -2 }}
      className='p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300 group'
    >
      <div className='flex items-center gap-3'>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-r ${metric.color} flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300`}
        >
          {metric.icon}
        </div>
        <div className='flex-1'>
          <div className='flex items-center gap-2'>
            <h4 className='font-bold text-white text-xl'>{metric.value}</h4>
            {metric.trend && (
              <span className={`text-sm ${getTrendColor()}`}>
                {getTrendIcon()}
              </span>
            )}
          </div>
          <p className='text-sm text-white/60'>{metric.label}</p>
        </div>
      </div>
    </motion.div>
  );
};

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
  const featureCards = getFeatureCards(selectedCard.id);
  const techDetails = getTechDetails(selectedCard.id);
  const performanceMetrics = getPerformanceMetrics(selectedCard.id);

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
                {performanceMetrics.map((metric, index) => (
                  <EnhancedMetricCard
                    key={index}
                    metric={metric}
                    index={index}
                  />
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
                {featureCards.map((feature, index) => (
                  <EnhancedFeatureCard
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
                {techDetails.map((tech, index) => (
                  <DetailedTechCard key={index} tech={tech} index={index} />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
