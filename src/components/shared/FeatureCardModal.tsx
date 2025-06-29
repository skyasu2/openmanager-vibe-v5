'use client';

import React, { useEffect } from 'react';
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

// 기술 카테고리 타입
type TechCategory =
  | 'framework'
  | 'language'
  | 'database'
  | 'ai'
  | 'opensource'
  | 'custom'
  | 'deployment'
  | 'ui';

// 중요도 레벨 타입
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
        name: 'AI 자연어 처리 MCP',
        category: 'ai',
        importance: 'critical',
        description: 'AI 시스템 간 통신을 위한 컨텍스트 기반 자연어 처리',
        version: '1.0',
        status: 'active',
        icon: '🧠',
        tags: ['AI', 'MCP', '자연어처리'],
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
        name: 'Vector Database',
        category: 'ai',
        importance: 'high',
        description: 'AI 임베딩 벡터 저장 및 유사도 검색',
        status: 'active',
        icon: '🔍',
        tags: ['벡터DB', '임베딩', '검색'],
      },
      {
        name: 'ML Pipeline',
        category: 'ai',
        importance: 'medium',
        description: '머신러닝 모델 훈련 및 추론 파이프라인',
        status: 'active',
        icon: '🤖',
        tags: ['ML', '파이프라인', '추론'],
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
        name: 'TypeScript',
        category: 'language',
        importance: 'critical',
        description: '타입 안전성을 제공하는 JavaScript 확장',
        version: '5.0',
        status: 'active',
        icon: '📘',
        tags: ['언어', '타입안전성', '개발도구'],
      },
      {
        name: 'JavaScript ES2024',
        category: 'language',
        importance: 'critical',
        description: '최신 ECMAScript 표준 기반 개발',
        version: 'ES2024',
        status: 'active',
        icon: '💛',
        tags: ['언어', '표준', '모던'],
      },

      {
        name: 'SQL',
        category: 'language',
        importance: 'high',
        description: 'PostgreSQL 기반 데이터베이스 쿼리',
        status: 'active',
        icon: '🗃️',
        tags: ['언어', '데이터베이스', '쿼리'],
      },
      {
        name: 'HTML5/CSS3',
        category: 'language',
        importance: 'medium',
        description: '웹 표준 마크업 및 스타일링',
        status: 'active',
        icon: '🌐',
        tags: ['언어', '웹표준', '마크업'],
      },
    ],
    'tech-stack': [
      {
        name: 'Next.js 15',
        category: 'framework',
        importance: 'critical',
        description: 'React 기반 풀스택 프레임워크',
        version: '15.0',
        status: 'active',
        icon: '⚡',
        tags: ['프레임워크', 'React', 'SSR'],
      },
      {
        name: 'React 19',
        category: 'framework',
        importance: 'critical',
        description: '최신 React 라이브러리',
        version: '19.0',
        status: 'active',
        icon: '⚛️',
        tags: ['UI', '컴포넌트', '상태관리'],
      },
      {
        name: 'Tailwind CSS',
        category: 'ui',
        importance: 'high',
        description: '유틸리티 우선 CSS 프레임워크',
        version: '3.4',
        status: 'active',
        icon: '🎨',
        tags: ['CSS', '디자인', '반응형'],
      },
      {
        name: 'Framer Motion',
        category: 'ui',
        importance: 'high',
        description: 'React용 애니메이션 라이브러리',
        version: '11.0',
        status: 'active',
        icon: '🎬',
        tags: ['애니메이션', 'UI', '인터랙션'],
      },
      {
        name: 'Supabase',
        category: 'database',
        importance: 'critical',
        description: 'PostgreSQL 기반 BaaS 플랫폼',
        version: '2.0',
        status: 'active',
        icon: '🗄️',
        tags: ['데이터베이스', 'BaaS', 'PostgreSQL'],
      },
      {
        name: 'Redis',
        category: 'database',
        importance: 'high',
        description: '인메모리 데이터 구조 저장소',
        version: '7.0',
        status: 'active',
        icon: '🔴',
        tags: ['캐시', '인메모리', '성능'],
      },
      {
        name: 'Vercel',
        category: 'deployment',
        importance: 'critical',
        description: 'Next.js 최적화 배포 플랫폼',
        status: 'active',
        icon: '▲',
        tags: ['배포', '서버리스', 'CDN'],
      },
      {
        name: 'Render',
        category: 'deployment',
        importance: 'medium',
        description: 'MCP 서버 호스팅 플랫폼',
        status: 'active',
        icon: '🚀',
        tags: ['호스팅', 'MCP', '백엔드'],
      },
      {
        name: 'Zustand',
        category: 'framework',
        importance: 'medium',
        description: '경량 상태 관리 라이브러리',
        version: '4.5',
        status: 'active',
        icon: '🐻',
        tags: ['상태관리', '경량', 'React'],
      },
    ],
    'cursor-ai': [
      {
        name: 'Cursor AI',
        category: 'custom',
        importance: 'critical',
        description: 'AI 기반 코드 에디터 (바이브 코딩 핵심)',
        version: '0.42',
        status: 'active',
        icon: '🎯',
        tags: ['IDE', 'AI', '개발도구'],
      },
      {
        name: 'Claude Sonnet 4.0',
        category: 'ai',
        importance: 'critical',
        description: 'Anthropic의 최신 AI 모델',
        version: '4.0',
        status: 'active',
        icon: '🤖',
        tags: ['AI', '외부API', '언어모델'],
      },
      {
        name: 'MCP 개발 프로토콜',
        category: 'custom',
        importance: 'critical',
        description: 'Cursor AI와 직접 연동되는 개발용 MCP',
        version: '1.0',
        status: 'active',
        icon: '🔧',
        tags: ['MCP', '개발도구', '프로토콜'],
      },
      {
        name: 'GitHub Actions',
        category: 'deployment',
        importance: 'high',
        description: 'CI/CD 자동화 및 배포 파이프라인',
        status: 'active',
        icon: '⚙️',
        tags: ['CI/CD', '자동화', '배포'],
      },
      {
        name: 'Storybook',
        category: 'ui',
        importance: 'medium',
        description: 'UI 컴포넌트 개발 도구',
        version: '8.0',
        status: 'active',
        icon: '📖',
        tags: ['UI', '컴포넌트', '테스트'],
      },
      {
        name: 'Vitest',
        category: 'framework',
        importance: 'medium',
        description: '빠른 단위 테스트 프레임워크',
        version: '2.0',
        status: 'active',
        icon: '🧪',
        tags: ['테스트', '단위테스트', 'Vite'],
      },
    ],
  };

  return techStacks[cardId] || [];
};

// 중요도별 스타일 정의
const getImportanceStyle = (importance: ImportanceLevel) => {
  const styles = {
    critical: {
      bg: 'border-red-500/30 bg-red-500/5',
      badge: 'bg-red-500/20 text-red-300 border border-red-500/30',
      label: '필수',
    },
    high: {
      bg: 'border-orange-500/30 bg-orange-500/5',
      badge: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
      label: '중요',
    },
    medium: {
      bg: 'border-blue-500/30 bg-blue-500/5',
      badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      label: '보통',
    },
    low: {
      bg: 'border-gray-500/30 bg-gray-500/5',
      badge: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
      label: '기타',
    },
  };
  return styles[importance];
};

// 카테고리별 스타일 정의
const getCategoryStyle = (category: TechCategory) => {
  const styles = {
    framework: { bg: 'bg-purple-500/20', color: 'text-purple-300' },
    language: { bg: 'bg-blue-500/20', color: 'text-blue-300' },
    database: { bg: 'bg-green-500/20', color: 'text-green-300' },
    ai: { bg: 'bg-pink-500/20', color: 'text-pink-300' },
    opensource: { bg: 'bg-yellow-500/20', color: 'text-yellow-300' },
    custom: { bg: 'bg-indigo-500/20', color: 'text-indigo-300' },
    deployment: { bg: 'bg-orange-500/20', color: 'text-orange-300' },
    ui: { bg: 'bg-cyan-500/20', color: 'text-cyan-300' },
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
        data-modal-version='v2.0-unified-scroll'
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
          className='relative w-full max-w-6xl max-h-[95vh] bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-3xl border border-gray-600/50 shadow-2xl overflow-hidden'
          onClick={e => e.stopPropagation()}
          data-modal-content='unified-scroll-v2'
        >
          {/* 최적화된 헤더 - 중복 제거 */}
          <div className='relative flex items-center justify-between p-4 sm:p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50'>
            <div className='flex items-center gap-3 sm:gap-4'>
              {/* 아이콘 컨테이너 숨김 처리 */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                className='hidden'
              >
                {renderIcon(selectedCard.icon)}
              </motion.div>
              <div className='flex-1 min-w-0'>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className='text-lg sm:text-xl font-bold text-white truncate'
                >
                  {renderTextWithAIGradient(selectedCard.title)}
                </motion.h2>
                {/* 카테고리 표시만 유지 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className='flex items-center gap-2 mt-1'
                >
                  <span className='px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium'>
                    상세 정보
                  </span>
                  {selectedCard.requiresAI && (
                    <span className='px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium'>
                      AI 기능
                    </span>
                  )}
                </motion.div>
              </div>
            </div>
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              onClick={onClose}
              className='p-2 hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:scale-105 group'
            >
              <X className='w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white transition-colors' />
            </motion.button>
          </div>

          {/* 통합된 스크롤 컨텐츠 - 최적화 */}
          <div
            className='overflow-y-auto'
            style={{ maxHeight: 'calc(95vh - 120px)' }}
          >
            <div className='p-4 sm:p-5 space-y-6'>
              {/* 개요 섹션 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className='space-y-6'
              >
                {/* 상세 정보 섹션 - 최적화 */}
                <div className='bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-5 border border-gray-700/30'>
                  <h3 className='text-lg font-semibold text-white mb-3'>
                    시스템 개요
                  </h3>
                  <p className='text-gray-300 leading-relaxed text-sm'>
                    {selectedCard.longDescription || selectedCard.description}
                  </p>
                </div>

                {/* 주요 특징 섹션 - 최적화 */}
                <div className='bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-5 border border-gray-700/30'>
                  <h4 className='text-lg font-semibold text-white mb-3'>
                    핵심 기능
                  </h4>
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
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
                            <div className='w-2 h-2 bg-green-400 rounded-full flex-shrink-0 mt-2'></div>
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
                        <div className='w-2 h-2 bg-green-400 rounded-full mt-2'></div>
                        <span className='text-gray-300 text-sm'>
                          실제 구현된 기능 기반
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* 기술 스택 섹션 */}
              {techStack.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className='space-y-8'
                >
                  <div className='mb-6'>
                    <h3 className='text-xl sm:text-2xl font-bold text-white'>
                      기술 스택 ({techStack.length})
                    </h3>
                  </div>

                  {/* 필수 기술 */}
                  {criticalTech.length > 0 && (
                    <div>
                      <h4 className='text-lg sm:text-xl font-semibold text-red-300 mb-4 sm:mb-6'>
                        필수 기술 ({criticalTech.length})
                      </h4>
                      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'>
                        {criticalTech.map((tech, index) => (
                          <TechCard key={tech.name} tech={tech} index={index} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 중요 기술 */}
                  {highTech.length > 0 && (
                    <div>
                      <h4 className='text-lg sm:text-xl font-semibold text-orange-300 mb-4 sm:mb-6'>
                        중요 기술 ({highTech.length})
                      </h4>
                      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'>
                        {highTech.map((tech, index) => (
                          <TechCard key={tech.name} tech={tech} index={index} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 보통 기술 */}
                  {mediumTech.length > 0 && (
                    <div>
                      <h4 className='text-lg sm:text-xl font-semibold text-blue-300 mb-4 sm:mb-6'>
                        보통 기술 ({mediumTech.length})
                      </h4>
                      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'>
                        {mediumTech.map((tech, index) => (
                          <TechCard key={tech.name} tech={tech} index={index} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 낮은 우선순위 기술 */}
                  {lowTech.length > 0 && (
                    <div>
                      <h4 className='text-lg sm:text-xl font-semibold text-gray-300 mb-4 sm:mb-6'>
                        기타 기술 ({lowTech.length})
                      </h4>
                      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'>
                        {lowTech.map((tech, index) => (
                          <TechCard key={tech.name} tech={tech} index={index} />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
