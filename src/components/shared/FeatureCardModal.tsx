'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Package, X } from 'lucide-react';
import React, { useEffect } from 'react';

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

// 현재 사용 기술 스택 (2025년 7월 실제 구현 기준)
const getCurrentTechStack = (cardId: string): TechItem[] => {
  const techStacks: { [key: string]: TechItem[] } = {
    'mcp-ai-engine': [
      {
        name: 'UnifiedAIEngineRouter v3.3.0',
        category: 'ai',
        importance: 'critical',
        description: '2모드 전용 AI 라우터 시스템 (LOCAL/GOOGLE_ONLY)',
        version: '3.3.0',
        status: 'active',
        icon: '🧠',
        tags: ['AI', 'Router', '2모드'],
      },
      {
        name: 'Google AI Studio (Gemini)',
        category: 'ai',
        importance: 'critical',
        description: 'Gemini 1.5 Pro 기반 GOOGLE_ONLY 모드 핵심 엔진',
        status: 'active',
        icon: '🔄',
        tags: ['AI', 'Gemini', 'Production'],
      },
      {
        name: 'MCP Context Collector',
        category: 'ai',
        importance: 'high',
        description: 'Model Context Protocol 기반 실시간 컨텍스트 수집',
        status: 'active',
        icon: '📡',
        tags: ['MCP', 'Context', 'Real-time'],
      },
      {
        name: 'Supabase Vector DB',
        category: 'database',
        importance: 'high',
        description: 'pgvector 확장을 통한 AI 임베딩 벡터 저장소',
        status: 'active',
        icon: '🔍',
        tags: ['Vector', 'PostgreSQL', 'Supabase'],
      },
      {
        name: 'OptimizedKoreanNLP',
        category: 'language',
        importance: 'medium',
        description: '5단계 병렬 처리 한국어 자연어 처리 엔진',
        status: 'active',
        icon: '🇰🇷',
        tags: ['Korean', 'NLP', 'Parallel'],
      },
      {
        name: 'Render Deployment',
        category: 'deployment',
        importance: 'medium',
        description: 'MCP 서버 전용 클라우드 배포 환경',
        status: 'active',
        icon: '🚀',
        tags: ['Cloud', 'MCP', 'Render'],
      },
    ],
    'fullstack-ecosystem': [
      {
        name: 'Next.js 15.3.2',
        category: 'framework',
        importance: 'critical',
        description: 'React 메타프레임워크 - 94개 페이지 성공적 빌드',
        version: '15.3.2',
        status: 'active',
        icon: '⚡',
        tags: ['Framework', 'React', 'Production'],
      },
      {
        name: 'Vercel Edge Runtime',
        category: 'deployment',
        importance: 'critical',
        description: '서버리스 엣지 컴퓨팅 - 웹앱 메인 배포 환경',
        status: 'active',
        icon: '🌐',
        tags: ['Serverless', 'Edge', 'Global'],
      },
      {
        name: 'Supabase PostgreSQL',
        category: 'database',
        importance: 'high',
        description: '실시간 PostgreSQL DB + Auth + Vector 통합',
        status: 'active',
        icon: '🗃️',
        tags: ['PostgreSQL', 'Real-time', 'Vector'],
      },
      {
        name: 'Upstash Redis',
        category: 'database',
        importance: 'high',
        description: '서버리스 Redis 캐싱 - AI 응답 최적화',
        status: 'active',
        icon: '⚡',
        tags: ['Redis', 'Serverless', 'Cache'],
      },
      {
        name: 'Faker.js',
        category: 'opensource',
        importance: 'medium',
        description: '현실적 서버 메트릭 시뮬레이션 데이터 생성',
        status: 'active',
        icon: '🎲',
        tags: ['Mock', 'Testing', 'Simulation'],
      },
      {
        name: 'TypeScript 100%',
        category: 'language',
        importance: 'medium',
        description: '0개 타입 오류 달성 - 완전한 타입 안전성',
        status: 'active',
        icon: '📘',
        tags: ['Type Safety', 'Quality', 'Zero Errors'],
      },
    ],
    'tech-stack': [
      {
        name: 'React 19.1.0',
        category: 'framework',
        importance: 'critical',
        description: '최신 React - 서버 컴포넌트 완전 활용',
        version: '19.1.0',
        status: 'active',
        icon: '⚛️',
        tags: ['React', 'Server Components', 'Latest'],
      },
      {
        name: 'TailwindCSS 3.4',
        category: 'ui',
        importance: 'critical',
        description: '유틸리티 CSS - 모든 페이지 완전 스타일링',
        version: '3.4',
        status: 'active',
        icon: '🎨',
        tags: ['CSS', 'Utility', 'Responsive'],
      },
      {
        name: 'Framer Motion',
        category: 'ui',
        importance: 'high',
        description: 'React 애니메이션 라이브러리 - 60FPS 보장',
        status: 'active',
        icon: '🎭',
        tags: ['Animation', '60FPS', 'Smooth'],
      },
      {
        name: 'Zustand',
        category: 'framework',
        importance: 'high',
        description: '경량 상태관리 - 전역 상태 완벽 제어',
        status: 'active',
        icon: '🐻',
        tags: ['State', 'Lightweight', 'Global'],
      },
      {
        name: 'Vitest + Playwright',
        category: 'opensource',
        importance: 'medium',
        description: '482개 테스트 100% 통과 - 완전한 테스트 커버리지',
        status: 'active',
        icon: '🧪',
        tags: ['Testing', '100%', 'E2E'],
      },
      {
        name: 'Chart.js + Recharts',
        category: 'ui',
        importance: 'medium',
        description: '반응형 대시보드 차트 - 실시간 데이터 시각화',
        status: 'active',
        icon: '📊',
        tags: ['Chart', 'Dashboard', 'Visualization'],
      },
    ],
    'cursor-ai': [
      {
        name: 'Cursor AI IDE',
        category: 'custom',
        importance: 'critical',
        description: 'AI 페어 프로그래밍 IDE - 20일간 200,081줄 코딩',
        status: 'active',
        icon: '🎯',
        tags: ['IDE', 'AI Coding', 'Productivity'],
      },
      {
        name: 'Claude Sonnet 3.7.2',
        category: 'ai',
        importance: 'critical',
        description: 'Anthropic 최신 모델 - A등급 코드 품질 달성',
        version: '3.7.2',
        status: 'active',
        icon: '🤖',
        tags: ['AI', 'Code Quality', 'A-Grade'],
      },
      {
        name: 'MCP Protocol',
        category: 'custom',
        importance: 'high',
        description: 'Model Context Protocol - filesystem, github 도구 활용',
        status: 'active',
        icon: '🔧',
        tags: ['MCP', 'Filesystem', 'GitHub'],
      },
      {
        name: 'TDD Methodology',
        category: 'framework',
        importance: 'high',
        description: '테스트 주도 개발 - 482개 테스트 100% 통과',
        status: 'active',
        icon: '🧪',
        tags: ['TDD', '482 Tests', '100%'],
      },
      {
        name: 'GitHub Automation',
        category: 'deployment',
        importance: 'medium',
        description: '커밋, PR, 빌드, 배포 완전 자동화',
        status: 'active',
        icon: '⚙️',
        tags: ['Automation', 'CI/CD', 'GitHub'],
      },
      {
        name: 'AI Pair Programming',
        category: 'custom',
        importance: 'medium',
        description: '30분 개발 + 5분 AI 검토 사이클',
        status: 'active',
        icon: '👥',
        tags: ['Pair Programming', 'Cycle', 'Review'],
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
      className={`group relative p-3 rounded-xl border ${importanceStyle.bg} hover:scale-[1.01] transition-all duration-300 hover:shadow-md hover:shadow-blue-500/10 cursor-pointer overflow-hidden`}
    >
      {/* 배경 그라데이션 효과 */}
      <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

      {/* 헤더 섹션 */}
      <div className='relative flex items-start justify-between mb-3'>
        <div className='flex items-center gap-2 flex-1 min-w-0'>
          {/* 개선된 아이콘 컨테이너 */}
          <div className='w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300'>
            {renderIcon(tech.icon)}
          </div>
          <div className='flex-1 min-w-0'>
            <h4 className='font-semibold text-white text-sm truncate group-hover:text-blue-300 transition-colors'>
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
        <div className='flex flex-col gap-1 items-end flex-shrink-0'>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${importanceStyle.badge} shadow-sm`}
          >
            {importanceStyle.label}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.color} shadow-sm`}
          >
            {tech.category}
          </span>
        </div>
      </div>

      {/* 설명 섹션 */}
      <div className='relative mb-2'>
        <p className='text-gray-300 text-xs leading-relaxed line-clamp-2 group-hover:text-gray-200 transition-colors'>
          {tech.description}
        </p>
      </div>

      {/* 상태 표시 */}
      <div className='relative flex items-center justify-between mb-2'>
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
          className='relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl border border-gray-600/50 shadow-2xl overflow-hidden'
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
            style={{ maxHeight: 'calc(90vh - 100px)' }}
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
                  className='space-y-5'
                >
                  <div className='mb-4'>
                    <h3 className='text-xl font-bold text-white'>
                      기술 스택 ({techStack.length})
                    </h3>
                  </div>

                  {/* 필수 기술 */}
                  {criticalTech.length > 0 && (
                    <div>
                      <h4 className='text-lg font-semibold text-red-300 mb-3'>
                        필수 기술 ({criticalTech.length})
                      </h4>
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
                        {criticalTech.map((tech, index) => (
                          <TechCard key={tech.name} tech={tech} index={index} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 중요 기술 */}
                  {highTech.length > 0 && (
                    <div>
                      <h4 className='text-lg font-semibold text-orange-300 mb-3'>
                        중요 기술 ({highTech.length})
                      </h4>
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
                        {highTech.map((tech, index) => (
                          <TechCard key={tech.name} tech={tech} index={index} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 보통 기술 */}
                  {mediumTech.length > 0 && (
                    <div>
                      <h4 className='text-lg font-semibold text-blue-300 mb-3'>
                        보통 기술 ({mediumTech.length})
                      </h4>
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
                        {mediumTech.map((tech, index) => (
                          <TechCard key={tech.name} tech={tech} index={index} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 낮은 우선순위 기술 */}
                  {lowTech.length > 0 && (
                    <div>
                      <h4 className='text-lg font-semibold text-gray-300 mb-3'>
                        기타 기술 ({lowTech.length})
                      </h4>
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
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
