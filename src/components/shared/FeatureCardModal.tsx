'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  BrainCircuit,
  Component,
  Database,
  Dna,
  Fingerprint,
  GitMerge,
  Globe,
  Layout,
  Package,
  Palette,
  Play,
  Rabbit,
  RefreshCw,
  Rocket,
  Search,
  Shapes,
  Share2,
  Shield,
  Shuffle,
  Sparkles,
  TestTube2,
  ToggleRight,
  Users,
  X,
  Zap,
} from 'lucide-react';
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
        icon: 'Shuffle',
        tags: ['AI', 'Router', '2모드'],
      },
      {
        name: 'Google AI Studio (Gemini)',
        category: 'ai',
        importance: 'critical',
        description: 'Gemini 1.5 Pro 기반 GOOGLE_ONLY 모드 핵심 엔진',
        status: 'active',
        icon: 'Sparkles',
        tags: ['AI', 'Gemini', 'Production'],
      },
      {
        name: 'MCP Context Collector',
        category: 'ai',
        importance: 'high',
        description: 'Model Context Protocol 기반 실시간 컨텍스트 수집',
        status: 'active',
        icon: 'Share2',
        tags: ['MCP', 'Context', 'Real-time'],
      },
      {
        name: 'Supabase Vector DB',
        category: 'database',
        importance: 'high',
        description: 'pgvector 확장을 통한 AI 임베딩 벡터 저장소',
        status: 'active',
        icon: 'Search',
        tags: ['Vector', 'PostgreSQL', 'Supabase'],
      },
      {
        name: 'OptimizedKoreanNLP',
        category: 'language',
        importance: 'medium',
        description: '5단계 병렬 처리 한국어 자연어 처리 엔진',
        status: 'active',
        icon: 'BrainCircuit',
        tags: ['Korean', 'NLP', 'Parallel'],
      },
      {
        name: 'Render Deployment',
        category: 'deployment',
        importance: 'medium',
        description: 'MCP 서버 전용 클라우드 배포 환경',
        status: 'active',
        icon: 'Rocket',
        tags: ['Cloud', 'MCP', 'GCP'],
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
        icon: 'Component',
        tags: ['Framework', 'React', 'Production'],
      },
      {
        name: 'Vercel Edge Runtime',
        category: 'deployment',
        importance: 'critical',
        description: '서버리스 엣지 컴퓨팅 - 웹앱 메인 배포 환경',
        status: 'active',
        icon: 'Globe',
        tags: ['Serverless', 'Edge', 'Global'],
      },
      {
        name: 'Supabase PostgreSQL',
        category: 'database',
        importance: 'high',
        description: '실시간 PostgreSQL DB + Auth + Vector 통합',
        status: 'active',
        icon: 'Database',
        tags: ['PostgreSQL', 'Real-time', 'Vector'],
      },
      {
        name: 'Upstash Redis',
        category: 'database',
        importance: 'high',
        description: '서버리스 Redis 캐싱 - AI 응답 최적화',
        status: 'active',
        icon: 'Rabbit',
        tags: ['Redis', 'Serverless', 'Cache'],
      },
      {
        name: 'Faker.js',
        category: 'opensource',
        importance: 'medium',
        description: '현실적 서버 메트릭 시뮬레이션 데이터 생성',
        status: 'active',
        icon: 'Play',
        tags: ['Mock', 'Testing', 'Simulation'],
      },
      {
        name: 'TypeScript 100%',
        category: 'language',
        importance: 'medium',
        description: '0개 타입 오류 달성 - 완전한 타입 안전성',
        status: 'active',
        icon: 'Shield',
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
        icon: 'Shapes',
        tags: ['React', 'Server Components', 'Latest'],
      },
      {
        name: 'TailwindCSS 3.4',
        category: 'ui',
        importance: 'critical',
        description: '유틸리티 CSS - 모든 페이지 완전 스타일링',
        version: '3.4',
        status: 'active',
        icon: 'Palette',
        tags: ['CSS', 'Utility', 'Responsive'],
      },
      {
        name: 'Framer Motion',
        category: 'ui',
        importance: 'high',
        description: 'React 애니메이션 라이브러리 - 60FPS 보장',
        status: 'active',
        icon: 'Zap',
        tags: ['Animation', '60FPS', 'Smooth'],
      },
      {
        name: 'Zustand',
        category: 'framework',
        importance: 'high',
        description: '경량 상태관리 - 전역 상태 완벽 제어',
        status: 'active',
        icon: 'Package',
        tags: ['State', 'Lightweight', 'Global'],
      },
      {
        name: 'Vitest + Playwright',
        category: 'opensource',
        importance: 'medium',
        description: '482개 테스트 100% 통과 - 완전한 테스트 커버리지',
        status: 'active',
        icon: 'TestTube2',
        tags: ['Testing', '100%', 'E2E'],
      },
      {
        name: 'Chart.js + Recharts',
        category: 'ui',
        importance: 'medium',
        description: '반응형 대시보드 차트 - 실시간 데이터 시각화',
        status: 'active',
        icon: 'Layout',
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
        icon: 'Fingerprint',
        tags: ['IDE', 'AI Coding', 'Productivity'],
      },
      {
        name: 'Claude Sonnet 3.7.2',
        category: 'ai',
        importance: 'critical',
        description: 'Anthropic 최신 모델 - A등급 코드 품질 달성',
        version: '3.7.2',
        status: 'active',
        icon: 'Dna',
        tags: ['AI', 'Code Quality', 'A-Grade'],
      },
      {
        name: 'MCP Protocol',
        category: 'custom',
        importance: 'high',
        description: 'Model Context Protocol - filesystem, github 도구 활용',
        status: 'active',
        icon: 'GitMerge',
        tags: ['MCP', 'Filesystem', 'GitHub'],
      },
      {
        name: 'TDD Methodology',
        category: 'framework',
        importance: 'high',
        description: '테스트 주도 개발 - 482개 테스트 100% 통과',
        status: 'active',
        icon: 'RefreshCw',
        tags: ['TDD', '482 Tests', '100%'],
      },
      {
        name: 'GitHub Automation',
        category: 'deployment',
        importance: 'medium',
        description: '커밋, PR, 빌드, 배포 완전 자동화',
        status: 'active',
        icon: 'ToggleRight',
        tags: ['Automation', 'CI/CD', 'GitHub'],
      },
      {
        name: 'AI Pair Programming',
        category: 'custom',
        importance: 'medium',
        description: '30분 개발 + 5분 AI 검토 사이클',
        status: 'active',
        icon: 'Users',
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
      border: 'border-red-500/30',
    },
    high: {
      bg: 'border-orange-500/30 bg-orange-500/5',
      badge: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
      label: '중요',
      border: 'border-orange-500/30',
    },
    medium: {
      bg: 'border-blue-500/30 bg-blue-500/5',
      badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      label: '보통',
      border: 'border-blue-500/30',
    },
    low: {
      bg: 'border-gray-500/30 bg-gray-500/5',
      badge: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
      label: '기타',
      border: 'border-gray-500/30',
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
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
      className={`group relative p-4 rounded-xl border-t-4 ${importanceStyle.border} bg-gray-800/50 hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer overflow-hidden`}
    >
      <div
        className={`absolute top-0 left-0 h-1 w-full ${importanceStyle.bg} opacity-30 group-hover:opacity-60 transition-opacity duration-300`}
      />
      {/* 헤더 섹션 */}
      <div className='relative flex items-center justify-between mb-3'>
        <div className='flex items-center gap-3 flex-1 min-w-0'>
          {/* 개선된 아이콘 컨테이너 */}
          <div
            className={`w-10 h-10 ${importanceStyle.bg} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md`}
          >
            {renderIcon(tech.icon)}
          </div>
          <div className='flex-1 min-w-0'>
            <h4 className='font-semibold text-white text-base group-hover:text-blue-300 transition-colors'>
              {tech.name}
            </h4>
            {tech.version && (
              <span className='text-xs text-gray-400 font-mono'>
                v{tech.version}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 설명 섹션 */}
      <div className='relative mb-3'>
        <p className='text-gray-300 text-sm leading-relaxed line-clamp-2 group-hover:text-gray-200 transition-colors'>
          {tech.description}
        </p>
      </div>

      {/* 태그 섹션 */}
      <div className='flex flex-wrap gap-2'>
        {tech.tags.slice(0, 3).map(tag => (
          <span
            key={tag}
            className='px-2 py-1 text-xs font-medium bg-gray-700/80 text-gray-300 rounded-full'
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

// icon 안전 렌더링 헬퍼
const renderIcon = (icon: any) => {
  if (React.isValidElement(icon)) {
    return icon;
  }
  if (typeof icon === 'function') {
    const IconComponent = icon;
    return <IconComponent className='w-5 h-5' />;
  }
  if (typeof icon === 'string') {
    const iconMap: { [key: string]: React.ElementType } = {
      Shuffle,
      BrainCircuit,
      Sparkles,
      Share2,
      Search,
      Rocket,
      Component,
      Globe,
      Database,
      Rabbit,
      Play,
      Shield,
      Shapes,
      Palette,
      Zap,
      Package,
      TestTube2,
      Layout,
      Fingerprint,
      Dna,
      GitMerge,
      RefreshCw,
      ToggleRight,
      Users,
    };
    const IconComponent = iconMap[icon];
    if (IconComponent) {
      return <IconComponent className='w-5 h-5' />;
    }
    return (
      <span className='text-xl' role='img'>
        {icon}
      </span>
    );
  }
  return <Package className='w-full h-full' />;
};

export default function FeatureCardModal({
  selectedCard,
  onClose,
  renderTextWithAIGradient,
  modalRef,
  variant = 'home',
  isDarkMode = true,
}: FeatureCardModalProps) {
  const [activeCategory, setActiveCategory] = React.useState<
    TechCategory | 'all'
  >('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!selectedCard) return null;

  const { title, icon: Icon, gradient, detailedContent } = selectedCard;
  const techStack = getCurrentTechStack(selectedCard.id);

  const filteredTechStack =
    activeCategory === 'all'
      ? techStack
      : techStack.filter(t => t.category === activeCategory);

  const criticalTech = filteredTechStack.filter(
    t => t.importance === 'critical'
  );
  const highTech = filteredTechStack.filter(t => t.importance === 'high');
  const mediumTech = filteredTechStack.filter(t => t.importance === 'medium');
  const lowTech = filteredTechStack.filter(t => t.importance === 'low');

  const allCategories: TechCategory[] = Array.from(
    new Set(techStack.map(t => t.category))
  );

  const mainContent = (
    <div className='p-4 sm:p-6 text-white'>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-x-8'>
        {/* 좌측 정보 패널 */}
        <div className='lg:col-span-1 mb-8 lg:mb-0'>
          <div className='lg:sticky lg:top-6'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className='text-2xl sm:text-3xl font-bold mb-2'>{title}</h3>
              <p className='text-gray-300 mb-6'>{detailedContent.overview}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h4 className='text-lg sm:text-xl font-semibold text-white mb-4'>
                주요 기능
              </h4>
              <ul className='space-y-3'>
                {detailedContent.features.map((feature: string, i: number) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    className='flex items-start gap-3'
                  >
                    <div className='w-4 h-4 mt-1 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0'>
                      <div className='w-2 h-2 bg-blue-400 rounded-full'></div>
                    </div>
                    <span className='text-gray-300 text-sm sm:text-base'>
                      {feature}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* 우측 기술 스택 */}
        <div className='lg:col-span-2'>
          {/* 기술 스택 섹션 */}
          {techStack.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='space-y-5'
            >
              <div>
                <h3 className='text-xl sm:text-2xl font-bold text-white mb-4'>
                  기술 스택 ({filteredTechStack.length})
                </h3>
                <div className='flex flex-wrap gap-2 mb-6'>
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      activeCategory === 'all'
                        ? 'bg-blue-500 text-white font-semibold'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    All ({techStack.length})
                  </button>
                  {allCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors capitalize ${
                        activeCategory === category
                          ? 'bg-blue-500 text-white font-semibold'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      {category} (
                      {techStack.filter(t => t.category === category).length})
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode='wait'>
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className='space-y-8'
                >
                  {/* 필수 기술 */}
                  {criticalTech.length > 0 && (
                    <div>
                      <h4 className='text-lg font-semibold text-red-300 mb-3'>
                        필수 기술 ({criticalTech.length})
                      </h4>
                      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3'>
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
                      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3'>
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
                      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3'>
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
                      <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3'>
                        {lowTech.map((tech, index) => (
                          <TechCard key={tech.name} tech={tech} index={index} />
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredTechStack.length === 0 &&
                    activeCategory !== 'all' && (
                      <div className='text-center py-10'>
                        <p className='text-gray-400'>
                          &apos;{activeCategory}&apos; 카테고리에는 기술이
                          없습니다.
                        </p>
                      </div>
                    )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );

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
          className='relative w-full max-w-5xl max-h-[90vh] bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl border border-gray-600/50 shadow-2xl overflow-hidden'
          onClick={e => e.stopPropagation()}
          data-modal-content='unified-scroll-v2'
        >
          <div
            className={`absolute top-0 left-0 right-0 h-48 bg-gradient-to-b ${gradient} opacity-20 blur-3xl`}
          ></div>
          <div className='relative z-10 flex flex-col h-full'>
            <header className='flex items-center justify-between p-4 border-b border-gray-700/50 flex-shrink-0'>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center'>
                  <Icon
                    className='w-5 h-5'
                    style={{
                      color: variant === 'home' ? 'white' : 'currentColor',
                    }}
                  />
                </div>
                <h2 className='text-lg font-semibold text-white'>{title}</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className='p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors'
                aria-label='Close modal'
              >
                <X size={20} />
              </motion.button>
            </header>
            <div
              className='overflow-y-auto'
              style={{ maxHeight: 'calc(90vh - 100px)' }}
            >
              {mainContent}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
