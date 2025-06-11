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

// 시스템 개요 카드 데이터
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
        title: 'AI 엔진',
        value: '11개 통합',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        icon: '⚡',
        title: '응답시간',
        value: '<100ms',
        color: 'from-yellow-500 to-orange-500',
      },
      {
        icon: '🛡️',
        title: '가용성',
        value: '99.9%',
        color: 'from-green-500 to-emerald-500',
      },
      {
        icon: '📊',
        title: '처리량',
        value: '1K/분',
        color: 'from-purple-500 to-pink-500',
      },
    ],
    'fullstack-ecosystem': [
      {
        icon: '🌐',
        title: '프레임워크',
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
        value: '100%',
        color: 'from-purple-500 to-pink-500',
      },
      {
        icon: '⚡',
        title: '성능',
        value: 'A+ 등급',
        color: 'from-yellow-500 to-orange-500',
      },
    ],
    'tech-stack': [
      {
        icon: '💻',
        title: '언어',
        value: 'TypeScript',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        icon: '🎨',
        title: 'UI/UX',
        value: 'Tailwind',
        color: 'from-pink-500 to-rose-500',
      },
      {
        icon: '📊',
        title: 'DB',
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
        value: 'Cursor',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        icon: '⚡',
        title: '개발속도',
        value: '6배 향상',
        color: 'from-yellow-500 to-orange-500',
      },
      {
        icon: '🧪',
        title: '테스트',
        value: '97% 통과',
        color: 'from-green-500 to-emerald-500',
      },
      {
        icon: '🏆',
        title: '품질',
        value: 'S등급',
        color: 'from-purple-500 to-pink-500',
      },
    ],
  };
  return overviewMaps[cardId] || [];
};

// 주요 기능 카드 데이터
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
        description: '3단계 폴백 시스템',
        highlight: 'MCP → RAG → Google AI',
      },
      {
        icon: '🧠',
        title: 'Multi-AI 융합',
        description: '11개 AI 엔진 통합',
        highlight: '실시간 협업',
      },
      {
        icon: '📊',
        title: '실시간 분석',
        description: '서버 상태 즉시 분석',
        highlight: '예측 정확도 95%',
      },
      {
        icon: '🌐',
        title: '한국어 특화',
        description: 'Korean NLP 최적화',
        highlight: '완벽한 한글 지원',
      },
    ],
    'fullstack-ecosystem': [
      {
        icon: '⚡',
        title: '서버리스 API',
        description: '무제한 확장성',
        highlight: '자동 스케일링',
      },
      {
        icon: '🎨',
        title: '반응형 UI',
        description: '모든 디바이스 지원',
        highlight: '완벽한 모바일',
      },
      {
        icon: '🔒',
        title: '보안 강화',
        description: 'Enterprise급 보안',
        highlight: 'JWT + TLS',
      },
      {
        icon: '📱',
        title: 'PWA 지원',
        description: '앱처럼 사용',
        highlight: '오프라인 동작',
      },
    ],
    'tech-stack': [
      {
        icon: '🎯',
        title: 'TypeScript',
        description: '타입 안전성 100%',
        highlight: '런타임 오류 0',
      },
      {
        icon: '🎨',
        title: 'TailwindCSS',
        description: '고도화된 스타일링',
        highlight: '커스텀 디자인',
      },
      {
        icon: '🔄',
        title: 'Framer Motion',
        description: '부드러운 애니메이션',
        highlight: '60fps 성능',
      },
      {
        icon: '📊',
        title: 'Chart.js',
        description: '데이터 시각화',
        highlight: '실시간 차트',
      },
    ],
    'vibe-coding': [
      {
        icon: '🚀',
        title: 'AI 가속 개발',
        description: 'Cursor + Claude',
        highlight: '6배 빠른 개발',
      },
      {
        icon: '🔄',
        title: 'MCP 시스템',
        description: '도구 체인 통합',
        highlight: '6개 서버 연동',
      },
      {
        icon: '🧪',
        title: 'TDD 접근',
        description: '테스트 우선 개발',
        highlight: '97% 커버리지',
      },
      {
        icon: '📋',
        title: 'Git 워크플로우',
        description: '자동화된 배포',
        highlight: 'CI/CD 완성',
      },
    ],
  };
  return featureMaps[cardId] || [];
};

// 기술 스택 카드 데이터
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
          { name: 'Google AI Studio', version: 'Beta', status: 'active' },
          { name: 'MCP Protocol', version: 'v1.0', status: 'active' },
          { name: 'Local RAG', version: 'v2.0', status: 'active' },
        ],
      },
      {
        category: '데이터베이스',
        techs: [
          { name: 'Supabase', version: 'v2.33', status: 'active' },
          { name: 'Upstash Redis', version: '6.2', status: 'active' },
          { name: 'Vector DB', version: 'pgvector', status: 'active' },
        ],
      },
    ],
    'fullstack-ecosystem': [
      {
        category: '프론트엔드',
        techs: [
          { name: 'Next.js', version: '15.3', status: 'active' },
          { name: 'React', version: '19', status: 'active' },
          { name: 'TypeScript', version: '5.0', status: 'active' },
        ],
      },
      {
        category: '백엔드',
        techs: [
          { name: 'Serverless API', status: 'active' },
          { name: 'WebSocket', status: 'active' },
          { name: 'Cron Jobs', status: 'active' },
        ],
      },
    ],
    'tech-stack': [
      {
        category: '개발 도구',
        techs: [
          { name: 'TypeScript', version: '5.0', status: 'active' },
          { name: 'ESLint', version: '8.0', status: 'active' },
          { name: 'Prettier', version: '3.0', status: 'active' },
        ],
      },
      {
        category: 'UI 라이브러리',
        techs: [
          { name: 'TailwindCSS', version: '3.4', status: 'active' },
          { name: 'Framer Motion', version: '11.0', status: 'active' },
          { name: 'Lucide Icons', version: '0.4', status: 'active' },
        ],
      },
    ],
    'vibe-coding': [
      {
        category: 'AI 도구',
        techs: [
          { name: 'Cursor IDE', status: 'active' },
          { name: 'Claude Sonnet', version: '3.7', status: 'active' },
          { name: 'GitHub Copilot', status: 'active' },
        ],
      },
      {
        category: '배포 자동화',
        techs: [
          { name: 'Vercel', status: 'active' },
          { name: 'GitHub Actions', status: 'active' },
          { name: 'Husky', version: '9.0', status: 'active' },
        ],
      },
    ],
  };
  return techMaps[cardId] || [];
};

// 성능 지표 카드 데이터
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
        metric: 'AI 응답시간',
        value: '<100ms',
        trend: '+85%',
        icon: '⚡',
        color: 'from-yellow-500 to-orange-500',
      },
      {
        metric: '예측 정확도',
        value: '95.2%',
        trend: '+12%',
        icon: '🎯',
        color: 'from-green-500 to-emerald-500',
      },
      {
        metric: '시스템 가용성',
        value: '99.9%',
        trend: '+2%',
        icon: '🛡️',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        metric: 'AI 융합 속도',
        value: '2.1초',
        trend: '+60%',
        icon: '🔄',
        color: 'from-purple-500 to-pink-500',
      },
    ],
    'fullstack-ecosystem': [
      {
        metric: 'Lighthouse 점수',
        value: '98/100',
        trend: '+15%',
        icon: '🚀',
        color: 'from-green-500 to-emerald-500',
      },
      {
        metric: '번들 크기',
        value: '102KB',
        trend: '-30%',
        icon: '📦',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        metric: '로딩 시간',
        value: '1.2초',
        trend: '-45%',
        icon: '⚡',
        color: 'from-yellow-500 to-orange-500',
      },
      {
        metric: 'Core Web Vitals',
        value: 'Good',
        trend: '100%',
        icon: '📊',
        color: 'from-purple-500 to-pink-500',
      },
    ],
    'tech-stack': [
      {
        metric: 'TypeScript 커버리지',
        value: '100%',
        trend: '완성',
        icon: '🎯',
        color: 'from-green-500 to-emerald-500',
      },
      {
        metric: '테스트 통과율',
        value: '97.1%',
        trend: '+5%',
        icon: '🧪',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        metric: '빌드 시간',
        value: '22초',
        trend: '-40%',
        icon: '⚡',
        color: 'from-yellow-500 to-orange-500',
      },
      {
        metric: '코드 품질',
        value: 'A+',
        trend: '최고',
        icon: '🏆',
        color: 'from-purple-500 to-pink-500',
      },
    ],
    'vibe-coding': [
      {
        metric: '개발 속도',
        value: '6배',
        trend: '+500%',
        icon: '🚀',
        color: 'from-green-500 to-emerald-500',
      },
      {
        metric: '코드 품질',
        value: 'S등급',
        trend: '최고',
        icon: '💎',
        color: 'from-purple-500 to-pink-500',
      },
      {
        metric: 'AI 활용도',
        value: '95%',
        trend: '+80%',
        icon: '🤖',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        metric: '완성도',
        value: '98%',
        trend: '프로덕션',
        icon: '✨',
        color: 'from-yellow-500 to-orange-500',
      },
    ],
  };
  return performanceMaps[cardId] || [];
};

// 시스템 개요 카드 컴포넌트
const SystemOverviewCard = ({
  card,
  index,
  isDark = false,
}: {
  card: { icon: string; title: string; value: string; color: string };
  index: number;
  isDark?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 + index * 0.05 }}
    className={`relative overflow-hidden rounded-xl p-4 ${
      isDark
        ? 'bg-gray-800/50 border border-gray-700/50'
        : 'bg-white/50 border border-white/20'
    } backdrop-blur-sm`}
  >
    <div
      className={`absolute inset-0 bg-gradient-to-r ${card.color} opacity-10`}
    ></div>
    <div className='relative z-10'>
      <div className='text-3xl mb-2'>{card.icon}</div>
      <h4
        className={`font-semibold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
      >
        {card.title}
      </h4>
      <p
        className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
      >
        {card.value}
      </p>
    </div>
  </motion.div>
);

// 주요 기능 카드 컴포넌트
const FeatureCard = ({
  feature,
  index,
  isDark = false,
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
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.2 + index * 0.1 }}
    whileHover={{ scale: 1.02, y: -2 }}
    className={`group p-4 rounded-xl transition-all duration-300 ${
      isDark
        ? 'bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/30'
        : 'bg-white/30 hover:bg-white/50 border border-white/30'
    } backdrop-blur-sm`}
  >
    <div className='flex items-start gap-4'>
      <div className='text-2xl'>{feature.icon}</div>
      <div className='flex-1'>
        <h4
          className={`font-semibold text-base mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          {feature.title}
        </h4>
        <p
          className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
        >
          {feature.description}
        </p>
        <span
          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
            isDark
              ? 'bg-blue-500/20 text-blue-300'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {feature.highlight}
        </span>
      </div>
    </div>
  </motion.div>
);

// 기술 스택 카드 컴포넌트
const TechStackCard = ({
  techGroup,
  index,
  isDark = false,
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
    transition={{ delay: 0.4 + index * 0.1 }}
    className={`p-4 rounded-xl ${
      isDark
        ? 'bg-gray-800/40 border border-gray-700/40'
        : 'bg-white/40 border border-white/40'
    } backdrop-blur-sm`}
  >
    <h4
      className={`font-semibold text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
    >
      {techGroup.category}
    </h4>
    <div className='space-y-2'>
      {techGroup.techs.map((tech, techIndex) => (
        <div key={techIndex} className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div
              className={`w-2 h-2 rounded-full ${
                tech.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
              }`}
            ></div>
            <span
              className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              {tech.name}
            </span>
          </div>
          {tech.version && (
            <span
              className={`text-xs px-2 py-1 rounded ${
                isDark
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tech.version}
            </span>
          )}
        </div>
      ))}
    </div>
  </motion.div>
);

// 성능 지표 카드 컴포넌트
const PerformanceCard = ({
  performance,
  index,
  isDark = false,
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
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.6 + index * 0.1 }}
    whileHover={{ scale: 1.05 }}
    className={`relative overflow-hidden p-4 rounded-xl ${
      isDark
        ? 'bg-gray-800/50 border border-gray-700/50'
        : 'bg-white/50 border border-white/20'
    } backdrop-blur-sm`}
  >
    <div
      className={`absolute inset-0 bg-gradient-to-r ${performance.color} opacity-5`}
    ></div>
    <div className='relative z-10 text-center'>
      <div className='text-2xl mb-2'>{performance.icon}</div>
      <h4
        className={`font-medium text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
      >
        {performance.metric}
      </h4>
      <p
        className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}
      >
        {performance.value}
      </p>
      <span
        className={`text-xs font-medium ${
          performance.trend.includes('+')
            ? 'text-green-500'
            : performance.trend.includes('-')
              ? 'text-blue-500'
              : 'text-purple-500'
        }`}
      >
        {performance.trend}
      </span>
    </div>
  </motion.div>
);

export default function FeatureCardModal({
  selectedCard,
  onClose,
  renderTextWithAIGradient,
  modalRef,
  variant = 'home',
  isDarkMode = false,
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
      {/* 그라데이션 오버레이 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20'
            : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
        }`}
        onClick={onClose}
      >
        <motion.div
          ref={modalRef}
          variants={modalVariants}
          initial='hidden'
          animate='visible'
          exit='exit'
          onClick={e => e.stopPropagation()}
          className={`relative w-full max-w-6xl max-h-[90vh] rounded-2xl overflow-hidden ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-900/95 via-blue-900/10 to-purple-900/10'
              : 'bg-gradient-to-br from-white/95 via-blue-50/30 to-purple-50/30'
          } backdrop-blur-xl border ${
            isDarkMode ? 'border-gray-700/50' : 'border-white/50'
          } shadow-2xl`}
        >
          {/* 헤더 */}
          <div
            className={`p-6 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-white/50'}`}
          >
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
                  <h2
                    className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {selectedCard.title}
                  </h2>
                  <p
                    className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {selectedCard.subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isDarkMode
                    ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <X className='w-6 h-6' />
              </button>
            </div>
          </div>

          {/* 스크롤 가능한 콘텐츠 영역 */}
          <div className='overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-8 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-500'>
            {/* 1. 시스템 개요 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className='space-y-4'
            >
              <div className='flex items-center gap-3 mb-4'>
                <div
                  className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}
                >
                  <Target
                    className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                  />
                </div>
                <h3
                  className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  시스템 개요
                </h3>
              </div>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {systemOverview.map((card, index) => (
                  <SystemOverviewCard
                    key={index}
                    card={card}
                    index={index}
                    isDark={isDarkMode}
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
                <div
                  className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'}`}
                >
                  <Award
                    className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                  />
                </div>
                <h3
                  className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  주요 기능
                </h3>
              </div>
              <div className='grid md:grid-cols-2 gap-4'>
                {features.map((feature, index) => (
                  <FeatureCard
                    key={index}
                    feature={feature}
                    index={index}
                    isDark={isDarkMode}
                  />
                ))}
              </div>
            </motion.div>

            {/* 3. 기술 스택 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className='space-y-4'
            >
              <div className='flex items-center gap-3 mb-4'>
                <div
                  className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}
                >
                  <Layers
                    className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}
                  />
                </div>
                <h3
                  className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  기술 스택
                </h3>
              </div>
              <div className='grid md:grid-cols-2 gap-4'>
                {techStack.map((techGroup, index) => (
                  <TechStackCard
                    key={index}
                    techGroup={techGroup}
                    index={index}
                    isDark={isDarkMode}
                  />
                ))}
              </div>
            </motion.div>

            {/* 4. 성능 지표 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className='space-y-4'
            >
              <div className='flex items-center gap-3 mb-4'>
                <div
                  className={`p-2 rounded-lg ${isDarkMode ? 'bg-orange-500/20' : 'bg-orange-100'}`}
                >
                  <Rocket
                    className={`w-5 h-5 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}
                  />
                </div>
                <h3
                  className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  성능 지표
                </h3>
              </div>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {performance.map((perf, index) => (
                  <PerformanceCard
                    key={index}
                    performance={perf}
                    index={index}
                    isDark={isDarkMode}
                  />
                ))}
              </div>
            </motion.div>

            {/* 완료 메시지 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className='text-center py-8'
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: 'easeInOut',
                }}
                className='text-4xl mb-2'
              >
                ✨
              </motion.div>
              <p
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
              >
                모든 정보를 확인했습니다
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
