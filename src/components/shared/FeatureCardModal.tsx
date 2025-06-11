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

// 기술 태그 컴포넌트
const TechTag = ({
  name,
  category,
  isDark = false,
}: {
  name: string;
  category: string;
  isDark?: boolean;
}) => {
  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: any } = {
      AI: Brain,
      Framework: Code,
      Database: Database,
      Cloud: Cloud,
      Tool: Settings,
      Frontend: Monitor,
      Backend: Network,
      Language: Globe,
      Testing: CheckCircle,
      Deployment: Rocket,
      Animation: Star,
      State: Layers,
    };
    return iconMap[category] || Settings;
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      AI: isDark
        ? 'from-pink-500 to-purple-500'
        : 'from-pink-400 to-purple-400',
      Framework: isDark
        ? 'from-blue-500 to-cyan-500'
        : 'from-blue-400 to-cyan-400',
      Database: isDark
        ? 'from-green-500 to-emerald-500'
        : 'from-green-400 to-emerald-400',
      Cloud: isDark
        ? 'from-indigo-500 to-purple-500'
        : 'from-indigo-400 to-purple-400',
      Tool: isDark
        ? 'from-gray-500 to-slate-500'
        : 'from-gray-400 to-slate-400',
      Frontend: isDark
        ? 'from-teal-500 to-cyan-500'
        : 'from-teal-400 to-cyan-400',
      Backend: isDark
        ? 'from-orange-500 to-red-500'
        : 'from-orange-400 to-red-400',
      Language: isDark
        ? 'from-violet-500 to-purple-500'
        : 'from-violet-400 to-purple-400',
      Testing: isDark
        ? 'from-lime-500 to-green-500'
        : 'from-lime-400 to-green-400',
      Deployment: isDark
        ? 'from-amber-500 to-orange-500'
        : 'from-amber-400 to-orange-400',
      Animation: isDark
        ? 'from-rose-500 to-pink-500'
        : 'from-rose-400 to-pink-400',
      State: isDark
        ? 'from-emerald-500 to-teal-500'
        : 'from-emerald-400 to-teal-400',
    };
    return (
      colorMap[category] ||
      (isDark ? 'from-gray-500 to-slate-500' : 'from-gray-400 to-slate-400')
    );
  };

  const IconComponent = getCategoryIcon(category);

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      className={`group relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
        isDark
          ? 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70'
          : 'bg-white border-gray-200 hover:shadow-md'
      }`}
    >
      {/* 아이콘 */}
      <div
        className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getCategoryColor(category)} flex items-center justify-center`}
      >
        <IconComponent className='w-6 h-6 text-white' />
      </div>

      {/* 텍스트 */}
      <div className='flex-1'>
        <h4
          className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          {name}
        </h4>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {category}
        </p>
      </div>

      {/* 호버 효과 */}
      <div className='opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
        <ArrowRight
          className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
        />
      </div>
    </motion.div>
  );
};

// 카드별 기술 매핑
const getTechMapping = (cardId: string) => {
  const mappings: { [key: string]: Array<{ name: string; category: string }> } =
    {
      'mcp-ai-engine': [
        { name: 'MCP AI Server', category: 'AI' },
        { name: 'RAG Backup Engine', category: 'AI' },
        { name: 'TensorFlow.js', category: 'AI' },
        { name: 'Google AI Studio', category: 'AI' },
        { name: 'Vector Database', category: 'Database' },
        { name: 'Korean NLP', category: 'Language' },
        { name: 'Hybrid Deployment', category: 'Deployment' },
      ],
      'fullstack-ecosystem': [
        { name: 'Next.js 15', category: 'Framework' },
        { name: 'React 19', category: 'Frontend' },
        { name: 'TypeScript', category: 'Language' },
        { name: 'Serverless APIs', category: 'Backend' },
        { name: 'Vercel Deployment', category: 'Cloud' },
        { name: 'Render Hosting', category: 'Cloud' },
        { name: 'CI/CD Pipeline', category: 'Deployment' },
      ],
      'tech-stack': [
        { name: 'Next.js 15', category: 'Framework' },
        { name: 'TypeScript', category: 'Language' },
        { name: 'TailwindCSS', category: 'Frontend' },
        { name: 'Framer Motion', category: 'Animation' },
        { name: 'Supabase', category: 'Database' },
        { name: 'Redis', category: 'Database' },
        { name: 'Testing Suite', category: 'Testing' },
      ],
      'vibe-coding': [
        { name: 'Cursor AI', category: 'AI' },
        { name: 'Claude Sonnet', category: 'AI' },
        { name: 'MCP Protocol', category: 'Tool' },
        { name: 'GitHub Integration', category: 'Tool' },
        { name: 'Auto Deployment', category: 'Deployment' },
        { name: 'CI/CD Pipeline', category: 'Deployment' },
        { name: 'AI Workflow', category: 'AI' },
      ],
    };

  return mappings[cardId] || [];
};

// 실제 구현된 시스템 개요 데이터 (과장 없는 실제 데이터)
const getSystemOverviewCards = (cardId: string) => {
  const overviewMaps: {
    [key: string]: Array<{
      icon: string;
      title: string;
      value: string;
      color: string;
    }>;
  } = {
    'mcp-ai-engine': [
      {
        icon: '🧠',
        title: 'AI 시스템',
        value: 'MCP + RAG',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        icon: '⚡',
        title: '응답 방식',
        value: '실시간',
        color: 'from-yellow-500 to-orange-500',
      },
      {
        icon: '🔧',
        title: '폴백 전략',
        value: '3단계',
        color: 'from-green-500 to-emerald-500',
      },
      {
        icon: '🌐',
        title: '언어 지원',
        value: '한국어',
        color: 'from-purple-500 to-pink-500',
      },
    ],
    'fullstack-ecosystem': [
      {
        icon: '⚛️',
        title: '프론트엔드',
        value: 'Next.js 15',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        icon: '🚀',
        title: '배포',
        value: 'Vercel',
        color: 'from-green-500 to-emerald-500',
      },
      {
        icon: '📱',
        title: '반응형',
        value: '완전 지원',
        color: 'from-purple-500 to-pink-500',
      },
      {
        icon: '⚡',
        title: 'SSR',
        value: '서버사이드',
        color: 'from-yellow-500 to-orange-500',
      },
    ],
    'tech-stack': [
      {
        icon: '🔷',
        title: '언어',
        value: 'TypeScript',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        icon: '🎨',
        title: '스타일링',
        value: 'TailwindCSS',
        color: 'from-pink-500 to-rose-500',
      },
      {
        icon: '🗄️',
        title: '데이터베이스',
        value: 'Supabase',
        color: 'from-green-500 to-emerald-500',
      },
      {
        icon: '🔄',
        title: '상태관리',
        value: 'Zustand',
        color: 'from-purple-500 to-violet-500',
      },
    ],
    'vibe-coding': [
      {
        icon: '🤖',
        title: 'AI 도구',
        value: 'Cursor IDE',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        icon: '🔧',
        title: '개발 방식',
        value: 'AI 협업',
        color: 'from-yellow-500 to-orange-500',
      },
      {
        icon: '🧪',
        title: '테스트',
        value: 'Unit + E2E',
        color: 'from-green-500 to-emerald-500',
      },
      {
        icon: '📦',
        title: '빌드 시스템',
        value: 'Next.js',
        color: 'from-purple-500 to-pink-500',
      },
    ],
  };
  return overviewMaps[cardId] || [];
};

// 실제 구현된 주요 기능들 (과장 없는 실제 기능)
const getFeatureCards = (cardId: string) => {
  const featureMaps: {
    [key: string]: Array<{
      icon: string;
      title: string;
      description: string;
      highlight: string;
    }>;
  } = {
    'mcp-ai-engine': [
      {
        icon: '🔄',
        title: 'Smart Fallback',
        description: 'MCP 실패 시 자동 전환',
        highlight: 'RAG → Google AI',
      },
      {
        icon: '💬',
        title: '대화형 AI',
        description: '자연어 서버 관리',
        highlight: '한국어 완벽 지원',
      },
      {
        icon: '📊',
        title: '실시간 분석',
        description: '서버 상태 즉시 파악',
        highlight: '문제 예측 및 해결',
      },
      {
        icon: '🧠',
        title: 'Context 학습',
        description: '사용자 패턴 학습',
        highlight: '개인화된 응답',
      },
    ],
    'fullstack-ecosystem': [
      {
        icon: '⚡',
        title: '서버리스 API',
        description: '94개 API 엔드포인트',
        highlight: '자동 스케일링',
      },
      {
        icon: '🎨',
        title: '반응형 디자인',
        description: '모든 기기에서 완벽',
        highlight: '모바일 우선',
      },
      {
        icon: '🔐',
        title: '보안 시스템',
        description: 'JWT 인증 + TLS',
        highlight: 'Enterprise급',
      },
      {
        icon: '⚡',
        title: 'SSR 최적화',
        description: '빠른 초기 로딩',
        highlight: 'SEO 최적화',
      },
    ],
    'tech-stack': [
      {
        icon: '🔷',
        title: 'TypeScript',
        description: '타입 안전성 보장',
        highlight: '컴파일 타임 오류 방지',
      },
      {
        icon: '🎨',
        title: 'TailwindCSS',
        description: 'Utility-First CSS',
        highlight: '커스텀 디자인 시스템',
      },
      {
        icon: '🎬',
        title: 'Framer Motion',
        description: '부드러운 애니메이션',
        highlight: '60fps 퍼포먼스',
      },
      {
        icon: '🗄️',
        title: 'Supabase + Redis',
        description: '하이브리드 데이터베이스',
        highlight: '실시간 + 캐싱',
      },
    ],
    'vibe-coding': [
      {
        icon: '🤖',
        title: 'Cursor AI',
        description: 'AI 페어 프로그래밍',
        highlight: 'Claude Sonnet 3.7',
      },
      {
        icon: '🔧',
        title: 'MCP Protocol',
        description: 'AI 시스템 통합',
        highlight: '다중 AI 엔진',
      },
      {
        icon: '🚀',
        title: 'CI/CD 파이프라인',
        description: '자동 배포 시스템',
        highlight: 'GitHub Actions',
      },
      {
        icon: '📝',
        title: '테스트 기반 개발',
        description: 'TDD 방식 채택',
        highlight: 'Unit + Integration',
      },
    ],
  };
  return featureMaps[cardId] || [];
};

// 실제 기술 스택 (과장 없는 실제 사용 기술)
const getTechStackCards = (cardId: string) => {
  const techMaps: {
    [key: string]: Array<{
      category: string;
      techs: Array<{ name: string; version?: string; status: string }>;
    }>;
  } = {
    'mcp-ai-engine': [
      {
        category: 'AI 엔진',
        techs: [
          { name: 'MCP Server', status: '🟢 활성' },
          { name: 'RAG Engine', status: '🟢 활성' },
          { name: 'Google AI Studio', status: '🟠 베타' },
          { name: 'Korean NLP', status: '🟢 활성' },
        ],
      },
      {
        category: '데이터 처리',
        techs: [
          { name: 'Vector Database', status: '🟢 활성' },
          { name: 'Context Manager', status: '🟢 활성' },
          { name: 'Fallback System', status: '🟢 활성' },
        ],
      },
    ],
    'fullstack-ecosystem': [
      {
        category: '프론트엔드',
        techs: [
          { name: 'Next.js', version: '15.3.3', status: '🟢 최신' },
          { name: 'React', version: '19.0', status: '🟢 최신' },
          { name: 'TypeScript', version: '5.6', status: '🟢 안정' },
        ],
      },
      {
        category: '백엔드',
        techs: [
          { name: 'Serverless APIs', status: '🟢 활성' },
          { name: 'Supabase', status: '🟢 활성' },
          { name: 'Redis (Upstash)', status: '🟢 활성' },
        ],
      },
    ],
    'tech-stack': [
      {
        category: '개발 도구',
        techs: [
          { name: 'TypeScript', version: '5.6', status: '🟢 활성' },
          { name: 'TailwindCSS', version: '3.4', status: '🟢 활성' },
          { name: 'Framer Motion', version: '11.x', status: '🟢 활성' },
        ],
      },
      {
        category: '테스팅',
        techs: [
          { name: 'Vitest', status: '🟢 활성' },
          { name: 'Playwright', status: '🟢 활성' },
          { name: 'Storybook', status: '🟠 개발' },
        ],
      },
    ],
    'vibe-coding': [
      {
        category: 'AI 도구',
        techs: [
          { name: 'Cursor IDE', status: '🟢 활성' },
          { name: 'Claude Sonnet', version: '3.7', status: '🟢 활성' },
          { name: 'MCP Protocol', status: '🟢 활성' },
        ],
      },
      {
        category: '개발 워크플로우',
        techs: [
          { name: 'GitHub Actions', status: '🟢 활성' },
          { name: 'Vercel Deploy', status: '🟢 활성' },
          { name: 'ESLint + Prettier', status: '🟢 활성' },
        ],
      },
    ],
  };
  return techMaps[cardId] || [];
};

// 성능 지표 (실제 측정 가능한 지표들)
const getPerformanceCards = (cardId: string) => {
  const performanceMaps: {
    [key: string]: Array<{
      metric: string;
      value: string;
      trend: string;
      icon: string;
      color: string;
    }>;
  } = {
    'mcp-ai-engine': [
      {
        metric: 'AI 응답 시간',
        value: '평균 2-5초',
        trend: '안정적',
        icon: '⚡',
        color: 'from-yellow-500 to-orange-500',
      },
      {
        metric: '폴백 전환',
        value: '0.5초 이내',
        trend: '신속',
        icon: '🔄',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        metric: 'Context 유지',
        value: '세션 기반',
        trend: '지속적',
        icon: '🧠',
        color: 'from-purple-500 to-pink-500',
      },
    ],
    'fullstack-ecosystem': [
      {
        metric: '빌드 시간',
        value: '~30초',
        trend: '최적화됨',
        icon: '🚀',
        color: 'from-green-500 to-emerald-500',
      },
      {
        metric: 'API 응답',
        value: '100-500ms',
        trend: '빠름',
        icon: '⚡',
        color: 'from-yellow-500 to-orange-500',
      },
      {
        metric: '페이지 생성',
        value: '97개',
        trend: '완료',
        icon: '📄',
        color: 'from-blue-500 to-cyan-500',
      },
    ],
    'tech-stack': [
      {
        metric: 'TypeScript 컴파일',
        value: '0 에러',
        trend: '안정',
        icon: '✅',
        color: 'from-green-500 to-emerald-500',
      },
      {
        metric: '번들 크기',
        value: '최적화됨',
        trend: '압축',
        icon: '📦',
        color: 'from-purple-500 to-pink-500',
      },
      {
        metric: 'DB 응답',
        value: '35-50ms',
        trend: '고속',
        icon: '🗄️',
        color: 'from-blue-500 to-cyan-500',
      },
    ],
    'vibe-coding': [
      {
        metric: '개발 속도',
        value: 'AI 가속화',
        trend: '향상',
        icon: '🚀',
        color: 'from-yellow-500 to-orange-500',
      },
      {
        metric: '코드 품질',
        value: 'ESLint 통과',
        trend: '우수',
        icon: '⭐',
        color: 'from-green-500 to-emerald-500',
      },
      {
        metric: '배포 성공률',
        value: '97개 페이지',
        trend: '성공',
        icon: '✅',
        color: 'from-blue-500 to-cyan-500',
      },
    ],
  };
  return performanceMaps[cardId] || [];
};

// 시스템 개요 카드 컴포넌트 (다크 테마 최적화)
const SystemOverviewCard = ({
  card,
  index,
  isDark = true,
}: {
  card: { icon: string; title: string; value: string; color: string };
  index: number;
  isDark?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ scale: 1.02, y: -2 }}
    className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
      isDark
        ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
        : 'bg-gray-900/5 border-gray-900/10 hover:bg-gray-900/10'
    }`}
  >
    <div className='flex items-center gap-3'>
      <div
        className={`w-12 h-12 rounded-lg bg-gradient-to-r ${card.color} flex items-center justify-center text-xl`}
      >
        {card.icon}
      </div>
      <div className='flex-1'>
        <h4
          className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          {card.value}
        </h4>
        <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
          {card.title}
        </p>
      </div>
    </div>
  </motion.div>
);

// 기능 카드 컴포넌트 (다크 테마 최적화)
const FeatureCard = ({
  feature,
  index,
  isDark = true,
}: {
  feature: {
    icon: string;
    title: string;
    description: string;
    highlight: string;
  };
  index: number;
  isDark?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ scale: 1.02, y: -2 }}
    className={`p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
      isDark
        ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
        : 'bg-gray-900/5 border-gray-900/10 hover:bg-gray-900/10'
    }`}
  >
    <div className='flex items-start gap-4'>
      <div className='text-2xl'>{feature.icon}</div>
      <div className='flex-1'>
        <h4
          className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          {feature.title}
        </h4>
        <p
          className={`text-sm mb-3 ${isDark ? 'text-white/70' : 'text-gray-700'}`}
        >
          {feature.description}
        </p>
        <div
          className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
            isDark
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}
        >
          {feature.highlight}
        </div>
      </div>
    </div>
  </motion.div>
);

// 기술 스택 카드 컴포넌트 (다크 테마 최적화)
const TechStackCard = ({
  techGroup,
  index,
  isDark = true,
}: {
  techGroup: {
    category: string;
    techs: Array<{ name: string; version?: string; status: string }>;
  };
  index: number;
  isDark?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ scale: 1.02, y: -2 }}
    className={`p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
      isDark
        ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
        : 'bg-gray-900/5 border-gray-900/10 hover:bg-gray-900/10'
    }`}
  >
    <h4
      className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}
    >
      {techGroup.category}
    </h4>
    <div className='space-y-3'>
      {techGroup.techs.map((tech, techIndex) => (
        <div key={techIndex} className='flex items-center justify-between'>
          <div>
            <span
              className={`font-medium ${isDark ? 'text-white/90' : 'text-gray-800'}`}
            >
              {tech.name}
            </span>
            {tech.version && (
              <span
                className={`ml-2 text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}
              >
                v{tech.version}
              </span>
            )}
          </div>
          <span className='text-sm'>{tech.status}</span>
        </div>
      ))}
    </div>
  </motion.div>
);

// 성능 카드 컴포넌트 (다크 테마 최적화)
const PerformanceCard = ({
  performance,
  index,
  isDark = true,
}: {
  performance: {
    metric: string;
    value: string;
    trend: string;
    icon: string;
    color: string;
  };
  index: number;
  isDark?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ scale: 1.02, y: -2 }}
    className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
      isDark
        ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
        : 'bg-gray-900/5 border-gray-900/10 hover:bg-gray-900/10'
    }`}
  >
    <div className='flex items-center gap-3'>
      <div
        className={`w-12 h-12 rounded-lg bg-gradient-to-r ${performance.color} flex items-center justify-center text-xl`}
      >
        {performance.icon}
      </div>
      <div className='flex-1'>
        <h4
          className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          {performance.value}
        </h4>
        <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
          {performance.metric}
        </p>
        <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
          {performance.trend}
        </p>
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
  isDarkMode = true, // 기본값을 다크모드로 변경
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

  // 카드별 데이터 가져오기
  const systemOverview = getSystemOverviewCards(selectedCard.id);
  const features = getFeatureCards(selectedCard.id);
  const techStack = getTechStackCards(selectedCard.id);
  const performance = getPerformanceCards(selectedCard.id);

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
          className='relative w-full max-w-6xl max-h-[90vh] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900/90 via-blue-900/20 to-purple-900/20 backdrop-blur-xl border border-white/10 shadow-2xl'
        >
          {/* 헤더 (다크 테마 최적화) */}
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
            {/* 1. 시스템 개요 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='space-y-4'
            >
              <div className='flex items-center gap-3 mb-4'>
                <div className='p-2 rounded-lg bg-blue-500/20'>
                  <Target className='w-5 h-5 text-blue-400' />
                </div>
                <h3 className='text-xl font-bold text-white'>시스템 개요</h3>
              </div>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {systemOverview.map((card, index) => (
                  <SystemOverviewCard
                    key={index}
                    card={card}
                    index={index}
                    isDark={true}
                  />
                ))}
              </div>
            </motion.div>

            {/* 2. 주요 기능 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='space-y-4'
            >
              <div className='flex items-center gap-3 mb-4'>
                <div className='p-2 rounded-lg bg-green-500/20'>
                  <Award className='w-5 h-5 text-green-400' />
                </div>
                <h3 className='text-xl font-bold text-white'>주요 기능</h3>
              </div>
              <div className='grid md:grid-cols-2 gap-4'>
                {features.map((feature, index) => (
                  <FeatureCard
                    key={index}
                    feature={feature}
                    index={index}
                    isDark={true}
                  />
                ))}
              </div>
            </motion.div>

            {/* 3. 기술 스택 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className='space-y-4'
            >
              <div className='flex items-center gap-3 mb-4'>
                <div className='p-2 rounded-lg bg-purple-500/20'>
                  <Layers className='w-5 h-5 text-purple-400' />
                </div>
                <h3 className='text-xl font-bold text-white'>기술 스택</h3>
              </div>
              <div className='grid md:grid-cols-2 gap-4'>
                {techStack.map((techGroup, index) => (
                  <TechStackCard
                    key={index}
                    techGroup={techGroup}
                    index={index}
                    isDark={true}
                  />
                ))}
              </div>
            </motion.div>

            {/* 4. 성능 지표 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className='space-y-4'
            >
              <div className='flex items-center gap-3 mb-4'>
                <div className='p-2 rounded-lg bg-yellow-500/20'>
                  <TrendingUp className='w-5 h-5 text-yellow-400' />
                </div>
                <h3 className='text-xl font-bold text-white'>성능 지표</h3>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {performance.map((perf, index) => (
                  <PerformanceCard
                    key={index}
                    performance={perf}
                    index={index}
                    isDark={true}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
