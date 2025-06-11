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
  Package,
  Wrench,
  Palette,
  Terminal,
} from 'lucide-react';

interface FeatureCardModalProps {
  selectedCard: any;
  onClose: () => void;
  renderTextWithAIGradient: (text: string) => React.ReactNode;
  modalRef: React.RefObject<HTMLDivElement>;
  variant?: 'home' | 'landing';
  isDarkMode?: boolean;
}

// 기술 분류 및 중요도 등급 시스템
type TechCategory =
  | 'framework'
  | 'language'
  | 'database'
  | 'ai'
  | 'opensource'
  | 'custom'
  | 'deployment'
  | 'ui';
type ImportanceLevel = 'critical' | 'high' | 'medium' | 'low';

interface TechItem {
  name: string;
  category: TechCategory;
  importance: ImportanceLevel;
  description: string;
  version?: string;
  status: 'active' | 'ready' | 'planned';
  icon: string;
  tags: string[];
}

// 현재 사용 기술 스택 (실제 구현 기준)
const getCurrentTechStack = (cardId: string): TechItem[] => {
  const techStacks: { [key: string]: TechItem[] } = {
    'mcp-ai-engine': [
      {
        name: 'Model Context Protocol',
        category: 'ai',
        importance: 'critical',
        description: 'Cursor IDE와 직접 연동되는 AI 통신 프로토콜',
        version: '1.0',
        status: 'active',
        icon: '🧠',
        tags: ['AI', '자체개발', '프로토콜'],
      },
      {
        name: 'Claude Sonnet 3.5',
        category: 'ai',
        importance: 'critical',
        description: 'Anthropic의 최신 AI 모델',
        status: 'active',
        icon: '🤖',
        tags: ['AI', '외부API', '언어모델'],
      },
      {
        name: 'Google AI Studio',
        category: 'ai',
        importance: 'high',
        description: 'Gemini 모델 기반 폴백 시스템',
        status: 'active',
        icon: '🔄',
        tags: ['AI', '외부API', '폴백'],
      },
      {
        name: 'RAG Engine',
        category: 'ai',
        importance: 'high',
        description: '문서 기반 검색 증강 생성',
        status: 'active',
        icon: '📚',
        tags: ['AI', '자체개발', '검색'],
      },
      {
        name: 'Korean NLP Utils',
        category: 'language',
        importance: 'medium',
        description: '한국어 자연어 처리 라이브러리',
        status: 'active',
        icon: '🇰🇷',
        tags: ['언어', '오픈소스', 'NLP'],
      },
    ],
    'fullstack-ecosystem': [
      {
        name: 'Next.js',
        category: 'framework',
        importance: 'critical',
        description: 'React 기반 풀스택 프레임워크',
        version: '15.3.3',
        status: 'active',
        icon: '⚛️',
        tags: ['프레임워크', '오픈소스', 'React'],
      },
      {
        name: 'TypeScript',
        category: 'language',
        importance: 'critical',
        description: '타입 안전성을 보장하는 JavaScript 확장',
        version: '5.0+',
        status: 'active',
        icon: '🔷',
        tags: ['언어', '오픈소스', '타입안전'],
      },
      {
        name: 'Supabase',
        category: 'database',
        importance: 'critical',
        description: 'PostgreSQL 기반 백엔드 서비스',
        status: 'active',
        icon: '🗄️',
        tags: ['데이터베이스', '외부서비스', 'PostgreSQL'],
      },
      {
        name: 'Upstash Redis',
        category: 'database',
        importance: 'high',
        description: '서버리스 Redis 캐싱 시스템',
        status: 'active',
        icon: '⚡',
        tags: ['캐시', '외부서비스', 'Redis'],
      },
      {
        name: 'Vercel',
        category: 'deployment',
        importance: 'high',
        description: '자동 배포 및 호스팅 플랫폼',
        status: 'active',
        icon: '🚀',
        tags: ['배포', '외부서비스', 'CI/CD'],
      },
    ],
    'tech-stack': [
      {
        name: 'TailwindCSS',
        category: 'ui',
        importance: 'high',
        description: 'Utility-first CSS 프레임워크',
        version: '3.4+',
        status: 'active',
        icon: '🎨',
        tags: ['UI', '오픈소스', 'CSS'],
      },
      {
        name: 'Framer Motion',
        category: 'ui',
        importance: 'medium',
        description: 'React 애니메이션 라이브러리',
        status: 'active',
        icon: '🎬',
        tags: ['애니메이션', '오픈소스', 'React'],
      },
      {
        name: 'Lucide React',
        category: 'ui',
        importance: 'medium',
        description: '아이콘 라이브러리',
        status: 'active',
        icon: '🎯',
        tags: ['아이콘', '오픈소스', 'UI'],
      },
      {
        name: 'Zustand',
        category: 'framework',
        importance: 'medium',
        description: '상태 관리 라이브러리',
        status: 'active',
        icon: '🔄',
        tags: ['상태관리', '오픈소스', 'React'],
      },
      {
        name: 'ESLint + Prettier',
        category: 'custom',
        importance: 'medium',
        description: '코드 품질 및 포맷팅 도구',
        status: 'active',
        icon: '🔧',
        tags: ['개발도구', '오픈소스', '품질관리'],
      },
    ],
    'vibe-coding': [
      {
        name: 'Cursor IDE',
        category: 'custom',
        importance: 'critical',
        description: 'AI 페어 프로그래밍 IDE',
        status: 'active',
        icon: '💻',
        tags: ['IDE', '외부도구', 'AI'],
      },
      {
        name: 'Git + GitHub',
        category: 'custom',
        importance: 'critical',
        description: '버전 관리 및 협업 플랫폼',
        status: 'active',
        icon: '📝',
        tags: ['버전관리', '외부서비스', '협업'],
      },
      {
        name: 'Husky + Lint-staged',
        category: 'custom',
        importance: 'high',
        description: 'Git 훅 기반 자동화 도구',
        status: 'active',
        icon: '🐕',
        tags: ['자동화', '오픈소스', 'Git'],
      },
      {
        name: 'Custom MCP Server',
        category: 'custom',
        importance: 'high',
        description: '자체 개발 MCP 서버 구현',
        status: 'active',
        icon: '🛠️',
        tags: ['자체개발', 'MCP', '서버'],
      },
      {
        name: 'OpenManager Engine',
        category: 'custom',
        importance: 'high',
        description: '서버 모니터링 자체 엔진',
        status: 'active',
        icon: '📊',
        tags: ['자체개발', '모니터링', '엔진'],
      },
    ],
  };

  return techStacks[cardId] || [];
};

// 중요도별 색상 및 스타일
const getImportanceStyle = (importance: ImportanceLevel) => {
  const styles = {
    critical: {
      bg: 'bg-red-500/20 border-red-500/40',
      text: 'text-red-300',
      badge: 'bg-red-500/30 text-red-200',
      label: '필수',
    },
    high: {
      bg: 'bg-orange-500/20 border-orange-500/40',
      text: 'text-orange-300',
      badge: 'bg-orange-500/30 text-orange-200',
      label: '중요',
    },
    medium: {
      bg: 'bg-blue-500/20 border-blue-500/40',
      text: 'text-blue-300',
      badge: 'bg-blue-500/30 text-blue-200',
      label: '보통',
    },
    low: {
      bg: 'bg-gray-500/20 border-gray-500/40',
      text: 'text-gray-300',
      badge: 'bg-gray-500/30 text-gray-200',
      label: '낮음',
    },
  };
  return styles[importance];
};

// 카테고리별 색상
const getCategoryStyle = (category: TechCategory) => {
  const styles = {
    framework: { color: 'text-purple-400', bg: 'bg-purple-500/10' },
    language: { color: 'text-green-400', bg: 'bg-green-500/10' },
    database: { color: 'text-blue-400', bg: 'bg-blue-500/10' },
    ai: { color: 'text-pink-400', bg: 'bg-pink-500/10' },
    opensource: { color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    custom: { color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    deployment: { color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    ui: { color: 'text-teal-400', bg: 'bg-teal-500/10' },
  };
  return styles[category];
};

// 기술 카드 컴포넌트
const TechCard = ({ tech, index }: { tech: TechItem; index: number }) => {
  const importanceStyle = getImportanceStyle(tech.importance);
  const categoryStyle = getCategoryStyle(tech.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
      className={`group relative p-5 rounded-2xl border ${importanceStyle.bg} hover:scale-[1.02] transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer overflow-hidden`}
    >
      {/* 배경 그라데이션 효과 */}
      <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

      {/* 헤더 섹션 */}
      <div className='relative flex items-start justify-between mb-4'>
        <div className='flex items-center gap-3 flex-1 min-w-0'>
          {/* 개선된 아이콘 컨테이너 */}
          <div className='w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300'>
            {renderIcon(tech.icon)}
          </div>
          <div className='flex-1 min-w-0'>
            <h4 className='font-semibold text-white text-sm sm:text-base truncate group-hover:text-blue-300 transition-colors'>
              {tech.name}
            </h4>
            {tech.version && (
              <span className='text-xs text-gray-400 font-mono'>
                v{tech.version}
              </span>
            )}
          </div>
        </div>

        {/* 배지 섹션 */}
        <div className='flex flex-col gap-1.5 items-end flex-shrink-0'>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${importanceStyle.badge} shadow-sm`}
          >
            {importanceStyle.label}
          </span>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.color} shadow-sm`}
          >
            {tech.category}
          </span>
        </div>
      </div>

      {/* 설명 섹션 */}
      <div className='relative mb-4'>
        <p className='text-gray-300 text-xs sm:text-sm leading-relaxed line-clamp-2 group-hover:text-gray-200 transition-colors'>
          {tech.description}
        </p>
      </div>

      {/* 상태 표시 */}
      <div className='relative flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <div
            className={`w-2 h-2 rounded-full ${
              tech.status === 'active'
                ? 'bg-green-400'
                : tech.status === 'ready'
                  ? 'bg-yellow-400'
                  : 'bg-gray-400'
            }`}
          />
          <span className='text-xs text-gray-400 capitalize'>
            {tech.status}
          </span>
        </div>
      </div>

      {/* 태그 섹션 */}
      <div className='relative flex flex-wrap gap-1.5'>
        {tech.tags.slice(0, 3).map((tag, tagIndex) => (
          <span
            key={tagIndex}
            className='px-2 py-1 bg-gray-700/50 text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-600/50 transition-colors'
          >
            {tag}
          </span>
        ))}
        {tech.tags.length > 3 && (
          <span className='px-2 py-1 bg-gray-700/30 text-gray-400 rounded-lg text-xs'>
            +{tech.tags.length - 3}
          </span>
        )}
      </div>
    </motion.div>
  );
};

// icon 안전 렌더링 헬퍼
const renderIcon = (icon: any) => {
  if (!icon) return <Package className='w-6 h-6 text-gray-400' />;
  // 문자열(이모지) 그대로 출력
  if (typeof icon === 'string') return <span className='text-xl'>{icon}</span>;
  // 이미 ReactElement 이면 그대로
  if (React.isValidElement(icon)) return icon;
  // 함수형 컴포넌트(예: Lucide 아이콘)면 JSX로 렌더
  if (typeof icon === 'function') {
    const IconComp = icon;
    return <IconComp className='w-6 h-6 text-white' />;
  }
  // 기타 객체는 기본 아이콘으로 대체
  return <Package className='w-6 h-6 text-gray-400' />;
};

export default function FeatureCardModal({
  selectedCard,
  onClose,
  renderTextWithAIGradient,
  modalRef,
  variant = 'home',
  isDarkMode = true,
}: FeatureCardModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tech'>('overview');
  const techStack = getCurrentTechStack(selectedCard?.id || '');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!selectedCard) return null;

  // 중요도별 기술 분류
  const criticalTech = techStack.filter(tech => tech.importance === 'critical');
  const highTech = techStack.filter(tech => tech.importance === 'high');
  const mediumTech = techStack.filter(tech => tech.importance === 'medium');
  const lowTech = techStack.filter(tech => tech.importance === 'low');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4'
        onClick={onClose}
      >
        {/* 개선된 배경 블러 효과 */}
        <div className='absolute inset-0 bg-black/85 backdrop-blur-sm' />

        {/* 개선된 모달 컨텐츠 */}
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className='relative w-full max-w-5xl max-h-[95vh] bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-3xl border border-gray-600/50 shadow-2xl overflow-hidden'
          onClick={e => e.stopPropagation()}
        >
          {/* 개선된 헤더 */}
          <div className='relative flex items-center justify-between p-6 sm:p-8 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50'>
            <div className='flex items-center gap-4 sm:gap-6'>
              {/* 개선된 아이콘 컨테이너 */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                className='w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-blue-400/20'
              >
                {renderIcon(selectedCard.icon)}
              </motion.div>
              <div className='flex-1 min-w-0'>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className='text-xl sm:text-2xl font-bold text-white mb-1 truncate'
                >
                  {renderTextWithAIGradient(selectedCard.title)}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className='text-gray-300 text-sm sm:text-base line-clamp-2'
                >
                  {selectedCard.description}
                </motion.p>
              </div>
            </div>
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              onClick={onClose}
              className='p-2 sm:p-3 hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:scale-105 group'
            >
              <X className='w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-white transition-colors' />
            </motion.button>
          </div>

          {/* 개선된 탭 네비게이션 */}
          <div className='flex border-b border-gray-700/50 bg-gray-800/30'>
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-medium transition-all duration-300 relative ${
                activeTab === 'overview'
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
            >
              개요
              {activeTab === 'overview' && (
                <motion.div
                  layoutId='activeTab'
                  className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500'
                />
              )}
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={() => setActiveTab('tech')}
              className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-medium transition-all duration-300 relative ${
                activeTab === 'tech'
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
            >
              기술 스택 ({techStack.length})
              {activeTab === 'tech' && (
                <motion.div
                  layoutId='activeTab'
                  className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500'
                />
              )}
            </motion.button>
          </div>

          {/* 개선된 컨텐츠 - 스크롤 최적화 */}
          <div
            className='overflow-y-auto'
            style={{ maxHeight: 'calc(95vh - 200px)' }}
          >
            <div className='p-4 sm:p-6 lg:p-8'>
              <AnimatePresence mode='wait'>
                {activeTab === 'overview' && (
                  <motion.div
                    key='overview'
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className='space-y-6 sm:space-y-8'
                  >
                    {/* 상세 정보 섹션 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className='bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700/30'
                    >
                      <h3 className='text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2'>
                        <Monitor className='w-5 h-5 text-blue-400' />
                        {selectedCard.title} 상세 정보
                      </h3>
                      <p className='text-gray-300 leading-relaxed text-sm sm:text-base'>
                        {selectedCard.longDescription ||
                          selectedCard.description}
                      </p>
                    </motion.div>

                    {/* 주요 특징 섹션 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className='bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700/30'
                    >
                      <h4 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
                        <CheckCircle className='w-5 h-5 text-green-400' />
                        주요 특징
                      </h4>
                      <div className='grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4'>
                        {selectedCard.features &&
                        selectedCard.features.length > 0 ? (
                          selectedCard.features.map(
                            (feature: string, index: number) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                className='flex items-start gap-3 p-3 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-colors'
                              >
                                <CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0 mt-0.5' />
                                <span className='text-gray-300 text-sm leading-relaxed'>
                                  {feature}
                                </span>
                              </motion.div>
                            )
                          )
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className='flex items-center gap-3 p-3 rounded-xl bg-gray-700/30'
                          >
                            <CheckCircle className='w-4 h-4 text-green-400' />
                            <span className='text-gray-300 text-sm'>
                              실제 구현된 기능 기반
                            </span>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {activeTab === 'tech' && (
                  <motion.div
                    key='tech'
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className='space-y-6 sm:space-y-8'
                  >
                    {/* 필수 기술 */}
                    {criticalTech.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <h3 className='text-lg sm:text-xl font-semibold text-red-300 mb-4 sm:mb-6 flex items-center gap-2'>
                          <Star className='w-5 h-5' />
                          필수 기술 ({criticalTech.length})
                        </h3>
                        <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'>
                          {criticalTech.map((tech, index) => (
                            <motion.div
                              key={tech.name}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 + index * 0.1 }}
                            >
                              <TechCard tech={tech} index={index} />
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* 중요 기술 */}
                    {highTech.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <h3 className='text-lg sm:text-xl font-semibold text-orange-300 mb-4 sm:mb-6 flex items-center gap-2'>
                          <Zap className='w-5 h-5' />
                          중요 기술 ({highTech.length})
                        </h3>
                        <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'>
                          {highTech.map((tech, index) => (
                            <motion.div
                              key={tech.name}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 + index * 0.1 }}
                            >
                              <TechCard tech={tech} index={index} />
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* 보통 기술 */}
                    {mediumTech.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <h3 className='text-lg sm:text-xl font-semibold text-blue-300 mb-4 sm:mb-6 flex items-center gap-2'>
                          <Package className='w-5 h-5' />
                          보통 기술 ({mediumTech.length})
                        </h3>
                        <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'>
                          {mediumTech.map((tech, index) => (
                            <motion.div
                              key={tech.name}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 + index * 0.1 }}
                            >
                              <TechCard tech={tech} index={index} />
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* 낮은 우선순위 기술 */}
                    {lowTech.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        <h3 className='text-lg sm:text-xl font-semibold text-gray-300 mb-4 sm:mb-6 flex items-center gap-2'>
                          <Layers className='w-5 h-5' />
                          기타 기술 ({lowTech.length})
                        </h3>
                        <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'>
                          {lowTech.map((tech, index) => (
                            <motion.div
                              key={tech.name}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.8 + index * 0.1 }}
                            >
                              <TechCard tech={tech} index={index} />
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
